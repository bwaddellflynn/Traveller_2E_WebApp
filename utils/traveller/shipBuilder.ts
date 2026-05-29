import type {
  CustomShipDesign,
  TravellerShipBandwidthProfile,
  TravellerShipComponent,
  TravellerShipCost,
  TravellerShipCostProfile,
  TravellerShipCrewMode,
  TravellerShipCrewRole,
  TravellerShipDerivedProfile,
  TravellerShipFuelProfile,
  TravellerShipHardpointProfile,
  TravellerShipPowerProfile,
} from '~/types/ship'

export type ShipHullConfigurationRule = {
  id: string
  label: string
  streamlined: 'yes' | 'partial' | 'no'
  armourVolumeModifier: number
  hullPointModifier: number
  hullCostModifier: number
  usableVolumePercent?: number
  notes?: string
}

export type ShipHullArmourRule = {
  id: string
  label: string
  minimumTechLevel: number
  tonsPercentPerProtection: number
  costPerTonCredits: number
  maximumProtection: 'tl' | 'tl+4' | 'tl-or-9' | 'tl-or-13'
  notes?: string
}

export type ShipHullOptionRule = {
  id: string
  label: string
  minimumTechLevel: number
  tons?: number
  tonsPercent?: number
  costCredits?: number
  costPerHullTonCredits?: number
  power?: number
  notes: string
}

export type ShipHullStepIssueSeverity = 'error' | 'warning'

export type ShipHullStepIssue = {
  severity: ShipHullStepIssueSeverity
  code: string
  message: string
}

export type ShipHullStepInput = {
  shipTons: number
  techLevel: number
  configurationId: string
  armourTypeId: string
  armourProtection: number
  specialisedHullTypeIds: string[]
  additionalHullTypeIds: string[]
  hullOptionIds: string[]
  phaseMinimumTons?: number
}

export type ShipHullStepArmourResult = {
  rule: ShipHullArmourRule
  protection: number
  maximumProtection: number
  tons: number
  costCredits: number
}

export type ShipHullStepOptionResult = {
  rule: ShipHullOptionRule
  tons: number
  costCredits: number
}

export type ShipHullStepResult = {
  input: ShipHullStepInput
  isComplete: boolean
  configuration: ShipHullConfigurationRule
  baseHullCostCredits: number
  hullCostCredits: number
  baseHullPoints: number
  hullPoints: number
  usableTons: number
  armour?: ShipHullStepArmourResult
  specialisedHullTypes: ShipHullStepOptionResult[]
  additionalHullTypes: ShipHullStepOptionResult[]
  hullOptions: ShipHullStepOptionResult[]
  totalOptionTons: number
  totalOptionCostCredits: number
  issues: ShipHullStepIssue[]
  errors: ShipHullStepIssue[]
  warnings: ShipHullStepIssue[]
}

export type ShipDrivePotentialRule = {
  rating: number
  hullPercent: number
  minimumTechLevel: number
}

export type ShipJumpPotentialRule = ShipDrivePotentialRule & {
  flatTons: number
  minimumTons: number
}

export type ShipPowerPlantRule = {
  id: string
  label: string
  minimumTechLevel: number
  powerPerTon: number
  costPerTonMCr: number
  jumpCapable: boolean
}

export type ShipBridgeRule = {
  id: string
  label: string
  minimumShipTons: number
  maximumShipTons: number | null
  bridgeTons: number
}

export type ShipComputerRule = {
  id: string
  label: string
  processing: number
  minimumTechLevel: number
  costMCr: number
  isCore?: boolean
}

export type ShipSensorRule = {
  id: string
  label: string
  minimumTechLevel: number
  suite: string[]
  dm: number
  power: number
  tons: number
  costMCr: number
}

export type ShipAccommodationRule = {
  id: string
  label: string
  tons: number
  costMCr: number
  power?: number
  capacity: number
  notes?: string
}

export type ShipCrewRequirementRule = {
  role: string
  skill?: string
  salaryCredits: number
  commercial: string
  military: string
}

export const HIGH_GUARD_MINIMUM_SPACECRAFT_TONS = 100
export const HIGH_GUARD_MINIMUM_HULL_TONS = 5
export const HIGH_GUARD_BASE_HULL_COST_PER_TON_CREDITS = 50000

export const shipHullConfigurationRules: ShipHullConfigurationRule[] = [
  { id: 'standard', label: 'Standard', streamlined: 'partial', armourVolumeModifier: 0, hullPointModifier: 0, hullCostModifier: 0 },
  { id: 'streamlined', label: 'Streamlined', streamlined: 'yes', armourVolumeModifier: 0.2, hullPointModifier: 0, hullCostModifier: 0.2 },
  { id: 'sphere', label: 'Sphere', streamlined: 'partial', armourVolumeModifier: -0.1, hullPointModifier: 0, hullCostModifier: 0.1 },
  { id: 'close-structure', label: 'Close Structure', streamlined: 'partial', armourVolumeModifier: 0.5, hullPointModifier: 0, hullCostModifier: -0.2 },
  { id: 'dispersed-structure', label: 'Dispersed Structure', streamlined: 'no', armourVolumeModifier: 1, hullPointModifier: -0.1, hullCostModifier: -0.5 },
  { id: 'planetoid', label: 'Planetoid', streamlined: 'no', armourVolumeModifier: 0, hullPointModifier: 0.25, hullCostModifier: 0, usableVolumePercent: 0.8, notes: 'Special Cr4000 per ton asteroid hull; 80% usable volume.' },
  { id: 'buffered-planetoid', label: 'Buffered Planetoid', streamlined: 'no', armourVolumeModifier: 0, hullPointModifier: 0.5, hullCostModifier: 0, usableVolumePercent: 0.65, notes: 'Special Cr4000 per ton asteroid hull; 65% usable volume.' },
]

export const shipSpecialisedHullRules: ShipHullOptionRule[] = [
  { id: 'reinforced', label: 'Reinforced Hull', minimumTechLevel: 0, costPerHullTonCredits: HIGH_GUARD_BASE_HULL_COST_PER_TON_CREDITS * 0.5, notes: '+50% hull cost; +10% Hull points.' },
  { id: 'light', label: 'Light Hull', minimumTechLevel: 0, costPerHullTonCredits: -HIGH_GUARD_BASE_HULL_COST_PER_TON_CREDITS * 0.25, notes: '-25% hull cost; -10% Hull points.' },
  { id: 'military', label: 'Military Hull', minimumTechLevel: 0, costPerHullTonCredits: HIGH_GUARD_BASE_HULL_COST_PER_TON_CREDITS * 0.25, notes: 'Capital ships only; +25% hull cost; doubles standard armour limit.' },
  { id: 'non-gravity', label: 'Non-Gravity Hull', minimumTechLevel: 0, costPerHullTonCredits: -HIGH_GUARD_BASE_HULL_COST_PER_TON_CREDITS * 0.5, notes: '-50% hull cost; basic ship systems require half Power; maximum 500,000 tons.' },
]

export const shipAdditionalHullRules: ShipHullOptionRule[] = [
  { id: 'double-hull', label: 'Double Hull', minimumTechLevel: 0, notes: 'Spun outer hull provides gravity; spin machinery consumes 0.1 tons per ton of spun outer hull.' },
  { id: 'hamster-cage', label: 'Hamster Cage', minimumTechLevel: 0, notes: 'Spun rings provide gravity; spin machinery consumes 0.1 tons per ton of spun ring.' },
  { id: 'breakaway', label: 'Breakaway Hull', minimumTechLevel: 0, tonsPercent: 0.02, costPerHullTonCredits: 2000000, notes: 'Consumes 2% combined hull tonnage for connectors and bulkheads; costs MCr2 per ton consumed.' },
]

