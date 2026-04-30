import acroformFieldsData from '~/data/traveller2e/core/character-sheet-2026-acroform-fields.json'
import type { TravellerAssociate, TravellerProfile, TravellerSkill, TravellerTermRecord } from '~/types/traveller'

export type TravellerPdfFieldValue = string | number
export type TravellerPdfFieldMap = Record<string, TravellerPdfFieldValue>

const acroformFields = new Set((acroformFieldsData.fields ?? []) as string[])

const formatDm = (value: number | string | undefined) => {
  const numeric = Number(value ?? 0)
  if (Number.isNaN(numeric)) return ''
  return numeric >= 0 ? `+${numeric}` : `${numeric}`
}

const setField = (fields: TravellerPdfFieldMap, name: string, value: unknown) => {
  if (!acroformFields.has(name)) return
  if (value === undefined || value === null) return
  const normalized = typeof value === 'number' ? value : String(value)
  if (normalized === '') return
  fields[name] = normalized
}

const numberedField = (prefix: string, index: number) => `${prefix} ${index + 1}`

const skillFieldNames: Record<string, string> = {
  admin: 'Admin Modifier',
  advocate: 'Advocate Modifier',
  astrogation: 'Astrogation Modifier',
  broker: 'Broker Modifier',
  carouse: 'Carouse Modifier',
  deception: 'Deception Modifier',
  diplomat: 'Diplomat Modifier',
  explosives: 'Explosives Modifier',
  gambler: 'Gambler Modifier',
  investigate: 'Investigate Modifier',
  'jack-of-all-trades': 'Jack-of-All-Trades Modifier',
  leadership: 'Leadership Modifier',
  mechanic: 'Mechanic Modifier',
  medic: 'Medic Modifier',
  navigation: 'Navigation Modifier',
  persuade: 'Persuade Modifier',
  recon: 'Recon Modifier',
  stealth: 'Stealth Modifier',
  steward: 'Steward Modifier',
  streetwise: 'Streetwise Modifier',
  survival: 'Survival Modifier',
  'vacc-suit': 'Vacc Suit Modifier',
}

const specialitySkillPrefixes: Record<string, string> = {
  animals: 'Animals',
  art: 'Art',
  athletics: 'Athletics',
  drive: 'Drive',
  electronics: 'Electronics',
  engineer: 'Engineer',
  flyer: 'Flyer',
  gunner: 'Gunner',
  'gun-combat': 'Gun Combat',
  'heavy-weapons': 'Heavy Weapons',
  language: 'Language',
  melee: 'Melee',
  pilot: 'Pilot',
  profession: 'Profession',
  science: 'Science',
  seafarer: 'Seafarer',
  tactics: 'Tactics',
}

const slugify = (value: string) => value
  .trim()
  .toLowerCase()
  .replace(/&/g, 'and')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '')

const splitSkill = (skill: TravellerSkill) => {
  const nameMatch = skill.name.match(/^(.+?)\s*\((.+)\)$/)
  const idParts = skill.id.split(/[:/]/)
  const baseName = nameMatch?.[1] ?? skill.name
  const speciality = skill.speciality || nameMatch?.[2] || idParts[1] || ''
  const baseId = slugify(idParts[0] || baseName)

  return {
    baseId,
    baseName,
    speciality,
  }
}

const setSkillFields = (fields: TravellerPdfFieldMap, skills: TravellerSkill[]) => {
  const genericSkills: TravellerSkill[] = []
  const specialityCounts: Record<string, number> = {}

  for (const skill of skills) {
    const { baseId, speciality } = splitSkill(skill)
    const fixedField = skillFieldNames[baseId]
    if (fixedField && !speciality) {
      setField(fields, fixedField, skill.level)
      continue
    }

    const specialityPrefix = specialitySkillPrefixes[baseId]
    if (specialityPrefix && speciality) {
      const count = specialityCounts[baseId] ?? 0
      if (count < 3) {
        const displayIndex = count + 1
        setField(fields, `${specialityPrefix} Specialism ${displayIndex}`, speciality)
        setField(fields, `${specialityPrefix} ${displayIndex} Modifier`, skill.level)
        specialityCounts[baseId] = displayIndex
        continue
      }
    }

    if (fixedField) {
      setField(fields, fixedField, skill.level)
      continue
    }

    genericSkills.push(skill)
  }

  genericSkills.slice(0, 11).forEach((skill, index) => {
    const { speciality } = splitSkill(skill)
    const label = speciality ? `${skill.name} (${speciality})` : skill.name
    setField(fields, numberedField('Skill/Ability', index), label)
    setField(fields, numberedField('Skill/Ability DM', index), skill.level)
  })
}

const associateNotes = (associate: TravellerAssociate) => {
  return [
    associate.notes,
    associate.context,
    associate.tags?.length ? associate.tags.join(', ') : '',
  ].filter(Boolean).join(' | ')
}

const setAssociates = (
  fields: TravellerPdfFieldMap,
  prefix: 'Ally' | 'Contact' | 'Rival' | 'Enemy',
  associates: TravellerAssociate[],
) => {
  associates.slice(0, 6).forEach((associate, index) => {
    setField(fields, numberedField(`${prefix} Name`, index), associate.name)
    setField(fields, numberedField(`${prefix} Notes`, index), associateNotes(associate))
  })
}

const careerName = (term: TravellerTermRecord) => {
  if (term.summary) return term.summary.split(' - ')[0]?.trim() || term.summary
  return term.careerId ?? term.educationId ?? term.path
}

const rollOutcome = (term: TravellerTermRecord, label: string) => {
  const roll = term.rolls.find((item) => item.label.toLowerCase().includes(label))
  if (!roll) return ''
  return roll.finalSuccess ?? roll.success ? 'Y' : 'N'
}

