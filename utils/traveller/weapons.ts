import coreWeaponsData from '~/data/traveller2e/weapons/core-weapons.json'
import cscWeaponsData from '~/data/traveller2e/weapons/central-supply-catalogue-weapons.json'
import fieldCatalogueDesignData from '~/data/traveller2e/weapons/field-catalogue-design.json'
import fieldWeaponsData from '~/data/traveller2e/weapons/field-catalogue-weapons.json'
import type { CustomWeaponDesign, TravellerWeaponFamily, TravellerWeaponIconName, TravellerWeaponRecord } from '~/types/weapon'

type FieldCatalogueComponent = {
  id: string
  name: string
  [key: string]: any
}

type FieldCatalogueCompatibilityComponent = FieldCatalogueComponent & {
  techLevel?: number
  exclusiveGroup?: string
  requiresWeaponTypes?: string[]
  requiresReceiverTypes?: string[]
  requiresMechanisms?: string[]
  requiresFurniture?: string
  incompatibleWith?: string[]
  autoModifier?: number
  heatDissipationModifier?: number
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

type FieldCatalogueSelectableTableKey =
  | 'mechanisms'
  | 'receiverFeatures'
  | 'barrels'
  | 'furniture'
  | 'feedDevices'
  | 'specialAmmunition'
  | 'accessories'

type CompatibilityContext = {
  techLevel: number | null
  weaponType: string
  receiverType: string
  mechanism: string
  furniture: string
  selectedIds: string[]
  selectedByExclusiveGroup: Map<string, string[]>
}

type PenetrationOutcome = {
  damage: string
  trait: string
}

type HeatProfile = {
  generation: number
  dissipation: number
  thresholds: {
    overheat: number
    danger: number
    disaster: number
  }
}

type FieldCatalogueCalculationResult = {
  ready: boolean
  missing: string[]
  costCredits: number
  massKg: number
  range: string
  damage: string
  magazine: string
  quickdraw: number | null
  penetration: number | null
  recoil: number | null
  heat: number | null
  heatProfile?: HeatProfile | null
  magazineCostCredits: number
  warnings: string[]
  traits: string[]
  components: {
    receiver: FieldCatalogueComponent | undefined
    ammunition: FieldCatalogueComponent | undefined
    mechanism: FieldCatalogueComponent | undefined
    receiverFeatures: FieldCatalogueComponent[]
    barrel: FieldCatalogueComponent | undefined
    furniture: FieldCatalogueComponent | undefined
    feedDevice: FieldCatalogueComponent | undefined
    specialAmmunition: FieldCatalogueComponent | undefined
    accessories: FieldCatalogueComponent[]
  }
}

export const weaponSources = {
  core: coreWeaponsData,
  centralSupplyCatalogue: cscWeaponsData,
  fieldCatalogue: fieldWeaponsData,
}

export const fieldCatalogueDesign = fieldCatalogueDesignData

const receiverHeatProfiles: Record<string, HeatProfile['thresholds'] & { dissipation: number }> = {
  handgun: { dissipation: 2, overheat: 10, danger: 15, disaster: 20 },
  assault: { dissipation: 4, overheat: 15, danger: 30, disaster: 45 },
  longarm: { dissipation: 6, overheat: 20, danger: 40, disaster: 60 },
  'light-support': { dissipation: 8, overheat: 25, danger: 50, disaster: 75 },
  heavy: { dissipation: 10, overheat: 30, danger: 60, disaster: 90 },
}

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
    family: 'sidearm',
    iconName: 'weapon-sidearm',
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
      targetTechLevel: 8,
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
  return JSON.parse(JSON.stringify(weapon)) as T
}