export const shipHullArmourRules: ShipHullArmourRule[] = [
  { id: 'titanium-steel', label: 'Titanium Steel', minimumTechLevel: 7, tonsPercentPerProtection: 0.025, costPerTonCredits: 50000, maximumProtection: 'tl-or-9' },
  { id: 'crystaliron', label: 'Crystaliron', minimumTechLevel: 10, tonsPercentPerProtection: 0.0125, costPerTonCredits: 200000, maximumProtection: 'tl-or-13' },
  { id: 'bonded-superdense', label: 'Bonded Superdense', minimumTechLevel: 14, tonsPercentPerProtection: 0.008, costPerTonCredits: 500000, maximumProtection: 'tl' },
  { id: 'molecular-bonded', label: 'Molecular Bonded', minimumTechLevel: 16, tonsPercentPerProtection: 0.005, costPerTonCredits: 1500000, maximumProtection: 'tl+4', notes: 'Tachyon weapons lose AP against molecular bonded armour.' },
]

export const shipHullArmourTonnageMultipliers = [
  { minimumTons: 5, maximumTons: 15, multiplier: 4 },
  { minimumTons: 16, maximumTons: 25, multiplier: 3 },
  { minimumTons: 26, maximumTons: 99, multiplier: 2 },
  { minimumTons: 100, maximumTons: null, multiplier: 1 },
]

export const shipHullOptionRules: ShipHullOptionRule[] = [
  { id: 'heat-shielding', label: 'Heat Shielding', minimumTechLevel: 6, costPerHullTonCredits: 100000, notes: 'Protects against re-entry or close stellar heat.' },
  { id: 'radiation-shielding', label: 'Radiation Shielding', minimumTechLevel: 7, costPerHullTonCredits: 25000, notes: 'Improves radiation protection and treats bridge as Hardened.' },
  { id: 'reflec', label: 'Reflec', minimumTechLevel: 10, costPerHullTonCredits: 100000, notes: 'Protection +3 against lasers; cannot combine with Stealth.' },
  { id: 'solar-coating', label: 'Solar Coating', minimumTechLevel: 8, notes: 'Backup solar power hull coating; cannot combine with other listed hull options.' },
  { id: 'stealth-basic', label: 'Stealth, Basic', minimumTechLevel: 8, tonsPercent: 0.02, costPerHullTonCredits: 40000, notes: 'DM-2 to Electronics (sensors) checks to detect or lock on.' },
  { id: 'stealth-improved', label: 'Stealth, Improved', minimumTechLevel: 10, costPerHullTonCredits: 100000, notes: 'DM-2 to Electronics (sensors) checks to detect or lock on.' },
  { id: 'stealth-enhanced', label: 'Stealth, Enhanced', minimumTechLevel: 12, costPerHullTonCredits: 500000, notes: 'DM-4 to Electronics (sensors) checks to detect or lock on.' },
  { id: 'stealth-advanced', label: 'Stealth, Advanced', minimumTechLevel: 14, costPerHullTonCredits: 1000000, notes: 'DM-6 to Electronics (sensors) checks to detect or lock on.' },
]

export const shipManoeuvreDriveRules: ShipDrivePotentialRule[] = [
  { rating: 0, hullPercent: 0.005, minimumTechLevel: 9 },
  { rating: 1, hullPercent: 0.01, minimumTechLevel: 9 },
  { rating: 2, hullPercent: 0.02, minimumTechLevel: 10 },
  { rating: 3, hullPercent: 0.03, minimumTechLevel: 10 },
  { rating: 4, hullPercent: 0.04, minimumTechLevel: 11 },
  { rating: 5, hullPercent: 0.05, minimumTechLevel: 11 },
  { rating: 6, hullPercent: 0.06, minimumTechLevel: 12 },
  { rating: 7, hullPercent: 0.07, minimumTechLevel: 13 },
  { rating: 8, hullPercent: 0.08, minimumTechLevel: 14 },
  { rating: 9, hullPercent: 0.09, minimumTechLevel: 15 },
  { rating: 10, hullPercent: 0.1, minimumTechLevel: 16 },
  { rating: 11, hullPercent: 0.11, minimumTechLevel: 17 },
]

export const shipReactionDriveRules: ShipDrivePotentialRule[] = [
  { rating: 0, hullPercent: 0.01, minimumTechLevel: 7 },
  { rating: 1, hullPercent: 0.02, minimumTechLevel: 7 },
  { rating: 2, hullPercent: 0.04, minimumTechLevel: 7 },
  { rating: 3, hullPercent: 0.06, minimumTechLevel: 7 },
  { rating: 4, hullPercent: 0.08, minimumTechLevel: 8 },
  { rating: 5, hullPercent: 0.1, minimumTechLevel: 8 },
  { rating: 6, hullPercent: 0.12, minimumTechLevel: 8 },
  { rating: 7, hullPercent: 0.14, minimumTechLevel: 9 },
  { rating: 8, hullPercent: 0.16, minimumTechLevel: 9 },
  { rating: 9, hullPercent: 0.18, minimumTechLevel: 9 },
  { rating: 10, hullPercent: 0.2, minimumTechLevel: 10 },
  { rating: 11, hullPercent: 0.22, minimumTechLevel: 10 },
  { rating: 12, hullPercent: 0.24, minimumTechLevel: 10 },
  { rating: 13, hullPercent: 0.26, minimumTechLevel: 11 },
  { rating: 14, hullPercent: 0.28, minimumTechLevel: 11 },
  { rating: 15, hullPercent: 0.3, minimumTechLevel: 11 },
  { rating: 16, hullPercent: 0.32, minimumTechLevel: 12 },
]

export const shipJumpDriveRules: ShipJumpPotentialRule[] = [
  { rating: 1, hullPercent: 0.025, flatTons: 5, minimumTons: 10, minimumTechLevel: 9 },
  { rating: 2, hullPercent: 0.05, flatTons: 5, minimumTons: 10, minimumTechLevel: 11 },
  { rating: 3, hullPercent: 0.075, flatTons: 5, minimumTons: 10, minimumTechLevel: 12 },
  { rating: 4, hullPercent: 0.1, flatTons: 5, minimumTons: 10, minimumTechLevel: 13 },
  { rating: 5, hullPercent: 0.125, flatTons: 5, minimumTons: 10, minimumTechLevel: 14 },
  { rating: 6, hullPercent: 0.15, flatTons: 5, minimumTons: 10, minimumTechLevel: 15 },
  { rating: 7, hullPercent: 0.175, flatTons: 5, minimumTons: 10, minimumTechLevel: 16 },
  { rating: 8, hullPercent: 0.2, flatTons: 5, minimumTons: 10, minimumTechLevel: 17 },
  { rating: 9, hullPercent: 0.225, flatTons: 5, minimumTons: 10, minimumTechLevel: 18 },
]

export const SHIP_MANOEUVRE_DRIVE_COST_PER_TON_MCR = 2
export const SHIP_REACTION_DRIVE_COST_PER_TON_MCR = 0.2
export const SHIP_JUMP_DRIVE_COST_PER_TON_MCR = 1.5

