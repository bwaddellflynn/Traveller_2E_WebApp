export type TravellerShipSourceId =
  | 'mgt2e-core-2022'
  | 'mgt2e-high-guard-2022'
  | 'mgt2e-element-class-cruisers'
  | 'custom-player'

export type TravellerShipCategory =
  | 'merchant'
  | 'civilian'
  | 'military'
  | 'courier'
  | 'exploration'
  | 'luxury'
  | 'cruiser'
  | 'other'

export type TravellerShipComponentKind =
  | 'hull'
  | 'armour'
  | 'hull-option'
  | 'm-drive'
  | 'reaction-drive'
  | 'j-drive'
  | 'fuel'
  | 'power-plant'
  | 'bridge'
  | 'computer'
  | 'sensor'
  | 'weapon'
  | 'screen'
  | 'option'
  | 'crew'
  | 'accommodation'
  | 'cargo'
  | 'software'
  | 'carried-craft'
  | 'note'

export type TravellerShipComponentPlacementPolicy =
  | 'required-area'
  | 'derived-area'
  | 'optional-area'
  | 'distributed'
  | 'exterior'
  | 'abstract'

export type TravellerShipCost = {
  label: string
  credits?: number | null
  megacredits?: number | null
  note?: string
}

export type TravellerShipPowerProfile = {
  output: number
  basicSystems: number
  manoeuvre: number
  jump: number
  sensors: number
  weapons: number
  screens: number
  options: number
  software?: number
  totalRoutine: number
  totalJump: number
  totalCombat: number
  surplusRoutine: number
  surplusJump: number
  surplusCombat: number
  notes?: string[]
}

export type TravellerShipFuelProfile = {
  jumpFuelTons: number
  reactionFuelTons: number
  powerPlantFuelTons: number
  totalFuelTons: number
  enduranceWeeks?: number | null
  notes?: string[]
}

export type TravellerShipHardpointProfile = {
  available: number
  used: number
  remaining: number
  notes?: string[]
}

export type TravellerShipBandwidthProfile = {
  available: number
  used: number
  remaining: number
  jumpControlIncluded?: boolean
  notes?: string[]
}

export type TravellerShipCrewRole = {
  role: string
  skill?: string
  count: number
  salaryCredits?: number
  mode?: 'commercial' | 'military' | 'either'
  note?: string
}

export type TravellerShipWeaponSystem = {
  id: string
  name: string
  mount: string
  count: number
  hardpointsUsed?: number
  tons: number
  power: number
  cost?: TravellerShipCost
  range?: string
  damage?: string
  traits: string[]
  ammunition?: string
  note?: string
}

export type TravellerShipSoftware = {
  id: string
  name: string
  bandwidth: number
  techLevel?: number | null
  cost?: TravellerShipCost
  note?: string
}

export type TravellerShipComponent = {
  id: string
  kind: TravellerShipComponentKind
  name: string
  label?: string
  techLevel?: number | null
  tons: number
  cost?: TravellerShipCost
  powerDraw?: number
  powerOutput?: number
  hardpointsUsed?: number
  bandwidthUsed?: number
  count?: number
  sourcePage?: number
  placementPolicy?: TravellerShipComponentPlacementPolicy
  traits?: string[]
  notes?: string[]
}

export type TravellerShipCostProfile = {
  total?: TravellerShipCost
  purchase?: TravellerShipCost
  standardDesignDiscountCredits?: number
  monthlyMaintenanceCredits?: number
  monthlyLifeSupportCredits?: number
  notes?: string[]
}

export type TravellerShipDerivedProfile = {
  hullPoints?: number
  tonsUsed: number
  tonsRemaining: number
  cargoTons: number
  power?: TravellerShipPowerProfile
  fuel?: TravellerShipFuelProfile
  hardpoints?: TravellerShipHardpointProfile
  bandwidth?: TravellerShipBandwidthProfile
  crewCount?: number
  notes?: string[]
}

export type TravellerShipDesignMode = 'standard' | 'new'

export type TravellerShipCrewMode = 'commercial' | 'military'

export type CustomShipBuildBrief = {
  role: string
  designMode: TravellerShipDesignMode
  shipyardTechLevel: number
  crewMode: TravellerShipCrewMode
  targetBudgetMCr: string
  targetTonnage: number
  targetJump: number
  targetThrust: number
  crewTarget: string
  passengerTarget: string
  cargoTarget: string
  notes: string
}

export type CustomShipHullSelection = {
  configuration: string
  armourType: string
  armourProtection: number
  specialisedHullTypes: string[]
  additionalHullTypes: string[]
  hullOptions: string[]
}

