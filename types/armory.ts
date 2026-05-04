export type TravellerArmorySourceId = 'mgt2e-core-2022' | 'mgt2e-csc' | 'mgt2e-field-catalogue'

export type TravellerArmorCategory = 'standard' | 'environment' | 'combat' | 'battle-dress' | 'clothing' | 'subdermal' | 'other'

export type TravellerEquipmentCategory =
  | 'communications'
  | 'computers'
  | 'medical'
  | 'drugs'
  | 'sensors'
  | 'survival'
  | 'tools'
  | 'support'
  | 'software'
  | 'other'

export type TravellerArmorRecord = {
  id: string
  name: string
  sourceId: TravellerArmorySourceId
  sourceName?: string
  sourcePage?: number
  category: TravellerArmorCategory
  protection: string
  techLevel: number | null
  radiationProtection: string | null
  massKg: number | null
  costCredits: number | null
  requiredSkill: string | null
  traits: string[]
  notes?: string
}

export type TravellerEquipmentRecord = {
  id: string
  name: string
  sourceId: TravellerArmorySourceId
  sourceName?: string
  sourcePage?: number
  category: TravellerEquipmentCategory
  techLevel: number | null
  massKg: number | null
  costCredits: number | null
  effect: string
  traits: string[]
  notes?: string
}
