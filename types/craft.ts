export type TravellerCraftSourceId =
  | 'mgt2e-core-2022'
  | 'mgt2e-small-craft-catalogue'
  | 'mgt2e-high-guard-2022'

export type TravellerCraftCategory =
  | 'commercial'
  | 'working'
  | 'fighter'
  | 'military'
  | 'luxury'
  | 'alien'
  | 'module'
  | 'other'

export type TravellerCraftRecord = {
  id: string
  name: string
  sourceId: TravellerCraftSourceId
  sourceName?: string
  sourcePage?: number
  category: TravellerCraftCategory
  role: string
  tons: number
  techLevel: number | null
  thrust: string
  crew: string
  passengers: string
  costCredits: number | null
  cost: string
  traits: string[]
  description: string
  notes?: string
}