export const shipPowerPlantRules: ShipPowerPlantRule[] = [
  { id: 'fission-tl6', label: 'Fission (TL6)', minimumTechLevel: 6, powerPerTon: 8, costPerTonMCr: 0.4, jumpCapable: false },
  { id: 'chemical-tl7', label: 'Chemical (TL7)', minimumTechLevel: 7, powerPerTon: 5, costPerTonMCr: 0.25, jumpCapable: false },
  { id: 'fusion-tl8', label: 'Fusion (TL8)', minimumTechLevel: 8, powerPerTon: 10, costPerTonMCr: 0.5, jumpCapable: true },
  { id: 'fusion-tl12', label: 'Fusion (TL12)', minimumTechLevel: 12, powerPerTon: 15, costPerTonMCr: 1, jumpCapable: true },
  { id: 'fusion-tl15', label: 'Fusion (TL15)', minimumTechLevel: 15, powerPerTon: 20, costPerTonMCr: 2, jumpCapable: true },
  { id: 'antimatter-tl20', label: 'Antimatter (TL20)', minimumTechLevel: 20, powerPerTon: 100, costPerTonMCr: 10, jumpCapable: true },
]

export const shipBridgeRules: ShipBridgeRule[] = [
  { id: 'bridge-50', label: 'Bridge, 50 tons or less', minimumShipTons: 0, maximumShipTons: 50, bridgeTons: 3 },
  { id: 'bridge-99', label: 'Bridge, 51-99 tons', minimumShipTons: 51, maximumShipTons: 99, bridgeTons: 6 },
  { id: 'bridge-200', label: 'Bridge, 100-200 tons', minimumShipTons: 100, maximumShipTons: 200, bridgeTons: 10 },
  { id: 'bridge-1000', label: 'Bridge, 201-1,000 tons', minimumShipTons: 201, maximumShipTons: 1000, bridgeTons: 20 },
  { id: 'bridge-2000', label: 'Bridge, 1,001-2,000 tons', minimumShipTons: 1001, maximumShipTons: 2000, bridgeTons: 40 },
  { id: 'bridge-100000', label: 'Bridge, 2,001-100,000 tons', minimumShipTons: 2001, maximumShipTons: 100000, bridgeTons: 60 },
]

export const shipComputerRules: ShipComputerRule[] = [
  { id: 'computer-5', label: 'Computer/5', processing: 5, minimumTechLevel: 7, costMCr: 0.03 },
  { id: 'computer-10', label: 'Computer/10', processing: 10, minimumTechLevel: 9, costMCr: 0.16 },
  { id: 'computer-15', label: 'Computer/15', processing: 15, minimumTechLevel: 11, costMCr: 2 },
  { id: 'computer-20', label: 'Computer/20', processing: 20, minimumTechLevel: 12, costMCr: 5 },
  { id: 'computer-25', label: 'Computer/25', processing: 25, minimumTechLevel: 13, costMCr: 10 },
  { id: 'computer-30', label: 'Computer/30', processing: 30, minimumTechLevel: 14, costMCr: 20 },
  { id: 'computer-35', label: 'Computer/35', processing: 35, minimumTechLevel: 15, costMCr: 30 },
  { id: 'core-40', label: 'Core/40', processing: 40, minimumTechLevel: 9, costMCr: 45, isCore: true },
  { id: 'core-50', label: 'Core/50', processing: 50, minimumTechLevel: 10, costMCr: 60, isCore: true },
  { id: 'core-60', label: 'Core/60', processing: 60, minimumTechLevel: 11, costMCr: 75, isCore: true },
  { id: 'core-70', label: 'Core/70', processing: 70, minimumTechLevel: 12, costMCr: 80, isCore: true },
  { id: 'core-80', label: 'Core/80', processing: 80, minimumTechLevel: 13, costMCr: 95, isCore: true },
  { id: 'core-90', label: 'Core/90', processing: 90, minimumTechLevel: 14, costMCr: 120, isCore: true },
  { id: 'core-100', label: 'Core/100', processing: 100, minimumTechLevel: 15, costMCr: 130, isCore: true },
]

export const shipSensorRules: ShipSensorRule[] = [
  { id: 'basic', label: 'Basic', minimumTechLevel: 8, suite: ['Lidar', 'Radar'], dm: -4, power: 0, tons: 0, costMCr: 0 },
  { id: 'civilian-grade', label: 'Civilian Grade', minimumTechLevel: 9, suite: ['Lidar', 'Radar'], dm: -2, power: 1, tons: 1, costMCr: 3 },
  { id: 'military-grade', label: 'Military Grade', minimumTechLevel: 10, suite: ['Jammers', 'Lidar', 'Radar'], dm: 0, power: 2, tons: 2, costMCr: 4.1 },
  { id: 'improved', label: 'Improved', minimumTechLevel: 12, suite: ['Densitometer', 'Jammers', 'Lidar', 'Radar'], dm: 1, power: 4, tons: 3, costMCr: 4.3 },
  { id: 'advanced', label: 'Advanced', minimumTechLevel: 15, suite: ['Densitometer', 'Jammers', 'Lidar', 'Neural Activity Sensor', 'Radar'], dm: 2, power: 6, tons: 5, costMCr: 5.3 },
]

export const shipAccommodationRules: ShipAccommodationRule[] = [
  { id: 'stateroom', label: 'Stateroom', tons: 4, costMCr: 0.5, capacity: 1 },
  { id: 'high-stateroom', label: 'High Stateroom', tons: 6, costMCr: 0.8, capacity: 1, notes: 'Grants DM+1 when seeking high passengers; life support cost Cr3000.' },
  { id: 'luxury-stateroom', label: 'Luxury Stateroom', tons: 10, costMCr: 1.5, capacity: 1, notes: 'Grants DM+2 when seeking high passengers; life support cost Cr5000.' },
  { id: 'psion-stateroom', label: 'Psion Stateroom', tons: 4, costMCr: 2, capacity: 1, notes: 'TL12 exotic option; increases PSI regeneration rate by +50% for a psion within.' },
  { id: 'low-berth', label: 'Low Berth', tons: 0.5, costMCr: 0.05, capacity: 1, notes: 'Requires 1 Power per 10 berths or part thereof.' },
  { id: 'emergency-low-berth', label: 'Emergency Low Berth', tons: 1, costMCr: 1, power: 1, capacity: 4 },
  { id: 'common-area', label: 'Common Area', tons: 1, costMCr: 0.1, capacity: 0, notes: 'Cost is MCr0.1 per ton; suggested allocation is around 25% of stateroom tonnage.' },
  { id: 'acceleration-bench', label: 'Acceleration Bench', tons: 1, costMCr: 0.01, capacity: 4, notes: 'Temporary passenger seating.' },
  { id: 'acceleration-seat', label: 'Acceleration Seat', tons: 0.5, costMCr: 0.03, capacity: 1, notes: 'Temporary passenger seating, more comfortable but less space efficient.' },
  { id: 'barracks', label: 'Barracks', tons: 1, costMCr: 0.05, capacity: 1, notes: 'One ton per soldier/basic passenger; life support cost Cr500 per ton.' },
  { id: 'brig', label: 'Brig', tons: 4, costMCr: 0.25, capacity: 6, notes: 'Secure chamber for up to six prisoners; life support cost Cr1000.' },
]

