import skillsData from '~/data/traveller2e/core/skills.json'
import type { TravellerSkill } from '~/types/traveller'

type SkillDefinition = {
  id: string
  name: string
  specialities?: string[]
  requiresSpeciality?: boolean
  specialityMode?: 'shared-zero' | 'independent'
  special?: boolean
  psionic?: boolean
}

export type ParsedTravellerSkill = {
  id: string
  name: string
  baseId: string
  baseName: string
  specialityId?: string
  specialityName?: string
}

const definitions = skillsData.skills as SkillDefinition[]
const definitionsById = new Map(definitions.map((definition) => [definition.id, definition]))

export const slugifyTravellerSkill = (value: string) => value
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

export const titleCaseTravellerSkill = (value: string) => value
  .split(/[-\s]+/)
  .filter(Boolean)
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ')

export const getTravellerSkillDefinition = (skillId: string) => definitionsById.get(skillId)

const findTravellerSkillDefinition = (value: string) => {
  const normalized = slugifyTravellerSkill(value)
  return definitionsById.get(value)
    ?? definitions.find((definition) => definition.name.toLowerCase() === value.toLowerCase())
    ?? definitions.find((definition) => definition.id === normalized)
}

export const travellerSkillHasSpecialities = (skillId: string) => {
  const definition = getTravellerSkillDefinition(skillId)
  return Boolean(definition?.specialities?.length || definition?.requiresSpeciality)
}

export const travellerSkillMode = (skillId: string) => {
  const definition = getTravellerSkillDefinition(skillId)
  if (!definition?.specialities?.length && !definition?.requiresSpeciality) return 'none' as const
  return definition.specialityMode ?? 'shared-zero'
}

const normalizeSpecialitySlug = (definition: SkillDefinition | undefined, value: string) => {
  const slug = slugifyTravellerSkill(value === '*' ? 'any' : value)
  if (slug === 'any') return slug

  const exact = definition?.specialities?.find((speciality) => slugifyTravellerSkill(speciality) === slug)
  if (exact) return slugifyTravellerSkill(exact)

  const singular = slug.endsWith('s') ? slug.slice(0, -1) : slug
  const singularMatch = definition?.specialities?.find((speciality) => slugifyTravellerSkill(speciality) === singular)
  return singularMatch ? slugifyTravellerSkill(singularMatch) : slug
}

export const formatTravellerSkillSpeciality = (baseId: string, value: string) => {
  const definition = getTravellerSkillDefinition(baseId)
  const normalized = normalizeSpecialitySlug(definition, value)
  if (normalized === 'any') return 'any'

  const known = definition?.specialities?.find((speciality) => slugifyTravellerSkill(speciality) === normalized)
  return known ? titleCaseTravellerSkill(known) : titleCaseTravellerSkill(value)
}

export const buildTravellerSkill = (
  baseId: string,
  level: number,
  specialityName?: string,
  extras: Partial<Omit<TravellerSkill, 'id' | 'name' | 'level' | 'speciality'>> = {},
): TravellerSkill => {
  const definition = getTravellerSkillDefinition(baseId)
  const baseName = definition?.name ?? titleCaseTravellerSkill(baseId)
  const specialityId = specialityName ? normalizeSpecialitySlug(definition, specialityName) : undefined
  const formattedSpeciality = specialityName ? formatTravellerSkillSpeciality(baseId, specialityName) : undefined

  return {
    id: specialityId ? `${baseId}:${specialityId}` : baseId,
    name: formattedSpeciality ? `${baseName} (${formattedSpeciality})` : baseName,
    speciality: formattedSpeciality,
    level,
    sources: extras.sources ? [...extras.sources] : [],
    notes: extras.notes ?? '',
  }
}

export const parseTravellerSkill = (value: string): ParsedTravellerSkill => {
  const trimmed = value.trim()
  const slashSpecialityMatch = trimmed.match(/^(.+?)\/(.+)$/)
  if (slashSpecialityMatch) {
    const definition = findTravellerSkillDefinition(slashSpecialityMatch[1])
    const baseId = definition?.id ?? slugifyTravellerSkill(slashSpecialityMatch[1])
    const baseName = definition?.name ?? titleCaseTravellerSkill(slashSpecialityMatch[1])
    const specialityId = normalizeSpecialitySlug(definition, slashSpecialityMatch[2])
    const specialityName = specialityId === 'any' ? 'any' : formatTravellerSkillSpeciality(baseId, slashSpecialityMatch[2])
    return {
      id: `${baseId}:${specialityId}`,
      name: `${baseName} (${specialityName})`,
      baseId,
      baseName,
      specialityId,
      specialityName,
    }
  }

  const bracketMatch = trimmed.match(/^(.+?)\s*\((.+)\)$/)
  const baseValue = (bracketMatch?.[1] ?? trimmed).trim()
  const definition = findTravellerSkillDefinition(baseValue)
  const baseId = definition?.id ?? slugifyTravellerSkill(baseValue)
  const baseName = definition?.name ?? titleCaseTravellerSkill(baseValue)
  const specialityValue = bracketMatch?.[2]?.trim()

  if (specialityValue) {
    const specialityId = normalizeSpecialitySlug(definition, specialityValue)
    const specialityName = specialityId === 'any' ? 'any' : formatTravellerSkillSpeciality(baseId, specialityValue)
    return {
      id: `${baseId}:${specialityId}`,
      name: `${baseName} (${specialityName})`,
      baseId,
      baseName,
      specialityId,
      specialityName,
    }
  }

  return {
    id: baseId,
    name: baseName,
    baseId,
    baseName,
  }
}

export const normalizeTravellerSkillRecord = (skill: TravellerSkill): TravellerSkill => {
  const parsedFromId = parseTravellerSkill(skill.id || skill.name)
  const specialityName = skill.speciality?.trim()
    || parsedFromId.specialityName
    || skill.name.match(/\((.+)\)/)?.[1]?.trim()
    || undefined

  return buildTravellerSkill(parsedFromId.baseId, skill.level, specialityName, {
    sources: skill.sources ?? [],
    notes: skill.notes ?? '',
  })
}
