<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { TravellerArmorRecord, TravellerEquipmentRecord } from '~/types/armory'
import type { CustomWeaponDesign, TravellerWeaponRecord } from '~/types/weapon'
import { useWeaponsStore } from '~/stores/weapons'
import { loadBuilderDraft, saveBuilderDraft } from '~/utils/traveller/draftCache'
import { calculateFieldCatalogueWeapon, cloneWeapon, createBlankCustomWeapon, fieldCatalogueDesign } from '~/utils/traveller/weapons'

type DesignTableItem = {
  id: string
  name: string
  notes?: string
  description?: string
  traits?: string[]
  [key: string]: any
}

type DesignTables = {
  weaponTypes: DesignTableItem[]
  ammunitionTypes: DesignTableItem[]
  receivers: DesignTableItem[]
  mechanisms: DesignTableItem[]
  receiverFeatures: DesignTableItem[]
  barrels: DesignTableItem[]
  furniture: DesignTableItem[]
  feedDevices: DesignTableItem[]
  specialAmmunition: DesignTableItem[]
  accessories: DesignTableItem[]
}

type WeaponSortKey = 'name' | 'techLevel' | 'range' | 'damage' | 'massKg' | 'costCredits' | 'traits'
type ArmorSortKey = 'name' | 'protection' | 'techLevel' | 'radiationProtection' | 'massKg' | 'costCredits' | 'requiredSkill'
type EquipmentSortKey = 'name' | 'category' | 'techLevel' | 'massKg' | 'costCredits' | 'effect'
type WeaponSortIcon = 'sort-asc' | 'sort-desc'

type WeaponBuilderDraftCache = {
  draft: CustomWeaponDesign
  activeDesignStep: number
  traitInput: string
  accessoryInput: string
}

const WEAPON_BUILDER_DRAFT_CACHE_KEY = 'scoutsuite.builder.weapon.v1'
const WEAPON_BUILDER_DRAFT_CACHE_VERSION = 1

const weaponsStore = useWeaponsStore()
const { referenceWeapons, referenceArmor, referenceEquipment, userWeapons } = storeToRefs(weaponsStore)
const selectedCategory = ref('all')
const selectedArmorCategory = ref('all')
const selectedEquipmentCategory = ref('all')
const activeArmoryTab = ref('weapons')
const weaponCategoryMenuOpen = ref(false)
const armorCategoryMenuOpen = ref(false)
const equipmentCategoryMenuOpen = ref(false)
const expandedWeaponId = ref('')
const expandedArmorId = ref('')
const expandedEquipmentId = ref('')
const activeDesignStep = ref(0)
const weaponSortKey = ref<WeaponSortKey>('name')
const armorSortKey = ref<ArmorSortKey>('name')
const equipmentSortKey = ref<EquipmentSortKey>('name')
const weaponSortDirection = ref<'asc' | 'desc'>('asc')
const armorSortDirection = ref<'asc' | 'desc'>('asc')
const equipmentSortDirection = ref<'asc' | 'desc'>('asc')
const search = ref('')
const draft = ref<CustomWeaponDesign>(createBlankCustomWeapon())
const saveMessage = ref('')
const traitInput = ref('')
const accessoryInput = ref('')
const weaponBuilderDraftRestored = ref(false)

onMounted(() => {
  weaponsStore.loadWeapons()

  const cachedDraft = loadBuilderDraft<WeaponBuilderDraftCache>(
    WEAPON_BUILDER_DRAFT_CACHE_KEY,
    WEAPON_BUILDER_DRAFT_CACHE_VERSION,
  )

  if (cachedDraft?.draft) {
    draft.value = cloneWeapon(cachedDraft.draft)
    activeDesignStep.value = cachedDraft.activeDesignStep ?? 0
    traitInput.value = cachedDraft.traitInput ?? ''
    accessoryInput.value = cachedDraft.accessoryInput ?? ''
  }

  weaponBuilderDraftRestored.value = true
})

watch(
  [draft, activeDesignStep, traitInput, accessoryInput],
  () => {
    if (!weaponBuilderDraftRestored.value) return
    saveBuilderDraft<WeaponBuilderDraftCache>(
      WEAPON_BUILDER_DRAFT_CACHE_KEY,
      WEAPON_BUILDER_DRAFT_CACHE_VERSION,
      {
        draft: cloneWeapon(draft.value),
        activeDesignStep: activeDesignStep.value,
        traitInput: traitInput.value,
        accessoryInput: accessoryInput.value,
      },
    )
  },
  { deep: true },
)

const categories = [
  { id: 'all', label: 'All' },
  { id: 'melee', label: 'Melee' },
  { id: 'slug', label: 'Slug' },
  { id: 'energy', label: 'Energy' },
  { id: 'grenade', label: 'Grenade' },
  { id: 'support', label: 'Support Weapons' },
  { id: 'explosive', label: 'Explosive' },
  { id: 'other', label: 'Other' },
]

const armorCategories = [
  { id: 'all', label: 'All' },
  { id: 'standard', label: 'Standard' },
  { id: 'environment', label: 'Environment' },
  { id: 'combat', label: 'Combat' },
  { id: 'battle-dress', label: 'Battle Dress' },
  { id: 'clothing', label: 'Clothing' },
  { id: 'subdermal', label: 'Subdermal' },
  { id: 'other', label: 'Other' },
]

const equipmentCategories = [
  { id: 'all', label: 'All' },
  { id: 'communications', label: 'Comms' },
  { id: 'computers', label: 'Computers' },
  { id: 'medical', label: 'Medical' },
  { id: 'drugs', label: 'Drugs' },
  { id: 'sensors', label: 'Sensors' },
  { id: 'survival', label: 'Survival' },
  { id: 'tools', label: 'Tools' },
  { id: 'support', label: 'Support' },
  { id: 'software', label: 'Software' },
  { id: 'other', label: 'Other' },
]

const armoryTabs = [
  { id: 'weapons', label: 'Weapons' },
  { id: 'armor', label: 'Armor' },
  { id: 'support', label: 'Equipment' },
  { id: 'create', label: 'Create Weapon' },
]
const armoryTabPosition = (index: number, count: number) => count <= 1 ? 0 : index / (count - 1)

const designSteps = [
  { id: 'frame', label: 'Frame', title: 'Frame', description: 'Name the weapon and choose its broad construction path.' },
  { id: 'payload', label: 'Payload', title: 'Ammunition', description: 'Choose the ammunition or power source that sets base damage, range and penetration.' },
  { id: 'receiver', label: 'Receiver', title: 'Receiver', description: 'Choose the receiver, firing mechanism and receiver-level modifications.' },
  { id: 'body', label: 'Body', title: 'Barrel & Feed', description: 'Choose the barrel, stock or mount, feed device and capacity adjustment.' },
  { id: 'extras', label: 'Extras', title: 'Accessories', description: 'Add accessories, special ammunition, traits and design notes.' },
  { id: 'review', label: 'Review', title: 'Review', description: 'Apply calculated values, review warnings and save the finished custom weapon.' },
]

const designTables = fieldCatalogueDesign.componentTables as DesignTables
const designPreview = computed(() => calculateFieldCatalogueWeapon(draft.value))

const sortableWeaponColumns: { key: WeaponSortKey, label: string }[] = [
  { key: 'name', label: 'Weapon' },
  { key: 'techLevel', label: 'TL' },
  { key: 'range', label: 'Range' },
  { key: 'damage', label: 'Damage' },
  { key: 'massKg', label: 'Mass' },
  { key: 'costCredits', label: 'Cost' },
  { key: 'traits', label: 'Traits' },
]

const sortableArmorColumns: { key: ArmorSortKey, label: string }[] = [
  { key: 'name', label: 'Armor' },
  { key: 'protection', label: 'Protection' },
  { key: 'techLevel', label: 'TL' },
  { key: 'radiationProtection', label: 'Rad' },
  { key: 'massKg', label: 'Mass' },
  { key: 'costCredits', label: 'Cost' },
  { key: 'requiredSkill', label: 'Skill' },
]

const sortableEquipmentColumns: { key: EquipmentSortKey, label: string }[] = [
  { key: 'name', label: 'Item' },
  { key: 'category', label: 'Category' },
  { key: 'techLevel', label: 'TL' },
  { key: 'massKg', label: 'Mass' },
  { key: 'costCredits', label: 'Cost' },
  { key: 'effect', label: 'Effect' },
]

