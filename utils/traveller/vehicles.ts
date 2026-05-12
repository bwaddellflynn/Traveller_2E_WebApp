import coreVehiclesData from '~/data/traveller2e/vehicles/core-vehicles.json'
import fieldCatalogueVehiclesData from '~/data/traveller2e/vehicles/field-catalogue-vehicles.json'
import vehicleHandbookData from '~/data/traveller2e/vehicles/vehicle-handbook-vehicles.json'
import coreEquipmentData from '~/data/traveller2e/armory/core-equipment.json'
import fieldCatalogueEquipmentData from '~/data/traveller2e/armory/field-catalogue-equipment.json'
import centralSupplyEquipmentData from '~/data/traveller2e/armory/central-supply-catalogue-equipment.json'
import type {
  CustomVehicleDesign,
  CustomVehicleEquipmentEntry,
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
  items: VehicleBuilderEquipmentLibraryItem[]
}

export type VehicleBuilderStockWeaponOption = {
  id: string
  label: string
  sourceVehicle: string
  sourcePage?: number
  weapon: TravellerVehicleWeapon
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
    techLevel: 10,
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
  { label: 'Small', hitDm: '+0', speedModifier: 0, agilityModifier: 0, armourVolumeMultiplier: 4, armourAllowedFeatures: ['Open Frame'], traits: [] },
  { label: 'Light', hitDm: '+1', speedModifier: 0, agilityModifier: 0, armourVolumeMultiplier: 2, armourAllowedFeatures: [], traits: [] },
  { label: 'Heavy', hitDm: '+2', speedModifier: -1, agilityModifier: -1, armourVolumeMultiplier: 1, armourAllowedFeatures: ['AFV', 'Locomotive', 'Tunneller'], traits: [] },
  { label: 'Huge', hitDm: '+4', speedModifier: -1, agilityModifier: -2, armourVolumeMultiplier: 0.5, armourAllowedFeatures: ['AFV', 'Locomotive', 'Tunneller'], traits: ['Unresponsive'] },
  { label: 'Massive', hitDm: '+6', speedModifier: -1, agilityModifier: -4, armourVolumeMultiplier: 0.5, armourAllowedFeatures: ['AFV', 'Locomotive', 'Tunneller'], traits: ['Unresponsive'] },
]