export const shipCrewRequirementRules: ShipCrewRequirementRule[] = [
  { role: 'Captain', salaryCredits: 10000, commercial: 'Usually the leading officer.', military: '1' },
  { role: 'Pilot', skill: 'Pilot', salaryCredits: 6000, commercial: '1 plus 1 for each small craft.', military: '3 plus 1 for each small craft.' },
  { role: 'Astrogator', skill: 'Astrogation', salaryCredits: 5000, commercial: '1 if jump drive installed.', military: '1 if jump drive installed.' },
  { role: 'Engineer', skill: 'Engineer', salaryCredits: 4000, commercial: '1 per 35 tons of drives and power plant of ship and small craft.', military: '1 per 35 tons of drives and power plant of ship and small craft.' },
  { role: 'Maintenance', skill: 'Mechanic', salaryCredits: 1000, commercial: '1 per 1,000 tons of ship and contained small craft.', military: '1 per 500 tons of ship and contained small craft.' },
  { role: 'Gunner', skill: 'Gunner', salaryCredits: 2000, commercial: '1 per turret, barbette and screen. Bay and spinal weapons require military crewing.', military: '1 per small bay; 2 per turret, barbette, medium bay and screen; 4 per large bay; 1 per 100 tons of spinal mount weaponry.' },
  { role: 'Steward', skill: 'Steward', salaryCredits: 2000, commercial: '1 per 10 High or 100 Middle passengers.', military: '1 per 10 High or 100 Middle passengers.' },
  { role: 'Administrator', skill: 'Admin', salaryCredits: 1500, commercial: '1 per 2,000 tons of ship.', military: '1 per 1,000 tons of ship.' },
  { role: 'Sensor Operator', skill: 'Electronics (sensors)', salaryCredits: 4000, commercial: '1 per 7,500 tons of ship.', military: '3 per 7,500 tons of ship.' },
  { role: 'Medic', skill: 'Medic', salaryCredits: 4000, commercial: '1 per 120 crew and passengers.', military: '1 per 120 crew.' },
  { role: 'Officer', skill: 'Leadership or Persuade', salaryCredits: 5000, commercial: '1 per full 20 crew.', military: '1 per full 10 crew.' },
]

export const shipLargeCrewReductionRules = [
  { minimumTons: 5001, maximumTons: 19999, multiplier: 0.75 },
  { minimumTons: 20000, maximumTons: 49999, multiplier: 0.67 },
  { minimumTons: 50000, maximumTons: 99999, multiplier: 0.5 },
  { minimumTons: 100000, maximumTons: null, multiplier: 0.33 },
]

export type ShipConstructionSummary = {
  components: TravellerShipComponent[]
  costs: TravellerShipCostProfile
  derived: TravellerShipDerivedProfile
  crewRoles: TravellerShipCrewRole[]
  validationNotes: string[]
}

const mcrToCredits = (mcr: number) => mcr * 1000000
const positive = (value: number) => Math.max(0, Number.isFinite(value) ? value : 0)
const roundTons = (value: number) => Math.round(value * 1000) / 1000
const roundCredits = (value: number) => Math.round(value)

const costFromCredits = (credits: number, label?: string): TravellerShipCost => {
  const roundedCredits = roundCredits(credits)
  return {
    label: label ?? formatShipCost(roundedCredits),
    credits: roundedCredits,
    megacredits: roundedCredits / 1000000,
  }
}

export const formatShipCost = (credits: number) => {
  if (!Number.isFinite(credits) || credits === 0) return 'MCr0'
  if (Math.abs(credits) >= 1000000) {
    const value = credits / 1000000
    return `MCr${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}`
  }
  return `Cr${Math.round(credits).toLocaleString()}`
}

const costCredits = (cost?: TravellerShipCost) => {
  if (!cost) return 0
  if (typeof cost.credits === 'number') return cost.credits
  if (typeof cost.megacredits === 'number') return mcrToCredits(cost.megacredits)
  return 0
}

const ruleById = <T extends { id: string }>(rules: T[], id: string | undefined, fallback: T) => {
  if (!id) return fallback
  return rules.find((rule) => rule.id === id) ?? fallback
}

export const shipHullConfigurationRuleFor = (id: string | undefined) => ruleById(shipHullConfigurationRules, id, shipHullConfigurationRules[0])
export const shipPowerPlantRuleFor = (id: string | undefined) => ruleById(shipPowerPlantRules, id, shipPowerPlantRules[2])
export const shipSensorRuleFor = (id: string | undefined) => ruleById(shipSensorRules, id, shipSensorRules[0])
export const shipComputerRuleFor = (id: string | undefined) => ruleById(shipComputerRules, id, shipComputerRules[0])

export const shipBridgeRuleForTons = (shipTons: number) => {
  const tons = positive(shipTons)
  return shipBridgeRules.find((rule) => (
    tons >= rule.minimumShipTons && (rule.maximumShipTons === null || tons <= rule.maximumShipTons)
  )) ?? shipBridgeRules[shipBridgeRules.length - 1]
}

const shipBridgeTonsFor = (shipTons: number) => {
  if (shipTons <= 100000) return shipBridgeRuleForTons(shipTons).bridgeTons
  return 60 + (Math.ceil((shipTons - 100000) / 100000) * 20)
}

const shipHullPointsFor = (shipTons: number) => {
  if (shipTons >= 100000) return Math.floor(shipTons / 1.5)
  if (shipTons >= 25000) return Math.floor(shipTons / 2)
  return Math.floor(shipTons / 2.5)
}

const shipArmourTonnageMultiplierFor = (shipTons: number) => {
  return shipHullArmourTonnageMultipliers.find((rule) => (
    shipTons >= rule.minimumTons && (rule.maximumTons === null || shipTons <= rule.maximumTons)
  ))?.multiplier ?? 1
}

const shipArmourMaximumProtectionFor = (rule: ShipHullArmourRule, techLevel: number, isMilitaryHull: boolean) => {
  const tl = positive(techLevel)
  const standardMaximum = (() => {
    if (rule.maximumProtection === 'tl+4') return tl + 4
    if (rule.maximumProtection === 'tl-or-9') return Math.min(tl, 9)
    if (rule.maximumProtection === 'tl-or-13') return Math.min(tl, 13)
    return tl
  })()

  return isMilitaryHull ? standardMaximum * 2 : standardMaximum
}

const hullStepIssue = (severity: ShipHullStepIssueSeverity, code: string, message: string): ShipHullStepIssue => ({
  severity,
  code,
  message,
})

const hullOptionResultFor = (
  rule: ShipHullOptionRule,
  shipTons: number,
  costBasis: 'hull' | 'option' | number = 'hull',
) => {
  const tons = rule.tons ?? (rule.tonsPercent ? shipTons * rule.tonsPercent : 0)
  const costBasisTons = typeof costBasis === 'number'
    ? costBasis
    : costBasis === 'option' ? tons : shipTons
  return {
    rule,
    tons: roundTons(tons),
    costCredits: roundCredits((rule.costCredits ?? 0) + (costBasisTons * (rule.costPerHullTonCredits ?? 0))),
  }
}

const driveRuleFor = (rules: ShipDrivePotentialRule[], rating: number) => rules.find((rule) => rule.rating === rating) ?? rules[0]
const jumpRuleFor = (rating: number) => shipJumpDriveRules.find((rule) => rule.rating === rating) ?? null

const selectedRuleList = (rules: ShipHullOptionRule[], ids: string[]) => ids
  .map((id) => rules.find((rule) => rule.id === id))
  .filter((rule): rule is ShipHullOptionRule => Boolean(rule))