const compareValues = (firstValue: unknown, secondValue: unknown, direction: number) => {
  if (firstValue === null || firstValue === undefined) return 1
  if (secondValue === null || secondValue === undefined) return -1

  if (typeof firstValue === 'number' || typeof secondValue === 'number') {
    const left = typeof firstValue === 'number' ? firstValue : Number(firstValue)
    const right = typeof secondValue === 'number' ? secondValue : Number(secondValue)
    return (left - right) * direction
  }

  return String(firstValue ?? '').localeCompare(String(secondValue ?? ''), undefined, { numeric: true, sensitivity: 'base' }) * direction
}

const duplicateWeaponNameCounts = computed(() => {
  const counts = new Map<string, number>()

  for (const weapon of referenceWeapons.value) {
    const name = weapon.name.trim().toLowerCase()
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }

  return counts
})

const weaponDisplayName = (weapon: TravellerWeaponRecord) => {
  const name = weapon.name.trim()
  const duplicateCount = duplicateWeaponNameCounts.value.get(name.toLowerCase()) ?? 0
  if (duplicateCount <= 1 || weapon.techLevel === null || /\bTL\s*\d+\b/i.test(name)) return name
  return `${name} TL ${weapon.techLevel}`
}

const duplicateArmorNameCounts = computed(() => {
  const counts = new Map<string, number>()

  for (const armor of referenceArmor.value) {
    const name = armor.name.trim().toLowerCase()
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }

  return counts
})

const armorDisplayName = (armor: TravellerArmorRecord) => {
  const name = armor.name.trim()
  const duplicateCount = duplicateArmorNameCounts.value.get(name.toLowerCase()) ?? 0
  if (duplicateCount <= 1 || armor.techLevel === null || /\bTL\s*\d+\b/i.test(name)) return name
  return `${name} TL ${armor.techLevel}`
}

const duplicateEquipmentNameCounts = computed(() => {
  const counts = new Map<string, number>()

  for (const item of referenceEquipment.value) {
    const name = item.name.trim().toLowerCase()
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }

  return counts
})

const equipmentDisplayName = (item: TravellerEquipmentRecord) => {
  const name = item.name.trim()
  const duplicateCount = duplicateEquipmentNameCounts.value.get(name.toLowerCase()) ?? 0
  if (duplicateCount <= 1 || item.techLevel === null || /\bTL\s*\d+\b/i.test(name)) return name
  return `${name} TL ${item.techLevel}`
}

const sortReferenceWeapons = (weapons: TravellerWeaponRecord[]) => {
  const direction = weaponSortDirection.value === 'asc' ? 1 : -1
  const key = weaponSortKey.value

  return [...weapons].sort((first, second) => {
    const firstValue = key === 'name' ? weaponDisplayName(first) : key === 'traits' ? first.traits.join(', ') : first[key]
    const secondValue = key === 'name' ? weaponDisplayName(second) : key === 'traits' ? second.traits.join(', ') : second[key]

    return compareValues(firstValue, secondValue, direction)
  })
}

const sortReferenceArmor = (armor: TravellerArmorRecord[]) => {
  const direction = armorSortDirection.value === 'asc' ? 1 : -1
  const key = armorSortKey.value

  return [...armor].sort((first, second) => compareValues(
    key === 'name' ? armorDisplayName(first) : first[key],
    key === 'name' ? armorDisplayName(second) : second[key],
    direction,
  ))
}

const sortReferenceEquipment = (equipment: TravellerEquipmentRecord[]) => {
  const direction = equipmentSortDirection.value === 'asc' ? 1 : -1
  const key = equipmentSortKey.value

  return [...equipment].sort((first, second) => compareValues(
    key === 'name' ? equipmentDisplayName(first) : first[key],
    key === 'name' ? equipmentDisplayName(second) : second[key],
    direction,
  ))
}

const filteredReferenceWeapons = computed(() => sortReferenceWeapons(referenceWeapons.value.filter((weapon) => {
  const matchesCategory = selectedCategory.value === 'all'
    || (selectedCategory.value === 'support' && (weapon.scale === 'support' || weapon.category === 'support'))
    || (weapon.category === selectedCategory.value && weapon.scale !== 'support')
  const query = search.value.trim().toLowerCase()
  const matchesSearch = !query || [
    weaponDisplayName(weapon),
    weapon.damage,
    weapon.range,
    weapon.traits.join(' '),
    weapon.skill,
    weapon.speciality,
    weapon.description,
  ].filter(Boolean).join(' ').toLowerCase().includes(query)

  return matchesCategory && matchesSearch
})))

const filteredReferenceArmor = computed(() => sortReferenceArmor(referenceArmor.value.filter((armor) => {
  const matchesCategory = selectedArmorCategory.value === 'all' || armor.category === selectedArmorCategory.value
  const query = search.value.trim().toLowerCase()
  const matchesSearch = !query || [
    armorDisplayName(armor),
    armor.protection,
    armor.radiationProtection,
    armor.requiredSkill,
    armor.traits.join(' '),
    armor.notes,
    armor.sourceName,
  ].filter(Boolean).join(' ').toLowerCase().includes(query)

  return matchesCategory && matchesSearch
})))

const filteredReferenceEquipment = computed(() => sortReferenceEquipment(referenceEquipment.value.filter((item) => {
  const matchesCategory = selectedEquipmentCategory.value === 'all' || item.category === selectedEquipmentCategory.value
  const query = search.value.trim().toLowerCase()
  const matchesSearch = !query || [
    equipmentDisplayName(item),
    item.category,
    item.effect,
    item.traits.join(' '),
    item.notes,
    item.sourceName,
  ].filter(Boolean).join(' ').toLowerCase().includes(query)

  return matchesCategory && matchesSearch
})))

const setWeaponSort = (key: WeaponSortKey) => {
  if (weaponSortKey.value === key) {
    weaponSortDirection.value = weaponSortDirection.value === 'asc' ? 'desc' : 'asc'
    return
  }
  weaponSortKey.value = key
  weaponSortDirection.value = 'asc'
}

const weaponSortIndicator = (key: WeaponSortKey): WeaponSortIcon | null => {
  if (weaponSortKey.value !== key) return null
  return weaponSortDirection.value === 'asc' ? 'sort-asc' : 'sort-desc'
}

const setArmorSort = (key: ArmorSortKey) => {
  if (armorSortKey.value === key) {
    armorSortDirection.value = armorSortDirection.value === 'asc' ? 'desc' : 'asc'
    return
  }
  armorSortKey.value = key
  armorSortDirection.value = 'asc'
}

const armorSortIndicator = (key: ArmorSortKey): WeaponSortIcon | null => {
  if (armorSortKey.value !== key) return null
  return armorSortDirection.value === 'asc' ? 'sort-asc' : 'sort-desc'
}

const setEquipmentSort = (key: EquipmentSortKey) => {
  if (equipmentSortKey.value === key) {
    equipmentSortDirection.value = equipmentSortDirection.value === 'asc' ? 'desc' : 'asc'
    return
  }
  equipmentSortKey.value = key
  equipmentSortDirection.value = 'asc'
}

const equipmentSortIndicator = (key: EquipmentSortKey): WeaponSortIcon | null => {
  if (equipmentSortKey.value !== key) return null
  return equipmentSortDirection.value === 'asc' ? 'sort-asc' : 'sort-desc'
}

const formatCredits = (credits: number | null) => {
  if (credits === null) return '-'
  return credits >= 1000000 ? `MCr${credits / 1000000}` : `Cr${credits.toLocaleString()}`
}

const formatKg = (kg: number | null) => kg === null ? '-' : `${kg}kg`

const selectedItem = (items: DesignTableItem[], id: string) => items.find((item) => item.id === id)

const signedPercent = (value: number) => `${value > 0 ? '+' : ''}${value}%`
const signedNumber = (value: number) => `${value > 0 ? '+' : ''}${value}`

