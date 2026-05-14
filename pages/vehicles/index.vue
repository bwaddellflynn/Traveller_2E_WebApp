<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { CustomVehicleDesign, TravellerVehicleCategory, TravellerVehicleRecord } from '~/types/vehicle'
import VehicleBuilderCoreStep from '~/components/vehicles/VehicleBuilderCoreStep.vue'
import VehicleBuilderCustomisationsStep from '~/components/vehicles/VehicleBuilderCustomisationsStep.vue'
import VehicleBuilderAutomationStep from '~/components/vehicles/VehicleBuilderAutomationStep.vue'
import VehicleBuilderFeaturesStep from '~/components/vehicles/VehicleBuilderFeaturesStep.vue'
import VehicleBuilderInfoModal from '~/components/vehicles/VehicleBuilderInfoModal.vue'
import VehicleBuilderOptionsStep from '~/components/vehicles/VehicleBuilderOptionsStep.vue'
import VehicleBuilderProtectionStep from '~/components/vehicles/VehicleBuilderProtectionStep.vue'
import VehicleBuilderSpacesStep from '~/components/vehicles/VehicleBuilderSpacesStep.vue'
import VehicleBuilderTabs from '~/components/vehicles/VehicleBuilderTabs.vue'
import VehicleBuilderTechLevelStep from '~/components/vehicles/VehicleBuilderTechLevelStep.vue'
import { useVehiclesStore } from '~/stores/vehicles'
import {
  applyVehicleHandbookDerivations,
  cloneVehicle,
  createBlankCustomVehicle,
  createBlankVehicleCargoEntry,
  createBlankVehicleEquipmentEntry,
  createBlankVehicleOccupantEntry,
  createBlankVehicleWeapon,
  normalizeCustomVehicleDesign,
  validateCustomVehicle,
  vehicleAuxiliaryDriveOptions,
  vehicleBuilderCoreOptionFamilies,
  vehicleBuilderOptionSets,
  vehicleConstructionSummary,
  vehicleFamilyRule,
  vehiclePrimaryPowerOptions,
  vehicleQualifiedFeatureNamesForFamily,
} from '~/utils/traveller/vehicles'

type VehicleSortKey = 'name' | 'techLevel' | 'category' | 'speed' | 'agility' | 'spaces' | 'costCredits'
type VehicleSortIcon = 'sort-asc' | 'sort-desc'
type DraftInfoKey =
  | 'techLevel'
  | 'spaces'
  | 'category'
  | 'operatingSkill'
  | 'hitDm'
  | 'agility'
  | 'usableSpaces'
  | 'speed'
  | 'range'
  | 'crew'
  | 'passengers'
  | 'comfort'
  | 'cargo'
  | 'structure'
  | 'remainingSpaces'
  | 'cost'
  | 'protection'
  | 'spaceAccounting'
  | 'traits'

const vehiclesStore = useVehiclesStore()
const { activeUserId, referenceVehicles, playerBuiltVehicles } = storeToRefs(vehiclesStore)

const activeGarageTab = ref('reference')
const selectedCategory = ref<TravellerVehicleCategory | 'all'>('all')
const search = ref('')
const vehicleSortKey = ref<VehicleSortKey>('name')
const vehicleSortDirection = ref<'asc' | 'desc'>('asc')
const selectedVehicleId = ref('')
const expandedVehicleId = ref('')
const categoryMenuOpen = ref(false)
const saveMessage = ref('')
const activeBuildStep = ref(0)
const attemptedBuildSave = ref(false)
const buildDraft = ref<CustomVehicleDesign | null>(null)
const selectedCustomVehicleId = ref('')
const activeDraftInfo = ref<DraftInfoKey | null>(null)
let applyingBuildDraftDerivations = false

type VehicleBuildStep = { id: string, label: string, title: string, description: string }

const categories: { id: TravellerVehicleCategory | 'all', label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'ground', label: 'Ground' },
  { id: 'grav', label: 'Grav' },
  { id: 'aircraft', label: 'Aircraft' },
  { id: 'watercraft', label: 'Watercraft' },
  { id: 'hovercraft', label: 'Hovercraft' },
  { id: 'walker', label: 'Walker' },
  { id: 'rail', label: 'Rail' },
  { id: 'biotech', label: 'Biotech' },
]

const garageTabs = [
  { id: 'reference', label: 'Pre-Fab Vehicles' },
  { id: 'custom', label: 'Custom Vehicles' },
  { id: 'builder', label: 'Vehicle Builder' },
]
const builderSteps: VehicleBuildStep[] = [
  { id: 'tech-level', label: 'TL', title: 'Tech Level', description: 'Choose the construction era and rules availability.' },
  { id: 'core', label: 'Type', title: 'Vehicle Type', description: 'Choose the handbook vehicle type.' },
  { id: 'spaces', label: 'Spaces', title: 'Spaces', description: 'Choose the vehicle size and internal design pool.' },
  { id: 'features', label: 'Features', title: 'Features', description: 'Add chassis features allowed by the selected vehicle type.' },
  { id: 'customisations', label: 'Custom', title: 'Customisations', description: 'Choose power, performance, and auxiliary movement systems.' },
  { id: 'protection', label: 'Protection', title: 'Protection', description: 'Set armour and structural reinforcement.' },
  { id: 'options', label: 'Options', title: 'Options', description: 'Install core, external, and internal vehicle options.' },
  { id: 'automation', label: 'Automation', title: 'Automation', description: 'Install computers, software, drone control, and vehicle brains.' },
]
const builderOptionSets = vehicleBuilderOptionSets()
const builderCoreOptionFamilies = vehicleBuilderCoreOptionFamilies()
const allPrimaryPowerOptions = vehiclePrimaryPowerOptions()
const allAuxiliaryDriveOptions = vehicleAuxiliaryDriveOptions()
const sortableVehicleColumns: { key: VehicleSortKey, label: string }[] = [
  { key: 'name', label: 'Vehicle' },
  { key: 'techLevel', label: 'TL' },
  { key: 'category', label: 'Category' },
  { key: 'speed', label: 'Speed' },
  { key: 'agility', label: 'Agility' },
  { key: 'spaces', label: 'Spaces' },
  { key: 'costCredits', label: 'Cost' },
]

const speedRank: Record<string, number> = {
  Idle: 0,
  'Very Slow': 1,
  Slow: 2,
  Medium: 3,
  High: 4,
  Fast: 5,
  'Very Fast': 6,
  Subsonic: 7,
  Supersonic: 8,
  Hypersonic: 9,
  Orbital: 10,
}

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

