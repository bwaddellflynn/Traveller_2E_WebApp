import coreVehiclesData from '~/data/traveller2e/vehicles/core-vehicles.json'
import fieldCatalogueVehiclesData from '~/data/traveller2e/vehicles/field-catalogue-vehicles.json'
import vehicleHandbookData from '~/data/traveller2e/vehicles/vehicle-handbook-vehicles.json'
import coreEquipmentData from '~/data/traveller2e/armory/core-equipment.json'
import fieldCatalogueEquipmentData from '~/data/traveller2e/armory/field-catalogue-equipment.json'
import centralSupplyEquipmentData from '~/data/traveller2e/armory/central-supply-catalogue-equipment.json'
import type {
  CustomVehicleDesign,
  CustomVehicleCargoEntry,
  CustomVehicleEquipmentEntry,
  CustomVehicleOccupantEntry,
  TravellerVehicleArmour,
  TravellerVehicleAuxiliaryDrive,
  TravellerVehicleBaseFamily,
  TravellerVehicleCategory,
  TravellerVehicleFusionPlusFuelType,
  TravellerVehiclePrimaryPower,
  TravellerVehicleRecord,
  TravellerVehicleWeapon,
} from '~/types/vehicle'
import { LOCAL_USER_ID } from '~/utils/traveller/profile'

type SpeedBand = 'Stopped' | 'Idle' | 'Very Slow' | 'Slow' | 'Medium' | 'High' | 'Fast' | 'Very Fast' | 'Subsonic' | 'Supersonic' | 'Hypersonic' | 'Orbital'
type VehicleSpeedBaseline = { minTl: number, maxTl?: number, speed: SpeedBand, range: number, rangeUnit?: 'km' | 'years' }
type VehicleFamilyRule = {
  id: TravellerVehicleBaseFamily
  label: string
  description: string
  category: TravellerVehicleCategory
  typeLabel: string
  minimumTechLevel: number
  defaultSkill: string
  baseAgility: number
  hullPerSpace: number
  shippingRatio: number
  baseCostPerSpace: number
  examples: string
  defaultTraits?: string[]
  allowedFeatures: string[]
  speedBaselines: VehicleSpeedBaseline[]
  ignoreSizeSpeedModifier?: boolean
  rangeMultiplierForLargeCraft?: number
}

type PrimaryPowerRule = {
  id: TravellerVehiclePrimaryPower
  label: string
  minimumTechLevel: number
  allowedFamilies?: TravellerVehicleBaseFamily[]
  availableSpacePercent?: number
  minimumSpaceGain?: number
  consumedSpacePercent?: number
  minimumConsumedSpaces?: number
  costMultiplier: number
  flatCostPerVehicleSpace?: number
  costPerInstalledSpace?: number
  speedOverride?: SpeedBand
  speedBandAdjustment?: number
  rangeMultiplier?: number
  secondaryRangeMultiplier?: number
  endurance?: string
  powerPerSpace?: number
  supportsFusionPlusFuelType?: boolean
  notes: string
}

type AuxiliaryDriveRule = {
  id: TravellerVehicleAuxiliaryDrive
  label: string
  minimumTechLevel: number
  allowedFamilies?: TravellerVehicleBaseFamily[]
  baseEquivalentFamily?: TravellerVehicleBaseFamily
  speedModifier?: number
  agilityModifier?: number
  rangeMultiplier?: number
  speedOverride?: SpeedBand
  spacePercent: number
  minimumSpaces: number
  flatCostPerVehicleSpace: number
  grantedTraits?: string[]
  notes: string
}

type VehicleSizeProfile = {
  label: 'Small' | 'Light' | 'Heavy' | 'Huge' | 'Massive'
  hitDm: string
  speedModifier: number
  agilityModifier: number
  armourVolumeMultiplier: number
  armourAllowedFeatures: string[]
  traits: string[]
}

type VehicleArmourRule = {
  minTl: number
  maxTl?: number
  materials: string
  baseProtection: number
  maximumProtection: number
  vehicleSpacesPerPointPercent: number
  costPerArmourSpace: number
  costPerPointPerVehicleSpace: number
}

export type VehicleSizeReferenceRow = {
  key: string
  minSpaces: number
  maxSpaces: number | null
  form: string
  example: string
}

export type VehicleBuilderEquipmentLibraryItem = {
  id: string
  name: string
  label: string
  category: string
  categoryLabel: string
  techLevel: number | null
  sourceName: string
  sourcePage?: number
  effect?: string
  traits: string[]
}

export type VehicleBuilderEquipmentCategoryGroup = {
  id: string
  label: string
  description: string
  chapterId: string
  chapterLabel: string
  chapterDescription: string
  chapterOrder: number
  items: VehicleBuilderEquipmentLibraryItem[]
}

export type VehicleBuilderCoreOptionFamily = {
  id: string
  label: string
  description: string
  category: string
  options: Array<{
    id: string
    label: string
    name: string
  }>
}

export type VehicleBuilderStockWeaponOption = {
  id: string
  label: string
  sourceVehicle: string
  sourceTechLevel: number
  sourcePage?: number
  weapon: TravellerVehicleWeapon
}

export type VehicleComfortLevelRule = {
  id: string
  minimum: number
  maximum: number | null
  label: string
  effect: string
  description: string
}

export type VehicleOccupantComfortSummary = {
  category: CustomVehicleOccupantEntry['category']
  label: string
  count: number
  spaces: number
  comfortLevel: number
  rule: VehicleComfortLevelRule
}

const withSource = (
  records: Record<string, unknown>[],
  sourceId: TravellerVehicleRecord['sourceId'],
  sourceName: string,
) => records.map((record) => ({
  sourceId,
  sourceName,
  ...record,
}) as TravellerVehicleRecord)

const sourcePriority: Record<string, number> = {
  'mgt2e-vehicle-handbook': 4,
  'mgt2e-field-catalogue': 3,
  'mgt2e-mercenary-vehicle-recognition-cards': 3,
  'mgt2e-csc': 2,
  'mgt2e-core-2022': 1,
}