const itemRules = (item: DesignTableItem) => {
  const rules = []
  if (item.damage) rules.push(`Damage ${item.damage}`)
  if (item.rangeMeters !== undefined) rules.push(`Range ${item.rangeMeters}m`)
  if (item.baseCostCredits !== undefined) rules.push(`Base Cr${item.baseCostCredits}`)
  if (item.baseWeightKg !== undefined) rules.push(`${item.baseWeightKg}kg`)
  if (item.baseCapacity !== undefined) rules.push(`Capacity ${item.baseCapacity}`)
  if (item.costPer100Credits !== undefined) rules.push(`Cr${item.costPer100Credits}/100`)
  if (item.costCredits !== undefined) rules.push(`Cr${item.costCredits}`)
  if (item.weightKg !== undefined) rules.push(`${item.weightKg}kg`)
  if (item.costModifierPercent) rules.push(`Cost ${signedPercent(item.costModifierPercent)}`)
  if (item.weightModifierPercent) rules.push(`Weight ${signedPercent(item.weightModifierPercent)}`)
  if (item.capacityModifierPercent) rules.push(`Capacity ${signedPercent(item.capacityModifierPercent)}`)
  if (item.rangeModifierPercent) rules.push(`Range ${signedPercent(item.rangeModifierPercent)}`)
  if (item.penetration !== undefined) rules.push(`Pen ${item.penetration}`)
  if (item.penetrationModifier) rules.push(`Pen ${signedNumber(item.penetrationModifier)}`)
  if (item.quickdraw !== undefined) rules.push(`Quickdraw ${item.quickdraw}`)
  if (item.quickdrawModifier) rules.push(`Quickdraw ${signedNumber(item.quickdrawModifier)}`)
  if (item.auto) rules.push(`Auto ${item.auto}`)
  if (item.traits?.length) rules.push(item.traits.join(', '))
  return rules
}

const itemDescription = (item?: DesignTableItem | null) => {
  if (!item) return ''
  const rules = itemRules(item)
  if (item.description) return item.description
  if (item.notes) return item.notes
  if (!rules.length) return 'No mechanical notes captured yet.'
  return rules.join(' · ')
}

const weaponDescription = (weapon: typeof referenceWeapons.value[number]) => {
  if (weapon.description) return weapon.description
  const name = weapon.name.toLowerCase()
  const mass = weapon.massKg === null ? '' : weapon.massKg <= 0.5 ? 'lightweight ' : weapon.massKg >= 8 ? 'heavy ' : ''
  const bulky = weapon.traits.some((trait) => trait.toLowerCase().includes('bulky')) ? 'oversized ' : ''
  const source = weapon.sourceName ?? weapon.sourceId

  if (weapon.category === 'melee') {
    if (name.includes('whip')) return `A flexible hand weapon with a weighted or energized striking length, built to lash around guards and limbs. (${source})`
    if (name.includes('shield')) return `A carried defensive plate or buckler that can be shoved or struck with at close range. (${source})`
    if (name.includes('staff')) return `A long two-handed striking pole, simple enough to double as a walking staff or tool. (${source})`
    if (name.includes('stunstick')) return `A short baton with an electrical contact head, meant to incapacitate without cutting the target. (${source})`
    return `A ${mass}close-combat weapon shaped for cutting, stabbing or striking in hand-to-hand fighting. (${source})`
  }

  if (weapon.category === 'slug') {
    if (name.includes('pistol') || name.includes('revolver')) return `A ${mass}one-handed projectile sidearm with a compact frame, grip and short barrel. (${source})`
    if (name.includes('shotgun')) return `A shoulder-fired smoothbore weapon with a broad barrel profile and chunky fore-end. (${source})`
    if (name.includes('gauss')) return `A sleek electromagnetic projectile weapon with a long accelerator body instead of a conventional firing chamber. (${source})`
    if (name.includes('submachine')) return `A compact automatic firearm with a short barrel and prominent magazine, made for close fighting. (${source})`
    return `A ${bulky}${mass}projectile firearm with a receiver, barrel, grip or stock, and ammunition feed. (${source})`
  }

  if (weapon.category === 'energy') {
    if (name.includes('plasma')) return `A high-energy rifle with a reinforced emitter assembly and heavy power system. (${source})`
    if (name.includes('stun')) return `A non-lethal energy projector with a compact emitter and power pack. (${source})`
    if (name.includes('flamer') || name.includes('flame')) return `A short-ranged projector with fuel reservoir, nozzle and ignition hardware. (${source})`
    return `A directed-energy weapon with an emitter lens, power cell housing and minimal moving parts. (${source})`
  }

  if (weapon.category === 'grenade') return `A palm-sized thrown munition with a sealed casing and visible arming or safety mechanism. (${source})`
  if (weapon.category === 'explosive') return `A compact demolition charge or explosive package intended to be placed, triggered or thrown. (${source})`
  if (weapon.scale === 'support' || weapon.category === 'support') return `A support weapon or battlefield tool with reinforced fittings and specialist handling hardware. (${source})`
  if (weapon.category === 'heavy') return `A ${bulky}${mass}heavy weapon with a large barrel, reinforced frame and bulky ammunition or power system. (${source})`
  return `A personal weapon or combat item from ${source}; exact visual description still needs source-text review.`
}

const selectedWeaponType = computed(() => selectedItem(designTables.weaponTypes, draft.value.design.weaponType))
const selectedAmmunition = computed(() => selectedItem(designTables.ammunitionTypes, draft.value.design.ammunitionType))
const selectedSpecialAmmunition = computed(() => selectedItem(designTables.specialAmmunition, draft.value.design.specialAmmunition))
const selectedReceiver = computed(() => selectedItem(designTables.receivers, draft.value.design.receiverType))
const selectedMechanism = computed(() => selectedItem(designTables.mechanisms, draft.value.design.mechanism))
const selectedBarrel = computed(() => selectedItem(designTables.barrels, draft.value.design.barrel))
const selectedFurniture = computed(() => selectedItem(designTables.furniture, draft.value.design.furniture))
const selectedFeedDevice = computed(() => selectedItem(designTables.feedDevices, draft.value.design.feedDevice))

const isStepComplete = (index: number) => {
  const design = draft.value.design
  if (index === 0) return Boolean(draft.value.name.trim() && design.weaponType)
  if (index === 1) return Boolean(design.weaponType !== 'projectile' || design.ammunitionType)
  if (index === 2) return Boolean(design.weaponType !== 'projectile' || (design.receiverType && design.mechanism))
  if (index === 3) return Boolean(design.weaponType !== 'projectile' || (design.barrel && design.furniture && design.feedDevice))
  if (index === 4) return true
  return designPreview.value.ready
}

const canAccessStep = (index: number) => {
  if (index <= activeDesignStep.value) return true
  for (let step = 0; step < index; step += 1) {
    if (!isStepComplete(step)) return false
  }
  return true
}

const setDesignStep = (index: number) => {
  if (!canAccessStep(index)) return
  activeDesignStep.value = index
}

const nextDesignStep = () => {
  if (!isStepComplete(activeDesignStep.value)) return
  activeDesignStep.value = Math.min(activeDesignStep.value + 1, designSteps.length - 1)
}

const previousDesignStep = () => {
  activeDesignStep.value = Math.max(activeDesignStep.value - 1, 0)
}

const editWeapon = (weapon: CustomWeaponDesign) => {
  draft.value = cloneWeapon(weapon)
  activeArmoryTab.value = 'create'
  activeDesignStep.value = 0
  saveMessage.value = ''
}

const newWeapon = () => {
  draft.value = createBlankCustomWeapon(weaponsStore.activeUserId)
  activeArmoryTab.value = 'create'
  activeDesignStep.value = 0
  saveMessage.value = ''
}

const saveWeapon = () => {
  const saved = weaponsStore.saveCustomWeapon(draft.value)
  draft.value = cloneWeapon(saved)
  saveMessage.value = `Saved ${saved.name}`
}

const duplicateWeapon = () => {
  const saved = weaponsStore.saveCustomWeapon(draft.value)
  const copy = weaponsStore.duplicateCustomWeapon(saved.id)
  if (!copy) return
  draft.value = cloneWeapon(copy)
  activeDesignStep.value = 0
  saveMessage.value = `Duplicated ${copy.name}`
}

const deleteWeapon = () => {
  if (!window.confirm(`Delete ${draft.value.name || 'this weapon'}?`)) return
  weaponsStore.deleteCustomWeapon(draft.value.id)
  newWeapon()
}

const addTrait = () => {
  const value = traitInput.value.trim()
  if (!value) return
  draft.value.traits = [...draft.value.traits, value]
  traitInput.value = ''
}

const removeTrait = (index: number) => {
  draft.value.traits.splice(index, 1)
}

const addAccessory = () => {
  const value = accessoryInput.value.trim()
  if (!value) return
  draft.value.design.accessories = [...draft.value.design.accessories, value]
  accessoryInput.value = ''
}

const removeAccessory = (index: number) => {
  draft.value.design.accessories.splice(index, 1)
}

const toggleDesignAccessory = (id: string) => {
  const current = draft.value.design.accessories
  draft.value.design.accessories = current.includes(id)
    ? current.filter((item) => item !== id)
    : [...current, id]
}

const toggleReceiverFeature = (id: string) => {
  const current = draft.value.design.receiverFeatures ?? []
  draft.value.design.receiverFeatures = current.includes(id)
    ? current.filter((item) => item !== id)
    : [...current, id]
}