export const resolveWeaponFamily = (weapon: Pick<TravellerWeaponRecord, 'category' | 'scale' | 'name'> & {
  skill?: string
  speciality?: string
  design?: Partial<CustomWeaponDesign['design']>
}) : TravellerWeaponFamily => {
  const category = weapon.category
  const weaponType = weapon.design?.weaponType ?? ''
  const receiverType = weapon.design?.receiverType ?? ''
  const ammunitionType = weapon.design?.ammunitionType ?? ''
  const furniture = weapon.design?.furniture ?? ''
  const mechanism = weapon.design?.mechanism ?? ''

  if (category === 'melee') return 'melee'
  if (category === 'explosive') return 'charge'
  if (category === 'grenade') return 'grenade'

  if (weaponType === 'grenade') {
    if (category === 'support' || category === 'heavy' || receiverType === 'light-support' || receiverType === 'heavy') {
      return 'launcher'
    }
    return category === 'explosive' ? 'charge' : 'grenade'
  }

  if (weaponType === 'energy' || category === 'energy') {
    if (receiverType === 'handgun') return 'energy-sidearm'
    if (receiverType === 'light-support' || receiverType === 'heavy' || category === 'heavy') return 'heavy'
    if (category === 'support') return 'support'
    return 'energy-longarm'
  }

  if (weaponType === 'projectile' || category === 'slug' || category === 'support' || category === 'heavy') {
    if (ammunitionType === 'rocket') return 'launcher'
    if (receiverType === 'heavy' || category === 'heavy' || furniture === 'support-mount') return 'heavy'
    if (receiverType === 'light-support' || category === 'support' || mechanism === 'rapid-fire' || mechanism === 'very-rapid-fire') return 'support'
    if (ammunitionType.includes('smoothbore')) return 'shotgun'
    if (receiverType === 'handgun') return 'sidearm'
    return 'longarm'
  }

  return 'longarm'
}

export const resolveWeaponFamilyIcon = (family: TravellerWeaponFamily): TravellerWeaponIconName => {
  switch (family) {
    case 'melee':
      return 'weapon-melee'
    case 'sidearm':
      return 'weapon-sidearm'
    case 'shotgun':
      return 'weapon-shotgun'
    case 'support':
      return 'weapon-support'
    case 'heavy':
      return 'weapon-heavy'
    case 'launcher':
      return 'weapon-launcher'
    case 'grenade':
      return 'weapon-grenade'
    case 'charge':
      return 'weapon-charge'
    case 'energy-sidearm':
      return 'weapon-energy-sidearm'
    case 'energy-longarm':
      return 'weapon-energy-longarm'
    case 'longarm':
    default:
      return 'weapon-longarm'
  }
}

