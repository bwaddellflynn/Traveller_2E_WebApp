import preCareerEventsData from '~/data/traveller2e/core/pre-career-events.json'
import careerEventsData from '~/data/traveller2e/core/career-events-mishaps.json'
import lifeEventsData from '~/data/traveller2e/core/life-events.json'
import agingAndInjuriesData from '~/data/traveller2e/core/aging-and-injuries.json'
import creationRulesData from '~/data/traveller2e/core/character-creation-rules.json'

export type TravellerEventSource = 'education' | 'career' | 'mishap' | 'life' | 'injury' | 'draft' | 'subtable'

export type TravellerEventEffect = Record<string, unknown> & {
  type: string
  normalizedType?: string
  resolution?: 'automatic' | 'choice' | 'check' | 'manual' | 'table'
}

export type TravellerEvent = {
  id: string
  source: TravellerEventSource
  tableId: string
  careerId?: string
  roll: number
  name: string
  text: string
  effects: TravellerEventEffect[]
  raw: Record<string, unknown>
}

type RawEventRow = {
  id?: string
  ref?: string
  roll: number
  name?: string
  text?: string
  effects?: TravellerEventEffect[]
}

type CareerEventTableType = 'events' | 'mishaps'

const careerEventTableData = careerEventsData as {
  common: Record<string, RawEventRow>
  careers: Record<string, Record<CareerEventTableType, RawEventRow[]>>
}

const normalizeIdPart = (value: string | number) => String(value)
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')