export const calculateHullStep = (input: ShipHullStepInput): ShipHullStepResult => {
  const shipTons = positive(input.shipTons)
  const techLevel = positive(input.techLevel)
  const phaseMinimumTons = positive(input.phaseMinimumTons ?? HIGH_GUARD_MINIMUM_SPACECRAFT_TONS)
  const issues: ShipHullStepIssue[] = []
  const configuration = shipHullConfigurationRuleFor(input.configurationId)
  const configurationExists = shipHullConfigurationRules.some((rule) => rule.id === input.configurationId)
  const isPlanetoid = configuration.id === 'planetoid' || configuration.id === 'buffered-planetoid'
  const baseHullCostCredits = isPlanetoid
    ? shipTons * 4000
    : shipTons * HIGH_GUARD_BASE_HULL_COST_PER_TON_CREDITS * (1 + configuration.hullCostModifier)
  const selectedSpecialisedRules = selectedRuleList(shipSpecialisedHullRules, input.specialisedHullTypeIds)
  const selectedAdditionalRules = selectedRuleList(shipAdditionalHullRules, input.additionalHullTypeIds)
  const selectedHullOptionRules = selectedRuleList(shipHullOptionRules, input.hullOptionIds)
  const hasMilitaryHull = selectedSpecialisedRules.some((rule) => rule.id === 'military')
  const specialisedHullCostModifier = selectedSpecialisedRules.reduce((total, rule) => {
    if (rule.id === 'reinforced') return total + 0.5
    if (rule.id === 'light') return total - 0.25
    if (rule.id === 'military') return total + 0.25
    if (rule.id === 'non-gravity') return total - 0.5
    return total
  }, 0)
  const specialisedHullPointModifier = selectedSpecialisedRules.reduce((total, rule) => {
    if (rule.id === 'reinforced') return total + 0.1
    if (rule.id === 'light') return total - 0.1
    return total
  }, 0)
  const baseHullPoints = shipHullPointsFor(shipTons)
  const hullPoints = Math.max(0, Math.round(baseHullPoints * (1 + configuration.hullPointModifier + specialisedHullPointModifier)))
  const hullCostCredits = roundCredits(baseHullCostCredits * (1 + specialisedHullCostModifier))
  const armourRule = shipHullArmourRules.find((rule) => rule.id === input.armourTypeId)
  const armourProtection = positive(input.armourProtection)
  const armourMaximumProtection = armourRule
    ? shipArmourMaximumProtectionFor(armourRule, techLevel, hasMilitaryHull)
    : 0
  const armour = armourRule && armourProtection > 0
    ? {
        rule: armourRule,
        protection: armourProtection,
        maximumProtection: armourMaximumProtection,
        tons: roundTons(shipTons
          * armourRule.tonsPercentPerProtection
          * armourProtection
          * shipArmourTonnageMultiplierFor(shipTons)
          * (1 + configuration.armourVolumeModifier)),
        costCredits: roundCredits(shipTons
          * armourRule.tonsPercentPerProtection
          * armourProtection
          * shipArmourTonnageMultiplierFor(shipTons)
          * (1 + configuration.armourVolumeModifier)
          * armourRule.costPerTonCredits),
      }
    : undefined
  const specialisedHullTypes = selectedSpecialisedRules.map((rule) => hullOptionResultFor(rule, shipTons))
  const additionalHullTypes = selectedAdditionalRules.map((rule) => hullOptionResultFor(rule, shipTons, 'option'))
  const hullOptions = selectedHullOptionRules.map((rule) => hullOptionResultFor(rule, shipTons))

  if (techLevel <= 0) issues.push(hullStepIssue('error', 'missing-tech-level', 'Shipyard Tech Level must be greater than 0.'))
  if (shipTons < phaseMinimumTons) issues.push(hullStepIssue('error', 'below-phase-minimum', `Phase 4 spacecraft must be at least ${phaseMinimumTons} tons.`))
  if (shipTons < HIGH_GUARD_MINIMUM_HULL_TONS) issues.push(hullStepIssue('error', 'below-hull-minimum', `High Guard hulls must be at least ${HIGH_GUARD_MINIMUM_HULL_TONS} tons.`))
  if (!configurationExists) issues.push(hullStepIssue('error', 'missing-configuration', 'Choose a hull configuration.'))
  if (isPlanetoid && (input.specialisedHullTypeIds.length || input.additionalHullTypeIds.length)) {
    issues.push(hullStepIssue('error', 'planetoid-hull-type-conflict', 'Planetoid and buffered planetoid hulls cannot use specialised or additional hull types.'))
  }
  if (hasMilitaryHull && shipTons <= 5000) issues.push(hullStepIssue('error', 'military-hull-tonnage', 'Military Hull can only be applied to capital ships greater than 5,000 tons.'))
  if (input.specialisedHullTypeIds.includes('non-gravity') && shipTons > 500000) issues.push(hullStepIssue('error', 'non-gravity-tonnage', 'Non-Gravity Hull is limited to ships of 500,000 tons or less.'))
  if (armourRule && armourProtection > 0 && techLevel < armourRule.minimumTechLevel) issues.push(hullStepIssue('error', 'armour-tech-level', `${armourRule.label} armour requires TL ${armourRule.minimumTechLevel}+.`))
  if (!armourRule && armourProtection > 0) issues.push(hullStepIssue('error', 'missing-armour-type', 'Choose an armour type before assigning armour Protection.'))
  if (armourRule && armourProtection > armourMaximumProtection) issues.push(hullStepIssue('error', 'armour-maximum-protection', `${armourRule.label} armour is limited to Protection ${armourMaximumProtection}.`))

  for (const rule of [...selectedSpecialisedRules, ...selectedAdditionalRules, ...selectedHullOptionRules]) {
    if (techLevel > 0 && techLevel < rule.minimumTechLevel) issues.push(hullStepIssue('error', `${rule.id}-tech-level`, `${rule.label} requires TL ${rule.minimumTechLevel}+.`))
  }

  const stealthOptionIds = input.hullOptionIds.filter((id) => id.startsWith('stealth-'))
  if (input.hullOptionIds.includes('reflec') && stealthOptionIds.length) issues.push(hullStepIssue('error', 'reflec-stealth-conflict', 'Reflec cannot be combined with Stealth.'))
  if (stealthOptionIds.length > 1) issues.push(hullStepIssue('error', 'multiple-stealth-options', 'Choose only one Stealth type.'))
  if (input.hullOptionIds.includes('solar-coating') && input.hullOptionIds.length > 1) issues.push(hullStepIssue('error', 'solar-coating-conflict', 'Solar Coating cannot be combined with other listed hull options.'))
  if (!armourRule && armourProtection <= 0) issues.push(hullStepIssue('warning', 'no-armour', 'No armour has been installed.'))
  if (configuration.streamlined === 'no') issues.push(hullStepIssue('warning', 'unstreamlined-hull', `${configuration.label} hulls cannot enter atmospheres safely without special handling.`))
  if (shipTons > 0 && shipTons % 100 !== 0) issues.push(hullStepIssue('warning', 'non-round-tonnage', 'High Guard recommends round hull tonnages for ease of calculation.'))
  for (const result of [...specialisedHullTypes, ...additionalHullTypes]) {
    if (result.tons <= 0 && result.costCredits <= 0) issues.push(hullStepIssue('warning', `${result.rule.id}-needs-sizing`, `${result.rule.label} requires additional sizing inputs before it can be fully costed.`))
  }

  const totalOptionTons = [...additionalHullTypes, ...hullOptions].reduce((total, result) => total + result.tons, armour?.tons ?? 0)
  const totalOptionCostCredits = [...additionalHullTypes, ...hullOptions].reduce((total, result) => total + result.costCredits, (armour?.costCredits ?? 0))
  const errors = issues.filter((issue) => issue.severity === 'error')
  const warnings = issues.filter((issue) => issue.severity === 'warning')

  return {
    input,
    isComplete: errors.length === 0,
    configuration,
    baseHullCostCredits: roundCredits(baseHullCostCredits),
    hullCostCredits,
    baseHullPoints,
    hullPoints,
    usableTons: roundTons(shipTons * (configuration.usableVolumePercent ?? 1)),
    armour,
    specialisedHullTypes,
    additionalHullTypes,
    hullOptions,
    totalOptionTons: roundTons(totalOptionTons),
    totalOptionCostCredits: roundCredits(totalOptionCostCredits),
    issues,
    errors,
    warnings,
  }
}