const applyDesignPreview = () => {
  const preview = designPreview.value
  if (!preview.ready) return
  draft.value.range = preview.range
  draft.value.damage = preview.damage
  draft.value.massKg = preview.massKg
  draft.value.costCredits = preview.costCredits
  draft.value.magazine = preview.magazine
  draft.value.magazineCostCredits = preview.magazineCostCredits
  draft.value.traits = preview.traits
}

const copyReferenceWeapon = (weapon: typeof referenceWeapons.value[number]) => {
  const now = new Date().toISOString()
  draft.value = {
    ...cloneWeapon(weapon),
    id: `custom-${weapon.id}-${Date.now()}`,
    name: weaponDisplayName(weapon),
    userId: weaponsStore.activeUserId,
    sourceId: 'custom',
    sourceName: 'Custom',
    createdAt: now,
    updatedAt: now,
    design: {
      rulesSource: 'mgt2e-field-catalogue',
      weaponType: weapon.category === 'slug' ? 'projectile' : weapon.category,
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
      notes: `Added from ${weapon.sourceId}: ${weaponDisplayName(weapon)}`,
    },
  }
  activeArmoryTab.value = 'create'
  activeDesignStep.value = 0
}

const setArmoryTab = (tabId: string) => {
  activeArmoryTab.value = tabId
  weaponCategoryMenuOpen.value = false
  armorCategoryMenuOpen.value = false
  equipmentCategoryMenuOpen.value = false
  saveMessage.value = ''
}

const selectWeaponCategory = (categoryId: string) => {
  selectedCategory.value = categoryId
  weaponCategoryMenuOpen.value = false
}

const selectArmorCategory = (categoryId: string) => {
  selectedArmorCategory.value = categoryId
  armorCategoryMenuOpen.value = false
}

const selectEquipmentCategory = (categoryId: string) => {
  selectedEquipmentCategory.value = categoryId
  equipmentCategoryMenuOpen.value = false
}

const toggleExpandedWeapon = (weaponId: string) => {
  expandedWeaponId.value = expandedWeaponId.value === weaponId ? '' : weaponId
}

const toggleExpandedArmor = (armorId: string) => {
  expandedArmorId.value = expandedArmorId.value === armorId ? '' : armorId
}

const toggleExpandedEquipment = (itemId: string) => {
  expandedEquipmentId.value = expandedEquipmentId.value === itemId ? '' : itemId
}
</script>