export const resolveWeaponIconName = (weapon: Pick<TravellerWeaponRecord, 'category' | 'scale' | 'name'> & {
  skill?: string
  speciality?: string
  design?: Partial<CustomWeaponDesign['design']>
}): TravellerWeaponIconName => {
  const family = resolveWeaponFamily(weapon)
  const name = weapon.name.toLowerCase()
  const weaponType = weapon.design?.weaponType ?? ''
  const receiverType = weapon.design?.receiverType ?? ''
  const ammunitionType = weapon.design?.ammunitionType ?? ''
  const barrel = weapon.design?.barrel ?? ''
  const furniture = weapon.design?.furniture ?? ''
  const mechanism = weapon.design?.mechanism ?? ''
  const receiverFeatures = weapon.design?.receiverFeatures ?? []

  const isGauss = ammunitionType.includes('gauss')
  const isSmoothbore = ammunitionType.includes('smoothbore')
  const isRocket = ammunitionType === 'rocket'
  const isSniperProfile = (barrel === 'long' || barrel === 'very-long') && receiverFeatures.includes('accurised')
  const isAutomatic = ['burst-capable', 'fully-automatic', 'rapid-fire', 'very-rapid-fire'].includes(mechanism)
  const isSupportMount = furniture === 'support-mount'
  const isMine = name.includes('mine')
  const isFlamer = name.includes('flamer') || name.includes('flame')

  if (weapon.category === 'melee') return 'weapon-melee'
  if (isMine) return 'weapon-mine'
  if (isFlamer) return 'weapon-flamer'

  if (weaponType === 'grenade') {
    if (weapon.category === 'explosive') return 'weapon-charge'
    if (weapon.category === 'heavy' || isSupportMount || receiverType === 'light-support' || receiverType === 'heavy' || name.includes('launcher')) {
      return 'weapon-launcher-grenade'
    }
    return 'weapon-grenade'
  }

  if (weaponType === 'energy' || weapon.category === 'energy') {
    if (receiverType === 'handgun') return 'weapon-energy-sidearm'
    if (isSniperProfile) return 'weapon-energy-sniper'
    if (isSupportMount) return 'weapon-emplaced'
    if (receiverType === 'heavy') return 'weapon-heavy'
    if (receiverType === 'light-support') return 'weapon-support'
    return 'weapon-energy-longarm'
  }

  if (weaponType === 'projectile' || weapon.category === 'slug' || weapon.category === 'support' || weapon.category === 'heavy') {
    if (isRocket) return 'weapon-launcher'
    if (isSupportMount) return 'weapon-emplaced'
    if (isGauss) {
      if (receiverType === 'handgun') return 'weapon-gauss-sidearm'
      return 'weapon-gauss-longarm'
    }
    if (receiverType === 'handgun') {
      if (mechanism === 'repeater' || name.includes('revolver')) return 'weapon-revolver'
      return 'weapon-sidearm'
    }
    if (receiverType === 'assault' && isAutomatic && (furniture === 'stockless' || furniture === 'folding-stock')) {
      return 'weapon-smg'
    }
    if (isSmoothbore) return 'weapon-shotgun'
    if (receiverType === 'light-support') {
      if (mechanism === 'rapid-fire' || mechanism === 'very-rapid-fire' || receiverFeatures.includes('multi-barrel-2') || receiverFeatures.includes('multi-barrel-3')) {
        return 'weapon-chaingun'
      }
      return 'weapon-support'
    }
    if (receiverType === 'heavy') return 'weapon-heavy'
    if (isSniperProfile) return 'weapon-sniper'
    return 'weapon-longarm'
  }

  return resolveWeaponFamilyIcon(family)
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

const addFlatDamageModifier = (damage: string, flatModifier: number) => {
  const match = damage.match(/^(\d+)D(?:3)?([+-]\d+)?$/)
  if (!match) return damage
  const dice = match[1]
  const d3 = damage.includes('D3') ? 'D3' : 'D'
  const modifier = Number(match[2] ?? 0) + flatModifier
  if (modifier === 0) return `${dice}${d3}`
  return `${dice}${d3}${modifier > 0 ? '+' : ''}${modifier}`
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

const traitRating = (traits: string[], name: string) => {
  const trait = traits.find((item) => item.toLowerCase().startsWith(name.toLowerCase()))
  if (!trait) return 0
  return Number(trait.match(/-?\d+/)?.[0] ?? 0)
}

const selectedItemsByExclusiveGroup = (
  tables: FieldCatalogueComponentTables,
  selectedIds: string[],
) => {
  const groups = new Map<string, string[]>()

  for (const tableKey of ['receiverFeatures', 'accessories'] as const) {
    for (const id of selectedIds) {
      const item = (tables[tableKey] as FieldCatalogueCompatibilityComponent[]).find((entry) => entry.id === id)
      if (!item?.exclusiveGroup) continue
      groups.set(item.exclusiveGroup, [...(groups.get(item.exclusiveGroup) ?? []), item.id])
    }
  }

  return groups
}

const componentCompatibilityWarnings = (
  component: FieldCatalogueCompatibilityComponent | undefined,
  context: CompatibilityContext,
) => {
  if (!component) return []

  const warnings: string[] = []

  if (component.techLevel && context.techLevel !== null && component.techLevel > context.techLevel) {
    warnings.push(`${component.name} requires TL ${component.techLevel}+.`)
  }

  if (component.requiresWeaponTypes?.length && context.weaponType && !component.requiresWeaponTypes.includes(context.weaponType)) {
    warnings.push(`${component.name} is only valid for ${component.requiresWeaponTypes.join(', ')} weapon builds.`)
  }

  if (component.requiresReceiverTypes?.length && context.receiverType && !component.requiresReceiverTypes.includes(context.receiverType)) {
    warnings.push(`${component.name} requires ${component.requiresReceiverTypes.join(', ')} receivers.`)
  }

  if (component.requiresMechanisms?.length && context.mechanism && !component.requiresMechanisms.includes(context.mechanism)) {
    warnings.push(`${component.name} requires ${component.requiresMechanisms.join(', ')} operation.`)
  }

  if (component.requiresFurniture && context.furniture && component.requiresFurniture !== context.furniture) {
    warnings.push(`${component.name} requires ${component.requiresFurniture.replace(/-/g, ' ')} furniture.`)
  }

  if (component.incompatibleWith?.length) {
    const found = component.incompatibleWith.filter((id) => context.selectedIds.includes(id))
    if (found.length) warnings.push(`${component.name} is incompatible with ${found.join(', ')}.`)
  }

  if (component.exclusiveGroup) {
    const selectedInGroup = (context.selectedByExclusiveGroup.get(component.exclusiveGroup) ?? []).filter((id) => id !== component.id)
    if (selectedInGroup.length) warnings.push(`${component.name} cannot be combined with another ${component.exclusiveGroup.replace(/-/g, ' ')} option.`)
  }

  return warnings
}

const applyFinalPenetration = (damage: string, penetration: number): PenetrationOutcome => {
  const dice = fullDamageDice(damage)

  if (penetration <= -4) return { damage, trait: 'Lo-Pen 5' }
  if (penetration === -3) return { damage, trait: 'Lo-Pen 4' }
  if (penetration === -2) return { damage, trait: 'Lo-Pen 3' }
  if (penetration === -1) return { damage, trait: 'Lo-Pen 2' }
  if (penetration === 0) return { damage, trait: '' }
  if (penetration === 1) return { damage, trait: `AP ${dice}` }
  if (penetration === 2) return {
    damage: addFlatDamageModifier(damage, -Math.floor(dice / 2)),
    trait: `AP ${1 + dice}`,
  }
  if (penetration === 3) return {
    damage: addFlatDamageModifier(damage, -(2 * Math.floor(dice / 3))),
    trait: `AP ${3 + 3 * Math.floor(dice / 2)}`,
  }

  return {
    damage: addFlatDamageModifier(damage, -dice),
    trait: `AP ${5 + 2 * dice}`,
  }
}

export const getFieldCatalogueSelectionWarnings = (
  weapon: CustomWeaponDesign,
  tableKey: FieldCatalogueSelectableTableKey,
  itemId: string,
) => {
  const tables = fieldCatalogueDesignData.componentTables as FieldCatalogueComponentTables
  const component = (tables[tableKey] as FieldCatalogueCompatibilityComponent[]).find((item) => item.id === itemId)
  const selectedIds = [
    ...(weapon.design.receiverFeatures ?? []),
    ...(weapon.design.accessories ?? []),
  ]

  const context: CompatibilityContext = {
    techLevel: weapon.design.targetTechLevel ?? weapon.techLevel,
    weaponType: weapon.design.weaponType,
    receiverType: weapon.design.receiverType,
    mechanism: weapon.design.mechanism,
    furniture: weapon.design.furniture,
    selectedIds,
    selectedByExclusiveGroup: selectedItemsByExclusiveGroup(tables, selectedIds),
  }

  return componentCompatibilityWarnings(component, context)
}

const receiverOrder = ['handgun', 'assault', 'longarm', 'light-support', 'heavy']

export const calculateFieldCatalogueWeapon = (weapon: CustomWeaponDesign): FieldCatalogueCalculationResult => {
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
  let heatProfile: HeatProfile | null = null
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
    auto += feature.autoModifier ?? 0
    traits.push(...(feature.traits ?? []))
  }

  const selectedIds = [...(weapon.design.receiverFeatures ?? []), ...(weapon.design.accessories ?? [])]
  const compatibilityContext: CompatibilityContext = {
    techLevel: weapon.design.targetTechLevel ?? weapon.techLevel,
    weaponType: weapon.design.weaponType,
    receiverType: weapon.design.receiverType,
    mechanism: weapon.design.mechanism,
    furniture: weapon.design.furniture,
    selectedIds,
    selectedByExclusiveGroup: selectedItemsByExclusiveGroup(tables, selectedIds),
  }

  for (const feature of receiverFeatures) warnings.push(...componentCompatibilityWarnings(feature, compatibilityContext))

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
    warnings.push(...componentCompatibilityWarnings(specialAmmunition as FieldCatalogueCompatibilityComponent, compatibilityContext))
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
    warnings.push(...componentCompatibilityWarnings(accessory, compatibilityContext))
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
  const receiverHeatProfile = receiverHeatProfiles[receiver.id]
  const heatDissipationBonus = (weapon.design.heavyBarrel ? 2 : 0) + receiverFeatures.reduce((total, feature) => total + (feature.heatDissipationModifier ?? 0), 0)
  const heatGenerationBase = fullDamageDice(damage) + (auto || 0)
  if (receiverHeatProfile && (auto > 0 || weapon.design.weaponType === 'energy')) {
    heat = heatGenerationBase
    heatProfile = {
      generation: heatGenerationBase,
      dissipation: receiverHeatProfile.dissipation + heatDissipationBonus,
      thresholds: {
        overheat: receiverHeatProfile.overheat,
        danger: receiverHeatProfile.danger,
        disaster: receiverHeatProfile.disaster,
      },
    }

    if (heatProfile.generation >= heatProfile.thresholds.overheat) {
      warnings.push('A sustained firing sequence can cross the overheating threshold in a single attack; add cooling or reduce rate of fire.')
    }
  }

  const penetrationOutcome = applyFinalPenetration(damage, penetration)
  damage = penetrationOutcome.damage
  const finalPenetrationTrait = penetrationOutcome.trait
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
    heatProfile,
    magazineCostCredits,
    warnings,
    traits: uniqueTraits([...(weapon.traits ?? []), ...traits]),
    components: { receiver, ammunition, mechanism, receiverFeatures, barrel, furniture, feedDevice, specialAmmunition, accessories },
  }
}
