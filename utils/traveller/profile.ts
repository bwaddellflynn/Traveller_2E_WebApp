import type { TravellerCharacteristic, TravellerCharacteristicId, TravellerProfile, TravellerProfileSource } from '~/types/traveller'

export const LOCAL_USER_ID = 'local-user'
export const TRAVELLER_PROFILE_SCHEMA_VERSION = 1

const characteristicNames: Record<TravellerCharacteristicId, { name: string, abbreviation: string, category: string }> = {
  str: { name: 'Strength', abbreviation: 'STR', category: 'physical' },
  dex: { name: 'Dexterity', abbreviation: 'DEX', category: 'physical' },
  end: { name: 'Endurance', abbreviation: 'END', category: 'physical' },
  int: { name: 'Intellect', abbreviation: 'INT', category: 'mental' },
  edu: { name: 'Education', abbreviation: 'EDU', category: 'mental' },
  soc: { name: 'Social Standing', abbreviation: 'SOC', category: 'social' },
  psi: { name: 'Psionic Strength', abbreviation: 'PSI', category: 'psionic' },
}

export const blankCharacteristic = (id: TravellerCharacteristicId): TravellerCharacteristic => ({
  id,
  ...characteristicNames[id],
  value: 7,
  dm: 0,
})

export const makeProfileId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `traveller-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export const createBlankTravellerProfile = (source: TravellerProfileSource = 'manual', userId = LOCAL_USER_ID): TravellerProfile => {
  const now = new Date().toISOString()

  return {
    id: makeProfileId(),
    userId,
    schemaVersion: TRAVELLER_PROFILE_SCHEMA_VERSION,
    source,
    createdAt: now,
    updatedAt: now,
    identity: {
      name: 'Unnamed Traveller',
      title: '',
      age: 18,
      species: 'Human',
      homeworld: '',
      traits: '',
      distinguishingFeatures: '',
      portraitDataUrl: '',
    },
    characteristics: {
      str: blankCharacteristic('str'),
      dex: blankCharacteristic('dex'),
      end: blankCharacteristic('end'),
      int: blankCharacteristic('int'),
      edu: blankCharacteristic('edu'),
      soc: blankCharacteristic('soc'),
      psi: { ...blankCharacteristic('psi'), value: 0, dm: 0 },
    },
    skills: [],
    careers: [],
    associates: {
      allies: [],
      contacts: [],
      rivals: [],
      enemies: [],
      other: [],
    },
    equipment: [],
    weapons: [],
    armour: [],
    augments: [],
    finances: {
      cashOnHand: 0,
      monthlyCashFlow: '',
      income: '',
      livingCosts: '',
      debt: 0,
      annualPension: '',
      shipPayments: '',
      shipShares: 0,
    },
    wounds: [],
    psionics: {
      permissionSources: [],
      psiScore: null,
      psiDm: 0,
      tested: false,
      talents: [],
      talentAttempts: [],
      trainingCost: 0,
    },
    benefits: {
      earnedRolls: 0,
      adjustments: 0,
      availableRolls: 0,
      spentRolls: 0,
      remainingRolls: 0,
      cashRollsUsed: 0,
      cashRollLimit: 3,
      personal: [],
      musteringOut: [],
    },
    history: {
      background: '',
      notes: '',
      events: [],
    },
    metadata: {
      pdfTemplate: 'Character Sheet 2026_fillable.pdf',
      creatorComplete: source === 'manual' ? false : true,
    },
  }
}

export const cloneTravellerProfile = (profile: TravellerProfile): TravellerProfile => {
  return JSON.parse(JSON.stringify(profile)) as TravellerProfile
}