<template>
  <main class="min-h-screen text-cyan-50">
    <section class="relative z-20 mx-auto w-full max-w-[96rem] px-5 pt-6 sm:px-8 lg:px-10">
      <div class="mb-5">
        <p class="hud-kicker text-sm font-semibold uppercase tracking-wide">Armory</p>
        <h1 class="mt-2 text-3xl font-semibold">Equipment Armory</h1>
      </div>
      <div class="armory-view-buttons relative z-50 flex flex-wrap gap-2">
        <button
          v-for="(tab, index) in armoryTabs"
          :key="tab.id"
          class="relative z-10 rounded-md border px-4 py-3 text-sm font-semibold"
          :class="activeArmoryTab === tab.id ? 'border-zinc-950 bg-zinc-950 text-white' : 'border-zinc-300 text-zinc-700 hover:border-amber-600'"
          :style="{
            '--tab-position': armoryTabPosition(index, armoryTabs.length),
            '--tab-width': '9.5rem',
            zIndex: activeArmoryTab === tab.id ? 40 : Math.max(1, 30 - Math.abs(index - armoryTabs.findIndex((item) => item.id === activeArmoryTab))),
          }"
          type="button"
          @click.stop.prevent="setArmoryTab(tab.id)"
        >
          {{ tab.label }}
        </button>
      </div>
    </section>

    <section class="relative z-10 mx-auto grid w-full max-w-[96rem] gap-5 px-5 py-6 sm:px-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:px-10">
      <div v-if="activeArmoryTab === 'weapons'" class="grid gap-5 lg:col-span-2">
        <section class="hud-panel rounded-lg border p-5 shadow-sm">
          <div class="list-reference-header flex flex-wrap items-center justify-between gap-3">
            <div class="list-reference-title">
              <h2 class="text-xl font-semibold">Reference Weapons</h2>
            </div>
            <div class="list-search-actions">
              <input v-model="search" class="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="Search">
              <button
                class="list-category-toggle hud-link h-10 w-11"
                :aria-expanded="weaponCategoryMenuOpen"
                aria-label="Toggle weapon categories"
                type="button"
                @click.stop.prevent="weaponCategoryMenuOpen = !weaponCategoryMenuOpen"
              >
                <span :class="['list-category-toggle__line', weaponCategoryMenuOpen ? 'is-open' : '']" />
                <span :class="['list-category-toggle__line', weaponCategoryMenuOpen ? 'is-open' : '']" />
                <span :class="['list-category-toggle__line', weaponCategoryMenuOpen ? 'is-open' : '']" />
              </button>
            </div>
          </div>

          <div :class="['list-category-panel mt-4', weaponCategoryMenuOpen ? 'is-open' : '']">
            <button
              v-for="category in categories"
              :key="category.id"
              class="rounded-md border px-3 py-2 text-sm font-semibold"
              :class="selectedCategory === category.id ? 'border-zinc-950 bg-zinc-950 text-white' : 'border-zinc-300 text-zinc-700 hover:border-amber-600'"
              type="button"
              @click.stop.prevent="selectWeaponCategory(category.id)"
            >
              {{ category.label }}
            </button>
          </div>

          <div class="hud-table-shell hud-scrollbar mt-4 max-h-[42rem] overflow-auto rounded-md border">
            <table class="mobile-collapsible-table w-full min-w-[60rem] text-left text-sm">
              <thead class="sticky top-0 z-10 bg-stone-100 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th v-for="column in sortableWeaponColumns" :key="column.key" class="px-3 py-2">
                    <button class="flex items-center gap-1 font-semibold uppercase tracking-wide hover:text-zinc-950" type="button" @click="setWeaponSort(column.key)">
                      <span>{{ column.label }}</span>
                      <span class="inline-flex h-4 w-4 items-center text-amber-700">
                        <AppIcon v-if="weaponSortIndicator(column.key)" class="h-4 w-4" :name="weaponSortIndicator(column.key) ?? 'sort-asc'" />
                      </span>
                    </button>
                  </th>
                  <th class="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                <template v-for="weapon in filteredReferenceWeapons" :key="weapon.id">
                <tr class="border-t border-zinc-200 align-top">
                  <td class="px-3 py-2 font-semibold text-zinc-950">
                    <button class="mobile-row-toggle block w-full text-left font-semibold" type="button" @click="toggleExpandedWeapon(weapon.id)">
                      {{ weaponDisplayName(weapon) }}
                    </button>
                    <span class="mt-1 block text-xs font-medium text-zinc-500">{{ weapon.sourceName ?? weapon.sourceId }}<template v-if="weapon.sourcePage"> p. {{ weapon.sourcePage }}</template></span>
                  </td>
                  <td class="px-3 py-2">{{ weapon.techLevel ?? '-' }}</td>
                  <td class="px-3 py-2">{{ weapon.range }}</td>
                  <td class="px-3 py-2">{{ weapon.damage }}</td>
                  <td class="px-3 py-2">{{ weapon.massKg ?? '-' }}kg</td>
                  <td class="px-3 py-2">{{ weapon.costCredits === null ? '-' : `Cr${weapon.costCredits}` }}</td>
                  <td class="max-w-xs px-3 py-2 text-zinc-600">{{ weapon.traits.join(', ') || '-' }}</td>
                  <td class="px-3 py-2 text-right">
                    <button class="rounded-md border border-zinc-300 px-2 py-1 text-xs font-semibold text-zinc-700 hover:border-amber-600" type="button" @click.stop.prevent="copyReferenceWeapon(weapon)">
                      Add
                    </button>
                  </td>
                </tr>
                <tr v-if="expandedWeaponId === weapon.id" class="mobile-detail-row border-t border-cyan-400/20">
                  <td :colspan="sortableWeaponColumns.length + 1" class="px-3 py-3">
                    <div class="mobile-row-detail-grid">
                      <div><span>TL</span><strong>{{ weapon.techLevel ?? '-' }}</strong></div>
                      <div><span>Range</span><strong>{{ weapon.range }}</strong></div>
                      <div><span>Damage</span><strong>{{ weapon.damage }}</strong></div>
                      <div><span>Mass</span><strong>{{ weapon.massKg ?? '-' }}kg</strong></div>
                      <div><span>Cost</span><strong>{{ weapon.costCredits === null ? '-' : `Cr${weapon.costCredits}` }}</strong></div>
                      <div class="sm:col-span-2"><span>Traits</span><strong>{{ weapon.traits.join(', ') || '-' }}</strong></div>
                      <div class="flex flex-wrap gap-2 sm:col-span-2">
                        <button class="mt-1 rounded-md border border-cyan-400/40 px-3 py-2 text-sm font-semibold text-cyan-100 hover:border-cyan-300" type="button">
                          Add
                        </button>
                        <button class="mt-1 rounded-md border border-cyan-400/40 px-3 py-2 text-sm font-semibold text-cyan-100 hover:border-cyan-300" type="button">
                          Buy
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
                </template>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section v-else-if="activeArmoryTab === 'armor'" class="hud-panel rounded-lg border p-5 shadow-sm lg:col-span-2">
        <div class="list-reference-header flex flex-wrap items-center justify-between gap-3">
          <div class="list-reference-title">
            <h2 class="text-xl font-semibold">Reference Armor</h2>
          </div>
          <div class="list-search-actions">
            <input v-model="search" class="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="Search">
            <button
              class="list-category-toggle hud-link h-10 w-11"
              :aria-expanded="armorCategoryMenuOpen"
              aria-label="Toggle armor categories"
              type="button"
              @click.stop.prevent="armorCategoryMenuOpen = !armorCategoryMenuOpen"
            >
              <span :class="['list-category-toggle__line', armorCategoryMenuOpen ? 'is-open' : '']" />
              <span :class="['list-category-toggle__line', armorCategoryMenuOpen ? 'is-open' : '']" />
              <span :class="['list-category-toggle__line', armorCategoryMenuOpen ? 'is-open' : '']" />
            </button>
          </div>
        </div>

        <div :class="['list-category-panel mt-4', armorCategoryMenuOpen ? 'is-open' : '']">
          <button
            v-for="category in armorCategories"
            :key="category.id"
            class="rounded-md border px-3 py-2 text-sm font-semibold"
            :class="selectedArmorCategory === category.id ? 'border-zinc-950 bg-zinc-950 text-white' : 'border-zinc-300 text-zinc-700 hover:border-amber-600'"
            type="button"
            @click.stop.prevent="selectArmorCategory(category.id)"
          >
            {{ category.label }}
          </button>
        </div>

        <div class="hud-table-shell hud-scrollbar mt-4 max-h-[42rem] overflow-auto rounded-md border">
          <table class="mobile-collapsible-table w-full min-w-[64rem] text-left text-sm">
            <thead class="sticky top-0 z-10 bg-stone-100 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th v-for="column in sortableArmorColumns" :key="column.key" class="px-3 py-2">
                  <button class="flex items-center gap-1 font-semibold uppercase tracking-wide hover:text-zinc-950" type="button" @click="setArmorSort(column.key)">
                    <span>{{ column.label }}</span>
                    <span class="inline-flex h-4 w-4 items-center text-amber-700">
                      <AppIcon v-if="armorSortIndicator(column.key)" class="h-4 w-4" :name="armorSortIndicator(column.key) ?? 'sort-asc'" />
                    </span>
                  </button>
                </th>
                <th class="px-3 py-2">Traits</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="armor in filteredReferenceArmor" :key="armor.id">
              <tr class="border-t border-zinc-200 align-top">
                <td class="px-3 py-2 font-semibold text-zinc-950">
                  <button class="mobile-row-toggle block w-full text-left font-semibold" type="button" @click="toggleExpandedArmor(armor.id)">
                    {{ armorDisplayName(armor) }}
                  </button>
                  <span class="mt-1 block text-xs font-medium text-zinc-500">{{ armor.sourceName ?? armor.sourceId }}<template v-if="armor.sourcePage"> p. {{ armor.sourcePage }}</template></span>
                </td>
                <td class="px-3 py-2">{{ armor.protection }}</td>
                <td class="px-3 py-2">{{ armor.techLevel ?? '-' }}</td>
                <td class="px-3 py-2">{{ armor.radiationProtection ?? '-' }}</td>
                <td class="px-3 py-2">{{ formatKg(armor.massKg) }}</td>
                <td class="px-3 py-2">{{ formatCredits(armor.costCredits) }}</td>
                <td class="px-3 py-2">{{ armor.requiredSkill ?? 'None' }}</td>
                <td class="max-w-xs px-3 py-2 text-zinc-600">{{ armor.traits.join(', ') || '-' }}</td>
              </tr>
              <tr v-if="expandedArmorId === armor.id" class="mobile-detail-row border-t border-cyan-400/20">
                <td :colspan="sortableArmorColumns.length + 1" class="px-3 py-3">
                  <div class="mobile-row-detail-grid">
                    <div><span>Protection</span><strong>{{ armor.protection }}</strong></div>
                    <div><span>TL</span><strong>{{ armor.techLevel ?? '-' }}</strong></div>
                    <div><span>Radiation</span><strong>{{ armor.radiationProtection ?? '-' }}</strong></div>
                    <div><span>Mass</span><strong>{{ formatKg(armor.massKg) }}</strong></div>
                    <div><span>Cost</span><strong>{{ formatCredits(armor.costCredits) }}</strong></div>
                    <div><span>Skill</span><strong>{{ armor.requiredSkill ?? 'None' }}</strong></div>
                    <div class="sm:col-span-2"><span>Traits</span><strong>{{ armor.traits.join(', ') || '-' }}</strong></div>
                  </div>
                </td>
              </tr>
              </template>
            </tbody>
          </table>
        </div>
      </section>

      <section v-else-if="activeArmoryTab === 'support'" class="hud-panel rounded-lg border p-5 shadow-sm lg:col-span-2">
        <div class="list-reference-header flex flex-wrap items-center justify-between gap-3">
          <div class="list-reference-title">
            <h2 class="text-xl font-semibold">Equipment</h2>
          </div>
          <div class="list-search-actions">
            <input v-model="search" class="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="Search">
            <button
              class="list-category-toggle hud-link h-10 w-11"
              :aria-expanded="equipmentCategoryMenuOpen"
              aria-label="Toggle equipment categories"
              type="button"
              @click.stop.prevent="equipmentCategoryMenuOpen = !equipmentCategoryMenuOpen"
            >
              <span :class="['list-category-toggle__line', equipmentCategoryMenuOpen ? 'is-open' : '']" />
              <span :class="['list-category-toggle__line', equipmentCategoryMenuOpen ? 'is-open' : '']" />
              <span :class="['list-category-toggle__line', equipmentCategoryMenuOpen ? 'is-open' : '']" />
            </button>
          </div>
        </div>

        <div :class="['list-category-panel mt-4', equipmentCategoryMenuOpen ? 'is-open' : '']">
          <button
            v-for="category in equipmentCategories"
            :key="category.id"
            class="rounded-md border px-3 py-2 text-sm font-semibold"
            :class="selectedEquipmentCategory === category.id ? 'border-zinc-950 bg-zinc-950 text-white' : 'border-zinc-300 text-zinc-700 hover:border-amber-600'"
            type="button"
            @click.stop.prevent="selectEquipmentCategory(category.id)"
          >
            {{ category.label }}
          </button>
        </div>

        <div class="hud-table-shell hud-scrollbar mt-4 max-h-[42rem] overflow-auto rounded-md border">
          <table class="mobile-collapsible-table w-full min-w-[68rem] text-left text-sm">
            <thead class="sticky top-0 z-10 bg-stone-100 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th v-for="column in sortableEquipmentColumns" :key="column.key" class="px-3 py-2">
                  <button class="flex items-center gap-1 font-semibold uppercase tracking-wide hover:text-zinc-950" type="button" @click="setEquipmentSort(column.key)">
                    <span>{{ column.label }}</span>
                    <span class="inline-flex h-4 w-4 items-center text-amber-700">
                      <AppIcon v-if="equipmentSortIndicator(column.key)" class="h-4 w-4" :name="equipmentSortIndicator(column.key) ?? 'sort-asc'" />
                    </span>
                  </button>
                </th>
                <th class="px-3 py-2">Traits</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="item in filteredReferenceEquipment" :key="item.id">
              <tr class="border-t border-zinc-200 align-top">
                <td class="px-3 py-2 font-semibold text-zinc-950">
                  <button class="mobile-row-toggle block w-full text-left font-semibold" type="button" @click="toggleExpandedEquipment(item.id)">
                    {{ equipmentDisplayName(item) }}
                  </button>
                  <span class="mt-1 block text-xs font-medium text-zinc-500">{{ item.sourceName ?? item.sourceId }}<template v-if="item.sourcePage"> p. {{ item.sourcePage }}</template></span>
                </td>
                <td class="px-3 py-2 capitalize">{{ item.category }}</td>
                <td class="px-3 py-2">{{ item.techLevel ?? '-' }}</td>
                <td class="px-3 py-2">{{ formatKg(item.massKg) }}</td>
                <td class="px-3 py-2">{{ formatCredits(item.costCredits) }}</td>
                <td class="max-w-md px-3 py-2 text-zinc-700">{{ item.effect }}</td>
                <td class="max-w-xs px-3 py-2 text-zinc-600">{{ item.traits.join(', ') || '-' }}</td>
              </tr>
              <tr v-if="expandedEquipmentId === item.id" class="mobile-detail-row border-t border-cyan-400/20">
                <td :colspan="sortableEquipmentColumns.length + 1" class="px-3 py-3">
                  <div class="mobile-row-detail-grid">
                    <div><span>Category</span><strong class="capitalize">{{ item.category }}</strong></div>
                    <div><span>TL</span><strong>{{ item.techLevel ?? '-' }}</strong></div>
                    <div><span>Mass</span><strong>{{ formatKg(item.massKg) }}</strong></div>
                    <div><span>Cost</span><strong>{{ formatCredits(item.costCredits) }}</strong></div>
                    <div class="sm:col-span-2"><span>Effect</span><strong>{{ item.effect }}</strong></div>
                    <div class="sm:col-span-2"><span>Traits</span><strong>{{ item.traits.join(', ') || '-' }}</strong></div>
                  </div>
                </td>
              </tr>
              </template>
            </tbody>
          </table>
        </div>
      </section>

      <div v-else class="grid gap-5">
        <section class="hud-panel rounded-lg border p-5 shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-lg font-semibold">Saved Weapons</h2>
            <button class="rounded-md bg-zinc-950 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800" type="button" @click="newWeapon">
              New
            </button>
          </div>
          <div v-if="userWeapons.length" class="mt-4 grid gap-2">
            <button
              v-for="weapon in userWeapons"
              :key="weapon.id"
              class="rounded-md border border-zinc-200 bg-stone-50 p-3 text-left hover:border-amber-500 hover:bg-white"
              type="button"
              @click="editWeapon(weapon)"
            >
              <p class="font-semibold text-zinc-950">{{ weapon.name }}</p>
              <p class="mt-1 text-sm text-zinc-600">{{ weapon.damage }} · {{ weapon.range }} · TL {{ weapon.techLevel ?? '-' }}</p>
            </button>
          </div>
          <p v-else class="mt-4 rounded-md bg-stone-50 p-4 text-sm text-zinc-600">No custom weapons saved yet.</p>
        </section>
      </div>

      <section v-if="activeArmoryTab === 'create'" class="hud-panel rounded-lg border p-5 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-xl font-semibold">Weapon Design</h2>
            <p class="mt-1 text-sm text-zinc-600">Guided Field Catalogue component process with gated steps.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button class="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 hover:border-amber-600" type="button" @click="duplicateWeapon">Duplicate</button>
            <button class="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:border-red-500" type="button" @click="deleteWeapon">Delete</button>
            <button class="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400" type="button" @click="saveWeapon">Save</button>
          </div>
        </div>

        <p v-if="saveMessage" class="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900">{{ saveMessage }}</p>

        <div class="mt-5 flex flex-wrap gap-1 border-b border-zinc-300">
          <button
            v-for="(step, index) in designSteps"
            :key="step.id"
            class="-mb-px rounded-t-md border px-3 py-2 text-sm font-semibold"
            :class="[
              activeDesignStep === index ? 'border-zinc-300 border-b-white bg-white text-zinc-950' : 'border-transparent text-zinc-600',
              canAccessStep(index) ? 'hover:text-zinc-950' : 'cursor-not-allowed opacity-45'
            ]"
            type="button"
            :disabled="!canAccessStep(index)"
            @click="setDesignStep(index)"
          >
            {{ index + 1 }}. {{ step.label }}
          </button>
        </div>

        <div class="mt-5 rounded-md border border-zinc-200 p-5">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="text-sm font-semibold uppercase tracking-wide text-amber-700">Step {{ activeDesignStep + 1 }}</p>
              <h3 class="mt-1 text-xl font-semibold">{{ designSteps[activeDesignStep].title }}</h3>
              <p class="mt-1 text-sm text-zinc-600">{{ designSteps[activeDesignStep].description }}</p>
            </div>
            <p class="rounded-md px-3 py-2 text-sm font-semibold" :class="isStepComplete(activeDesignStep) ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'">
              {{ isStepComplete(activeDesignStep) ? 'Complete' : 'Selection needed' }}
            </p>
          </div>

          <div v-if="activeDesignStep === 0" class="mt-5 grid gap-4 md:grid-cols-3">
            <label class="grid gap-2 md:col-span-2">
              <span class="text-sm font-semibold text-zinc-700">Name</span>
              <input v-model="draft.name" class="h-11 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
            </label>
            <label class="grid gap-2">
              <span class="text-sm font-semibold text-zinc-700">TL</span>
              <input v-model.number="draft.techLevel" class="h-11 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" type="number">
            </label>
            <label class="grid gap-2">
              <span class="text-sm font-semibold text-zinc-700">Category</span>
              <select v-model="draft.category" class="h-11 rounded-md border border-zinc-300 bg-white px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
                <option value="melee">Melee</option>
                <option value="slug">Slug</option>
                <option value="energy">Energy</option>
                <option value="grenade">Grenade</option>
                <option value="explosive">Explosive</option>
                <option value="support">Support</option>
                <option value="heavy">Heavy</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label class="grid gap-2">
              <span class="text-sm font-semibold text-zinc-700">Skill</span>
              <input v-model="draft.skill" class="h-11 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
            </label>
            <label class="grid gap-2">
              <span class="text-sm font-semibold text-zinc-700">Specialty</span>
              <input v-model="draft.speciality" class="h-11 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
            </label>
            <label class="grid gap-2 md:col-span-3">
              <span class="text-sm font-semibold text-zinc-700">Weapon Type</span>
              <select v-model="draft.design.weaponType" class="h-11 rounded-md border border-zinc-300 bg-white px-3">
                <option value="">Select type</option>
                <option v-for="item in designTables.weaponTypes" :key="item.id" :value="item.id">{{ item.name }}</option>
              </select>
            </label>
            <p v-if="selectedWeaponType" class="rounded-md bg-stone-50 p-3 text-sm text-zinc-700 md:col-span-3">{{ itemDescription(selectedWeaponType) }}</p>
          </div>

          <div v-else-if="activeDesignStep === 1" class="mt-5 grid gap-4">
            <label class="grid gap-2">
              <span class="text-sm font-semibold text-zinc-700">Ammunition / Power Source</span>
              <select v-model="draft.design.ammunitionType" class="h-11 rounded-md border border-zinc-300 bg-white px-3">
                <option value="">Select ammunition</option>
                <option v-for="item in designTables.ammunitionTypes" :key="item.id" :value="item.id">{{ item.name }}</option>
              </select>
            </label>
            <p v-if="selectedAmmunition" class="rounded-md bg-stone-50 p-3 text-sm text-zinc-700">{{ itemDescription(selectedAmmunition) }}</p>
          </div>

          <div v-else-if="activeDesignStep === 2" class="mt-5 grid gap-4">
            <div class="grid gap-4 md:grid-cols-2">
              <label class="grid gap-2">
                <span class="text-sm font-semibold text-zinc-700">Receiver</span>
                <select v-model="draft.design.receiverType" class="h-11 rounded-md border border-zinc-300 bg-white px-3">
                  <option value="">Select receiver</option>
                  <option v-for="item in designTables.receivers" :key="item.id" :value="item.id">{{ item.name }}</option>
                </select>
              </label>
              <label class="grid gap-2">
                <span class="text-sm font-semibold text-zinc-700">Mechanism</span>
                <select v-model="draft.design.mechanism" class="h-11 rounded-md border border-zinc-300 bg-white px-3">
                  <option value="">Select mechanism</option>
                  <option v-for="item in designTables.mechanisms" :key="item.id" :value="item.id">{{ item.name }}</option>
                </select>
              </label>
            </div>
            <div class="grid gap-3 md:grid-cols-2">
              <p v-if="selectedReceiver" class="rounded-md bg-stone-50 p-3 text-sm text-zinc-700">{{ itemDescription(selectedReceiver) }}</p>
              <p v-if="selectedMechanism" class="rounded-md bg-stone-50 p-3 text-sm text-zinc-700">{{ itemDescription(selectedMechanism) }}</p>
            </div>
            <div class="grid gap-2">
              <span class="text-sm font-semibold text-zinc-700">Receiver Features</span>
              <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                <button
                  v-for="item in designTables.receiverFeatures"
                  :key="item.id"
                  class="rounded-md border p-3 text-left text-sm"
                  :class="(draft.design.receiverFeatures ?? []).includes(item.id) ? 'border-zinc-950 bg-zinc-950 text-white' : 'border-zinc-300 text-zinc-700 hover:border-amber-600'"
                  type="button"
                  @click="toggleReceiverFeature(item.id)"
                >
                  <span class="font-semibold">{{ item.name }}</span>
                  <span class="mt-1 block text-xs opacity-80">{{ itemDescription(item) }}</span>
                </button>
              </div>
            </div>
          </div>

          <div v-else-if="activeDesignStep === 3" class="mt-5 grid gap-4">
            <div class="grid gap-4 md:grid-cols-2">
              <label class="grid gap-2">
                <span class="text-sm font-semibold text-zinc-700">Barrel</span>
                <select v-model="draft.design.barrel" class="h-11 rounded-md border border-zinc-300 bg-white px-3">
                  <option value="">Select barrel</option>
                  <option v-for="item in designTables.barrels" :key="item.id" :value="item.id">{{ item.name }}</option>
                </select>
              </label>
              <label class="flex items-center gap-3 rounded-md border border-zinc-200 px-3 py-2">
                <input v-model="draft.design.heavyBarrel" class="h-4 w-4 accent-zinc-950" type="checkbox">
                <span class="text-sm font-semibold text-zinc-700">Heavy barrel</span>
              </label>
              <label class="grid gap-2">
                <span class="text-sm font-semibold text-zinc-700">Furniture</span>
                <select v-model="draft.design.furniture" class="h-11 rounded-md border border-zinc-300 bg-white px-3">
                  <option value="">Select furniture</option>
                  <option v-for="item in designTables.furniture" :key="item.id" :value="item.id">{{ item.name }}</option>
                </select>
              </label>
              <label class="grid gap-2">
                <span class="text-sm font-semibold text-zinc-700">Feed Device</span>
                <select v-model="draft.design.feedDevice" class="h-11 rounded-md border border-zinc-300 bg-white px-3">
                  <option value="">Select feed</option>
                  <option v-for="item in designTables.feedDevices" :key="item.id" :value="item.id">{{ item.name }}</option>
                </select>
              </label>
              <label class="grid gap-2">
                <span class="text-sm font-semibold text-zinc-700">Capacity Adjustment %</span>
                <input v-model.number="draft.design.capacityModifierPercent" class="h-11 rounded-md border border-zinc-300 px-3" max="50" min="-50" step="10" type="number">
              </label>
            </div>
            <div class="grid gap-3 md:grid-cols-3">
              <p v-if="selectedBarrel" class="rounded-md bg-stone-50 p-3 text-sm text-zinc-700">{{ itemDescription(selectedBarrel) }}</p>
              <p v-if="selectedFurniture" class="rounded-md bg-stone-50 p-3 text-sm text-zinc-700">{{ itemDescription(selectedFurniture) }}</p>
              <p v-if="selectedFeedDevice" class="rounded-md bg-stone-50 p-3 text-sm text-zinc-700">{{ itemDescription(selectedFeedDevice) }}</p>
            </div>
          </div>

          <div v-else-if="activeDesignStep === 4" class="mt-5 grid gap-4">
            <label class="grid gap-2">
              <span class="text-sm font-semibold text-zinc-700">Special Ammunition</span>
              <select v-model="draft.design.specialAmmunition" class="h-11 rounded-md border border-zinc-300 bg-white px-3">
                <option value="">Ball / standard</option>
                <option v-for="item in designTables.specialAmmunition" :key="item.id" :value="item.id">{{ item.name }}</option>
              </select>
            </label>
            <p v-if="selectedSpecialAmmunition" class="rounded-md bg-stone-50 p-3 text-sm text-zinc-700">{{ itemDescription(selectedSpecialAmmunition) }}</p>
            <div class="grid gap-2">
              <span class="text-sm font-semibold text-zinc-700">Field Catalogue Accessories</span>
              <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                <button
                  v-for="item in designTables.accessories"
                  :key="item.id"
                  class="rounded-md border p-3 text-left text-sm"
                  :class="draft.design.accessories.includes(item.id) ? 'border-zinc-950 bg-zinc-950 text-white' : 'border-zinc-300 text-zinc-700 hover:border-amber-600'"
                  type="button"
                  @click="toggleDesignAccessory(item.id)"
                >
                  <span class="font-semibold">{{ item.name }}</span>
                  <span class="mt-1 block text-xs opacity-80">{{ itemDescription(item) }}</span>
                </button>
              </div>
            </div>
            <div class="grid gap-4 md:grid-cols-2">
              <div class="rounded-md border border-zinc-200 p-4">
                <p class="text-sm font-semibold text-zinc-900">Manual Traits</p>
                <div class="mt-3 flex gap-2">
                  <input v-model="traitInput" class="h-10 min-w-0 flex-1 rounded-md border border-zinc-300 px-3" placeholder="AP 3, Auto 2, Scope">
                  <button class="rounded-md border border-zinc-300 px-3 text-sm font-semibold hover:border-amber-600" type="button" @click="addTrait">Add</button>
                </div>
                <div class="mt-3 flex flex-wrap gap-2">
                  <button v-for="(trait, index) in draft.traits" :key="`${trait}-${index}`" class="rounded-md bg-stone-100 px-3 py-2 text-sm text-zinc-700 hover:bg-red-50 hover:text-red-700" type="button" @click="removeTrait(index)">
                    {{ trait }}
                  </button>
                </div>
              </div>
              <div class="rounded-md border border-zinc-200 p-4">
                <p class="text-sm font-semibold text-zinc-900">Manual Accessories</p>
                <div class="mt-3 flex gap-2">
                  <input v-model="accessoryInput" class="h-10 min-w-0 flex-1 rounded-md border border-zinc-300 px-3" placeholder="Scope, laser sight, bipod">
                  <button class="rounded-md border border-zinc-300 px-3 text-sm font-semibold hover:border-amber-600" type="button" @click="addAccessory">Add</button>
                </div>
                <div class="mt-3 flex flex-wrap gap-2">
                  <button v-for="(accessory, index) in draft.design.accessories" :key="`${accessory}-${index}`" class="rounded-md bg-stone-100 px-3 py-2 text-sm text-zinc-700 hover:bg-red-50 hover:text-red-700" type="button" @click="removeAccessory(index)">
                    {{ accessory }}
                  </button>
                </div>
              </div>
            </div>
            <label class="grid gap-2">
              <span class="text-sm font-semibold text-zinc-700">Design Notes</span>
              <textarea v-model="draft.design.notes" class="min-h-28 rounded-md border border-zinc-300 px-3 py-2" />
            </label>
          </div>

          <div v-else class="mt-5 grid gap-4">
            <div class="rounded-md border border-amber-200 bg-amber-50 p-4">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p class="text-sm font-semibold text-zinc-950">Calculated Design</p>
                  <p class="mt-1 text-sm text-zinc-700">
                    <span v-if="designPreview.ready">
                      {{ designPreview.damage }} · {{ designPreview.range }} · Cr{{ designPreview.costCredits }} · {{ designPreview.massKg }}kg · Magazine {{ designPreview.magazine }} / Cr{{ designPreview.magazineCostCredits }}
                    </span>
                    <span v-else>Select {{ designPreview.missing.join(' and ') }} to calculate Field Catalogue values.</span>
                  </p>
                  <p v-if="designPreview.quickdraw !== null" class="mt-1 text-xs font-semibold text-zinc-600">
                    Quickdraw {{ designPreview.quickdraw }} · Recoil {{ designPreview.recoil }} · Penetration {{ designPreview.penetration }}<span v-if="designPreview.heat !== null"> · Heat {{ designPreview.heat }}</span> · {{ designPreview.traits.join(', ') || 'No traits' }}
                  </p>
                  <div v-if="designPreview.warnings.length" class="mt-3 grid gap-1">
                    <p v-for="warning in designPreview.warnings" :key="warning" class="rounded border border-amber-300 bg-white/70 px-2 py-1 text-xs font-semibold text-amber-900">
                      {{ warning }}
                    </p>
                  </div>
                </div>
                <button class="rounded-md bg-zinc-950 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-300" type="button" :disabled="!designPreview.ready" @click="applyDesignPreview">
                  Apply calculated values
                </button>
              </div>
            </div>
            <div class="grid gap-4 md:grid-cols-3">
              <label class="grid gap-2">
                <span class="text-sm font-semibold text-zinc-700">Range</span>
                <input v-model="draft.range" class="h-11 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
              </label>
              <label class="grid gap-2">
                <span class="text-sm font-semibold text-zinc-700">Damage</span>
                <input v-model="draft.damage" class="h-11 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
              </label>
              <label class="grid gap-2">
                <span class="text-sm font-semibold text-zinc-700">Mass KG</span>
                <input v-model.number="draft.massKg" class="h-11 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" type="number">
              </label>
              <label class="grid gap-2">
                <span class="text-sm font-semibold text-zinc-700">Cost</span>
                <input v-model.number="draft.costCredits" class="h-11 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" type="number">
              </label>
              <label class="grid gap-2">
                <span class="text-sm font-semibold text-zinc-700">Magazine</span>
                <input v-model="draft.magazine" class="h-11 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
              </label>
              <label class="grid gap-2">
                <span class="text-sm font-semibold text-zinc-700">Magazine Cost</span>
                <input v-model.number="draft.magazineCostCredits" class="h-11 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" type="number">
              </label>
            </div>
          </div>

          <div class="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-4">
            <button class="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40" type="button" :disabled="activeDesignStep === 0" @click="previousDesignStep">
              Previous
            </button>
            <button class="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-300" type="button" :disabled="!isStepComplete(activeDesignStep) || activeDesignStep === designSteps.length - 1" @click="nextDesignStep">
              Next
            </button>
          </div>
        </div>
      </section>
    </section>
  </main>
