import coreVehiclesData from '~/data/traveller2e/vehicles/core-vehicles.json'
import fieldCatalogueVehiclesData from '~/data/traveller2e/vehicles/field-catalogue-vehicles.json'
import vehicleHandbookData from '~/data/traveller2e/vehicles/vehicle-handbook-vehicles.json'
import type {
  CustomVehicleDesign,
  TravellerVehicleArmour,
  TravellerVehicleAuxiliaryDrive,
  TravellerVehicleBaseFamily,
  TravellerVehicleCategory,
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
  category: TravellerVehicleCategory
  typeLabel: string
  minimumTechLevel: number
  defaultSkill: string
  baseAgility: number
  hullPerSpace: number
  shippingRatio: number
  baseCostPerSpace: number
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
  availableSpacePercent: number
  minimumSpaceGain?: number
  consumedSpacePercent?: number
  minimumConsumedSpaces?: number
  costMultiplier: number
  flatCostPerSpace?: number
  speedOverride?: SpeedBand
  speedBandAdjustment?: number
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
  traits: string[]
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
    spaces: 0,
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
    auxiliaryDrive: 'none',
    armour: createBlankVehicleArmour(),
    equipment: [],
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
    category: 'aircraft',
    typeLabel: 'Aeroplane',
    minimumTechLevel: 4,
    defaultSkill: 'Flyer (wing)',
    baseAgility: 1,
    hullPerSpace: 0.5,
    shippingRatio: 1,
    baseCostPerSpace: 15000,
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
    category: 'aircraft',
    typeLabel: 'Airship',
    minimumTechLevel: 3,
    defaultSkill: 'Flyer (airship)',
    baseAgility: -3,
    hullPerSpace: 0.2,
    shippingRatio: 0.1,
    baseCostPerSpace: 300,
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
    category: 'grav',
    typeLabel: 'Grav Vehicle',
    minimumTechLevel: 8,
    defaultSkill: 'Flyer (grav)',
    baseAgility: 1,
    hullPerSpace: 2,
    shippingRatio: 0.5,
    baseCostPerSpace: 30000,
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
    category: 'ground',
    typeLabel: 'Ground Vehicle',
    minimumTechLevel: 1,
    defaultSkill: 'Drive (varies)',
    baseAgility: 0,
    hullPerSpace: 2,
    shippingRatio: 0.5,
    baseCostPerSpace: 750,
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
    category: 'hovercraft',
    typeLabel: 'Hovercraft',
    minimumTechLevel: 5,
    defaultSkill: 'Drive (hovercraft)',
    baseAgility: 1,
    hullPerSpace: 0.5,
    shippingRatio: 0.5,
    baseCostPerSpace: 10000,
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
    category: 'aircraft',
    typeLabel: 'Rotorcraft',
    minimumTechLevel: 5,
    defaultSkill: 'Flyer (rotor)',
    baseAgility: 0,
    hullPerSpace: 0.5,
    shippingRatio: 1,
    baseCostPerSpace: 25000,
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
    category: 'other',
    typeLabel: 'Structure',
    minimumTechLevel: 0,
    defaultSkill: 'n/a',
    baseAgility: -6,
    hullPerSpace: 1,
    shippingRatio: 0.5,
    baseCostPerSpace: 50,
    allowedFeatures: ['AFV', 'Open Frame', 'Open-Topped', 'Streamlined'],
    speedBaselines: [
      { minTl: 0, speed: 'Stopped', range: 0 },
    ],
  },
  submersible: {
    id: 'submersible',
    label: 'Submersible',
    category: 'watercraft',
    typeLabel: 'Submersible',
    minimumTechLevel: 4,
    defaultSkill: 'Seafarer (submarine)',
    baseAgility: -2,
    hullPerSpace: 3,
    shippingRatio: 0.5,
    baseCostPerSpace: 50000,
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
    category: 'walker',
    typeLabel: 'Walker',
    minimumTechLevel: 8,
    defaultSkill: 'Drive (walker)',
    baseAgility: 0,
    hullPerSpace: 2,
    shippingRatio: 0.5,
    baseCostPerSpace: 10000,
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
    category: 'watercraft',
    typeLabel: 'Watercraft',
    minimumTechLevel: 0,
    defaultSkill: 'Seafarer (varies)',
    baseAgility: -2,
    hullPerSpace: 2,
    shippingRatio: 0.5,
    baseCostPerSpace: 2000,
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
  { label: 'Small', hitDm: '+0', speedModifier: 0, agilityModifier: 0, traits: [] },
  { label: 'Light', hitDm: '+1', speedModifier: 0, agilityModifier: 0, traits: [] },
  { label: 'Heavy', hitDm: '+2', speedModifier: -1, agilityModifier: -1, traits: [] },
  { label: 'Huge', hitDm: '+4', speedModifier: -1, agilityModifier: -2, traits: ['Unresponsive'] },
  { label: 'Massive', hitDm: '+6', speedModifier: -1, agilityModifier: -4, traits: ['Unresponsive'] },
]

const featureAgilityModifiers: Record<string, number> = {
  Agile: 1,
}

