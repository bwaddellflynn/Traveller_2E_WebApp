<script setup lang="ts">
import { storeToRefs } from 'pinia'
import ArmoryPurchaseConfirmModal from '~/components/character/ArmoryPurchaseConfirmModal.vue'
import type { TravellerArmorRecord, TravellerEquipmentRecord } from '~/types/armory'
import type { TravellerProfile } from '~/types/traveller'
import type { CustomWeaponDesign, TravellerWeaponRecord } from '~/types/weapon'
import { useWeaponsStore } from '~/stores/weapons'
import { useTravellersStore } from '~/stores/travellers'
import { loadBuilderDraft, saveBuilderDraft } from '~/utils/traveller/draftCache'
import { MANUAL_TRAVELLER_DRAFT_CACHE_VERSION, manualTravellerDraftCacheKey } from '~/utils/traveller/manualDraft'
import { cloneTravellerProfile } from '~/utils/traveller/profile'
import { calculateFieldCatalogueWeapon, cloneWeapon, createBlankCustomWeapon, fieldCatalogueComponentSupportsWeaponType, fieldCatalogueDesign, getFieldCatalogueSelectionWarnings, makeWeaponId, resolveWeaponFamily, resolveWeaponFamilyIcon, resolveWeaponIconName } from '~/utils/traveller/weapons'
import weaponSidearmIconUrl from '~/assets/weapon_icon_svgs/weapon_sidearm_icon_24.svg?url'
import weaponRevolverIconUrl from '~/assets/weapon_icon_svgs/weapon_revolver_icon_24.svg?url'
import weaponSmgIconUrl from '~/assets/weapon_icon_svgs/weapon_smg_icon_24.svg?url'
import weaponLongarmIconUrl from '~/assets/weapon_icon_svgs/weapon_longarm_icon_24.svg?url'
import weaponShotgunIconUrl from '~/assets/weapon_icon_svgs/weapon_shotgun_icon_24.svg?url'
import weaponSniperIconUrl from '~/assets/weapon_icon_svgs/weapon_sniper_icon_24.svg?url'
import weaponSupportIconUrl from '~/assets/weapon_icon_svgs/weapon_support_icon_24.svg?url'
import weaponHeavyIconUrl from '~/assets/weapon_icon_svgs/weapon_heavy_icon_24.svg?url'
import weaponChaingunIconUrl from '~/assets/weapon_icon_svgs/weapon_chaingun_icon_24.svg?url'
import weaponLauncherIconUrl from '~/assets/weapon_icon_svgs/weapon_launcher_icon_24.svg?url'
import weaponLauncherGrenadeIconUrl from '~/assets/weapon_icon_svgs/weapon_launcher_grenade_icon_24.svg?url'
import weaponGrenadeIconUrl from '~/assets/weapon_icon_svgs/weapon_grenade_icon_24.svg?url'
import weaponChargeIconUrl from '~/assets/weapon_icon_svgs/weapon_charge_icon_24.svg?url'
import weaponMineIconUrl from '~/assets/weapon_icon_svgs/weapon_mine_icon_24.svg?url'
import weaponFlamerIconUrl from '~/assets/weapon_icon_svgs/weapon_flamer_icon_24.svg?url'
import weaponEnergySidearmIconUrl from '~/assets/weapon_icon_svgs/weapon_energy_sidearm_icon_24.svg?url'
import weaponEnergyLongarmIconUrl from '~/assets/weapon_icon_svgs/weapon_energy_longarm_icon_24.svg?url'
import weaponEnergySniperIconUrl from '~/assets/weapon_icon_svgs/weapon_energy_sniper_icon_24.svg?url'
import weaponGaussSidearmIconUrl from '~/assets/weapon_icon_svgs/weapon_gauss_sidearm_icon_24.svg?url'
import weaponGaussLongarmIconUrl from '~/assets/weapon_icon_svgs/weapon_gauss_longarm_icon_24.svg?url'
import weaponEmplacedIconUrl from '~/assets/weapon_icon_svgs/weapon_emplaced_icon_24.svg?url'

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

type WeaponSortKey = 'name' | 'skill' | 'techLevel' | 'range' | 'damage' | 'massKg' | 'costCredits' | 'traits'
type ArmorSortKey = 'name' | 'protection' | 'techLevel' | 'radiationProtection' | 'massKg' | 'costCredits' | 'requiredSkill'
type EquipmentSortKey = 'name' | 'category' | 'techLevel' | 'massKg' | 'costCredits' | 'effect'
type WeaponSortIcon = 'sort-asc' | 'sort-desc'
type PendingArmoryPurchase =
  | { kind: 'reference-weapon'; item: TravellerWeaponRecord }
  | { kind: 'saved-weapon'; item: CustomWeaponDesign }
  | { kind: 'designed-weapon'; item: CustomWeaponDesign }
  | { kind: 'armor'; item: TravellerArmorRecord }
  | { kind: 'equipment'; item: TravellerEquipmentRecord }
type TravellerVoucher = { id: string; name: string; notes?: string; benefitType: string }

type WeaponBuilderDraftCache = {
  draft: CustomWeaponDesign
  activeDesignStep: number
  traitInput: string
  accessoryInput: string
}

const WEAPON_BUILDER_DRAFT_CACHE_KEY = 'scoutsuite.builder.weapon.v1'
const WEAPON_BUILDER_DRAFT_CACHE_VERSION = 1

const weaponsStore = useWeaponsStore()
const travellersStore = useTravellersStore()
const { referenceWeapons, referenceArmor, referenceEquipment, userWeapons } = storeToRefs(weaponsStore)
const { activeProfile } = storeToRefs(travellersStore)
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
const deleteWeaponConfirmOpen = ref(false)
const traitInput = ref('')
const accessoryInput = ref('')
const weaponBuilderDraftRestored = ref(false)
const pendingPurchase = ref<PendingArmoryPurchase | null>(null)
const selectedVoucherId = ref('')

const normalizeDraft = (weapon: CustomWeaponDesign) => {
  if (weapon.design.targetTechLevel === null || weapon.design.targetTechLevel === undefined) {
    weapon.design.targetTechLevel = weapon.techLevel ?? 8
  }
  if (!weapon.category) weapon.category = 'slug'
  if (!weapon.skill) weapon.skill = 'gun-combat'
  if (!weapon.speciality) weapon.speciality = 'slug'
  return weapon
}

