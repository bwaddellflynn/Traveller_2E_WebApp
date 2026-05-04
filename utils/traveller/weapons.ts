import coreWeaponsData from '~/data/traveller2e/weapons/core-weapons.json'
import cscWeaponsData from '~/data/traveller2e/weapons/central-supply-catalogue-weapons.json'
import fieldCatalogueDesignData from '~/data/traveller2e/weapons/field-catalogue-design.json'
import fieldWeaponsData from '~/data/traveller2e/weapons/field-catalogue-weapons.json'
import type { CustomWeaponDesign, TravellerWeaponRecord } from '~/types/weapon'

type FieldCatalogueComponent = {
  id: string
  name: string
  [key: string]: any
}

type FieldCatalogueComponentTables = {
  weaponTypes: FieldCatalogueComponent[]
  ammunitionTypes: FieldCatalogueComponent[]
  receivers: FieldCatalogueComponent[]
  mechanisms: FieldCatalogueComponent[]
  receiverFeatures: FieldCatalogueComponent[]
  barrels: FieldCatalogueComponent[]
  furniture: FieldCatalogueComponent[]
  feedDevices: FieldCatalogueComponent[]
  specialAmmunition: FieldCatalogueComponent[]
  accessories: FieldCatalogueComponent[]
}

export const weaponSources = {
  core: coreWeaponsData,
  centralSupplyCatalogue: cscWeaponsData,
  fieldCatalogue: fieldWeaponsData,
}

export const fieldCatalogueDesign = fieldCatalogueDesignData

const weaponSourcePriority: Record<string, number> = {
  'mgt2e-field-catalogue': 3,
  'mgt2e-csc': 2,
  'mgt2e-core-2022': 1,
  custom: 0,
}

