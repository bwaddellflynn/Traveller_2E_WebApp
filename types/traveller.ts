export type TravellerProfileSource = 'lifepath' | 'manual' | 'imported'

export type TravellerCharacteristicId = 'str' | 'dex' | 'end' | 'int' | 'edu' | 'soc' | 'psi'

export type TravellerCharacteristic = {
  id: TravellerCharacteristicId
  name: string
  abbreviation: string
  category: string
  value: number
  dm: number
}

export type TravellerSkill = {
  id: string
  name: string
  speciality?: string
  level: number
  sources: string[]
  notes?: string
}

export type TravellerRollRecord = {
  label: string
  dice: number[]
  dm: number
  total: number
  target: number
  effect: number
  success: boolean
  source: 'rolled' | 'manual' | 'automatic'
  overridden?: boolean
  finalSuccess?: boolean
  notes?: string
}

export type TravellerTermRecord = {
  termNumber: number
  path: 'career' | 'education'
  careerId?: string
  assignmentId?: string
  educationId?: string
  rank?: number
  title?: string
  startAge: number
  endAge: number
  summary: string
  details: string[]
  rolls: TravellerRollRecord[]
}

export type TravellerAssociate = {
  id: string
  source: string
  type: string
  name: string
  notes?: string
  context?: string
  tags?: string[]
}

export type TravellerNarrativeEvent = {
  id: string
  source: string
  title: string
  category?: string
  text?: string
  notes?: string
}

export type TravellerSkillTrainingActive = {
  id: string
  skillId: string
  skillName: string
  speciality?: string
  targetLevel: number
  characteristic: 'edu' | 'str' | 'dex' | 'end'
  completedWeeks: number
  successfulStudyPeriods: number
  failedStudyPeriods: number
  requiredStudyPeriods: number
  startedAt: string
  lastRoll?: TravellerRollRecord
  notes?: string
}

export type TravellerSkillTrainingHistory = {
  id: string
  skillId: string
  skillName: string
  speciality?: string
  targetLevel: number
  outcome: 'completed' | 'failed' | 'cancelled'
  successfulStudyPeriods: number
  failedStudyPeriods: number
  completedWeeks: number
  completedAt: string
  notes?: string
}

export type TravellerProfile = {
  id: string
  userId: string
  schemaVersion: number
  source: TravellerProfileSource
  createdAt: string
  updatedAt: string
  identity: {
    name: string
    title: string
    age: number
    species: string
    gender: string
    homeworld: string
    traits: string
    distinguishingFeatures: string
    portraitDataUrl?: string
  }
  characteristics: Record<TravellerCharacteristicId, TravellerCharacteristic>
  skills: TravellerSkill[]
  careers: TravellerTermRecord[]
  associates: {
    allies: TravellerAssociate[]
    contacts: TravellerAssociate[]
    rivals: TravellerAssociate[]
    enemies: TravellerAssociate[]
    other: TravellerAssociate[]
  }
  equipment: Array<{
    id: string
    name: string
    techLevel?: string
    kg?: string
    traits?: string
    notes?: string
  }>
  weapons: Array<{
    id: string
    name: string
    skill?: string
    speciality?: string
    techLevel?: string
    range?: string
    damage?: string
    kg?: string
    magazine?: string
    traits?: string
    notes?: string
  }>
  attacks: Array<{
    id: string
    weaponId?: string
    label?: string
    skill?: string
    speciality?: string
    damage?: string
    notes?: string
  }>
  armour: Array<{
    id: string
    name: string
    type?: string
    techLevel?: string
    protection?: string
    radiationProtection?: string
    kg?: string
    options?: string
    traits?: string
    notes?: string
  }>
  augments: Array<{
    id: string
    name: string
    type?: string
    techLevel?: string
    traits?: string
    notes?: string
  }>
  finances: {
    cashOnHand: number
    monthlyCashFlow: string
    income: string
    livingCosts: string
    debt: number
    annualPension: string
    shipPayments: string
    shipShares: number
  }
  wounds: Array<{
    id: string
    type: string
    location: string
    recoveryPeriod: string
    notes: string
  }>
  psionics: {
    permissionSources: string[]
    psiScore: number | null
    psiDm: number
    tested: boolean
    talents: Array<{ id: string; name: string; learningDm: number }>
    talentAttempts: unknown[]
    trainingCost: number
  }
  benefits: {
    earnedRolls: number
    adjustments: number
    availableRolls: number
    spentRolls: number
    remainingRolls: number
    cashRollsUsed: number
    cashRollLimit: number
    personal: string[]
    musteringOut: unknown[]
  }
  training: {
    active: TravellerSkillTrainingActive | null
    history: TravellerSkillTrainingHistory[]
  }
  history: {
    background: string
    notes: string
    events: TravellerNarrativeEvent[]
  }
  metadata: {
    pdfTemplate?: string
    creatorComplete: boolean
    lastOpenedAt?: string
  }
}
