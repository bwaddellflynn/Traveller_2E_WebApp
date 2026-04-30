export type TravellerWeaponSourceId = 'mgt2e-core-2022' | 'mgt2e-csc' | 'mgt2e-field-catalogue' | 'custom'

export type TravellerWeaponCategory = 'melee' | 'slug' | 'energy' | 'grenade' | 'heavy' | 'support' | 'explosive' | 'other'

export type TravellerWeaponScale = 'personal' | 'support' | 'vehicle' | 'spacecraft'

export type TravellerWeaponRecord = {
  id: string
  name: string
  sourceId: TravellerWeaponSourceId
  sourceName?: string
  sourcePage?: number
  category: TravellerWeaponCategory
  scale: TravellerWeaponScale
  skill?: string
  speciality?: string
  techLevel: number | null
  range: string
  damage: string
  massKg: number | null
  costCredits: number | null
  magazine: string
  magazineCostCredits: number | null
  traits: string[]
  description?: string
  tags?: string[]
}

export type CustomWeaponDesign = TravellerWeaponRecord & {
  userId: string
  createdAt: string
  updatedAt: string
  design: {
    rulesSource: TravellerWeaponSourceId
    weaponType: string
    mechanism: string
    receiverFeatures: string[]
    receiverType: string
    ammunitionType: string
    specialAmmunition: string
    capacityModifierPercent: number
    barrel: string
    heavyBarrel: boolean
    furniture: string
    feedDevice: string
    accessories: string[]
    notes: string
  }
}