const sortReferenceVehicles = (vehicles: TravellerVehicleRecord[]) => {
  const direction = vehicleSortDirection.value === 'asc' ? 1 : -1
  const key = vehicleSortKey.value

  return [...vehicles].sort((first, second) => {
    const firstValue = key === 'speed' ? speedRank[first.speed] ?? -1 : first[key]
    const secondValue = key === 'speed' ? speedRank[second.speed] ?? -1 : second[key]
    return compareValues(firstValue, secondValue, direction)
  })
}

const filteredReferenceVehicles = computed(() => sortReferenceVehicles(referenceVehicles.value.filter((vehicle) => {
  const matchesCategory = selectedCategory.value === 'all' || vehicle.category === selectedCategory.value
  const query = search.value.trim().toLowerCase()
  const matchesSearch = !query || [
    vehicle.name,
    vehicle.type,
    vehicle.skill,
    vehicle.speed,
    vehicle.cruiseSpeed,
    vehicle.traits.join(' '),
    vehicle.equipment.join(' '),
    vehicle.weapons.map((weapon) => `${weapon.name} ${weapon.damage} ${weapon.traits.join(' ')}`).join(' '),
    vehicle.sourceName,
  ].filter(Boolean).join(' ').toLowerCase().includes(query)

  return matchesCategory && matchesSearch
})))

const selectedVehicle = computed(() => {
  if (selectedVehicleId.value) {
    return referenceVehicles.value.find((vehicle) => vehicle.id === selectedVehicleId.value) ?? filteredReferenceVehicles.value[0] ?? null
  }
  return filteredReferenceVehicles.value[0] ?? null
})

watch(filteredReferenceVehicles, (vehicles) => {
  if (!vehicles.length) {
    selectedVehicleId.value = ''
    return
  }
  if (!vehicles.some((vehicle) => vehicle.id === selectedVehicleId.value)) {
    selectedVehicleId.value = vehicles[0]?.id ?? ''
  }
}, { immediate: true })

const setVehicleSort = (key: VehicleSortKey) => {
  if (vehicleSortKey.value === key) {
    vehicleSortDirection.value = vehicleSortDirection.value === 'asc' ? 'desc' : 'asc'
    return
  }
  vehicleSortKey.value = key
  vehicleSortDirection.value = 'asc'
}

const toggleExpandedVehicle = (vehicleId: string) => {
  expandedVehicleId.value = expandedVehicleId.value === vehicleId ? '' : vehicleId
  selectedVehicleId.value = vehicleId
}

const selectVehicleCategory = (categoryId: TravellerVehicleCategory | 'all') => {
  selectedCategory.value = categoryId
  categoryMenuOpen.value = false
}

const vehicleSortIndicator = (key: VehicleSortKey): VehicleSortIcon | null => {
  if (vehicleSortKey.value !== key) return null
  return vehicleSortDirection.value === 'asc' ? 'sort-asc' : 'sort-desc'
}

const formatCredits = (credits: number | null) => {
  if (credits === null) return '-'
  return credits >= 1000000 ? `MCr${credits / 1000000}` : `Cr${credits.toLocaleString()}`
}

