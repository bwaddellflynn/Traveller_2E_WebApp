export type TravellerWeaponSourceId = 'mgt2e-core-2022' | 'mgt2e-csc' | 'mgt2e-field-catalogue' | 'custom'

export type TravellerWeaponCategory = 'melee' | 'slug' | 'energy' | 'grenade' | 'heavy' | 'support' | 'explosive' | 'other'

export type TravellerWeaponScale = 'personal' | 'support' | 'vehicle' | 'spacecraft'

export type TravellerWeaponFamily =
  | 'melee'
  | 'sidearm'
  | 'longarm'
  | 'shotgun'
  | 'support'
  | 'heavy'
  | 'launcher'
  | 'grenade'
  | 'charge'
  | 'energy-sidearm'
  | 'energy-longarm'

export type TravellerWeaponIconName =
  | 'weapon-melee'
  | 'weapon-sidearm'
  | 'weapon-longarm'
  | 'weapon-shotgun'
  | 'weapon-support'
  | 'weapon-heavy'
  | 'weapon-launcher'
  | 'weapon-grenade'
  | 'weapon-charge'
  | 'weapon-energy-sidearm'
  | 'weapon-energy-longarm'

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
  family?: TravellerWeaponFamily
  iconName?: TravellerWeaponIconName
}

export type CustomWeaponDesign = TravellerWeaponRecord & {
  userId: string
  createdAt: string
  updatedAt: string
  design: {
    rulesSource: TravellerWeaponSourceId
    targetTechLevel: number | null
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