const normalizeVehicleFamilyName = (name: string) => {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/\b(tl|tech level)\s*\d+\b/g, '')
    .replace(/^the\s+/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const categoryLabel = (value: string) => value
  .split(/[-_/ ]+/)
  .filter(Boolean)
  .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
  .join(' ')

const vehicleComfortLevelRules: VehicleComfortLevelRule[] = [
  {
    id: 'intolerable',
    minimum: 0,
    maximum: 0.5,
    label: 'Intolerable',
    effect: 'Immediate DM-2 to all tasks, plus DM-2 per 4 hours.',
    description: 'Emergency-only crowding. Occupants cannot function normally for any length of time.',
  },
  {
    id: 'uncomfortable-seating',
    minimum: 0.5,
    maximum: 1,
    label: 'Uncomfortable Seating',
    effect: 'DM-1 after 4 hours, plus DM-1 per 4 hours.',
    description: 'Cramped short-term seating suitable for brief trips or tactical transport.',
  },
  {
    id: 'basic-seating',
    minimum: 1,
    maximum: 1.25,
    label: 'Basic Seating',
    effect: 'DM-1 after 8 hours, plus DM-1 per 8 hours.',
    description: 'Standard vehicle seating. Fine for routine travel, tiring over longer periods.',
  },
  {
    id: 'long-duration-seating',
    minimum: 1.25,
    maximum: 1.5,
    label: 'Long Duration Seating',
    effect: 'DM-1 after 24 hours, plus DM-1 per 24 hours.',
    description: 'Better seating for long trips and extended watch periods.',
  },
  {
    id: 'extended-seating',
    minimum: 1.5,
    maximum: 2,
    label: 'Extended Seating',
    effect: 'DM-1 after 48 hours, plus DM-1 per 24 hours.',
    description: 'Generous seating with enough room to delay fatigue and discomfort.',
  },
  {
    id: 'basic-comfort',
    minimum: 2,
    maximum: 4,
    label: 'Basic Comfort',
    effect: 'DM-1 after 1 week, plus DM-1 per week, limited to DM-2.',
    description: 'Livable interior space for routine multi-day occupancy.',
  },
  {
    id: 'standard-comfort',
    minimum: 4,
    maximum: 8,
    label: 'Standard Comfort',
    effect: 'DM-1 after 1 month, plus DM-1 per month, limited to DM-2.',
    description: 'Comfortable accommodation for sustained operations.',
  },
  {
    id: 'good-comfort',
    minimum: 8,
    maximum: 24,
    label: 'Good Comfort',
    effect: 'No negative effect.',
    description: 'High-quality space that avoids travel fatigue penalties.',
  },
  {
    id: 'excellent-comfort',
    minimum: 24,
    maximum: 40,
    label: 'Excellent Comfort',
    effect: 'No negative effect; recovery for Comfort Levels 2-8.',
    description: 'Excellent accommodation with enough quality and space to aid recovery.',
  },
  {
    id: 'luxury-comfort',
    minimum: 40,
    maximum: null,
    label: 'Luxury Comfort',
    effect: 'For society elites; recovery for Comfort Levels 2-8.',
    description: 'Luxury accommodation with elite-level space and amenities.',
  },
]

export const vehicleComfortLevels = () => vehicleComfortLevelRules

export const vehicleComfortLevelRuleForValue = (value: number) => {
  const comfortLevel = Math.max(0, Number.isFinite(value) ? value : 0)
  return vehicleComfortLevelRules.find((rule) => (
    comfortLevel >= rule.minimum && (rule.maximum === null || comfortLevel < rule.maximum)
  )) ?? vehicleComfortLevelRules[0]
}

const handbookOptionGroupForEquipmentCategory = (category: string) => {
  switch (category) {
    case 'communications':
      return {
        id: 'communications',
        label: 'Communications',
        description: 'Transmitters, receivers, relays, and long-range comms systems.',
        chapterId: 'core-options',
        chapterLabel: 'Core Options',
        chapterDescription: 'Control, computing, communications, and sensor systems that define the vehicle’s operational baseline.',
        chapterOrder: 1,
      }
    case 'computers':
    case 'software':
      return {
        id: 'computers-control',
        label: 'Computers & Control',
        description: 'Computers, software packages, processors, and control-support systems.',
        chapterId: 'core-options',
        chapterLabel: 'Core Options',
        chapterDescription: 'Control, computing, communications, and sensor systems that define the vehicle’s operational baseline.',
        chapterOrder: 1,
      }
    case 'sensors':
      return {
        id: 'sensors-detection',
        label: 'Sensors & Detection',
        description: 'Detection, scanning, survey, and observation systems.',
        chapterId: 'core-options',
        chapterLabel: 'Core Options',
        chapterDescription: 'Control, computing, communications, and sensor systems that define the vehicle’s operational baseline.',
        chapterOrder: 1,
      }
    case 'medical':
    case 'drugs':
      return {
        id: 'medical-crew-support',
        label: 'Medical & Crew Support',
        description: 'Medical fittings, treatment support, and crew-sustainment supplies.',
        chapterId: 'internal-environmental',
        chapterLabel: 'Internal & Environmental',
        chapterDescription: 'Crew protection, survivability, medical support, and interior-life systems.',
        chapterOrder: 2,
      }
    case 'survival':
      return {
        id: 'environmental-life-support',
        label: 'Environmental & Life Support',
        description: 'Environmental protection, survival gear, and life-support oriented systems.',
        chapterId: 'internal-environmental',
        chapterLabel: 'Internal & Environmental',
        chapterDescription: 'Crew protection, survivability, medical support, and interior-life systems.',
        chapterOrder: 2,
      }
    case 'support':
    case 'tools':
      return {
        id: 'utility-systems',
        label: 'Utility Systems',
        description: 'Utility fittings, service gear, field tools, and mission support systems.',
        chapterId: 'external-utility',
        chapterLabel: 'External & Utility',
        chapterDescription: 'Mission fittings, support gear, external utility systems, and field-service additions.',
        chapterOrder: 3,
      }
    default:
      return {
        id: 'general-options',
        label: 'General Options',
        description: 'General installed systems and non-weapon fittings.',
        chapterId: 'other-options',
        chapterLabel: 'Other Options',
        chapterDescription: 'Catch-all installed systems that do not map cleanly to the earlier handbook chapters.',
        chapterOrder: 4,
      }
  }
}

export const allReferenceVehicleVariants = (): TravellerVehicleRecord[] => [
  ...withSource(
    coreVehiclesData.vehicles,
    coreVehiclesData.sourceId as TravellerVehicleRecord['sourceId'],
    coreVehiclesData.sourceName,
  ),
  ...withSource(
    fieldCatalogueVehiclesData.vehicles,
    fieldCatalogueVehiclesData.sourceId as TravellerVehicleRecord['sourceId'],
    fieldCatalogueVehiclesData.sourceName,
  ),
  ...withSource(
    vehicleHandbookData.vehicles,
    vehicleHandbookData.sourceId as TravellerVehicleRecord['sourceId'],
    vehicleHandbookData.sourceName,
  ),
]

const vehicleHandbookVariants = (): TravellerVehicleRecord[] => withSource(
  vehicleHandbookData.vehicles,
  vehicleHandbookData.sourceId as TravellerVehicleRecord['sourceId'],
  vehicleHandbookData.sourceName,
)

type EquipmentSeedRecord = {
  id: string
  name: string
  category: string
  techLevel: number | null
  effect?: string
  traits?: string[]
  sourcePage?: number
}

const allEquipmentSeedRecords = (): Array<EquipmentSeedRecord & { sourceName: string }> => [
  ...coreEquipmentData.equipment.map((item) => ({ ...item, sourceName: coreEquipmentData.sourceName })),
  ...fieldCatalogueEquipmentData.equipment.map((item) => ({ ...item, sourceName: fieldCatalogueEquipmentData.sourceName })),
  ...centralSupplyEquipmentData.equipment.map((item) => ({ ...item, sourceName: centralSupplyEquipmentData.sourceName })),
]

const equipmentLabel = (item: EquipmentSeedRecord) => (
  item.techLevel === null || item.techLevel === undefined
    ? item.name
    : `${item.name} · TL ${item.techLevel}`
)

const stockVehicleWeaponLibrary = (): VehicleBuilderStockWeaponOption[] => {
  const seen = new Set<string>()
  const options: VehicleBuilderStockWeaponOption[] = []

  for (const vehicle of allReferenceVehicles()) {
    for (const weapon of vehicle.weapons ?? []) {
      if (!weapon.name?.trim() || !weapon.damage?.trim() || weapon.damage.trim() === '-') continue
      const signature = JSON.stringify([
        weapon.name,
        weapon.range,
        weapon.damage,
        weapon.magazine,
        weapon.fireControl,
        weapon.traits,
      ])
      if (seen.has(signature)) continue
      seen.add(signature)
      options.push({
        id: `stock-vehicle-weapon-${seen.size}`,
        label: `${weapon.name} · ${weapon.damage} · ${weapon.range}`,
        sourceVehicle: vehicle.name,
        sourceTechLevel: vehicle.techLevel,
        sourcePage: vehicle.sourcePage,
        weapon: {
          name: weapon.name,
          range: weapon.range,
          damage: weapon.damage,
          magazine: weapon.magazine,
          cost: weapon.cost,
          traits: [...weapon.traits],
          fireControl: weapon.fireControl,
          spaces: weapon.spaces ?? 0,
        },
      })
    }
  }

  return options.sort((left, right) => left.label.localeCompare(right.label, undefined, { sensitivity: 'base' }))
}

export const allReferenceVehicles = (): TravellerVehicleRecord[] => {
  const variants = allReferenceVehicleVariants()
  const highestPriorityByFamily = new Map<string, number>()

  for (const vehicle of variants) {
    const family = normalizeVehicleFamilyName(vehicle.name)
    const priority = sourcePriority[vehicle.sourceId] ?? 0
    highestPriorityByFamily.set(family, Math.max(highestPriorityByFamily.get(family) ?? 0, priority))
  }

  return variants.filter((vehicle) => {
    const family = normalizeVehicleFamilyName(vehicle.name)
    const priority = sourcePriority[vehicle.sourceId] ?? 0
    return priority === highestPriorityByFamily.get(family)
  })
}

export const makeVehicleId = () => `custom-vehicle-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export const cloneVehicle = <T extends TravellerVehicleRecord | CustomVehicleDesign>(vehicle: T): T => JSON.parse(JSON.stringify(vehicle)) as T

export const createBlankVehicleArmour = (): TravellerVehicleArmour => ({
  forward: '',
  port: '',
  dorsal: '',
  aft: '',
  starboard: '',
  ventral: '',
})

export const createBlankVehicleWeapon = (): TravellerVehicleWeapon => ({
  name: '',
  range: '',
  damage: '',
  magazine: '',
  cost: '',
  traits: [],
  fireControl: '',
  spaces: 0,
})

export const createBlankVehicleEquipmentEntry = (): CustomVehicleEquipmentEntry => ({
  name: '',
  spaces: 0,
  category: '',
  catalogueId: '',
})

export const createBlankVehicleOccupantEntry = (category: CustomVehicleOccupantEntry['category'] = 'crew'): CustomVehicleOccupantEntry => ({
  role: category === 'crew' ? 'Crew' : 'Passengers',
  count: 1,
  spacesEach: 1,
  category,
})

export const createBlankVehicleCargoEntry = (): CustomVehicleCargoEntry => ({
  name: 'Cargo',
  spaces: 0,
  tons: 0,
})

export const createBlankCustomVehicle = (userId = LOCAL_USER_ID): CustomVehicleDesign => {
  const timestamp = new Date().toISOString()
  return {
    id: makeVehicleId(),
    userId,
    createdAt: timestamp,
    updatedAt: timestamp,
    sourceId: 'custom-player',
    sourceName: 'Custom Build',
    sourcePage: undefined,
    name: '',
    baseFamily: 'ground-vehicle',
    category: 'ground',
    type: '',
    spaces: 1,
    hitDm: '+0',
    hull: 'Standard',
    techLevel: 1,
    skill: 'Drive (varies)',
    agility: '+0',
    speed: '',
    cruiseSpeed: '',
    range: '',
    cruiseRange: '',
    crew: '',
    passengers: '',
    comfortLevel: '',
    cargo: '',
    structure: '',
    shipping: '',
    costCredits: 0,
    cost: 'Cr0',
    traits: [],
    features: [],
    primaryPower: 'standard',
    fusionPlusFuelType: 'water',
    auxiliaryDrive: 'none',
    occupantEntries: [],
    cargoEntries: [],
    armour: createBlankVehicleArmour(),
    equipment: [],
    equipmentEntries: [],
    weapons: [],
    notes: '',
    speedModificationSteps: 0,
    fuelEfficiencySteps: 0,
    fuelCapacitySteps: 0,
  }
}

const uniqueSorted = (values: string[]) => [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base', numeric: true }))

const speedBandOrder: SpeedBand[] = ['Stopped', 'Idle', 'Very Slow', 'Slow', 'Medium', 'High', 'Fast', 'Very Fast', 'Subsonic', 'Supersonic', 'Hypersonic', 'Orbital']

const handbookFamilyRules: Record<TravellerVehicleBaseFamily, VehicleFamilyRule> = {
  aeroplane: {
    id: 'aeroplane',
    label: 'Aeroplane',
    description: 'A heavier-than-air vehicle that flies using aerodynamic lift from fixed wings. Aircraft need an atmosphere and usually require a runway unless features reduce or remove that requirement.',
    category: 'aircraft',
    typeLabel: 'Aeroplane',
    minimumTechLevel: 4,
    defaultSkill: 'Flyer (wing)',
    baseAgility: 1,
    hullPerSpace: 0.5,
    shippingRatio: 1,
    baseCostPerSpace: 15000,
    examples: 'Light aircraft, bomber, transport',
    allowedFeatures: ['Agile', 'Fast', 'Floats', 'Folding Wings', 'Hypersonic', 'Jet Engines', 'Open Frame', 'Open-Topped', 'Slow', 'STOL', 'Supersonic', 'Tilt Engines'],
    speedBaselines: [
      { minTl: 4, maxTl: 4, speed: 'Medium', range: 300 },
      { minTl: 5, maxTl: 6, speed: 'High', range: 600 },
      { minTl: 7, maxTl: 8, speed: 'Fast', range: 1200 },
      { minTl: 9, maxTl: 10, speed: 'Very Fast', range: 2400 },
      { minTl: 11, speed: 'Very Fast', range: 4800 },
    ],
    ignoreSizeSpeedModifier: true,
  },
  airship: {
    id: 'airship',
    label: 'Airship',
    description: 'A lighter-than-air flying machine that needs an atmosphere and has no minimum speed limitation. Most airships are Heavy or larger and rely on a gas envelope for lift.',
    category: 'aircraft',
    typeLabel: 'Airship',
    minimumTechLevel: 3,
    defaultSkill: 'Flyer (airship)',
    baseAgility: -3,
    hullPerSpace: 0.2,
    shippingRatio: 0.1,
    baseCostPerSpace: 300,
    examples: 'Balloon, blimp, zeppelin',
    defaultTraits: ['VTOL'],
    allowedFeatures: ['Agile', 'Fast', 'Open Frame', 'Rigid', 'Slow', 'Streamlined'],
    speedBaselines: [
      { minTl: 3, maxTl: 3, speed: 'Idle', range: 100 },
      { minTl: 4, maxTl: 4, speed: 'Slow', range: 4000 },
      { minTl: 5, maxTl: 7, speed: 'Medium', range: 6000 },
      { minTl: 8, maxTl: 9, speed: 'Medium', range: 8000 },
      { minTl: 10, maxTl: 11, speed: 'Medium', range: 12000 },
      { minTl: 12, speed: 'Medium', range: 18000 },
    ],
  },
  'grav-vehicle': {
    id: 'grav-vehicle',
    label: 'Grav Vehicle',
    description: 'A vehicle using gravitic drives to fly without aerodynamic lift. Grav vehicles do not need an atmosphere and can travel up to 10 planetary diameters from a world.',
    category: 'grav',
    typeLabel: 'Grav Vehicle',
    minimumTechLevel: 8,
    defaultSkill: 'Flyer (grav)',
    baseAgility: 1,
    hullPerSpace: 2,
    shippingRatio: 0.5,
    baseCostPerSpace: 30000,
    examples: 'G/bike, air/raft, G/carrier',
    defaultTraits: ['VTOL'],
    allowedFeatures: ['AFV', 'Agile', 'Fast', 'Open Frame', 'Open-Topped', 'Slow', 'Streamlined'],
    speedBaselines: [
      { minTl: 8, maxTl: 8, speed: 'High', range: 1000 },
      { minTl: 9, maxTl: 10, speed: 'Fast', range: 2000 },
      { minTl: 11, maxTl: 12, speed: 'Fast', range: 3000 },
      { minTl: 13, maxTl: 14, speed: 'Very Fast', range: 4000 },
      { minTl: 15, speed: 'Very Fast', range: 5000 },
    ],
  },
  'ground-vehicle': {
    id: 'ground-vehicle',
    label: 'Ground Vehicle',
    description: 'A vehicle restricted to solid surfaces, usually using wheels by default. Size and features can alter the exact locomotion, from bikes and cars to tanks and heavy haulers.',
    category: 'ground',
    typeLabel: 'Ground Vehicle',
    minimumTechLevel: 1,
    defaultSkill: 'Drive (varies)',
    baseAgility: 0,
    hullPerSpace: 2,
    shippingRatio: 0.5,
    baseCostPerSpace: 750,
    examples: 'Motorcycle, automobile, truck, tank',
    allowedFeatures: ['AFV', 'Agile', 'ATV', 'Fast', 'Monowheel', 'Off-Roader', 'Open Frame', 'Open-Topped', 'Rail Rider', 'Slow', 'Smart Wheels', 'Streamlined', 'Tracks', 'Tunneller'],
    speedBaselines: [
      { minTl: 1, maxTl: 2, speed: 'Idle', range: 0 },
      { minTl: 3, maxTl: 3, speed: 'Idle', range: 50 },
      { minTl: 4, maxTl: 4, speed: 'Very Slow', range: 100 },
      { minTl: 5, maxTl: 6, speed: 'Slow', range: 300 },
      { minTl: 7, maxTl: 8, speed: 'Medium', range: 500 },
      { minTl: 9, maxTl: 10, speed: 'High', range: 800 },
      { minTl: 11, speed: 'Fast', range: 1000 },
    ],
  },
  hovercraft: {
    id: 'hovercraft',
    label: 'Hovercraft',
    description: 'A vehicle riding on a cushion of air, able to cross flat ground and water. Hovercraft handle marshy terrain well but are not true off-road vehicles.',
    category: 'hovercraft',
    typeLabel: 'Hovercraft',
    minimumTechLevel: 5,
    defaultSkill: 'Drive (hovercraft)',
    baseAgility: 1,
    hullPerSpace: 0.5,
    shippingRatio: 0.5,
    baseCostPerSpace: 10000,
    examples: 'Hover jeep, landing craft, ferry',
    allowedFeatures: ['Agile', 'Fast', 'Open Frame', 'Open-Topped', 'Slow'],
    speedBaselines: [
      { minTl: 5, maxTl: 5, speed: 'Slow', range: 300 },
      { minTl: 6, maxTl: 7, speed: 'Medium', range: 400 },
      { minTl: 8, maxTl: 9, speed: 'High', range: 500 },
      { minTl: 10, maxTl: 11, speed: 'High', range: 600 },
      { minTl: 12, speed: 'Fast', range: 800 },
    ],
  },
  rotorcraft: {
    id: 'rotorcraft',
    label: 'Rotorcraft',
    description: 'An aircraft using a rotating or moving surface to generate lift and thrust. Rotorcraft have VTOL capability and include helicopters, aerodynes and ornithopters.',
    category: 'aircraft',
    typeLabel: 'Rotorcraft',
    minimumTechLevel: 5,
    defaultSkill: 'Flyer (rotor)',
    baseAgility: 0,
    hullPerSpace: 0.5,
    shippingRatio: 1,
    baseCostPerSpace: 25000,
    examples: 'Helicopter, aerodyne, ornithopter',
    defaultTraits: ['VTOL'],
    allowedFeatures: ['Aerodyne', 'Agile', 'Fast', 'Floats', 'Folding Wings', 'Open Frame', 'Open-Topped', 'Ornithopter', 'Slow', 'Streamlined'],
    speedBaselines: [
      { minTl: 5, maxTl: 6, speed: 'Medium', range: 500 },
      { minTl: 7, maxTl: 7, speed: 'High', range: 1000 },
      { minTl: 8, maxTl: 10, speed: 'High', range: 2000 },
      { minTl: 11, speed: 'Fast', range: 4000 },
    ],
  },
  structure: {
    id: 'structure',
    label: 'Structure',
    description: 'A stationary construction built with vehicle-scale rules. Structures lack primary locomotion and normally gain extra internal capacity because they do not need vehicle drive systems.',
    category: 'other',
    typeLabel: 'Structure',
    minimumTechLevel: 0,
    defaultSkill: 'n/a',
    baseAgility: -6,
    hullPerSpace: 1,
    shippingRatio: 0.5,
    baseCostPerSpace: 50,
    examples: 'House, fortress, outpost, rocket stage',
    allowedFeatures: ['AFV', 'Open Frame', 'Open-Topped', 'Streamlined'],
    speedBaselines: [
      { minTl: 0, speed: 'Stopped', range: 0 },
    ],
  },
  submersible: {
    id: 'submersible',
    label: 'Submersible',
    description: 'A vehicle designed to travel under water or another liquid. Submersibles include hostile environment protection and require life support to determine submerged endurance.',
    category: 'watercraft',
    typeLabel: 'Submersible',
    minimumTechLevel: 4,
    defaultSkill: 'Seafarer (submarine)',
    baseAgility: -2,
    hullPerSpace: 3,
    shippingRatio: 0.5,
    baseCostPerSpace: 50000,
    examples: 'Submarine, diving bell',
    allowedFeatures: ['AFV', 'Agile', 'Fast', 'Open Frame', 'Open-Topped', 'Slow', 'Tunneller'],
    speedBaselines: [
      { minTl: 4, maxTl: 4, speed: 'Idle', range: 50 },
      { minTl: 5, maxTl: 5, speed: 'Very Slow', range: 100 },
      { minTl: 6, maxTl: 8, speed: 'Slow', range: 150 },
      { minTl: 9, maxTl: 11, speed: 'Slow', range: 200 },
      { minTl: 12, maxTl: 14, speed: 'Medium', range: 300 },
      { minTl: 15, speed: 'High', range: 500 },
    ],
    ignoreSizeSpeedModifier: true,
  },
  walker: {
    id: 'walker',
    label: 'Walker',
    description: 'A vehicle using computer-controlled legs to traverse the ground. Walkers are larger than powered armour and may have more than two legs for stability.',
    category: 'walker',
    typeLabel: 'Walker',
    minimumTechLevel: 8,
    defaultSkill: 'Drive (walker)',
    baseAgility: 0,
    hullPerSpace: 2,
    shippingRatio: 0.5,
    baseCostPerSpace: 10000,
    examples: 'Load lifter, AT-AT',
    defaultTraits: ['ATV'],
    allowedFeatures: ['AFV', 'Agile', 'Fast', 'Multi-Legged', 'Open Frame', 'Open-Topped', 'Slow', 'Tunneller'],
    speedBaselines: [
      { minTl: 8, maxTl: 8, speed: 'Very Slow', range: 150 },
      { minTl: 9, maxTl: 10, speed: 'Slow', range: 300 },
      { minTl: 11, maxTl: 12, speed: 'Medium', range: 450 },
      { minTl: 13, maxTl: 14, speed: 'High', range: 600 },
      { minTl: 15, speed: 'High', range: 750 },
    ],
  },
  watercraft: {
    id: 'watercraft',
    label: 'Watercraft',
    description: 'A vehicle that travels across the surface of a body of water or other liquid, from small craft to ships. Larger vessels have considerably greater range than small craft.',
    category: 'watercraft',
    typeLabel: 'Watercraft',
    minimumTechLevel: 0,
    defaultSkill: 'Seafarer (varies)',
    baseAgility: -2,
    hullPerSpace: 2,
    shippingRatio: 0.5,
    baseCostPerSpace: 2000,
    examples: 'Canoe, speedboat, sailboat, tanker',
    allowedFeatures: ['AFV', 'Agile', 'Fast', 'Floats', 'Hydrofoil', 'Open Frame', 'Open-Topped', 'Slow'],
    speedBaselines: [
      { minTl: 0, maxTl: 2, speed: 'Idle', range: 0 },
      { minTl: 3, maxTl: 3, speed: 'Idle', range: 100 },
      { minTl: 4, maxTl: 4, speed: 'Very Slow', range: 200 },
      { minTl: 5, maxTl: 5, speed: 'Very Slow', range: 400 },
      { minTl: 6, maxTl: 7, speed: 'Slow', range: 600 },
      { minTl: 8, maxTl: 11, speed: 'Slow', range: 800 },
      { minTl: 12, speed: 'Medium', range: 1200 },
    ],
    rangeMultiplierForLargeCraft: 10,
  },
}

const sizeProfiles: VehicleSizeProfile[] = [
  { label: 'Small', hitDm: '+0', speedModifier: 0, agilityModifier: 0, armourVolumeMultiplier: 4, armourAllowedFeatures: ['Open Frame'], traits: [] },
  { label: 'Light', hitDm: '+1', speedModifier: 0, agilityModifier: 0, armourVolumeMultiplier: 2, armourAllowedFeatures: [], traits: [] },
  { label: 'Heavy', hitDm: '+2', speedModifier: -1, agilityModifier: -1, armourVolumeMultiplier: 1, armourAllowedFeatures: ['AFV', 'Locomotive', 'Tunneller'], traits: [] },
  { label: 'Huge', hitDm: '+4', speedModifier: -1, agilityModifier: -2, armourVolumeMultiplier: 0.5, armourAllowedFeatures: ['AFV', 'Locomotive', 'Tunneller'], traits: ['Unresponsive'] },
  { label: 'Massive', hitDm: '+6', speedModifier: -1, agilityModifier: -4, armourVolumeMultiplier: 0.5, armourAllowedFeatures: ['AFV', 'Locomotive', 'Tunneller'], traits: ['Unresponsive'] },
]

const vehicleSizeReferenceLibrary: Record<TravellerVehicleBaseFamily, VehicleSizeReferenceRow[]> = {
  'ground-vehicle': [
    { key: 'ground-small', minSpaces: 1, maxSpaces: 3, form: 'Small', example: 'bicycle, rickshaw, motorcycle, ATV' },
    { key: 'ground-light', minSpaces: 4, maxSpaces: 19, form: 'Light', example: 'microcar, sedan, jeep, utility 4x4, van, light truck' },
    { key: 'ground-heavy', minSpaces: 20, maxSpaces: 199, form: 'Heavy', example: 'APC, IFV, cargo truck, bus, mobile workshop, main battle tank, mobile artillery battery' },
    { key: 'ground-huge', minSpaces: 200, maxSpaces: 1999, form: 'Huge', example: 'super-heavy tank, missile carrier, mobile command base, crawler fortress, land carrier' },
    { key: 'ground-massive', minSpaces: 2000, maxSpaces: null, form: 'Massive', example: 'mobile city, continent-scale crawler, fortress convoy platform' },
  ],
  hovercraft: [
    { key: 'hover-small', minSpaces: 1, maxSpaces: 3, form: 'Small', example: 'personal skimmer, scout hover bike, rescue sled' },
    { key: 'hover-light', minSpaces: 4, maxSpaces: 19, form: 'Light', example: 'civilian hovercar, patrol skimmer, cargo sled, passenger hover van' },
    { key: 'hover-heavy', minSpaces: 20, maxSpaces: 199, form: 'Heavy', example: 'troop hovercraft, assault landing craft, hover APC, bulk hover barge, mobile SAM raft' },
    { key: 'hover-huge', minSpaces: 200, maxSpaces: 1999, form: 'Huge', example: 'heavy landing platform, hover base, massive amphibious carrier, floating assault dock' },
    { key: 'hover-massive', minSpaces: 2000, maxSpaces: null, form: 'Massive', example: 'mobile sea base, floating city, theatre-scale hover platform' },
  ],
  'grav-vehicle': [
    { key: 'grav-small', minSpaces: 1, maxSpaces: 3, form: 'Small', example: 'grav bike, courier sled, recon skimmer' },
    { key: 'grav-light', minSpaces: 4, maxSpaces: 19, form: 'Light', example: 'air/raft, grav jeep, light grav car, grav van, executive air/raft' },
    { key: 'grav-heavy', minSpaces: 20, maxSpaces: 199, form: 'Heavy', example: 'grav APC, grav IFV, patrol transport, grav tank, bulk grav hauler' },
    { key: 'grav-huge', minSpaces: 200, maxSpaces: 1999, form: 'Huge', example: 'super-heavy grav tank, grav carrier, flying base, city-lifter platform' },
    { key: 'grav-massive', minSpaces: 2000, maxSpaces: null, form: 'Massive', example: 'flying city, orbital-scale lift platform, mobile grav fortress' },
  ],
  aeroplane: [
    { key: 'plane-small', minSpaces: 1, maxSpaces: 3, form: 'Small', example: 'ultralight, scout plane, trainer jet' },
    { key: 'plane-light', minSpaces: 4, maxSpaces: 19, form: 'Light', example: 'bush plane, utility plane, light strike jet, regional shuttle, patrol aircraft' },
    { key: 'plane-heavy', minSpaces: 20, maxSpaces: 199, form: 'Heavy', example: 'transport aircraft, bomber, maritime patrol plane, cargo aircraft, strategic bomber, tanker' },
    { key: 'plane-huge', minSpaces: 200, maxSpaces: 1999, form: 'Huge', example: 'large transport plane, flying command post, airborne carrier, flying aircraft carrier' },
    { key: 'plane-massive', minSpaces: 2000, maxSpaces: null, form: 'Massive', example: 'flying city, airborne fortress, theatre-scale air carrier' },
  ],
  rotorcraft: [
    { key: 'rotor-small', minSpaces: 1, maxSpaces: 3, form: 'Small', example: 'gyrocopter, scout rotorcraft, medevac scout' },
    { key: 'rotor-light', minSpaces: 4, maxSpaces: 19, form: 'Light', example: 'light helicopter, utility helicopter, scout gunship, troop helicopter' },
    { key: 'rotor-heavy', minSpaces: 20, maxSpaces: 199, form: 'Heavy', example: 'heavy transport helicopter, attack gunship, super-heavy rotor transport, flying crane, rotor carrier' },
    { key: 'rotor-huge', minSpaces: 200, maxSpaces: 1999, form: 'Huge', example: 'industrial lift platform, flying deck carrier, rotor fortress, airborne shipyard' },
    { key: 'rotor-massive', minSpaces: 2000, maxSpaces: null, form: 'Massive', example: 'aerial city, mobile sky dock, massive rotor fortress' },
  ],
  airship: [
    { key: 'airship-small', minSpaces: 1, maxSpaces: 3, form: 'Small', example: 'personal observation balloon, micro blimp, survey blimp' },
    { key: 'airship-light', minSpaces: 4, maxSpaces: 19, form: 'Light', example: 'light civilian airship, watch platform, command blimp, patrol airship' },
    { key: 'airship-heavy', minSpaces: 20, maxSpaces: 199, form: 'Heavy', example: 'passenger airship, large cargo airship, military sky transport, sky-freighter, flying carrier' },
    { key: 'airship-huge', minSpaces: 200, maxSpaces: 1999, form: 'Huge', example: 'airborne refinery, mobile dock, airship carrier, floating fortress, aerial dreadnought' },
    { key: 'airship-massive', minSpaces: 2000, maxSpaces: null, form: 'Massive', example: 'floating city, sky fortress complex, atmospheric habitat platform' },
  ],
  watercraft: [
    { key: 'water-small', minSpaces: 1, maxSpaces: 3, form: 'Small', example: 'jet ski, skiff, dinghy, runabout' },
    { key: 'water-light', minSpaces: 4, maxSpaces: 19, form: 'Light', example: 'motorboat, cabin cruiser, light patrol boat, yacht, coastal patrol craft' },
    { key: 'water-heavy', minSpaces: 20, maxSpaces: 199, form: 'Heavy', example: 'missile boat, ferry, cutter, trawler, corvette, frigate, destroyer, coastal freighter' },
    { key: 'water-huge', minSpaces: 200, maxSpaces: 1999, form: 'Huge', example: 'battleship, carrier, cruiser, amphibious assault ship, fleet carrier, floating fortress' },
    { key: 'water-massive', minSpaces: 2000, maxSpaces: null, form: 'Massive', example: 'mobile sea base, floating city, oceanic fortress platform' },
  ],
  submersible: [
    { key: 'sub-small', minSpaces: 1, maxSpaces: 3, form: 'Small', example: 'diver scooter, one-man mini-sub, salvage pod' },
    { key: 'sub-light', minSpaces: 4, maxSpaces: 19, form: 'Light', example: 'light exploration submersible, diver support sub, patrol sub, research submarine' },
    { key: 'sub-heavy', minSpaces: 20, maxSpaces: 199, form: 'Heavy', example: 'heavy rescue sub, attack submarine, missile submarine, deep-ocean support craft, undersea carrier' },
    { key: 'sub-huge', minSpaces: 200, maxSpaces: 1999, form: 'Huge', example: 'large support submarine, sea-base sub, mobile undersea fortress, giant carrier-sub' },
    { key: 'sub-massive', minSpaces: 2000, maxSpaces: null, form: 'Massive', example: 'abyssal habitat ship, mobile undersea city, deep-ocean fortress complex' },
  ],
  walker: [
    { key: 'walker-small', minSpaces: 1, maxSpaces: 3, form: 'Small', example: 'loader walker, scout biped, industrial frame' },
    { key: 'walker-light', minSpaces: 4, maxSpaces: 19, form: 'Light', example: 'combat walker, cargo walker, troop walker, mobile drilling frame' },
    { key: 'walker-heavy', minSpaces: 20, maxSpaces: 199, form: 'Heavy', example: 'siege walker, super-heavy walker, artillery walker, mining platform, mobile citadel' },
    { key: 'walker-huge', minSpaces: 200, maxSpaces: 1999, form: 'Huge', example: 'fortress walker, siege titan, continent crawler, world-engine walker' },
    { key: 'walker-massive', minSpaces: 2000, maxSpaces: null, form: 'Massive', example: 'walking city, planetary construction walker, colossal siege platform' },
  ],
  structure: [
    { key: 'structure-small', minSpaces: 1, maxSpaces: 3, form: 'Small', example: 'kiosk, field shelter, tiny hab pod, checkpoint office' },
    { key: 'structure-light', minSpaces: 4, maxSpaces: 19, form: 'Light', example: 'small cabin, workshop, clinic pod, machine shop, warehouse unit, barracks block' },
    { key: 'structure-heavy', minSpaces: 20, maxSpaces: 199, form: 'Heavy', example: 'garage, hangar module, command post, large workshop, depot building, fortified outpost' },
    { key: 'structure-huge', minSpaces: 200, maxSpaces: 1999, form: 'Huge', example: 'major facility, habitat block, large hangar complex, arcology wing, carrier yard' },
    { key: 'structure-massive', minSpaces: 2000, maxSpaces: null, form: 'Massive', example: 'fortress complex, arcology, city-scale habitat, orbital construction yard' },
  ],
}

const armourRules: VehicleArmourRule[] = [
  { minTl: 0, maxTl: 2, materials: 'Wood, Bone, etc.', baseProtection: 0, maximumProtection: 10, vehicleSpacesPerPointPercent: 0.025, costPerArmourSpace: 1000, costPerPointPerVehicleSpace: 25 },
  { minTl: 3, maxTl: 4, materials: 'Iron', baseProtection: 1, maximumProtection: 15, vehicleSpacesPerPointPercent: 0.015, costPerArmourSpace: 5000, costPerPointPerVehicleSpace: 75 },
  { minTl: 5, maxTl: 6, materials: 'Steel', baseProtection: 2, maximumProtection: 20, vehicleSpacesPerPointPercent: 0.01, costPerArmourSpace: 7500, costPerPointPerVehicleSpace: 75 },
  { minTl: 7, maxTl: 9, materials: 'Alloys, Composites', baseProtection: 3, maximumProtection: 30, vehicleSpacesPerPointPercent: 0.01, costPerArmourSpace: 12500, costPerPointPerVehicleSpace: 125 },
  { minTl: 10, maxTl: 11, materials: 'Crystaliron', baseProtection: 5, maximumProtection: 40, vehicleSpacesPerPointPercent: 0.005, costPerArmourSpace: 50000, costPerPointPerVehicleSpace: 250 },
  { minTl: 12, maxTl: 13, materials: 'Superdense', baseProtection: 6, maximumProtection: 50, vehicleSpacesPerPointPercent: 0.004, costPerArmourSpace: 75000, costPerPointPerVehicleSpace: 300 },
  { minTl: 14, maxTl: 15, materials: 'Bonded Superdense', baseProtection: 8, maximumProtection: 60, vehicleSpacesPerPointPercent: 0.0032, costPerArmourSpace: 125000, costPerPointPerVehicleSpace: 400 },
  { minTl: 16, maxTl: 16, materials: 'Molecular Bonded', baseProtection: 10, maximumProtection: 80, vehicleSpacesPerPointPercent: 0.002, costPerArmourSpace: 375000, costPerPointPerVehicleSpace: 750 },
  { minTl: 17, maxTl: 17, materials: 'Coherent Superdense', baseProtection: 15, maximumProtection: 100, vehicleSpacesPerPointPercent: 0.0016, costPerArmourSpace: 500000, costPerPointPerVehicleSpace: 800 },
  { minTl: 18, materials: 'Collapsium', baseProtection: 20, maximumProtection: 160, vehicleSpacesPerPointPercent: 0.001, costPerArmourSpace: 1000000, costPerPointPerVehicleSpace: 1000 },
]

export const vehicleArmourRules = () => armourRules.map((rule) => ({ ...rule }))

const featureAgilityModifiers: Record<string, number> = {
  Agile: 1,
}

const featureSpeedModifiers: Record<string, number> = {
  Fast: 1,
  Slow: -1,
  Tracks: -1,
}

// Feature help text is surfaced in the builder so users can see the handbook intent
// of each selectable vehicle feature without leaving the workflow.
export const vehicleFeatureRuleText: Record<string, string> = {
  'AFV': 'An armoured fighting vehicle is designed for combat conditions, using a reinforced frame and composite materials to support three times the maximum armour.',
  'Aerodyne': 'Airframe shaped for powered atmospheric flight with lift surfaces integrated into the body.',
  'Agile': 'Improves handling. Current builder effect: +1 Agility.',
  'ATV': 'An all-terrain vehicle is designed with rough ground in mind and can negotiate terrain inaccessible to other vehicles.',
  'Fast': 'Pushes the design one speed band higher. Current builder effect: +1 Speed Band.',
  'Floats': 'Allows the vehicle to remain buoyant on water without requiring a full dedicated watercraft hull.',
  'Folding Wings': 'Wing structure can be stowed or folded for compact storage or mixed-mode operation.',
  'Hydrofoil': 'Uses lifting foils for higher-speed water travel while reducing hull drag.',
  'Hypersonic': 'High-atmosphere or extreme high-speed airframe treatment intended for very high velocity flight.',
  'Jet Engines': 'Aircraft propulsion feature representing jet-based thrust rather than propeller or rotor-only flight.',
  'Locomotive': 'Heavy rail-oriented feature intended for very large tracked rail designs. Size-gated in the builder.',
  'Monowheel': 'Single-wheel configuration with the stability and handling tradeoffs that implies.',
  'Multi-Legged': 'Walker body plan with multiple legs instead of a simpler two-leg layout.',
  'Off-Roader': 'An off-roader has its drive and suspension system modified to give it an improved ability to travel over unprepared surfaces such as brushland, low hills and muddy tracks.',
  'Open Frame': 'An open-frame vehicle leaves riders exposed. In collisions, unsecured occupants are thrown 10 metres per Speed Band travelled and take additional impact damage.',
  'Open-Topped': 'An open-topped vehicle is like an air/raft, speedboat or jeep with no cover. It is lighter and cheaper, but its dorsal face has no armour and its sides provide only half cover.',
  'Ornithopter': 'Winged flapping-flight configuration rather than conventional fixed-wing or rotary lift.',
  'Rail Rider': 'A rail rider is a ground vehicle built to operate directly on rail infrastructure and benefit from the track type it runs on.',
  'Rigid': 'Airship structure uses a rigid frame rather than a softer envelope-led form.',
  'Slow': 'Drops the design one speed band. Current builder effect: -1 Speed Band.',
  'Smart Wheels': 'Smart wheels reduce all aspects of terrain penalties by one, but do not let an unsuitable vehicle ignore the need for proper terrain traits.',
  'STOL': 'A STOL aeroplane is designed to operate from runways and landing fields in half the length of a conventional aeroplane and can maintain flight at Very Slow if its maximum Speed Band is Slow.',
  'Streamlined': 'Streamlining improves atmospheric performance. A grav vehicle with the streamlined feature can exceed Subsonic speeds in atmosphere if its other features allow it.',
  'Supersonic': 'Airframe is suitable for sustained supersonic flight.',
  'Tilt Engines': 'Engine or rotor arrangement can pivot between vertical-lift and forward-flight orientations.',
  'Tracks': 'A tracked vehicle is designed to overcome the roughest terrain. A tracked vehicle normally has its Speed Band reduced by one.',
  'Tunneller': 'Vehicle is equipped or structured for subsurface boring/travel. Size-gated in the builder.',
}

export type VehicleFeatureRuleDetail = {
  name: string
  minimumTechLevel: number
  appliesTo: string[]
  description: string
  effect: string
  traits?: string[]
  prerequisite?: string
  notCompatible?: string[]
  sizeLimits?: string
  minimumSpaces?: number
  agility?: string
  speed?: string
  range?: string
  shipping?: string
  addedCost?: string
}

export const vehicleFeatureRules: Record<string, VehicleFeatureRuleDetail> = {
  'Aerodyne': {
    name: 'Aerodyne',
    minimumTechLevel: 7,
    appliesTo: ['Rotorcraft'],
    description: 'Transforms a rotorcraft into a wingless aircraft propelled by vectored jet engines. It can hover and perform VTOL like a helicopter, but flies faster with jet thrust.',
    effect: 'Jet-propelled wingless flying craft.',
    prerequisite: 'Powered',
    notCompatible: ['Folding Wings', 'Ornithopter'],
    speed: '+1 Speed Band',
    shipping: 'x0.5',
    addedCost: '+30% base Cost',
  },
  'AFV': {
    name: 'AFV',
    minimumTechLevel: 5,
    appliesTo: ['Grav Vehicle', 'Ground Vehicle', 'Structure', 'Submersible', 'Walker', 'Watercraft'],
    description: 'An Armoured Fighting Vehicle is built for battlefield conditions, increasing armour limits and reinforcing the hull.',
    effect: '3x armour limit, +50% Hull, reduced Speed.',
    traits: ['AFV', 'Off-Roader'],
    notCompatible: ['Hydrofoil', 'Open-Topped'],
    speed: '-1 Speed Band',
    addedCost: '+100% base Cost',
  },
  'Agile': {
    name: 'Agile',
    minimumTechLevel: 1,
    appliesTo: ['Aeroplane', 'Airship', 'Grav Vehicle', 'Ground Vehicle', 'Hovercraft', 'Rotorcraft', 'Submersible', 'Walker', 'Watercraft'],
    description: 'Designed to be especially manoeuvrable through tighter turning geometry, control surfaces, gyroscopes, or similar handling improvements.',
    effect: 'Locomotion optimised for greater Agility.',
    notCompatible: ['Rail Rider'],
    agility: '+1',
    addedCost: '+100% base Cost',
  },
  'ATV': {
    name: 'ATV',
    minimumTechLevel: 0,
    appliesTo: ['Ground Vehicle'],
    description: 'The All-Terrain Vehicle feature improves rough-ground handling with additional wheels, higher ground clearance, or improved suspension.',
    effect: 'No penalty for off-road travel. Able to traverse rough terrain.',
    traits: ['ATV'],
    notCompatible: ['Off-Roader', 'Rail Rider', 'Tracks'],
    addedCost: '+30% base Cost',
  },
  'Biotech': {
    name: 'Biotech',
    minimumTechLevel: 0,
    appliesTo: ['Aeroplane', 'Airship', 'Ground Vehicle', 'Hovercraft', 'Rotorcraft', 'Structure', 'Submersible', 'Walker', 'Watercraft'],
    description: 'A living vehicle, constructed, modified, or trained. Its full construction rules are handled in the Biotech chapter.',
    effect: 'See Biotech Chapter.',
    traits: ['Biotech (see text)'],
    agility: 'varies',
    speed: 'varies',
    range: 'varies',
    shipping: 'varies',
    addedCost: 'varies',
  },
  'Fast': {
    name: 'Fast',
    minimumTechLevel: 0,
    appliesTo: ['Aeroplane', 'Airship', 'Grav Vehicle', 'Ground Vehicle', 'Hovercraft', 'Rotorcraft', 'Submersible', 'Walker', 'Watercraft'],
    description: 'Uses a more powerful engine at the cost of fuel efficiency or capacity.',
    effect: 'Trades bigger engine for less fuel.',
    notCompatible: ['Slow', 'Supersonic'],
    speed: '+1 Speed Band',
    range: 'x0.5',
    addedCost: '+100% base Cost',
  },
  'Floats': {
    name: 'Floats',
    minimumTechLevel: 4,
    appliesTo: ['Aeroplane', 'Rotorcraft'],
    description: 'Allows an aircraft to land on and take off from liquid surfaces using outriggers or a buoyant body.',
    effect: 'Floats or body of aircraft supports water landings.',
    speed: '-1 Speed Band',
    addedCost: '+20% base Cost',
  },
  'Folding Wings': {
    name: 'Folding Wings',
    minimumTechLevel: 4,
    appliesTo: ['Aeroplane', 'Rotorcraft'],
    description: 'Wings or blades fold against the body so the vehicle can be stored or transported in a smaller area.',
    effect: 'Wings or rotors fold to reduce shipping volume.',
    notCompatible: ['Aerodyne'],
    shipping: 'x0.75',
    addedCost: '+20% base Cost',
  },
  'Hydrofoil': {
    name: 'Hydrofoil',
    minimumTechLevel: 3,
    appliesTo: ['Watercraft'],
    description: 'Uses struts to raise the body above the surface at speed, reducing friction and improving top speed.',
    effect: 'Raises body of watercraft to reduce friction and increase Speed.',
    notCompatible: ['AFV'],
    speed: '+1 Speed Band',
    addedCost: '+200% base Cost',
  },
  'Hypersonic': {
    name: 'Hypersonic',
    minimumTechLevel: 8,
    appliesTo: ['Aeroplane'],
    description: 'Aerodynamics, materials, and intakes support extremely fast atmospheric flight.',
    effect: 'Changes aeroplane Speed Band to Hypersonic.',
    prerequisite: 'Jet',
    notCompatible: ['Open Frame', 'Open-Topped', 'Supersonic'],
    range: 'x0.5',
    addedCost: '+400% base Cost',
  },
  'Jet Engines': {
    name: 'Jet Engines',
    minimumTechLevel: 6,
    appliesTo: ['Aeroplane'],
    description: 'Uses jet thrust instead of propeller engines and is a prerequisite for supersonic or hypersonic flight.',
    effect: 'Uses Jet instead of propeller engines.',
    prerequisite: 'Powered',
    speed: '+1 Speed Band',
    range: 'x1.5',
    addedCost: '+200% base Cost',
  },
  'Locomotive': {
    name: 'Locomotive',
    minimumTechLevel: 3,
    appliesTo: ['Grav Vehicle', 'Ground Vehicle', 'Submersible', 'Walker', 'Watercraft'],
    description: 'Optimised for towing or pushing heavy loads, trading responsiveness for much greater hauling capacity.',
    effect: 'x4 towing capacity, Unresponsive, triple power points.',
    traits: ['Unresponsive'],
    prerequisite: 'Powered',
    sizeLimits: 'Size 20+',
    minimumSpaces: 20,
    agility: '-1',
    addedCost: '+50% base Cost',
  },
  'Monowheel': {
    name: 'Monowheel',
    minimumTechLevel: 9,
    appliesTo: ['Ground Vehicle'],
    description: 'A one-wheeled motorcycle-like vehicle with components and occupants inside the wheel.',
    effect: 'Manoeuvrable single wheel.',
    prerequisite: 'Powered',
    notCompatible: ['Tracks'],
    agility: '+2',
    speed: '+1 Speed Band',
    shipping: 'x0.5',
    addedCost: '+200% base Cost',
  },
  'Multi-Legged': {
    name: 'Multi-Legged',
    minimumTechLevel: 8,
    appliesTo: ['Walker'],
    description: 'Adds legs to a walker for improved stability and performance in rough terrain.',
    effect: 'Walker with more than two legs. DM+1 on rough terrain.',
    prerequisite: 'Powered',
    agility: '+1',
    addedCost: '+100% base Cost',
  },
  'Off-Roader': {
    name: 'Off-Roader',
    minimumTechLevel: 0,
    appliesTo: ['Ground Vehicle'],
    description: 'Allows a wheeled ground vehicle to operate normally off-road and venture into rough terrain.',
    effect: 'No penalty for off-road travel. Able to traverse rough terrain.',
    traits: ['Off-Roader'],
    notCompatible: ['ATV', 'Rail Rider', 'Tracks'],
    addedCost: '+15% base Cost',
  },
  'Open Frame': {
    name: 'Open Frame',
    minimumTechLevel: 0,
    appliesTo: ['Aeroplane', 'Airship', 'Grav Vehicle', 'Ground Vehicle', 'Hovercraft', 'Rotorcraft', 'Structure', 'Submersible', 'Walker', 'Watercraft'],
    description: 'Riders sit on the vehicle rather than inside it, gaining visibility and easy exit but losing armour protection.',
    effect: 'Riders sit outside vehicle with no armour protection.',
    traits: ['Open Vehicle'],
    notCompatible: ['Hypersonic', 'Open-Topped', 'Supersonic'],
    sizeLimits: 'Size 1-3',
    agility: '+1',
    speed: '+1 Speed Band',
    range: 'x0.8',
    shipping: 'x0.5',
    addedCost: '-30% base Cost',
  },
  'Open-Topped': {
    name: 'Open-Topped',
    minimumTechLevel: 0,
    appliesTo: ['Aeroplane', 'Grav Vehicle', 'Ground Vehicle', 'Hovercraft', 'Rotorcraft', 'Structure', 'Submersible', 'Walker', 'Watercraft'],
    description: 'Has no integral roof or top surface. Occupants have wide visibility but no top armour and only partial side cover.',
    effect: 'No top armour, sides provide half cover.',
    traits: ['Open-Topped'],
    notCompatible: ['AFV', 'Hypersonic', 'Open Frame', 'Supersonic'],
    addedCost: '-15% base Cost',
  },
  'Ornithopter': {
    name: 'Ornithopter',
    minimumTechLevel: 8,
    appliesTo: ['Rotorcraft'],
    description: 'A rotorcraft variant that flies like a bird using moving wings and Flyer (ornithopter) skill.',
    effect: 'Flies like a bird using moving wings.',
    notCompatible: ['Aerodyne'],
    agility: '+1',
    speed: '-1 Speed Band',
    range: 'x0.75',
    shipping: 'x0.75',
    addedCost: '+20% base Cost',
  },
  'Rail Rider': {
    name: 'Rail Rider',
    minimumTechLevel: 1,
    appliesTo: ['Ground Vehicle'],
    description: 'Designed to operate on rails, tracks, or monorails. Powered rail riders can combine with locomotive designs for train operations.',
    effect: 'Locomotion limited to railroad tracks or monorails.',
    notCompatible: ['Agile', 'ATV', 'Off-Roader', 'Tracks'],
    agility: '-2',
    speed: '+1 Speed Band',
    addedCost: '+50% base Cost',
  },
  'Responsive': {
    name: 'Responsive',
    minimumTechLevel: 0,
    appliesTo: ['Aeroplane', 'Airship', 'Grav Vehicle', 'Ground Vehicle', 'Hovercraft', 'Rotorcraft', 'Submersible', 'Walker', 'Watercraft'],
    description: 'Accelerates and decelerates quickly, reducing the time required to change speed bands.',
    effect: 'Reduces to half the time required to change Speed Bands.',
    traits: ['Responsive'],
    notCompatible: ['Unresponsive'],
    range: 'x0.75',
    addedCost: '+100% base Cost',
  },
  'Rigid': {
    name: 'Rigid',
    minimumTechLevel: 4,
    appliesTo: ['Airship'],
    description: 'A rigid airship uses a fixed frame around its lift envelope, improving range but making shipping and storage harder.',
    effect: 'Rigid frame to provide better range, but harder to ship or store.',
    range: 'x1.5',
    shipping: 'x5',
    addedCost: '+200% base Cost',
  },
  'Slow': {
    name: 'Slow',
    minimumTechLevel: 0,
    appliesTo: ['Aeroplane', 'Airship', 'Grav Vehicle', 'Ground Vehicle', 'Hovercraft', 'Rotorcraft', 'Submersible', 'Walker', 'Watercraft'],
    description: 'Sacrifices power for range, using a smaller engine and usually larger fuel tanks.',
    effect: 'Trades smaller engine for more fuel.',
    notCompatible: ['Fast'],
    speed: '-1 Speed Band',
    range: 'x1.5',
    addedCost: '-25% base Cost',
  },
  'Smart Wheels': {
    name: 'Smart Wheels',
    minimumTechLevel: 9,
    appliesTo: ['Ground Vehicle'],
    description: 'Sensors and adaptive wheels compensate for terrain, improving adverse-condition driving checks and range.',
    effect: 'DM+1 in adverse conditions; +10% range; lowers terrain penalty by 1.',
    agility: '+1',
    range: 'x1.1',
    addedCost: '+130% base Cost',
  },
  'STOL': {
    name: 'STOL',
    minimumTechLevel: 4,
    appliesTo: ['Aeroplane'],
    description: 'Short takeoff and landing design requiring half the normal runway or landing-field length.',
    effect: 'Take-offs and landings require half runway space.',
    addedCost: '+30% base Cost',
  },
  'Streamlined': {
    name: 'Streamlined',
    minimumTechLevel: 1,
    appliesTo: ['Airship', 'Grav Vehicle', 'Ground Vehicle', 'Hovercraft', 'Rotorcraft', 'Structure'],
    description: 'An aerodynamic hull that improves performance and allows some non-aeroplanes to exceed Subsonic speeds in atmosphere.',
    effect: 'Aerodynamic hulls for non-aeroplanes.',
    notCompatible: ['Tunneller'],
    agility: '+1',
    speed: '+1 Speed Band',
    addedCost: '+200% base Cost',
  },
  'Supersonic': {
    name: 'Supersonic',
    minimumTechLevel: 6,
    appliesTo: ['Aeroplane'],
    description: 'Aeroplane requirements for sustained faster-than-sound flight.',
    effect: 'Changes aeroplane Speed Band to Supersonic.',
    prerequisite: 'Jet',
    notCompatible: ['Fast', 'Hypersonic', 'Open Frame', 'Open-Topped'],
    range: 'x0.8',
    addedCost: '+200% base Cost',
  },
  'Tilt Engines': {
    name: 'Tilt Engines',
    minimumTechLevel: 8,
    appliesTo: ['Aeroplane'],
    description: 'Engines rotate to generate vertical thrust for VTOL operations.',
    effect: 'Aeroplane engines tilt to allow VTOL.',
    traits: ['VTOL'],
    speed: '-1 Speed Band',
    addedCost: '+100% base Cost',
  },
  'Tracks': {
    name: 'Tracks',
    minimumTechLevel: 5,
    appliesTo: ['Ground Vehicle'],
    description: 'Uses treads instead of wheels for superior rough-terrain performance at the cost of overall speed.',
    effect: 'Allow ground vehicle to traverse rough terrain but Speed reduced.',
    traits: ['Tracked'],
    notCompatible: ['ATV', 'Monowheel', 'Off-Roader'],
    speed: '-1 Speed Band',
    addedCost: '+100% base Cost',
  },
  'Tunneller': {
    name: 'Tunneller',
    minimumTechLevel: 7,
    appliesTo: ['Ground Vehicle', 'Submersible', 'Walker'],
    description: 'Large drills or boring equipment let Heavy or larger vehicles tunnel through solid rock, regolith, or hard soil.',
    effect: 'Allows ground vehicle to tunnel through rock at a rate of TLx1 m/hour, doubled at TL8+.',
    notCompatible: ['Streamlined'],
    sizeLimits: 'Size 20+',
    minimumSpaces: 20,
    agility: '-1',
    speed: '-1 Speed Band',
    addedCost: '+800% base Cost',
  },
  'Unresponsive': {
    name: 'Unresponsive',
    minimumTechLevel: 0,
    appliesTo: ['Aeroplane', 'Airship', 'Grav Vehicle', 'Ground Vehicle', 'Hovercraft', 'Rotorcraft', 'Submersible', 'Walker', 'Watercraft'],
    description: 'The vehicle accelerates and decelerates slowly, taking twice as long to change speed bands.',
    effect: 'Doubles time needed to change a Speed Band.',
    traits: ['Unresponsive'],
    notCompatible: ['Locomotive', 'Responsive'],
    addedCost: '-25% base Cost',
  },
}

const vehicleFeatureAppliesToFamily = (feature: string, family: VehicleFamilyRule) => {
  const rule = vehicleFeatureRules[feature]
  return !rule || rule.appliesTo.includes(family.label)
}

export const vehicleQualifiedFeatureNamesForFamily = (familyId: TravellerVehicleBaseFamily) => {
  const family = familyRuleFor(familyId)
  return family.allowedFeatures.filter((feature) => vehicleFeatureAppliesToFamily(feature, family))
}

export const vehicleFeatureMechanicalEffects = (
  feature: string,
  context: {
    familyId?: TravellerVehicleBaseFamily
    techLevel?: number
  } = {},
) => {
  const effects: string[] = []

  switch (feature) {
    case 'AFV':
      effects.push('Triples handbook maximum protection in Protection.')
      break
    case 'Agile':
      effects.push('+1 Agility.')
      break
    case 'Fast':
      effects.push('+1 Speed Band.')
      break
    case 'Slow':
      effects.push('-1 Speed Band.')
      break
    case 'Tracks':
      if (context.familyId === 'ground-vehicle') effects.push('Operating Skill becomes Drive (track).')
      effects.push('-1 Speed Band.')
      effects.push('Added to derived Traits.')
      break
    case 'Rail Rider':
      effects.push('Vehicle category shifts to rail configuration.')
      effects.push('Operating Skill remains Drive (wheel) in the current rules data.')
      effects.push('Added to derived Traits.')
      break
    case 'Tunneller':
      if (context.familyId === 'ground-vehicle') effects.push('Operating Skill becomes Drive (mole).')
      effects.push('Requires Heavy size band or larger (20+ spaces).')
      effects.push('Added to derived Traits.')
      break
    case 'Hydrofoil':
      effects.push('High-speed water-motion feature.')
      effects.push('Added to derived Traits.')
      break
    case 'ATV':
      effects.push('Improves all-terrain operation.')
      effects.push('Added to derived Traits.')
      break
    case 'Off-Roader':
      effects.push('Improves rough-terrain handling.')
      effects.push('Added to derived Traits.')
      break
    case 'Smart Wheels':
      effects.push('Improves wheel-system terrain handling.')
      effects.push('Added to derived Traits.')
      break
    case 'Open Frame':
      effects.push('Dorsal armour can be reduced to 0 when reallocating armour.')
      effects.push('Added to derived Traits.')
      break
    case 'Open-Topped':
      effects.push('Dorsal armour can be reduced to 0 when reallocating armour.')
      effects.push('Added to derived Traits.')
      break
    default:
      effects.push('Added to derived Traits.')
      break
  }

  return effects
}

export const vehicleFeatureHasExplicitMechanicalEffect = (
  feature: string,
  context: {
    familyId?: TravellerVehicleBaseFamily
    techLevel?: number
  } = {},
) => {
  const meaningfulEffects = vehicleFeatureMechanicalEffects(feature, context)
    .filter((effect) => effect !== 'Added to derived Traits.')

  return meaningfulEffects.length > 0
}

export const vehicleFeatureImpactTags = (
  feature: string,
  context: {
    familyId?: TravellerVehicleBaseFamily
    techLevel?: number
  } = {},
) => {
  const tags: string[] = []
  const effects = vehicleFeatureMechanicalEffects(feature, context)

  if (effects.some((effect) => effect.includes('Operating Skill becomes') || effect.includes('rail feature') || effect.includes('water-motion feature'))) {
    tags.push('Locomotion')
  }
  if (effects.some((effect) => effect.includes('Speed Band') || effect.includes('Agility') || effect.includes('terrain') || effect.includes('wheel-system'))) {
    tags.push('Mobility')
  }
  if (effects.some((effect) => effect.includes('Protection') || effect.includes('armour') || effect.includes('dorsal'))) {
    tags.push('Protection')
  }
  if (!vehicleFeatureHasExplicitMechanicalEffect(feature, context)) {
    tags.push('Partial')
  }

  return [...new Set(tags)]
}

const derivedVehicleCategoryForVehicle = (
  family: VehicleFamilyRule,
  features: string[],
): TravellerVehicleCategory => {
  if (family.id === 'ground-vehicle' && features.includes('Rail Rider')) return 'rail'
  return family.category
}

const derivedVehicleTypeNameForVehicle = (
  family: VehicleFamilyRule,
  spaces: number,
  features: string[],
) => {
  const sizeLabel = vehicleSizeBandForSpaces(spaces).label
  if (family.id === 'ground-vehicle' && features.includes('Rail Rider')) return `${sizeLabel} Rail Vehicle`
  return `${sizeLabel} ${family.typeLabel}`
}

const hullClassModifiers = {
  Light: { hull: -0.25, cost: -0.25 },
  Standard: { hull: 0, cost: 0 },
  Reinforced: { hull: 0.1, cost: 0.5 },
} as const

const hullClassAdjustedHull = (baseHull: number, hullClass: keyof typeof hullClassModifiers) => {
  if (hullClass === 'Reinforced') return Math.max(baseHull + 1, roundHalfUp(baseHull * 1.1))
  if (hullClass === 'Light') return Math.max(1, Math.min(baseHull - 1, roundHalfUp(baseHull * 0.75)))
  return baseHull
}

const formatSignedNumber = (value: number) => `${value >= 0 ? '+' : ''}${value}`

const roundHalfUp = (value: number) => {
  const sign = value < 0 ? -1 : 1
  return sign * Math.floor(Math.abs(value) + 0.5)
}

const primaryPowerRules: Record<TravellerVehiclePrimaryPower, PrimaryPowerRule> = {
  standard: {
    id: 'standard',
    label: 'Standard Power',
    minimumTechLevel: 0,
    costMultiplier: 0,
    notes: 'Default powered baseline assumed by the handbook type tables.',
  },
  unpowered: {
    id: 'unpowered',
    label: 'Unpowered',
    minimumTechLevel: 0,
    allowedFamilies: ['aeroplane', 'airship', 'ground-vehicle', 'structure', 'watercraft'],
    availableSpacePercent: 0.5,
    minimumSpaceGain: 1,
    costMultiplier: -0.8,
    speedOverride: 'Stopped',
    notes: 'Adds 50% more available internal spaces and reduces base cost by 80%.',
  },
  muscle: {
    id: 'muscle',
    label: 'Muscle Power',
    minimumTechLevel: 0,
    allowedFamilies: ['aeroplane', 'ground-vehicle', 'watercraft', 'structure'],
    availableSpacePercent: 0.4,
    minimumSpaceGain: 1,
    costMultiplier: -0.7,
    speedOverride: 'Idle',
    notes: 'Adds 40% more available internal spaces, reduces base cost by 70%, and defaults to Idle speed.',
  },
  wind: {
    id: 'wind',
    label: 'Wind Power',
    minimumTechLevel: 1,
    allowedFamilies: ['aeroplane', 'airship', 'ground-vehicle', 'watercraft', 'structure'],
    availableSpacePercent: 0.2,
    minimumSpaceGain: 1,
    costMultiplier: -0.6,
    notes: 'Adds 20% more available internal spaces and reduces base cost by 60%.',
  },
  grid: {
    id: 'grid',
    label: 'Grid Power',
    minimumTechLevel: 4,
    allowedFamilies: ['ground-vehicle', 'walker', 'structure'],
    availableSpacePercent: 0.4,
    minimumSpaceGain: 1,
    costMultiplier: 1,
    notes: 'Grid-powered vehicles gain 40% more available spaces but double the baseline cost.',
  },
  beamed: {
    id: 'beamed',
    label: 'Beamed Power',
    minimumTechLevel: 8,
    allowedFamilies: ['airship', 'grav-vehicle', 'hovercraft', 'walker', 'structure'],
    availableSpacePercent: 0.3,
    minimumSpaceGain: 2,
    flatCostPerVehicleSpace: 10000,
    costMultiplier: 0,
    notes: 'Adds 30% more available spaces and costs Cr10000 per vehicle space.',
  },
  'powered-structure': {
    id: 'powered-structure',
    label: 'Powered Structure',
    minimumTechLevel: 3,
    allowedFamilies: ['structure'],
    availableSpacePercent: 1,
    consumedSpacePercent: 0.25,
    minimumConsumedSpaces: 1,
    costMultiplier: 1,
    notes: 'Structures normally double available spaces; internal power then consumes 25% of original spaces and doubles base cost.',
  },
  'fission-basic': {
    id: 'fission-basic',
    label: 'Fission Power (Basic)',
    minimumTechLevel: 6,
    consumedSpacePercent: 0.5,
    minimumConsumedSpaces: 10,
    costMultiplier: 0,
    costPerInstalledSpace: 100000,
    endurance: '10 years',
    powerPerSpace: 2,
    notes: 'Self-contained fission reactor. Requires hostile environment protection for occupants and nearby bystanders.',
  },
  'fission-improved': {
    id: 'fission-improved',
    label: 'Fission Power (Improved)',
    minimumTechLevel: 7,
    consumedSpacePercent: 0.4,
    minimumConsumedSpaces: 10,
    costMultiplier: 0,
    costPerInstalledSpace: 150000,
    endurance: '25 years',
    powerPerSpace: 2.2,
    notes: 'Improved fission reactor with longer endurance and better power density.',
  },
  'fission-advanced': {
    id: 'fission-advanced',
    label: 'Fission Power (Advanced)',
    minimumTechLevel: 8,
    consumedSpacePercent: 0.3,
    minimumConsumedSpaces: 10,
    costMultiplier: 0,
    costPerInstalledSpace: 200000,
    endurance: '50 years',
    powerPerSpace: 2.4,
    notes: 'Advanced fission reactor with improved compactness and endurance.',
  },
  'fusion-basic': {
    id: 'fusion-basic',
    label: 'Fusion Power (Basic)',
    minimumTechLevel: 8,
    consumedSpacePercent: 0.25,
    minimumConsumedSpaces: 10,
    costMultiplier: 0,
    costPerInstalledSpace: 125000,
    endurance: '50 years',
    powerPerSpace: 2.5,
    notes: 'Basic fusion reactor. No routine radiation hazard but still requires careful disposal.',
  },
  'fusion-improved': {
    id: 'fusion-improved',
    label: 'Fusion Power (Improved)',
    minimumTechLevel: 12,
    consumedSpacePercent: 0.2,
    minimumConsumedSpaces: 10,
    costMultiplier: 0,
    costPerInstalledSpace: 250000,
    endurance: '100 years',
    powerPerSpace: 3.5,
    notes: 'Improved fusion reactor with higher power density and long service life.',
  },
  'fusion-advanced': {
    id: 'fusion-advanced',
    label: 'Fusion Power (Advanced)',
    minimumTechLevel: 15,
    consumedSpacePercent: 0.1,
    minimumConsumedSpaces: 5,
    costMultiplier: 0,
    costPerInstalledSpace: 500000,
    endurance: '100 years',
    powerPerSpace: 5,
    notes: 'Advanced fusion reactor with strong power density and compact footprint.',
  },
  antimatter: {
    id: 'antimatter',
    label: 'Antimatter Power',
    minimumTechLevel: 20,
    consumedSpacePercent: 0.1,
    minimumConsumedSpaces: 4,
    costMultiplier: 0,
    costPerInstalledSpace: 2500000,
    endurance: '100 years',
    powerPerSpace: 25,
    notes: 'Antimatter containment plant with extremely high power density and rapid startup/shutdown.',
  },
  'fusion-plus-basic': {
    id: 'fusion-plus-basic',
    label: 'Fusion+ Power (Basic)',
    minimumTechLevel: 10,
    consumedSpacePercent: 0.1,
    minimumConsumedSpaces: 1,
    costMultiplier: 0,
    costPerInstalledSpace: 15000,
    rangeMultiplier: 5,
    powerPerSpace: 1,
    supportsFusionPlusFuelType: true,
    notes: 'Compact gravitic-assisted fusion plant using water or deuterium-enriched water as fuel.',
  },
  'fusion-plus-improved': {
    id: 'fusion-plus-improved',
    label: 'Fusion+ Power (Improved)',
    minimumTechLevel: 13,
    consumedSpacePercent: 0.1,
    minimumConsumedSpaces: 1,
    costMultiplier: 0,
    costPerInstalledSpace: 25000,
    rangeMultiplier: 15,
    powerPerSpace: 2,
    supportsFusionPlusFuelType: true,
    notes: 'Improved Fusion+ plant with higher power density and much longer operational range.',
  },
  'fusion-plus-advanced': {
    id: 'fusion-plus-advanced',
    label: 'Fusion+ Power (Advanced)',
    minimumTechLevel: 16,
    consumedSpacePercent: 0.1,
    minimumConsumedSpaces: 1,
    costMultiplier: 0,
    costPerInstalledSpace: 50000,
    rangeMultiplier: 25,
    powerPerSpace: 3,
    supportsFusionPlusFuelType: true,
    notes: 'Advanced Fusion+ plant with very high endurance and compact power density.',
  },
  'solar-basic': {
    id: 'solar-basic',
    label: 'Solar Power (Basic)',
    minimumTechLevel: 8,
    consumedSpacePercent: 0.2,
    minimumConsumedSpaces: 2,
    costMultiplier: 0,
    costPerInstalledSpace: 50000,
    endurance: 'Unlimited daytime / 3 hours stored at cruise',
    notes: 'Solar panels and batteries sized for operation within a habitable zone.',
  },
  'solar-improved': {
    id: 'solar-improved',
    label: 'Solar Power (Improved)',
    minimumTechLevel: 10,
    consumedSpacePercent: 0.1,
    minimumConsumedSpaces: 2,
    costMultiplier: 0,
    costPerInstalledSpace: 100000,
    endurance: 'Unlimited daytime / 3 hours stored at cruise',
    notes: 'Improved solar panels and batteries with reduced space demand.',
  },
  'solar-advanced': {
    id: 'solar-advanced',
    label: 'Solar Power (Advanced)',
    minimumTechLevel: 12,
    consumedSpacePercent: 0.05,
    minimumConsumedSpaces: 2,
    costMultiplier: 0,
    costPerInstalledSpace: 150000,
    endurance: 'Unlimited daytime / 3 hours stored at cruise',
    notes: 'Advanced solar plant with compact panel and battery package.',
  },
}

const auxiliaryDriveRules: Record<TravellerVehicleAuxiliaryDrive, AuxiliaryDriveRule> = {
  none: {
    id: 'none',
    label: 'None',
    minimumTechLevel: 0,
    spacePercent: 0,
    minimumSpaces: 0,
    flatCostPerVehicleSpace: 0,
    notes: 'No auxiliary drive installed.',
  },
  aquatic: {
    id: 'aquatic',
    label: 'Aquatic Drive',
    minimumTechLevel: 4,
    baseEquivalentFamily: 'watercraft',
    speedModifier: -1,
    agilityModifier: -1,
    rangeMultiplier: 0.1,
    spacePercent: 0.05,
    minimumSpaces: 1,
    flatCostPerVehicleSpace: 1500,
    notes: 'Allows surface-water travel using equivalent watercraft performance at reduced values.',
  },
  grav: {
    id: 'grav',
    label: 'Auxiliary Grav Drive',
    minimumTechLevel: 10,
    allowedFamilies: ['ground-vehicle', 'watercraft', 'structure'],
    baseEquivalentFamily: 'grav-vehicle',
    speedModifier: -1,
    agilityModifier: -1,
    rangeMultiplier: 0.5,
    spacePercent: 0.25,
    minimumSpaces: 1,
    flatCostPerVehicleSpace: 20000,
    grantedTraits: ['VTOL'],
    notes: 'Grants limited grav-flight capability and VTOL while operating.',
  },
  ground: {
    id: 'ground',
    label: 'Ground Drive',
    minimumTechLevel: 8,
    allowedFamilies: ['aeroplane', 'airship', 'grav-vehicle', 'hovercraft', 'rotorcraft', 'watercraft'],
    baseEquivalentFamily: 'walker',
    speedModifier: -1,
    agilityModifier: -1,
    rangeMultiplier: 0.5,
    spacePercent: 0.1,
    minimumSpaces: 1,
    flatCostPerVehicleSpace: 20000,
    notes: 'Converts a flying or floating vehicle into a fully capable ground vehicle.',
  },
  leg: {
    id: 'leg',
    label: 'Leg Drive',
    minimumTechLevel: 4,
    baseEquivalentFamily: 'ground-vehicle',
    speedModifier: 0,
    agilityModifier: -1,
    rangeMultiplier: 0.5,
    spacePercent: 0.05,
    minimumSpaces: 1,
    flatCostPerVehicleSpace: 3000,
    grantedTraits: ['ATV'],
    notes: 'Adds legs and ATV capability. Aeroplanes with leg drive gain STOL.',
  },
  lifters: {
    id: 'lifters',
    label: 'Lifters',
    minimumTechLevel: 10,
    baseEquivalentFamily: 'grav-vehicle',
    speedModifier: -5,
    agilityModifier: -3,
    rangeMultiplier: 0.1,
    spacePercent: 0.1,
    minimumSpaces: 1,
    flatCostPerVehicleSpace: 5000,
    grantedTraits: ['VTOL'],
    notes: 'Limited gravitic lift for hovering and very slow flight within one planetary diameter.',
  },
  rail: {
    id: 'rail',
    label: 'Rail Wheels',
    minimumTechLevel: 1,
    baseEquivalentFamily: 'ground-vehicle',
    speedModifier: 0,
    agilityModifier: -2,
    rangeMultiplier: 1,
    spacePercent: 0.05,
    minimumSpaces: 1,
    flatCostPerVehicleSpace: 400,
    notes: 'Allows rail operation on compatible tracks.',
  },
  track: {
    id: 'track',
    label: 'Track Drive',
    minimumTechLevel: 6,
    baseEquivalentFamily: 'ground-vehicle',
    speedModifier: -2,
    agilityModifier: -1,
    rangeMultiplier: 0.5,
    spacePercent: 0.1,
    minimumSpaces: 1,
    flatCostPerVehicleSpace: 1000,
    grantedTraits: ['ATV'],
    notes: 'Deployable tracked locomotion for rough terrain performance.',
  },
  submarine: {
    id: 'submarine',
    label: 'Submarine Drive',
    minimumTechLevel: 6,
    baseEquivalentFamily: 'submersible',
    speedModifier: -1,
    agilityModifier: -1,
    rangeMultiplier: 0.5,
    spacePercent: 0.1,
    minimumSpaces: 1,
    flatCostPerVehicleSpace: 3000,
    notes: 'Allows submerged operation using reduced equivalent submersible performance.',
  },
  supercavitation: {
    id: 'supercavitation',
    label: 'Supercavitating Drive',
    minimumTechLevel: 8,
    allowedFamilies: ['submersible'],
    speedOverride: 'Very Fast',
    rangeMultiplier: 0.25,
    spacePercent: 0.4,
    minimumSpaces: 10,
    flatCostPerVehicleSpace: 500000,
    notes: 'Short-range high-speed tactical underwater drive.',
  },
}

const clamp = (value: number, minimum: number, maximum: number) => Math.max(minimum, Math.min(maximum, value))

const normalizeSpeedBandIndex = (index: number) => clamp(index, 0, speedBandOrder.length - 1)

const speedBandToIndex = (band: string) => speedBandOrder.indexOf((band || '') as SpeedBand)

const shiftSpeedBand = (band: SpeedBand, delta: number) => speedBandOrder[normalizeSpeedBandIndex(speedBandToIndex(band) + delta)] ?? band

const familyRuleFor = (family: TravellerVehicleBaseFamily) => handbookFamilyRules[family]

const inferBaseFamily = (vehicle: Pick<TravellerVehicleRecord, 'category' | 'type' | 'skill'>): TravellerVehicleBaseFamily => {
  const type = vehicle.type.toLowerCase()
  if (type.includes('rotorcraft')) return 'rotorcraft'
  if (type.includes('airship')) return 'airship'
  if (type.includes('submersible')) return 'submersible'
  if (type.includes('watercraft')) return 'watercraft'
  if (type.includes('walker')) return 'walker'
  if (type.includes('hovercraft')) return 'hovercraft'
  if (type.includes('grav')) return 'grav-vehicle'
  if (type.includes('ground')) return 'ground-vehicle'
  if (type.includes('aeroplane')) return 'aeroplane'
  switch (vehicle.category) {
    case 'grav': return 'grav-vehicle'
    case 'ground': return 'ground-vehicle'
    case 'hovercraft': return 'hovercraft'
    case 'walker': return 'walker'
    case 'watercraft': return vehicle.skill.toLowerCase().includes('submarine') ? 'submersible' : 'watercraft'
    case 'aircraft': return vehicle.skill.toLowerCase().includes('rotor') ? 'rotorcraft' : vehicle.skill.toLowerCase().includes('airship') ? 'airship' : 'aeroplane'
    default: return 'structure'
  }
}

const formatTons = (value: number) => `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1).replace(/\.0$/, '')} tons`

const formatCost = (value: number) => {
  if (value >= 1000000) {
    const millions = (value / 1000000)
    return `MCr${Number.isInteger(millions) ? millions.toFixed(0) : millions.toFixed(1).replace(/\.0$/, '')}`
  }
  return `Cr${Math.round(value).toLocaleString()}`
}

const baselineForTechLevel = (family: TravellerVehicleBaseFamily, techLevel: number) => {
  const rule = familyRuleFor(family)
  const baseline = rule.speedBaselines.find((entry) => techLevel >= entry.minTl && (entry.maxTl === undefined || techLevel <= entry.maxTl))
  return baseline ?? rule.speedBaselines[rule.speedBaselines.length - 1]
}

const armourRuleForTechLevel = (techLevel: number) => {
  return armourRules.find((rule) => techLevel >= rule.minTl && (rule.maxTl === undefined || techLevel <= rule.maxTl)) ?? armourRules[armourRules.length - 1]
}

const fusionPlusFuelRangeMultiplier = (fuelType: TravellerVehicleFusionPlusFuelType) => (
  fuelType === 'deuterium-enriched-water' ? 3 : 1
)

const installedPowerPlantSpaces = (vehicle: CustomVehicleDesign, power: PrimaryPowerRule) => {
  if (!power.consumedSpacePercent) return 0
  return Math.max(power.minimumConsumedSpaces ?? 0, Math.ceil(vehicle.spaces * power.consumedSpacePercent))
}

const isOpenToppedArmourException = (vehicle: CustomVehicleDesign, facing: keyof TravellerVehicleArmour) => {
  if (facing !== 'dorsal') return false
  return vehicle.features.includes('Open-Topped') || vehicle.features.includes('Open Frame')
}

const parsedArmourFaceValue = (vehicle: CustomVehicleDesign, facing: keyof TravellerVehicleArmour, baseProtection: number) => {
  const rawValue = String(vehicle.armour[facing] ?? '').trim()
  if (!rawValue) return baseProtection
  const parsedValue = Number(rawValue)
  return Number.isFinite(parsedValue) ? parsedValue : baseProtection
}

const armourSummaryForVehicle = (vehicle: CustomVehicleDesign) => {
  const size = vehicleSizeBandForSpaces(vehicle.spaces)
  const rule = armourRuleForTechLevel(vehicle.techLevel)
  const baseProtection = rule.baseProtection
  const maximumProtection = rule.maximumProtection * (vehicle.features.includes('AFV') ? 3 : 1)
  const faceValues = {
    forward: parsedArmourFaceValue(vehicle, 'forward', baseProtection),
    port: parsedArmourFaceValue(vehicle, 'port', baseProtection),
    dorsal: parsedArmourFaceValue(vehicle, 'dorsal', baseProtection),
    aft: parsedArmourFaceValue(vehicle, 'aft', baseProtection),
    starboard: parsedArmourFaceValue(vehicle, 'starboard', baseProtection),
    ventral: parsedArmourFaceValue(vehicle, 'ventral', baseProtection),
  }
  const addedProtectionTotal = Object.entries(faceValues).reduce((total, [facing, value]) => {
    const minimumFacingProtection = isOpenToppedArmourException(vehicle, facing as keyof TravellerVehicleArmour) ? 0 : baseProtection
    return total + Math.max(0, value - minimumFacingProtection)
  }, 0)
  const equivalentAddedProtection = addedProtectionTotal / 5
  const rawArmourSpaces = vehicle.spaces * rule.vehicleSpacesPerPointPercent * size.armourVolumeMultiplier * equivalentAddedProtection
  const armourSpaces = Math.ceil(rawArmourSpaces)
  const armourCost = rawArmourSpaces > 0
    ? (
        Number.isInteger(rawArmourSpaces)
          ? rawArmourSpaces * rule.costPerArmourSpace
          : equivalentAddedProtection * vehicle.spaces * size.armourVolumeMultiplier * rule.costPerPointPerVehicleSpace
      )
    : 0

  return {
    rule,
    size,
    baseProtection,
    maximumProtection,
    faceValues,
    equivalentAddedProtection,
    rawArmourSpaces,
    armourSpaces,
    armourCost,
  }
}

export const vehicleSizeBandForSpaces = (spaces: number): VehicleSizeProfile => {
  if (spaces <= 3) return { ...sizeProfiles[0], hitDm: '+0' }
  if (spaces <= 19) return { ...sizeProfiles[1], hitDm: '+1' }
  if (spaces <= 99) return { ...sizeProfiles[2], hitDm: '+2' }
  if (spaces <= 199) return { ...sizeProfiles[2], hitDm: '+3' }
  if (spaces <= 999) return { ...sizeProfiles[3], hitDm: '+4' }
  if (spaces <= 1999) return { ...sizeProfiles[3], hitDm: '+5' }
  return { ...sizeProfiles[4], hitDm: '+6' }
}

export const vehicleHitDmForSpaces = (spaces: number) => vehicleSizeBandForSpaces(spaces).hitDm

export const vehicleSizeReferenceRowsForFamily = (family: TravellerVehicleBaseFamily) => (
  vehicleSizeReferenceLibrary[family] ?? vehicleSizeReferenceLibrary['ground-vehicle']
)

export const vehicleSizeReferenceForVehicle = (family: TravellerVehicleBaseFamily, spaces: number) => {
  const rows = vehicleSizeReferenceRowsForFamily(family)
  return rows.find((row) => spaces >= row.minSpaces && (row.maxSpaces === null || spaces <= row.maxSpaces)) ?? rows[rows.length - 1]
}

export const vehicleBuilderFamilyOptions = () => Object.values(handbookFamilyRules).map((rule) => ({
  id: rule.id,
  label: rule.label,
  category: rule.category,
}))

export const vehicleFamilyRule = (family: TravellerVehicleBaseFamily) => familyRuleFor(family)
export const vehiclePrimaryPowerOptions = () => Object.values(primaryPowerRules)
export const vehicleAuxiliaryDriveOptions = () => Object.values(auxiliaryDriveRules)

export const vehicleBuilderCoreOptionFamilies = (): VehicleBuilderCoreOptionFamily[] => ([
  {
    id: 'autopilot',
    label: 'Autopilot',
    description: 'Automated driving and pilot-assistance systems.',
    category: 'computers-control',
    options: [
      { id: 'autopilot-basic', label: 'Basic', name: 'Autopilot (basic)' },
      { id: 'autopilot-improved', label: 'Improved', name: 'Autopilot (improved)' },
      { id: 'autopilot-enhanced', label: 'Enhanced', name: 'Autopilot (enhanced)' },
      { id: 'autopilot-advanced', label: 'Advanced', name: 'Autopilot (advanced)' },
    ],
  },
  {
    id: 'control-system',
    label: 'Control Systems',
    description: 'Primary vehicle control systems and brains.',
    category: 'computers-control',
    options: [
      { id: 'control-system-basic', label: 'Basic', name: 'Control System (basic)' },
      { id: 'control-system-improved', label: 'Improved', name: 'Control System (improved)' },
      { id: 'control-system-enhanced', label: 'Enhanced', name: 'Control System (enhanced)' },
      { id: 'control-systems-improved', label: 'Improved (systems)', name: 'Control Systems (improved)' },
      { id: 'control-systems-enhanced', label: 'Enhanced (systems)', name: 'Control Systems (enhanced)' },
      { id: 'control-systems-advanced', label: 'Advanced (systems)', name: 'Control Systems (advanced)' },
      { id: 'combat-vehicle-brain-basic', label: 'Combat Brain (basic)', name: 'Combat Vehicle Brain (basic)' },
      { id: 'combat-vehicle-brain-advanced', label: 'Combat Brain (advanced)', name: 'Combat Vehicle Brain (advanced)' },
      { id: 'vehicle-brain-interface', label: 'Vehicle Brain Interface', name: 'Vehicle Brain Interface' },
    ],
  },
  {
    id: 'communications',
    label: 'Communications',
    description: 'Transceivers and encrypted communications systems.',
    category: 'communications',
    options: [
      { id: 'transceiver-basic', label: 'Transceiver (basic)', name: 'Transceiver (basic)' },
      { id: 'transceiver-improved', label: 'Transceiver (improved)', name: 'Transceiver (improved)' },
      { id: 'transceiver-enhanced', label: 'Transceiver (enhanced)', name: 'Transceiver (enhanced)' },
      { id: 'transceiver-advanced', label: 'Transceiver (advanced)', name: 'Transceiver (advanced)' },
      { id: 'transceiver-superior', label: 'Transceiver (superior)', name: 'Transceiver (superior)' },
      { id: 'communication-system-improved-encrypted', label: 'Comms (improved, encrypted)', name: 'Communication System (improved, encrypted)' },
      { id: 'communication-system-advanced-encrypted', label: 'Comms (advanced, encrypted)', name: 'Communication System (advanced, encrypted)' },
    ],
  },
  {
    id: 'navigation',
    label: 'Navigation',
    description: 'Navigation and route-planning systems.',
    category: 'computers-control',
    options: [
      { id: 'navigation-basic', label: 'Basic', name: 'Navigation System (basic)' },
      { id: 'navigation-improved', label: 'Improved', name: 'Navigation System (improved)' },
      { id: 'navigation-advanced', label: 'Advanced', name: 'Navigation System (advanced)' },
    ],
  },
  {
    id: 'sensors',
    label: 'Sensors',
    description: 'Sensor, scan, and hardened detection suites.',
    category: 'sensors-detection',
    options: [
      { id: 'sensor-system-basic', label: 'Sensor System (basic)', name: 'Sensor System (basic)' },
      { id: 'sensor-system-improved', label: 'Sensor System (improved)', name: 'Sensor System (improved)' },
      { id: 'sensor-system-enhanced', label: 'Sensor System (enhanced)', name: 'Sensor System (enhanced)' },
      { id: 'sensor-system-advanced', label: 'Sensor System (advanced)', name: 'Sensor System (advanced)' },
      { id: 'sensor-system-underwater', label: 'Sensor System (underwater)', name: 'Sensor System (underwater)' },
      { id: 'sensors-basic', label: 'Sensors (basic)', name: 'Sensors (basic)' },
      { id: 'sensors-improved', label: 'Sensors (improved)', name: 'Sensors (improved)' },
      { id: 'sensors-improved-hardened', label: 'Sensors (improved, hardened)', name: 'Sensors (improved, hardened)' },
    ],
  },
  {
    id: 'camouflage',
    label: 'Camouflage',
    description: 'Visual and signature-reduction camouflage systems.',
    category: 'general-options',
    options: [
      { id: 'camouflage-basic', label: 'Basic', name: 'Camouflage (basic)' },
      { id: 'camouflage-improved', label: 'Improved', name: 'Camouflage (improved)' },
      { id: 'camouflage-advanced', label: 'Advanced', name: 'Camouflage (advanced)' },
    ],
  },
  {
    id: 'stealth',
    label: 'Stealth',
    description: 'Vehicle stealth systems and low-signature packages.',
    category: 'general-options',
    options: [
      { id: 'stealth-improved', label: 'Improved', name: 'Stealth (improved)' },
    ],
  },
])

export const vehicleDerivedTypeName = (family: TravellerVehicleBaseFamily, spaces: number) => {
  const sizeLabel = vehicleSizeBandForSpaces(spaces).label
  return `${sizeLabel} ${familyRuleFor(family).typeLabel}`
}

const derivedOperatingSkillForVehicle = (
  family: VehicleFamilyRule,
  features: string[],
) => {
  if (family.id !== 'ground-vehicle') return family.defaultSkill
  if (features.includes('Tracks')) return 'Drive (track)'
  if (features.includes('Tunneller')) return 'Drive (mole)'
  return 'Drive (wheel)'
}

const parseLeadingNumber = (value: unknown) => {
  const match = String(value ?? '').match(/\d+(?:\.\d+)?/)
  if (!match) return 0
  const parsed = Number(match[0])
  return Number.isFinite(parsed) ? parsed : 0
}

const normalizeOccupantEntries = (vehicle: CustomVehicleDesign): CustomVehicleOccupantEntry[] => {
  if (Array.isArray(vehicle.occupantEntries) && vehicle.occupantEntries.length) {
    return vehicle.occupantEntries.map((entry) => ({
      role: String(entry?.role ?? '').trim() || (entry?.category === 'passenger' ? 'Passengers' : 'Crew'),
      count: Math.max(0, Number(entry?.count ?? 0)),
      spacesEach: Math.max(0, Number(entry?.spacesEach ?? 1)),
      category: entry?.category === 'passenger' ? 'passenger' : 'crew',
    }))
  }

  const entries: CustomVehicleOccupantEntry[] = []
  const crewCount = parseLeadingNumber(vehicle.crew)
  const passengerCount = parseLeadingNumber(vehicle.passengers)

  if (crewCount > 0) entries.push({
    role: 'Crew',
    count: crewCount,
    spacesEach: 1,
    category: 'crew',
  })
  if (passengerCount > 0) entries.push({
    role: 'Passengers',
    count: passengerCount,
    spacesEach: 1,
    category: 'passenger',
  })

  return entries
}

const normalizeCargoEntries = (vehicle: CustomVehicleDesign): CustomVehicleCargoEntry[] => {
  if (Array.isArray(vehicle.cargoEntries) && vehicle.cargoEntries.length) {
    return vehicle.cargoEntries.map((entry) => ({
      name: String(entry?.name ?? '').trim() || 'Cargo',
      spaces: Math.max(0, Number(entry?.spaces ?? 0)),
      tons: Math.max(0, Number(entry?.tons ?? 0)),
    }))
  }

  const cargoSpaces = parseLeadingNumber(vehicle.cargo)
  return cargoSpaces > 0
    ? [{ name: 'Cargo', spaces: cargoSpaces, tons: cargoSpaces * 0.25 }]
    : []
}

const formatCountSummary = (entries: CustomVehicleOccupantEntry[], category: CustomVehicleOccupantEntry['category']) => {
  const count = entries
    .filter((entry) => entry.category === category)
    .reduce((total, entry) => total + Math.max(0, Number(entry.count ?? 0)), 0)
  return count ? String(count) : '0'
}

const formatCargoSummary = (entries: CustomVehicleCargoEntry[]) => {
  const spaces = entries.reduce((total, entry) => total + Math.max(0, Number(entry.spaces ?? 0)), 0)
  const tons = entries.reduce((total, entry) => total + Math.max(0, Number(entry.tons ?? 0)), 0)
  if (!spaces && !tons) return '0'
  if (tons) return `${spaces} Spaces / ${tons.toLocaleString()} tons`
  return `${spaces} Spaces`
}

export const vehicleOccupantComfortSummaries = (entries: CustomVehicleOccupantEntry[]): VehicleOccupantComfortSummary[] => {
  const summaries: VehicleOccupantComfortSummary[] = []

  for (const category of ['crew', 'passenger'] as const) {
    const categoryEntries = (entries ?? []).filter((entry) => entry.category === category)
    const count = categoryEntries.reduce((total, entry) => total + Math.max(0, Number(entry.count ?? 0)), 0)
    if (count <= 0) continue

    const spaces = categoryEntries.reduce((total, entry) => (
      total + (Math.max(0, Number(entry.count ?? 0)) * Math.max(0, Number(entry.spacesEach ?? 0)))
    ), 0)
    const comfortLevel = spaces / count
    summaries.push({
      category,
      label: category === 'crew' ? 'Crew' : 'Passengers',
      count,
      spaces,
      comfortLevel,
      rule: vehicleComfortLevelRuleForValue(comfortLevel),
    })
  }

  return summaries
}

const formatComfortSummary = (entries: CustomVehicleOccupantEntry[]) => {
  const summaries = vehicleOccupantComfortSummaries(entries)
  if (!summaries.length) return ''
  return summaries.map((summary) => `${summary.label}: ${summary.rule.label}`).join('; ')
}

export const vehicleConstructionSummary = (vehicle: CustomVehicleDesign) => {
  const family = familyRuleFor(vehicle.baseFamily || inferBaseFamily(vehicle))
  const power = primaryPowerRules[vehicle.primaryPower]
  const auxiliary = auxiliaryDriveRules[vehicle.auxiliaryDrive]
  const baseline = baselineForTechLevel(family.id, Math.max(vehicle.techLevel, family.minimumTechLevel))
  const effectiveBaseSpaces = vehicle.spaces
  const powerPlantSpaces = installedPowerPlantSpaces(vehicle, power)
  let availableSpaces = effectiveBaseSpaces

  if (family.id === 'structure') {
    availableSpaces = effectiveBaseSpaces * 2
    if (vehicle.primaryPower === 'powered-structure') {
      availableSpaces -= Math.max(power.minimumConsumedSpaces ?? 0, Math.ceil(effectiveBaseSpaces * (power.consumedSpacePercent ?? 0)))
    }
  }
  else if (power.availableSpacePercent > 0) {
    availableSpaces += Math.max(power.minimumSpaceGain ?? 0, Math.ceil(effectiveBaseSpaces * power.availableSpacePercent))
  }
  else if (powerPlantSpaces > 0) {
    availableSpaces -= powerPlantSpaces
  }

  const auxiliarySpaces = auxiliary.id === 'none'
    ? 0
    : Math.max(auxiliary.minimumSpaces, Math.ceil(effectiveBaseSpaces * auxiliary.spacePercent))

  availableSpaces = Math.max(0, availableSpaces - auxiliarySpaces)

  const auxiliarySummary = auxiliary.id === 'none'
    ? null
    : (() => {
        const auxEquivalentFamily = auxiliary.baseEquivalentFamily ? familyRuleFor(auxiliary.baseEquivalentFamily) : family
        const auxBaseline = baselineForTechLevel(auxEquivalentFamily.id, Math.max(vehicle.techLevel, auxEquivalentFamily.minimumTechLevel))
        const auxSpeed = auxiliary.speedOverride ?? shiftSpeedBand(auxBaseline.speed, auxiliary.speedModifier ?? 0)
        const auxAgility = auxEquivalentFamily.baseAgility + (auxiliary.agilityModifier ?? 0)
        const auxRange = roundHalfUp(auxBaseline.range * (auxiliary.rangeMultiplier ?? 1))
        return {
          speed: auxSpeed,
          agility: formatSignedNumber(auxAgility),
          range: `${auxRange}${auxBaseline.rangeUnit === 'years' ? ' years' : 'km'}`,
        }
      })()

  const armourSummary = armourSummaryForVehicle(vehicle)
  const featureAllocatedSpaces = 0
  const occupantAllocatedSpaces = (vehicle.occupantEntries ?? []).reduce((total, entry) => total + (Math.max(0, Number(entry.count ?? 0)) * Math.max(0, Number(entry.spacesEach ?? 0))), 0)
  const cargoAllocatedSpaces = (vehicle.cargoEntries ?? []).reduce((total, entry) => total + Math.max(0, Number(entry.spaces ?? 0)), 0)
  const equipmentAllocatedSpaces = (vehicle.equipmentEntries ?? []).reduce((total, entry) => total + Math.max(0, Number(entry.spaces ?? 0)), 0)
  const weaponAllocatedSpaces = (vehicle.weapons ?? []).reduce((total, weapon) => total + Math.max(0, Number(weapon.spaces ?? 0)), 0)
  const allocatedSpaces = featureAllocatedSpaces + occupantAllocatedSpaces + cargoAllocatedSpaces + equipmentAllocatedSpaces + weaponAllocatedSpaces + armourSummary.armourSpaces
  const remainingSpaces = availableSpaces - allocatedSpaces

  return {
    family,
    power,
    auxiliary,
    baseline,
    operatingSkill: derivedOperatingSkillForVehicle(family, vehicle.features ?? []),
    powerPlantSpaces,
    availableSpaces,
    auxiliarySpaces,
    auxiliarySummary,
    armourSummary,
    featureAllocatedSpaces,
    occupantAllocatedSpaces,
    cargoAllocatedSpaces,
    equipmentAllocatedSpaces,
    weaponAllocatedSpaces,
    allocatedSpaces,
    remainingSpaces,
  }
}

export const normalizeCustomVehicleDesign = (vehicle: CustomVehicleDesign): CustomVehicleDesign => {
  const normalized = cloneVehicle(vehicle)
  normalized.baseFamily = normalized.baseFamily || inferBaseFamily(normalized)
  normalized.features = Array.isArray(normalized.features) ? normalized.features : []
  normalized.primaryPower = normalized.primaryPower || (normalized.baseFamily === 'structure'
    ? (normalized.techLevel >= 3 ? 'grid' : 'unpowered')
    : 'standard')
  normalized.fusionPlusFuelType = normalized.fusionPlusFuelType === 'deuterium-enriched-water' ? 'deuterium-enriched-water' : 'water'
  normalized.auxiliaryDrive = normalized.auxiliaryDrive || 'none'
  normalized.occupantEntries = normalizeOccupantEntries(normalized)
  normalized.cargoEntries = normalizeCargoEntries(normalized)
  normalized.equipmentEntries = Array.isArray(normalized.equipmentEntries)
    ? normalized.equipmentEntries.map((entry) => ({
        name: String(entry?.name ?? '').trim(),
        spaces: Math.max(0, Number(entry?.spaces ?? 0)),
        category: String(entry?.category ?? '').trim(),
        catalogueId: String(entry?.catalogueId ?? '').trim(),
      }))
    : (Array.isArray(normalized.equipment) ? normalized.equipment : []).map((name) => ({
        name: String(name ?? '').trim(),
        spaces: 0,
        category: '',
        catalogueId: '',
      }))
  normalized.equipment = normalized.equipmentEntries.map((entry) => entry.name).filter(Boolean)
  normalized.weapons = Array.isArray(normalized.weapons)
    ? normalized.weapons.map((weapon) => ({
        ...weapon,
        spaces: Math.max(0, Number(weapon?.spaces ?? 0)),
      }))
    : []
  normalized.speedModificationSteps = Number.isFinite(normalized.speedModificationSteps) ? normalized.speedModificationSteps : 0
  normalized.fuelEfficiencySteps = Number.isFinite(normalized.fuelEfficiencySteps) ? normalized.fuelEfficiencySteps : 0
  normalized.fuelCapacitySteps = Number.isFinite(normalized.fuelCapacitySteps) ? normalized.fuelCapacitySteps : 0
  normalized.hull = normalized.hull || 'Standard'
  normalized.techLevel = Math.max(0, Number(normalized.techLevel ?? 0))
  applyVehicleHandbookDerivations(normalized)
  return normalized
}

export const applyVehicleHandbookDerivations = (vehicle: CustomVehicleDesign) => {
  const family = familyRuleFor(vehicle.baseFamily || inferBaseFamily(vehicle))
  const size = vehicleSizeBandForSpaces(vehicle.spaces)
  const hullClass = (vehicle.hull in hullClassModifiers ? vehicle.hull : 'Standard') as keyof typeof hullClassModifiers
  const baseline = baselineForTechLevel(family.id, vehicle.techLevel)
  const power = primaryPowerRules[vehicle.primaryPower]
  const auxiliary = auxiliaryDriveRules[vehicle.auxiliaryDrive]
  if (power.allowedFamilies && !power.allowedFamilies.includes(family.id)) {
    vehicle.primaryPower = family.id === 'structure' ? (vehicle.techLevel >= 3 ? 'grid' : 'unpowered') : 'standard'
  }
  if (auxiliary.allowedFamilies && !auxiliary.allowedFamilies.includes(family.id)) {
    vehicle.auxiliaryDrive = 'none'
  }
  const effectivePower = primaryPowerRules[vehicle.primaryPower]
  const effectiveAuxiliary = auxiliaryDriveRules[vehicle.auxiliaryDrive]
  const qualifiedFeatures = vehicleQualifiedFeatureNamesForFamily(family.id)
  const selectedFeatures = [...new Set((vehicle.features ?? []).filter((feature) => qualifiedFeatures.includes(feature) && (size.armourAllowedFeatures.length === 0 || !['AFV', 'Locomotive', 'Tunneller'].includes(feature) || size.armourAllowedFeatures.includes(feature))))]
  const speedFeatureModifier = selectedFeatures.reduce((total, feature) => total + (featureSpeedModifiers[feature] ?? 0), 0)
  const agilityFeatureModifier = selectedFeatures.reduce((total, feature) => total + (featureAgilityModifiers[feature] ?? 0), 0)
  const speedSizeModifier = family.ignoreSizeSpeedModifier ? 0 : size.speedModifier
  const powerSpeed = effectivePower.speedOverride ?? shiftSpeedBand(baseline.speed, effectivePower.speedBandAdjustment ?? 0)
  const maxSpeed = shiftSpeedBand(powerSpeed, speedSizeModifier + speedFeatureModifier + vehicle.speedModificationSteps)
  const cruiseSpeed = maxSpeed === 'Idle' || maxSpeed === 'Stopped' ? maxSpeed : shiftSpeedBand(maxSpeed, -1)
  const baseRange = baseline.range * (family.rangeMultiplierForLargeCraft && vehicle.spaces >= 20 ? family.rangeMultiplierForLargeCraft : 1)
  const efficiencyRangeModifier = vehicle.fuelEfficiencySteps > 0
    ? vehicle.fuelEfficiencySteps * 0.5
    : vehicle.fuelEfficiencySteps * 0.25
  const rangeModifierPercent = efficiencyRangeModifier + (vehicle.fuelCapacitySteps * 0.25)
  const fusionPlusRangeMultiplier = effectivePower.supportsFusionPlusFuelType
    ? fusionPlusFuelRangeMultiplier(vehicle.fusionPlusFuelType)
    : 1
  const powerRangeMultiplier = effectivePower.id === 'unpowered'
    ? 0
    : (effectivePower.rangeMultiplier ?? 1) * fusionPlusRangeMultiplier
  const derivedRange = Math.max(0, roundHalfUp(baseRange * powerRangeMultiplier * (1 + rangeModifierPercent)))
  const cruiseRange = roundHalfUp(derivedRange * 1.5)
  const hullClassModifier = hullClassModifiers[hullClass]
  const baseHull = Math.max(1, roundHalfUp(vehicle.spaces * family.hullPerSpace))
  const derivedHull = hullClassAdjustedHull(baseHull, hullClass)
  const derivedStructure = Math.max(1, Math.ceil(derivedHull / 10))
  const installedPowerSpaces = installedPowerPlantSpaces(vehicle, effectivePower)
  const costModifier = hullClassModifier.cost
    + effectivePower.costMultiplier
    + (vehicle.speedModificationSteps > 0 ? vehicle.speedModificationSteps * 1 : vehicle.speedModificationSteps * 0.1)
    + (vehicle.fuelEfficiencySteps > 0 ? vehicle.fuelEfficiencySteps * 0.25 : vehicle.fuelEfficiencySteps * 0.1)
  let derivedCostPerSpace = Math.max(family.baseCostPerSpace / 10, family.baseCostPerSpace * (1 + costModifier))
  if (effectivePower.flatCostPerVehicleSpace) derivedCostPerSpace += effectivePower.flatCostPerVehicleSpace
  let derivedCost = roundHalfUp(derivedCostPerSpace * vehicle.spaces)
  if (effectivePower.costPerInstalledSpace && installedPowerSpaces > 0) {
    derivedCost += roundHalfUp(installedPowerSpaces * effectivePower.costPerInstalledSpace)
  }

  if (effectiveAuxiliary.id !== 'none') {
    derivedCost += roundHalfUp(effectiveAuxiliary.flatCostPerVehicleSpace * vehicle.spaces)
  }

  const derivedTraits = [...new Set([...family.defaultTraits ?? [], ...size.traits, ...selectedFeatures, ...effectiveAuxiliary.grantedTraits ?? []])]
  const derivedOperatingSkill = derivedOperatingSkillForVehicle(family, selectedFeatures)
  const armourRule = armourRuleForTechLevel(vehicle.techLevel)
  const baseProtection = armourRule.baseProtection
  for (const facing of Object.keys(vehicle.armour) as Array<keyof TravellerVehicleArmour>) {
    if (!String(vehicle.armour[facing] ?? '').trim()) {
      vehicle.armour[facing] = String(baseProtection)
    }
  }

  vehicle.category = derivedVehicleCategoryForVehicle(family, selectedFeatures)
  vehicle.type = derivedVehicleTypeNameForVehicle(family, vehicle.spaces, selectedFeatures)
  vehicle.hitDm = size.hitDm
  vehicle.techLevel = Math.max(vehicle.techLevel, family.minimumTechLevel)
  if (!vehicle.skill.trim() || vehicle.skill === family.defaultSkill || vehicle.skill === 'Drive (wheel)' || vehicle.skill === 'Drive (track)' || vehicle.skill === 'Drive (mole)') {
    vehicle.skill = derivedOperatingSkill
  }
  vehicle.agility = formatSignedNumber(family.baseAgility + size.agilityModifier + agilityFeatureModifier)
  vehicle.speed = maxSpeed
  vehicle.cruiseSpeed = cruiseSpeed
  const rangeUnit = baseline.rangeUnit ?? 'km'
  vehicle.range = rangeUnit === 'years' ? `${derivedRange} years` : `${derivedRange.toLocaleString()}km`
  vehicle.cruiseRange = rangeUnit === 'years' ? `${cruiseRange} years` : `${cruiseRange.toLocaleString()}km`
  vehicle.shipping = formatTons(vehicle.spaces * family.shippingRatio)
  vehicle.structure = String(derivedStructure)
  vehicle.costCredits = derivedCost
  vehicle.cost = formatCost(derivedCost)
  vehicle.traits = derivedTraits
  vehicle.features = selectedFeatures
  vehicle.crew = formatCountSummary(vehicle.occupantEntries ?? [], 'crew')
  vehicle.passengers = formatCountSummary(vehicle.occupantEntries ?? [], 'passenger')
  vehicle.comfortLevel = formatComfortSummary(vehicle.occupantEntries ?? [])
  vehicle.cargo = formatCargoSummary(vehicle.cargoEntries ?? [])
  vehicle.equipment = (vehicle.equipmentEntries ?? []).map((entry) => entry.name).filter(Boolean)
}

export const vehicleBuilderOptionSets = () => {
  const vehicles = vehicleHandbookVariants()
  const equipmentByCategory = new Map<string, VehicleBuilderEquipmentCategoryGroup>()

  for (const item of allEquipmentSeedRecords()) {
    const sourceCategory = String(item.category || 'misc').trim() || 'misc'
    const optionGroup = handbookOptionGroupForEquipmentCategory(sourceCategory)
    const existing = equipmentByCategory.get(optionGroup.id) ?? {
      id: optionGroup.id,
      label: optionGroup.label,
      description: optionGroup.description,
      chapterId: optionGroup.chapterId,
      chapterLabel: optionGroup.chapterLabel,
      chapterDescription: optionGroup.chapterDescription,
      chapterOrder: optionGroup.chapterOrder,
      items: [],
    }
    existing.items.push({
      id: item.id,
      name: item.name,
      label: equipmentLabel(item),
      category: optionGroup.id,
      categoryLabel: optionGroup.label,
      techLevel: item.techLevel,
      sourceName: item.sourceName,
      sourcePage: item.sourcePage,
      effect: item.effect,
      traits: [...(item.traits ?? [])],
    })
    equipmentByCategory.set(optionGroup.id, existing)
  }

  const equipmentLibrary = [...equipmentByCategory.values()]
    .map((group) => ({
      ...group,
      items: group.items.sort((left, right) => left.label.localeCompare(right.label, undefined, { sensitivity: 'base' })),
    }))
    .sort((left, right) => (
      left.chapterOrder - right.chapterOrder
      || left.label.localeCompare(right.label, undefined, { sensitivity: 'base' })
    ))

  return {
    baseFamilies: vehicleBuilderFamilyOptions(),
    hulls: ['Light', 'Standard', 'Reinforced'],
    skills: uniqueSorted(vehicles.map((vehicle) => vehicle.skill)),
    agilityRatings: uniqueSorted(vehicles.map((vehicle) => vehicle.agility)),
    speeds: uniqueSorted(vehicles.map((vehicle) => vehicle.speed)),
    cruiseSpeeds: uniqueSorted(vehicles.map((vehicle) => vehicle.cruiseSpeed)),
    comfortLevels: uniqueSorted(vehicles.map((vehicle) => vehicle.comfortLevel)),
    featureLibrary: uniqueSorted(Object.values(handbookFamilyRules).flatMap((rule) => rule.allowedFeatures)),
    equipmentLibrary,
    stockWeaponLibrary: stockVehicleWeaponLibrary(),
  }
}

export const validateCustomVehicle = (vehicle: CustomVehicleDesign): string[] => {
  const issues: string[] = []
  const family = familyRuleFor(vehicle.baseFamily)
  const power = primaryPowerRules[vehicle.primaryPower]
  const auxiliary = auxiliaryDriveRules[vehicle.auxiliaryDrive]
  const armourSummary = armourSummaryForVehicle(vehicle)

  if (!vehicle.name.trim()) issues.push('Vehicle name is required.')
  if (!vehicle.baseFamily) issues.push('Base vehicle type is required.')
  if (!vehicle.hull.trim()) issues.push('Structural reinforcement is required.')
  if (!vehicle.skill.trim()) issues.push('Operating skill is required.')
  if (!(vehicle.occupantEntries ?? []).some((entry) => entry.category === 'crew' && Number(entry.count) > 0)) issues.push('At least one crew station is required.')
  if (vehicle.spaces <= 0) issues.push('Spaces must be greater than zero.')
  if (vehicle.spaces === 1 && vehicle.hull !== 'Standard') issues.push('One-Space vehicles cannot use Light or Reinforced hull modification.')
  if (vehicle.techLevel < family.minimumTechLevel) issues.push(`Tech level cannot be below ${family.minimumTechLevel} for ${family.label}.`)
  if (vehicle.costCredits !== null && vehicle.costCredits < 0) issues.push('Credit cost cannot be negative.')
  if (vehicle.speedModificationSteps > 3 || vehicle.speedModificationSteps < -3) issues.push('Speed modifications are limited to three steps in either direction.')
  if (vehicle.fuelEfficiencySteps > 3 || vehicle.fuelEfficiencySteps < -3) issues.push('Fuel efficiency modifications are limited to three steps in either direction.')
  if (vehicle.fuelCapacitySteps < -2) issues.push('Fuel capacity cannot be decreased more than two steps.')
  if (vehicle.fuelCapacitySteps !== 0 && vehicle.techLevel < 3) issues.push('Fuel capacity changes require TL 3+.')
  if (power.allowedFamilies && !power.allowedFamilies.includes(family.id)) issues.push(`${power.label} is not allowed for ${family.label}.`)
  if (vehicle.primaryPower !== 'standard' && vehicle.techLevel < power.minimumTechLevel) issues.push(`${power.label} requires TL ${power.minimumTechLevel}+.`)
  if (power.supportsFusionPlusFuelType && vehicle.fusionPlusFuelType === 'deuterium-enriched-water' && vehicle.techLevel < 10) issues.push('Deuterium-enriched Fusion+ fuel requires TL 10+ support infrastructure.')
  if (auxiliary.allowedFamilies && !auxiliary.allowedFamilies.includes(family.id)) issues.push(`${auxiliary.label} is not allowed for ${family.label}.`)
  if (vehicle.auxiliaryDrive !== 'none' && vehicle.techLevel < auxiliary.minimumTechLevel) issues.push(`${auxiliary.label} requires TL ${auxiliary.minimumTechLevel}+.`)
  const qualifiedFeatures = vehicleQualifiedFeatureNamesForFamily(family.id)
  if (vehicle.features.some((feature) => !qualifiedFeatures.includes(feature))) issues.push('Selected features must be allowed for the base vehicle type.')
  if (Math.abs(vehicle.speedModificationSteps) > 1 && vehicle.techLevel < 5) issues.push('Two-step speed modifications require TL 5+.')
  if (Math.abs(vehicle.speedModificationSteps) > 2 && vehicle.techLevel < 6) issues.push('Three-step speed modifications require TL 6+.')
  if (Math.abs(vehicle.fuelEfficiencySteps) > 1 && vehicle.techLevel < 4) issues.push('Two-step fuel efficiency changes require TL 4+.')
  if (Math.abs(vehicle.fuelEfficiencySteps) > 2 && vehicle.techLevel < 5) issues.push('Three-step fuel efficiency changes require TL 5+.')

  for (const [facing, value] of Object.entries(vehicle.armour)) {
    if (!String(value ?? '').trim()) issues.push(`Armour for ${facing} is required.`)
    if (!Number.isFinite(Number(value))) issues.push(`Armour for ${facing} must be numeric.`)
    const minimumFacingProtection = isOpenToppedArmourException(vehicle, facing as keyof TravellerVehicleArmour)
      ? 0
      : armourSummary.baseProtection
    if (Number(value) < minimumFacingProtection) issues.push(`${facing} armour cannot be below ${minimumFacingProtection}.`)
    if (Number(value) > armourSummary.maximumProtection) issues.push(`${facing} armour cannot exceed ${armourSummary.maximumProtection}.`)
  }

  vehicle.weapons.forEach((weapon, index) => {
    const prefix = `Weapon ${index + 1}`
    if (!weapon.name.trim()) issues.push(`${prefix} name is required.`)
    if (!weapon.damage.trim()) issues.push(`${prefix} damage is required.`)
    if (Number(weapon.spaces ?? 0) < 0) issues.push(`${prefix} spaces cannot be negative.`)
  })

  ;(vehicle.equipmentEntries ?? []).forEach((entry, index) => {
    const prefix = `Option ${index + 1}`
    if (!entry.name.trim()) issues.push(`${prefix} name is required.`)
    if (Number(entry.spaces ?? 0) < 0) issues.push(`${prefix} spaces cannot be negative.`)
  })

  ;(vehicle.occupantEntries ?? []).forEach((entry, index) => {
    const prefix = `Occupant row ${index + 1}`
    if (!entry.role.trim()) issues.push(`${prefix} role is required.`)
    if (Number(entry.count ?? 0) <= 0) issues.push(`${prefix} count must be greater than zero.`)
    if (Number(entry.spacesEach ?? 0) < 0) issues.push(`${prefix} spaces cannot be negative.`)
  })

  ;(vehicle.cargoEntries ?? []).forEach((entry, index) => {
    const prefix = `Cargo row ${index + 1}`
    if (!entry.name.trim()) issues.push(`${prefix} name is required.`)
    if (Number(entry.spaces ?? 0) < 0) issues.push(`${prefix} spaces cannot be negative.`)
    if (Number(entry.tons ?? 0) < 0) issues.push(`${prefix} tons cannot be negative.`)
  })

  const summary = vehicleConstructionSummary(vehicle)
  if (summary.allocatedSpaces > summary.availableSpaces) {
    issues.push(`Allocated systems spaces (${summary.allocatedSpaces}) exceed available spaces (${summary.availableSpaces}).`)
  }

  return issues
}