const featureSpeedModifiers: Record<string, number> = {
  Fast: 1,
  Slow: -1,
}

const hullClassModifiers = {
  Light: { hull: -0.25, cost: -0.25 },
  Standard: { hull: 0, cost: 0 },
  Reinforced: { hull: 0.1, cost: 0.5 },
} as const

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
    availableSpacePercent: 0,
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
    minimumSpaceGain: 1,
    flatCostPerSpace: 10000,
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

export const vehicleBuilderFamilyOptions = () => Object.values(handbookFamilyRules).map((rule) => ({
  id: rule.id,
  label: rule.label,
  category: rule.category,
}))

export const vehicleFamilyRule = (family: TravellerVehicleBaseFamily) => familyRuleFor(family)
export const vehiclePrimaryPowerOptions = () => Object.values(primaryPowerRules)
export const vehicleAuxiliaryDriveOptions = () => Object.values(auxiliaryDriveRules)

export const vehicleDerivedTypeName = (family: TravellerVehicleBaseFamily, spaces: number) => {
  const sizeLabel = vehicleSizeBandForSpaces(spaces).label
  return `${sizeLabel} ${familyRuleFor(family).typeLabel}`
}

export const vehicleConstructionSummary = (vehicle: CustomVehicleDesign) => {
  const family = familyRuleFor(vehicle.baseFamily || inferBaseFamily(vehicle))
  const power = primaryPowerRules[vehicle.primaryPower]
  const auxiliary = auxiliaryDriveRules[vehicle.auxiliaryDrive]
  const baseline = baselineForTechLevel(family.id, Math.max(vehicle.techLevel, family.minimumTechLevel))
  const effectiveBaseSpaces = vehicle.spaces
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

  return {
    family,
    power,
    auxiliary,
    baseline,
    availableSpaces,
    auxiliarySpaces,
    auxiliarySummary,
  }
}

export const normalizeCustomVehicleDesign = (vehicle: CustomVehicleDesign): CustomVehicleDesign => {
  const normalized = cloneVehicle(vehicle)
  normalized.baseFamily = normalized.baseFamily || inferBaseFamily(normalized)
  normalized.features = Array.isArray(normalized.features) ? normalized.features : []
  normalized.primaryPower = normalized.primaryPower || (normalized.baseFamily === 'structure'
    ? (normalized.techLevel >= 3 ? 'grid' : 'unpowered')
    : 'standard')
  normalized.auxiliaryDrive = normalized.auxiliaryDrive || 'none'
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
  const selectedFeatures = [...new Set((vehicle.features ?? []).filter((feature) => family.allowedFeatures.includes(feature)))]
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
  const powerRangeMultiplier = effectivePower.id === 'unpowered' ? 0 : 1
  const derivedRange = Math.max(0, roundHalfUp(baseRange * powerRangeMultiplier * (1 + rangeModifierPercent)))
  const cruiseRange = roundHalfUp(derivedRange * 1.5)
  const hullClassModifier = hullClassModifiers[hullClass]
  const baseHull = Math.max(1, roundHalfUp(vehicle.spaces * family.hullPerSpace))
  const derivedHull = Math.max(1, roundHalfUp(baseHull * (1 + hullClassModifier.hull)))
  const derivedStructure = Math.max(1, Math.ceil(derivedHull / 10))
  const costModifier = hullClassModifier.cost
    + effectivePower.costMultiplier
    + (vehicle.speedModificationSteps > 0 ? vehicle.speedModificationSteps * 1 : vehicle.speedModificationSteps * 0.1)
    + (vehicle.fuelEfficiencySteps > 0 ? vehicle.fuelEfficiencySteps * 0.25 : vehicle.fuelEfficiencySteps * 0.1)
  let derivedCostPerSpace = Math.max(family.baseCostPerSpace / 10, family.baseCostPerSpace * (1 + costModifier))
  if (effectivePower.flatCostPerSpace) derivedCostPerSpace += effectivePower.flatCostPerSpace
  let derivedCost = roundHalfUp(derivedCostPerSpace * vehicle.spaces)

  if (effectiveAuxiliary.id !== 'none') {
    const auxEquivalentFamily = effectiveAuxiliary.baseEquivalentFamily ? familyRuleFor(effectiveAuxiliary.baseEquivalentFamily) : family
    const auxBaseline = baselineForTechLevel(auxEquivalentFamily.id, vehicle.techLevel)
    const auxSpaces = Math.max(effectiveAuxiliary.minimumSpaces, Math.ceil(vehicle.spaces * effectiveAuxiliary.spacePercent))
    derivedCost += roundHalfUp(effectiveAuxiliary.flatCostPerVehicleSpace * vehicle.spaces)
  }

  const derivedTraits = [...new Set([...family.defaultTraits ?? [], ...size.traits, ...selectedFeatures, ...effectiveAuxiliary.grantedTraits ?? []])]

  vehicle.category = family.category
  vehicle.type = vehicleDerivedTypeName(family.id, vehicle.spaces)
  vehicle.hitDm = size.hitDm
  vehicle.techLevel = Math.max(vehicle.techLevel, family.minimumTechLevel)
  if (!vehicle.skill.trim()) vehicle.skill = family.defaultSkill
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
}