</template>

<style scoped>
.armory-hud {
  min-height: 100vh;
  background:
    linear-gradient(rgba(31, 211, 238, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(31, 211, 238, 0.035) 1px, transparent 1px),
    radial-gradient(circle at 18% 0%, rgba(34, 211, 238, 0.18), transparent 32rem),
    radial-gradient(circle at 86% 18%, rgba(20, 184, 166, 0.12), transparent 30rem),
    linear-gradient(180deg, #07111f 0%, #050914 48%, #030711 100%);
  background-size: 28px 28px, 28px 28px, auto, auto, auto;
}

.armory-hud::before {
  content: "";
  pointer-events: none;
  position: fixed;
  inset: 0;
  z-index: 0;
  background:
    linear-gradient(180deg, transparent 0, rgba(103, 232, 249, 0.035) 50%, transparent 100%),
    repeating-linear-gradient(180deg, rgba(255, 255, 255, 0.025) 0, rgba(255, 255, 255, 0.025) 1px, transparent 1px, transparent 5px);
  mix-blend-mode: screen;
}

.armory-hud > * {
  position: relative;
  z-index: 1;
}

.hud-hero {
  background:
    linear-gradient(90deg, rgba(34, 211, 238, 0.18), transparent 28%, transparent 72%, rgba(20, 184, 166, 0.16)),
    rgba(2, 6, 23, 0.88);
  box-shadow: 0 0 32px rgba(34, 211, 238, 0.12);
}

.hud-kicker,
.armory-hud h1,
.armory-hud h2,
.armory-hud h3 {
  color: #e0fbff;
  text-shadow: 0 0 16px rgba(34, 211, 238, 0.42);
}

.hud-kicker {
  color: #67e8f9;
  letter-spacing: 0.18em;
}

.hud-link,
.armory-hud button {
  border: 1px solid rgba(34, 211, 238, 0.48);
  background:
    linear-gradient(135deg, rgba(34, 211, 238, 0.16), rgba(15, 23, 42, 0.92) 42%, rgba(20, 184, 166, 0.12));
  color: #cffafe;
  box-shadow: inset 0 0 18px rgba(34, 211, 238, 0.08), 0 0 12px rgba(34, 211, 238, 0.08);
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  transition: border-color 140ms ease, box-shadow 140ms ease, color 140ms ease, background 140ms ease;
}

.hud-link:hover,
.armory-hud button:hover:not(:disabled) {
  border-color: rgba(103, 232, 249, 0.92);
  color: #ffffff;
  box-shadow: inset 0 0 22px rgba(34, 211, 238, 0.16), 0 0 18px rgba(34, 211, 238, 0.22);
}

.armory-hud button.bg-white,
.armory-hud button.bg-zinc-950,
.armory-hud button[class*="bg-zinc-950"],
.armory-hud button[class*="bg-white"] {
  border-color: rgba(34, 211, 238, 0.95) !important;
  background:
    linear-gradient(135deg, rgba(34, 211, 238, 0.34), rgba(8, 47, 73, 0.92) 52%, rgba(45, 212, 191, 0.24)) !important;
  color: #ffffff !important;
  box-shadow: inset 0 0 22px rgba(34, 211, 238, 0.24), 0 0 22px rgba(34, 211, 238, 0.2);
}

.hud-tabs button {
  border-bottom-color: rgba(34, 211, 238, 0.48);
  border-radius: 0;
}

.hud-panel {
  position: relative;
  overflow: hidden;
  border-color: rgba(34, 211, 238, 0.52);
  background:
    linear-gradient(180deg, rgba(8, 18, 32, 0.96), rgba(3, 7, 18, 0.96)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.16), transparent 24rem);
  box-shadow:
    0 0 26px rgba(34, 211, 238, 0.13),
    inset 0 0 36px rgba(34, 211, 238, 0.07);
  clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 18px 100%, 0 calc(100% - 18px));
}