const categoryLabel = (category: string) => category.split('-').map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join(' ')
const buildValidationIssues = computed(() => buildDraft.value ? validateCustomVehicle(buildDraft.value) : [])
const buildStepIssues = computed(() => {
  const issues = buildValidationIssues.value
  return {
    techLevel: issues.filter((issue) => issue.startsWith('Tech level cannot be below')),
    chassis: issues.filter((issue) => [
      'Vehicle name is required.',
      'Base vehicle type is required.',
      'Operating skill is required.',
    ].includes(issue)),
    spaces: issues.filter((issue) => issue === 'Spaces must be greater than zero.'),
    features: issues.filter((issue) => [
      'Selected features must be allowed for the base vehicle type.',
    ]),
    customisations: issues.filter((issue) => (
      issue.includes('Power')
      || issue.includes('power')
      || issue.includes('requires TL')
      || issue.includes('Speed modifications')
      || issue.includes('speed modifications')
      || issue.includes('fuel')
      || issue.includes('Fuel')
      || issue.includes('Hull')
      || issue.includes('hull')
      || issue.includes('Structural reinforcement')
      || issue.includes('One-Space vehicles')
      || issue.includes('Drive')
      || issue.includes('Lifters')
      || issue.includes('Rail Wheels')
      || issue.includes('Supercavitating')
    )),
    protection: issues.filter((issue) => issue.startsWith('Armour for ') || issue.includes('armour cannot')),
  }
})
const buildValidationIssueSteps = computed<Record<string, number>>(() => {
  const mapping: Record<string, number> = {}
  for (const issue of buildStepIssues.value.techLevel) mapping[issue] = 0
  for (const issue of buildStepIssues.value.chassis) mapping[issue] = 1
  for (const issue of buildStepIssues.value.spaces) mapping[issue] = 2
  for (const issue of buildStepIssues.value.features) mapping[issue] = 3
  for (const issue of buildStepIssues.value.customisations) mapping[issue] = 4
  for (const issue of buildStepIssues.value.protection) mapping[issue] = 5
  return mapping
})
const buildStepHasIssues = computed(() => {
  if (!attemptedBuildSave.value) return builderSteps.map(() => false)
  return [
    buildStepIssues.value.techLevel.length > 0,
    buildStepIssues.value.chassis.length > 0,
    buildStepIssues.value.spaces.length > 0,
    buildStepIssues.value.features.length > 0,
    buildStepIssues.value.customisations.length > 0,
    buildStepIssues.value.protection.length > 0,
    false,
    false,
  ]
})
const draftFieldInfoText: Record<DraftInfoKey, { title: string, body: string }> = {
  techLevel: {
    title: 'Tech Level',
    body: 'Tech Level determines which handbook technologies and construction assumptions are available. In this builder it directly affects armour materials and protection limits, power-plant legality, auxiliary-drive legality, and several baseline performance rules.',
  },
  spaces: {
    title: 'Spaces',
    body: 'Spaces are the primary chassis-size and internal-capacity value. They are not just seating. Spaces drive size band, hit DM, derived type, shipping, armour volume, installed power burden, and how much room remains for systems, crew, cargo, and weapons.',
  },
  category: {
    title: 'Category',
    body: 'Category is the high-level operating family derived from the chosen vehicle base type and any locomotion-defining feature overrides. It helps classify the vehicle as ground, grav, aircraft, watercraft, rail, walker, hovercraft, or biotech for rules and catalogue purposes. In the current builder, Rail Rider can shift a ground design into the rail category.',
  },
  operatingSkill: {
    title: 'Operating Skill',
    body: 'Operating Skill is the rules-facing skill family and specialty needed to operate the vehicle. It usually follows directly from the base vehicle type, but some chassis features can change it. In this builder, ordinary ground vehicles default to Drive (wheel), Tracks changes the operating skill to Drive (track), and Tunneller changes it to Drive (mole). Rail Rider currently keeps Drive (wheel) while shifting the vehicle into rail configuration.',
  },
  hitDm: {
    title: 'Hit DM',
    body: 'Hit DM is the target-size modifier applied when the vehicle is attacked. Larger vehicles are easier to hit and therefore gain higher positive modifiers. In this builder it is derived from Spaces using the handbook target-size table.',
  },
  agility: {
    title: 'Agility',
    body: 'Agility reflects how readily the vehicle responds to control inputs in motion. It is derived from the base family, modified by size and some features such as Agile, and then further affected by auxiliary-drive choices where applicable.',
  },
  usableSpaces: {
    title: 'Usable Spaces',
    body: 'Usable Spaces are the internal spaces available after chassis-scale rules, power-plant burden, and auxiliary-drive allocation are accounted for. This is the pool you are effectively spending on armour, equipment, and mounted systems.',
  },
  speed: {
    title: 'Speed',
    body: 'Speed is the current maximum speed band after the handbook baseline, size effects, feature modifiers, and any speed customisation steps are applied. It should be read together with Cruise Speed and Range when evaluating the final mobility profile.',
  },
  range: {
    title: 'Range',
    body: 'Range is the endurance distance derived from the family baseline, Tech Level, fuel-efficiency changes, fuel-capacity changes, and any relevant power-plant multipliers. Cruise Range reflects the same vehicle operated at cruising speed rather than top speed.',
  },
  crew: {
    title: 'Crew',
    body: 'Crew is the number of people needed to operate and support the vehicle under normal conditions. This is an operational requirement rather than a chassis-derived number, so it should be chosen to match the vehicle role and onboard systems.',
  },
  passengers: {
    title: 'Passengers',
    body: 'Passengers represent carried personnel beyond operating crew. This value is part of the vehicle role definition and should be considered alongside comfort and cargo when determining how the vehicle is actually used.',
  },
  comfort: {
    title: 'Comfort',
    body: 'Comfort indicates the habitability and travel quality expected for occupants. It is not just descriptive flavour; it expresses the intended travel standard and helps distinguish austere utility vehicles from civilian or luxury transports.',
  },
  cargo: {
    title: 'Cargo',
    body: 'Cargo is the carried load capacity recorded for the vehicle. It complements usable-space accounting by describing the actual transport role or payload expectation for the finished design.',
  },
  structure: {
    title: 'Structure',
    body: 'Structure is the vehicle’s derived durability based on hull class, family rules, and Spaces. It represents the underlying resilience of the chassis before armour allocation is considered separately.',
  },
  remainingSpaces: {
    title: 'Remaining Spaces',
    body: 'Remaining Spaces are the usable spaces left after current armour, equipment, and mounted-weapon allocations. Negative values mean the design is currently over-allocated and needs spaces freed or the chassis revised.',
  },
  cost: {
    title: 'Cost',
    body: 'Cost is the current derived credit total after baseline family cost per space, hull class, power plant, speed and range tuning, armour cost, and other modeled adjustments are applied. It is a running construction estimate for the current design state.',
  },
  protection: {
    title: 'Protection',
    body: 'Protection summarizes the active armour rule context: base protection from Tech Level, maximum protection, and current armour-space burden. This is the defensive rules layer that sits on top of the chassis and structure.',
  },
  spaceAccounting: {
    title: 'Space Accounting',
    body: 'Space Accounting shows where the build is currently spending internal capacity. Armour, equipment, mounted weapons, auxiliary-drive allocation, and power-plant burden all compete for the vehicle’s total design space.',
  },
  traits: {
    title: 'Traits',
    body: 'Traits are the distilled rules-facing qualities of the current design. They are derived from the selected base family, size band, auxiliary drive, and chosen features, and should be read as the vehicle’s resulting special rules profile.',
  },
}
const buildDraftFamilyRule = computed(() => buildDraft.value ? vehicleFamilyRule(buildDraft.value.baseFamily) : null)
const buildDraftConstructionSummary = computed(() => buildDraft.value ? vehicleConstructionSummary(buildDraft.value) : null)
const buildDraftBaseCostCredits = computed(() => buildDraft.value?.costCredits ?? 0)
const buildDraftTotalCostCredits = computed(() => (
  buildDraftBaseCostCredits.value + (buildDraftConstructionSummary.value?.armourSummary.armourCost ?? 0)
))
const buildDraftTotalCostLabel = computed(() => formatCredits(Math.round(buildDraftTotalCostCredits.value)))
const buildDraftBaseCostLabel = computed(() => formatCredits(Math.round(buildDraftBaseCostCredits.value)))
const buildDraftPrimaryPowerOptions = computed(() => {
  if (!buildDraft.value) return allPrimaryPowerOptions
  return allPrimaryPowerOptions.filter((option) => !option.allowedFamilies || option.allowedFamilies.includes(buildDraft.value!.baseFamily))
})
const buildDraftAuxiliaryDriveOptions = computed(() => {
  if (!buildDraft.value) return allAuxiliaryDriveOptions
  return allAuxiliaryDriveOptions.filter((option) => !option.allowedFamilies || option.allowedFamilies.includes(buildDraft.value!.baseFamily) || option.id === 'none')
})
// Vehicle handbook derivations mutate the draft in place. This guard prevents
// those derived writes from recursively retriggering the same synchronization
// watcher during a single reactive flush.
const syncBuildDraftDerivations = () => {
  if (!buildDraft.value || applyingBuildDraftDerivations) return
  applyingBuildDraftDerivations = true
  try {
    applyVehicleHandbookDerivations(buildDraft.value)
  }
  finally {
    applyingBuildDraftDerivations = false
  }
}

const setBuildStep = (index: number) => {
  activeBuildStep.value = index
}