const component = (entry: TravellerShipComponent): TravellerShipComponent => ({
  traits: [],
  notes: [],
  ...entry,
  tons: roundTons(entry.tons),
})

const addComponent = (components: TravellerShipComponent[], entry: TravellerShipComponent) => {
  components.push(component(entry))
}

const componentCostCredits = (components: TravellerShipComponent[]) => components.reduce((total, entry) => total + costCredits(entry.cost), 0)
const componentTons = (components: TravellerShipComponent[]) => components.reduce((total, entry) => total + positive(entry.tons), 0)
const componentPowerDraw = (components: TravellerShipComponent[]) => components.reduce((total, entry) => total + positive(entry.powerDraw ?? 0), 0)
const componentHardpoints = (components: TravellerShipComponent[]) => components.reduce((total, entry) => total + positive(entry.hardpointsUsed ?? 0), 0)

const crewReductionMultiplierFor = (shipTons: number) => {
  return shipLargeCrewReductionRules.find((rule) => (
    shipTons >= rule.minimumTons && (rule.maximumTons === null || shipTons <= rule.maximumTons)
  ))?.multiplier ?? 1
}

const reducedCrew = (count: number, multiplier: number) => Math.ceil(positive(count) * multiplier)
const sumAccommodationCapacity = (design: CustomShipDesign) => {
  return design.accommodations.reduce((total, accommodation) => {
    if (['stateroom', 'high-stateroom', 'luxury-stateroom', 'psion-stateroom'].includes(accommodation.type)) return total + positive(accommodation.count)
    if (accommodation.type === 'other') return total + positive(accommodation.count)
    return total
  }, 0)
}

const calculateCrewRoles = (
  design: CustomShipDesign,
  driveTons: number,
  powerPlantTons: number,
  weaponSystems: typeof design.weaponSystems,
  screenSystems: typeof design.screenSystems,
) => {
  if (design.crewRoles.length) return design.crewRoles

  const mode: TravellerShipCrewMode = design.buildBrief.crewMode
  const shipTons = positive(design.tons)
  const multiplier = crewReductionMultiplierFor(shipTons)
  const jumpDriveInstalled = positive(design.drives.jumpDriveRating) > 0
  const weaponCrewBasis = weaponSystems.reduce((total, weapon) => total + positive(weapon.hardpointsUsed ?? weapon.count), 0) + componentHardpoints(screenSystems)

  const roles: TravellerShipCrewRole[] = [
    { role: 'Captain', count: 1, salaryCredits: 10000, mode },
    { role: 'Pilot', skill: 'Pilot', count: mode === 'military' ? 3 : 1, salaryCredits: 6000, mode },
  ]

  if (jumpDriveInstalled) roles.push({ role: 'Astrogator', skill: 'Astrogation', count: 1, salaryCredits: 5000, mode })

  roles.push(
    { role: 'Engineer', skill: 'Engineer', count: reducedCrew((driveTons + powerPlantTons) / 35, multiplier), salaryCredits: 4000, mode },
    { role: 'Maintenance', skill: 'Mechanic', count: reducedCrew(shipTons / (mode === 'military' ? 500 : 1000), multiplier), salaryCredits: 1000, mode },
    { role: 'Gunner', skill: 'Gunner', count: reducedCrew(weaponCrewBasis, multiplier), salaryCredits: 2000, mode, note: 'Initial estimate based on weapon and screen hardpoint use; bay and spinal crewing need weapon-class detail.' },
    { role: 'Administrator', skill: 'Admin', count: reducedCrew(shipTons / (mode === 'military' ? 1000 : 2000), multiplier), salaryCredits: 1500, mode },
    { role: 'Sensor Operator', skill: 'Electronics (sensors)', count: reducedCrew((shipTons / 7500) * (mode === 'military' ? 3 : 1), multiplier), salaryCredits: 4000, mode },
  )

  const crewBeforeMedicalAndOfficers = roles.reduce((total, role) => total + role.count, 0)
  const medics = Math.ceil(crewBeforeMedicalAndOfficers / 120)
  if (medics > 0) roles.push({ role: 'Medic', skill: 'Medic', count: medics, salaryCredits: 4000, mode })

  const crewBeforeOfficers = roles.reduce((total, role) => total + role.count, 0)
  const officerDivisor = mode === 'military' ? 10 : 20
  const officers = Math.floor(crewBeforeOfficers / officerDivisor)
  if (officers > 0) roles.push({ role: 'Officer', skill: 'Leadership or Persuade', count: officers, salaryCredits: 5000, mode })

  return roles.filter((role) => role.count > 0)
}