.hud-panel::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-top: 1px solid rgba(103, 232, 249, 0.65);
  background:
    linear-gradient(90deg, rgba(34, 211, 238, 0.44), transparent 22%, transparent 78%, rgba(34, 211, 238, 0.38)) top / 100% 2px no-repeat;
}

.armory-hud p,
.armory-hud span,
.armory-hud label,
.armory-hud td {
  color: #bfdbfe;
}

.armory-hud .text-zinc-950,
.armory-hud .text-zinc-900,
.armory-hud .text-zinc-800,
.armory-hud .text-zinc-700,
.armory-hud .text-zinc-600,
.armory-hud .text-zinc-500 {
  color: #bae6fd !important;
}

.armory-hud input,
.armory-hud select,
.armory-hud textarea {
  border-color: rgba(34, 211, 238, 0.45);
  background: rgba(2, 6, 23, 0.72);
  color: #e0fbff;
  box-shadow: inset 0 0 18px rgba(34, 211, 238, 0.08);
}

.armory-hud input::placeholder,
.armory-hud textarea::placeholder {
  color: rgba(186, 230, 253, 0.58);
}

.armory-hud input:focus,
.armory-hud select:focus,
.armory-hud textarea:focus {
  border-color: rgba(103, 232, 249, 0.96);
  box-shadow: 0 0 0 2px rgba(34, 211, 238, 0.24), inset 0 0 18px rgba(34, 211, 238, 0.1);
}