const effectTypeMap: Record<string, Pick<TravellerEventEffect, 'normalizedType' | 'resolution'>> = {
  assignment_skill_check: { normalizedType: 'check', resolution: 'check' },
  associate_or_family_injury: { normalizedType: 'injury', resolution: 'manual' },
  automatic_commission: { normalizedType: 'commission', resolution: 'automatic' },
  automatic_next_promotion_or_commission: { normalizedType: 'promotion_or_commission', resolution: 'automatic' },
  automatic_promotion: { normalizedType: 'promotion', resolution: 'automatic' },
  benefit_roll_dm: { normalizedType: 'roll_modifier', resolution: 'automatic' },
  characteristic_change: { normalizedType: 'characteristic_change', resolution: 'automatic' },
  characteristic_increase: { normalizedType: 'characteristic_change', resolution: 'automatic' },
  check: { normalizedType: 'check', resolution: 'check' },
  check_any: { normalizedType: 'check', resolution: 'check' },
  check_chosen_skill: { normalizedType: 'check', resolution: 'check' },
  check_known_term_skill: { normalizedType: 'check', resolution: 'check' },
  choice: { normalizedType: 'choice', resolution: 'choice' },
  choose_characteristic_change: { normalizedType: 'characteristic_change', resolution: 'choice' },
  choose_skill: { normalizedType: 'skill_gain', resolution: 'choice' },
  choose_skill_increase: { normalizedType: 'skill_increase', resolution: 'choice' },
  choose_skill_or_contact: { normalizedType: 'skill_or_associate', resolution: 'choice' },
  choose_skill_set: { normalizedType: 'skill_gain', resolution: 'choice' },
  convert_or_gain_associate: { normalizedType: 'associate_change', resolution: 'manual' },
  debt_favour: { normalizedType: 'debt', resolution: 'automatic' },
  draft_next_term: { normalizedType: 'career_transition', resolution: 'table' },
  draft_assignment: { normalizedType: 'career_transition', resolution: 'automatic' },
  education_graduation: { normalizedType: 'education_graduation', resolution: 'automatic' },
  extra_benefit_roll: { normalizedType: 'benefit_roll_change', resolution: 'automatic' },
  forced_out: { normalizedType: 'forced_out', resolution: 'automatic' },
  free_skill_table_roll: { normalizedType: 'skill_table_roll', resolution: 'table' },
  gain_associate: { normalizedType: 'associate_gain', resolution: 'manual' },
  gain_item: { normalizedType: 'item_gain', resolution: 'manual' },
  ignore_draft: { normalizedType: 'draft_modifier', resolution: 'automatic' },
  increase_any_existing_skill: { normalizedType: 'skill_increase', resolution: 'choice' },
  increase_checked_skill: { normalizedType: 'skill_increase', resolution: 'automatic' },
  increase_existing_skill: { normalizedType: 'skill_increase', resolution: 'choice' },
  increase_skill: { normalizedType: 'skill_increase', resolution: 'automatic' },
  injury: { normalizedType: 'injury', resolution: 'table' },
  injury_characteristic_loss: { normalizedType: 'characteristic_loss', resolution: 'choice' },
  keep_current_term_benefit_roll: { normalizedType: 'benefit_roll_change', resolution: 'automatic' },
  lose_benefit_roll: { normalizedType: 'benefit_roll_change', resolution: 'automatic' },
  lose_all_career_benefits: { normalizedType: 'benefit_roll_change', resolution: 'automatic' },
  may_attempt_graduation: { normalizedType: 'education_graduation', resolution: 'automatic' },
  may_enter_career: { normalizedType: 'career_permission', resolution: 'automatic' },
  may_enter_career_next_term: { normalizedType: 'career_permission', resolution: 'automatic' },
  may_take_career_next_term: { normalizedType: 'career_permission', resolution: 'automatic' },
  may_test_psi: { normalizedType: 'psi_permission', resolution: 'automatic' },
  may_test_psionic_strength: { normalizedType: 'psi_permission', resolution: 'automatic' },
  natural_two_next_career: { normalizedType: 'career_transition', resolution: 'manual' },
  next_advancement_dm: { normalizedType: 'roll_modifier', resolution: 'automatic' },
  next_career: { normalizedType: 'career_transition', resolution: 'automatic' },
  next_qualification_dm: { normalizedType: 'roll_modifier', resolution: 'automatic' },
  one_benefit_roll_dm: { normalizedType: 'roll_modifier', resolution: 'automatic' },
  not_forced_out: { normalizedType: 'forced_out', resolution: 'automatic' },
  optional_check: { normalizedType: 'check', resolution: 'check' },
  roll_life_event_subtable: { normalizedType: 'table_roll', resolution: 'table' },
  roll_mishap: { normalizedType: 'table_roll', resolution: 'table' },
  roll_related_career_event_or_mishap: { normalizedType: 'table_roll', resolution: 'table' },
  roll_subtable: { normalizedType: 'table_roll', resolution: 'table' },
  roll_table: { normalizedType: 'table_roll', resolution: 'table' },
  science_speciality_levels: { normalizedType: 'skill_gain', resolution: 'choice' },
  set_skill: { normalizedType: 'skill_gain', resolution: 'automatic' },
  wager_benefit_rolls: { normalizedType: 'benefit_roll_change', resolution: 'manual' },
}

const normalizeEffect = (effect: TravellerEventEffect): TravellerEventEffect => {
  const normalized = effectTypeMap[effect.type]
  if (normalized) return { ...effect, ...normalized }
  if (effect.type.startsWith('possible_')) {
    return {
      ...effect,
      normalizedType: effect.type.replace(/^possible_/, ''),
      resolution: 'manual',
    }
  }
  return {
    ...effect,
    normalizedType: effect.type,
    resolution: 'manual',
  }
}

const cloneEffects = (effects?: TravellerEventEffect[]) => (effects ?? []).map((effect) => normalizeEffect({ ...effect }))

const toTitle = (value: string) => value
  .split(/[-_]/)
  .filter(Boolean)
  .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
  .join(' ')

const resolveCareerRow = (row: RawEventRow): RawEventRow => {
  if (!row.ref) return row

  const [scope, key] = row.ref.split('.')
  if (scope !== 'common') return row

  return {
    ...(careerEventTableData.common[key] ?? {}),
    roll: row.roll,
  }
}