export const shipConstructionSummary = (design: CustomShipDesign): ShipConstructionSummary => {
  const notes: string[] = []
  const components: TravellerShipComponent[] = []
  const shipTons = positive(design.tons)
  const shipTl = positive(design.techLevel ?? design.buildBrief.shipyardTechLevel)
  const hullStep = calculateHullStep({
    shipTons,
    techLevel: shipTl,
    configurationId: design.hull.configuration,
    armourTypeId: design.hull.armourType,
    armourProtection: design.hull.armourProtection,
    specialisedHullTypeIds: design.hull.specialisedHullTypes,
    additionalHullTypeIds: design.hull.additionalHullTypes,
    hullOptionIds: design.hull.hullOptions,
  })
  const hullConfiguration = hullStep.configuration

  for (const result of hullStep.additionalHullTypes) {
    if (result.tons || result.costCredits) {
      addComponent(components, {
        id: `hull-additional-${result.rule.id}`,
        kind: 'hull-option',
        name: result.rule.label,
        tons: result.tons,
        cost: costFromCredits(result.costCredits),
        placementPolicy: 'distributed',
        notes: [result.rule.notes],
      })
    }
  }

  addComponent(components, {
    id: 'hull',
    kind: 'hull',
    name: `${hullConfiguration.label} Hull`,
    tons: 0,
    cost: costFromCredits(hullStep.hullCostCredits),
    placementPolicy: 'abstract',
    notes: [
      `${shipTons.toLocaleString()} ton hull.`,
      hullConfiguration.notes ?? '',
    ].filter(Boolean),
  })

  if (hullStep.armour) {
    addComponent(components, {
      id: 'armour',
      kind: 'armour',
      name: `${hullStep.armour.rule.label} Armour +${hullStep.armour.protection}`,
      techLevel: hullStep.armour.rule.minimumTechLevel,
      tons: hullStep.armour.tons,
      cost: costFromCredits(hullStep.armour.costCredits),
      placementPolicy: 'distributed',
      notes: hullStep.armour.rule.notes ? [hullStep.armour.rule.notes] : [],
    })
  }

  for (const result of hullStep.hullOptions) {
    addComponent(components, {
      id: `hull-option-${result.rule.id}`,
      kind: 'hull-option',
      name: result.rule.label,
      techLevel: result.rule.minimumTechLevel,
      tons: result.tons,
      cost: costFromCredits(result.costCredits),
      powerDraw: result.rule.power,
      placementPolicy: result.rule.tonsPercent ? 'distributed' : 'abstract',
      notes: [result.rule.notes],
    })
  }

  const manoeuvreRule = driveRuleFor(shipManoeuvreDriveRules, positive(design.drives.manoeuvreDriveRating))
  const reactionRule = driveRuleFor(shipReactionDriveRules, positive(design.drives.reactionDriveRating))
  const activeThrustRule = design.drives.usesReactionDrive ? reactionRule : manoeuvreRule
  const activeDriveTons = shipTons * activeThrustRule.hullPercent
  const activeDriveCostMCr = activeDriveTons * (design.drives.usesReactionDrive ? SHIP_REACTION_DRIVE_COST_PER_TON_MCR : SHIP_MANOEUVRE_DRIVE_COST_PER_TON_MCR)

  addComponent(components, {
    id: design.drives.usesReactionDrive ? 'reaction-drive' : 'manoeuvre-drive',
    kind: design.drives.usesReactionDrive ? 'reaction-drive' : 'm-drive',
    name: `${design.drives.usesReactionDrive ? 'Reaction' : 'Manoeuvre'} Drive-${activeThrustRule.rating}`,
    techLevel: activeThrustRule.minimumTechLevel,
    tons: activeDriveTons,
    cost: costFromCredits(mcrToCredits(activeDriveCostMCr)),
    placementPolicy: 'required-area',
  })
  if (shipTl < activeThrustRule.minimumTechLevel) notes.push(`${design.drives.usesReactionDrive ? 'Reaction' : 'Manoeuvre'} Drive-${activeThrustRule.rating} requires TL ${activeThrustRule.minimumTechLevel}+.`)

  const jumpRule = jumpRuleFor(positive(design.drives.jumpDriveRating))
  const jumpDriveTons = jumpRule ? Math.max(jumpRule.minimumTons, (shipTons * jumpRule.hullPercent) + jumpRule.flatTons) : 0
  if (jumpRule) {
    addComponent(components, {
      id: 'jump-drive',
      kind: 'j-drive',
      name: `Jump Drive-${jumpRule.rating}`,
      techLevel: jumpRule.minimumTechLevel,
      tons: jumpDriveTons,
      cost: costFromCredits(mcrToCredits(jumpDriveTons * SHIP_JUMP_DRIVE_COST_PER_TON_MCR)),
      placementPolicy: 'required-area',
    })
    if (shipTl < jumpRule.minimumTechLevel) notes.push(`Jump Drive-${jumpRule.rating} requires TL ${jumpRule.minimumTechLevel}+.`)
  }

  const powerPlant = shipPowerPlantRuleFor(design.powerPlant.type)
  const powerPlantTons = positive(design.powerPlant.tons)
  addComponent(components, {
    id: 'power-plant',
    kind: 'power-plant',
    name: powerPlant.label,
    techLevel: powerPlant.minimumTechLevel,
    tons: powerPlantTons,
    cost: costFromCredits(mcrToCredits(powerPlantTons * powerPlant.costPerTonMCr)),
    powerOutput: powerPlantTons * powerPlant.powerPerTon,
    placementPolicy: 'required-area',
  })
  if (shipTl < powerPlant.minimumTechLevel) notes.push(`${powerPlant.label} requires TL ${powerPlant.minimumTechLevel}+.`)
  if (jumpRule && !powerPlant.jumpCapable) notes.push(`${powerPlant.label} cannot power a jump drive.`)
  if (powerPlantTons <= 0) notes.push('A spacecraft requires a power plant with positive tonnage.')

  const jumpFuelTons = jumpRule ? shipTons * 0.1 * jumpRule.rating : 0
  const reactionFuelTons = design.drives.usesReactionDrive ? shipTons * 0.025 * reactionRule.rating * positive(design.fuel.reactionFuelHours) : 0
  const powerPlantFuelTons = powerPlant.id === 'chemical-tl7'
    ? powerPlantTons * 10 * (positive(design.fuel.powerPlantEnduranceWeeks || 2) / 2)
    : Math.ceil(powerPlantTons * 0.1) * (positive(design.fuel.powerPlantEnduranceWeeks || 4) / 4)
  const totalFuelTons = jumpFuelTons + reactionFuelTons + powerPlantFuelTons

  if (totalFuelTons > 0) {
    addComponent(components, {
      id: 'fuel',
      kind: 'fuel',
      name: 'Fuel Tanks',
      tons: totalFuelTons,
      cost: costFromCredits(0),
      placementPolicy: 'required-area',
      notes: [`Jump ${roundTons(jumpFuelTons)} tons; reaction ${roundTons(reactionFuelTons)} tons; power plant ${roundTons(powerPlantFuelTons)} tons.`],
    })
  }

  const bridgeTons = design.bridge.smallerBridge ? shipBridgeTonsFor(shipTons) / 2 : shipBridgeTonsFor(shipTons)
  const bridgeCostCredits = mcrToCredits(Math.ceil(shipTons / 100) * 0.5) * (design.bridge.smallerBridge ? 0.5 : 1)
  addComponent(components, {
    id: 'bridge',
    kind: 'bridge',
    name: design.bridge.commandBridge ? 'Command Bridge' : 'Bridge',
    tons: bridgeTons + (design.bridge.commandBridge ? 40 : 0),
    cost: costFromCredits(bridgeCostCredits + (design.bridge.commandBridge ? mcrToCredits(30) : 0)),
    placementPolicy: 'required-area',
    notes: design.bridge.smallerBridge ? ['Smaller bridge: DM-1 to spacecraft operations checks made from the bridge.'] : [],
  })

  const computer = shipComputerRuleFor(design.computer.model)
  const backupComputer = shipComputerRules.find((rule) => rule.id === design.computer.backupModel)
  const computerOptionMultiplier = 1
    + (design.computer.jumpControlSpecialisation ? 0.5 : 0)
    + (design.computer.hardenedSystems ? 0.5 : 0)
  addComponent(components, {
    id: 'computer',
    kind: 'computer',
    name: computer.label,
    techLevel: computer.minimumTechLevel,
    tons: 0,
    cost: costFromCredits(mcrToCredits(computer.costMCr * computerOptionMultiplier)),
    placementPolicy: 'distributed',
  })
  if (shipTl < computer.minimumTechLevel) notes.push(`${computer.label} requires TL ${computer.minimumTechLevel}+.`)
  if (backupComputer) {
    addComponent(components, {
      id: 'backup-computer',
      kind: 'computer',
      name: `${backupComputer.label} Backup`,
      techLevel: backupComputer.minimumTechLevel,
      tons: 0,
      cost: costFromCredits(mcrToCredits(backupComputer.costMCr)),
      placementPolicy: 'distributed',
    })
    if (shipTl < backupComputer.minimumTechLevel) notes.push(`${backupComputer.label} backup requires TL ${backupComputer.minimumTechLevel}+.`)
  }

  const sensors = shipSensorRuleFor(design.sensors.type)
  addComponent(components, {
    id: 'sensors',
    kind: 'sensor',
    name: `${sensors.label} Sensors`,
    techLevel: sensors.minimumTechLevel,
    tons: sensors.tons,
    cost: costFromCredits(mcrToCredits(sensors.costMCr)),
    powerDraw: sensors.power,
    placementPolicy: sensors.tons > 0 ? 'required-area' : 'distributed',
    notes: [`Electronics DM ${sensors.dm >= 0 ? '+' : ''}${sensors.dm}; ${sensors.suite.join(', ')}.`],
  })
  if (shipTl < sensors.minimumTechLevel) notes.push(`${sensors.label} sensors require TL ${sensors.minimumTechLevel}+.`)

  for (const weapon of design.weaponSystems) {
    addComponent(components, {
      id: `weapon-${weapon.id}`,
      kind: 'weapon',
      name: weapon.name,
      tons: weapon.tons,
      cost: weapon.cost,
      powerDraw: weapon.power,
      hardpointsUsed: weapon.hardpointsUsed ?? weapon.count,
      placementPolicy: 'exterior',
      traits: weapon.traits,
      notes: [weapon.mount, weapon.ammunition ?? ''].filter(Boolean),
    })
  }

  for (const entry of [...design.screenSystems, ...design.optionSystems]) addComponent(components, entry)

  for (const accommodation of design.accommodations) {
    addComponent(components, {
      id: `accommodation-${accommodation.id}`,
      kind: 'accommodation',
      name: accommodation.label,
      tons: accommodation.count * accommodation.tonsEach,
      cost: accommodation.cost,
      powerDraw: accommodation.powerDraw,
      placementPolicy: 'required-area',
      notes: accommodation.notes,
    })
  }

  for (const cargo of design.cargoEntries) {
    addComponent(components, {
      id: `cargo-${cargo.id}`,
      kind: 'cargo',
      name: cargo.label,
      tons: cargo.tons,
      cost: costFromCredits(0),
      placementPolicy: 'derived-area',
      notes: cargo.notes,
    })
  }

  const driveTons = activeDriveTons + jumpDriveTons
  const crewRoles = calculateCrewRoles(design, driveTons, powerPlantTons, design.weaponSystems, design.screenSystems)
  const crewCount = crewRoles.reduce((total, role) => total + role.count, 0)
  const softwareBandwidthUsed = design.software.reduce((total, item) => total + positive(item.bandwidth), 0)
  const softwareCostCredits = design.software.reduce((total, item) => total + costCredits(item.cost), 0)
  const hardpoints: TravellerShipHardpointProfile = {
    available: Math.floor(shipTons / 100),
    used: componentHardpoints(components),
    remaining: Math.floor(shipTons / 100) - componentHardpoints(components),
  }
  const bandwidth: TravellerShipBandwidthProfile = {
    available: computer.processing,
    used: softwareBandwidthUsed,
    remaining: computer.processing - softwareBandwidthUsed,
    jumpControlIncluded: Boolean(computer.isCore),
  }
  const fuel: TravellerShipFuelProfile = {
    jumpFuelTons: roundTons(jumpFuelTons),
    reactionFuelTons: roundTons(reactionFuelTons),
    powerPlantFuelTons: roundTons(powerPlantFuelTons),
    totalFuelTons: roundTons(totalFuelTons),
    enduranceWeeks: design.fuel.powerPlantEnduranceWeeks,
  }
  const powerOutput = powerPlantTons * powerPlant.powerPerTon
  const basicSystemsPower = shipTons * 0.2 * (design.hull.specialisedHullTypes.includes('non-gravity') ? 0.5 : 1)
  const manoeuvrePower = design.drives.usesReactionDrive ? 0 : shipTons * 0.1 * (activeThrustRule.rating === 0 ? 0.25 : activeThrustRule.rating)
  const jumpPower = jumpRule ? shipTons * 0.1 * jumpRule.rating : 0
  const weaponsPower = design.weaponSystems.reduce((total, weapon) => total + positive(weapon.power), 0)
  const screensPower = componentPowerDraw(design.screenSystems)
  const optionsPower = componentPowerDraw(design.optionSystems)
  const power: TravellerShipPowerProfile = {
    output: roundTons(powerOutput),
    basicSystems: roundTons(basicSystemsPower),
    manoeuvre: roundTons(manoeuvrePower),
    jump: roundTons(jumpPower),
    sensors: roundTons(sensors.power),
    weapons: roundTons(weaponsPower),
    screens: roundTons(screensPower),
    options: roundTons(optionsPower),
    totalRoutine: roundTons(basicSystemsPower + manoeuvrePower + sensors.power + optionsPower),
    totalJump: roundTons(basicSystemsPower + jumpPower + sensors.power + optionsPower),
    totalCombat: roundTons(basicSystemsPower + manoeuvrePower + sensors.power + weaponsPower + screensPower + optionsPower),
    surplusRoutine: roundTons(powerOutput - (basicSystemsPower + manoeuvrePower + sensors.power + optionsPower)),
    surplusJump: roundTons(powerOutput - (basicSystemsPower + jumpPower + sensors.power + optionsPower)),
    surplusCombat: roundTons(powerOutput - (basicSystemsPower + manoeuvrePower + sensors.power + weaponsPower + screensPower + optionsPower)),
  }
  const tonsUsed = componentTons(components)
  const cargoTons = design.cargoEntries.reduce((total, cargo) => total + positive(cargo.tons), 0)
  const hasNegativeCargo = design.cargoEntries.some((cargo) => cargo.tons < 0)
  const totalCostCredits = componentCostCredits(components) + softwareCostCredits
  const standardDesignDiscountCredits = design.buildBrief.designMode === 'standard' ? totalCostCredits * 0.1 : 0
  const purchaseCostCredits = totalCostCredits - standardDesignDiscountCredits
  const costs: TravellerShipCostProfile = {
    total: costFromCredits(totalCostCredits),
    purchase: costFromCredits(purchaseCostCredits),
    standardDesignDiscountCredits: roundCredits(standardDesignDiscountCredits),
    monthlyMaintenanceCredits: roundCredits(purchaseCostCredits / 12000),
    notes: design.buildBrief.designMode === 'standard' ? ['Standard designs receive a 10% purchase discount before maintenance is calculated.'] : [],
  }
  const derived: TravellerShipDerivedProfile = {
    hullPoints: hullStep.hullPoints,
    tonsUsed: roundTons(tonsUsed),
    tonsRemaining: roundTons(shipTons - tonsUsed),
    cargoTons: roundTons(cargoTons),
    power,
    fuel,
    hardpoints,
    bandwidth,
    crewCount,
    notes,
  }

  notes.push(...hullStep.issues.map((issue) => issue.message))
  if (derived.tonsRemaining < 0) notes.push(`Design exceeds hull capacity by ${Math.abs(derived.tonsRemaining)} tons.`)
  if (hasNegativeCargo) notes.push('Cargo tonnage cannot be negative.')
  if (hardpoints.remaining < 0) notes.push(`Design exceeds hardpoint capacity by ${Math.abs(hardpoints.remaining)}.`)
  if (bandwidth.remaining < 0) notes.push(`Software bandwidth exceeds computer capacity by ${Math.abs(bandwidth.remaining)}.`)
  if (power.surplusRoutine < 0) notes.push('Routine Power demand exceeds power plant output.')
  if (power.surplusJump < 0) notes.push('Jump Power demand exceeds power plant output.')
  if (power.surplusCombat < 0) notes.push('Combat Power demand exceeds power plant output.')
  if (jumpRule && jumpFuelTons <= 0) notes.push('Jump-capable ships must allocate jump fuel.')
  if (design.fuel.powerPlantEnduranceWeeks <= 0) notes.push('Power plant endurance must be at least 1 week.')
  if (bridgeTons <= 0) notes.push('A spacecraft requires a bridge.')
  if (design.bridge.smallerBridge && shipTons < HIGH_GUARD_MINIMUM_SPACECRAFT_TONS) notes.push('Smaller bridge rules are not intended for Phase 4 small craft.')

  const stateroomCapacity = sumAccommodationCapacity(design)
  if (stateroomCapacity > 0 && stateroomCapacity < crewCount) notes.push(`Crew requires ${crewCount} stateroom capacity; current accommodations provide ${stateroomCapacity}.`)
  if (!design.accommodations.length) notes.push('No accommodations have been assigned yet.')

  return {
    components,
    costs,
    derived,
    crewRoles,
    validationNotes: notes,
  }
}