export type CustomShipDriveSelection = {
  manoeuvreDriveRating: number
  reactionDriveRating: number
  jumpDriveRating: number
  usesReactionDrive: boolean
}

export type CustomShipFuelSelection = {
  jumpFuelTons: number
  reactionFuelTons: number
  reactionFuelHours: number
  powerPlantFuelTons: number
  powerPlantEnduranceWeeks: number
}

export type CustomShipPowerPlantSelection = {
  type: string
  tons: number
}

export type CustomShipBridgeSelection = {
  type: string
  smallerBridge: boolean
  commandBridge: boolean
}

export type CustomShipComputerSelection = {
  model: string
  backupModel: string
  jumpControlSpecialisation: boolean
  hardenedSystems: boolean
}

export type CustomShipSensorSelection = {
  type: string
}

export type CustomShipAccommodationEntry = {
  id: string
  type: 'stateroom' | 'high-stateroom' | 'luxury-stateroom' | 'psion-stateroom' | 'low-berth' | 'emergency-low-berth' | 'common-area' | 'acceleration-bench' | 'acceleration-seat' | 'barracks' | 'brig' | 'cabin-space' | 'other'
  label: string
  count: number
  tonsEach: number
  cost?: TravellerShipCost
  powerDraw?: number
  notes?: string[]
}

export type CustomShipCargoEntry = {
  id: string
  label: string
  tons: number
  notes?: string[]
}

export type CustomShipLayoutCell = {
  x: number
  y: number
}

export type CustomShipLayoutVisualRole =
  | 'stateroom'
  | 'high-stateroom'
  | 'luxury-stateroom'
  | 'psion-stateroom'
  | 'low-berth'
  | 'emergency-low-berth'
  | 'common-area'
  | 'acceleration-bench'
  | 'acceleration-seat'
  | 'barracks'
  | 'brig'
  | 'cabin-space'
  | 'crew-quarters'
  | 'cargo'

export type CustomShipLayoutPlacement = {
  id: string
  componentId: string
  deckId: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  footprintCells?: CustomShipLayoutCell[]
  visualRole?: CustomShipLayoutVisualRole
  sourceEntryId?: string
  locked?: boolean
}

export type CustomShipLayoutDeck = {
  id: string
  name: string
  gridColumns: number
  gridRows: number
  tonsPerCell: number
  notes?: string[]
}

export type CustomShipHullEnvelope = {
  deckId: string
  cells: CustomShipLayoutCell[]
  locked: boolean
  preset: string
  configuration: string
  hullTons: number
  tonsPerCell: number
}

export type CustomShipLayout = {
  enabled: boolean
  decks: CustomShipLayoutDeck[]
  placements: CustomShipLayoutPlacement[]
  hullEnvelope?: CustomShipHullEnvelope
  unplacedComponentIds: string[]
  notes?: string[]
}

export type TravellerShipRecord = {
  id: string
  name: string
  sourceId: TravellerShipSourceId
  sourceName?: string
  sourcePage?: number
  category: TravellerShipCategory
  role: string
  tons: number
  techLevel: number | null
  jump: string
  thrust: string
  crew: string
  cost: string
  traits: string[]
  description: string
  notes?: string
  components?: TravellerShipComponent[]
  crewRoles?: TravellerShipCrewRole[]
  powerProfile?: TravellerShipPowerProfile
  fuelProfile?: TravellerShipFuelProfile
  weaponSystems?: TravellerShipWeaponSystem[]
  software?: TravellerShipSoftware[]
  carriedCraft?: TravellerShipComponent[]
  costs?: TravellerShipCostProfile
  derived?: TravellerShipDerivedProfile
  validationIssues?: string[]
}

export type CustomShipDesign = TravellerShipRecord & {
  userId: string
  createdAt: string
  updatedAt: string
  buildBrief: CustomShipBuildBrief
  hull: CustomShipHullSelection
  drives: CustomShipDriveSelection
  fuel: CustomShipFuelSelection
  powerPlant: CustomShipPowerPlantSelection
  bridge: CustomShipBridgeSelection
  computer: CustomShipComputerSelection
  sensors: CustomShipSensorSelection
  weaponSystems: TravellerShipWeaponSystem[]
  screenSystems: TravellerShipComponent[]
  optionSystems: TravellerShipComponent[]
  crewRoles: TravellerShipCrewRole[]
  accommodations: CustomShipAccommodationEntry[]
  cargoEntries: CustomShipCargoEntry[]
  software: TravellerShipSoftware[]
  layout: CustomShipLayout
}