onMounted(() => {
  weaponsStore.loadWeapons()
  void travellersStore.loadProfiles()

  const cachedDraft = loadBuilderDraft<WeaponBuilderDraftCache>(
    WEAPON_BUILDER_DRAFT_CACHE_KEY,
    WEAPON_BUILDER_DRAFT_CACHE_VERSION,
  )

  if (cachedDraft?.draft) {
    draft.value = normalizeDraft(cloneWeapon(cachedDraft.draft))
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
  { id: 'finish', label: 'Finish', title: 'Finish', description: 'Inspect the finished package, review traits and warnings, and save the completed custom weapon.' },
]

const designTables = fieldCatalogueDesign.componentTables as DesignTables
const designPreview = computed(() => calculateFieldCatalogueWeapon(draft.value))
const isDirectExplosiveBuild = computed(() => draft.value.design.weaponType === 'grenade' && ['grenade', 'explosive'].includes(draft.value.category))

const builderCategoryOptions = [
  { id: 'melee', label: 'Melee' },
  { id: 'slug', label: 'Slug' },
  { id: 'energy', label: 'Energy' },
  { id: 'grenade', label: 'Grenade' },
  { id: 'explosive', label: 'Explosive' },
  { id: 'support', label: 'Support' },
  { id: 'heavy', label: 'Heavy' },
  { id: 'other', label: 'Other' },
]

const skillOptionsByCategory: Record<string, string[]> = {
  melee: ['melee'],
  slug: ['gun-combat'],
  energy: ['gun-combat'],
  grenade: ['athletics'],
  explosive: ['explosives'],
  support: ['gun-combat', 'heavy-weapons'],
  heavy: ['gun-combat', 'heavy-weapons'],
  other: ['gun-combat', 'athletics', 'explosives', 'heavy-weapons', 'melee'],
}

const specialityOptionsBySkill: Record<string, string[]> = {
  melee: ['blade', 'bludgeon', 'natural', 'unarmed'],
  'gun-combat': ['archaic', 'energy', 'slug'],
  athletics: ['dexterity'],
  explosives: ['demolitions'],
  'heavy-weapons': ['portable', 'vehicle'],
}

const categoriesByWeaponType: Record<string, string[]> = {
  projectile: ['slug', 'support', 'heavy', 'other'],
  energy: ['energy', 'support', 'heavy', 'other'],
  grenade: ['grenade', 'explosive', 'heavy', 'other'],
}

const sortableWeaponColumns: { key: WeaponSortKey, label: string }[] = [
  { key: 'name', label: 'Weapon' },
  { key: 'skill', label: 'Skill' },
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

const weaponSkillLabel = (weapon: TravellerWeaponRecord) => {
  if (weapon.skill && weapon.speciality) return `${weapon.skill} (${weapon.speciality})`
  return weapon.skill ?? weapon.speciality ?? '-'
}

const titleCaseLabel = (value: string) => value
  .split(/[-\s]+/)
  .filter(Boolean)
  .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
  .join(' ')

const sortReferenceWeapons = (weapons: TravellerWeaponRecord[]) => {
  const direction = weaponSortDirection.value === 'asc' ? 1 : -1
  const key = weaponSortKey.value

  return [...weapons].sort((first, second) => {
    const firstValue = key === 'name'
      ? weaponDisplayName(first)
      : key === 'traits'
        ? first.traits.join(', ')
        : key === 'skill'
          ? weaponSkillLabel(first)
          : first[key]
    const secondValue = key === 'name'
      ? weaponDisplayName(second)
      : key === 'traits'
        ? second.traits.join(', ')
        : key === 'skill'
          ? weaponSkillLabel(second)
          : second[key]

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

const activeTravellerDraftProfile = computed<TravellerProfile | null>(() => {
  if (!activeProfile.value) return null
  return loadBuilderDraft<TravellerProfile>(
    manualTravellerDraftCacheKey(activeProfile.value.id),
    MANUAL_TRAVELLER_DRAFT_CACHE_VERSION,
  )
})

const activeTravellerSourceProfile = computed<TravellerProfile | null>(() => {
  if (activeTravellerDraftProfile.value) return activeTravellerDraftProfile.value
  return activeProfile.value ? cloneTravellerProfile(activeProfile.value) : null
})
const activeTravellerCredits = computed(() => Number(activeTravellerSourceProfile.value?.finances.cashOnHand) || 0)
const activeTravellerVouchers = computed<TravellerVoucher[]>(() => {
  const equipment = activeTravellerSourceProfile.value?.equipment ?? []
  return equipment
    .filter((item) => /voucher$/i.test(item.name) || /voucher/i.test(item.notes ?? ''))
    .map((item) => ({
      id: item.id,
      name: item.name,
      notes: item.notes,
      benefitType: item.name.replace(/\s+voucher$/i, '').trim().toLowerCase(),
    }))
})

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
  if (item.autoModifier) rules.push(`Auto ${signedNumber(item.autoModifier)}`)
  if (item.heatDissipationModifier) rules.push(`Cooling ${signedNumber(item.heatDissipationModifier)}`)
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

const buildTechLevel = computed<number | null>(() => {
  const componentIds = [
    draft.value.design.weaponType && ['weaponTypes', draft.value.design.weaponType] as const,
    draft.value.design.ammunitionType && ['ammunitionTypes', draft.value.design.ammunitionType] as const,
    draft.value.design.receiverType && ['receivers', draft.value.design.receiverType] as const,
    draft.value.design.mechanism && ['mechanisms', draft.value.design.mechanism] as const,
    draft.value.design.barrel && ['barrels', draft.value.design.barrel] as const,
    draft.value.design.furniture && ['furniture', draft.value.design.furniture] as const,
    draft.value.design.feedDevice && ['feedDevices', draft.value.design.feedDevice] as const,
    draft.value.design.specialAmmunition && ['specialAmmunition', draft.value.design.specialAmmunition] as const,
    ...(draft.value.design.receiverFeatures ?? []).map((id) => ['receiverFeatures', id] as const),
    ...(draft.value.design.accessories ?? []).map((id) => ['accessories', id] as const),
  ].filter(Boolean) as [keyof DesignTables, string][]

  let highest: number | null = null

  for (const [tableKey, id] of componentIds) {
    const item = selectedItem(designTables[tableKey], id)
    if (typeof item?.techLevel !== 'number') continue
    highest = highest === null ? item.techLevel : Math.max(highest, item.techLevel)
  }

  return highest
})

const builderSkillOptions = computed(() => {
  const category = draft.value.category || 'slug'
  return skillOptionsByCategory[category] ?? ['gun-combat']
})

const builderSpecialityOptions = computed(() => {
  const skill = draft.value.skill || 'gun-combat'
  return specialityOptionsBySkill[skill] ?? []
})

const filteredCategoryOptions = computed(() => {
  const weaponType = draft.value.design.weaponType
  const allowedIds = categoriesByWeaponType[weaponType] ?? builderCategoryOptions.map((item) => item.id)
  return builderCategoryOptions.filter((item) => allowedIds.includes(item.id))
})

const filterDesignTableByWeaponType = <T extends DesignTableItem>(items: T[], tableKey: keyof DesignTables) => {
  const weaponType = draft.value.design.weaponType
  if (!weaponType) return items
  return items.filter((item) => fieldCatalogueComponentSupportsWeaponType(tableKey as any, item, weaponType))
}

const filteredAmmunitionOptions = computed(() => filterDesignTableByWeaponType(designTables.ammunitionTypes, 'ammunitionTypes'))
const filteredReceiverOptions = computed(() => filterDesignTableByWeaponType(designTables.receivers, 'receivers'))
const filteredMechanismOptions = computed(() => filterDesignTableByWeaponType(designTables.mechanisms, 'mechanisms'))
const filteredBarrelOptions = computed(() => filterDesignTableByWeaponType(designTables.barrels, 'barrels'))
const filteredFurnitureOptions = computed(() => filterDesignTableByWeaponType(designTables.furniture, 'furniture'))
const filteredFeedDeviceOptions = computed(() => filterDesignTableByWeaponType(designTables.feedDevices, 'feedDevices'))
const filteredSpecialAmmunitionOptions = computed(() => filterDesignTableByWeaponType(designTables.specialAmmunition, 'specialAmmunition'))

const builderCostLabel = computed(() => {
  if (!draft.value.design.ammunitionType) return '—'
  if (!isDirectExplosiveBuild.value && !draft.value.design.receiverType) return '—'
  return formatCredits(designPreview.value.costCredits)
})

const resolvedWeaponFamily = computed(() => resolveWeaponFamily(draft.value))
const finalWeaponIconName = computed(() => resolveWeaponFamilyIcon(resolvedWeaponFamily.value))
const resolvedWeaponAssetIconName = computed(() => resolveWeaponIconName(draft.value))
const weaponAssetIconUrls: Record<string, string> = {
  'weapon-sidearm': weaponSidearmIconUrl,
  'weapon-revolver': weaponRevolverIconUrl,
  'weapon-smg': weaponSmgIconUrl,
  'weapon-longarm': weaponLongarmIconUrl,
  'weapon-shotgun': weaponShotgunIconUrl,
  'weapon-sniper': weaponSniperIconUrl,
  'weapon-support': weaponSupportIconUrl,
  'weapon-heavy': weaponHeavyIconUrl,
  'weapon-chaingun': weaponChaingunIconUrl,
  'weapon-launcher': weaponLauncherIconUrl,
  'weapon-launcher-grenade': weaponLauncherGrenadeIconUrl,
  'weapon-grenade': weaponGrenadeIconUrl,
  'weapon-charge': weaponChargeIconUrl,
  'weapon-mine': weaponMineIconUrl,
  'weapon-flamer': weaponFlamerIconUrl,
  'weapon-energy-sidearm': weaponEnergySidearmIconUrl,
  'weapon-energy-longarm': weaponEnergyLongarmIconUrl,
  'weapon-energy-sniper': weaponEnergySniperIconUrl,
  'weapon-gauss-sidearm': weaponGaussSidearmIconUrl,
  'weapon-gauss-longarm': weaponGaussLongarmIconUrl,
  'weapon-emplaced': weaponEmplacedIconUrl,
}
const finalWeaponAssetIconUrl = computed(() => {
  return weaponAssetIconUrls[resolvedWeaponAssetIconName.value] ?? ''
})

watch(
  () => draft.value.design.weaponType,
  (weaponType) => {
    const allowedCategories = categoriesByWeaponType[weaponType] ?? builderCategoryOptions.map((item) => item.id)
    if (!allowedCategories.includes(draft.value.category)) {
      draft.value.category = allowedCategories[0] ?? 'slug'
    }
    if (!filteredAmmunitionOptions.value.some((item) => item.id === draft.value.design.ammunitionType)) {
      draft.value.design.ammunitionType = ''
    }
    if (!filteredReceiverOptions.value.some((item) => item.id === draft.value.design.receiverType)) {
      draft.value.design.receiverType = ''
    }
    if (!filteredMechanismOptions.value.some((item) => item.id === draft.value.design.mechanism)) {
      draft.value.design.mechanism = weaponType === 'grenade' ? 'detonated' : 'semi-automatic'
    }
    if (!filteredBarrelOptions.value.some((item) => item.id === draft.value.design.barrel)) {
      draft.value.design.barrel = ''
    }
    if (!filteredFurnitureOptions.value.some((item) => item.id === draft.value.design.furniture)) {
      draft.value.design.furniture = ''
    }
    if (!filteredFeedDeviceOptions.value.some((item) => item.id === draft.value.design.feedDevice)) {
      draft.value.design.feedDevice = ''
    }
    if (!filteredSpecialAmmunitionOptions.value.some((item) => item.id === draft.value.design.specialAmmunition)) {
      draft.value.design.specialAmmunition = ''
    }
  },
  { immediate: true },
)

watch(
  () => draft.value.category,
  (category) => {
    const nextCategory = category || 'slug'
    const allowedSkills = skillOptionsByCategory[nextCategory] ?? ['gun-combat']
    if (draft.value.design.weaponType === 'grenade') {
      if (['grenade', 'explosive'].includes(nextCategory)) {
        draft.value.design.mechanism = 'detonated'
        draft.value.design.receiverType = ''
        draft.value.design.barrel = ''
        draft.value.design.furniture = ''
        draft.value.design.feedDevice = ''
      } else if (draft.value.design.mechanism === 'detonated') {
        draft.value.design.mechanism = 'single-shot'
      }
    }
    if (!allowedSkills.includes(draft.value.skill)) {
      draft.value.skill = allowedSkills[0] ?? 'gun-combat'
    }
  },
  { immediate: true },
)

watch(
  () => draft.value.skill,
  (skill) => {
    const allowedSpecialties = specialityOptionsBySkill[skill || 'gun-combat'] ?? []
    if (!allowedSpecialties.includes(draft.value.speciality)) {
      draft.value.speciality = allowedSpecialties[0] ?? ''
    }
  },
  { immediate: true },
)

const clampDesignTechLevel = (value: number | null | undefined) => {
  const numeric = Number(value ?? 0)
  if (!Number.isFinite(numeric)) return 0
  return Math.min(18, Math.max(0, Math.round(numeric)))
}

const onDesignTechLevelWheel = (event: WheelEvent) => {
  event.preventDefault()
  const delta = event.deltaY > 0 ? -1 : 1
  draft.value.design.targetTechLevel = clampDesignTechLevel((draft.value.design.targetTechLevel ?? 0) + delta)
}

const adjustDesignTechLevel = (delta: number) => {
  draft.value.design.targetTechLevel = clampDesignTechLevel((draft.value.design.targetTechLevel ?? 0) + delta)
}

const onDesignTechLevelInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  draft.value.design.targetTechLevel = clampDesignTechLevel(Number(target.value))
}

const onDesignTechLevelKeydown = (event: KeyboardEvent) => {
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    adjustDesignTechLevel(1)
    return
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    adjustDesignTechLevel(-1)
  }
}

const selectedWeaponType = computed(() => selectedItem(designTables.weaponTypes, draft.value.design.weaponType))
const selectedAmmunition = computed(() => selectedItem(designTables.ammunitionTypes, draft.value.design.ammunitionType))
const selectedSpecialAmmunition = computed(() => selectedItem(designTables.specialAmmunition, draft.value.design.specialAmmunition))
const selectedReceiver = computed(() => selectedItem(designTables.receivers, draft.value.design.receiverType))
const selectedMechanism = computed(() => selectedItem(designTables.mechanisms, draft.value.design.mechanism))
const selectedBarrel = computed(() => selectedItem(designTables.barrels, draft.value.design.barrel))
const selectedFurniture = computed(() => selectedItem(designTables.furniture, draft.value.design.furniture))
const selectedFeedDevice = computed(() => selectedItem(designTables.feedDevices, draft.value.design.feedDevice))

const selectionWarnings = (tableKey: 'mechanisms' | 'receiverFeatures' | 'specialAmmunition' | 'accessories', id: string) => (
  getFieldCatalogueSelectionWarnings(draft.value, tableKey, id)
)

const canSelectChoice = (
  tableKey: 'mechanisms' | 'receiverFeatures' | 'specialAmmunition' | 'accessories',
  id: string,
  selected = false,
) => selected || selectionWarnings(tableKey, id).length === 0

const accessoryWarnings = (id: string) => selectionWarnings('accessories', id)

const canToggleAccessory = (id: string) => (
  canSelectChoice('accessories', id, draft.value.design.accessories.includes(id))
)

const isStepComplete = (index: number) => {
  const design = draft.value.design
  if (index === 0) return Boolean(draft.value.name.trim() && design.weaponType)
  if (index === 1) return Boolean(design.ammunitionType)
  if (index === 2) return isDirectExplosiveBuild.value || Boolean(design.receiverType && design.mechanism)
  if (index === 3) return isDirectExplosiveBuild.value || Boolean(design.barrel && design.furniture && design.feedDevice)
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

const buildPersistedWeaponDraft = () => {
  const preview = designPreview.value
  const nextDraft = normalizeDraft(cloneWeapon(draft.value))
  nextDraft.techLevel = buildTechLevel.value ?? nextDraft.design.targetTechLevel ?? nextDraft.techLevel
  nextDraft.family = resolveWeaponFamily(nextDraft)
  nextDraft.iconName = resolveWeaponIconName(nextDraft)

  if (preview.ready) {
    nextDraft.range = preview.range
    nextDraft.damage = preview.damage
    nextDraft.massKg = preview.massKg
    nextDraft.costCredits = preview.costCredits
    nextDraft.magazine = preview.magazine
    nextDraft.magazineCostCredits = preview.magazineCostCredits
    nextDraft.traits = preview.traits
  }

  return nextDraft
}

const editWeapon = (weapon: CustomWeaponDesign) => {
  draft.value = normalizeDraft(cloneWeapon(weapon))
  activeArmoryTab.value = 'create'
  activeDesignStep.value = 0
  saveMessage.value = ''
}

const newWeapon = () => {
  draft.value = normalizeDraft(createBlankCustomWeapon(weaponsStore.activeUserId))
  activeArmoryTab.value = 'create'
  activeDesignStep.value = 0
  saveMessage.value = ''
}

const saveWeapon = () => {
  const saved = weaponsStore.saveCustomWeapon(buildPersistedWeaponDraft())
  draft.value = cloneWeapon(saved)
  saveMessage.value = `Saved ${saved.name}`
}

const canBuyCompletedWeapon = computed(() => Boolean(
  designPreview.value.ready
  && activeProfile.value
  && designPreview.value.costCredits <= activeTravellerCredits.value,
))

const buyCompletedWeaponDisabledReason = computed(() => {
  if (!designPreview.value.ready) return 'Complete the design first.'
  if (!activeProfile.value) return 'Select a Traveller to enable purchases.'
  if (designPreview.value.costCredits > activeTravellerCredits.value) return 'Selected Traveller does not have enough credits.'
  return ''
})

const canAffordPurchase = (costCredits: number | null) => (
  Boolean(activeProfile.value && costCredits !== null && costCredits <= activeTravellerCredits.value)
)

const hasMatchingVoucherForPurchase = (purchase: PendingArmoryPurchase) => {
  return activeTravellerVouchers.value.some((voucher) => {
    const type = voucher.benefitType
    if (purchase.kind === 'armor') return type === 'armour'
    if (purchase.kind === 'equipment') return type === 'scientific equipment'
    const category = purchase.item.category
    if (type === 'weapon') return true
    if (type === 'blade') return category === 'melee'
    if (type === 'gun') return category !== 'melee'
    return false
  })
}

const buyReferenceWeaponDisabledReason = (weapon: TravellerWeaponRecord) => {
  if (!activeProfile.value) return 'Select a Traveller to enable purchases.'
  if (weapon.costCredits === null) return 'This weapon does not have a purchase cost.'
  if (hasMatchingVoucherForPurchase({ kind: 'reference-weapon', item: weapon })) return ''
  if (weapon.costCredits > activeTravellerCredits.value) return 'Selected Traveller does not have enough credits.'
  return ''
}

const buyArmorDisabledReason = (armor: TravellerArmorRecord) => {
  if (!activeProfile.value) return 'Select a Traveller to enable purchases.'
  if (armor.costCredits === null) return 'This armour does not have a purchase cost.'
  if (hasMatchingVoucherForPurchase({ kind: 'armor', item: armor })) return ''
  if (armor.costCredits > activeTravellerCredits.value) return 'Selected Traveller does not have enough credits.'
  return ''
}

const buyEquipmentDisabledReason = (item: TravellerEquipmentRecord) => {
  if (!activeProfile.value) return 'Select a Traveller to enable purchases.'
  if (item.costCredits === null) return 'This equipment does not have a purchase cost.'
  if (hasMatchingVoucherForPurchase({ kind: 'equipment', item })) return ''
  if (item.costCredits > activeTravellerCredits.value) return 'Selected Traveller does not have enough credits.'
  return ''
}

const buySavedWeaponDisabledReason = (weapon: CustomWeaponDesign) => {
  if (!activeProfile.value) return 'Select a Traveller to enable purchases.'
  if (weapon.costCredits === null) return 'This weapon does not have a purchase cost.'
  if (hasMatchingVoucherForPurchase({ kind: 'saved-weapon', item: weapon })) return ''
  if (weapon.costCredits > activeTravellerCredits.value) return 'Selected Traveller does not have enough credits.'
  return ''
}

const openPurchaseConfirmation = (purchase: PendingArmoryPurchase) => {
  pendingPurchase.value = purchase
  selectedVoucherId.value = ''
}

const closePurchaseConfirmation = () => {
  pendingPurchase.value = null
  selectedVoucherId.value = ''
}

const pendingPurchaseCost = computed(() => pendingPurchase.value?.item.costCredits ?? 0)
const pendingPurchaseItemName = computed(() => pendingPurchase.value?.item.name ?? '')
const pendingPurchaseTypeLabel = computed(() => {
  const purchase = pendingPurchase.value
  if (!purchase) return ''
  if (purchase.kind === 'armor') return 'Armour'
  if (purchase.kind === 'equipment') return 'Equipment'
  return 'Weapon'
})

const pendingPurchaseMatchingVouchers = computed<TravellerVoucher[]>(() => {
  const purchase = pendingPurchase.value
  if (!purchase) return []
  return activeTravellerVouchers.value.filter((voucher) => {
    const type = voucher.benefitType
    if (purchase.kind === 'armor') return type === 'armour'
    if (purchase.kind === 'equipment') return type === 'scientific equipment'

    if (purchase.kind === 'reference-weapon' || purchase.kind === 'saved-weapon') {
      const category = purchase.item.category
      if (type === 'weapon') return true
      if (type === 'blade') return category === 'melee'
      if (type === 'gun') return category !== 'melee'
    }
    return false
  })
})

const pendingPurchaseRemainingCredits = computed(() => {
  if (selectedVoucherId.value) return activeTravellerCredits.value
  return Math.max(0, activeTravellerCredits.value - pendingPurchaseCost.value)
})

const persistUpdatedTravellerDraft = (profile: ReturnType<typeof cloneTravellerProfile>) => {
  saveBuilderDraft(
    manualTravellerDraftCacheKey(profile.id),
    MANUAL_TRAVELLER_DRAFT_CACHE_VERSION,
    cloneTravellerProfile(profile),
  )
}

const removeVoucherFromEquipment = (equipment: TravellerProfile['equipment']) => {
  if (!selectedVoucherId.value) return equipment
  return equipment.filter((item) => item.id !== selectedVoucherId.value)
}

const saveArmoryPurchaseToActiveTraveller = async (updater: (profile: TravellerProfile) => TravellerProfile) => {
  const baseProfile = activeTravellerSourceProfile.value
  if (!baseProfile) return null
  const updatedProfile = await travellersStore.saveProfile(updater(cloneTravellerProfile(baseProfile)))
  persistUpdatedTravellerDraft(updatedProfile)
  return updatedProfile
}

const addCompletedWeaponToActiveTraveller = async () => {
  if (!designPreview.value || !activeProfile.value) return
  if (!selectedVoucherId.value && designPreview.value.costCredits > activeTravellerCredits.value) return

  const finalizedWeapon = weaponsStore.saveCustomWeapon(buildPersistedWeaponDraft())
  const updatedProfile = await saveArmoryPurchaseToActiveTraveller((profile) => ({
    ...profile,
    weapons: [
      {
        id: makeWeaponId(),
        name: finalizedWeapon.name,
        techLevel: finalizedWeapon.techLevel === null ? undefined : String(finalizedWeapon.techLevel),
        range: finalizedWeapon.range,
        damage: finalizedWeapon.damage,
        kg: finalizedWeapon.massKg === null ? undefined : String(finalizedWeapon.massKg),
        magazine: finalizedWeapon.magazine,
        traits: finalizedWeapon.traits.join(', '),
        notes: `Purchased from Armory${finalizedWeapon.family ? ` · ${titleCaseLabel(finalizedWeapon.family)}` : ''}`,
      },
      ...profile.weapons,
    ],
    equipment: removeVoucherFromEquipment(profile.equipment),
    finances: {
      ...profile.finances,
      cashOnHand: Math.max(0, profile.finances.cashOnHand - (selectedVoucherId.value ? 0 : designPreview.value.costCredits)),
    },
  }))
  if (!updatedProfile) return
  saveMessage.value = `Added ${finalizedWeapon.name} to ${activeProfile.value.identity.name || 'Traveller'}`
}

const purchaseReferenceWeapon = async (weapon: TravellerWeaponRecord) => {
  if (!activeProfile.value || weapon.costCredits === null) return
  if (!selectedVoucherId.value && weapon.costCredits > activeTravellerCredits.value) return
  const updatedProfile = await saveArmoryPurchaseToActiveTraveller((profile) => ({
    ...profile,
    weapons: [
      {
        id: makeWeaponId(),
        name: weapon.name,
        techLevel: weapon.techLevel === null ? undefined : String(weapon.techLevel),
        range: weapon.range,
        damage: weapon.damage,
        kg: weapon.massKg === null ? undefined : String(weapon.massKg),
        magazine: weapon.magazine,
        traits: weapon.traits.join(', '),
        notes: `Purchased from Armory${weapon.sourceName ? ` · ${weapon.sourceName}` : ''}`,
      },
      ...profile.weapons,
    ],
    equipment: removeVoucherFromEquipment(profile.equipment),
    finances: {
      ...profile.finances,
      cashOnHand: Math.max(0, profile.finances.cashOnHand - (selectedVoucherId.value ? 0 : weapon.costCredits)),
    },
  }))
  if (!updatedProfile) return
  saveMessage.value = `Purchased ${weapon.name} for ${activeProfile.value.identity.name || 'Traveller'}`
}

const purchaseSavedWeapon = async (weapon: CustomWeaponDesign) => {
  if (!activeProfile.value || weapon.costCredits === null) return
  if (!selectedVoucherId.value && weapon.costCredits > activeTravellerCredits.value) return
  const updatedProfile = await saveArmoryPurchaseToActiveTraveller((profile) => ({
    ...profile,
    weapons: [
      {
        id: makeWeaponId(),
        name: weapon.name,
        techLevel: weapon.techLevel === null ? undefined : String(weapon.techLevel),
        range: weapon.range,
        damage: weapon.damage,
        kg: weapon.massKg === null ? undefined : String(weapon.massKg),
        magazine: weapon.magazine,
        traits: weapon.traits.join(', '),
        notes: `Purchased from Armory${weapon.family ? ` · ${titleCaseLabel(weapon.family)}` : ''}`,
      },
      ...profile.weapons,
    ],
    equipment: removeVoucherFromEquipment(profile.equipment),
    finances: {
      ...profile.finances,
      cashOnHand: Math.max(0, profile.finances.cashOnHand - (selectedVoucherId.value ? 0 : weapon.costCredits)),
    },
  }))
  if (!updatedProfile) return
  saveMessage.value = `Purchased ${weapon.name} for ${activeProfile.value.identity.name || 'Traveller'}`
}

const purchaseArmor = async (armor: TravellerArmorRecord) => {
  if (!activeProfile.value || armor.costCredits === null) return
  if (!selectedVoucherId.value && armor.costCredits > activeTravellerCredits.value) return
  const updatedProfile = await saveArmoryPurchaseToActiveTraveller((profile) => ({
    ...profile,
    armour: [
      {
        id: `armour-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: armor.name,
        type: titleCaseLabel(armor.category),
        techLevel: armor.techLevel === null ? undefined : String(armor.techLevel),
        protection: armor.protection,
        radiationProtection: armor.radiationProtection ?? undefined,
        kg: armor.massKg === null ? undefined : String(armor.massKg),
        options: armor.requiredSkill ? `Required skill: ${armor.requiredSkill}` : '',
        traits: armor.traits.join(', '),
        notes: `Purchased from Armory${armor.sourceName ? ` · ${armor.sourceName}` : ''}`,
      },
      ...profile.armour,
    ],
    equipment: removeVoucherFromEquipment(profile.equipment),
    finances: {
      ...profile.finances,
      cashOnHand: Math.max(0, profile.finances.cashOnHand - (selectedVoucherId.value ? 0 : armor.costCredits)),
    },
  }))
  if (!updatedProfile) return
  saveMessage.value = `Purchased ${armor.name} for ${activeProfile.value.identity.name || 'Traveller'}`
}

const purchaseEquipment = async (item: TravellerEquipmentRecord) => {
  if (!activeProfile.value || item.costCredits === null) return
  if (!selectedVoucherId.value && item.costCredits > activeTravellerCredits.value) return
  const updatedProfile = await saveArmoryPurchaseToActiveTraveller((profile) => ({
    ...profile,
    equipment: [
      {
        id: `equipment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: item.name,
        techLevel: item.techLevel === null ? undefined : String(item.techLevel),
        kg: item.massKg === null ? undefined : String(item.massKg),
        traits: item.traits.join(', '),
        notes: [item.effect, item.sourceName ? `Purchased from ${item.sourceName}` : 'Purchased from Armory'].filter(Boolean).join(' · '),
      },
      ...removeVoucherFromEquipment(profile.equipment),
    ],
    finances: {
      ...profile.finances,
      cashOnHand: Math.max(0, profile.finances.cashOnHand - (selectedVoucherId.value ? 0 : item.costCredits)),
    },
  }))
  if (!updatedProfile) return
  saveMessage.value = `Purchased ${item.name} for ${activeProfile.value.identity.name || 'Traveller'}`
}

const confirmPendingPurchase = async () => {
  const purchase = pendingPurchase.value
  if (!purchase) return
  pendingPurchase.value = null
  if (purchase.kind === 'reference-weapon') await purchaseReferenceWeapon(purchase.item)
  else if (purchase.kind === 'saved-weapon') await purchaseSavedWeapon(purchase.item)
  else if (purchase.kind === 'designed-weapon') await addCompletedWeaponToActiveTraveller()
  else if (purchase.kind === 'armor') await purchaseArmor(purchase.item)
  else await purchaseEquipment(purchase.item)
}

const duplicateWeapon = () => {
  const saved = weaponsStore.saveCustomWeapon(buildPersistedWeaponDraft())
  const copy = weaponsStore.duplicateCustomWeapon(saved.id)
  if (!copy) return
  draft.value = cloneWeapon(copy)
  activeDesignStep.value = 0
  saveMessage.value = `Duplicated ${copy.name}`
}

const requestDeleteWeapon = () => {
  deleteWeaponConfirmOpen.value = true
}

const cancelDeleteWeapon = () => {
  deleteWeaponConfirmOpen.value = false
}

const confirmDeleteWeapon = () => {
  weaponsStore.deleteCustomWeapon(draft.value.id)
  deleteWeaponConfirmOpen.value = false
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

const handleAccessoryChoice = (id: string) => {
  if (!canToggleAccessory(id)) return
  toggleDesignAccessory(id)
}

const toggleReceiverFeature = (id: string) => {
  const current = draft.value.design.receiverFeatures ?? []
  draft.value.design.receiverFeatures = current.includes(id)
    ? current.filter((item) => item !== id)
    : [...current, id]
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
    <ArmoryPurchaseConfirmModal
      :current-credits="activeTravellerCredits"
      :item-cost="pendingPurchaseCost"
      :item-name="pendingPurchaseItemName"
      :item-type-label="pendingPurchaseTypeLabel"
      :matching-vouchers="pendingPurchaseMatchingVouchers"
      :open="Boolean(pendingPurchase)"
      :remaining-credits="pendingPurchaseRemainingCredits"
      :selected-voucher-id="selectedVoucherId"
      :traveller-name="activeProfile?.identity.name || 'Traveller'"
      @close="closePurchaseConfirmation"
      @confirm="confirmPendingPurchase"
      @select-voucher="selectedVoucherId = $event"
    />

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
                  <th v-if="activeProfile" class="px-3 py-2"></th>
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
                  <td class="px-3 py-2">{{ weaponSkillLabel(weapon) }}</td>
                  <td class="px-3 py-2">{{ weapon.techLevel ?? '-' }}</td>
                  <td class="px-3 py-2">{{ weapon.range }}</td>
                  <td class="px-3 py-2">{{ weapon.damage }}</td>
                  <td class="px-3 py-2">{{ weapon.massKg ?? '-' }}kg</td>
                  <td class="px-3 py-2">{{ weapon.costCredits === null ? '-' : `Cr${weapon.costCredits}` }}</td>
                  <td class="max-w-xs px-3 py-2 text-zinc-600">{{ weapon.traits.join(', ') || '-' }}</td>
                  <td v-if="activeProfile" class="px-3 py-2 text-right">
                    <button
                      class="rounded-md border border-zinc-300 px-2 py-1 text-xs font-semibold text-zinc-700 hover:border-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                      :disabled="Boolean(buyReferenceWeaponDisabledReason(weapon))"
                      :title="buyReferenceWeaponDisabledReason(weapon)"
                      type="button"
                      @click.stop.prevent="openPurchaseConfirmation({ kind: 'reference-weapon', item: weapon })"
                    >
                      Buy
                    </button>
                  </td>
                </tr>
                <tr v-if="expandedWeaponId === weapon.id" class="mobile-detail-row border-t border-cyan-400/20">
                  <td :colspan="sortableWeaponColumns.length + (activeProfile ? 1 : 0)" class="px-3 py-3">
                    <div class="mobile-row-detail-grid">
                      <div><span>Skill</span><strong>{{ weaponSkillLabel(weapon) }}</strong></div>
                      <div><span>TL</span><strong>{{ weapon.techLevel ?? '-' }}</strong></div>
                      <div><span>Range</span><strong>{{ weapon.range }}</strong></div>
                      <div><span>Damage</span><strong>{{ weapon.damage }}</strong></div>
                      <div><span>Mass</span><strong>{{ weapon.massKg ?? '-' }}kg</strong></div>
                      <div><span>Cost</span><strong>{{ weapon.costCredits === null ? '-' : `Cr${weapon.costCredits}` }}</strong></div>
                      <div class="sm:col-span-2"><span>Traits</span><strong>{{ weapon.traits.join(', ') || '-' }}</strong></div>
                      <div class="flex flex-wrap gap-2 sm:col-span-2">
                        <button
                          v-if="activeProfile"
                          class="mt-1 rounded-md border border-cyan-400/40 px-3 py-2 text-sm font-semibold text-cyan-100 hover:border-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                          :disabled="Boolean(buyReferenceWeaponDisabledReason(weapon))"
                          :title="buyReferenceWeaponDisabledReason(weapon)"
                          type="button"
                          @click.stop.prevent="openPurchaseConfirmation({ kind: 'reference-weapon', item: weapon })"
                        >
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
                <th v-if="activeProfile" class="px-3 py-2"></th>
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
                <td v-if="activeProfile" class="px-3 py-2 text-right">
                  <button
                    class="rounded-md border border-zinc-300 px-2 py-1 text-xs font-semibold text-zinc-700 hover:border-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="Boolean(buyArmorDisabledReason(armor))"
                    :title="buyArmorDisabledReason(armor)"
                    type="button"
                    @click.stop.prevent="openPurchaseConfirmation({ kind: 'armor', item: armor })"
                  >
                    Buy
                  </button>
                </td>
              </tr>
              <tr v-if="expandedArmorId === armor.id" class="mobile-detail-row border-t border-cyan-400/20">
                <td :colspan="sortableArmorColumns.length + 1 + (activeProfile ? 1 : 0)" class="px-3 py-3">
                  <div class="mobile-row-detail-grid">
                    <div><span>Protection</span><strong>{{ armor.protection }}</strong></div>
                    <div><span>TL</span><strong>{{ armor.techLevel ?? '-' }}</strong></div>
                    <div><span>Radiation</span><strong>{{ armor.radiationProtection ?? '-' }}</strong></div>
                    <div><span>Mass</span><strong>{{ formatKg(armor.massKg) }}</strong></div>
                    <div><span>Cost</span><strong>{{ formatCredits(armor.costCredits) }}</strong></div>
                    <div><span>Skill</span><strong>{{ armor.requiredSkill ?? 'None' }}</strong></div>
                    <div class="sm:col-span-2"><span>Traits</span><strong>{{ armor.traits.join(', ') || '-' }}</strong></div>
                    <div v-if="activeProfile" class="flex flex-wrap gap-2 sm:col-span-2">
                      <button
                        class="mt-1 rounded-md border border-cyan-400/40 px-3 py-2 text-sm font-semibold text-cyan-100 hover:border-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                        :disabled="Boolean(buyArmorDisabledReason(armor))"
                        :title="buyArmorDisabledReason(armor)"
                        type="button"
                        @click.stop.prevent="openPurchaseConfirmation({ kind: 'armor', item: armor })"
                      >
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
                <th v-if="activeProfile" class="px-3 py-2"></th>
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
                <td v-if="activeProfile" class="px-3 py-2 text-right">
                  <button
                    class="rounded-md border border-zinc-300 px-2 py-1 text-xs font-semibold text-zinc-700 hover:border-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="Boolean(buyEquipmentDisabledReason(item))"
                    :title="buyEquipmentDisabledReason(item)"
                    type="button"
                    @click.stop.prevent="openPurchaseConfirmation({ kind: 'equipment', item })"
                  >
                    Buy
                  </button>
                </td>
              </tr>
              <tr v-if="expandedEquipmentId === item.id" class="mobile-detail-row border-t border-cyan-400/20">
                <td :colspan="sortableEquipmentColumns.length + 1 + (activeProfile ? 1 : 0)" class="px-3 py-3">
                  <div class="mobile-row-detail-grid">
                    <div><span>Category</span><strong class="capitalize">{{ item.category }}</strong></div>
                    <div><span>TL</span><strong>{{ item.techLevel ?? '-' }}</strong></div>
                    <div><span>Mass</span><strong>{{ formatKg(item.massKg) }}</strong></div>
                    <div><span>Cost</span><strong>{{ formatCredits(item.costCredits) }}</strong></div>
                    <div class="sm:col-span-2"><span>Effect</span><strong>{{ item.effect }}</strong></div>
                    <div class="sm:col-span-2"><span>Traits</span><strong>{{ item.traits.join(', ') || '-' }}</strong></div>
                    <div v-if="activeProfile" class="flex flex-wrap gap-2 sm:col-span-2">
                      <button
                        class="mt-1 rounded-md border border-cyan-400/40 px-3 py-2 text-sm font-semibold text-cyan-100 hover:border-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                        :disabled="Boolean(buyEquipmentDisabledReason(item))"
                        :title="buyEquipmentDisabledReason(item)"
                        type="button"
                        @click.stop.prevent="openPurchaseConfirmation({ kind: 'equipment', item })"
                      >
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

      <div v-else class="grid gap-5">
        <section class="hud-panel rounded-lg border p-5 shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-lg font-semibold">Saved Weapons</h2>
            <button class="rounded-md bg-zinc-950 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800" type="button" @click="newWeapon">
              New
            </button>
          </div>
          <div v-if="userWeapons.length" class="mt-4 grid gap-2">
            <div
              v-for="weapon in userWeapons"
              :key="weapon.id"
              class="rounded-md border border-zinc-200 bg-stone-50 p-3 text-left hover:border-amber-500 hover:bg-white"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="font-semibold text-zinc-950">{{ weapon.name }}</p>
                  <p class="mt-1 text-sm text-zinc-600">{{ weapon.damage }} · {{ weapon.range }} · TL {{ weapon.techLevel ?? '-' }}</p>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    class="rounded-md border border-zinc-300 px-2 py-1 text-xs font-semibold text-zinc-700 hover:border-amber-600"
                    type="button"
                    @click="editWeapon(weapon)"
                  >
                    Edit
                  </button>
                <button
                  v-if="activeProfile"
                  class="rounded-md border border-zinc-300 px-2 py-1 text-xs font-semibold text-zinc-700 hover:border-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="Boolean(buySavedWeaponDisabledReason(weapon))"
                  :title="buySavedWeaponDisabledReason(weapon)"
                  type="button"
                  @click.stop.prevent="openPurchaseConfirmation({ kind: 'saved-weapon', item: weapon })"
                >
                  Buy
                </button>
                </div>
              </div>
            </div>
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
          <div class="relative flex flex-wrap gap-2">
            <button aria-label="Duplicate weapon" class="sheet-action-button" title="Duplicate weapon" type="button" @click="duplicateWeapon">
              <AppIcon name="copy" />
            </button>
            <button aria-label="Delete weapon" class="sheet-action-button sheet-action-button--danger" title="Delete weapon" type="button" @click="requestDeleteWeapon">
              <AppIcon name="trash" />
            </button>
            <button aria-label="Save weapon" class="sheet-action-button sheet-action-button--primary" title="Save weapon" type="button" @click="saveWeapon">
              <AppIcon name="save" />
            </button>
            <div v-if="deleteWeaponConfirmOpen" class="absolute right-0 top-[calc(100%+0.5rem)] z-20 grid min-w-[10rem] gap-2 rounded-[10px_0_10px_0] border border-cyan-400/25 bg-slate-950/95 p-3 shadow-[0_12px_28px_rgba(2,8,23,0.45)] [clip-path:polygon(0_0,calc(100%-10px)_0,100%_10px,100%_100%,10px_100%,0_calc(100%-10px))]">
              <p class="text-xs font-semibold text-cyan-50">Delete weapon?</p>
              <div class="flex justify-end gap-2">
                <button class="rounded-[8px_0_8px_0] border border-cyan-400/25 bg-slate-900/80 px-2 py-1 text-xs font-semibold text-cyan-100 [clip-path:polygon(0_0,calc(100%-7px)_0,100%_7px,100%_100%,7px_100%,0_calc(100%-7px))]" type="button" @click="cancelDeleteWeapon">Cancel</button>
                <button class="rounded-[8px_0_8px_0] border border-red-400/30 bg-red-950/90 px-2 py-1 text-xs font-semibold text-red-100 [clip-path:polygon(0_0,calc(100%-7px)_0,100%_7px,100%_100%,7px_100%,0_calc(100%-7px))]" type="button" @click="confirmDeleteWeapon">Delete</button>
              </div>
            </div>
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
            <div class="grid gap-2 justify-items-end">
              <div class="weapon-cost-callout">
                <span class="weapon-cost-callout__label">Cost</span>
                <strong class="weapon-cost-callout__value">{{ builderCostLabel }}</strong>
              </div>
              <p class="rounded-md px-3 py-2 text-sm font-semibold" :class="isStepComplete(activeDesignStep) ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'">
                {{ isStepComplete(activeDesignStep) ? 'Complete' : 'Selection needed' }}
              </p>
            </div>
          </div>

          <div v-if="activeDesignStep === 0" class="mt-5 grid gap-4 md:grid-cols-2">
            <label class="grid gap-2">
              <span class="text-sm font-semibold text-zinc-700">Name</span>
              <input v-model="draft.name" class="weapon-form-control h-11 px-3">
            </label>
            <label class="grid gap-2">
              <span class="text-sm font-semibold text-zinc-700">Weapon Type</span>
              <select v-model="draft.design.weaponType" class="weapon-form-control weapon-form-control--select h-11 px-3">
                <option value="">Select type</option>
                <option v-for="item in designTables.weaponTypes" :key="item.id" :value="item.id">{{ item.name }}</option>
              </select>
            </label>
            <div class="grid gap-3 md:col-span-2 md:grid-cols-[8rem_repeat(3,minmax(0,1fr))]">
            <label class="grid max-w-[8rem] gap-2">
              <span class="text-sm font-semibold text-zinc-700">Design TL</span>
              <div class="flex items-center gap-1.5">
                <input
                  :value="draft.design.targetTechLevel ?? 0"
                  class="weapon-form-control weapon-tl-input h-10 w-12 px-2 text-center text-sm font-semibold"
                  type="number"
                  min="0"
                  max="18"
                  step="1"
                  @input="onDesignTechLevelInput"
                  @wheel.prevent="onDesignTechLevelWheel"
                >
                <div class="flex flex-col gap-1">
                <button class="weapon-tl-stepper" type="button" @click="adjustDesignTechLevel(1)">
                  <AppIcon class="sheet-stepper-icon sheet-stepper-icon--up" name="arrow" />
                </button>
                <button class="weapon-tl-stepper" type="button" @click="adjustDesignTechLevel(-1)">
                  <AppIcon class="sheet-stepper-icon sheet-stepper-icon--down" name="arrow" />
                </button>
                </div>
              </div>
            </label>
            <div class="grid gap-2">
              <span class="text-sm font-semibold text-zinc-700">Category</span>
              <select v-model="draft.category" class="weapon-form-control weapon-form-control--select h-10 px-3 text-sm">
                <option v-for="category in filteredCategoryOptions" :key="category.id" :value="category.id">{{ category.label }}</option>
              </select>
            </div>
            <div class="grid gap-2">
              <span class="text-sm font-semibold text-zinc-700">Skill</span>
              <select v-model="draft.skill" class="weapon-form-control weapon-form-control--select h-10 px-3 text-sm">
                <option v-for="skill in builderSkillOptions" :key="skill" :value="skill">{{ titleCaseLabel(skill) }}</option>
              </select>
            </div>
            <div class="grid gap-2">
              <span class="text-sm font-semibold text-zinc-700">Specialty</span>
              <select v-model="draft.speciality" class="weapon-form-control weapon-form-control--select h-10 px-3 text-sm">
                <option v-for="speciality in builderSpecialityOptions" :key="speciality" :value="speciality">{{ titleCaseLabel(speciality) }}</option>
              </select>
            </div>
            </div>
            <p v-if="selectedWeaponType" class="rounded-md bg-stone-50 p-3 text-sm text-zinc-700 md:col-span-2">{{ itemDescription(selectedWeaponType) }}</p>
          </div>

          <div v-else-if="activeDesignStep === 1" class="mt-5 grid gap-4">
            <label class="grid gap-2">
              <span class="text-sm font-semibold text-zinc-700">Ammunition / Power Source</span>
              <select v-model="draft.design.ammunitionType" class="weapon-form-control weapon-form-control--select h-11 px-3">
                <option value="">Select ammunition</option>
                <option v-for="item in filteredAmmunitionOptions" :key="item.id" :value="item.id">{{ item.name }}</option>
              </select>
            </label>
            <p v-if="selectedAmmunition" class="rounded-md bg-stone-50 p-3 text-sm text-zinc-700">{{ itemDescription(selectedAmmunition) }}</p>
          </div>

          <div v-else-if="activeDesignStep === 2" class="mt-5 grid gap-4">
            <p v-if="isDirectExplosiveBuild" class="rounded-md border border-cyan-400/20 bg-slate-950/60 p-4 text-sm text-cyan-100/90">
              Thrown grenades, mines and placed charges do not use a receiver or firing mechanism. Continue to Finish once the payload is selected.
            </p>
            <div class="grid gap-4 md:grid-cols-2">
              <label class="grid gap-2">
                <span class="text-sm font-semibold text-zinc-700">Receiver</span>
                <select v-model="draft.design.receiverType" class="weapon-form-control weapon-form-control--select h-11 px-3">
                  <option value="">Select receiver</option>
                  <option v-for="item in filteredReceiverOptions" :key="item.id" :value="item.id">{{ item.name }}</option>
                </select>
              </label>
              <label class="grid gap-2">
                <span class="text-sm font-semibold text-zinc-700">Mechanism</span>
                <select v-model="draft.design.mechanism" class="weapon-form-control weapon-form-control--select h-11 px-3">
                  <option value="">Select mechanism</option>
                  <option
                    v-for="item in filteredMechanismOptions"
                    :key="item.id"
                    :value="item.id"
                    :disabled="!canSelectChoice('mechanisms', item.id, draft.design.mechanism === item.id)"
                  >
                    {{ item.name }}
                  </option>
                </select>
              </label>
            </div>
            <div class="grid gap-3 md:grid-cols-2">
              <p v-if="selectedReceiver" class="rounded-md bg-stone-50 p-3 text-sm text-zinc-700">{{ itemDescription(selectedReceiver) }}</p>
              <p v-if="selectedMechanism" class="rounded-md bg-stone-50 p-3 text-sm text-zinc-700">{{ itemDescription(selectedMechanism) }}</p>
            </div>
            <div v-if="draft.design.mechanism && selectionWarnings('mechanisms', draft.design.mechanism).length" class="grid gap-1">
              <p v-for="warning in selectionWarnings('mechanisms', draft.design.mechanism)" :key="warning" class="rounded border border-amber-300 bg-amber-50/80 px-3 py-2 text-xs font-semibold text-amber-900">
                {{ warning }}
              </p>
            </div>
            <div class="grid gap-2">
              <span class="text-sm font-semibold text-zinc-700">Receiver Features</span>
              <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                <button
                  v-for="item in designTables.receiverFeatures"
                  :key="item.id"
                  class="rounded-md border p-3 text-left text-sm"
                  :class="(draft.design.receiverFeatures ?? []).includes(item.id)
                    ? 'border-zinc-950 bg-zinc-950 text-white'
                    : canSelectChoice('receiverFeatures', item.id)
                      ? 'border-zinc-300 text-zinc-700 hover:border-amber-600'
                      : 'border-zinc-200 text-zinc-400 opacity-60'"
                  type="button"
                  :disabled="!canSelectChoice('receiverFeatures', item.id, (draft.design.receiverFeatures ?? []).includes(item.id))"
                  @click="toggleReceiverFeature(item.id)"
                >
                  <span class="font-semibold">{{ item.name }}</span>
                  <span class="mt-1 block text-xs opacity-80">{{ itemDescription(item) }}</span>
                  <span v-if="selectionWarnings('receiverFeatures', item.id).length && !(draft.design.receiverFeatures ?? []).includes(item.id)" class="mt-2 block text-[11px] font-semibold text-amber-300">
                    {{ selectionWarnings('receiverFeatures', item.id)[0] }}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div v-else-if="activeDesignStep === 3" class="mt-5 grid gap-4">
            <p v-if="isDirectExplosiveBuild" class="rounded-md border border-cyan-400/20 bg-slate-950/60 p-4 text-sm text-cyan-100/90">
              This payload path does not use barrel, furniture or feed components. Grenade launchers remain available by choosing a launcher category and receiver path.
            </p>
            <div class="grid gap-4 md:grid-cols-2">
              <label class="grid gap-2">
                <span class="text-sm font-semibold text-zinc-700">Barrel</span>
                <select v-model="draft.design.barrel" class="weapon-form-control weapon-form-control--select h-11 px-3">
                  <option value="">Select barrel</option>
                  <option v-for="item in filteredBarrelOptions" :key="item.id" :value="item.id">{{ item.name }}</option>
                </select>
              </label>
              <div class="grid gap-2">
                <span aria-hidden="true" class="text-sm font-semibold text-transparent select-none">Barrel</span>
                <label class="weapon-toggle-field">
                  <input v-model="draft.design.heavyBarrel" class="weapon-toggle-checkbox" type="checkbox">
                  <span class="text-sm font-semibold text-zinc-700">Heavy barrel</span>
                </label>
              </div>
              <label class="grid gap-2">
                <span class="text-sm font-semibold text-zinc-700">Furniture</span>
                <select v-model="draft.design.furniture" class="weapon-form-control weapon-form-control--select h-11 px-3">
                  <option value="">Select furniture</option>
                  <option v-for="item in filteredFurnitureOptions" :key="item.id" :value="item.id">{{ item.name }}</option>
                </select>
              </label>
              <label class="grid gap-2">
                <span class="text-sm font-semibold text-zinc-700">Feed Device</span>
                <select v-model="draft.design.feedDevice" class="weapon-form-control weapon-form-control--select h-11 px-3">
                  <option value="">Select feed</option>
                  <option v-for="item in filteredFeedDeviceOptions" :key="item.id" :value="item.id">{{ item.name }}</option>
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
              <select v-model="draft.design.specialAmmunition" class="weapon-form-control weapon-form-control--select h-11 px-3">
                <option value="">Ball / standard</option>
                <option
                  v-for="item in filteredSpecialAmmunitionOptions"
                  :key="item.id"
                  :value="item.id"
                  :disabled="!canSelectChoice('specialAmmunition', item.id, draft.design.specialAmmunition === item.id)"
                >
                  {{ item.name }}
                </option>
              </select>
            </label>
            <p v-if="selectedSpecialAmmunition" class="rounded-md bg-stone-50 p-3 text-sm text-zinc-700">{{ itemDescription(selectedSpecialAmmunition) }}</p>
            <div v-if="draft.design.specialAmmunition && selectionWarnings('specialAmmunition', draft.design.specialAmmunition).length" class="grid gap-1">
              <p v-for="warning in selectionWarnings('specialAmmunition', draft.design.specialAmmunition)" :key="warning" class="rounded border border-amber-300 bg-amber-50/80 px-3 py-2 text-xs font-semibold text-amber-900">
                {{ warning }}
              </p>
            </div>
            <div class="grid gap-2">
              <span class="text-sm font-semibold text-zinc-700">Field Catalogue Accessories</span>
              <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                <button
                  v-for="item in designTables.accessories"
                  :key="item.id"
                  class="group relative rounded-md border p-3 text-left text-sm"
                  :class="draft.design.accessories.includes(item.id)
                    ? 'border-zinc-950 bg-zinc-950 text-white'
                    : canToggleAccessory(item.id)
                      ? 'border-zinc-300 text-zinc-700 hover:border-amber-600'
                      : 'cursor-not-allowed border-zinc-200 text-zinc-400 opacity-60'"
                  type="button"
                  :aria-disabled="!canToggleAccessory(item.id)"
                  @click="handleAccessoryChoice(item.id)"
                >
                  <span
                    v-if="accessoryWarnings(item.id).length && !draft.design.accessories.includes(item.id)"
                    class="absolute right-2 top-2 inline-flex h-4 w-4 cursor-help items-center justify-center text-amber-300"
                    :aria-label="accessoryWarnings(item.id)[0]"
                    :title="accessoryWarnings(item.id)[0]"
                  >
                    <AppIcon class="h-3.5 w-3.5" name="warning" />
                    <span class="weapon-warning-tooltip">
                      {{ accessoryWarnings(item.id)[0] }}
                    </span>
                  </span>
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
            <section class="weapon-final-card">
              <div class="weapon-final-card__header">
                <div class="weapon-final-card__icon">
                  <img
                    v-if="finalWeaponAssetIconUrl"
                    :src="finalWeaponAssetIconUrl"
                    alt=""
                    class="weapon-final-card__icon-image"
                  >
                  <AppIcon v-else :name="finalWeaponIconName" class="h-16 w-16" />
                </div>
                <div class="min-w-0">
                  <p class="weapon-final-card__eyebrow">Completed Weapon Package</p>
                  <h3 class="weapon-final-card__title">{{ draft.name.trim() || 'Untitled Weapon' }}</h3>
                  <p class="weapon-final-card__subline">
                    {{ titleCaseLabel(draft.design.weaponType || 'custom') }} · {{ titleCaseLabel(draft.category || 'other') }} ·
                    {{ titleCaseLabel(draft.skill || 'gun-combat') }}<span v-if="draft.speciality"> ({{ titleCaseLabel(draft.speciality) }})</span> ·
                    {{ titleCaseLabel(resolvedWeaponFamily) }}
                  </p>
                </div>
              </div>

              <div v-if="!designPreview.ready" class="weapon-final-card__pending">
                Select {{ designPreview.missing.join(' and ') }} to complete the Field Catalogue calculation.
              </div>

              <div v-else class="weapon-final-table">
                <div class="weapon-final-table__row">
                  <span class="weapon-final-table__label">Design TL</span>
                  <span class="weapon-final-table__value">{{ draft.design.targetTechLevel ?? '—' }}</span>
                </div>
                <div class="weapon-final-table__row">
                  <span class="weapon-final-table__label">Result TL</span>
                  <span class="weapon-final-table__value">{{ buildTechLevel ?? '—' }}</span>
                </div>
                <div class="weapon-final-table__row">
                  <span class="weapon-final-table__label">Range</span>
                  <span class="weapon-final-table__value">{{ designPreview.range }}</span>
                </div>
                <div class="weapon-final-table__row">
                  <span class="weapon-final-table__label">Damage</span>
                  <span class="weapon-final-table__value">{{ designPreview.damage }}</span>
                </div>
                <div class="weapon-final-table__row">
                  <span class="weapon-final-table__label">Mass</span>
                  <span class="weapon-final-table__value">{{ designPreview.massKg }}kg</span>
                </div>
                <div class="weapon-final-table__row">
                  <span class="weapon-final-table__label">Cost</span>
                  <span class="weapon-final-table__value">{{ formatCredits(designPreview.costCredits) }}</span>
                </div>
                <div class="weapon-final-table__row">
                  <span class="weapon-final-table__label">Magazine</span>
                  <span class="weapon-final-table__value">{{ designPreview.magazine }}</span>
                </div>
                <div class="weapon-final-table__row">
                  <span class="weapon-final-table__label">Magazine Cost</span>
                  <span class="weapon-final-table__value">{{ formatCredits(designPreview.magazineCostCredits) }}</span>
                </div>
                <div class="weapon-final-table__row">
                  <span class="weapon-final-table__label">Quickdraw</span>
                  <span class="weapon-final-table__value">{{ designPreview.quickdraw ?? '—' }}</span>
                </div>
                <div class="weapon-final-table__row">
                  <span class="weapon-final-table__label">Recoil</span>
                  <span class="weapon-final-table__value">{{ designPreview.recoil }}</span>
                </div>
                <div class="weapon-final-table__row">
                  <span class="weapon-final-table__label">Penetration</span>
                  <span class="weapon-final-table__value">{{ designPreview.penetration }}</span>
                </div>
                <div class="weapon-final-table__row">
                  <span class="weapon-final-table__label">Heat</span>
                  <span class="weapon-final-table__value">{{ designPreview.heat !== null ? `${designPreview.heat}/attack` : '—' }}</span>
                </div>
                <div class="weapon-final-table__row" v-if="designPreview.heatProfile">
                  <span class="weapon-final-table__label">Cooling</span>
                  <span class="weapon-final-table__value">{{ designPreview.heatProfile.dissipation }}/round</span>
                </div>
                <div class="weapon-final-table__row" v-if="designPreview.heatProfile">
                  <span class="weapon-final-table__label">Thresholds</span>
                  <span class="weapon-final-table__value">
                    {{ designPreview.heatProfile.thresholds.overheat }}/{{ designPreview.heatProfile.thresholds.danger }}/{{ designPreview.heatProfile.thresholds.disaster }}
                  </span>
                </div>
              </div>

              <div class="weapon-final-card__section">
                <p class="weapon-final-card__section-title">Traits</p>
                <div class="weapon-final-chip-list">
                  <span v-for="trait in (designPreview.ready ? designPreview.traits : draft.traits)" :key="trait" class="weapon-final-chip">
                    {{ trait }}
                  </span>
                  <span v-if="!(designPreview.ready ? designPreview.traits : draft.traits).length" class="weapon-final-chip weapon-final-chip--muted">No Traits</span>
                </div>
              </div>

              <div v-if="draft.design.notes?.trim()" class="weapon-final-card__section">
                <p class="weapon-final-card__section-title">Design Notes</p>
                <p class="weapon-final-card__notes">{{ draft.design.notes }}</p>
              </div>

              <div v-if="designPreview.warnings.length" class="weapon-final-card__section">
                <p class="weapon-final-card__section-title">Warnings</p>
                <div class="grid gap-1">
                  <p v-for="warning in designPreview.warnings" :key="warning" class="rounded border border-amber-300 bg-white/70 px-2 py-1 text-xs font-semibold text-amber-900">
                    {{ warning }}
                  </p>
                </div>
              </div>

              <div class="weapon-final-card__actions">
                <button
                  class="weapon-final-card__action weapon-final-card__action--primary"
                  type="button"
                  :disabled="!canBuyCompletedWeapon"
                  :title="buyCompletedWeaponDisabledReason || `Buy for ${activeProfile?.identity.name || 'Traveller'}`"
                  @click="openPurchaseConfirmation({ kind: 'designed-weapon', item: buildPersistedWeaponDraft() })"
                >
                  <AppIcon name="plus" />
                  <span>{{ activeProfile ? `Buy for ${activeProfile.identity.name || 'Traveller'}` : 'Select Traveller to Buy' }}</span>
                </button>
              </div>
            </section>
          </div>

          <div class="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-4">
            <button class="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40" type="button" :disabled="activeDesignStep === 0" @click="previousDesignStep">
              Previous
            </button>
            <button v-if="activeDesignStep !== designSteps.length - 1" class="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-300" type="button" :disabled="!isStepComplete(activeDesignStep)" @click="nextDesignStep">
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
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
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

.sheet-action-button,
.sheet-stepper-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(34, 211, 238, 0.3);
  background: rgba(8, 18, 32, 0.82);
  color: #bae6fd;
  box-shadow: inset 0 0 18px rgba(34, 211, 238, 0.08);
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
  transition: border-color 160ms ease, background-color 160ms ease, color 160ms ease, box-shadow 160ms ease;
}

.sheet-action-button {
  width: 2.5rem;
  height: 2.5rem;
}

.sheet-action-button--primary {
  color: #fef3c7;
  border-color: rgba(245, 158, 11, 0.35);
  background: rgba(120, 53, 15, 0.72);
}

.sheet-action-button--danger {
  color: #fecaca;
  border-color: rgba(248, 113, 113, 0.35);
  background: rgba(127, 29, 29, 0.72);
}

.sheet-action-button:hover,
.sheet-action-button:focus-visible,
.sheet-stepper-button:hover,
.sheet-stepper-button:focus-visible {
  border-color: rgba(103, 232, 249, 0.9);
  background: rgba(14, 116, 144, 0.22);
  box-shadow: 0 0 0 1px rgba(34, 211, 238, 0.16), inset 0 0 18px rgba(34, 211, 238, 0.12);
  outline: none;
}

.sheet-action-button--primary:hover,
.sheet-action-button--primary:focus-visible {
  border-color: rgba(245, 158, 11, 0.75);
  background: rgba(180, 83, 9, 0.72);
}

.sheet-action-button--danger:hover,
.sheet-action-button--danger:focus-visible {
  border-color: rgba(248, 113, 113, 0.75);
  background: rgba(153, 27, 27, 0.72);
}

.sheet-action-button :deep(svg),
.sheet-stepper-button :deep(svg) {
  width: 1rem;
  height: 1rem;
}

.sheet-stepper-button {
  width: 2.2rem;
  height: 2.2rem;
}

.sheet-stepper-icon--down {
  transform: rotate(90deg);
}

.sheet-stepper-icon--up {
  transform: rotate(-90deg);
}

.weapon-tl-stepper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.7rem;
  height: 1.25rem;
  border: 1px solid rgba(34, 211, 238, 0.3);
  background: rgba(8, 18, 32, 0.82);
  color: #bae6fd;
  box-shadow: inset 0 0 14px rgba(34, 211, 238, 0.08);
  clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
}

.weapon-tl-stepper:hover,
.weapon-tl-stepper:focus-visible {
  border-color: rgba(103, 232, 249, 0.9);
  background: rgba(14, 116, 144, 0.22);
  box-shadow: 0 0 0 1px rgba(34, 211, 238, 0.16), inset 0 0 14px rgba(34, 211, 238, 0.12);
  outline: none;
}

.weapon-tl-stepper :deep(svg) {
  width: 0.7rem;
  height: 0.7rem;
}

.weapon-derived-field {
  display: flex;
  align-items: center;
  min-height: 2.5rem;
  border: 1px solid rgba(34, 211, 238, 0.24);
  background: rgba(8, 18, 32, 0.55);
  padding: 0 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #bae6fd;
  opacity: 0.95;
}

.weapon-derived-field--compact {
  min-height: 2.2rem;
  font-size: 0.8rem;
  padding: 0 0.65rem;
}

.weapon-cost-callout {
  display: inline-flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 0.45rem;
  min-width: 9rem;
  border: 1px solid rgba(245, 158, 11, 0.48);
  background:
    linear-gradient(180deg, rgba(120, 53, 15, 0.92), rgba(67, 20, 7, 0.94)),
    linear-gradient(90deg, rgba(251, 191, 36, 0.14), transparent 40%, rgba(34, 211, 238, 0.06));
  padding: 0.55rem 0.8rem 0.5rem;
  color: #fef3c7;
  box-shadow:
    inset 0 0 20px rgba(251, 191, 36, 0.12),
    0 0 0 1px rgba(120, 53, 15, 0.18),
    0 0 22px rgba(245, 158, 11, 0.08);
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
}

.weapon-cost-callout__label {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(254, 243, 199, 0.82);
}

.weapon-cost-callout__value {
  font-size: 1.15rem;
  line-height: 1;
  color: #fef3c7;
  text-shadow: 0 0 12px rgba(251, 191, 36, 0.2);
}

.weapon-form-control {
  border: 1px solid rgba(34, 211, 238, 0.42) !important;
  background:
    linear-gradient(180deg, rgba(10, 22, 38, 0.94), rgba(3, 7, 18, 0.94)),
    linear-gradient(90deg, rgba(34, 211, 238, 0.08), transparent 35%, rgba(245, 158, 11, 0.05));
  color: #e0fbff !important;
  box-shadow:
    inset 0 0 18px rgba(34, 211, 238, 0.08),
    0 0 0 1px rgba(8, 47, 73, 0.25);
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  border-radius: 0 !important;
  appearance: none;
}

.weapon-form-control:focus {
  border-color: rgba(103, 232, 249, 0.95) !important;
  box-shadow:
    0 0 0 2px rgba(34, 211, 238, 0.2),
    inset 0 0 18px rgba(34, 211, 238, 0.1);
  outline: none;
}

.weapon-form-control--select {
  background-image:
    linear-gradient(45deg, transparent 50%, rgba(186, 230, 253, 0.9) 50%),
    linear-gradient(135deg, rgba(186, 230, 253, 0.9) 50%, transparent 50%),
    linear-gradient(180deg, rgba(10, 22, 38, 0.94), rgba(3, 7, 18, 0.94)),
    linear-gradient(90deg, rgba(34, 211, 238, 0.08), transparent 35%, rgba(245, 158, 11, 0.05));
  background-position:
    calc(100% - 1rem) calc(50% - 2px),
    calc(100% - 0.7rem) calc(50% - 2px),
    0 0,
    0 0;
  background-size:
    0.35rem 0.35rem,
    0.35rem 0.35rem,
    100% 100%,
    100% 100%;
  background-repeat: no-repeat;
  padding-right: 2rem;
}

.weapon-toggle-field {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  height: 2.75rem;
  width: 100%;
  border: 1px solid rgba(34, 211, 238, 0.32);
  background: rgba(8, 18, 32, 0.72);
  padding: 0 0.875rem;
  box-shadow: inset 0 0 18px rgba(34, 211, 238, 0.08);
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  box-sizing: border-box;
}

.weapon-toggle-checkbox {
  width: 1rem;
  height: 1rem;
  margin: 0;
  accent-color: rgb(245 158 11);
}

.weapon-warning-tooltip {
  pointer-events: none;
  position: absolute;
  right: 0;
  top: calc(100% + 0.35rem);
  z-index: 30;
  min-width: 11rem;
  max-width: 14rem;
  opacity: 0;
  transform: translateY(-0.2rem);
  border: 1px solid rgba(34, 211, 238, 0.28);
  background: rgba(2, 6, 23, 0.96);
  padding: 0.45rem 0.55rem;
  color: #fde68a;
  font-size: 0.7rem;
  font-weight: 600;
  line-height: 1.25;
  box-shadow: 0 12px 28px rgba(2, 8, 23, 0.45), inset 0 0 16px rgba(34, 211, 238, 0.08);
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
  transition: opacity 160ms ease, transform 160ms ease;
}

.group:hover .weapon-warning-tooltip,
.group:focus-within .weapon-warning-tooltip {
  opacity: 1;
  transform: translateY(0);
}

.weapon-final-card {
  border: 1px solid rgba(34, 211, 238, 0.28);
  background:
    linear-gradient(180deg, rgba(12, 18, 32, 0.96), rgba(4, 8, 19, 0.96)),
    linear-gradient(90deg, rgba(245, 158, 11, 0.08), transparent 28%, rgba(34, 211, 238, 0.06) 70%, rgba(245, 158, 11, 0.05));
  padding: 1rem;
  box-shadow:
    inset 0 0 0 1px rgba(34, 211, 238, 0.06),
    inset 0 0 30px rgba(34, 211, 238, 0.05),
    0 0 0 1px rgba(8, 47, 73, 0.18);
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
}

.weapon-final-card__header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.9rem;
  margin-bottom: 1rem;
}

.weapon-final-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 4.1rem;
  height: 4.1rem;
  border: 1px solid rgba(245, 158, 11, 0.46);
  background:
    linear-gradient(180deg, rgba(120, 53, 15, 0.88), rgba(67, 20, 7, 0.94)),
    linear-gradient(90deg, rgba(251, 191, 36, 0.18), transparent 42%, rgba(34, 211, 238, 0.05));
  color: #fde68a;
  box-shadow: inset 0 0 18px rgba(251, 191, 36, 0.08), 0 0 18px rgba(245, 158, 11, 0.08);
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
}

.weapon-final-card__icon-image {
  width: 3.35rem;
  height: 3.35rem;
  object-fit: contain;
  display: block;
  filter:
    brightness(0) saturate(100%)
    invert(84%) sepia(66%) saturate(948%) hue-rotate(336deg) brightness(104%) contrast(99%)
    drop-shadow(0 0 10px rgba(251, 191, 36, 0.22))
    drop-shadow(0 0 18px rgba(245, 158, 11, 0.16));
}

.weapon-final-card__eyebrow {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #fbbf24;
}

.weapon-final-card__title {
  margin-top: 0.15rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: #f8fafc;
}

.weapon-final-card__subline {
  margin-top: 0.15rem;
  font-size: 0.85rem;
  color: #94a3b8;
}

.weapon-final-card__pending {
  border: 1px solid rgba(245, 158, 11, 0.34);
  background:
    linear-gradient(180deg, rgba(120, 53, 15, 0.22), rgba(67, 20, 7, 0.2)),
    rgba(15, 23, 42, 0.72);
  padding: 0.75rem 0.9rem;
  font-size: 0.88rem;
  font-weight: 600;
  color: #fcd34d;
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
}

.weapon-final-table {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
  gap: 0.6rem;
}

.weapon-final-table__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 2.7rem;
  border: 1px solid rgba(34, 211, 238, 0.18);
  background:
    linear-gradient(180deg, rgba(8, 18, 32, 0.78), rgba(2, 6, 23, 0.82)),
    linear-gradient(90deg, rgba(245, 158, 11, 0.06), transparent 42%);
  box-shadow: inset 0 0 16px rgba(34, 211, 238, 0.04);
  padding: 0.55rem 0.75rem;
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
}

.weapon-final-table__label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #fbbf24;
}

.weapon-final-table__value {
  font-size: 0.92rem;
  font-weight: 700;
  color: #e0f2fe;
  text-align: right;
}

.weapon-final-card__section {
  margin-top: 0.95rem;
}

.weapon-final-card__section-title {
  margin-bottom: 0.45rem;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #fbbf24;
}

.weapon-final-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.weapon-final-chip {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  border: 1px solid rgba(34, 211, 238, 0.18);
  background:
    linear-gradient(180deg, rgba(8, 18, 32, 0.8), rgba(2, 6, 23, 0.84)),
    linear-gradient(90deg, rgba(245, 158, 11, 0.06), transparent 55%);
  padding: 0.3rem 0.65rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: #e2e8f0;
  clip-path: polygon(0 0, calc(100% - 7px) 0, 100% 7px, 100% 100%, 7px 100%, 0 calc(100% - 7px));
}

.weapon-final-chip--muted {
  color: #94a3b8;
}

.weapon-final-card__notes {
  border: 1px solid rgba(34, 211, 238, 0.16);
  background:
    linear-gradient(180deg, rgba(8, 18, 32, 0.8), rgba(2, 6, 23, 0.84)),
    linear-gradient(90deg, rgba(245, 158, 11, 0.05), transparent 60%);
  padding: 0.7rem 0.8rem;
  font-size: 0.85rem;
  line-height: 1.45;
  color: #cbd5e1;
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
}

.weapon-final-card__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 0.25rem;
}