const vehicleSizeReferenceLibrary: Record<TravellerVehicleBaseFamily, VehicleSizeReferenceRow[]> = {
  'ground-vehicle': [
    { key: 'ground-bike', minSpaces: 1, maxSpaces: 5, form: 'light wheeled', example: 'bicycle, rickshaw, motorcycle, ATV' },
    { key: 'ground-car', minSpaces: 6, maxSpaces: 10, form: 'car-scale', example: 'microcar, sedan, jeep, utility 4x4' },
    { key: 'ground-van', minSpaces: 11, maxSpaces: 20, form: 'light carrier', example: 'van, light truck, APC, large SUV' },
    { key: 'ground-carriage', minSpaces: 21, maxSpaces: 40, form: 'carrier-scale', example: 'IFV, cargo truck, bus, mobile workshop' },
    { key: 'ground-heavy', minSpaces: 41, maxSpaces: 80, form: 'heavy armour', example: 'main battle tank, self-propelled gun, recovery vehicle' },
    { key: 'ground-superheavy', minSpaces: 81, maxSpaces: 160, form: 'super-heavy armour', example: 'super-heavy tank, missile carrier, mobile artillery battery' },
    { key: 'ground-platform', minSpaces: 161, maxSpaces: null, form: 'mobile platform', example: 'mobile command base, crawler fortress, land carrier' },
  ],
  hovercraft: [
    { key: 'hover-bike', minSpaces: 1, maxSpaces: 5, form: 'personal skimmer', example: 'personal skimmer, scout hover bike, rescue sled' },
    { key: 'hover-car', minSpaces: 6, maxSpaces: 10, form: 'hovercar-scale', example: 'civilian hovercar, patrol skimmer, cargo sled' },
    { key: 'hover-van', minSpaces: 11, maxSpaces: 20, form: 'cargo skimmer', example: 'passenger hover van, light cargo skirtcraft' },
    { key: 'hover-landing', minSpaces: 21, maxSpaces: 40, form: 'landing craft', example: 'troop hovercraft, assault landing craft' },
    { key: 'hover-heavy', minSpaces: 41, maxSpaces: 80, form: 'industrial lifter', example: 'large cargo hovercraft, hover APC, industrial lifter' },
    { key: 'hover-platform', minSpaces: 81, maxSpaces: 160, form: 'bulk hover barge', example: 'heavy landing platform, bulk hover barge, mobile SAM raft' },
    { key: 'hover-fortress', minSpaces: 161, maxSpaces: null, form: 'hover platform', example: 'hover base, massive amphibious carrier, floating assault dock' },
  ],
  'grav-vehicle': [
    { key: 'grav-bike', minSpaces: 1, maxSpaces: 5, form: 'grav bike', example: 'grav bike, courier sled, recon skimmer' },
    { key: 'grav-runabout', minSpaces: 6, maxSpaces: 10, form: 'air/raft-scale', example: 'air/raft, grav jeep, light grav car' },
    { key: 'grav-transport', minSpaces: 11, maxSpaces: 20, form: 'utility transport', example: 'grav van, executive air/raft, light utility transport' },
    { key: 'grav-carrier', minSpaces: 21, maxSpaces: 40, form: 'troop carrier', example: 'grav APC, grav IFV, patrol transport' },
    { key: 'grav-heavy', minSpaces: 41, maxSpaces: 80, form: 'assault carrier', example: 'grav tank, heavy grav transport, assault carrier' },
    { key: 'grav-platform', minSpaces: 81, maxSpaces: 160, form: 'lift platform', example: 'super-heavy grav tank, bulk grav hauler, mobile lift platform' },
    { key: 'grav-fortress', minSpaces: 161, maxSpaces: null, form: 'grav fortress', example: 'grav carrier, flying base, city-lifter platform' },
  ],
  aeroplane: [
    { key: 'plane-ultralight', minSpaces: 1, maxSpaces: 5, form: 'light aircraft', example: 'ultralight, scout plane, trainer jet' },
    { key: 'plane-utility', minSpaces: 6, maxSpaces: 10, form: 'utility aircraft', example: 'bush plane, utility plane, light strike jet' },
    { key: 'plane-shuttle', minSpaces: 11, maxSpaces: 20, form: 'light shuttle', example: 'regional shuttle, gunship, patrol aircraft' },
    { key: 'plane-transport', minSpaces: 21, maxSpaces: 40, form: 'transport aircraft', example: 'small transport aircraft, bomber, maritime patrol plane' },
    { key: 'plane-heavy', minSpaces: 41, maxSpaces: 80, form: 'heavy transport', example: 'cargo aircraft, strategic bomber, tanker' },
    { key: 'plane-strategic', minSpaces: 81, maxSpaces: 160, form: 'strategic lifter', example: 'large transport plane, flying command post, airborne carrier' },
    { key: 'plane-supercarrier', minSpaces: 161, maxSpaces: null, form: 'supercarrier-scale', example: 'flying aircraft carrier, heli-carrier, airborne fortress' },
  ],
  rotorcraft: [
    { key: 'rotor-scout', minSpaces: 1, maxSpaces: 5, form: 'rotor scout', example: 'gyrocopter, scout rotorcraft, medevac scout' },
    { key: 'rotor-utility', minSpaces: 6, maxSpaces: 10, form: 'utility helicopter', example: 'light helicopter, utility helicopter, scout gunship' },
    { key: 'rotor-troop', minSpaces: 11, maxSpaces: 20, form: 'troop rotorcraft', example: 'troop helicopter, naval utility rotorcraft' },
    { key: 'rotor-heavy', minSpaces: 21, maxSpaces: 40, form: 'heavy gunship', example: 'heavy transport helicopter, attack gunship' },
    { key: 'rotor-superheavy', minSpaces: 41, maxSpaces: 80, form: 'super-heavy transport', example: 'super-heavy rotor transport, airborne assault crane' },
    { key: 'rotor-crane', minSpaces: 81, maxSpaces: 160, form: 'flying crane', example: 'flying crane, industrial lift platform, rotor carrier' },
    { key: 'rotor-helicarrier', minSpaces: 161, maxSpaces: null, form: 'heli-carrier', example: 'flying deck carrier, rotor fortress, airborne shipyard' },
  ],
  airship: [
    { key: 'airship-micro', minSpaces: 1, maxSpaces: 5, form: 'micro blimp', example: 'personal observation balloon, micro blimp, survey blimp' },
    { key: 'airship-light', minSpaces: 6, maxSpaces: 10, form: 'light airship', example: 'light civilian airship, watch platform, command blimp' },
    { key: 'airship-patrol', minSpaces: 11, maxSpaces: 20, form: 'patrol airship', example: 'cargo blimp, patrol airship, passenger airship' },
    { key: 'airship-cargo', minSpaces: 21, maxSpaces: 40, form: 'cargo airship', example: 'large cargo airship, military sky transport' },
    { key: 'airship-freighter', minSpaces: 41, maxSpaces: 80, form: 'sky-freighter', example: 'sky-freighter, airborne habitat block, flying carrier' },
    { key: 'airship-platform', minSpaces: 81, maxSpaces: 160, form: 'sky platform', example: 'airborne refinery, mobile dock, floating city block' },
    { key: 'airship-fortress', minSpaces: 161, maxSpaces: null, form: 'sky fortress', example: 'airship carrier, floating fortress, aerial dreadnought' },
  ],
  watercraft: [
    { key: 'water-personal', minSpaces: 1, maxSpaces: 5, form: 'personal craft', example: 'jet ski, skiff, dinghy, runabout' },
    { key: 'water-motorboat', minSpaces: 6, maxSpaces: 10, form: 'motorboat-scale', example: 'motorboat, cabin cruiser, light patrol boat' },
    { key: 'water-yacht', minSpaces: 11, maxSpaces: 20, form: 'yacht-scale', example: 'yacht, coastal patrol craft, missile boat' },
    { key: 'water-cutter', minSpaces: 21, maxSpaces: 40, form: 'cutter-scale', example: 'ferry, cutter, trawler, corvette' },
    { key: 'water-freighter', minSpaces: 41, maxSpaces: 80, form: 'warship-scale', example: 'frigate, destroyer, coastal freighter' },
    { key: 'water-capital', minSpaces: 81, maxSpaces: 160, form: 'capital ship', example: 'battleship, carrier, cruiser, amphibious assault ship' },
    { key: 'water-supercapital', minSpaces: 161, maxSpaces: null, form: 'supercapital', example: 'fleet carrier, floating fortress, mobile sea base' },
  ],
  submersible: [
    { key: 'sub-personal', minSpaces: 1, maxSpaces: 5, form: 'personal submersible', example: 'diver scooter, one-man mini-sub, salvage pod' },
    { key: 'sub-light', minSpaces: 6, maxSpaces: 10, form: 'light exploration sub', example: 'light exploration submersible, diver support sub, patrol sub' },
    { key: 'sub-research', minSpaces: 11, maxSpaces: 20, form: 'research submarine', example: 'research submarine, heavy rescue sub' },
    { key: 'sub-military', minSpaces: 21, maxSpaces: 40, form: 'military submarine', example: 'attack submarine, missile submarine, deep-ocean support craft' },
    { key: 'sub-longrange', minSpaces: 41, maxSpaces: 80, form: 'long-range submarine', example: 'fleet submarine, ballistic submarine, undersea transport' },
    { key: 'sub-carrying', minSpaces: 81, maxSpaces: 160, form: 'undersea carrier', example: 'undersea carrier, large support submarine, sea-base sub' },
    { key: 'sub-fortress', minSpaces: 161, maxSpaces: null, form: 'undersea fortress', example: 'mobile undersea fortress, giant carrier-sub, abyssal habitat ship' },
  ],
  walker: [
    { key: 'walker-loader', minSpaces: 1, maxSpaces: 5, form: 'light walker', example: 'loader walker, scout biped, industrial frame' },
    { key: 'walker-combat', minSpaces: 6, maxSpaces: 10, form: 'combat walker', example: 'combat walker, cargo walker, troop walker' },
    { key: 'walker-siege', minSpaces: 11, maxSpaces: 20, form: 'siege walker', example: 'siege walker, mobile drilling frame, scout titan' },
    { key: 'walker-heavy', minSpaces: 21, maxSpaces: 40, form: 'super-heavy walker', example: 'super-heavy walker, artillery walker, mining platform' },
    { key: 'walker-colossal', minSpaces: 41, maxSpaces: 80, form: 'colossal walker', example: 'colossal industrial walker, titan-scale war walker' },
    { key: 'walker-fortress', minSpaces: 81, maxSpaces: 160, form: 'fortress walker', example: 'fortress walker, mobile citadel, siege titan' },
    { key: 'walker-megafauna', minSpaces: 161, maxSpaces: null, form: 'mega-walker', example: 'continent crawler, world-engine walker, god-machine' },
  ],
  structure: [
    { key: 'structure-pod', minSpaces: 1, maxSpaces: 5, form: 'small module', example: 'kiosk, field shelter, tiny hab pod, checkpoint office' },
    { key: 'structure-shop', minSpaces: 6, maxSpaces: 10, form: 'shop-scale', example: 'small cabin, workshop, clinic pod, machine shop' },
    { key: 'structure-block', minSpaces: 11, maxSpaces: 20, form: 'block-scale', example: 'warehouse unit, barracks block, garage' },
    { key: 'structure-hangar', minSpaces: 21, maxSpaces: 40, form: 'hangar module', example: 'hangar module, command post, large workshop' },
    { key: 'structure-outpost', minSpaces: 41, maxSpaces: 80, form: 'fortified outpost', example: 'industrial hall, depot building, fortified outpost' },
    { key: 'structure-facility', minSpaces: 81, maxSpaces: 160, form: 'facility-scale', example: 'major facility, habitat block, large hangar complex' },
    { key: 'structure-complex', minSpaces: 161, maxSpaces: null, form: 'mega-facility', example: 'arcology wing, carrier yard, fortress complex' },
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

const featureAgilityModifiers: Record<string, number> = {
  Agile: 1,
}

const featureSpeedModifiers: Record<string, number> = {
  Fast: 1,
  Slow: -1,
}

// Feature help text is surfaced in the builder so users can see the handbook intent
// of each selectable vehicle feature without leaving the workflow.
export const vehicleFeatureRuleText: Record<string, string> = {
  'AFV': 'Armoured fighting vehicle configuration. In the current builder this primarily matters for armour, tripling the handbook maximum protection.',
  'Aerodyne': 'Airframe shaped for powered atmospheric flight with lift surfaces integrated into the body.',
  'Agile': 'Improves handling. Current builder effect: +1 Agility.',
  'ATV': 'All-terrain configuration intended to keep the vehicle functional across rough or mixed terrain.',
  'Fast': 'Pushes the design one speed band higher. Current builder effect: +1 Speed Band.',
  'Floats': 'Allows the vehicle to remain buoyant on water without requiring a full dedicated watercraft hull.',
  'Folding Wings': 'Wing structure can be stowed or folded for compact storage or mixed-mode operation.',
  'Hydrofoil': 'Uses lifting foils for higher-speed water travel while reducing hull drag.',
  'Hypersonic': 'High-atmosphere or extreme high-speed airframe treatment intended for very high velocity flight.',
  'Jet Engines': 'Aircraft propulsion feature representing jet-based thrust rather than propeller or rotor-only flight.',
  'Locomotive': 'Heavy rail-oriented feature intended for very large tracked rail designs. Size-gated in the builder.',
  'Monowheel': 'Single-wheel configuration with the stability and handling tradeoffs that implies.',
  'Multi-Legged': 'Walker body plan with multiple legs instead of a simpler two-leg layout.',
  'Off-Roader': 'Ground configuration tuned for rough terrain rather than ideal paved-road performance.',
  'Open Frame': 'Exposed frame with little or no enclosed bodywork. Also affects armour expectations in the builder.',
  'Open-Topped': 'Crew/passenger compartment is exposed above. Also affects dorsal armour handling in the builder.',
  'Ornithopter': 'Winged flapping-flight configuration rather than conventional fixed-wing or rotary lift.',
  'Rail Rider': 'Ground vehicle built to operate directly on rail infrastructure.',
  'Rigid': 'Airship structure uses a rigid frame rather than a softer envelope-led form.',
  'Slow': 'Drops the design one speed band. Current builder effect: -1 Speed Band.',
  'Smart Wheels': 'Advanced wheel system for better adaptation to terrain and handling conditions.',
  'STOL': 'Short take-off and landing treatment for aircraft needing reduced runway requirements.',
  'Streamlined': 'Shape treatment intended to reduce drag and improve movement through atmosphere or fluid.',
  'Supersonic': 'Airframe is suitable for sustained supersonic flight.',
  'Tilt Engines': 'Engine or rotor arrangement can pivot between vertical-lift and forward-flight orientations.',
  'Tracks': 'Tracked ground-drive configuration in place of ordinary wheels.',
  'Tunneller': 'Vehicle is equipped or structured for subsurface boring/travel. Size-gated in the builder.',
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
  const equipmentAllocatedSpaces = (vehicle.equipmentEntries ?? []).reduce((total, entry) => total + Math.max(0, Number(entry.spaces ?? 0)), 0)
  const weaponAllocatedSpaces = (vehicle.weapons ?? []).reduce((total, weapon) => total + Math.max(0, Number(weapon.spaces ?? 0)), 0)
  const allocatedSpaces = featureAllocatedSpaces + equipmentAllocatedSpaces + weaponAllocatedSpaces + armourSummary.armourSpaces
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
  const selectedFeatures = [...new Set((vehicle.features ?? []).filter((feature) => family.allowedFeatures.includes(feature) && (size.armourAllowedFeatures.length === 0 || !['AFV', 'Locomotive', 'Tunneller'].includes(feature) || size.armourAllowedFeatures.includes(feature))))]
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
  const derivedHull = Math.max(1, roundHalfUp(baseHull * (1 + hullClassModifier.hull)))
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

  vehicle.category = family.category
  vehicle.type = vehicleDerivedTypeName(family.id, vehicle.spaces)
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
  vehicle.equipment = (vehicle.equipmentEntries ?? []).map((entry) => entry.name).filter(Boolean)
}

export const vehicleBuilderOptionSets = () => {
  const vehicles = vehicleHandbookVariants()
  const equipmentByCategory = new Map<string, VehicleBuilderEquipmentLibraryItem[]>()

  for (const item of allEquipmentSeedRecords()) {
    const category = String(item.category || 'misc').trim() || 'misc'
    const existing = equipmentByCategory.get(category) ?? []
    existing.push({
      id: item.id,
      name: item.name,
      label: equipmentLabel(item),
      category,
      categoryLabel: categoryLabel(category),
      techLevel: item.techLevel,
      sourceName: item.sourceName,
      sourcePage: item.sourcePage,
      effect: item.effect,
      traits: [...(item.traits ?? [])],
    })
    equipmentByCategory.set(category, existing)
  }

  const equipmentLibrary = [...equipmentByCategory.entries()]
    .map(([id, items]) => ({
      id,
      label: categoryLabel(id),
      items: items.sort((left, right) => left.label.localeCompare(right.label, undefined, { sensitivity: 'base' })),
    }))
    .sort((left, right) => left.label.localeCompare(right.label, undefined, { sensitivity: 'base' }))

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
  if (power.supportsFusionPlusFuelType && vehicle.fusionPlusFuelType === 'deuterium-enriched-water' && vehicle.techLevel < 10) issues.push('Deuterium-enriched Fusion+ fuel requires TL 10+ support infrastructure.')
  if (auxiliary.allowedFamilies && !auxiliary.allowedFamilies.includes(family.id)) issues.push(`${auxiliary.label} is not allowed for ${family.label}.`)
  if (vehicle.auxiliaryDrive !== 'none' && vehicle.techLevel < auxiliary.minimumTechLevel) issues.push(`${auxiliary.label} requires TL ${auxiliary.minimumTechLevel}+.`)
  if (vehicle.features.some((feature) => !family.allowedFeatures.includes(feature))) issues.push('Selected features must be allowed for the base vehicle type.')
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
    const prefix = `Equipment ${index + 1}`
    if (!entry.name.trim()) issues.push(`${prefix} name is required.`)
    if (Number(entry.spaces ?? 0) < 0) issues.push(`${prefix} spaces cannot be negative.`)
  })

  const summary = vehicleConstructionSummary(vehicle)
  if (summary.allocatedSpaces > summary.availableSpaces) {
    issues.push(`Allocated systems spaces (${summary.allocatedSpaces}) exceed available spaces (${summary.availableSpaces}).`)
  }

  return issues
}