export const vehicleBuilderOptionSets = () => {
  const vehicles = vehicleHandbookVariants()

  return {
    baseFamilies: vehicleBuilderFamilyOptions(),
    hulls: ['Light', 'Standard', 'Reinforced'],
    skills: uniqueSorted(vehicles.map((vehicle) => vehicle.skill)),
    agilityRatings: uniqueSorted(vehicles.map((vehicle) => vehicle.agility)),
    speeds: uniqueSorted(vehicles.map((vehicle) => vehicle.speed)),
    cruiseSpeeds: uniqueSorted(vehicles.map((vehicle) => vehicle.cruiseSpeed)),
    comfortLevels: uniqueSorted(vehicles.map((vehicle) => vehicle.comfortLevel)),
    featureLibrary: uniqueSorted(Object.values(handbookFamilyRules).flatMap((rule) => rule.allowedFeatures)),
    equipmentLibrary: uniqueSorted(vehicles.flatMap((vehicle) => vehicle.equipment)),
  }
}

export const validateCustomVehicle = (vehicle: CustomVehicleDesign): string[] => {
  const issues: string[] = []
  const family = familyRuleFor(vehicle.baseFamily)
  const power = primaryPowerRules[vehicle.primaryPower]
  const auxiliary = auxiliaryDriveRules[vehicle.auxiliaryDrive]

  if (!vehicle.name.trim()) issues.push('Vehicle name is required.')
  if (!vehicle.baseFamily) issues.push('Base vehicle type is required.')
  if (!vehicle.hull.trim()) issues.push('Structural reinforcement is required.')
  if (!vehicle.skill.trim()) issues.push('Operating skill is required.')
  if (!vehicle.comfortLevel.trim()) issues.push('Comfort level is required.')
  if (!vehicle.crew.trim()) issues.push('Crew value is required.')
  if (!vehicle.passengers.trim()) issues.push('Passenger value is required.')
  if (vehicle.spaces <= 0) issues.push('Spaces must be greater than zero.')
  if (vehicle.techLevel < family.minimumTechLevel) issues.push(`Tech level cannot be below ${family.minimumTechLevel} for ${family.label}.`)
  if (vehicle.costCredits !== null && vehicle.costCredits < 0) issues.push('Credit cost cannot be negative.')
  if (vehicle.speedModificationSteps > 3 || vehicle.speedModificationSteps < -3) issues.push('Speed modifications are limited to three steps in either direction.')
  if (vehicle.fuelEfficiencySteps > 3 || vehicle.fuelEfficiencySteps < -3) issues.push('Fuel efficiency modifications are limited to three steps in either direction.')
  if (vehicle.fuelCapacitySteps < -2) issues.push('Fuel capacity cannot be decreased more than two steps.')
  if (vehicle.fuelCapacitySteps !== 0 && vehicle.techLevel < 3) issues.push('Fuel capacity changes require TL 3+.')
  if (power.allowedFamilies && !power.allowedFamilies.includes(family.id)) issues.push(`${power.label} is not allowed for ${family.label}.`)
  if (vehicle.primaryPower !== 'standard' && vehicle.techLevel < power.minimumTechLevel) issues.push(`${power.label} requires TL ${power.minimumTechLevel}+.`)
  if (auxiliary.allowedFamilies && !auxiliary.allowedFamilies.includes(family.id)) issues.push(`${auxiliary.label} is not allowed for ${family.label}.`)
  if (vehicle.auxiliaryDrive !== 'none' && vehicle.techLevel < auxiliary.minimumTechLevel) issues.push(`${auxiliary.label} requires TL ${auxiliary.minimumTechLevel}+.`)
  if (vehicle.features.some((feature) => !family.allowedFeatures.includes(feature))) issues.push('Selected features must be allowed for the base vehicle type.')
  if (Math.abs(vehicle.speedModificationSteps) > 1 && vehicle.techLevel < 5) issues.push('Two-step speed modifications require TL 5+.')
  if (Math.abs(vehicle.speedModificationSteps) > 2 && vehicle.techLevel < 6) issues.push('Three-step speed modifications require TL 6+.')
  if (Math.abs(vehicle.fuelEfficiencySteps) > 1 && vehicle.techLevel < 4) issues.push('Two-step fuel efficiency changes require TL 4+.')
  if (Math.abs(vehicle.fuelEfficiencySteps) > 2 && vehicle.techLevel < 5) issues.push('Three-step fuel efficiency changes require TL 5+.')

  for (const [facing, value] of Object.entries(vehicle.armour)) {
    if (!String(value ?? '').trim()) issues.push(`Armour for ${facing} is required.`)
  }

  vehicle.weapons.forEach((weapon, index) => {
    const prefix = `Weapon ${index + 1}`
    if (!weapon.name.trim()) issues.push(`${prefix} name is required.`)
    if (!weapon.damage.trim()) issues.push(`${prefix} damage is required.`)
  })

  return issues
}
