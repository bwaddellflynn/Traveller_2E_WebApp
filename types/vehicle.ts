export type TravellerVehicleSourceId =
  | 'mgt2e-core-2022'
  | 'mgt2e-csc'
  | 'mgt2e-field-catalogue'
  | 'mgt2e-mercenary-vehicle-recognition-cards'
  | 'mgt2e-vehicle-handbook'
  | 'custom-player'

export type TravellerVehicleCategory =
  | 'ground'
  | 'grav'
  | 'aircraft'
  | 'watercraft'
  | 'hovercraft'
  | 'walker'
  | 'rail'
  | 'biotech'
  | 'other'

export type TravellerVehicleBaseFamily =
  | 'aeroplane'
  | 'airship'
  | 'grav-vehicle'
  | 'ground-vehicle'
  | 'hovercraft'
  | 'rotorcraft'
  | 'structure'
  | 'submersible'
  | 'walker'
  | 'watercraft'

export type TravellerVehiclePrimaryPower =
  | 'standard'
  | 'unpowered'
  | 'muscle'
  | 'wind'
  | 'grid'
  | 'beamed'
  | 'powered-structure'
  | 'fission-basic'
  | 'fission-improved'
  | 'fission-advanced'
  | 'fusion-basic'
  | 'fusion-improved'
  | 'fusion-advanced'
  | 'antimatter'
  | 'fusion-plus-basic'
  | 'fusion-plus-improved'
  | 'fusion-plus-advanced'
  | 'solar-basic'
  | 'solar-improved'
  | 'solar-advanced'

export type TravellerVehicleAuxiliaryDrive =
  | 'none'
  | 'aquatic'
  | 'grav'
  | 'ground'
  | 'leg'
  | 'lifters'
  | 'rail'
  | 'track'
  | 'submarine'
  | 'supercavitation'

export type TravellerVehicleArmour = {
  forward: string
  port: string
  dorsal: string
  aft: string
  starboard: string
  ventral: string
}

export type TravellerVehicleWeapon = {
  name: string
  range: string
  damage: string
  magazine: string
  cost: string
  traits: string[]
  fireControl: string
  spaces?: number
  baseSpaces?: number
  mountType?: string
  mountFacing?: string
  linkedCount?: number
  ammunitionSpaces?: number
  fireControlSystem?: string
  autoloader?: boolean
  modularMount?: boolean
  popupMount?: boolean
  powerRequirement?: string
  crew?: string
  loaders?: string
  sourceCategory?: string
}

export type TravellerVehicleFusionPlusFuelType =
  | 'water'
  | 'deuterium-enriched-water'

export type CustomVehicleEquipmentEntry = {
  name: string
  spaces: number
  category?: string
  catalogueId?: string
}

export type CustomVehicleOccupantEntry = {
  role: string
  count: number
  spacesEach: number
  category: '' | 'crew' | 'passenger'
}

export type CustomVehicleCargoEntry = {
  name: string
  spaces: number
  tons: number
}

export type TravellerVehicleRecord = {
  id: string
  name: string
  sourceId: TravellerVehicleSourceId
  sourceName?: string
  sourcePage?: number
  category: TravellerVehicleCategory
  type: string
  spaces: number
  hitDm: string
  hull: string
  techLevel: number
  skill: string
  agility: string
  speed: string
  cruiseSpeed: string
  range: string
  cruiseRange: string
  crew: string
  passengers: string
  comfortLevel: string
  cargo: string
  structure: string
  shipping: string
  costCredits: number | null
  cost: string
  traits: string[]
  armour: TravellerVehicleArmour
  equipment: string[]
  weapons: TravellerVehicleWeapon[]
  notes?: string
}

export type CustomVehicleDesign = TravellerVehicleRecord & {
  userId: string
  createdAt: string
  updatedAt: string
  baseFamily: '' | TravellerVehicleBaseFamily
  features: string[]
  primaryPower: '' | TravellerVehiclePrimaryPower
  fusionPlusFuelType: TravellerVehicleFusionPlusFuelType
  auxiliaryDrive: '' | TravellerVehicleAuxiliaryDrive
  occupantEntries: CustomVehicleOccupantEntry[]
  cargoEntries: CustomVehicleCargoEntry[]
  equipmentEntries: CustomVehicleEquipmentEntry[]
  speedModificationSteps: number
  fuelEfficiencySteps: number
  fuelCapacitySteps: number
}
