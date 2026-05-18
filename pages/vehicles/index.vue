<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { CustomVehicleDesign, TravellerVehicleCategory, TravellerVehicleRecord, TravellerVehicleWeapon } from '~/types/vehicle'
import VehicleBuilderCoreStep from '~/components/vehicles/VehicleBuilderCoreStep.vue'
import VehicleBuilderCustomisationsStep from '~/components/vehicles/VehicleBuilderCustomisationsStep.vue'
import VehicleBuilderCargoAllocationStep from '~/components/vehicles/VehicleBuilderCargoAllocationStep.vue'
import VehicleBuilderAutomationStep from '~/components/vehicles/VehicleBuilderAutomationStep.vue'
import VehicleBuilderFeaturesStep from '~/components/vehicles/VehicleBuilderFeaturesStep.vue'
import VehicleBuilderInfoModal from '~/components/vehicles/VehicleBuilderInfoModal.vue'
import VehicleBuilderOptionsStep from '~/components/vehicles/VehicleBuilderOptionsStep.vue'
import VehicleBuilderOccupancyStep from '~/components/vehicles/VehicleBuilderOccupancyStep.vue'
import VehicleBuilderProtectionStep from '~/components/vehicles/VehicleBuilderProtectionStep.vue'
import VehicleBuilderReviewStep from '~/components/vehicles/VehicleBuilderReviewStep.vue'
import VehicleBuilderSetupStep from '~/components/vehicles/VehicleBuilderSetupStep.vue'
import VehicleBuilderSpacesStep from '~/components/vehicles/VehicleBuilderSpacesStep.vue'
import VehicleBuilderTabs from '~/components/vehicles/VehicleBuilderTabs.vue'
import VehicleBuilderTechLevelStep from '~/components/vehicles/VehicleBuilderTechLevelStep.vue'
import VehicleBuilderWeaponsStep from '~/components/vehicles/VehicleBuilderWeaponsStep.vue'
import VehicleBuilderSaveModal from '~/components/vehicles/VehicleBuilderSaveModal.vue'
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
  vehicleFeatureMechanicalEffects,
  vehicleFeatureRules,
  vehiclePrimaryPowerOptions,
  vehicleQualifiedFeatureNamesForFamily,
  vehicleSizeBandForSpaces,
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
const saveVehicleModalOpen = ref(false)
const saveVehicleName = ref('')
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
  { id: 'setup', label: 'Setup', title: 'Setup', description: 'Name the vehicle and define the build brief.' },
  { id: 'tech-level', label: 'TL', title: 'Tech Level', description: 'Choose the construction era and rules availability.' },
  { id: 'core', label: 'Type', title: 'Vehicle Type', description: 'Choose the handbook vehicle type.' },
  { id: 'spaces', label: 'Spaces', title: 'Spaces', description: 'Choose the vehicle size and internal design pool.' },
  { id: 'features', label: 'Features', title: 'Features', description: 'Add chassis features allowed by the selected vehicle type.' },
  { id: 'customisations', label: 'Custom', title: 'Customisations', description: 'Choose power, performance, and auxiliary movement systems.' },
  { id: 'protection', label: 'Protection', title: 'Protection', description: 'Set armour and structural reinforcement.' },
  { id: 'options', label: 'Options', title: 'Options', description: 'Install core, external, and internal vehicle options.' },
  { id: 'automation', label: 'Automation', title: 'Automation', description: 'Install computers, software, drone control, and vehicle brains.' },
  { id: 'weapons', label: 'Weapons', title: 'Weapons', description: 'Install mounted weapons, mounts, fire control, and ammunition allocation.' },
  { id: 'occupancy', label: 'Occupants', title: 'Crew & Passengers', description: 'Assign crew stations, passengers, and comfort level.' },
  { id: 'cargo', label: 'Cargo', title: 'Cargo', description: 'Reserve internal Spaces for freight, stores, and mission payload.' },
  { id: 'review', label: 'Review', title: 'Finalise & Review', description: 'Review the final vehicle datasheet and resolve validation issues before saving.' },
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