const normalizeEvent = (
  row: RawEventRow,
  source: TravellerEventSource,
  tableId: string,
  careerId?: string,
): TravellerEvent => {
  const name = row.name ?? row.id ?? `${tableId} ${row.roll}`
  const idParts = careerId
    ? [source, careerId, tableId, row.roll, row.id ?? name]
    : [source, tableId, row.roll, row.id ?? name]

  return {
    id: idParts.map(normalizeIdPart).filter(Boolean).join('-'),
    source,
    tableId,
    careerId,
    roll: row.roll,
    name,
    text: row.text ?? '',
    effects: cloneEffects(row.effects),
    raw: row as Record<string, unknown>,
  }
}

export const getEducationEvent = (roll: number): TravellerEvent | null => {
  const row = preCareerEventsData.events.find((event: RawEventRow) => event.roll === roll)
  return row ? normalizeEvent(row, 'education', 'pre-career-events') : null
}

export const getCareerEvent = (careerId: string, roll: number): TravellerEvent | null => {
  const row = careerEventTableData.careers[careerId]?.events?.find((event) => event.roll === roll)
  return row ? normalizeEvent(resolveCareerRow(row), 'career', `${careerId}-events`, careerId) : null
}

export const getCareerMishap = (careerId: string, roll: number): TravellerEvent | null => {
  const row = careerEventTableData.careers[careerId]?.mishaps?.find((event) => event.roll === roll)
  return row ? normalizeEvent(resolveCareerRow(row), 'mishap', `${careerId}-mishaps`, careerId) : null
}

export const getLifeEvent = (roll: number): TravellerEvent | null => {
  const row = lifeEventsData.events.find((event: RawEventRow) => event.roll === roll)
  return row ? normalizeEvent(row, 'life', 'life-events') : null
}

export const getLifeSubtableEvent = (tableId: string, roll: number): TravellerEvent | null => {
  const table = (lifeEventsData.subtables as Record<string, { events: RawEventRow[] }>)[tableId]
  const row = table?.events.find((event) => event.roll === roll)
  return row ? normalizeEvent(row, 'subtable', tableId) : null
}

export const getPreCareerSubtableEvent = (tableId: string, roll: number): TravellerEvent | null => {
  const table = (preCareerEventsData.subtables as Record<string, { events: RawEventRow[] }>)[tableId]
  const row = table?.events.find((event) => event.roll === roll)
  return row ? normalizeEvent(row, 'subtable', tableId) : null
}

export const getInjuryEvent = (roll: number): TravellerEvent | null => {
  const row = agingAndInjuriesData.injury.table.find((event: { roll: number; id: string; effects?: Record<string, unknown>[] }) => event.roll === roll)
  if (!row) return null

  return normalizeEvent({
    roll: row.roll,
    id: row.id,
    name: toTitle(row.id),
    effects: (row.effects ?? []).map((effect) => ({
      type: 'injury_characteristic_loss',
      ...effect,
    })) as TravellerEventEffect[],
  }, 'injury', 'injury')
}

export const getDraftEvent = (roll: number): TravellerEvent | null => {
  const row = creationRulesData.draft.table.find((event: { roll: number; careerId: string; assignment: string }) => event.roll === roll)
  if (!row) return null

  return normalizeEvent({
    roll: row.roll,
    id: `${row.careerId}-${row.assignment}`,
    name: `Draft: ${toTitle(row.careerId)}`,
    effects: [{
      type: 'draft_assignment',
      careerId: row.careerId,
      assignmentId: row.assignment,
    }],
  }, 'draft', 'draft')
}

export const getEventFromTable = (tableId: string, roll: number, careerId?: string): TravellerEvent | null => {
  if (tableId === 'life-events') return getLifeEvent(roll)
  if (tableId === 'injury') return getInjuryEvent(roll)
  if (tableId === 'draft') return getDraftEvent(roll)
  if (tableId === 'events' && careerId) return getCareerEvent(careerId, roll)
  if (tableId === 'mishaps' && careerId) return getCareerMishap(careerId, roll)

  return getLifeSubtableEvent(tableId, roll) ?? getPreCareerSubtableEvent(tableId, roll)
}
