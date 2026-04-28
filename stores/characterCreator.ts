import { computed, reactive, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import characteristicsData from '~/data/traveller2e/core/characteristics.json'
import skillsData from '~/data/traveller2e/core/skills.json'
import careersData from '~/data/traveller2e/core/careers-summary.json'
import creationRulesData from '~/data/traveller2e/core/character-creation-rules.json'
import agingData from '~/data/traveller2e/core/aging-and-injuries.json'
import careerTablesData from '~/data/traveller2e/core/career-tables.json'
import { getCareerEvent, getCareerMishap, getEducationEvent, getEventFromTable, normalizeTravellerEventEffect, type TravellerEvent, type TravellerEventEffect } from '~/utils/traveller/events'

type CharacteristicId = 'str' | 'dex' | 'end' | 'int' | 'edu' | 'soc'
type StatRoll = {
  id: string
  value: number
}
type EducationOption = {
  id: string
  name: string
  type: 'university' | 'military-academy'
  variant?: 'army' | 'marine' | 'navy'
}
type CharacterSkill = {
  id: string
  name: string
  level: number
  sources: string[]
}
type CheckRule = {
  characteristic?: string
  target?: number
  automatic?: boolean
  any?: { characteristic: string; target: number }[]
}
type RollResult = {
  label: string
  dice: number[]
  dm: number
  total: number
  target: number
  effect: number
  success: boolean
  source: 'rolled' | 'manual'
  overridden?: boolean
  finalSuccess?: boolean
  notes?: string
}
type TermHistoryEntry = {
  termNumber: number
  path: 'career' | 'education'
  careerId?: string
  assignmentId?: string
  educationId?: string
  startAge: number
  endAge: number
  summary: string
  rolls: RollResult[]
}
type CreatorTab = 'creation' | `term-${number}`
type EventResolutionKind = 'manual' | 'skill_choice' | 'table_roll' | 'check' | 'choice' | 'associate'
type EventChoiceOption = {
  id: string
  label: string
  effects: TravellerEventEffect[]
}
type PendingEventResolution = {
  id: string
  kind: EventResolutionKind
  label: string
  source: string
  effect: TravellerEventEffect
  options?: string[]
  choiceOptions?: EventChoiceOption[]
  associateTypes?: string[]
  associateCount?: number | string
  associateContext?: string
  associateTags?: string[]
  tableId?: string
  diceCount?: 1 | 2
  check?: {
    label: string
    target: number
    dm: number
  }
  level?: number
  increase?: boolean
  resolved?: boolean
  selected?: string
}
type TravellerAssociate = {
  id: string
  source: string
  type: string
  name: string
  notes?: string
  context?: string
  tags?: string[]
}
type TravellerRollModifier = {
  id: string
  source: string
  label: string
  target: 'advancement' | 'qualification' | 'benefit' | 'survival' | 'career' | 'any'
  dm: number
  scope: 'next' | 'one' | 'career' | 'term' | 'any'
  used?: boolean
}
type BenefitRollAdjustment = {
  id: string
  source: string
  label: string
  adjustment: number
  dm?: number
  scope: 'current-term' | 'career' | 'one-roll' | 'any'
}
type BenefitRollLedgerEntry = {
  id: string
  termNumber: number
  source: string
  label: string
  count: number
}
type CareerConstraint = {
  id: string
  source: string
  label: string
  effectType: string
  appliesTermNumber: number
  careerId?: string
  assignmentId?: string
  forcedOut?: boolean
  draftNextTerm?: boolean
  used?: boolean
}
type EventOutcomeLogEntry = {
  id: string
  source: string
  label: string
  effectType: string
  normalizedType?: string
  status: 'automatic' | 'pending' | 'manual'
}


export const useCharacterCreatorStore = defineStore('characterCreator', () => {
  const characteristicOrder = characteristicsData.characteristics.map((item) => item.id as CharacteristicId)
  const statRolls = ref<StatRoll[]>(characteristicOrder.map((_, index) => ({
    id: `initial-${index}`,
    value: 7,
  })))
  const assignedRollIds = reactive<Record<CharacteristicId, string>>({
    str: 'initial-0',
    dex: 'initial-1',
    end: 'initial-2',
    int: 'initial-3',
    edu: 'initial-4',
    soc: 'initial-5',
  })
  const values = reactive<Record<CharacteristicId, number>>({
    str: 7,
    dex: 7,
    end: 7,
    int: 7,
    edu: 7,
    soc: 7,
  })
  const characteristicAdjustments = reactive<Record<CharacteristicId, number>>({
    str: 0,
    dex: 0,
    end: 0,
    int: 0,
    edu: 0,
    soc: 0,
  })
  const characterName = ref('')
  const selectedBackgroundSkills = ref<string[]>([])
  const backgroundSkillsCollapsed = ref(false)
  const backgroundSkillsAutoCollapsed = ref(false)
  const selectedEducationId = ref('university')
  const selectedTermPath = ref<'career' | 'education'>('career')
  const selectedCareerId = ref('agent')
  const selectedAssignmentId = ref('law-enforcement')
  const selectedCareerSkillTableId = ref('personal-development')
  const hasRolledCharacteristics = ref(false)
  const showRerollConfirm = ref(false)
  const currentTermNumber = ref(1)
  const activeCreatorTab = ref<CreatorTab>('creation')
  const lifepathComplete = ref(false)
  const termHistory = ref<TermHistoryEntry[]>([])
  const appliedSkillRecords = reactive<Record<string, CharacterSkill>>({})
  const educationSkillsApplied = ref(false)
  const universityLevel0Skill = ref('')
  const universityLevel1Skill = ref('')
  const pendingEducationSkillChoices = ref<Array<{ label: string; level: number; options: string[]; selected?: string }>>([])
  const educationEventExpanded = ref(false)
  const basicTrainingApplied = ref(false)
  const pendingBasicTrainingChoices = ref<Array<{ label: string; options: string[]; selected?: string }>>([])
  const careerEventExpanded = ref(false)
  const careerMishapExpanded = ref(false)
  const careerSkillResult = ref<string | null>(null)
  const activeEvent = ref<TravellerEvent | null>(null)
  const pendingEventResolutions = ref<PendingEventResolution[]>([])
  const eventOutcomeLog = ref<EventOutcomeLogEntry[]>([])
  const associates = ref<TravellerAssociate[]>([])
  const rollModifiers = ref<TravellerRollModifier[]>([])
  const benefitRollAdjustments = ref<BenefitRollAdjustment[]>([])
  const benefitRollLedger = ref<BenefitRollLedgerEntry[]>([])
  const careerConstraints = ref<CareerConstraint[]>([])
  const pendingSkillChoice = ref<{ label: string; source: string; options: string[]; level?: number; increase?: boolean } | null>(null)
  const termRolls = reactive<Record<string, RollResult | null>>({
    educationEntry: null,
    educationEvent: null,
    educationGraduation: null,
    careerQualification: null,
    careerSkill: null,
    careerSurvival: null,
    careerMishap: null,
    careerEvent: null,
    careerAdvancement: null,
    aging: null,
  })
  const manualRollTotals = reactive<Record<string, number | null>>({
    educationEntry: null,
    educationEvent: null,
    educationGraduation: null,
    careerQualification: null,
    careerSkill: null,
    careerSurvival: null,
    careerMishap: null,
    careerEvent: null,
    careerAdvancement: null,
    aging: null,
  })

  const roll2D = () => Math.ceil(Math.random() * 6) + Math.ceil(Math.random() * 6)

  const diceModifier = (score: number) => {
    const row = characteristicsData.diceModifiers.find((modifier) => {
      const max = modifier.max ?? Number.POSITIVE_INFINITY
      return score >= modifier.min && score <= max
    })

    return row?.dm ?? 0
  }

  const formatDm = (value: number) => value >= 0 ? `+${value}` : `${value}`

  const assignedRollIdSet = computed(() => new Set(Object.values(assignedRollIds).filter(Boolean)))

  const assignableRollsFor = (characteristicId: CharacteristicId) => statRolls.value.filter((roll) => {
    return roll.id === assignedRollIds[characteristicId] || !assignedRollIdSet.value.has(roll.id)
  })

  const applyAssignedScores = () => {
    for (const id of characteristicOrder) {
      const selectedRoll = statRolls.value.find((roll) => roll.id === assignedRollIds[id])
      values[id] = Math.max(0, (selectedRoll?.value ?? 0) + characteristicAdjustments[id])
    }
  }

  const performCharacteristicRoll = () => {
    statRolls.value = characteristicOrder.map((_, index) => ({
      id: `roll-${Date.now()}-${index}`,
      value: roll2D(),
    }))

    for (const id of characteristicOrder) {
      assignedRollIds[id] = ''
    }

    applyAssignedScores()
    selectedBackgroundSkills.value = []
    hasRolledCharacteristics.value = true
  }

  const autoAssignCharacteristics = () => {
    const shuffledRollIds = statRolls.value.map((roll) => roll.id)

    for (let index = shuffledRollIds.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1))
      const current = shuffledRollIds[index]
      shuffledRollIds[index] = shuffledRollIds[swapIndex]
      shuffledRollIds[swapIndex] = current
    }

    characteristicOrder.forEach((id, index) => {
      assignedRollIds[id] = shuffledRollIds[index] ?? ''
    })
  }

  const rollCharacteristics = () => {
    if (hasRolledCharacteristics.value) {
      showRerollConfirm.value = true
      return
    }

    performCharacteristicRoll()
  }

  const confirmCharacteristicReroll = () => {
    showRerollConfirm.value = false
    performCharacteristicRoll()
  }

  const cancelCharacteristicReroll = () => {
    showRerollConfirm.value = false
  }

  const currentAge = computed(() => 18 + ((currentTermNumber.value - 1) * 4))
  const endOfTermAge = computed(() => currentAge.value + 4)
  const educationAvailable = computed(() => currentTermNumber.value <= 3)
  const agingRequired = computed(() => currentTermNumber.value >= 4)
  const educationEntryFailed = computed(() => termRolls.educationEntry?.finalSuccess === false)
  const currentTermTabId = computed<CreatorTab>(() => `term-${currentTermNumber.value}` as CreatorTab)
  const termTabs = computed(() => Array.from({ length: currentTermNumber.value }, (_, index) => index + 1))
  const activeTermNumber = computed(() => {
    if (activeCreatorTab.value === 'creation') return null
    return Number(activeCreatorTab.value.replace('term-', ''))
  })
  const activeTermHistoryEntry = computed(() => {
    if (!activeTermNumber.value) return null
    return termHistory.value.find((entry) => entry.termNumber === activeTermNumber.value) ?? null
  })

  watch(currentTermNumber, (termNumber) => {
    if (termNumber > 3 && selectedTermPath.value === 'education') {
      selectedTermPath.value = 'career'
    }
  })

  const backgroundSkillLimit = computed(() => Math.max(0, Math.min(6, diceModifier(values.edu) + 3)))
  const backgroundSkillsComplete = computed(() => backgroundSkillLimit.value > 0 && selectedBackgroundSkills.value.length >= backgroundSkillLimit.value)
  const backgroundSkillOptions = computed(() => skillsData.backgroundSkills.choices.map((skillId) => {
    const skill = skillsData.skills.find((item) => item.id === skillId)
    return {
      id: skillId,
      name: skill?.name ?? skillId,
    }
  }))
  const preCareerEducation = creationRulesData.preCareerEducation
  const educationOptions = computed<EducationOption[]>(() => [
    {
      id: 'university',
      name: 'University',
      type: 'university',
    },
    {
      id: 'military-academy:army',
      name: 'Army Academy',
      type: 'military-academy',
      variant: 'army',
    },
    {
      id: 'military-academy:marine',
      name: 'Marine Academy',
      type: 'military-academy',
      variant: 'marine',
    },
    {
      id: 'military-academy:navy',
      name: 'Navy Academy',
      type: 'military-academy',
      variant: 'navy',
    },
  ])
  const selectedEducationOption = computed(() => educationOptions.value.find((option) => option.id === selectedEducationId.value) ?? educationOptions.value[0])
  const selectedEducation = computed(() => {
    return preCareerEducation.find((option) => option.id === selectedEducationOption.value.type) ?? null
  })
  const selectedEducationVariant = computed(() => selectedEducationOption.value.variant)
  const educationSkillOptions = computed(() => selectedEducation.value?.skillOptions ?? [])
  const selectedEducationEntry = computed(() => {
    if (!selectedEducation.value) return null
    if (selectedEducation.value.id === 'military-academy' && selectedEducationVariant.value) {
      return selectedEducation.value.entryByVariant[selectedEducationVariant.value as 'army' | 'marine' | 'navy']
    }

    return selectedEducation.value.entry
  })
  const preCareerEvent = computed(() => {
    const roll = termRolls.educationEvent
    if (!roll) return null
    return getEducationEvent(roll.total)
  })
  const militaryAcademyCareerId = computed(() => selectedEducationVariant.value === 'marine' ? 'marine' : selectedEducationVariant.value === 'navy' ? 'navy' : 'army')
  const militaryAcademyServiceSkills = computed(() => {
    const table = (careerTablesData.careers as Record<string, any>)[militaryAcademyCareerId.value]?.skillTables?.['service-skills']
    return table ? tableEntries(table as string[] | { entries?: string[] }) : []
  })
  const selectedCareer = computed(() => careersData.careers.find((career) => career.id === selectedCareerId.value) ?? careersData.careers[0])
  const selectedAssignment = computed(() => {
    const assignment = selectedCareer.value.assignments.find((item) => item.id === selectedAssignmentId.value)
    return assignment ?? selectedCareer.value.assignments[0]
  })
  const knownCareerIds = computed(() => new Set(careersData.careers.map((career) => career.id)))
  const activeCareerConstraints = computed(() => careerConstraints.value.filter((constraint) => {
    if (constraint.used) return false
    return constraint.appliesTermNumber <= currentTermNumber.value
  }))
  const forcedCareerConstraint = computed(() => {
    return [...activeCareerConstraints.value]
      .reverse()
      .find((constraint) => {
        if (!constraint.careerId || !knownCareerIds.value.has(constraint.careerId)) return false
        return constraint.effectType === 'next_career' || constraint.effectType === 'draft_assignment'
      })
  })
  const careerPathLocked = computed(() => activeCareerConstraints.value.some((constraint) => {
    return constraint.effectType === 'next_career' || constraint.effectType === 'draft_assignment' || constraint.effectType === 'draft_next_term'
  }))
  const forcedOutCareerIds = computed(() => new Set(activeCareerConstraints.value
    .filter((constraint) => constraint.forcedOut && constraint.careerId)
    .map((constraint) => constraint.careerId as string)))
  const careerOptions = computed(() => careersData.careers.map((career) => {
    const forcedCareerId = forcedCareerConstraint.value?.careerId
    const forcedOut = forcedOutCareerIds.value.has(career.id)
    const disabled = Boolean((forcedCareerId && career.id !== forcedCareerId) || forcedOut)
    const disabledReason = forcedCareerId && career.id !== forcedCareerId
      ? `Must enter ${forcedCareerConstraint.value?.label ?? forcedCareerId}`
      : forcedOut
        ? 'Forced out of this career'
        : ''

    return {
      ...career,
      disabled,
      disabledReason,
    }
  }))
  const careerConstraintMessages = computed(() => activeCareerConstraints.value.map((constraint) => {
    if (constraint.careerId && !knownCareerIds.value.has(constraint.careerId)) {
      return `${constraint.label}: ${constraint.careerId} is not in the current Core career list. Resolve manually.`
    }

    return constraint.label
  }))
  const currentCareerTableData = computed(() => {
    return (careerTablesData.careers as Record<string, any>)[selectedCareerId.value] ?? null
  })
  const careerEvent = computed(() => {
    const roll = termRolls.careerEvent
    if (!roll) return null
    return getCareerEvent(selectedCareerId.value, roll.total)
  })
  const careerMishap = computed(() => {
    const roll = termRolls.careerMishap
    if (!roll) return null
    return getCareerMishap(selectedCareerId.value, roll.total)
  })
  const currentCareerSkillTables = computed<Record<string, any>>(() => currentCareerTableData.value?.skillTables ?? {})
  const tableEntries = (table: string[] | { entries?: string[] }) => Array.isArray(table) ? table : table.entries ?? []
  const advancedEducationAllowed = (requirement?: string) => {
    if (!requirement) return true
    const eduTarget = requirement.match(/EDU\s+(\d+)\+/i)
    if (!eduTarget) return true
    return values.edu >= Number(eduTarget[1])
  }
  const skillTableLabel = (tableId: string) => {
    const labels: Record<string, string> = {
      'personal-development': 'Personal Development',
      'service-skills': 'Service Skills',
      'advanced-education': 'Advanced Education',
      officer: 'Officer',
    }

    return labels[tableId] ?? selectedCareer.value.assignments.find((assignment) => assignment.id === tableId)?.name ?? tableId
  }
  const availableCareerSkillTables = computed(() => {
    return Object.entries(currentCareerSkillTables.value)
      .filter(([tableId, table]) => {
        if (tableId === 'officer') return false
        if (tableId === 'advanced-education') return advancedEducationAllowed((table as { requirement?: string }).requirement)
        return ['personal-development', 'service-skills', selectedAssignmentId.value].includes(tableId)
      })
      .map(([id, table]) => ({
        id,
        label: skillTableLabel(id),
        entries: tableEntries(table as string[] | { entries?: string[] }),
        requirement: Array.isArray(table) ? null : (table as { requirement?: string }).requirement ?? null,
      }))
  })
  const selectedCareerSkillTable = computed(() => {
    return availableCareerSkillTables.value.find((table) => table.id === selectedCareerSkillTableId.value) ?? availableCareerSkillTables.value[0]
  })
  const selectedCareerSkillEntries = computed(() => selectedCareerSkillTable.value?.entries ?? [])
  const careerTermsCompleted = computed(() => {
    return termHistory.value.filter((entry) => entry.path === 'career' && entry.careerId === selectedCareerId.value).length
  })
  const basicTrainingRequired = computed(() => selectedTermPath.value === 'career' && careerTermsCompleted.value === 0)
  const basicTrainingTableId = computed(() => currentCareerTableData.value?.basicTrainingUses === 'assignment' ? selectedAssignmentId.value : 'service-skills')
  const basicTrainingEntries = computed(() => {
    const table = currentCareerSkillTables.value[basicTrainingTableId.value]
    return table ? tableEntries(table as string[] | { entries?: string[] }) : []
  })
  const basicTrainingLabel = computed(() => `${skillTableLabel(basicTrainingTableId.value)} at level 0`)

  watch(selectedCareerId, () => {
    selectedAssignmentId.value = selectedCareer.value.assignments[0].id
    basicTrainingApplied.value = false
    pendingBasicTrainingChoices.value = []
  })

  watch([currentTermNumber, forcedCareerConstraint], () => {
    const constraint = forcedCareerConstraint.value
    if (!constraint?.careerId || !knownCareerIds.value.has(constraint.careerId)) return

    selectedTermPath.value = 'career'
    selectedCareerId.value = constraint.careerId
    if (constraint.assignmentId && constraint.assignmentId !== 'any') {
      const assignmentExists = selectedCareer.value.assignments.some((assignment) => assignment.id === constraint.assignmentId)
      if (assignmentExists) selectedAssignmentId.value = constraint.assignmentId
    }
  }, { immediate: true })

  watch([currentTermNumber, careerOptions], () => {
    if (forcedCareerConstraint.value) return
    const selectedOption = careerOptions.value.find((career) => career.id === selectedCareerId.value)
    if (!selectedOption?.disabled) return

    const nextAvailableCareer = careerOptions.value.find((career) => !career.disabled)
    if (nextAvailableCareer) selectedCareerId.value = nextAvailableCareer.id
  }, { immediate: true })

  watch([currentTermNumber, careerPathLocked], () => {
    if (careerPathLocked.value) selectedTermPath.value = 'career'
  }, { immediate: true })

  watch(selectedAssignmentId, () => {
    basicTrainingApplied.value = false
    pendingBasicTrainingChoices.value = []
  })

  watch(availableCareerSkillTables, (tables) => {
    if (!tables.some((table) => table.id === selectedCareerSkillTableId.value)) {
      selectedCareerSkillTableId.value = tables[0]?.id ?? 'personal-development'
    }
  })

  watch(selectedEducationId, () => {
    educationSkillsApplied.value = false
    universityLevel0Skill.value = ''
    universityLevel1Skill.value = ''
    pendingEducationSkillChoices.value = []
    educationEventExpanded.value = false
  })

  watch(backgroundSkillLimit, (limit) => {
    selectedBackgroundSkills.value = selectedBackgroundSkills.value.slice(0, limit)
  })

  watch(backgroundSkillsComplete, (complete) => {
    if (complete) {
      backgroundSkillsCollapsed.value = true
      backgroundSkillsAutoCollapsed.value = true
      return
    }

    if (backgroundSkillsAutoCollapsed.value) {
      backgroundSkillsCollapsed.value = false
      backgroundSkillsAutoCollapsed.value = false
    }
  })

  watch(assignedRollIds, () => {
    applyAssignedScores()
    selectedBackgroundSkills.value = []
  })

  const toggleBackgroundSkill = (skillId: string) => {
    if (selectedBackgroundSkills.value.includes(skillId)) {
      selectedBackgroundSkills.value = selectedBackgroundSkills.value.filter((id) => id !== skillId)
      return
    }

    if (selectedBackgroundSkills.value.length < backgroundSkillLimit.value) {
      selectedBackgroundSkills.value = [...selectedBackgroundSkills.value, skillId]
    }
  }

  const canSelectBackgroundSkill = (skillId: string) => {
    return selectedBackgroundSkills.value.includes(skillId) || selectedBackgroundSkills.value.length < backgroundSkillLimit.value
  }

  const toggleBackgroundSkillsCollapsed = () => {
    backgroundSkillsCollapsed.value = !backgroundSkillsCollapsed.value
    backgroundSkillsAutoCollapsed.value = false
  }

  const skillName = (skillId: string) => {
    const skill = skillsData.skills.find((item) => item.id === skillId)
    return skill?.name ?? skillId
  }

  const slugifySkill = (value: string) => value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const skillFromLabel = (label: string) => {
    const trimmed = label.trim()
    const slashSpecialityMatch = trimmed.match(/^(.+?)\/(.+)$/)
    if (slashSpecialityMatch) {
      const baseSkill = skillsData.skills.find((item) => item.id === slashSpecialityMatch[1] || item.name.toLowerCase() === slashSpecialityMatch[1].toLowerCase())
      const speciality = slashSpecialityMatch[2] === '*' ? 'any' : slashSpecialityMatch[2]
      return {
        id: `${baseSkill?.id ?? slugifySkill(slashSpecialityMatch[1])}:${slugifySkill(speciality)}`,
        name: `${baseSkill?.name ?? slashSpecialityMatch[1]} (${speciality})`,
      }
    }

    const specialityMatch = trimmed.match(/^(.+?)\s*\((.+)\)$/)
    const baseName = (specialityMatch?.[1] ?? trimmed).trim()
    const speciality = specialityMatch?.[2]?.trim()
    const baseSkill = skillsData.skills.find((item) => item.id === baseName || item.name.toLowerCase() === baseName.toLowerCase())
    const id = speciality
      ? `${baseSkill?.id ?? slugifySkill(baseName)}:${slugifySkill(speciality)}`
      : baseSkill?.id ?? slugifySkill(baseName)
    const name = speciality
      ? `${baseSkill?.name ?? baseName} (${speciality})`
      : baseSkill?.name ?? baseName

    return { id, name }
  }

  const skillOptionLabel = (label: string) => skillFromLabel(label).name
  const safeSkillOptionLabel = (label?: string) => label ? skillOptionLabel(label) : 'Skill'

  const skillLevel = (label: string) => {
    const skill = skillFromLabel(label)
    return appliedSkillRecords[skill.id]?.level ?? -3
  }

  const addSkillSource = (skill: CharacterSkill, source: string) => {
    if (!skill.sources.includes(source)) {
      skill.sources = [...skill.sources, source]
    }
  }

  const setSkillMinimum = (label: string, level: number, source: string) => {
    const skill = skillFromLabel(label)
    const existing = appliedSkillRecords[skill.id]

    if (existing) {
      existing.level = Math.max(existing.level, level)
      addSkillSource(existing, source)
      return
    }

    appliedSkillRecords[skill.id] = {
      id: skill.id,
      name: skill.name,
      level,
      sources: [source],
    }
  }

  const increaseSkill = (label: string, source: string) => {
    const skill = skillFromLabel(label)
    const existing = appliedSkillRecords[skill.id]

    if (existing) {
      existing.level += 1
      addSkillSource(existing, source)
      return
    }

    appliedSkillRecords[skill.id] = {
      id: skill.id,
      name: skill.name,
      level: 1,
      sources: [source],
    }
  }

  const applyCharacteristicIncrease = (result: string) => {
    const match = result.trim().match(/^(STR|DEX|END|INT|EDU|SOC)\s*\+(\d+)$/i)
    if (!match) return false

    const characteristicId = match[1].toLowerCase() as CharacteristicId
    characteristicAdjustments[characteristicId] += Number(match[2])
    applyAssignedScores()
    return true
  }

  const splitChoiceResult = (result: string) => {
    let depth = 0
    for (let index = 0; index < result.length; index += 1) {
      const character = result[index]
      if (character === '(') depth += 1
      if (character === ')') depth = Math.max(0, depth - 1)
      if (depth === 0 && result.slice(index, index + 4).toLowerCase() === ' or ') {
        return [
          result.slice(0, index).trim(),
          result.slice(index + 4).trim(),
        ]
      }
    }

    return null
  }

  const applyTrainingResult = (result: string, source: string) => {
    const choice = splitChoiceResult(result)
    if (choice) {
      pendingSkillChoice.value = {
        label: result,
        source,
        options: choice,
      }
      return false
    }

    const parts = result.split(/\s+and\s+/i).map((part) => part.trim()).filter(Boolean)
    if (parts.length > 1 && parts.every((part) => /^(STR|DEX|END|INT|EDU|SOC)\s*\+\d+$/i.test(part))) {
      parts.forEach((part) => applyCharacteristicIncrease(part))
      return true
    }

    if (applyCharacteristicIncrease(result)) return true

    const fixedLevel = result.trim().match(/^(.+?)\s+(\d+)$/)
    if (fixedLevel) {
      setSkillMinimum(fixedLevel[1], Number(fixedLevel[2]), source)
      return true
    }

    increaseSkill(result, source)
    return true
  }

  const resolvePendingSkillChoice = (choice: string) => {
    const pending = pendingSkillChoice.value
    if (!pending) return

    pendingSkillChoice.value = null
    careerSkillResult.value = choice
    if (typeof pending.level === 'number') {
      setSkillMinimum(choice, pending.level, pending.source)
      return
    }
    if (pending.increase) {
      increaseSkill(choice, pending.source)
      return
    }
    applyTrainingResult(choice, pending.source)
  }

  const applyBasicTraining = () => {
    pendingBasicTrainingChoices.value = []

    for (const entry of basicTrainingEntries.value) {
      const choice = splitChoiceResult(entry)
      if (choice) {
        pendingBasicTrainingChoices.value.push({
          label: entry,
          options: choice,
        })
        continue
      }

      setSkillMinimum(entry, 0, 'Basic Training')
    }

    basicTrainingApplied.value = pendingBasicTrainingChoices.value.length === 0
  }

  const resolveBasicTrainingChoice = (index: number, choice: string) => {
    const pending = pendingBasicTrainingChoices.value[index]
    if (!pending || pending.selected) return

    setSkillMinimum(choice, 0, 'Basic Training')
    pendingBasicTrainingChoices.value[index] = {
      ...pending,
      selected: choice,
    }

    basicTrainingApplied.value = pendingBasicTrainingChoices.value.every((item) => item.selected)
  }

  const applyEducationSkills = () => {
    pendingEducationSkillChoices.value = []

    if (!selectedEducation.value) return

    if (selectedEducation.value.id === 'university') {
      if (!universityLevel0Skill.value || !universityLevel1Skill.value) return
      setSkillMinimum(universityLevel0Skill.value, 0, 'Education')
      setSkillMinimum(universityLevel1Skill.value, 1, 'Education')
      educationSkillsApplied.value = true
      return
    }

    for (const entry of militaryAcademyServiceSkills.value) {
      const choice = splitChoiceResult(entry)
      if (choice) {
        pendingEducationSkillChoices.value.push({
          label: entry,
          level: 0,
          options: choice,
        })
        continue
      }

      setSkillMinimum(entry, 0, 'Education')
    }

    educationSkillsApplied.value = pendingEducationSkillChoices.value.length === 0
  }

  const resolveEducationSkillChoice = (index: number, choice: string) => {
    const pending = pendingEducationSkillChoices.value[index]
    if (!pending || pending.selected) return

    setSkillMinimum(choice, pending.level, 'Education')
    pendingEducationSkillChoices.value[index] = {
      ...pending,
      selected: choice,
    }

    educationSkillsApplied.value = pendingEducationSkillChoices.value.every((item) => item.selected)
  }

  const currentTravellerSkills = computed<CharacterSkill[]>(() => {
    const skills = new Map<string, CharacterSkill>()

    for (const skillId of selectedBackgroundSkills.value) {
      skills.set(skillId, {
        id: skillId,
        name: skillName(skillId),
        level: 0,
        sources: ['Background'],
      })
    }

    for (const skill of Object.values(appliedSkillRecords)) {
      const existing = skills.get(skill.id)
      if (existing) {
        existing.level = Math.max(existing.level, skill.level)
        for (const source of skill.sources) addSkillSource(existing, source)
        continue
      }

      skills.set(skill.id, {
        id: skill.id,
        name: skill.name,
        level: skill.level,
        sources: [...skill.sources],
      })
    }

    return [...skills.values()].sort((left, right) => left.name.localeCompare(right.name))
  })

  const checkLabel = (check: CheckRule) => {
    if (check.automatic) return 'Automatic'
    if (check.any) return check.any.map((item) => `${item.characteristic.toUpperCase()} ${item.target}+`).join(' or ')
    return `${check.characteristic?.toUpperCase()} ${check.target}+`
  }

  const preferredCheckRule = (check: CheckRule): { characteristic?: string; target: number; automatic?: boolean } => {
    if (check.automatic) return { target: 0, automatic: true }
    if (check.any?.length) return check.any[0]
    return {
      characteristic: check.characteristic,
      target: check.target ?? 8,
    }
  }

  const checkDm = (check: CheckRule) => {
    const rule = preferredCheckRule(check)
    if (!rule.characteristic) return 0
    return diceModifier(values[rule.characteristic as CharacteristicId] ?? 0)
  }

  const handleEducationEntryOutcome = () => {
    const entry = termRolls.educationEntry
    if (!entry) return

    if (!entry.finalSuccess) {
      termRolls.educationEvent = null
      termRolls.educationGraduation = null
      manualRollTotals.educationEvent = null
      manualRollTotals.educationGraduation = null
      selectedTermPath.value = 'career'
      return
    }

    const careerAttemptStarted = Boolean(termRolls.careerQualification || termRolls.careerSkill || termRolls.careerSurvival || termRolls.careerAdvancement)
    if (!careerAttemptStarted) {
      selectedTermPath.value = 'education'
    }
  }

  const resetEventResolutionState = (event: TravellerEvent | null) => {
    activeEvent.value = event
    pendingEventResolutions.value = []
  }

  const addPendingEventResolution = (resolution: Omit<PendingEventResolution, 'id'>) => {
    const id = `${resolution.source}-${resolution.kind}-${pendingEventResolutions.value.length}`
    pendingEventResolutions.value = [
      ...pendingEventResolutions.value,
      {
        id,
        ...resolution,
      },
    ]
    return id
  }

  const makeEventOutcomeId = (prefix = 'event-outcome') => `${prefix}-${Date.now()}-${eventOutcomeLog.value.length}`

  const recordEventOutcome = (
    source: string,
    effect: TravellerEventEffect,
    label = tableEffectLabel(effect),
    status: EventOutcomeLogEntry['status'] = 'automatic',
  ) => {
    const entry = {
      id: makeEventOutcomeId(),
      source,
      label,
      effectType: effect.type,
      normalizedType: effect.normalizedType,
      status,
    }

    eventOutcomeLog.value = [entry, ...eventOutcomeLog.value].slice(0, 24)
    return entry.id
  }

  const rollModifierTarget = (effect: TravellerEventEffect): TravellerRollModifier['target'] => {
    if (effect.type.includes('advancement')) return 'advancement'
    if (effect.type.includes('qualification')) return 'qualification'
    if (effect.type.includes('benefit')) return 'benefit'
    if (effect.type.includes('survival')) return 'survival'
    return 'any'
  }

  const rollModifierScope = (effect: TravellerEventEffect): TravellerRollModifier['scope'] => {
    if (effect.type.startsWith('next_')) return 'next'
    if (effect.type.startsWith('one_')) return 'one'
    if (effect.type.includes('career')) return 'career'
    return 'any'
  }

  const addManualEventResolution = (effect: TravellerEventEffect, source: string, label = tableEffectLabel(effect)) => {
    addPendingEventResolution({
      kind: 'manual',
      label,
      source,
      effect,
    })
    recordEventOutcome(source, effect, label, 'pending')
  }

  const tableRollDiceCount = (tableId: string): 1 | 2 => {
    if (tableId === 'life-events') return 2
    if (tableId === 'events') return 2
    return 1
  }

  const addTableRollResolution = (effect: TravellerEventEffect, source: string, tableId: string, label = tableEffectLabel(effect)) => {
    addPendingEventResolution({
      kind: 'table_roll',
      label,
      source,
      effect,
      tableId,
      diceCount: tableRollDiceCount(tableId),
    })
    recordEventOutcome(source, effect, label, 'pending')
  }

  const eventCheckLabel = (effect: TravellerEventEffect) => {
    const check = effect.check as Record<string, any> | undefined
    if (check?.characteristic) return `${String(check.characteristic).toUpperCase()} ${check.target ?? 8}+`
    if (check?.skill) return `${skillOptionLabel(String(check.skill))} ${check.target ?? 8}+`
    if (effect.type === 'check_known_term_skill') return `Known term skill ${effect.target ?? 8}+`
    return `Check ${check?.target ?? effect.target ?? 8}+`
  }

  const eventCheckTarget = (effect: TravellerEventEffect) => {
    const check = effect.check as Record<string, any> | undefined
    return Number(check?.target ?? effect.target ?? 8)
  }

  const eventCheckDm = (effect: TravellerEventEffect) => {
    const check = effect.check as Record<string, any> | undefined
    if (check?.characteristic) return diceModifier(values[String(check.characteristic) as CharacteristicId] ?? 0)
    if (check?.skill) return skillLevel(String(check.skill))
    return 0
  }

  const addCheckResolution = (effect: TravellerEventEffect, source: string, label = tableEffectLabel(effect)) => {
    addPendingEventResolution({
      kind: 'check',
      label,
      source,
      effect,
      check: {
        label: eventCheckLabel(effect),
        target: eventCheckTarget(effect),
        dm: eventCheckDm(effect),
      },
    })
    recordEventOutcome(source, effect, label, 'pending')
  }

  const normalizeEffectInput = (effect: unknown): TravellerEventEffect | null => {
    if (!effect || typeof effect !== 'object' || !('type' in effect)) return null
    return normalizeTravellerEventEffect({ ...(effect as TravellerEventEffect) })
  }

  const normalizeBranchEffects = (effects?: unknown) => Array.isArray(effects)
    ? effects.map((effect) => normalizeEffectInput(effect)).filter((effect): effect is TravellerEventEffect => Boolean(effect))
    : []

  const eventChoiceOptionLabel = (effect: TravellerEventEffect, index = 0) => {
    if (effect.label && typeof effect.label === 'string') return effect.label
    return tableEffectLabel(effect) || `Option ${index + 1}`
  }

  const eventChoiceOptions = (effect: TravellerEventEffect): EventChoiceOption[] => {
    if (!Array.isArray(effect.options)) return []

    return effect.options.map((option, index) => {
      const optionRecord = option as Record<string, unknown>
      const effects = Array.isArray(optionRecord.effects)
        ? normalizeBranchEffects(optionRecord.effects)
        : [normalizeEffectInput(option)].filter((nestedEffect): nestedEffect is TravellerEventEffect => Boolean(nestedEffect))
      const label = typeof optionRecord.label === 'string'
        ? optionRecord.label
        : effects.map((nestedEffect, nestedIndex) => eventChoiceOptionLabel(nestedEffect, nestedIndex)).join(', ')

      return {
        id: `${index}-${label}`,
        label,
        effects,
      }
    })
  }

  const addChoiceResolution = (effect: TravellerEventEffect, source: string, label = tableEffectLabel(effect)) => {
    const choiceOptions = eventChoiceOptions(effect)
    if (!choiceOptions.length) {
      addManualEventResolution(effect, source, label)
      return
    }

    addPendingEventResolution({
      kind: 'choice',
      label,
      source,
      effect,
      choiceOptions,
    })
    recordEventOutcome(source, effect, label, 'pending')
  }

  const associateTypeOptions = (effect: TravellerEventEffect) => Array.isArray(effect.associateTypes)
    ? effect.associateTypes.map(String)
    : ['associate']

  const addAssociateResolution = (effect: TravellerEventEffect, source: string, label = tableEffectLabel(effect)) => {
    const count = typeof effect.count === 'number' ? Math.max(1, effect.count) : 1
    const associateCount = typeof effect.count === 'number' || typeof effect.count === 'string' ? effect.count : 1
    const associateTypes = associateTypeOptions(effect)
    const associateTags = Array.isArray(effect.tags) ? effect.tags.map(String) : undefined
    const associateContext = typeof effect.context === 'string' ? effect.context : undefined

    for (let index = 0; index < count; index += 1) {
      addPendingEventResolution({
        kind: 'associate',
        label: count > 1 ? `${label} (${index + 1} of ${count})` : label,
        source,
        effect,
        associateTypes,
        associateCount,
        associateTags,
        associateContext,
      })
    }
    recordEventOutcome(source, effect, label, 'pending')
  }

  const applyEventEffect = (effect: TravellerEventEffect, event: TravellerEvent, sourcePrefix = 'Event') => {
    const source = `${sourcePrefix}: ${event.name}`
    const normalizedType = effect.normalizedType ?? effect.type

    if (normalizedType === 'check') {
      addCheckResolution(effect, source)
      return
    }

    if (normalizedType === 'choice') {
      addChoiceResolution(effect, source)
      return
    }

    if (effect.type === 'set_skill' && effect.skillId && typeof effect.level === 'number') {
      setSkillMinimum(String(effect.skillId), effect.level, source)
      recordEventOutcome(source, effect)
      return
    }

    if (effect.type === 'increase_skill' && effect.skillId) {
      const amount = typeof effect.amount === 'number' ? effect.amount : 1
      for (let count = 0; count < amount; count += 1) increaseSkill(String(effect.skillId), source)
      recordEventOutcome(source, effect)
      return
    }

    if ((effect.type === 'characteristic_change' || effect.type === 'characteristic_increase') && effect.characteristic && typeof effect.amount === 'number') {
      const characteristicId = effect.characteristic as CharacteristicId
      characteristicAdjustments[characteristicId] += effect.amount
      applyAssignedScores()
      recordEventOutcome(source, effect)
      return
    }

    if ((effect.type === 'choose_skill_set' || effect.type === 'choose_skill_increase') && Array.isArray(effect.skills) && effect.skills.length) {
      const label = tableEffectLabel(effect)
      addPendingEventResolution({
        kind: 'skill_choice',
        label,
        source,
        effect,
        options: effect.skills.map(String),
        level: effect.type === 'choose_skill_set' ? (typeof effect.level === 'number' ? effect.level : 1) : undefined,
        increase: effect.type === 'choose_skill_increase',
      })
      recordEventOutcome(source, effect, label, 'pending')
      return
    }

    if (effect.type === 'education_graduation') {
      recordEventOutcome(source, effect)
      return
    }

    if (normalizedType === 'roll_modifier' && typeof effect.dm === 'number') {
      const label = tableEffectLabel(effect)
      rollModifiers.value = [
        ...rollModifiers.value,
        {
          id: makeEventOutcomeId('roll-modifier'),
          source,
          label,
          target: rollModifierTarget(effect),
          dm: effect.dm,
          scope: rollModifierScope(effect),
        },
      ]
      recordEventOutcome(source, effect, label)
      return
    }

    if (normalizedType === 'associate_gain') {
      addAssociateResolution(effect, source)
      return
    }

    if (normalizedType === 'benefit_roll_change') {
      const label = tableEffectLabel(effect)
      const amount = typeof effect.count === 'number' ? effect.count : 1
      const adjustment = effect.type.includes('lose') ? -amount : amount
      benefitRollAdjustments.value = [
        ...benefitRollAdjustments.value,
        {
          id: makeEventOutcomeId('benefit-adjustment'),
          source,
          label,
          adjustment,
          dm: typeof effect.dm === 'number' ? effect.dm : undefined,
          scope: effect.type.includes('current_term') || effect.type.includes('current-term') ? 'current-term' : 'any',
        },
      ]

      if (effect.resolution === 'manual') addManualEventResolution(effect, source, label)
      else recordEventOutcome(source, effect, label)
      return
    }

    if (normalizedType === 'table_roll' || normalizedType === 'injury') {
      const tableId = typeof effect.tableId === 'string'
        ? effect.tableId
        : typeof effect.subtable === 'string'
          ? effect.subtable
        : effect.type === 'injury'
          ? 'injury'
          : ''
      if (tableId) {
        addTableRollResolution(effect, source, tableId)
        return
      }
    }

    if (normalizedType === 'forced_out' || normalizedType === 'career_transition' || normalizedType === 'career_permission') {
      const label = tableEffectLabel(effect)
      careerConstraints.value = [
        ...careerConstraints.value,
        {
          id: makeEventOutcomeId('career-constraint'),
          source,
          label,
          effectType: effect.type,
          appliesTermNumber: currentTermNumber.value + 1,
          careerId: typeof effect.careerId === 'string'
            ? effect.careerId
            : effect.type === 'forced_out'
              ? selectedCareerId.value
              : undefined,
          assignmentId: typeof effect.assignmentId === 'string' ? effect.assignmentId : undefined,
          forcedOut: effect.type === 'forced_out' ? true : effect.type === 'not_forced_out' ? false : undefined,
          draftNextTerm: effect.type === 'draft_next_term',
        },
      ]

      if (effect.resolution === 'manual' || effect.resolution === 'table') addManualEventResolution(effect, source, label)
      else recordEventOutcome(source, effect, label)
      return
    }

    const label = effect.type === 'choose_skill' || effect.type === 'increase_existing_skill' || effect.type === 'increase_any_existing_skill'
      ? `${tableEffectLabel(effect)} manually.`
      : tableEffectLabel(effect)

    addManualEventResolution(effect, source, label)
  }

  const applyTravellerEventEffects = (event: TravellerEvent, sourcePrefix: string) => {
    resetEventResolutionState(event)
    for (const effect of event.effects) {
      applyEventEffect(effect, event, sourcePrefix)
    }
  }

  const applyPreCareerEvent = (event: TravellerEvent) => {
    applyTravellerEventEffects(event, 'Pre-Career Event')
  }

  const eventForcesGraduationFailure = (event: { effects?: Array<Record<string, any>> | TravellerEventEffect[] }) => {
    return (event.effects ?? []).some((effect) => effect.type === 'education_graduation' && effect.result === 'fail')
  }

  const makePreCareerEventRoll = (dice: number[], source: 'rolled' | 'manual') => {
    const total = dice.reduce((sum, value) => sum + value, 0)
    const event = getEducationEvent(total)
    if (!event) return

    termRolls.educationEvent = {
      label: 'Pre-Career Event',
      dice,
      dm: 0,
      total,
      target: 0,
      effect: 0,
      success: true,
      finalSuccess: true,
      source,
      notes: event.name,
    }
    educationEventExpanded.value = false
    applyPreCareerEvent(event)

    if (eventForcesGraduationFailure(event)) {
      termRolls.educationGraduation = {
        label: 'Graduation',
        dice: [],
        dm: 0,
        total: 0,
        target: 1,
        effect: -1,
        success: false,
        finalSuccess: false,
        source,
        notes: `${event.name} prevents graduation`,
      }
    }
  }

  const rollPreCareerEvent = () => {
    makePreCareerEventRoll([Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)], 'rolled')
  }

  const enterManualPreCareerEvent = () => {
    const manualTotal = manualRollTotals.educationEvent
    if (manualTotal === null || Number.isNaN(manualTotal)) return
    if (manualTotal < 2 || manualTotal > 12) return
    makePreCareerEventRoll([manualTotal], 'manual')
  }

  const rollModifierTargetForKey = (key: string): TravellerRollModifier['target'] => {
    const targets: Record<string, TravellerRollModifier['target']> = {
      careerAdvancement: 'advancement',
      careerQualification: 'qualification',
      careerSurvival: 'survival',
    }

    return targets[key] ?? 'any'
  }

  const activeRollModifiersFor = (key: string) => {
    const target = rollModifierTargetForKey(key)
    return rollModifiers.value.filter((modifier) => {
      if (modifier.used) return false
      if (modifier.target !== target && modifier.target !== 'any') return false
      return modifier.scope === 'one' || modifier.scope === 'next' || modifier.scope === 'any' || modifier.scope === 'career' || modifier.scope === 'term'
    })
  }

  const consumeRollModifiers = (modifiers: TravellerRollModifier[], rollLabel: string) => {
    const consumedIds = modifiers
      .filter((modifier) => modifier.scope === 'one' || modifier.scope === 'next')
      .map((modifier) => modifier.id)

    if (!consumedIds.length) return

    rollModifiers.value = rollModifiers.value.map((modifier) => consumedIds.includes(modifier.id)
      ? { ...modifier, used: true }
      : modifier)

    for (const modifier of modifiers.filter((modifier) => consumedIds.includes(modifier.id))) {
      eventOutcomeLog.value = [
        {
          id: makeEventOutcomeId('roll-modifier-used'),
          source: modifier.source,
          label: `${modifier.label} applied to ${rollLabel}`,
          effectType: 'roll_modifier',
          normalizedType: 'roll_modifier',
          status: 'automatic',
        },
        ...eventOutcomeLog.value,
      ].slice(0, 24)
    }
  }

  const makeRollResult = (key: string, label: string, check: CheckRule, dice: number[], source: 'rolled' | 'manual') => {
    const rule = preferredCheckRule(check)
    const matchingModifiers = activeRollModifiersFor(key)
    const modifierDm = matchingModifiers.reduce((sum, modifier) => sum + modifier.dm, 0)
    const dm = checkDm(check) + modifierDm
    const diceTotal = dice.reduce((sum, value) => sum + value, 0)
    const total = diceTotal + dm
    const target = rule.target
    const success = rule.automatic ? true : total >= target
    const modifierNotes = matchingModifiers.length
      ? `Applied modifiers: ${matchingModifiers.map((modifier) => modifier.label).join(', ')}`
      : undefined

    termRolls[key] = {
      label,
      dice,
      dm,
      total,
      target,
      effect: total - target,
      success,
      finalSuccess: success,
      source,
      notes: modifierNotes,
    }
    consumeRollModifiers(matchingModifiers, label)

    if (key === 'educationEntry') handleEducationEntryOutcome()
  }

  const rollCheck = (key: string, label: string, check: CheckRule) => {
    if (check.automatic) {
      makeRollResult(key, label, check, [], 'rolled')
      return
    }

    makeRollResult(key, label, check, [Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)], 'rolled')
  }

  const enterManualCheck = (key: string, label: string, check: CheckRule) => {
    const manualTotal = manualRollTotals[key]
    if (manualTotal === null || Number.isNaN(manualTotal)) return
    makeRollResult(key, label, check, [manualTotal], 'manual')
  }

  const toggleRollOverride = (key: string) => {
    const roll = termRolls[key]
    if (!roll) return

    roll.overridden = !roll.overridden
    roll.finalSuccess = roll.overridden ? !roll.success : roll.success

    if (key === 'educationEntry') handleEducationEntryOutcome()
  }

  const rollSummary = (roll: RollResult) => {
    const diceText = roll.dice.length ? roll.dice.join(' + ') : 'Automatic'
    return `${diceText} ${formatDm(roll.dm)} = ${roll.total}`
  }

  const makeCareerSkillRoll = (die: number, source: 'rolled' | 'manual') => {
    const result = selectedCareerSkillEntries.value[die - 1]
    if (!result) return

    pendingSkillChoice.value = null
    careerSkillResult.value = result
    termRolls.careerSkill = {
      label: `${skillTableLabel(selectedCareerSkillTableId.value)} Skill`,
      dice: [die],
      dm: 0,
      total: die,
      target: 0,
      effect: 0,
      success: true,
      finalSuccess: true,
      source,
      notes: result,
    }
    applyTrainingResult(result, 'Career Training')
  }

  const rollCareerSkillTable = () => {
    makeCareerSkillRoll(Math.ceil(Math.random() * 6), 'rolled')
  }

  const enterManualCareerSkillTable = () => {
    const manualTotal = manualRollTotals.careerSkill
    if (manualTotal === null || Number.isNaN(manualTotal)) return
    if (manualTotal < 1 || manualTotal > 6) return
    makeCareerSkillRoll(manualTotal, 'manual')
  }

  const applyCareerTableEffects = (event: TravellerEvent, sourcePrefix: string) => {
    applyTravellerEventEffects(event, sourcePrefix)
  }

  const syntheticEventForResolution = (source: string): TravellerEvent => ({
    id: source.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    source: 'subtable',
    tableId: 'resolved-effects',
    roll: 0,
    name: 'Outcome',
    text: '',
    effects: [],
    raw: {},
  })

  const applyResolvedEffects = (effects: TravellerEventEffect[], source: string) => {
    const syntheticEvent = syntheticEventForResolution(source)
    for (const effect of effects) {
      applyEventEffect(normalizeTravellerEventEffect({ ...effect }), syntheticEvent, source)
    }
  }

  const resolveEventTableRoll = (resolution: PendingEventResolution, total: number, source: 'rolled' | 'manual') => {
    if (!resolution.tableId || resolution.resolved) return

    const nestedEvent = getEventFromTable(resolution.tableId, total, selectedCareerId.value)
    if (!nestedEvent) return

    pendingEventResolutions.value = pendingEventResolutions.value.map((item) => {
      if (item.id !== resolution.id) return item
      return {
        ...item,
        resolved: true,
        selected: `${nestedEvent.name} (${source})`,
      }
    })
    recordEventOutcome(resolution.source, resolution.effect, `${resolution.label}: ${nestedEvent.name}`, 'manual')

    for (const effect of nestedEvent.effects) {
      applyEventEffect(effect, nestedEvent, nestedEvent.name)
    }
  }

  const checkBranchEffects = (effect: TravellerEventEffect, diceTotal: number, finalTotal: number) => {
    const target = eventCheckTarget(effect)
    const effects = [
      ...normalizeBranchEffects(effect.always),
      ...(diceTotal === 2 ? normalizeBranchEffects(effect.naturalTwo) : []),
      ...(finalTotal >= target ? normalizeBranchEffects(effect.success) : normalizeBranchEffects(effect.failure)),
    ]

    return effects
  }

  const resolveEventCheck = (resolution: PendingEventResolution, diceTotal: number, source: 'rolled' | 'manual') => {
    if (resolution.kind !== 'check' || !resolution.check || resolution.resolved) return

    const finalTotal = diceTotal + resolution.check.dm
    const succeeded = finalTotal >= resolution.check.target
    const selected = `${diceTotal} ${formatDm(resolution.check.dm)} = ${finalTotal} (${succeeded ? 'success' : 'failure'}, ${source})`
    const branchEffects = checkBranchEffects(resolution.effect, diceTotal, finalTotal)

    pendingEventResolutions.value = pendingEventResolutions.value.map((item) => {
      if (item.id !== resolution.id) return item
      return {
        ...item,
        resolved: true,
        selected,
      }
    })
    recordEventOutcome(resolution.source, resolution.effect, `${resolution.label}: ${selected}`, 'manual')

    if (branchEffects.length) applyResolvedEffects(branchEffects, resolution.source)
  }

  const rollEventResolutionCheck = (resolutionId: string) => {
    const resolution = pendingEventResolutions.value.find((item) => item.id === resolutionId)
    if (!resolution || resolution.kind !== 'check') return

    resolveEventCheck(resolution, Math.ceil(Math.random() * 6) + Math.ceil(Math.random() * 6), 'rolled')
  }

  const enterManualEventResolutionCheck = (resolutionId: string, total: number) => {
    const resolution = pendingEventResolutions.value.find((item) => item.id === resolutionId)
    if (!resolution || resolution.kind !== 'check') return
    if (Number.isNaN(total) || total < 2 || total > 12) return

    resolveEventCheck(resolution, total, 'manual')
  }

  const resolveEventOutcomeChoice = (resolutionId: string, optionId: string) => {
    const resolution = pendingEventResolutions.value.find((item) => item.id === resolutionId)
    if (!resolution || resolution.kind !== 'choice' || resolution.resolved) return

    const option = resolution.choiceOptions?.find((item) => item.id === optionId)
    if (!option) return

    pendingEventResolutions.value = pendingEventResolutions.value.map((item) => {
      if (item.id !== resolutionId) return item
      return {
        ...item,
        resolved: true,
        selected: option.label,
      }
    })
    recordEventOutcome(resolution.source, resolution.effect, `${resolution.label}: ${option.label}`, 'manual')
    applyResolvedEffects(option.effects, resolution.source)
  }

  const resolveEventAssociate = (resolutionId: string, associateType: string, name: string, notes = '') => {
    const resolution = pendingEventResolutions.value.find((item) => item.id === resolutionId)
    if (!resolution || resolution.kind !== 'associate' || resolution.resolved) return

    const type = associateType || resolution.associateTypes?.[0] || 'associate'
    const trimmedName = name.trim()
    const fallbackName = `${type.charAt(0).toUpperCase()}${type.slice(1)} from ${resolution.source}`
    const associateName = trimmedName || fallbackName
    const trimmedNotes = notes.trim()

    associates.value = [
      ...associates.value,
      {
        id: makeEventOutcomeId('associate'),
        source: resolution.source,
        type,
        name: associateName,
        notes: trimmedNotes || undefined,
        context: resolution.associateContext,
        tags: resolution.associateTags,
      },
    ]

    pendingEventResolutions.value = pendingEventResolutions.value.map((item) => {
      if (item.id !== resolutionId) return item
      return {
        ...item,
        resolved: true,
        selected: `${type}: ${associateName}`,
      }
    })
    recordEventOutcome(resolution.source, resolution.effect, `Gained ${type}: ${associateName}`, 'manual')
  }

  const rollEventResolutionTable = (resolutionId: string) => {
    const resolution = pendingEventResolutions.value.find((item) => item.id === resolutionId)
    if (!resolution || resolution.kind !== 'table_roll' || !resolution.tableId) return

    const total = resolution.diceCount === 2
      ? Math.ceil(Math.random() * 6) + Math.ceil(Math.random() * 6)
      : Math.ceil(Math.random() * 6)
    resolveEventTableRoll(resolution, total, 'rolled')
  }

  const enterManualEventResolutionTable = (resolutionId: string, total: number) => {
    const resolution = pendingEventResolutions.value.find((item) => item.id === resolutionId)
    if (!resolution || resolution.kind !== 'table_roll' || !resolution.tableId) return
    if (Number.isNaN(total)) return

    const min = resolution.diceCount === 2 ? 2 : 1
    const max = resolution.diceCount === 2 ? 12 : 6
    if (total < min || total > max) return

    resolveEventTableRoll(resolution, total, 'manual')
  }

  const resolveEventChoice = (resolutionId: string, choice: string) => {
    const resolution = pendingEventResolutions.value.find((item) => item.id === resolutionId)
    if (!resolution || resolution.resolved) return

    if (resolution.kind === 'skill_choice') {
      if (typeof resolution.level === 'number') {
        setSkillMinimum(choice, resolution.level, resolution.source)
      } else if (resolution.increase) {
        increaseSkill(choice, resolution.source)
      }
    }

    pendingEventResolutions.value = pendingEventResolutions.value.map((item) => {
      if (item.id !== resolutionId) return item
      return {
        ...item,
        resolved: true,
        selected: choice,
      }
    })

    recordEventOutcome(resolution.source, resolution.effect, `${resolution.label}: ${skillOptionLabel(choice)}`, 'manual')
  }

  const eventResolutionSelectedLabel = (resolution: PendingEventResolution) => {
    if (!resolution.selected) return ''
    if (resolution.kind === 'skill_choice') return skillOptionLabel(resolution.selected)
    return resolution.selected
  }

  const associateTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ally: 'Ally',
      contact: 'Contact',
      enemy: 'Enemy',
      rival: 'Rival',
    }

    return labels[type] ?? `${type.charAt(0).toUpperCase()}${type.slice(1)}`
  }

  const resolveManualEventResolution = (resolutionId: string) => {
    const resolution = pendingEventResolutions.value.find((item) => item.id === resolutionId)
    if (!resolution || resolution.resolved || resolution.kind !== 'manual') return

    pendingEventResolutions.value = pendingEventResolutions.value.map((item) => {
      if (item.id !== resolutionId) return item
      return {
        ...item,
        resolved: true,
        selected: 'Acknowledged',
      }
    })

    recordEventOutcome(resolution.source, resolution.effect, resolution.label, 'manual')
  }

  const makeCareerEventRoll = (dice: number[], source: 'rolled' | 'manual') => {
    const total = dice.reduce((sum, value) => sum + value, 0)
    const event = getCareerEvent(selectedCareerId.value, total)
    if (!event) return

    termRolls.careerEvent = {
      label: 'Career Event',
      dice,
      dm: 0,
      total,
      target: 0,
      effect: 0,
      success: true,
      finalSuccess: true,
      source,
      notes: event.name,
    }
    careerEventExpanded.value = true
    applyCareerTableEffects(event, 'Career Event')
  }

  const rollCareerEvent = () => {
    makeCareerEventRoll([Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)], 'rolled')
  }

  const enterManualCareerEvent = () => {
    const manualTotal = manualRollTotals.careerEvent
    if (manualTotal === null || Number.isNaN(manualTotal)) return
    if (manualTotal < 2 || manualTotal > 12) return
    makeCareerEventRoll([manualTotal], 'manual')
  }

  const makeCareerMishapRoll = (die: number, source: 'rolled' | 'manual') => {
    const mishap = getCareerMishap(selectedCareerId.value, die)
    if (!mishap) return

    termRolls.careerMishap = {
      label: 'Career Mishap',
      dice: [die],
      dm: 0,
      total: die,
      target: 0,
      effect: 0,
      success: true,
      finalSuccess: true,
      source,
      notes: mishap.name,
    }
    careerMishapExpanded.value = true
    applyCareerTableEffects(mishap, 'Career Mishap')
  }

  const rollCareerMishap = () => {
    makeCareerMishapRoll(Math.ceil(Math.random() * 6), 'rolled')
  }

  const enterManualCareerMishap = () => {
    const manualTotal = manualRollTotals.careerMishap
    if (manualTotal === null || Number.isNaN(manualTotal)) return
    if (manualTotal < 1 || manualTotal > 6) return
    makeCareerMishapRoll(manualTotal, 'manual')
  }

  const resetTermRolls = () => {
    for (const key of Object.keys(termRolls)) {
      termRolls[key] = null
      manualRollTotals[key] = null
    }
    educationSkillsApplied.value = false
    universityLevel0Skill.value = ''
    universityLevel1Skill.value = ''
    pendingEducationSkillChoices.value = []
    educationEventExpanded.value = false
    careerSkillResult.value = null
    pendingSkillChoice.value = null
    activeEvent.value = null
    pendingEventResolutions.value = []
    careerEventExpanded.value = false
    careerMishapExpanded.value = false
    basicTrainingApplied.value = false
    pendingBasicTrainingChoices.value = []
  }

  const agingEffect = computed(() => {
    const roll = termRolls.aging
    if (!roll) return null

    const table = (agingData.aging.table as Array<Record<string, any>>).find((row) => {
      if ('total' in row && row.total === roll.total) return true
      if ('totalMax' in row && roll.total <= row.totalMax) return true
      if ('totalMin' in row && roll.total >= row.totalMin) return true
      return false
    })

    if (!table || !table.effects.length) return 'No aging effect'
    return table.effects.map((effect: Record<string, any>) => {
      const category = 'category' in effect ? effect.category : 'characteristic'
      return `${effect.count} ${category} ${effect.amount}`
    }).join(', ')
  })

  const rollAging = () => {
    const dice = [Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)]
    const diceTotal = dice.reduce((sum, value) => sum + value, 0)
    const dm = -currentTermNumber.value
    const total = diceTotal + dm
    termRolls.aging = {
      label: 'Aging',
      dice,
      dm,
      total,
      target: 1,
      effect: total - 1,
      success: total >= 1,
      finalSuccess: total >= 1,
      source: 'rolled',
    }
  }

  const enterManualAging = () => {
    const manualTotal = manualRollTotals.aging
    if (manualTotal === null || Number.isNaN(manualTotal)) return

    const dm = -currentTermNumber.value
    const total = manualTotal + dm
    termRolls.aging = {
      label: 'Aging',
      dice: [manualTotal],
      dm,
      total,
      target: 1,
      effect: total - 1,
      success: total >= 1,
      finalSuccess: total >= 1,
      source: 'manual',
    }
  }

  const canCompleteTerm = computed(() => {
    if (lifepathComplete.value) return false
    if (agingRequired.value && !termRolls.aging) return false

    if (selectedTermPath.value === 'education') {
      if (!educationAvailable.value) return false
      if (!termRolls.educationEntry) return false
      if (!termRolls.educationEntry.finalSuccess) return false
      if (!educationSkillsApplied.value) return false
      if (!termRolls.educationEvent) return false
      return Boolean(termRolls.educationGraduation)
    }

    if (!termRolls.careerQualification) return false
    if (!termRolls.careerQualification.finalSuccess) return false
    if (basicTrainingRequired.value && !basicTrainingApplied.value) return false
    if (!termRolls.careerSkill || pendingSkillChoice.value) return false
    if (!termRolls.careerSurvival) return false
    if (!termRolls.careerSurvival.finalSuccess) return Boolean(termRolls.careerMishap) && !pendingEventResolutions.value.some((resolution) => !resolution.resolved)
    if (!termRolls.careerEvent) return false
    if (pendingEventResolutions.value.some((resolution) => !resolution.resolved)) return false
    return Boolean(termRolls.careerAdvancement)
  })
  const canAddTermTab = computed(() => {
    if (lifepathComplete.value) return false
    if (activeCreatorTab.value === 'creation') return true
    if (activeCreatorTab.value !== currentTermTabId.value) return false
    return canCompleteTerm.value
  })
  const nextTermButtonLabel = computed(() => {
    if (activeCreatorTab.value === 'creation') return 'Start Term 1'
    return `Start Term ${currentTermNumber.value + 1}`
  })

  const selectTermTab = (termNumber: number) => {
    activeCreatorTab.value = `term-${termNumber}` as CreatorTab
  }

  const addTermTab = () => {
    if (activeCreatorTab.value === 'creation') {
      activeCreatorTab.value = 'term-1'
      return
    }

    if (!canCompleteTerm.value || activeCreatorTab.value !== currentTermTabId.value) return
    completeCurrentTerm()
  }

  const completeCurrentTerm = () => {
    if (!canCompleteTerm.value) return

    const rolls = Object.values(termRolls).filter((roll): roll is RollResult => Boolean(roll))
    const summary = selectedTermPath.value === 'education'
      ? `${selectedEducationOption.value.name}${termRolls.educationGraduation?.finalSuccess ? ' graduate' : ' incomplete'}`
      : `${selectedCareer.value.name} - ${selectedAssignment.value.name}${termRolls.careerSurvival?.finalSuccess ? '' : ' mishap pending'}`

    termHistory.value = [
      ...termHistory.value,
      {
        termNumber: currentTermNumber.value,
        path: selectedTermPath.value,
        careerId: selectedTermPath.value === 'career' ? selectedCareerId.value : undefined,
        assignmentId: selectedTermPath.value === 'career' ? selectedAssignmentId.value : undefined,
        educationId: selectedTermPath.value === 'education' ? selectedEducationId.value : undefined,
        startAge: currentAge.value,
        endAge: endOfTermAge.value,
        summary,
        rolls,
      },
    ]

    if (selectedTermPath.value === 'career') {
      const earnedBenefitRoll = termRolls.careerSurvival?.finalSuccess ? 1 : 0
      benefitRollLedger.value = [
        ...benefitRollLedger.value,
        {
          id: makeEventOutcomeId('benefit-roll'),
          termNumber: currentTermNumber.value,
          source: `${selectedCareer.value.name} - ${selectedAssignment.value.name}`,
          label: earnedBenefitRoll ? 'Completed career term' : 'No benefit roll: mishap term',
          count: earnedBenefitRoll,
        },
      ]
    }

    currentTermNumber.value += 1
    resetTermRolls()
    activeCreatorTab.value = `term-${currentTermNumber.value}` as CreatorTab
  }

  const musterOut = () => {
    lifepathComplete.value = true
  }

  const totalBenefitRollsEarned = computed(() => benefitRollLedger.value.reduce((sum, entry) => sum + entry.count, 0))
  const totalBenefitRollAdjustments = computed(() => benefitRollAdjustments.value.reduce((sum, adjustment) => sum + adjustment.adjustment, 0))
  const totalAvailableBenefitRolls = computed(() => Math.max(0, totalBenefitRollsEarned.value + totalBenefitRollAdjustments.value))

  const modifierLabel = (modifier: { condition: string; dm: number }) => {
    const conditionLabels: Record<string, string> = {
      'term == 2': 'Term 2',
      'term == 3': 'Term 3',
      'soc >= 9': 'SOC 9+',
      'end >= 8': 'END 8+',
      'soc >= 8': 'SOC 8+',
    }

    return `${conditionLabels[modifier.condition] ?? modifier.condition}: DM ${formatDm(modifier.dm)}`
  }

  const educationBenefitLabel = (benefit: { type: string; amount?: number; characteristic?: string; count?: number; level?: number; dm?: number; honoursDm?: number; honoursAutomaticSuccess?: boolean; officerRankOnSuccess?: number }) => {
    const labels: Record<string, string> = {
      increase_chosen_pre_career_skills: `Increase chosen education skills by ${benefit.amount ?? 1}`,
      characteristic_increase: `Increase ${benefit.characteristic?.toUpperCase()} by ${benefit.amount ?? 1}`,
      honours_characteristic_increase: `Honours: increase ${benefit.characteristic?.toUpperCase()} by ${benefit.amount ?? 1}`,
      qualification_dm: `Career qualification DM ${formatDm(benefit.dm ?? 0)}${benefit.honoursDm ? `, or DM ${formatDm(benefit.honoursDm)} with honours` : ''}`,
      first_military_career_commission_allowed: `May attempt first military commission${benefit.officerRankOnSuccess ? ` into officer rank ${benefit.officerRankOnSuccess}` : ''}${benefit.honoursAutomaticSuccess ? '; honours makes it automatic' : ''}`,
      same_military_career_service_skill_choices: `Choose ${benefit.count ?? 3} matching service skills at level ${benefit.level ?? 1}`,
      automatic_entry_same_military_career: 'Automatic entry into matching military career',
    }

    return labels[benefit.type] ?? benefit.type
  }

  const preCareerEventEffectLabel = (effect: Record<string, any>) => {
    const labels: Record<string, string> = {
      may_test_psi: 'May test PSI and may enter the Psion career',
      education_graduation: `Graduation ${effect.result ?? 'affected'}`,
      check: `${effect.check?.characteristic?.toUpperCase() ?? 'Check'} ${effect.check?.target ?? 8}+`,
      set_skill: `${skillName(effect.skillId)} ${effect.level}`,
      gain_associate: `Gain ${effect.count ? `${effect.count} ` : ''}${effect.associateTypes?.join(' or ') ?? 'associate'}`,
      roll_table: `Roll on ${effect.tableId}`,
      choose_skill: `Choose a skill at level ${effect.level ?? 0}`,
      check_known_term_skill: `Check a known term skill ${effect.target}+`,
      choice: 'Choose an event outcome',
      roll_subtable: `Roll on ${effect.tableId}`,
      next_career: `Next career: ${effect.careerId}`,
      ignore_draft: 'Ignore draft',
      may_attempt_graduation: 'May attempt graduation',
      characteristic_increase: `${effect.characteristic?.toUpperCase()} +${effect.amount ?? 1}`,
    }

    return labels[effect.type] ?? effect.type
  }

  const tableEffectLabel = (effect: Record<string, any>) => {
    if (effect.type === 'may_test_psi') return 'May test PSI'
    if (effect.type === 'may_test_psionic_strength') return 'May test PSI'
    if (effect.type === 'may_enter_career') return `May enter ${effect.careerId ?? 'specified'} career`
    if (effect.type === 'may_take_career_next_term') return `May enter ${effect.careerId ?? 'specified'} next term`
    if (effect.type === 'next_career') return `Next career: ${effect.careerId}`
    if (effect.type === 'draft_assignment') return `Drafted into ${effect.careerId}${effect.assignmentId && effect.assignmentId !== 'any' ? ` - ${effect.assignmentId}` : ''}`
    if (effect.type === 'roll_subtable') return `Roll on ${effect.tableId}`
    if (effect.type === 'ignore_draft') return 'Ignore draft'
    if (effect.type === 'may_attempt_graduation') return 'May attempt graduation'
    if (effect.type === 'roll_mishap') return 'Roll on mishap table'
    if (effect.type === 'roll_table') return `Roll on ${effect.tableId}`
    if (effect.type === 'check_known_term_skill') return `Check known term skill ${effect.target ?? 8}+`
    if (effect.type === 'check') {
      return effect.check?.characteristic
        ? `${effect.check.characteristic.toUpperCase()} ${effect.check.target}+`
        : `${safeSkillOptionLabel(effect.check?.skill)} ${effect.check?.target ?? 8}+`
    }
    if (effect.type === 'check_any') return `Check ${effect.checks?.map((check: Record<string, any>) => `${safeSkillOptionLabel(check.skill ?? check.characteristic)} ${check.target}+`).join(' or ')}`
    if (effect.type === 'choose_skill_increase') return `Choose skill increase${effect.skills ? `: ${effect.skills.map((skill: string) => skillOptionLabel(skill)).join(', ')}` : ''}`
    if (effect.type === 'choose_skill_set') return `Choose skill at level ${effect.level ?? 1}: ${effect.skills?.map((skill: string) => skillOptionLabel(skill)).join(', ')}`
    if (effect.type === 'choose_skill') return `Choose any skill at level ${effect.level ?? 0}`
    if (effect.type === 'set_skill') return `${safeSkillOptionLabel(effect.skillId)} ${effect.level}`
    if (effect.type === 'increase_skill') return `Increase ${safeSkillOptionLabel(effect.skillId)} by ${effect.amount ?? 1}`
    if (effect.type === 'increase_existing_skill') return `Increase an existing skill by ${effect.amount ?? 1}`
    if (effect.type === 'increase_any_existing_skill') return `Increase any existing skill by ${effect.amount ?? 1}`
    if (effect.type === 'gain_associate') return `Gain ${effect.count ? `${effect.count} ` : ''}${effect.associateTypes?.join(' or ') ?? 'associate'}`
    if (effect.type === 'benefit_roll_dm') return `Benefit roll DM ${formatDm(effect.dm ?? 0)}`
    if (effect.type === 'one_benefit_roll_dm') return `One benefit roll DM ${formatDm(effect.dm ?? 0)}`
    if (effect.type === 'lose_benefit_roll') return `Lose ${effect.count ?? 1} benefit roll`
    if (effect.type === 'next_advancement_dm') return `Next advancement DM ${formatDm(effect.dm ?? 0)}`
    if (effect.type === 'next_qualification_dm') return `Next qualification DM ${formatDm(effect.dm ?? 0)}`
    if (effect.type === 'automatic_promotion') return 'Automatic promotion'
    if (effect.type === 'automatic_commission') return 'Automatic commission'
    if (effect.type === 'automatic_next_promotion_or_commission') return 'Automatic next promotion or commission'
    if (effect.type === 'injury') return 'Injury roll'
    if (effect.type === 'possible_injury') return 'Possible injury'
    if (effect.type === 'possible_mishap') return 'Possible mishap'
    if (effect.type === 'narrative_event') return 'Narrative event'
    if (effect.type === 'choice') return 'Choice required'
    if (effect.type === 'extra_benefit_roll') return 'Extra benefit roll'
    if (effect.type === 'forced_out') return 'Forced out'
    if (effect.type === 'not_forced_out') return 'Not forced out'
    if (effect.type === 'characteristic_change') return `${effect.characteristic?.toUpperCase() ?? 'Characteristic'} ${effect.amount ?? 0}`
    if (effect.type === 'injury_characteristic_loss') {
      if (effect.characteristics) return `Injury: reduce ${effect.characteristics.join(' or ').toUpperCase()} by ${effect.amount}`
      return `Injury: reduce ${effect.category ?? 'characteristic'} by ${effect.amount}`
    }
    if (effect.type === 'gain_item') return `Gain ${String(effect.itemType ?? 'item').replace(/-/g, ' ')}`

    return effect.type
  }

  const characteristicRows = computed(() => characteristicsData.characteristics.map((item) => {
    const id = item.id as CharacteristicId

    return {
      id,
      name: item.name,
      abbreviation: item.abbreviation,
      category: item.category,
      value: values[id],
      dm: diceModifier(values[id]),
    }
  }))

  return {
    careersData,
    characteristicOrder,
    statRolls,
    assignedRollIds,
    values,
    characteristicAdjustments,
    characterName,
    selectedBackgroundSkills,
    backgroundSkillsCollapsed,
    backgroundSkillsAutoCollapsed,
    selectedEducationId,
    selectedTermPath,
    selectedCareerId,
    selectedAssignmentId,
    selectedCareerSkillTableId,
    hasRolledCharacteristics,
    showRerollConfirm,
    currentTermNumber,
    activeCreatorTab,
    lifepathComplete,
    termHistory,
    appliedSkillRecords,
    educationSkillsApplied,
    universityLevel0Skill,
    universityLevel1Skill,
    pendingEducationSkillChoices,
    educationEventExpanded,
    basicTrainingApplied,
    pendingBasicTrainingChoices,
    careerEventExpanded,
    careerMishapExpanded,
    careerSkillResult,
    activeEvent,
    pendingEventResolutions,
    eventOutcomeLog,
    associates,
    rollModifiers,
    benefitRollAdjustments,
    benefitRollLedger,
    careerConstraints,
    pendingSkillChoice,
    termRolls,
    manualRollTotals,
    roll2D,
    diceModifier,
    formatDm,
    assignedRollIdSet,
    assignableRollsFor,
    applyAssignedScores,
    performCharacteristicRoll,
    autoAssignCharacteristics,
    rollCharacteristics,
    confirmCharacteristicReroll,
    cancelCharacteristicReroll,
    currentAge,
    endOfTermAge,
    educationAvailable,
    agingRequired,
    educationEntryFailed,
    currentTermTabId,
    termTabs,
    activeTermNumber,
    activeTermHistoryEntry,
    backgroundSkillLimit,
    backgroundSkillsComplete,
    backgroundSkillOptions,
    preCareerEducation,
    educationOptions,
    selectedEducationOption,
    selectedEducation,
    selectedEducationVariant,
    educationSkillOptions,
    selectedEducationEntry,
    preCareerEvent,
    militaryAcademyCareerId,
    militaryAcademyServiceSkills,
    selectedCareer,
    selectedAssignment,
    careerOptions,
    careerConstraintMessages,
    careerPathLocked,
    currentCareerTableData,
    careerEvent,
    careerMishap,
    currentCareerSkillTables,
    tableEntries,
    advancedEducationAllowed,
    skillTableLabel,
    availableCareerSkillTables,
    selectedCareerSkillTable,
    selectedCareerSkillEntries,
    careerTermsCompleted,
    basicTrainingRequired,
    basicTrainingTableId,
    basicTrainingEntries,
    basicTrainingLabel,
    toggleBackgroundSkill,
    canSelectBackgroundSkill,
    toggleBackgroundSkillsCollapsed,
    skillName,
    slugifySkill,
    skillFromLabel,
    skillOptionLabel,
    safeSkillOptionLabel,
    addSkillSource,
    setSkillMinimum,
    increaseSkill,
    applyCharacteristicIncrease,
    splitChoiceResult,
    applyTrainingResult,
    resolvePendingSkillChoice,
    applyBasicTraining,
    resolveBasicTrainingChoice,
    applyEducationSkills,
    resolveEducationSkillChoice,
    currentTravellerSkills,
    checkLabel,
    preferredCheckRule,
    checkDm,
    handleEducationEntryOutcome,
    applyPreCareerEvent,
    eventForcesGraduationFailure,
    makePreCareerEventRoll,
    rollPreCareerEvent,
    enterManualPreCareerEvent,
    makeRollResult,
    rollCheck,
    enterManualCheck,
    toggleRollOverride,
    rollSummary,
    makeCareerSkillRoll,
    rollCareerSkillTable,
    enterManualCareerSkillTable,
    applyEventEffect,
    applyTravellerEventEffects,
    applyCareerTableEffects,
    rollEventResolutionCheck,
    enterManualEventResolutionCheck,
    rollEventResolutionTable,
    enterManualEventResolutionTable,
    resolveEventChoice,
    resolveEventOutcomeChoice,
    resolveEventAssociate,
    resolveManualEventResolution,
    eventResolutionSelectedLabel,
    associateTypeLabel,
    makeCareerEventRoll,
    rollCareerEvent,
    enterManualCareerEvent,
    makeCareerMishapRoll,
    rollCareerMishap,
    enterManualCareerMishap,
    resetTermRolls,
    agingEffect,
    rollAging,
    enterManualAging,
    canCompleteTerm,
    canAddTermTab,
    nextTermButtonLabel,
    selectTermTab,
    addTermTab,
    completeCurrentTerm,
    musterOut,
    totalBenefitRollsEarned,
    totalBenefitRollAdjustments,
    totalAvailableBenefitRolls,
    modifierLabel,
    educationBenefitLabel,
    preCareerEventEffectLabel,
    tableEffectLabel,
    characteristicRows,
  }
})
