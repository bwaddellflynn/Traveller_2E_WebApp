export type TravellerShipSourceId =
  | 'mgt2e-core-2022'
  | 'mgt2e-high-guard-2022'
  | 'mgt2e-element-class-cruisers'

export type TravellerShipCategory =
  | 'merchant'
  | 'civilian'
  | 'military'
  | 'courier'
  | 'exploration'
  | 'luxury'
  | 'cruiser'
  | 'other'

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
}