const filteredCustomVehicles = computed(() => sortReferenceVehicles(playerBuiltVehicles.value.filter((vehicle) => {
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

const selectedCustomVehicle = computed(() => {
  if (selectedCustomVehicleId.value) {
    return playerBuiltVehicles.value.find((vehicle) => vehicle.id === selectedCustomVehicleId.value) ?? filteredCustomVehicles.value[0] ?? null
  }
  return filteredCustomVehicles.value[0] ?? null
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

watch(filteredCustomVehicles, (vehicles) => {
  if (!vehicles.length) {
    selectedCustomVehicleId.value = ''
    return
  }
  if (!vehicles.some((vehicle) => vehicle.id === selectedCustomVehicleId.value)) {
    selectedCustomVehicleId.value = vehicles[0]?.id ?? ''
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

const toggleExpandedVehicle = (vehicleId: string, source: 'reference' | 'custom' = 'reference') => {
  expandedVehicleId.value = expandedVehicleId.value === vehicleId ? '' : vehicleId
  if (source === 'reference') selectedVehicleId.value = vehicleId
  else selectedCustomVehicleId.value = vehicleId
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

const genericTraitDescriptions: Record<string, string> = {
  AFV: 'Armoured Fighting Vehicle. Built for battlefield conditions with a reinforced frame and stronger armour allowance.',
  ATV: 'All-Terrain Vehicle. Intended to cross rough ground with fewer terrain penalties.',
  'Off-Roader': 'Modified for unprepared surfaces such as brushland, low hills, muddy tracks, and rough routes.',
  Responsive: 'Changes Speed Bands faster than a standard vehicle.',
  Unresponsive: 'Changes Speed Bands more slowly than a standard vehicle.',
  VTOL: 'Vertical take-off and landing capability.',
  Tracks: 'Tracked locomotion for rough terrain at the cost of speed.',
  Tracked: 'Tracked locomotion for rough terrain at the cost of speed.',
  'Open Vehicle': 'Occupants are exposed rather than fully enclosed inside the vehicle hull.',
  'Open-Topped': 'The vehicle has no integral roof or top armour.',
}

const traitRuleFor = (trait: string) => vehicleFeatureRules[trait] ?? vehicleFeatureRules[trait.replace(/^Tracked$/, 'Tracks')]

const traitDescription = (trait: string) => (
  traitRuleFor(trait)?.description
  ?? genericTraitDescriptions[trait]
  ?? 'Derived vehicle trait. This quality is part of the vehicle rules profile and may come from type, size, features, or installed movement systems.'
)

const traitMechanics = (trait: string, vehicle?: TravellerVehicleRecord | CustomVehicleDesign | null) => {
  const rule = traitRuleFor(trait)
  const effects = rule
    ? [
        rule.effect,
        rule.agility ? `Agility ${rule.agility}.` : '',
        rule.speed ? `Speed ${rule.speed}.` : '',
        rule.range ? `Range ${rule.range}.` : '',
        rule.shipping ? `Shipping ${rule.shipping}.` : '',
        rule.addedCost ? `Cost ${rule.addedCost}.` : '',
        rule.sizeLimits ? `Size limit: ${rule.sizeLimits}.` : '',
        rule.prerequisite ? `Requires: ${rule.prerequisite}.` : '',
        rule.notCompatible?.length ? `Not compatible with: ${rule.notCompatible.join(', ')}.` : '',
      ].filter(Boolean)
    : vehicleFeatureMechanicalEffects(trait, {
        familyId: 'baseFamily' in (vehicle ?? {}) ? (vehicle as CustomVehicleDesign).baseFamily || undefined : undefined,
        techLevel: vehicle?.techLevel,
      }).filter((effect) => effect !== 'Added to derived Traits.')

  if (effects.length) return effects
  if (trait === 'VTOL') return ['Can take off and land vertically when operating in the appropriate environment.']
  if (trait === 'ATV') return ['Reduces or removes rough-terrain penalties where the Terrain rules call for ATV capability.']
  if (trait === 'Unresponsive') return ['Takes twice as long to change Speed Bands.']
  if (trait === 'Responsive') return ['Takes half as long to change Speed Bands.']
  return ['No additional builder automation is attached to this trait yet.']
}

const traitSource = (trait: string, vehicle: CustomVehicleDesign) => {
  if (vehicle.features.includes(trait)) {
    return { label: 'Features', stepId: 'features', removable: true }
  }

  const auxiliary = allAuxiliaryDriveOptions.find((option) => option.id === vehicle.auxiliaryDrive)
  if (auxiliary?.grantedTraits?.includes(trait)) {
    return { label: 'Auxiliary Drive', stepId: 'customisations', removable: true }
  }

  const family = vehicle.baseFamily ? vehicleFamilyRule(vehicle.baseFamily) : null
  if (family?.defaultTraits?.includes(trait)) {
    return { label: 'Vehicle Type', stepId: 'core', removable: false }
  }

  if (vehicleSizeBandForSpaces(vehicle.spaces).traits.includes(trait)) {
    return { label: 'Spaces', stepId: 'spaces', removable: false }
  }

  return { label: 'Derived Profile', stepId: 'features', removable: false }
}

const goToBuildStep = (stepId: string) => {
  const stepIndex = builderSteps.findIndex((step) => step.id === stepId)
  if (stepIndex >= 0) setBuildStep(stepIndex)
}

const handleDraftTraitClick = (trait: string) => {
  if (!buildDraft.value) return
  const source = traitSource(trait, buildDraft.value)

  if (source.removable && buildDraft.value.features.includes(trait)) {
    buildDraft.value.features = buildDraft.value.features.filter((feature) => feature !== trait)
    syncBuildDraftDerivations()
  }
  else if (source.removable && source.stepId === 'customisations') {
    buildDraft.value.auxiliaryDrive = 'none'
    syncBuildDraftDerivations()
  }

  goToBuildStep(source.stepId)
}

const categoryLabel = (category: string) => category.split('-').map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join(' ')
const buildValidationIssues = computed(() => buildDraft.value ? validateCustomVehicle(buildDraft.value) : [])
const buildFlowValidationIssues = computed(() => buildValidationIssues.value)
const buildStepIssues = computed(() => {
  const issues = buildFlowValidationIssues.value
  const selectedFeatureNames = buildDraft.value?.features ?? []
  const isFeatureIssue = (issue: string) => (
    issue === 'Selected features must be allowed for the base vehicle type.'
    || selectedFeatureNames.some((feature) => issue.startsWith(`${feature} `))
  )
  return {
    setup: issues.filter((issue) => issue === 'Vehicle name is required.'),
    techLevel: issues.filter((issue) => issue.startsWith('Tech level cannot be below')),
    chassis: issues.filter((issue) => [
      'Base vehicle type is required.',
      'Operating skill is required.',
    ].includes(issue)),
    spaces: issues.filter((issue) => issue === 'Spaces must be greater than zero.' || issue.startsWith('Allocated systems spaces ')),
    features: issues.filter(isFeatureIssue),
    customisations: issues.filter((issue) => (
      !isFeatureIssue(issue)
      && (issue.includes('Power')
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
      || issue.includes('drive')
      || issue.includes('Lifters')
      || issue.includes('Rail Wheels')
      || issue.includes('Supercavitating'))
    )),
    protection: issues.filter((issue) => issue.startsWith('Armour for ') || issue.includes('armour cannot')),
    options: issues.filter((issue) => issue.startsWith('Option ')),
    occupancy: issues.filter((issue) => issue.includes('crew station') || issue.startsWith('Occupant row ')),
    cargo: issues.filter((issue) => issue.startsWith('Cargo row ')),
    weapons: issues.filter((issue) => issue.startsWith('Weapon ') || issue.startsWith('External weapon load')),
  }
})
const buildValidationIssueSteps = computed<Record<string, number>>(() => {
  const mapping: Record<string, number> = {}
  for (const issue of buildStepIssues.value.setup) mapping[issue] = 0
  for (const issue of buildStepIssues.value.techLevel) mapping[issue] = 1
  for (const issue of buildStepIssues.value.chassis) mapping[issue] = 2
  for (const issue of buildStepIssues.value.spaces) mapping[issue] = 3
  for (const issue of buildStepIssues.value.features) mapping[issue] = 4
  for (const issue of buildStepIssues.value.customisations) mapping[issue] = 5
  for (const issue of buildStepIssues.value.protection) mapping[issue] = 6
  for (const issue of buildStepIssues.value.options) mapping[issue] = 7
  for (const issue of buildStepIssues.value.weapons) mapping[issue] = 9
  for (const issue of buildStepIssues.value.occupancy) mapping[issue] = 10
  for (const issue of buildStepIssues.value.cargo) mapping[issue] = 11
  return mapping
})
const buildStepHasIssues = computed(() => {
  if (!attemptedBuildSave.value) return builderSteps.map(() => false)
  return [
    buildStepIssues.value.setup.length > 0,
    buildStepIssues.value.techLevel.length > 0,
    buildStepIssues.value.chassis.length > 0,
    buildStepIssues.value.spaces.length > 0,
    buildStepIssues.value.features.length > 0,
    buildStepIssues.value.customisations.length > 0,
    buildStepIssues.value.protection.length > 0,
    buildStepIssues.value.options.length > 0,
    false,
    buildStepIssues.value.weapons.length > 0,
    buildStepIssues.value.occupancy.length > 0,
    buildStepIssues.value.cargo.length > 0,
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
const buildDraftFamilyRule = computed(() => buildDraft.value?.baseFamily ? vehicleFamilyRule(buildDraft.value.baseFamily) : null)
const buildDraftConstructionSummary = computed(() => buildDraft.value ? vehicleConstructionSummary(buildDraft.value) : null)
const buildDraftBaseCostCredits = computed(() => buildDraftConstructionSummary.value?.baseCostCredits ?? buildDraft.value?.baseCostCredits ?? buildDraft.value?.costCredits ?? 0)
const buildDraftTotalCostCredits = computed(() => buildDraftConstructionSummary.value?.totalCostCredits ?? buildDraft.value?.costCredits ?? 0)
const buildDraftTotalCostLabel = computed(() => formatCredits(Math.round(buildDraftTotalCostCredits.value)))
const buildDraftBaseCostLabel = computed(() => formatCredits(Math.round(buildDraftBaseCostCredits.value)))
const buildDraftPrimaryPowerOptions = computed(() => {
  if (!buildDraft.value) return allPrimaryPowerOptions
  const family = buildDraft.value.baseFamily
  if (!family) return allPrimaryPowerOptions
  return allPrimaryPowerOptions.filter((option) => !option.allowedFamilies || option.allowedFamilies.includes(family))
})
const buildDraftAuxiliaryDriveOptions = computed(() => {
  if (!buildDraft.value) return allAuxiliaryDriveOptions
  const family = buildDraft.value.baseFamily
  if (!family) return allAuxiliaryDriveOptions
  return allAuxiliaryDriveOptions.filter((option) => !option.allowedFamilies || option.allowedFamilies.includes(family) || option.id === 'none')
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
  saveVehicleModalOpen.value = false
  saveVehicleName.value = ''
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
  saveVehicleModalOpen.value = false
  saveVehicleName.value = buildDraft.value.name
  attemptedBuildSave.value = false
}

const openSaveVehicleModal = () => {
  if (!buildDraft.value) return
  syncBuildDraftDerivations()
  attemptedBuildSave.value = true
  saveVehicleName.value = buildDraft.value.name
  saveMessage.value = ''
  saveVehicleModalOpen.value = true
}

const closeSaveVehicleModal = () => {
  saveVehicleModalOpen.value = false
}

const selectSaveIssue = (issue: string) => {
  const step = buildValidationIssueSteps.value[issue]
  if (step !== undefined) activeBuildStep.value = step
  saveVehicleModalOpen.value = false
}

const confirmSaveVehicle = () => {
  if (!buildDraft.value || buildFlowValidationIssues.value.length) return
  const nextName = saveVehicleName.value.trim()
  if (!nextName) return
  buildDraft.value.name = nextName
  syncBuildDraftDerivations()
  const finalIssues = validateCustomVehicle(buildDraft.value)
  if (finalIssues.length) {
    attemptedBuildSave.value = true
    return
  }
  const saved = vehiclesStore.saveCustomVehicle(buildDraft.value)
  buildDraft.value = cloneVehicle(saved)
  selectedCustomVehicleId.value = saved.id
  saveMessage.value = `Saved ${saved.name || 'Custom Vehicle'}`
  saveVehicleModalOpen.value = false
  saveVehicleName.value = saved.name
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
  saveVehicleModalOpen.value = false
  saveVehicleName.value = buildDraft.value.name
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
  saveVehicleModalOpen.value = false
  saveVehicleName.value = buildDraft.value?.name ?? ''
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

const addOccupantEntry = (category: CustomVehicleDesign['occupantEntries'][number]['category']) => {
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

const addHandbookVehicleWeapon = (weapon: TravellerVehicleWeapon) => {
  ensureBuildDraft()
  if (!buildDraft.value) return
  buildDraft.value.weapons.push(cloneVehicle(weapon))
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
            <span v-for="trait in selectedVehicle.traits" :key="trait" class="group relative inline-flex">
              <span tabindex="0" class="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-2 py-1 text-xs font-semibold text-cyan-100 outline-none transition hover:border-cyan-200 hover:bg-cyan-300/15 focus:border-cyan-200 focus:bg-cyan-300/15">
                {{ trait }}
              </span>
              <span class="pointer-events-none absolute bottom-full left-0 z-[90] mb-2 hidden w-72 rounded-md border border-cyan-300/40 bg-slate-950/95 p-3 text-left text-xs shadow-[0_0_28px_rgba(34,211,238,0.22)] backdrop-blur group-hover:block group-focus-within:block">
                <span class="block font-black uppercase tracking-[0.18em] text-cyan-100">{{ trait }}</span>
                <span class="mt-2 block leading-5 text-cyan-50/85">{{ traitDescription(trait) }}</span>
                <span class="mt-3 block font-black uppercase tracking-[0.16em] text-cyan-200/75">Mechanics</span>
                <span v-for="mechanic in traitMechanics(trait, selectedVehicle)" :key="mechanic" class="mt-1 block leading-5 text-cyan-50/75">{{ mechanic }}</span>
              </span>
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

    <section v-else-if="activeGarageTab === 'builder'" class="vehicle-builder-page mx-auto w-full max-w-[106rem] px-5 py-6 sm:px-8 lg:px-10">
      <div class="vehicle-builder-layout grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section class="vehicle-builder-workbench hud-panel rounded-lg border p-5 shadow-sm">
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
                @click="openSaveVehicleModal"
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
              <VehicleBuilderSetupStep
                v-if="activeBuildStep === 0"
                :vehicle="buildDraft"
                @sync-derivations="syncBuildDraftDerivations"
              />

              <VehicleBuilderTechLevelStep
                v-else-if="activeBuildStep === 1"
                :vehicle="buildDraft"
                @sync-derivations="syncBuildDraftDerivations"
              />

              <VehicleBuilderCoreStep
                v-else-if="activeBuildStep === 2"
                :vehicle="buildDraft"
                :option-sets="{
                  baseFamilies: builderOptionSets.baseFamilies,
                  hulls: builderOptionSets.hulls,
                  skills: builderOptionSets.skills,
                }"
                @sync-derivations="syncBuildDraftDerivations"
              />

              <VehicleBuilderSpacesStep
                v-else-if="activeBuildStep === 3"
                :vehicle="buildDraft"
                @sync-derivations="syncBuildDraftDerivations"
              />

              <VehicleBuilderFeaturesStep
                v-else-if="activeBuildStep === 4"
                :vehicle="buildDraft"
                :allowed-features="buildDraft ? vehicleQualifiedFeatureNamesForFamily(buildDraft.baseFamily) : []"
                @toggle-feature="toggleFeature"
              />

              <VehicleBuilderCustomisationsStep
                v-else-if="activeBuildStep === 5"
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
                v-else-if="activeBuildStep === 6"
                :vehicle="buildDraft"
                :summary="buildDraftConstructionSummary ?? { armourSummary: { rule: { materials: '-' }, baseProtection: 0, maximumProtection: 0, equivalentAddedProtection: 0, armourSpaces: 0, armourCost: 0 } }"
              />

              <VehicleBuilderOptionsStep
                v-else-if="activeBuildStep === 7"
                :vehicle="buildDraft"
                @sync-derivations="syncBuildDraftDerivations"
              />

              <VehicleBuilderAutomationStep
                v-else-if="activeBuildStep === 8"
                :vehicle="buildDraft"
                @sync-derivations="syncBuildDraftDerivations"
              />

              <VehicleBuilderWeaponsStep
                v-else-if="activeBuildStep === 9"
                :vehicle="buildDraft"
                :weapon-spaces="buildDraftConstructionSummary?.weaponAllocatedSpaces ?? 0"
                @add-weapon="addVehicleWeapon"
                @add-handbook-weapon="addHandbookVehicleWeapon"
                @remove-weapon="removeVehicleWeapon"
                @sync-derivations="syncBuildDraftDerivations"
              />

              <VehicleBuilderOccupancyStep
                v-else-if="activeBuildStep === 10"
                :vehicle="buildDraft"
                :occupant-spaces="buildDraftConstructionSummary?.occupantAllocatedSpaces ?? 0"
                @add-occupant="addOccupantEntry"
                @remove-occupant="removeOccupantEntry"
                @sync-derivations="syncBuildDraftDerivations"
              />

              <VehicleBuilderCargoAllocationStep
                v-else-if="activeBuildStep === 11"
                :vehicle="buildDraft"
                :cargo-spaces="buildDraftConstructionSummary?.cargoAllocatedSpaces ?? 0"
                @add-cargo="addCargoEntry"
                @remove-cargo="removeCargoEntry"
                @sync-derivations="syncBuildDraftDerivations"
              />

              <VehicleBuilderReviewStep
                v-else
                :vehicle="buildDraft"
                :validation-issues="buildValidationIssues"
                :validation-issue-steps="buildValidationIssueSteps"
                :show-validation="attemptedBuildSave"
                @jump-to-step="setBuildStep"
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

        <aside class="vehicle-builder-draft grid gap-5">
          <section v-if="buildDraft" class="hud-panel hud-scrollbar rounded-lg border p-4 shadow-sm 2xl:p-5 xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-auto">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="hud-kicker text-xs font-semibold uppercase tracking-wide">{{ buildDraft.type || 'Vehicle type pending' }}</p>
                <h2 class="mt-2 text-2xl font-semibold text-cyan-50">{{ buildDraft.name || 'Unnamed Vehicle' }}</h2>
                <p class="mt-1 text-sm text-cyan-100/70">Current Draft</p>
              </div>
              <span class="hud-glyph grid h-10 w-10 shrink-0 place-items-center rounded-md">
                <AppIcon name="car" />
              </span>
            </div>

            <div class="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div class="hud-stat rounded-md border p-3">
                <p class="text-xs uppercase tracking-wide text-zinc-400">TL</p>
                <p class="mt-1 text-lg font-semibold">{{ buildDraft.techLevel }}</p>
              </div>
              <div class="hud-stat rounded-md border p-3">
                <p class="text-xs uppercase tracking-wide text-zinc-400">Agility</p>
                <p class="mt-1 text-lg font-semibold">{{ buildDraft.agility }}</p>
              </div>
              <div class="hud-stat rounded-md border p-3">
                <p class="text-xs uppercase tracking-wide text-zinc-400">Speed</p>
                <p class="mt-1 text-lg font-semibold">{{ buildDraft.speed || '-' }}</p>
                <p class="text-xs text-zinc-400">Cruise {{ buildDraft.cruiseSpeed || '-' }}</p>
              </div>
              <div class="hud-stat rounded-md border p-3">
                <p class="text-xs uppercase tracking-wide text-zinc-400">Range</p>
                <p class="mt-1 text-lg font-semibold">{{ buildDraft.range || '-' }}</p>
                <p class="text-xs text-zinc-400">Cruise {{ buildDraft.cruiseRange || '-' }}</p>
              </div>
            </div>

            <div class="mt-5 grid gap-2 text-sm">
              <div class="flex justify-between gap-3 rounded-md bg-white/5 px-3 py-2">
                <span class="text-cyan-100/70">Skill</span>
                <span class="font-semibold">{{ buildDraft.skill || '-' }}</span>
              </div>
              <div class="flex justify-between gap-3 rounded-md bg-white/5 px-3 py-2">
                <span class="text-cyan-100/70">Crew / Passengers</span>
                <span class="font-semibold">{{ buildDraft.crew || '-' }} / {{ buildDraft.passengers || '-' }}</span>
              </div>
              <div class="flex justify-between gap-3 rounded-md bg-white/5 px-3 py-2">
                <span class="text-cyan-100/70">Structure</span>
                <span class="font-semibold">{{ buildDraft.structure || '-' }}</span>
              </div>
              <div class="flex justify-between gap-3 rounded-md bg-white/5 px-3 py-2">
                <span class="text-cyan-100/70">Shipping</span>
                <span class="font-semibold">{{ buildDraft.shipping || '-' }}</span>
              </div>
              <div class="flex justify-between gap-3 rounded-md bg-white/5 px-3 py-2">
                <span class="text-cyan-100/70">Cost</span>
                <span class="font-semibold">{{ buildDraftTotalCostLabel }}</span>
              </div>
              <div class="flex justify-between gap-3 rounded-md bg-white/5 px-3 py-2">
                <span class="text-cyan-100/70">Spaces</span>
                <span class="font-semibold">{{ buildDraft.spaces }} total / {{ buildDraftConstructionSummary?.remainingSpaces ?? 0 }} open</span>
              </div>
            </div>

            <div class="mt-5">
              <p class="text-sm font-semibold">Traits</p>
              <div class="mt-2 flex flex-wrap gap-2">
                <span v-for="trait in buildDraft.traits" :key="trait" class="group relative inline-flex">
                  <button
                    class="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-2 py-1 text-xs font-semibold text-cyan-100 outline-none transition hover:border-cyan-200 hover:bg-cyan-300/15 focus:border-cyan-200 focus:bg-cyan-300/15"
                    type="button"
                    @click="handleDraftTraitClick(trait)"
                  >
                    {{ trait }}
                  </button>
                  <span class="pointer-events-none absolute bottom-full left-0 z-[90] mb-2 hidden w-72 rounded-md border border-cyan-300/40 bg-slate-950/95 p-3 text-left text-xs shadow-[0_0_28px_rgba(34,211,238,0.22)] backdrop-blur group-hover:block group-focus-within:block">
                    <span class="block font-black uppercase tracking-[0.18em] text-cyan-100">{{ trait }}</span>
                    <span class="mt-2 block leading-5 text-cyan-50/85">{{ traitDescription(trait) }}</span>
                    <span class="mt-3 block font-black uppercase tracking-[0.16em] text-cyan-200/75">Mechanics</span>
                    <span v-for="mechanic in traitMechanics(trait, buildDraft)" :key="mechanic" class="mt-1 block leading-5 text-cyan-50/75">{{ mechanic }}</span>
                    <span class="mt-3 block border-t border-cyan-300/20 pt-2 font-semibold text-cyan-100/80">
                      Click to {{ traitSource(trait, buildDraft).removable ? 'remove and edit source' : 'view source step' }}: {{ traitSource(trait, buildDraft).label }}.
                    </span>
                  </span>
                </span>
                <span v-if="!buildDraft.traits.length" class="text-sm text-cyan-100/70">None</span>
              </div>
            </div>

            <div class="mt-5">
              <p class="text-sm font-semibold">Armour</p>
              <div class="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div v-for="(value, facing) in buildDraft.armour" :key="facing" class="rounded-md bg-white/5 px-3 py-2">
                  <span class="capitalize text-cyan-100/70">{{ facing }}</span>
                  <span class="float-right font-semibold">{{ value }}</span>
                </div>
              </div>
            </div>

            <div class="mt-5">
              <p class="text-sm font-semibold">Equipment</p>
              <div class="mt-2 flex flex-wrap gap-2">
                <span v-for="item in buildDraft.equipment" :key="item" class="rounded-md bg-white/5 px-2 py-1 text-xs text-cyan-100/80">
                  {{ item }}
                </span>
                <span v-if="!buildDraft.equipment.length" class="text-sm text-cyan-100/70">None</span>
              </div>
            </div>

            <div v-if="buildDraft.weapons.length" class="mt-5">
              <p class="text-sm font-semibold">Weapons</p>
              <div class="mt-2 grid gap-2">
                <div v-for="weapon in buildDraft.weapons" :key="weapon.name" class="rounded-md border border-cyan-300/20 bg-white/5 p-3 text-sm">
                  <p class="font-semibold">{{ weapon.name }}</p>
                  <p class="mt-1 text-cyan-100/70">{{ weapon.range }} · {{ weapon.damage }} · FC {{ weapon.fireControl }}</p>
                  <p v-if="weapon.traits.length" class="mt-1 text-xs text-cyan-100/60">{{ weapon.traits.join(', ') }}</p>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </section>

    <section v-else-if="activeGarageTab === 'custom'" class="mx-auto grid w-full max-w-[96rem] gap-5 px-5 py-6 sm:px-8 xl:grid-cols-[minmax(0,1fr)_25rem] lg:px-10">
      <div class="grid gap-5">
        <section class="hud-panel rounded-lg border p-5 shadow-sm">
          <div class="list-reference-header flex flex-wrap items-center justify-between gap-3">
            <div class="list-reference-title">
              <p class="hud-kicker text-sm font-semibold uppercase tracking-wide">Player Builds</p>
              <h2 class="mt-2 text-xl font-semibold">Custom Vehicles</h2>
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
              <button class="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 hover:border-amber-600" type="button" @click="newVehicle">
                New Vehicle
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

          <div v-if="filteredCustomVehicles.length" class="hud-table-shell hud-scrollbar mt-4 max-h-[46rem] overflow-auto rounded-md border">
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
                <template v-for="vehicle in filteredCustomVehicles" :key="vehicle.id">
                  <tr
                    class="cursor-pointer border-t border-zinc-200 align-top"
                    :class="selectedCustomVehicle?.id === vehicle.id ? 'bg-cyan-50/80' : 'hover:bg-stone-50'"
                    @click="selectedCustomVehicleId = vehicle.id"
                  >
                    <td class="px-3 py-2 font-semibold text-zinc-950">
                      <button class="mobile-row-toggle block w-full text-left font-semibold" type="button" @click.stop="toggleExpandedVehicle(vehicle.id, 'custom')">
                        {{ vehicle.name || 'Unnamed Vehicle' }}
                      </button>
                      <span class="mt-1 block text-xs font-medium text-zinc-500">{{ vehicle.sourceName ?? 'Custom Build' }}</span>
                    </td>
                    <td class="px-3 py-2">{{ vehicle.techLevel }}</td>
                    <td class="px-3 py-2">{{ categoryLabel(vehicle.category) }}</td>
                    <td class="px-3 py-2">{{ vehicle.speed || '-' }} <span class="text-zinc-500">({{ vehicle.cruiseSpeed || '-' }})</span></td>
                    <td class="px-3 py-2">{{ vehicle.agility }}</td>
                    <td class="px-3 py-2">{{ vehicle.spaces }}</td>
                    <td class="px-3 py-2">{{ formatCredits(vehicle.costCredits) }}</td>
                  </tr>
                  <tr v-if="expandedVehicleId === vehicle.id" class="mobile-detail-row border-t border-cyan-400/20">
                    <td :colspan="sortableVehicleColumns.length" class="px-3 py-3">
                      <div class="mobile-row-detail-grid">
                        <div><span>TL</span><strong>{{ vehicle.techLevel }}</strong></div>
                        <div><span>Category</span><strong>{{ categoryLabel(vehicle.category) }}</strong></div>
                        <div><span>Speed</span><strong>{{ vehicle.speed || '-' }} ({{ vehicle.cruiseSpeed || '-' }})</strong></div>
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
          <p v-else class="mt-4 rounded-md bg-stone-50 p-4 text-sm text-zinc-600">No custom vehicles saved yet.</p>
        </section>
      </div>

      <aside v-if="selectedCustomVehicle" class="hud-panel hud-scrollbar rounded-lg border p-5 shadow-sm xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-auto">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="hud-kicker text-xs font-semibold uppercase tracking-wide">{{ selectedCustomVehicle.type }}</p>
            <h2 class="mt-2 text-2xl font-semibold">{{ selectedCustomVehicle.name || 'Unnamed Vehicle' }}</h2>
            <p class="mt-1 text-sm text-cyan-100/70">{{ selectedCustomVehicle.sourceName ?? 'Custom Build' }}</p>
          </div>
          <span class="hud-glyph grid h-10 w-10 shrink-0 place-items-center rounded-md">
            <AppIcon name="car" />
          </span>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <button class="rounded-md border border-zinc-300 px-2 py-1 text-xs font-semibold text-zinc-700 hover:border-amber-600" type="button" @click="editVehicle(selectedCustomVehicle.id)">
            Edit
          </button>
          <button class="rounded-md border border-zinc-300 px-2 py-1 text-xs font-semibold text-zinc-700 hover:border-amber-600" type="button" @click="duplicateVehicle(selectedCustomVehicle.id)">
            Duplicate
          </button>
          <button class="rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-700 hover:border-red-500" type="button" @click="deleteVehicle(selectedCustomVehicle.id)">
            Delete
          </button>
        </div>

        <div class="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div class="hud-stat rounded-md border p-3">
            <p class="text-xs uppercase tracking-wide text-zinc-400">TL</p>
            <p class="mt-1 text-lg font-semibold">{{ selectedCustomVehicle.techLevel }}</p>
          </div>
          <div class="hud-stat rounded-md border p-3">
            <p class="text-xs uppercase tracking-wide text-zinc-400">Agility</p>
            <p class="mt-1 text-lg font-semibold">{{ selectedCustomVehicle.agility }}</p>
          </div>
          <div class="hud-stat rounded-md border p-3">
            <p class="text-xs uppercase tracking-wide text-zinc-400">Speed</p>
            <p class="mt-1 text-lg font-semibold">{{ selectedCustomVehicle.speed || '-' }}</p>
            <p class="text-xs text-zinc-400">Cruise {{ selectedCustomVehicle.cruiseSpeed || '-' }}</p>
          </div>
          <div class="hud-stat rounded-md border p-3">
            <p class="text-xs uppercase tracking-wide text-zinc-400">Range</p>
            <p class="mt-1 text-lg font-semibold">{{ selectedCustomVehicle.range || '-' }}</p>
            <p class="text-xs text-zinc-400">Cruise {{ selectedCustomVehicle.cruiseRange || '-' }}</p>
          </div>
        </div>

        <div class="mt-5 grid gap-2 text-sm">
          <div class="flex justify-between gap-3 rounded-md bg-white/5 px-3 py-2">
            <span class="text-cyan-100/70">Skill</span>
            <span class="font-semibold">{{ selectedCustomVehicle.skill }}</span>
          </div>
          <div class="flex justify-between gap-3 rounded-md bg-white/5 px-3 py-2">
            <span class="text-cyan-100/70">Crew / Passengers</span>
            <span class="font-semibold">{{ selectedCustomVehicle.crew }} / {{ selectedCustomVehicle.passengers }}</span>
          </div>
          <div class="flex justify-between gap-3 rounded-md bg-white/5 px-3 py-2">
            <span class="text-cyan-100/70">Structure</span>
            <span class="font-semibold">{{ selectedCustomVehicle.structure }}</span>
          </div>
          <div class="flex justify-between gap-3 rounded-md bg-white/5 px-3 py-2">
            <span class="text-cyan-100/70">Shipping</span>
            <span class="font-semibold">{{ selectedCustomVehicle.shipping }}</span>
          </div>
          <div class="flex justify-between gap-3 rounded-md bg-white/5 px-3 py-2">
            <span class="text-cyan-100/70">Cost</span>
            <span class="font-semibold">{{ selectedCustomVehicle.cost }}</span>
          </div>
        </div>

        <div class="mt-5">
          <p class="text-sm font-semibold">Traits</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <span v-for="trait in selectedCustomVehicle.traits" :key="trait" class="group relative inline-flex">
              <span tabindex="0" class="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-2 py-1 text-xs font-semibold text-cyan-100 outline-none transition hover:border-cyan-200 hover:bg-cyan-300/15 focus:border-cyan-200 focus:bg-cyan-300/15">
                {{ trait }}
              </span>
              <span class="pointer-events-none absolute bottom-full left-0 z-[90] mb-2 hidden w-72 rounded-md border border-cyan-300/40 bg-slate-950/95 p-3 text-left text-xs shadow-[0_0_28px_rgba(34,211,238,0.22)] backdrop-blur group-hover:block group-focus-within:block">
                <span class="block font-black uppercase tracking-[0.18em] text-cyan-100">{{ trait }}</span>
                <span class="mt-2 block leading-5 text-cyan-50/85">{{ traitDescription(trait) }}</span>
                <span class="mt-3 block font-black uppercase tracking-[0.16em] text-cyan-200/75">Mechanics</span>
                <span v-for="mechanic in traitMechanics(trait, selectedCustomVehicle)" :key="mechanic" class="mt-1 block leading-5 text-cyan-50/75">{{ mechanic }}</span>
              </span>
            </span>
            <span v-if="!selectedCustomVehicle.traits.length" class="text-sm text-cyan-100/70">None</span>
          </div>
        </div>

        <div class="mt-5">
          <p class="text-sm font-semibold">Armour</p>
          <div class="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div v-for="(value, facing) in selectedCustomVehicle.armour" :key="facing" class="rounded-md bg-white/5 px-3 py-2">
              <span class="capitalize text-cyan-100/70">{{ facing }}</span>
              <span class="float-right font-semibold">{{ value }}</span>
            </div>
          </div>
        </div>

        <div class="mt-5">
          <p class="text-sm font-semibold">Equipment</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <span v-for="item in selectedCustomVehicle.equipment" :key="item" class="rounded-md bg-white/5 px-2 py-1 text-xs text-cyan-100/80">
              {{ item }}
            </span>
            <span v-if="!selectedCustomVehicle.equipment.length" class="text-sm text-cyan-100/70">None</span>
          </div>
        </div>

        <div v-if="selectedCustomVehicle.weapons.length" class="mt-5">
          <p class="text-sm font-semibold">Weapons</p>
          <div class="mt-2 grid gap-2">
            <div v-for="weapon in selectedCustomVehicle.weapons" :key="weapon.name" class="rounded-md border border-cyan-300/20 bg-white/5 p-3 text-sm">
              <p class="font-semibold">{{ weapon.name }}</p>
              <p class="mt-1 text-cyan-100/70">{{ weapon.range }} · {{ weapon.damage }} · FC {{ weapon.fireControl }}</p>
              <p v-if="weapon.traits.length" class="mt-1 text-xs text-cyan-100/60">{{ weapon.traits.join(', ') }}</p>
            </div>
          </div>
        </div>
      </aside>
    </section>

    <VehicleBuilderInfoModal
      :open="activeDraftInfo !== null"
      :title="activeDraftInfo ? draftFieldInfoText[activeDraftInfo].title : ''"
      :body="activeDraftInfo ? draftFieldInfoText[activeDraftInfo].body : ''"
      @close="activeDraftInfo = null"
    />

    <VehicleBuilderSaveModal
      :open="saveVehicleModalOpen"
      :issues="buildFlowValidationIssues"
      v-model:vehicle-name="saveVehicleName"
      @close="closeSaveVehicleModal"
      @select-issue="selectSaveIssue"
      @save="confirmSaveVehicle"
    />
  </main>
</template>

<style scoped>
@media (max-width: 1450px) {
  .vehicle-builder-page {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .vehicle-builder-workbench {
    padding: 1rem;
  }
}

@media (max-width: 1320px) {
  .vehicle-builder-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .vehicle-builder-draft {
    order: -1;
  }

  .vehicle-builder-draft > section {
    position: static;
    max-height: none;
    overflow: visible;
  }
}
</style>