export const travellerProfileToPdfFields = (profile: TravellerProfile): TravellerPdfFieldMap => {
  const fields: TravellerPdfFieldMap = {}

  setField(fields, 'Name', profile.identity.name)
  setField(fields, 'Title', profile.identity.title)
  setField(fields, 'Age', profile.identity.age)
  setField(fields, 'Species', profile.identity.species)
  setField(fields, 'Homeworld', profile.identity.homeworld)
  setField(fields, 'Traits', profile.identity.traits)

  const characteristicMap = {
    str: ['Strength', 'Strength DM'],
    dex: ['Dexterity', 'Dexterity DM'],
    end: ['Endurance', 'Endurance DM'],
    int: ['Intellect', 'Intellect DM'],
    edu: ['Education', 'Education DM'],
    soc: ['Social', 'Social DM'],
  } as const

  for (const [id, [valueField, dmField]] of Object.entries(characteristicMap)) {
    const characteristic = profile.characteristics[id as keyof typeof characteristicMap]
    setField(fields, valueField, characteristic?.value)
    setField(fields, dmField, formatDm(characteristic?.dm))
  }

  if (profile.characteristics.psi?.value) {
    setField(fields, 'Other Characteristic 1', 'PSI')
    setField(fields, 'Other Stat 1', profile.characteristics.psi.value)
    setField(fields, 'Other DM 1', formatDm(profile.characteristics.psi.dm))
  }

  setSkillFields(fields, profile.skills)

  profile.weapons.slice(0, 8).forEach((weapon, index) => {
    setField(fields, numberedField('Weapon Type', index), weapon.name)
    setField(fields, numberedField('Weapon TL', index), weapon.techLevel)
    setField(fields, numberedField('Weapon Range', index), weapon.range)
    setField(fields, numberedField('Weapon Damage', index), weapon.damage)
    setField(fields, numberedField('Weapon KG', index), weapon.kg)
    setField(fields, numberedField('Weapon Magazine', index), weapon.magazine)
    setField(fields, numberedField('Weapon Traits', index), [weapon.traits, weapon.notes].filter(Boolean).join(' | '))
  })

  profile.armour.slice(0, 8).forEach((armour, index) => {
    setField(fields, numberedField('Armour Type', index), armour.name || armour.type)
    setField(fields, numberedField('Armour Protection', index), armour.protection)
    setField(fields, numberedField('Armour Radiation', index), armour.radiationProtection)
    setField(fields, numberedField('Armour KG', index), armour.kg)
    setField(fields, numberedField('Armour Options', index), [armour.options, armour.traits, armour.notes].filter(Boolean).join(' | '))
  })

  profile.augments.slice(0, 5).forEach((augment, index) => {
    setField(fields, numberedField('Augment Type', index), augment.name || augment.type)
    setField(fields, numberedField('Augment TL', index), augment.techLevel)
    setField(fields, numberedField('Augment Traits', index), [augment.traits, augment.notes].filter(Boolean).join(' | '))
  })

  profile.equipment.slice(0, 8).forEach((item, index) => {
    setField(fields, numberedField('Equipment Type', index), item.name)
    setField(fields, numberedField('Equipment TL', index), item.techLevel)
    setField(fields, numberedField('Equipment KG', index), item.kg)
    setField(fields, numberedField('Equipment Notes', index), [item.traits, item.notes].filter(Boolean).join(' | '))
  })

  setAssociates(fields, 'Ally', profile.associates.allies)
  setAssociates(fields, 'Contact', profile.associates.contacts)
  setAssociates(fields, 'Rival', profile.associates.rivals)
  setAssociates(fields, 'Enemy', profile.associates.enemies)

  profile.careers.slice(0, 5).forEach((term, index) => {
    setField(fields, numberedField('Career Term', index), term.termNumber)
    setField(fields, numberedField('Career', index), careerName(term))
    setField(fields, numberedField('Career Survival', index), rollOutcome(term, 'survival'))
    setField(fields, numberedField('Career Advancement', index), rollOutcome(term, 'advancement'))
    setField(fields, numberedField('Career Rank', index), term.details.find((detail) => detail.toLowerCase().includes('advanced to')) ?? '')
    setField(fields, numberedField('Career Notes', index), term.details.join(' | '))
  })

  setField(fields, 'Cash on Hand', profile.finances.cashOnHand)
  setField(fields, 'Monthly Cash Flow', profile.finances.monthlyCashFlow)
  setField(fields, 'Income', profile.finances.income)
  setField(fields, 'Living Cost', profile.finances.livingCosts)
  setField(fields, 'Debt', profile.finances.debt)
  setField(fields, 'Annual Pension', profile.finances.annualPension)
  setField(fields, 'Ship Payments', profile.finances.shipPayments)
  setField(fields, 'Ship Shares', profile.finances.shipShares)

  profile.wounds.slice(0, 4).forEach((wound, index) => {
    setField(fields, numberedField('Wound Type', index), wound.type)
    setField(fields, numberedField('Wound Location', index), wound.location)
    setField(fields, numberedField('Wound Recovery Period', index), wound.recoveryPeriod)
    setField(fields, numberedField('Wound Notes', index), wound.notes)
  })

  setField(fields, 'History & Background', [
    profile.identity.distinguishingFeatures,
    profile.history.background,
    profile.history.notes,
    ...profile.history.events.map((event) => `${event.title}${event.notes ? `: ${event.notes}` : ''}`),
  ].filter(Boolean).join('\n\n'))

  return fields
}

export const validateTravellerPdfFields = (fields: TravellerPdfFieldMap) => {
  const unknownFields = Object.keys(fields).filter((field) => !acroformFields.has(field))
  return {
    valid: unknownFields.length === 0,
    unknownFields,
  }
}