const goToPreviousBuildStep = () => {
  if (activeBuildStep.value <= 0) return
  activeBuildStep.value -= 1
}

const goToNextBuildStep = () => {
  const nextIndex = activeBuildStep.value + 1
  if (nextIndex >= builderSteps.length) return
  activeBuildStep.value = nextIndex
}

const ensureBuildDraft = () => {
  if (buildDraft.value) return
  buildDraft.value = createBlankCustomVehicle(activeUserId.value)
  syncBuildDraftDerivations()
}

const newVehicle = () => {
  buildDraft.value = createBlankCustomVehicle(activeUserId.value)
  selectedCustomVehicleId.value = ''
  activeGarageTab.value = 'builder'
  activeBuildStep.value = 0
  saveMessage.value = ''
  attemptedBuildSave.value = false
  syncBuildDraftDerivations()
}

const editVehicle = (vehicleId: string) => {
  const vehicle = vehiclesStore.getCustomVehicle(vehicleId)
  if (!vehicle) return
  buildDraft.value = normalizeCustomVehicleDesign(cloneVehicle(vehicle))
  syncBuildDraftDerivations()
  selectedCustomVehicleId.value = vehicle.id
  activeGarageTab.value = 'builder'
  activeBuildStep.value = 0
  saveMessage.value = ''
  attemptedBuildSave.value = false
}

const saveVehicle = () => {
  if (!buildDraft.value) return
  attemptedBuildSave.value = true
  if (buildValidationIssues.value.length) {
    activeBuildStep.value = builderSteps.length - 1
    saveMessage.value = ''
    return
  }
  const saved = vehiclesStore.saveCustomVehicle(buildDraft.value)
  buildDraft.value = cloneVehicle(saved)
  selectedCustomVehicleId.value = saved.id
  saveMessage.value = `Saved ${saved.name || 'Custom Vehicle'}`
}

const duplicateVehicle = (vehicleId: string) => {
  const copy = vehiclesStore.duplicateCustomVehicle(vehicleId)
  if (!copy) return
  buildDraft.value = normalizeCustomVehicleDesign(cloneVehicle(copy))
  syncBuildDraftDerivations()
  selectedCustomVehicleId.value = copy.id
  activeGarageTab.value = 'builder'
  activeBuildStep.value = 0
  saveMessage.value = `Duplicated ${copy.name || 'Custom Vehicle'}`
  attemptedBuildSave.value = false
}

const deleteVehicle = (vehicleId: string) => {
  vehiclesStore.deleteCustomVehicle(vehicleId)
  if (selectedCustomVehicleId.value === vehicleId) {
    selectedCustomVehicleId.value = ''
    buildDraft.value = createBlankCustomVehicle(activeUserId.value)
    syncBuildDraftDerivations()
  }
  saveMessage.value = 'Deleted vehicle'
  attemptedBuildSave.value = false
}

const toggleFeature = (value: string) => {
  ensureBuildDraft()
  if (!buildDraft.value) return
  const features = buildDraft.value.features ?? []
  buildDraft.value.features = features.includes(value)
    ? features.filter((feature) => feature !== value)
    : [...features, value]
  syncBuildDraftDerivations()
}

const addEquipmentEntry = (catalogueId?: string) => {
  ensureBuildDraft()
  if (!buildDraft.value) return
  const selected = catalogueId
    ? builderOptionSets.equipmentLibrary.flatMap((group) => group.items).find((entry) => entry.id === catalogueId)
    : null
  buildDraft.value.equipmentEntries.push(selected
    ? {
        name: selected.name,
        spaces: 0,
        category: selected.category,
        catalogueId: selected.id,
      }
    : createBlankVehicleEquipmentEntry())
  syncBuildDraftDerivations()
}

const removeEquipmentEntry = (index: number) => {
  buildDraft.value?.equipmentEntries.splice(index, 1)
  syncBuildDraftDerivations()
}

const addOccupantEntry = (category: 'crew' | 'passenger') => {
  ensureBuildDraft()
  if (!buildDraft.value) return
  buildDraft.value.occupantEntries.push(createBlankVehicleOccupantEntry(category))
  syncBuildDraftDerivations()
}

const removeOccupantEntry = (index: number) => {
  buildDraft.value?.occupantEntries.splice(index, 1)
  syncBuildDraftDerivations()
}

const addCargoEntry = () => {
  ensureBuildDraft()
  if (!buildDraft.value) return
  buildDraft.value.cargoEntries.push(createBlankVehicleCargoEntry())
  syncBuildDraftDerivations()
}

const removeCargoEntry = (index: number) => {
  buildDraft.value?.cargoEntries.splice(index, 1)
  syncBuildDraftDerivations()
}

const addVehicleWeapon = () => {
  ensureBuildDraft()
  buildDraft.value?.weapons.push(createBlankVehicleWeapon())
  syncBuildDraftDerivations()
}

const addStockVehicleWeapon = (stockWeaponId: string) => {
  ensureBuildDraft()
  if (!buildDraft.value) return
  const stockWeapon = builderOptionSets.stockWeaponLibrary.find((entry) => entry.id === stockWeaponId)
  if (!stockWeapon) return
  buildDraft.value.weapons.push(cloneVehicle(stockWeapon.weapon))
  syncBuildDraftDerivations()
}

const removeVehicleWeapon = (index: number) => {
  buildDraft.value?.weapons.splice(index, 1)
  syncBuildDraftDerivations()
}

watch(activeGarageTab, (tab) => {
  if (tab === 'builder') ensureBuildDraft()
}, { immediate: true })
</script>

