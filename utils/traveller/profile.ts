import type { TravellerCharacteristic, TravellerCharacteristicId, TravellerProfile, TravellerProfileSource } from '~/types/traveller'
import { normalizeTravellerSkillRecord } from '~/utils/traveller/skills'

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
      gender: '',
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

const stringOr = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback
const numberOr = (value: unknown, fallback = 0) => typeof value === 'number' && Number.isFinite(value) ? value : fallback
const booleanOr = (value: unknown, fallback = false) => typeof value === 'boolean' ? value : fallback
const arrayOr = <T>(value: unknown): T[] => Array.isArray(value) ? value as T[] : []
const objectOr = <T extends Record<string, unknown>>(value: unknown, fallback: T): T => {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as T : fallback
}

export const normalizeTravellerProfile = (
  input: unknown,
  source: TravellerProfileSource = 'manual',
  userId = LOCAL_USER_ID,
): TravellerProfile => {
  const value = objectOr(input, {} as Record<string, unknown>)
  const normalizedSource = (['lifepath', 'manual', 'imported'] as const).includes(value.source as TravellerProfileSource)
    ? value.source as TravellerProfileSource
    : source
  const profile = createBlankTravellerProfile(normalizedSource, stringOr(value.userId, userId))
  const identity = objectOr(value.identity, {} as Record<string, unknown>)
  const characteristics = objectOr(value.characteristics, {} as Record<string, unknown>)
  const associates = objectOr(value.associates, {} as Record<string, unknown>)
  const finances = objectOr(value.finances, {} as Record<string, unknown>)
  const psionics = objectOr(value.psionics, {} as Record<string, unknown>)
  const benefits = objectOr(value.benefits, {} as Record<string, unknown>)
  const history = objectOr(value.history, {} as Record<string, unknown>)
  const metadata = objectOr(value.metadata, {} as Record<string, unknown>)

  profile.id = stringOr(value.id, profile.id)
  profile.userId = stringOr(value.userId, profile.userId)
  profile.schemaVersion = numberOr(value.schemaVersion, TRAVELLER_PROFILE_SCHEMA_VERSION)
  profile.source = normalizedSource
  profile.createdAt = stringOr(value.createdAt, profile.createdAt)
  profile.updatedAt = stringOr(value.updatedAt, profile.updatedAt)

  profile.identity = {
    ...profile.identity,
    name: stringOr(identity.name, profile.identity.name),
    title: stringOr(identity.title, profile.identity.title),
    age: numberOr(identity.age, profile.identity.age),
    species: stringOr(identity.species, profile.identity.species),
    gender: stringOr(identity.gender, profile.identity.gender),
    homeworld: stringOr(identity.homeworld, profile.identity.homeworld),
    traits: stringOr(identity.traits, profile.identity.traits),
    distinguishingFeatures: stringOr(identity.distinguishingFeatures, profile.identity.distinguishingFeatures),
    portraitDataUrl: stringOr(identity.portraitDataUrl, profile.identity.portraitDataUrl ?? ''),
  }

  for (const id of Object.keys(profile.characteristics) as TravellerCharacteristicId[]) {
    const characteristic = objectOr(characteristics[id], {} as Record<string, unknown>)
    profile.characteristics[id] = {
      ...profile.characteristics[id],
      value: numberOr(characteristic.value, profile.characteristics[id].value),
      dm: numberOr(characteristic.dm, profile.characteristics[id].dm),
    }
  }

  profile.skills = arrayOr<Record<string, unknown>>(value.skills).map((skill, index) => normalizeTravellerSkillRecord({
    id: stringOr(skill.id, `skill-${index}`),
    name: stringOr(skill.name, 'Unknown Skill'),
    speciality: stringOr(skill.speciality, undefined as unknown as string),
    level: numberOr(skill.level, 0),
    sources: arrayOr<string>(skill.sources).map((entry) => stringOr(entry)).filter(Boolean),
    notes: stringOr(skill.notes, ''),
  }))

  profile.careers = arrayOr<Record<string, unknown>>(value.careers).map((career, index) => ({
    termNumber: numberOr(career.termNumber, index + 1),
    path: career.path === 'education' ? 'education' : 'career',
    careerId: stringOr(career.careerId, undefined as unknown as string),
    assignmentId: stringOr(career.assignmentId, undefined as unknown as string),
    educationId: stringOr(career.educationId, undefined as unknown as string),
    startAge: numberOr(career.startAge, 18),
    endAge: numberOr(career.endAge, 22),
    summary: stringOr(career.summary, ''),
    details: arrayOr<string>(career.details).map((entry) => stringOr(entry)).filter(Boolean),
    rolls: arrayOr<Record<string, unknown>>(career.rolls).map((roll) => ({
      label: stringOr(roll.label, ''),
      dice: arrayOr<number>(roll.dice).map((die) => numberOr(die, 0)),
      dm: numberOr(roll.dm, 0),
      total: numberOr(roll.total, 0),
      target: numberOr(roll.target, 0),
      effect: numberOr(roll.effect, 0),
      success: booleanOr(roll.success, false),
      source: roll.source === 'manual' || roll.source === 'automatic' ? roll.source : 'rolled',
      overridden: typeof roll.overridden === 'undefined' ? undefined : booleanOr(roll.overridden, false),
      finalSuccess: typeof roll.finalSuccess === 'undefined' ? undefined : booleanOr(roll.finalSuccess, false),
      notes: stringOr(roll.notes, ''),
    })),
  }))

  profile.associates = {
    allies: arrayOr<Record<string, unknown>>(associates.allies).map((associate, index) => ({
      id: stringOr(associate.id, `ally-${index}`),
      source: stringOr(associate.source, ''),
      type: stringOr(associate.type, 'ally'),
      name: stringOr(associate.name, ''),
      notes: stringOr(associate.notes, ''),
      context: stringOr(associate.context, ''),
      tags: arrayOr<string>(associate.tags).map((entry) => stringOr(entry)).filter(Boolean),
    })),
    contacts: arrayOr<Record<string, unknown>>(associates.contacts).map((associate, index) => ({
      id: stringOr(associate.id, `contact-${index}`),
      source: stringOr(associate.source, ''),
      type: stringOr(associate.type, 'contact'),
      name: stringOr(associate.name, ''),
      notes: stringOr(associate.notes, ''),
      context: stringOr(associate.context, ''),
      tags: arrayOr<string>(associate.tags).map((entry) => stringOr(entry)).filter(Boolean),
    })),
    rivals: arrayOr<Record<string, unknown>>(associates.rivals).map((associate, index) => ({
      id: stringOr(associate.id, `rival-${index}`),
      source: stringOr(associate.source, ''),
      type: stringOr(associate.type, 'rival'),
      name: stringOr(associate.name, ''),
      notes: stringOr(associate.notes, ''),
      context: stringOr(associate.context, ''),
      tags: arrayOr<string>(associate.tags).map((entry) => stringOr(entry)).filter(Boolean),
    })),
    enemies: arrayOr<Record<string, unknown>>(associates.enemies).map((associate, index) => ({
      id: stringOr(associate.id, `enemy-${index}`),
      source: stringOr(associate.source, ''),
      type: stringOr(associate.type, 'enemy'),
      name: stringOr(associate.name, ''),
      notes: stringOr(associate.notes, ''),
      context: stringOr(associate.context, ''),
      tags: arrayOr<string>(associate.tags).map((entry) => stringOr(entry)).filter(Boolean),
    })),
    other: arrayOr<Record<string, unknown>>(associates.other).map((associate, index) => ({
      id: stringOr(associate.id, `associate-${index}`),
      source: stringOr(associate.source, ''),
      type: stringOr(associate.type, 'other'),
      name: stringOr(associate.name, ''),
      notes: stringOr(associate.notes, ''),
      context: stringOr(associate.context, ''),
      tags: arrayOr<string>(associate.tags).map((entry) => stringOr(entry)).filter(Boolean),
    })),
  }

  profile.equipment = arrayOr<Record<string, unknown>>(value.equipment).map((item, index) => ({
    id: stringOr(item.id, `equipment-${index}`),
    name: stringOr(item.name, ''),
    techLevel: stringOr(item.techLevel, ''),
    kg: stringOr(item.kg, ''),
    traits: stringOr(item.traits, ''),
    notes: stringOr(item.notes, ''),
  }))
  profile.weapons = arrayOr<Record<string, unknown>>(value.weapons).map((item, index) => ({
    id: stringOr(item.id, `weapon-${index}`),
    name: stringOr(item.name, ''),
    skill: stringOr(item.skill, ''),
    speciality: stringOr(item.speciality, ''),
    techLevel: stringOr(item.techLevel, ''),
    range: stringOr(item.range, ''),
    damage: stringOr(item.damage, ''),
    kg: stringOr(item.kg, ''),
    magazine: stringOr(item.magazine, ''),
    traits: stringOr(item.traits, ''),
    notes: stringOr(item.notes, ''),
  }))
  profile.armour = arrayOr<Record<string, unknown>>(value.armour).map((item, index) => ({
    id: stringOr(item.id, `armour-${index}`),
    name: stringOr(item.name, ''),
    type: stringOr(item.type, ''),
    techLevel: stringOr(item.techLevel, ''),
    protection: stringOr(item.protection, ''),
    radiationProtection: stringOr(item.radiationProtection, ''),
    kg: stringOr(item.kg, ''),
    options: stringOr(item.options, ''),
    traits: stringOr(item.traits, ''),
    notes: stringOr(item.notes, ''),
  }))
  profile.augments = arrayOr<Record<string, unknown>>(value.augments).map((item, index) => ({
    id: stringOr(item.id, `augment-${index}`),
    name: stringOr(item.name, ''),
    type: stringOr(item.type, ''),
    techLevel: stringOr(item.techLevel, ''),
    traits: stringOr(item.traits, ''),
    notes: stringOr(item.notes, ''),
  }))

  profile.finances = {
    cashOnHand: numberOr(finances.cashOnHand, profile.finances.cashOnHand),
    monthlyCashFlow: stringOr(finances.monthlyCashFlow, profile.finances.monthlyCashFlow),
    income: stringOr(finances.income, profile.finances.income),
    livingCosts: stringOr(finances.livingCosts, profile.finances.livingCosts),
    debt: numberOr(finances.debt, profile.finances.debt),
    annualPension: stringOr(finances.annualPension, profile.finances.annualPension),
    shipPayments: stringOr(finances.shipPayments, profile.finances.shipPayments),
    shipShares: numberOr(finances.shipShares, profile.finances.shipShares),
  }

  profile.wounds = arrayOr<Record<string, unknown>>(value.wounds).map((wound, index) => ({
    id: stringOr(wound.id, `wound-${index}`),
    type: stringOr(wound.type, ''),
    location: stringOr(wound.location, ''),
    recoveryPeriod: stringOr(wound.recoveryPeriod, ''),
    notes: stringOr(wound.notes, ''),
  }))

  profile.psionics = {
    permissionSources: arrayOr<string>(psionics.permissionSources).map((entry) => stringOr(entry)).filter(Boolean),
    psiScore: psionics.psiScore === null ? null : numberOr(psionics.psiScore, profile.psionics.psiScore ?? 0),
    psiDm: numberOr(psionics.psiDm, profile.psionics.psiDm),
    tested: booleanOr(psionics.tested, profile.psionics.tested),
    talents: arrayOr<Record<string, unknown>>(psionics.talents).map((talent, index) => ({
      id: stringOr(talent.id, `talent-${index}`),
      name: stringOr(talent.name, ''),
      learningDm: numberOr(talent.learningDm, 0),
    })),
    talentAttempts: arrayOr(psionics.talentAttempts),
    trainingCost: numberOr(psionics.trainingCost, profile.psionics.trainingCost),
  }

  profile.benefits = {
    earnedRolls: numberOr(benefits.earnedRolls, profile.benefits.earnedRolls),
    adjustments: numberOr(benefits.adjustments, profile.benefits.adjustments),
    availableRolls: numberOr(benefits.availableRolls, profile.benefits.availableRolls),
    spentRolls: numberOr(benefits.spentRolls, profile.benefits.spentRolls),
    remainingRolls: numberOr(benefits.remainingRolls, profile.benefits.remainingRolls),
    cashRollsUsed: numberOr(benefits.cashRollsUsed, profile.benefits.cashRollsUsed),
    cashRollLimit: numberOr(benefits.cashRollLimit, profile.benefits.cashRollLimit),
    personal: arrayOr<string>(benefits.personal).map((entry) => stringOr(entry)).filter(Boolean),
    musteringOut: arrayOr(benefits.musteringOut),
  }

  profile.history = {
    background: stringOr(history.background, profile.history.background),
    notes: stringOr(history.notes, profile.history.notes),
    events: arrayOr<Record<string, unknown>>(history.events).map((event, index) => ({
      id: stringOr(event.id, `event-${index}`),
      source: stringOr(event.source, ''),
      title: stringOr(event.title, ''),
      category: stringOr(event.category, ''),
      text: stringOr(event.text, ''),
      notes: stringOr(event.notes, ''),
    })),
  }

  profile.metadata = {
    pdfTemplate: stringOr(metadata.pdfTemplate, profile.metadata.pdfTemplate),
    creatorComplete: booleanOr(metadata.creatorComplete, profile.metadata.creatorComplete),
    lastOpenedAt: stringOr(metadata.lastOpenedAt, ''),
  }

  return profile
}
