export type TravellerRobotSourceId =
  | 'mgt2e-robot-handbook'

export type TravellerRobotCategory =
  | 'military'
  | 'service'
  | 'utility'
  | 'drone'
  | 'microbot'
  | 'nanorobot'
  | 'android'
  | 'biological-robot'
  | 'cyborg'
  | 'vehicle-brain'
  | 'ship-brain'
  | 'other'

export type TravellerRobotEntryType =
  | 'robot'
  | 'droid'
  | 'autodoc'
  | 'drone'
  | 'android'
  | 'biological-robot'
  | 'cyborg'
  | 'brain'
  | 'other'

export type TravellerRobotRecord = {
  id: string
  name: string
  sourceId: TravellerRobotSourceId
  sourceName?: string
  sourcePage?: number
  category: TravellerRobotCategory
  entryType: TravellerRobotEntryType
  techLevel: number
  locomotion: string
  speed: string
  hits: number | null
  costCredits: number | null
  cost: string
  endurance: string
  programming: string
  attacks: string[]
  manipulators: string
  skills: string[]
  traits: string[]
  options: string[]
  summary: string
  description: string
  notes?: string
}