.weapon-final-card__action {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  min-height: 2.7rem;
  padding: 0 1rem;
  border: 1px solid rgba(34, 211, 238, 0.32);
  color: rgba(236, 254, 255, 0.96);
  background:
    linear-gradient(180deg, rgba(11, 17, 32, 0.98), rgba(8, 12, 24, 0.98)),
    radial-gradient(circle at 50% 0, rgba(34, 211, 238, 0.12), transparent 9rem);
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
  box-shadow: 0 0 18px rgba(34, 211, 238, 0.12);
  transition: border-color 160ms ease, transform 160ms ease, opacity 160ms ease;
}

.weapon-final-card__action:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: rgba(103, 232, 249, 0.72);
}

.weapon-final-card__action:disabled {
  opacity: 0.46;
  cursor: not-allowed;
}

.weapon-final-card__action--primary {
  border-color: rgba(251, 191, 36, 0.38);
  color: rgba(255, 247, 237, 0.98);
  background:
    linear-gradient(180deg, rgba(81, 33, 9, 0.86), rgba(67, 20, 7, 0.94)),
    radial-gradient(circle at 50% 0, rgba(251, 191, 36, 0.16), transparent 9rem);
  box-shadow: 0 0 18px rgba(251, 191, 36, 0.16);
}

.weapon-tl-input::-webkit-outer-spin-button,
.weapon-tl-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.weapon-tl-input {
  -moz-appearance: textfield;
  appearance: textfield;
}
</style>