.hud-table-shell {
  border-color: rgba(34, 211, 238, 0.4);
  background: rgba(2, 6, 23, 0.5);
  box-shadow: inset 0 0 28px rgba(34, 211, 238, 0.06);
}

.armory-hud table {
  color: #dffbff;
}

.armory-hud thead {
  background: rgba(8, 47, 73, 0.92);
  color: #67e8f9;
  box-shadow: 0 1px 0 rgba(34, 211, 238, 0.42);
}

.armory-hud th,
.armory-hud td {
  border-color: rgba(34, 211, 238, 0.18);
}

.armory-hud tbody tr {
  border-color: rgba(34, 211, 238, 0.16);
  background: rgba(8, 18, 32, 0.34);
}

.armory-hud tbody tr:hover {
  background: rgba(14, 116, 144, 0.14);
  box-shadow: inset 3px 0 0 rgba(34, 211, 238, 0.85);
}

.armory-hud .bg-white,
.armory-hud .bg-stone-50,
.armory-hud .bg-stone-100,
.armory-hud .bg-amber-50,
.armory-hud .bg-emerald-50 {
  background-color: rgba(8, 18, 32, 0.78) !important;
}

.armory-hud .border-zinc-200,
.armory-hud .border-zinc-300,
.armory-hud .border-amber-200,
.armory-hud .border-emerald-200 {
  border-color: rgba(34, 211, 238, 0.32) !important;
}
</style>