const normalizeWeaponFamilyName = (name: string) => {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/\b(tl|tech level)\s*\d+\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const withWeaponSource = (weapons: Record<string, unknown>[], sourceId: string, sourceName: string) => {
  return weapons.map((weapon) => ({ ...weapon, sourceId, sourceName })) as TravellerWeaponRecord[]
}

export const allReferenceWeaponVariants = (): TravellerWeaponRecord[] => {
  return [
    ...withWeaponSource(coreWeaponsData.weapons, coreWeaponsData.sourceId, coreWeaponsData.sourceName),
    ...withWeaponSource(cscWeaponsData.weapons, cscWeaponsData.sourceId, cscWeaponsData.sourceName),
    ...withWeaponSource(fieldWeaponsData.weapons, fieldWeaponsData.sourceId, fieldWeaponsData.sourceName),
  ]
}

export const allReferenceWeapons = (): TravellerWeaponRecord[] => {
  const variants = allReferenceWeaponVariants()
  const highestPriorityByFamily = new Map<string, number>()

  for (const weapon of variants) {
    const family = normalizeWeaponFamilyName(weapon.name)
    const priority = weaponSourcePriority[weapon.sourceId] ?? 0
    highestPriorityByFamily.set(family, Math.max(highestPriorityByFamily.get(family) ?? 0, priority))
  }

  return variants.filter((weapon) => {
    const family = normalizeWeaponFamilyName(weapon.name)
    const priority = weaponSourcePriority[weapon.sourceId] ?? 0
    return priority === highestPriorityByFamily.get(family)
  })
}

export const makeWeaponId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `weapon-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export const createBlankCustomWeapon = (userId = 'local-user'): CustomWeaponDesign => {
  const now = new Date().toISOString()

  return {
    id: makeWeaponId(),
    userId,
    createdAt: now,
    updatedAt: now,
    name: 'Custom Weapon',
    sourceId: 'custom',
    sourceName: 'Custom',
    category: 'slug',
    scale: 'personal',
    skill: 'gun-combat',
    speciality: 'slug',
    techLevel: 8,
    range: '10m',
    damage: '3D',
    massKg: 1,
    costCredits: 200,
    magazine: '15',
    magazineCostCredits: 10,
    traits: [],
    tags: [],
    design: {
      rulesSource: 'mgt2e-field-catalogue',
      weaponType: '',
      mechanism: 'semi-automatic',
      receiverFeatures: [],
      receiverType: '',
      ammunitionType: '',
      specialAmmunition: '',
      capacityModifierPercent: 0,
      barrel: '',
      heavyBarrel: false,
      furniture: '',
      feedDevice: '',
      accessories: [],
      notes: '',
    },
  }
}

export const cloneWeapon = <T extends TravellerWeaponRecord | CustomWeaponDesign>(weapon: T): T => {
  if (typeof structuredClone === 'function') return structuredClone(weapon)
  return JSON.parse(JSON.stringify(weapon)) as T
}

const applyPercent = (value: number, percent = 0) => value * (1 + percent / 100)

const uniqueTraits = (traits: string[]) => Array.from(new Set(traits.filter(Boolean)))

const fullDamageDice = (damage: string) => Number(damage.match(/^(\d+)D/)?.[1] ?? 0)

const addDamagePerDie = (damage: string, perDieBonus: number) => {
  const match = damage.match(/^(\d+)D([+-]\d+)?$/)
  if (!match) return damage
  const dice = Number(match[1])
  const modifier = Number(match[2] ?? 0) + dice * perDieBonus
  if (modifier === 0) return `${dice}D`
  return `${dice}D${modifier > 0 ? '+' : ''}${modifier}`
}

const addDamageDice = (damage: string, diceBonus: number) => {
  const match = damage.match(/^(\d+)D([+-]\d+)?$/)
  if (!match) return damage
  const dice = Number(match[1]) + diceBonus
  return `${dice}D${match[2] ?? ''}`
}

const reduceDamageDice = (damage: string, dicePenalty: number) => {
  const match = damage.match(/^(\d+)D([+-]\d+)?$/)
  if (!match) return damage
  let dice = Number(match[1])
  let suffix = match[2] ?? ''
  for (let step = 0; step < dicePenalty; step += 1) {
    if (dice > 1) {
      dice -= 1
      continue
    }
    if (`${dice}D${suffix}` === '1D') return 'D3'
    return '1'
  }
  return `${dice}D${suffix}`
}

const reduceDamageToD3s = (damage: string) => {
  const match = damage.match(/^(\d+)D([+-]\d+)?$/)
  if (!match) return damage
  const dice = Number(match[1])
  const modifier = match[2] ?? ''
  return `${dice}D3${modifier}`
}

const penetrationTrait = (penetration: number) => {
  if (penetration > 0) return `AP ${penetration}`
  if (penetration < 0) return `Lo-Pen ${Math.abs(penetration)}`
  return ''
}

const traitRating = (traits: string[], name: string) => {
  const trait = traits.find((item) => item.toLowerCase().startsWith(name.toLowerCase()))
  if (!trait) return 0
  return Number(trait.match(/-?\d+/)?.[0] ?? 0)
}

const receiverOrder = ['handgun', 'assault', 'longarm', 'light-support', 'heavy']

export const calculateFieldCatalogueWeapon = (weapon: CustomWeaponDesign) => {
  const tables = fieldCatalogueDesignData.componentTables as FieldCatalogueComponentTables
  const receiver = tables.receivers.find((item) => item.id === weapon.design.receiverType)
  const ammunition = tables.ammunitionTypes.find((item) => item.id === weapon.design.ammunitionType)
  const mechanism = tables.mechanisms.find((item) => item.id === weapon.design.mechanism)
  const receiverFeatures = (weapon.design.receiverFeatures ?? [])
    .map((id) => tables.receiverFeatures.find((item) => item.id === id))
    .filter(Boolean)
  const barrel = tables.barrels.find((item) => item.id === weapon.design.barrel)
  const furniture = tables.furniture.find((item) => item.id === weapon.design.furniture)
  const feedDevice = tables.feedDevices.find((item) => item.id === weapon.design.feedDevice)
  const specialAmmunition = tables.specialAmmunition.find((item) => item.id === weapon.design.specialAmmunition)
  const accessories = weapon.design.accessories
    .map((id) => tables.accessories.find((item) => item.id === id))
    .filter(Boolean)
  const warnings: string[] = []
  const weaponType = tables.weaponTypes.find((item) => item.id === weapon.design.weaponType)

  if (weapon.design.weaponType && weapon.design.weaponType !== 'projectile') {
    warnings.push(`${weaponType?.name ?? weapon.design.weaponType} designs are not mechanically implemented yet; use manual fields for now.`)
  }

  if (!receiver || !ammunition) {
    return {
      ready: false,
      missing: [
        !receiver ? 'receiver' : '',
        !ammunition ? 'ammunition' : '',
      ].filter(Boolean),
      costCredits: weapon.costCredits ?? 0,
      massKg: weapon.massKg ?? 0,
      range: weapon.range,
      damage: weapon.damage,
      magazine: weapon.magazine,
      quickdraw: null as number | null,
      penetration: ammunition?.penetration ?? null,
      recoil: null as number | null,
      heat: null as number | null,
      magazineCostCredits: weapon.magazineCostCredits ?? 0,
      warnings,
      traits: uniqueTraits([...(weapon.traits ?? []), ...(ammunition?.traits ?? [])]),
      components: { receiver, ammunition, mechanism, receiverFeatures, barrel, furniture, feedDevice, specialAmmunition, accessories },
    }
  }

  let receiverCost = receiver.baseCostCredits
  let receiverWeight = receiver.baseWeightKg
  let capacity = receiver.baseCapacity
  let quickdraw = receiver.quickdraw
  let rangeMeters = ammunition.rangeMeters ?? 0
  let penetration = ammunition.penetration ?? 0
  let damage = ammunition.damage ?? weapon.damage
  let auto = mechanism?.auto ?? 0
  let heat: number | null = null
  const traits: string[] = [...(ammunition.traits ?? [])]

  receiverCost = applyPercent(receiverCost, ammunition.receiverCostModifierPercent ?? 0)
  receiverWeight = applyPercent(receiverWeight, ammunition.receiverWeightModifierPercent ?? 0)
  receiverCost *= ammunition.receiverCostMultiplier ?? 1
  receiverWeight *= ammunition.receiverWeightMultiplier ?? 1
  capacity = Math.max(1, Math.round(applyPercent(capacity, ammunition.capacityModifierPercent ?? 0)))

  if (mechanism) {
    if (mechanism.costMultiplierFormula === 'auto+2') {
      receiverCost *= (mechanism.auto ?? 0) + 2
    } else {
      receiverCost = applyPercent(receiverCost, mechanism.costModifierPercent ?? 0)
    }
    receiverWeight = applyPercent(receiverWeight, mechanism.weightModifierPercent ?? 0)
    capacity = Math.max(1, Math.round(applyPercent(capacity, mechanism.capacityModifierPercent ?? 0)))
    quickdraw += mechanism.quickdrawModifier ?? 0
    traits.push(...(mechanism.traits ?? []))
  }

  if (mechanism?.id === 'rapid-fire') {
    if (auto < 4) warnings.push('Rapid-Fire weapons require Auto 4+.')
    const bonusDice = Math.floor(fullDamageDice(damage) / 3)
    if (bonusDice > 0) damage = addDamageDice(damage, bonusDice)
  }

  if (mechanism?.id === 'very-rapid-fire') {
    if (auto < 6) warnings.push('Very Rapid-Fire weapons require Auto 6+.')
    const bonusDice = Math.floor(fullDamageDice(damage) / 2)
    if (bonusDice > 0) damage = addDamageDice(damage, bonusDice)
  }

  for (const feature of receiverFeatures) {
    receiverCost = applyPercent(receiverCost, feature.costModifierPercent ?? 0)
    receiverWeight = applyPercent(receiverWeight, feature.weightModifierPercent ?? 0)
    capacity = Math.max(1, Math.round(applyPercent(capacity, feature.capacityModifierPercent ?? 0)))
    rangeMeters = Math.max(1, Math.round(applyPercent(rangeMeters, feature.rangeModifierPercent ?? 0)))
    quickdraw += feature.quickdrawModifier ?? 0
    penetration += feature.penetrationModifier ?? 0
    traits.push(...(feature.traits ?? []))
  }

  const featureIds = receiverFeatures.map((feature) => feature.id)
  if (featureIds.includes('compact') && featureIds.includes('very-compact')) warnings.push('Compact and Very Compact cannot both be applied.')
  if (featureIds.includes('high-capacity') && (featureIds.includes('compact') || featureIds.includes('very-compact'))) warnings.push('High Capacity is not compatible with Compact or Very Compact.')
  if (featureIds.includes('bullpup') && weapon.design.furniture !== 'full-stock') warnings.push('Bullpup requires a full stock.')
  if (ammunition.minimumReceiver && receiverOrder.indexOf(receiver.id) < receiverOrder.indexOf(ammunition.minimumReceiver)) {
    warnings.push(`${ammunition.name} requires at least a ${tables.receivers.find((item) => item.id === ammunition.minimumReceiver)?.name ?? ammunition.minimumReceiver} receiver.`)
  }

  capacity = Math.max(1, Math.round(applyPercent(capacity, weapon.design.capacityModifierPercent ?? 0)))
  receiverCost = applyPercent(receiverCost, (weapon.design.capacityModifierPercent ?? 0) > 0 ? (weapon.design.capacityModifierPercent ?? 0) : (weapon.design.capacityModifierPercent ?? 0) / 2)
  receiverWeight = applyPercent(receiverWeight, (weapon.design.capacityModifierPercent ?? 0) / 2)

  let barrelCost = 0
  let barrelWeight = 0
  if (barrel) {
    const heavyBarrelMultiplier = weapon.design.heavyBarrel ? 2 : 1
    barrelCost = receiverCost * ((barrel.costPercentOfReceiver ?? 0) / 100) * heavyBarrelMultiplier
    barrelWeight = receiverWeight * ((barrel.weightPercentOfReceiver ?? 0) / 100) * heavyBarrelMultiplier
    rangeMeters = barrel.fixedRangeMeters ?? Math.max(1, Math.round(applyPercent(rangeMeters, barrel.rangeModifierPercent ?? 0)))
    quickdraw += barrel.quickdrawModifier ?? 0
    quickdraw += weapon.design.heavyBarrel ? -1 : 0
    penetration += barrel.penetrationModifier ?? 0
    if (barrel.highVelocityDamageDiceModifier && ['light-rifle', 'intermediate-rifle', 'battle-rifle', 'heavy-rifle', 'anti-materiel', 'heavy-anti-materiel'].includes(ammunition.id)) {
      damage = reduceDamageDice(damage, Math.abs(barrel.highVelocityDamageDiceModifier))
    }
    if (barrel.id === 'minimal') damage = reduceDamageToD3s(damage)
  }

  let furnitureCost = 0
  let furnitureWeight = 0
  if (furniture) {
    furnitureCost = receiverCost * ((furniture.costPercentOfReceiver ?? 0) / 100)
    furnitureWeight = receiverWeight * ((furniture.weightPercentOfReceiver ?? 0) / 100)
    quickdraw += furniture.quickdrawModifier ?? 0
  }

  if (feedDevice) {
    receiverCost = applyPercent(receiverCost, feedDevice.costModifierPercent ?? 0)
    receiverWeight = applyPercent(receiverWeight, feedDevice.weightModifierPercent ?? 0)
    capacity = Math.max(1, Math.round(capacity * (feedDevice.capacityMultiplier ?? 1)))
    quickdraw += feedDevice.quickdrawModifier ?? 0
    traits.push(...(feedDevice.traits ?? []))
  }

  if (specialAmmunition) {
    penetration += specialAmmunition.penetrationModifier ?? 0
    rangeMeters = specialAmmunition.fixedRangeMeters ?? Math.max(1, Math.round(applyPercent(rangeMeters, specialAmmunition.rangeModifierPercent ?? 0)))
    if (specialAmmunition.damageDiceModifier) damage = addDamageDice(damage, specialAmmunition.damageDiceModifier)
    if (specialAmmunition.damagePerDieModifier) damage = addDamagePerDie(damage, specialAmmunition.damagePerDieModifier)
    if (specialAmmunition.damageDiceDivisor === 'd3') damage = reduceDamageToD3s(damage)
    traits.push(...(specialAmmunition.traits ?? []))
  }

  let accessoryCost = 0
  let accessoryWeight = 0
  for (const accessory of accessories) {
    accessoryCost += accessory.costCredits ?? receiverCost * ((accessory.costPercentOfReceiver ?? 0) / 100)
    accessoryWeight += accessory.weightKg ?? receiverWeight * ((accessory.weightPercentOfReceiver ?? 0) / 100)
    rangeMeters = Math.max(1, Math.round(applyPercent(rangeMeters, accessory.rangeModifierPercent ?? 0)))
    quickdraw += accessory.quickdrawModifier ?? 0
    penetration += accessory.penetrationModifier ?? 0
    traits.push(...(accessory.traits ?? []))
  }

  const costCredits = Math.round(receiverCost + barrelCost + furnitureCost + accessoryCost)
  const massKg = Math.round((receiverWeight + barrelWeight + furnitureWeight + accessoryWeight) * 100) / 100
  const recoilCompensation = traitRating(traits, 'Recoil Compensation')
  const recoil = Math.max(0, fullDamageDice(damage) + (auto || 0) + (receiver.recoilModifier ?? 0) + (ammunition.recoilModifier ?? 0) - recoilCompensation)
  if (mechanism?.id === 'rapid-fire') heat = (auto || 0) + fullDamageDice(damage) * 2
  if (mechanism?.id === 'very-rapid-fire') heat = (auto || 0) + fullDamageDice(damage) * 3
  const finalPenetrationTrait = penetrationTrait(penetration)
  if (finalPenetrationTrait) traits.push(finalPenetrationTrait)
  const ammunitionCostCredits = (ammunition.costPer100Credits ?? 0) * capacity / 100 * (specialAmmunition?.costMultiplier ?? ammunition.costMultiplier ?? 1)
  const feedDeviceCostCredits = feedDevice?.id === 'fixed-magazine'
    ? 0
    : costCredits * ((feedDevice?.costPercentOfWeapon ?? 1) / 100) * (feedDevice?.costMultiplier ?? 1)
  const magazineCostCredits = Math.max(1, Math.round(feedDeviceCostCredits + ammunitionCostCredits))

  return {
    ready: true,
    missing: [],
    costCredits,
    massKg,
    range: `${rangeMeters}m`,
    damage,
    magazine: String(capacity),
    quickdraw,
    penetration,
    recoil,
    heat,
    magazineCostCredits,
    warnings,
    traits: uniqueTraits([...(weapon.traits ?? []), ...traits]),
    components: { receiver, ammunition, mechanism, receiverFeatures, barrel, furniture, feedDevice, specialAmmunition, accessories },
  }
}