<template>
  <main class="min-h-screen text-cyan-50">
    <section class="mx-auto w-full max-w-[96rem] px-5 pt-6 sm:px-8 lg:px-10">
      <div class="hud-tabs flex flex-wrap gap-2 border-b border-cyan-400/30">
        <button
          v-for="tab in garageTabs"
          :key="tab.id"
          class="-mb-px rounded-t-md border border-transparent px-4 py-3 text-sm font-semibold"
          :class="activeGarageTab === tab.id ? 'border-zinc-300 border-b-white bg-white text-zinc-950' : 'text-zinc-600 hover:text-zinc-950'"
          type="button"
          @click="activeGarageTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>
    </section>

    <section v-if="activeGarageTab === 'reference'" class="mx-auto grid w-full max-w-[96rem] gap-5 px-5 py-6 sm:px-8 xl:grid-cols-[minmax(0,1fr)_25rem] lg:px-10">
      <div class="grid gap-5">
        <section class="hud-panel rounded-lg border p-5 shadow-sm">
          <div class="list-reference-header flex flex-wrap items-center justify-between gap-3">
            <div class="list-reference-title">
              <h2 class="text-xl font-semibold">Reference Vehicles</h2>
            </div>
            <div class="list-search-actions">
              <input v-model="search" class="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="Search vehicles">
              <button
                class="list-category-toggle hud-link h-10 w-11"
                :aria-expanded="categoryMenuOpen"
                aria-label="Toggle vehicle categories"
                type="button"
                @click.stop.prevent="categoryMenuOpen = !categoryMenuOpen"
              >
                <span :class="['list-category-toggle__line', categoryMenuOpen ? 'is-open' : '']" />
                <span :class="['list-category-toggle__line', categoryMenuOpen ? 'is-open' : '']" />
                <span :class="['list-category-toggle__line', categoryMenuOpen ? 'is-open' : '']" />
              </button>
            </div>
          </div>

          <div :class="['list-category-panel mt-4', categoryMenuOpen ? 'is-open' : '']">
            <button
              v-for="category in categories"
              :key="category.id"
              class="rounded-md border px-3 py-2 text-sm font-semibold"
              :class="selectedCategory === category.id ? 'border-zinc-950 bg-zinc-950 text-white' : 'border-zinc-300 text-zinc-700 hover:border-amber-600'"
              type="button"
              @click="selectVehicleCategory(category.id)"
            >
              {{ category.label }}
            </button>
          </div>

          <div class="hud-table-shell hud-scrollbar mt-4 max-h-[46rem] overflow-auto rounded-md border">
            <table class="mobile-collapsible-table w-full min-w-[68rem] text-left text-sm">
              <thead class="sticky top-0 z-10 bg-stone-100 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th v-for="column in sortableVehicleColumns" :key="column.key" class="px-3 py-2">
                    <button class="flex items-center gap-1 font-semibold uppercase tracking-wide hover:text-zinc-950" type="button" @click="setVehicleSort(column.key)">
                      <span>{{ column.label }}</span>
                      <span class="inline-flex h-4 w-4 items-center text-amber-700">
                        <AppIcon v-if="vehicleSortIndicator(column.key)" class="h-4 w-4" :name="vehicleSortIndicator(column.key) ?? 'sort-asc'" />
                      </span>
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                <template v-for="vehicle in filteredReferenceVehicles" :key="vehicle.id">
                <tr
                  class="cursor-pointer border-t border-zinc-200 align-top"
                  :class="selectedVehicle?.id === vehicle.id ? 'bg-cyan-50/80' : 'hover:bg-stone-50'"
                  @click="selectedVehicleId = vehicle.id"
                >
                  <td class="px-3 py-2 font-semibold text-zinc-950">
                    <button class="mobile-row-toggle block w-full text-left font-semibold" type="button" @click.stop="toggleExpandedVehicle(vehicle.id)">
                      {{ vehicle.name }}
                    </button>
                    <span class="mt-1 block text-xs font-medium text-zinc-500">{{ vehicle.sourceName ?? vehicle.sourceId }}<template v-if="vehicle.sourcePage"> p. {{ vehicle.sourcePage }}</template></span>
                  </td>
                  <td class="px-3 py-2">{{ vehicle.techLevel }}</td>
                  <td class="px-3 py-2">{{ categoryLabel(vehicle.category) }}</td>
                  <td class="px-3 py-2">{{ vehicle.speed }} <span class="text-zinc-500">({{ vehicle.cruiseSpeed }})</span></td>
                  <td class="px-3 py-2">{{ vehicle.agility }}</td>
                  <td class="px-3 py-2">{{ vehicle.spaces }}</td>
                  <td class="px-3 py-2">{{ formatCredits(vehicle.costCredits) }}</td>
                </tr>
                <tr v-if="expandedVehicleId === vehicle.id" class="mobile-detail-row border-t border-cyan-400/20">
                  <td :colspan="sortableVehicleColumns.length" class="px-3 py-3">
                    <div class="mobile-row-detail-grid">
                      <div><span>TL</span><strong>{{ vehicle.techLevel }}</strong></div>
                      <div><span>Category</span><strong>{{ categoryLabel(vehicle.category) }}</strong></div>
                      <div><span>Speed</span><strong>{{ vehicle.speed }} ({{ vehicle.cruiseSpeed }})</strong></div>
                      <div><span>Agility</span><strong>{{ vehicle.agility }}</strong></div>
                      <div><span>Spaces</span><strong>{{ vehicle.spaces }}</strong></div>
                      <div><span>Cost</span><strong>{{ formatCredits(vehicle.costCredits) }}</strong></div>
                      <div><span>Skill</span><strong>{{ vehicle.skill }}</strong></div>
                      <div><span>Crew / Passengers</span><strong>{{ vehicle.crew }} / {{ vehicle.passengers }}</strong></div>
                      <div class="sm:col-span-2"><span>Traits</span><strong>{{ vehicle.traits.join(', ') || '-' }}</strong></div>
                    </div>
                  </td>
                </tr>
                </template>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <aside v-if="selectedVehicle" class="hud-panel hud-scrollbar rounded-lg border p-5 shadow-sm xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-auto">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="hud-kicker text-xs font-semibold uppercase tracking-wide">{{ selectedVehicle.type }}</p>
            <h2 class="mt-2 text-2xl font-semibold">{{ selectedVehicle.name }}</h2>
            <p class="mt-1 text-sm text-cyan-100/70">
              {{ selectedVehicle.sourceName }}
              <template v-if="selectedVehicle.sourcePage"> p. {{ selectedVehicle.sourcePage }}</template>
            </p>
          </div>
          <span class="hud-glyph grid h-10 w-10 shrink-0 place-items-center rounded-md">
            <AppIcon name="car" />
          </span>
        </div>

        <div class="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div class="hud-stat rounded-md border p-3">
            <p class="text-xs uppercase tracking-wide text-zinc-400">TL</p>
            <p class="mt-1 text-lg font-semibold">{{ selectedVehicle.techLevel }}</p>
          </div>
          <div class="hud-stat rounded-md border p-3">
            <p class="text-xs uppercase tracking-wide text-zinc-400">Agility</p>
            <p class="mt-1 text-lg font-semibold">{{ selectedVehicle.agility }}</p>
          </div>
          <div class="hud-stat rounded-md border p-3">
            <p class="text-xs uppercase tracking-wide text-zinc-400">Speed</p>
            <p class="mt-1 text-lg font-semibold">{{ selectedVehicle.speed }}</p>
            <p class="text-xs text-zinc-400">Cruise {{ selectedVehicle.cruiseSpeed }}</p>
          </div>
          <div class="hud-stat rounded-md border p-3">
            <p class="text-xs uppercase tracking-wide text-zinc-400">Range</p>
            <p class="mt-1 text-lg font-semibold">{{ selectedVehicle.range }}</p>
            <p class="text-xs text-zinc-400">Cruise {{ selectedVehicle.cruiseRange }}</p>
          </div>
        </div>

        <div class="mt-5 grid gap-2 text-sm">
          <div class="flex justify-between gap-3 rounded-md bg-white/5 px-3 py-2">
            <span class="text-cyan-100/70">Skill</span>
            <span class="font-semibold">{{ selectedVehicle.skill }}</span>
          </div>
          <div class="flex justify-between gap-3 rounded-md bg-white/5 px-3 py-2">
            <span class="text-cyan-100/70">Crew / Passengers</span>
            <span class="font-semibold">{{ selectedVehicle.crew }} / {{ selectedVehicle.passengers }}</span>
          </div>
          <div class="flex justify-between gap-3 rounded-md bg-white/5 px-3 py-2">
            <span class="text-cyan-100/70">Structure</span>
            <span class="font-semibold">{{ selectedVehicle.structure }}</span>
          </div>
          <div class="flex justify-between gap-3 rounded-md bg-white/5 px-3 py-2">
            <span class="text-cyan-100/70">Shipping</span>
            <span class="font-semibold">{{ selectedVehicle.shipping }}</span>
          </div>
          <div class="flex justify-between gap-3 rounded-md bg-white/5 px-3 py-2">
            <span class="text-cyan-100/70">Cost</span>
            <span class="font-semibold">{{ selectedVehicle.cost }}</span>
          </div>
        </div>

        <div class="mt-5">
          <p class="text-sm font-semibold">Traits</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <span v-for="trait in selectedVehicle.traits" :key="trait" class="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-2 py-1 text-xs font-semibold text-cyan-100">
              {{ trait }}
            </span>
            <span v-if="!selectedVehicle.traits.length" class="text-sm text-cyan-100/70">None</span>
          </div>
        </div>

        <div class="mt-5">
          <p class="text-sm font-semibold">Armour</p>
          <div class="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div v-for="(value, facing) in selectedVehicle.armour" :key="facing" class="rounded-md bg-white/5 px-3 py-2">
              <span class="capitalize text-cyan-100/70">{{ facing }}</span>
              <span class="float-right font-semibold">{{ value }}</span>
            </div>
          </div>
        </div>

        <div class="mt-5">
          <p class="text-sm font-semibold">Equipment</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <span v-for="item in selectedVehicle.equipment" :key="item" class="rounded-md bg-white/5 px-2 py-1 text-xs text-cyan-100/80">
              {{ item }}
            </span>
          </div>
        </div>

        <div v-if="selectedVehicle.weapons.length" class="mt-5">
          <p class="text-sm font-semibold">Weapons</p>
          <div class="mt-2 grid gap-2">
            <div v-for="weapon in selectedVehicle.weapons" :key="weapon.name" class="rounded-md border border-cyan-300/20 bg-white/5 p-3 text-sm">
              <p class="font-semibold">{{ weapon.name }}</p>
              <p class="mt-1 text-cyan-100/70">{{ weapon.range }} · {{ weapon.damage }} · FC {{ weapon.fireControl }}</p>
              <p v-if="weapon.traits.length" class="mt-1 text-xs text-cyan-100/60">{{ weapon.traits.join(', ') }}</p>
            </div>
          </div>
        </div>

        <p v-if="selectedVehicle.notes" class="mt-5 rounded-md border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">
          {{ selectedVehicle.notes }}
        </p>
      </aside>
    </section>

    <section v-else-if="activeGarageTab === 'builder'" class="mx-auto w-full max-w-[96rem] px-5 py-6 sm:px-8 lg:px-10">
      <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section class="hud-panel rounded-lg border p-5 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="hud-kicker text-sm font-semibold uppercase tracking-wide">Player Builds</p>
              <h2 class="mt-2 text-2xl font-semibold">Custom Vehicle Builder</h2>
              <p class="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
                Build a vehicle step by step, starting with the handbook type, feature, and protection sequence.
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button class="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 hover:border-amber-600" type="button" @click="newVehicle">
                New
              </button>
              <button
                class="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 hover:border-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="!buildDraft"
                type="button"
                @click="saveVehicle"
              >
                Save
              </button>
            </div>
          </div>

          <p v-if="saveMessage" class="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900">
            {{ saveMessage }}
          </p>

          <VehicleBuilderTabs
            :steps="builderSteps"
            :active-step="activeBuildStep"
            :step-has-issues="buildStepHasIssues"
            @select-step="setBuildStep"
          />

          <div v-if="buildDraft" class="mt-5 rounded-md border border-zinc-200 p-5">
            <div>
              <VehicleBuilderTechLevelStep
                v-if="activeBuildStep === 0"
                :vehicle="buildDraft"
                @sync-derivations="syncBuildDraftDerivations"
              />

              <VehicleBuilderCoreStep
                v-else-if="activeBuildStep === 1"
                :vehicle="buildDraft"
                :option-sets="{
                  baseFamilies: builderOptionSets.baseFamilies,
                  hulls: builderOptionSets.hulls,
                  skills: builderOptionSets.skills,
                }"
                @sync-derivations="syncBuildDraftDerivations"
              />

              <VehicleBuilderSpacesStep
                v-else-if="activeBuildStep === 2"
                :vehicle="buildDraft"
                @sync-derivations="syncBuildDraftDerivations"
              />

              <VehicleBuilderFeaturesStep
                v-else-if="activeBuildStep === 3"
                :vehicle="buildDraft"
                :allowed-features="buildDraft ? vehicleQualifiedFeatureNamesForFamily(buildDraft.baseFamily) : []"
                @toggle-feature="toggleFeature"
              />

              <VehicleBuilderCustomisationsStep
                v-else-if="activeBuildStep === 4"
                :vehicle="buildDraft"
                :option-sets="{
                  primaryPowerOptions: buildDraftPrimaryPowerOptions,
                  auxiliaryDriveOptions: buildDraftAuxiliaryDriveOptions,
                }"
                :summary="buildDraftConstructionSummary ?? {
                  availableSpaces: buildDraft.spaces,
                  powerPlantSpaces: 0,
                  auxiliarySpaces: 0,
                  remainingSpaces: buildDraft.spaces,
                  auxiliarySummary: null,
                }"
                @sync-derivations="syncBuildDraftDerivations"
              />

              <VehicleBuilderProtectionStep
                v-else-if="activeBuildStep === 5"
                :vehicle="buildDraft"
                :summary="buildDraftConstructionSummary ?? { armourSummary: { rule: { materials: '-' }, baseProtection: 0, maximumProtection: 0, equivalentAddedProtection: 0, armourSpaces: 0, armourCost: 0 } }"
              />

              <VehicleBuilderOptionsStep
                v-else-if="activeBuildStep === 6"
                :vehicle="buildDraft"
                @sync-derivations="syncBuildDraftDerivations"
              />

              <VehicleBuilderAutomationStep
                v-else
                :vehicle="buildDraft"
                @sync-derivations="syncBuildDraftDerivations"
              />
            </div>

            <div class="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-4">
              <button
                class="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-amber-600 disabled:cursor-not-allowed disabled:opacity-45"
                :disabled="activeBuildStep === 0"
                type="button"
                @click="goToPreviousBuildStep"
              >
                Previous
              </button>

              <div class="text-xs text-zinc-500">
                Step {{ activeBuildStep + 1 }} of {{ builderSteps.length }}
              </div>

              <button
                class="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-950 transition hover:border-cyan-300 disabled:cursor-not-allowed disabled:opacity-45"
                :disabled="activeBuildStep >= builderSteps.length - 1"
                type="button"
                @click="goToNextBuildStep"
              >
                Next
              </button>
            </div>
          </div>
        </section>

        <aside class="grid gap-5">
          <section class="hud-panel rounded-lg border p-5 shadow-sm">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="hud-kicker text-xs font-semibold uppercase tracking-wide">Current Draft</p>
                <h3 class="mt-2 text-xl font-semibold">{{ buildDraft?.name || 'Unnamed Vehicle' }}</h3>
                <p class="mt-1 text-sm text-cyan-100/70">{{ buildDraft?.type || 'Vehicle type pending' }}</p>
              </div>
              <span class="hud-glyph grid h-10 w-10 shrink-0 place-items-center rounded-md">
                <AppIcon name="car" />
              </span>
            </div>

            <div v-if="buildDraft" class="mt-5 grid gap-4 text-sm">
              <div class="grid gap-px overflow-hidden rounded-md border border-cyan-400/20">
                <div class="grid grid-cols-[7.5rem_minmax(0,1fr)]">
                  <div class="bg-cyan-400/20 px-2 py-1 font-black uppercase tracking-wide text-cyan-100">TL</div>
                  <div class="border-b border-cyan-400/20 px-2 py-1 text-cyan-50">{{ buildDraft.techLevel }}</div>
                </div>
                <div class="grid grid-cols-[7.5rem_minmax(0,1fr)]">
                  <div class="bg-cyan-400/20 px-2 py-1 font-black uppercase tracking-wide text-cyan-100">Skill</div>
                  <div class="border-b border-cyan-400/20 px-2 py-1 text-cyan-50">{{ buildDraft.skill || '-' }}</div>
                </div>
                <div class="grid grid-cols-[7.5rem_minmax(0,1fr)]">
                  <div class="bg-cyan-400/20 px-2 py-1 font-black uppercase tracking-wide text-cyan-100">Agility</div>
                  <div class="border-b border-cyan-400/20 px-2 py-1 text-cyan-50">{{ buildDraft.agility || '-' }}</div>
                </div>
                <div class="grid grid-cols-[7.5rem_minmax(0,1fr)]">
                  <div class="bg-cyan-400/20 px-2 py-1 font-black uppercase tracking-wide text-cyan-100">Hull</div>
                  <div class="border-b border-cyan-400/20 px-2 py-1 text-cyan-50">{{ buildDraft.hull }} / {{ buildDraft.structure || '-' }}</div>
                </div>
                <div class="grid grid-cols-[7.5rem_minmax(0,1fr)]">
                  <div class="bg-cyan-400/20 px-2 py-1 font-black uppercase tracking-wide text-cyan-100">Spaces</div>
                  <div class="border-b border-cyan-400/20 px-2 py-1 text-cyan-50">{{ buildDraft.spaces }} total · {{ buildDraftConstructionSummary?.remainingSpaces ?? 0 }} open</div>
                </div>
                <div class="grid grid-cols-[7.5rem_minmax(0,1fr)]">
                  <div class="bg-cyan-400/20 px-2 py-1 font-black uppercase tracking-wide text-cyan-100">Cost</div>
                  <div class="border-b border-cyan-400/20 px-2 py-1 text-cyan-50">{{ buildDraftTotalCostLabel }}</div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <button class="hud-stat rounded-md border p-3 text-left transition hover:border-cyan-300/50 hover:bg-white/5" type="button" @click="activeDraftInfo = 'speed'">
                  <p class="text-xs uppercase tracking-wide text-zinc-400">Speed</p>
                  <p class="mt-1 text-lg font-semibold">{{ buildDraft.speed || '-' }}</p>
                </button>
                <button class="hud-stat rounded-md border p-3 text-left transition hover:border-cyan-300/50 hover:bg-white/5" type="button" @click="activeDraftInfo = 'range'">
                  <p class="text-xs uppercase tracking-wide text-zinc-400">Range</p>
                  <p class="mt-1 text-lg font-semibold">{{ buildDraft.range || '-' }}</p>
                </button>
                <button class="hud-stat rounded-md border p-3 text-left transition hover:border-cyan-300/50 hover:bg-white/5" type="button" @click="activeDraftInfo = 'protection'">
                  <p class="text-xs uppercase tracking-wide text-zinc-400">Protection</p>
                  <p class="mt-1 text-sm font-semibold leading-5">+{{ buildDraftConstructionSummary?.armourSummary.baseProtection ?? 0 }} / +{{ buildDraftConstructionSummary?.armourSummary.maximumProtection ?? 0 }}</p>
                </button>
                <button class="hud-stat rounded-md border p-3 text-left transition hover:border-cyan-300/50 hover:bg-white/5" type="button" @click="activeDraftInfo = 'hitDm'">
                  <p class="text-xs uppercase tracking-wide text-zinc-400">Hit DM</p>
                  <p class="mt-1 text-lg font-semibold">{{ buildDraft.hitDm }}</p>
                </button>
              </div>

              <div class="rounded-md border border-cyan-400/20 bg-white/5 px-3 py-3">
                <p class="text-xs uppercase tracking-wide text-zinc-400">Features</p>
                <div v-if="buildDraft.features.length" class="mt-2 flex flex-wrap gap-2">
                  <span v-for="feature in buildDraft.features" :key="feature" class="rounded-md border border-cyan-300/25 bg-cyan-300/10 px-2 py-1 text-xs text-cyan-100">
                    {{ feature }}
                  </span>
                </div>
                <p v-else class="mt-2 text-xs text-zinc-400">None selected</p>
              </div>

              <div class="rounded-md border border-cyan-400/20 bg-white/5 px-3 py-3">
                <p class="text-xs uppercase tracking-wide text-zinc-400">Options</p>
                <div v-if="buildDraft.equipmentEntries.filter((entry) => entry.category !== 'Automation').length" class="mt-2 grid gap-2">
                  <div
                    v-for="(entry, index) in buildDraft.equipmentEntries.filter((entry) => entry.category !== 'Automation')"
                    :key="`${entry.name}-${index}`"
                    class="rounded-md border border-cyan-300/20 bg-slate-950/40 px-2 py-2"
                  >
                    <p class="text-xs font-semibold text-cyan-100">{{ entry.name }}</p>
                    <p class="mt-1 text-[11px] text-cyan-100/60">{{ entry.category || 'Option' }} · {{ entry.spaces }} Spaces</p>
                  </div>
                </div>
                <p v-else class="mt-2 text-xs text-zinc-400">None installed</p>
              </div>

              <div class="rounded-md border border-cyan-400/20 bg-white/5 px-3 py-3">
                <p class="text-xs uppercase tracking-wide text-zinc-400">Automation</p>
                <div v-if="buildDraft.equipmentEntries.filter((entry) => entry.category === 'Automation').length" class="mt-2 grid gap-2">
                  <div
                    v-for="(entry, index) in buildDraft.equipmentEntries.filter((entry) => entry.category === 'Automation')"
                    :key="`${entry.name}-${index}`"
                    class="rounded-md border border-cyan-300/20 bg-slate-950/40 px-2 py-2"
                  >
                    <p class="text-xs font-semibold text-cyan-100">{{ entry.name }}</p>
                    <p class="mt-1 text-[11px] text-cyan-100/60">{{ entry.spaces }} Spaces</p>
                  </div>
                </div>
                <p v-else class="mt-2 text-xs text-zinc-400">None installed</p>
              </div>

              <button v-if="buildDraft.traits.length" class="rounded-md border border-cyan-400/20 bg-white/5 px-3 py-3 text-left transition hover:border-cyan-300/50" type="button" @click="activeDraftInfo = 'traits'">
                <p class="text-xs uppercase tracking-wide text-zinc-400">Traits</p>
                <div class="mt-2 flex flex-wrap gap-2">
                  <span v-for="trait in buildDraft.traits" :key="trait" class="rounded-md border border-cyan-300/25 bg-cyan-300/10 px-2 py-1 text-xs text-cyan-100">
                    {{ trait }}
                  </span>
                </div>
              </button>
            </div>
          </section>
        </aside>
      </div>
    </section>

    <section v-else-if="activeGarageTab === 'custom'" class="mx-auto w-full max-w-[96rem] px-5 py-6 sm:px-8 lg:px-10">
      <section class="hud-panel rounded-lg border p-5 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="hud-kicker text-sm font-semibold uppercase tracking-wide">Player Builds</p>
            <h2 class="mt-2 text-2xl font-semibold">Custom Vehicles</h2>
            <p class="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
              Saved custom vehicle designs. Open one to continue editing in the builder.
            </p>
          </div>
          <button class="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 hover:border-amber-600" type="button" @click="newVehicle">
            New Vehicle
          </button>
        </div>

        <div class="mt-5 flex items-center justify-between gap-3 border-b border-cyan-400/20 pb-3">
          <h3 class="text-lg font-semibold">Saved Vehicles</h3>
          <span class="text-xs text-zinc-500">{{ playerBuiltVehicles.length }} saved</span>
        </div>

        <div v-if="playerBuiltVehicles.length" class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div
            v-for="vehicle in playerBuiltVehicles"
            :key="vehicle.id"
            class="rounded-md border p-4"
            :class="selectedCustomVehicleId === vehicle.id ? 'border-cyan-400/50 bg-cyan-50/5' : 'border-zinc-200 bg-stone-50/30'"
          >
            <button class="block min-w-0 text-left" type="button" @click="editVehicle(vehicle.id)">
              <p class="font-semibold text-zinc-950">{{ vehicle.name || 'Unnamed Vehicle' }}</p>
              <p class="mt-1 text-sm text-zinc-600">{{ vehicle.type || '-' }} · TL {{ vehicle.techLevel }}</p>
              <p class="mt-2 text-xs text-zinc-500">{{ vehicle.spaces }} Spaces · {{ vehicle.speed || 'Speed pending' }} · {{ formatCredits(vehicle.costCredits) }}</p>
            </button>
            <div class="mt-4 flex flex-wrap items-center gap-2">
              <button class="rounded-md border border-zinc-300 px-2 py-1 text-xs font-semibold text-zinc-700 hover:border-amber-600" type="button" @click="editVehicle(vehicle.id)">
                Edit
              </button>
              <button class="rounded-md border border-zinc-300 px-2 py-1 text-xs font-semibold text-zinc-700 hover:border-amber-600" type="button" @click="duplicateVehicle(vehicle.id)">
                Duplicate
              </button>
              <button class="rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-700 hover:border-red-500" type="button" @click="deleteVehicle(vehicle.id)">
                Delete
              </button>
            </div>
          </div>
        </div>
        <p v-else class="mt-4 rounded-md bg-stone-50 p-4 text-sm text-zinc-600">No custom vehicles saved yet.</p>
      </section>
    </section>

    <VehicleBuilderInfoModal
      :open="activeDraftInfo !== null"
      :title="activeDraftInfo ? draftFieldInfoText[activeDraftInfo].title : ''"
      :body="activeDraftInfo ? draftFieldInfoText[activeDraftInfo].body : ''"
      @close="activeDraftInfo = null"
    />
  </main>
</template>
