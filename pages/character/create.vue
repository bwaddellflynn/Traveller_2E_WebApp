<script setup lang="ts">
import characteristicsData from '~/data/traveller2e/core/characteristics.json'
import skillsData from '~/data/traveller2e/core/skills.json'
import careersData from '~/data/traveller2e/core/careers-summary.json'
import creationRulesData from '~/data/traveller2e/core/character-creation-rules.json'
import agingData from '~/data/traveller2e/core/aging-and-injuries.json'
import careerTablesData from '~/data/traveller2e/core/career-tables.json'
import preCareerEventsData from '~/data/traveller2e/core/pre-career-events.json'
import careerEventsData from '~/data/traveller2e/core/career-events-mishaps.json'

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
const careerEventResolutionNotes = ref<string[]>([])
const pendingCareerEventSkillChoice = ref<{ label: string; source: string; options: string[]; level?: number; increase?: boolean } | null>(null)
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
  return preCareerEventsData.events.find((event) => event.roll === roll.total) ?? null
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
const currentCareerTableData = computed(() => {
  return (careerTablesData.careers as Record<string, any>)[selectedCareerId.value] ?? null
})
const currentCareerEventData = computed(() => {
  return (careerEventsData.careers as Record<string, any>)[selectedCareerId.value] ?? null
})
const resolveCareerTableRow = (row: Record<string, any>) => {
  if (!row.ref) return row

  const [scope, key] = row.ref.split('.')
  if (scope !== 'common') return row

  return {
    ...((careerEventsData.common as Record<string, any>)[key] ?? {}),
    roll: row.roll,
  }
}
const careerEvent = computed(() => {
  const roll = termRolls.careerEvent
  if (!roll) return null
  const row = currentCareerEventData.value?.events?.find((item: Record<string, any>) => item.roll === roll.total)
  return row ? resolveCareerTableRow(row) : null
})
const careerMishap = computed(() => {
  const roll = termRolls.careerMishap
  if (!roll) return null
  const row = currentCareerEventData.value?.mishaps?.find((item: Record<string, any>) => item.roll === roll.total)
  return row ? resolveCareerTableRow(row) : null
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

const applyPreCareerEvent = (event: { name: string; effects?: Array<Record<string, any>> }) => {
  for (const effect of event.effects ?? []) {
    if (effect.type === 'set_skill' && effect.skillId && typeof effect.level === 'number') {
      setSkillMinimum(skillName(effect.skillId), effect.level, `Pre-Career Event: ${event.name}`)
    }

    if (effect.type === 'characteristic_increase' && effect.characteristic && typeof effect.amount === 'number') {
      const characteristicId = effect.characteristic as CharacteristicId
      characteristicAdjustments[characteristicId] += effect.amount
      applyAssignedScores()
    }
  }
}

const eventForcesGraduationFailure = (event: { effects?: Array<Record<string, any>> }) => {
  return (event.effects ?? []).some((effect) => effect.type === 'education_graduation' && effect.result === 'fail')
}

const makePreCareerEventRoll = (dice: number[], source: 'rolled' | 'manual') => {
  const total = dice.reduce((sum, value) => sum + value, 0)
  const event = preCareerEventsData.events.find((item) => item.roll === total)
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

const makeRollResult = (key: string, label: string, check: CheckRule, dice: number[], source: 'rolled' | 'manual') => {
  const rule = preferredCheckRule(check)
  const dm = checkDm(check)
  const diceTotal = dice.reduce((sum, value) => sum + value, 0)
  const total = diceTotal + dm
  const target = rule.target
  const success = rule.automatic ? true : total >= target

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
  }

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

const noteCareerEventEffect = (note: string) => {
  if (!careerEventResolutionNotes.value.includes(note)) {
    careerEventResolutionNotes.value = [...careerEventResolutionNotes.value, note]
  }
}

const applyCareerTableEffects = (row: { name: string; effects?: Array<Record<string, any>> }, sourcePrefix: string) => {
  careerEventResolutionNotes.value = []
  pendingCareerEventSkillChoice.value = null
  const source = `${sourcePrefix}: ${row.name}`

  for (const effect of row.effects ?? []) {
    if (effect.type === 'set_skill' && effect.skillId && typeof effect.level === 'number') {
      setSkillMinimum(effect.skillId, effect.level, source)
      continue
    }

    if (effect.type === 'increase_skill' && effect.skillId) {
      const amount = typeof effect.amount === 'number' ? effect.amount : 1
      for (let count = 0; count < amount; count += 1) increaseSkill(effect.skillId, source)
      continue
    }

    if (effect.type === 'characteristic_change' && effect.characteristic && typeof effect.amount === 'number') {
      const characteristicId = effect.characteristic as CharacteristicId
      characteristicAdjustments[characteristicId] += effect.amount
      applyAssignedScores()
      continue
    }

    if ((effect.type === 'choose_skill_set' || effect.type === 'choose_skill_increase') && effect.skills?.length && !pendingCareerEventSkillChoice.value) {
      pendingCareerEventSkillChoice.value = {
        label: tableEffectLabel(effect),
        source,
        options: effect.skills,
        level: effect.type === 'choose_skill_set' ? (effect.level ?? 1) : undefined,
        increase: effect.type === 'choose_skill_increase',
      }
      continue
    }

    if (effect.type === 'choose_skill' || effect.type === 'increase_existing_skill' || effect.type === 'increase_any_existing_skill') {
      noteCareerEventEffect(`${tableEffectLabel(effect)} manually.`)
      continue
    }

    if (effect.type === 'benefit_roll_dm' || effect.type === 'next_advancement_dm' || effect.type === 'next_qualification_dm') {
      noteCareerEventEffect(tableEffectLabel(effect))
      continue
    }

    if (effect.type === 'gain_associate' || effect.type === 'extra_benefit_roll' || effect.type === 'forced_out' || effect.type === 'roll_mishap' || effect.type === 'roll_table' || effect.type === 'injury' || effect.type === 'choice') {
      noteCareerEventEffect(tableEffectLabel(effect))
    }
  }
}

const resolvePendingCareerEventSkillChoice = (choice: string) => {
  const pending = pendingCareerEventSkillChoice.value
  if (!pending) return

  pendingCareerEventSkillChoice.value = null
  if (typeof pending.level === 'number') {
    setSkillMinimum(choice, pending.level, pending.source)
    return
  }

  if (pending.increase) {
    increaseSkill(choice, pending.source)
  }
}

const makeCareerEventRoll = (dice: number[], source: 'rolled' | 'manual') => {
  const total = dice.reduce((sum, value) => sum + value, 0)
  const row = currentCareerEventData.value?.events?.find((item: Record<string, any>) => item.roll === total)
  if (!row) return

  const event = resolveCareerTableRow(row)
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
  const row = currentCareerEventData.value?.mishaps?.find((item: Record<string, any>) => item.roll === die)
  if (!row) return

  const mishap = resolveCareerTableRow(row)
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
  pendingCareerEventSkillChoice.value = null
  careerEventExpanded.value = false
  careerMishapExpanded.value = false
  careerEventResolutionNotes.value = []
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
  if (!termRolls.careerSurvival.finalSuccess) return Boolean(termRolls.careerMishap) && !pendingCareerEventSkillChoice.value
  if (!termRolls.careerEvent) return false
  if (pendingCareerEventSkillChoice.value) return false
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

  currentTermNumber.value += 1
  resetTermRolls()
  activeCreatorTab.value = `term-${currentTermNumber.value}` as CreatorTab
}

const musterOut = () => {
  lifepathComplete.value = true
}

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
  if (effect.type === 'roll_mishap') return 'Roll on mishap table'
  if (effect.type === 'roll_table') return `Roll on ${effect.tableId}`
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

</script>

<template>
  <main class="min-h-screen">
    <header class="border-b border-zinc-300 bg-white">
      <div class="mx-auto flex w-full max-w-7xl flex-col gap-5 px-5 py-5 sm:px-8 lg:px-10">
        <nav class="flex items-center justify-between gap-4">
          <NuxtLink class="text-sm font-semibold text-zinc-700 hover:text-zinc-950" to="/">
            Tools hub
          </NuxtLink>
          <div class="flex items-center gap-2 text-sm text-zinc-600">
            <AppIcon name="user" />
            <span>Character Creator</span>
          </div>
        </nav>
        <div class="grid gap-5 lg:grid-cols-[1fr_22rem] lg:items-end">
          <div>
            <p class="text-sm font-semibold uppercase tracking-wide text-amber-700">Core Rulebook</p>
            <h1 class="mt-2 text-3xl font-semibold text-zinc-950 sm:text-4xl">Create a Traveller</h1>
          </div>
          <label class="grid gap-2">
            <span class="text-sm font-medium text-zinc-700">Name</span>
            <input
              v-model="characterName"
              class="h-11 rounded-md border border-zinc-300 bg-white px-3 text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
              placeholder="Unnamed Traveller"
            >
          </label>
        </div>
      </div>
    </header>

    <div class="mx-auto grid w-full max-w-7xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[1fr_24rem] lg:px-10">
      <section class="grid gap-6">
        <div class="rounded-lg border border-zinc-300 bg-white shadow-sm">
          <div class="flex flex-wrap items-center gap-2 border-b border-zinc-200 p-3">
            <button
              :class="[
                'h-10 rounded-md px-3 text-sm font-semibold',
                activeCreatorTab === 'creation'
                  ? 'bg-zinc-950 text-white'
                  : 'text-zinc-700 hover:bg-stone-100 hover:text-zinc-950'
              ]"
              type="button"
              @click="activeCreatorTab = 'creation'"
            >
              Creation
            </button>
            <button
              v-for="termNumber in termTabs"
              :key="termNumber"
              :class="[
                'h-10 rounded-md px-3 text-sm font-semibold',
                activeCreatorTab === `term-${termNumber}`
                  ? 'bg-zinc-950 text-white'
                  : 'text-zinc-700 hover:bg-stone-100 hover:text-zinc-950'
              ]"
              type="button"
              @click="selectTermTab(termNumber)"
            >
              Term {{ termNumber }}
            </button>
            <button
              class="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-md border border-zinc-300 text-xl font-semibold text-zinc-700 hover:border-amber-600 disabled:cursor-not-allowed disabled:text-zinc-300"
              :disabled="!canAddTermTab"
              title="Add term"
              type="button"
              @click="addTermTab"
            >
              +
            </button>
          </div>

          <div class="p-5">
            <div v-if="activeCreatorTab === 'creation'" class="grid gap-6">
        <div class="rounded-lg border border-zinc-300 bg-white p-5 shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="text-xl font-semibold">Characteristics</h2>
              <p class="mt-1 text-sm text-zinc-600">Roll six 2D scores, then assign each score to a characteristic.</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                class="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-800 hover:border-amber-600"
                type="button"
                @click="autoAssignCharacteristics"
              >
                <AppIcon name="arrow" />
                Auto-assign
              </button>
              <button
                class="inline-flex h-10 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
                type="button"
                @click="rollCharacteristics"
              >
                <AppIcon name="dice" />
                Roll
              </button>
            </div>
          </div>

          <div class="mt-5 flex flex-wrap gap-2">
            <span
              v-for="roll in statRolls"
              :key="roll.id"
              :class="[
                'rounded-md border px-3 py-2 text-sm font-semibold',
                assignedRollIdSet.has(roll.id)
                  ? 'border-zinc-300 bg-zinc-100 text-zinc-500'
                  : 'border-amber-300 bg-amber-50 text-amber-900'
              ]"
            >
              {{ roll.value }}
            </span>
          </div>

          <div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <label
              v-for="item in characteristicRows"
              :key="item.id"
              class="rounded-md border border-zinc-200 bg-stone-50 p-4"
            >
              <span class="flex items-start justify-between gap-3">
                <span>
                  <span class="block text-sm font-semibold">{{ item.abbreviation }}</span>
                  <span class="block text-xs text-zinc-600">{{ item.name }}</span>
                </span>
                <span class="rounded-md bg-white px-2 py-1 text-sm font-semibold text-zinc-700">DM {{ formatDm(item.dm) }}</span>
              </span>
              <select
                v-model="assignedRollIds[item.id]"
                class="mt-4 h-12 w-full rounded-md border border-zinc-300 bg-white px-3 text-xl font-semibold outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
              >
                <option value="">-</option>
                <option
                  v-for="roll in assignableRollsFor(item.id)"
                  :key="roll.id"
                  :value="roll.id"
                >
                  {{ roll.value }}
                </option>
              </select>
              <label class="mt-3 grid gap-1">
                <span class="text-xs font-medium text-zinc-600">Adjustment / override</span>
                <input
                  v-model.number="characteristicAdjustments[item.id]"
                  class="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                  type="number"
                  @input="applyAssignedScores"
                >
              </label>
            </label>
          </div>
        </div>

        <div class="rounded-lg border border-zinc-300 bg-white p-5 shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="text-xl font-semibold">Background Skills</h2>
              <p class="mt-1 text-sm text-zinc-600">Choose {{ backgroundSkillLimit }} based on EDU DM {{ formatDm(diceModifier(values.edu)) }}.</p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded-md bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900">
                {{ selectedBackgroundSkills.length }} / {{ backgroundSkillLimit }}
              </span>
              <button
                class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:border-amber-600"
                type="button"
                @click="toggleBackgroundSkillsCollapsed"
              >
                {{ backgroundSkillsCollapsed ? 'Expand' : 'Minimize' }}
              </button>
            </div>
          </div>

          <div v-if="backgroundSkillsCollapsed" class="mt-5 flex flex-wrap gap-2">
            <span
              v-for="skillId in selectedBackgroundSkills"
              :key="skillId"
              class="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700"
            >
              {{ skillName(skillId) }}
            </span>
            <span v-if="!selectedBackgroundSkills.length" class="text-sm text-zinc-500">No background skills selected.</span>
          </div>

          <div v-else class="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <button
              v-for="skill in backgroundSkillOptions"
              :key="skill.id"
              :class="[
                'flex h-11 items-center justify-between rounded-md border px-3 text-left text-sm font-medium',
                selectedBackgroundSkills.includes(skill.id)
                  ? 'border-zinc-950 bg-zinc-950 text-white'
                  : canSelectBackgroundSkill(skill.id)
                    ? 'border-zinc-300 bg-white text-zinc-700 hover:border-amber-600'
                    : 'cursor-not-allowed border-zinc-200 bg-zinc-50 text-zinc-400'
              ]"
              :disabled="!canSelectBackgroundSkill(skill.id)"
              type="button"
              @click="toggleBackgroundSkill(skill.id)"
            >
              <span>{{ skill.name }}</span>
              <AppIcon v-if="selectedBackgroundSkills.includes(skill.id)" name="check" />
            </button>
          </div>
        </div>
            </div>

            <div v-else-if="activeCreatorTab !== currentTermTabId" class="rounded-lg border border-zinc-300 bg-white p-5 shadow-sm">
              <div v-if="activeTermHistoryEntry">
                <div class="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 class="text-xl font-semibold">Term {{ activeTermHistoryEntry.termNumber }}</h2>
                    <p class="mt-1 text-sm text-zinc-600">{{ activeTermHistoryEntry.summary }}</p>
                  </div>
                  <span class="rounded-md bg-stone-100 px-3 py-2 text-sm font-semibold text-zinc-700">
                    Age {{ activeTermHistoryEntry.startAge }}-{{ activeTermHistoryEntry.endAge }}
                  </span>
                </div>

                <div class="mt-5 grid gap-2">
                  <div
                    v-for="roll in activeTermHistoryEntry.rolls"
                    :key="`${activeTermHistoryEntry.termNumber}-${roll.label}`"
                    class="flex flex-wrap items-center justify-between gap-3 rounded-md bg-stone-50 px-3 py-2 text-sm"
                  >
                    <span class="font-semibold text-zinc-800">{{ roll.label }}</span>
                    <span class="text-zinc-600">{{ rollSummary(roll) }} · {{ roll.finalSuccess ? 'Success' : 'Failure' }}</span>
                  </div>
                </div>
              </div>
              <div v-else>
                <h2 class="text-xl font-semibold">Term {{ activeTermNumber }}</h2>
                <p class="mt-1 text-sm text-zinc-600">This term has not been completed yet.</p>
              </div>
            </div>

        <div v-else class="rounded-lg border border-zinc-300 bg-white p-5 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 class="text-xl font-semibold">Term Direction</h2>
              <p class="mt-1 text-sm text-zinc-600">Choose whether this term starts with career entry or pre-career education.</p>
            </div>
            <span class="rounded-md bg-stone-100 px-3 py-2 text-sm font-semibold text-zinc-700">
              Term {{ currentTermNumber }} · Age {{ currentAge }}-{{ endOfTermAge }}
            </span>
          </div>

          <div class="mt-5 inline-grid grid-cols-2 rounded-md border border-zinc-300 bg-stone-50 p-1">
            <button
              :class="[
                'h-10 rounded px-4 text-sm font-semibold',
                selectedTermPath === 'career'
                  ? 'bg-zinc-950 text-white shadow-sm'
                  : 'text-zinc-700 hover:text-zinc-950'
              ]"
              type="button"
              @click="selectedTermPath = 'career'"
            >
              Career
            </button>
            <button
              :class="[
                'h-10 rounded px-4 text-sm font-semibold',
                selectedTermPath === 'education'
                  ? 'bg-zinc-950 text-white shadow-sm'
                  : educationAvailable
                    ? 'text-zinc-700 hover:text-zinc-950'
                    : 'cursor-not-allowed text-zinc-400'
              ]"
              :disabled="!educationAvailable"
              type="button"
              @click="selectedTermPath = 'education'"
            >
              Education
            </button>
          </div>

          <div v-if="selectedTermPath === 'career'" class="mt-5">
            <div v-if="educationEntryFailed" class="mb-5 rounded-md border border-amber-300 bg-amber-50 p-4">
              <p class="text-sm font-semibold text-amber-950">Education Entry Failed</p>
              <p class="mt-1 text-sm text-amber-900">
                This term now continues as a forced career attempt. The failed education entry roll will remain in this term's history.
              </p>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <label class="grid gap-2">
                <span class="text-sm font-medium text-zinc-700">Career</span>
                <select
                  v-model="selectedCareerId"
                  class="h-11 rounded-md border border-zinc-300 bg-white px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                >
                  <option v-for="career in careersData.careers" :key="career.id" :value="career.id">
                    {{ career.name }}
                  </option>
                </select>
              </label>
              <label class="grid gap-2">
                <span class="text-sm font-medium text-zinc-700">Assignment</span>
                <select
                  v-model="selectedAssignmentId"
                  class="h-11 rounded-md border border-zinc-300 bg-white px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                >
                  <option v-for="assignment in selectedCareer.assignments" :key="assignment.id" :value="assignment.id">
                    {{ assignment.name }}
                  </option>
                </select>
              </label>
            </div>

            <div class="mt-5 grid gap-3 sm:grid-cols-3">
              <div class="rounded-md bg-stone-50 p-4">
                <p class="text-xs font-semibold uppercase tracking-wide text-zinc-500">Qualification</p>
                <p class="mt-2 text-lg font-semibold">{{ checkLabel(selectedCareer.qualification) }}</p>
              </div>
              <div class="rounded-md bg-stone-50 p-4">
                <p class="text-xs font-semibold uppercase tracking-wide text-zinc-500">Survival</p>
                <p class="mt-2 text-lg font-semibold">{{ checkLabel(selectedAssignment.survival) }}</p>
              </div>
              <div class="rounded-md bg-stone-50 p-4">
                <p class="text-xs font-semibold uppercase tracking-wide text-zinc-500">Advancement</p>
                <p class="mt-2 text-lg font-semibold">{{ checkLabel(selectedAssignment.advancement) }}</p>
              </div>
            </div>

            <div class="mt-5 grid gap-3">
              <div class="rounded-md border border-zinc-200 p-4">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p class="text-sm font-semibold">Qualification Roll</p>
                    <p class="text-sm text-zinc-600">{{ checkLabel(selectedCareer.qualification) }}</p>
                  </div>
                  <button class="h-10 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800" type="button" @click="rollCheck('careerQualification', 'Qualification', selectedCareer.qualification)">
                    Roll 2D
                  </button>
                </div>
                <div class="mt-3 flex flex-wrap gap-2">
                  <input v-model.number="manualRollTotals.careerQualification" class="h-10 w-28 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="2D total" type="number">
                  <button class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:border-amber-600" type="button" @click="enterManualCheck('careerQualification', 'Qualification', selectedCareer.qualification)">
                    Manual
                  </button>
                </div>
                <div v-if="termRolls.careerQualification" class="mt-3 rounded-md bg-stone-50 p-3 text-sm">
                  <p class="font-semibold">{{ rollSummary(termRolls.careerQualification) }} · {{ termRolls.careerQualification.finalSuccess ? 'Success' : 'Failure' }}</p>
                  <button class="mt-2 text-xs font-semibold text-amber-700 hover:text-amber-900" type="button" @click="toggleRollOverride('careerQualification')">
                    {{ termRolls.careerQualification.overridden ? 'Remove override' : 'Override outcome' }}
                  </button>
                </div>
              </div>

              <div v-if="termRolls.careerQualification?.finalSuccess" class="rounded-md border border-zinc-200 p-4">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p class="text-sm font-semibold">Basic Training</p>
                    <p class="text-sm text-zinc-600">
                      <template v-if="basicTrainingRequired">
                        First term in {{ selectedCareer.name }}: gain {{ basicTrainingLabel }}.
                      </template>
                      <template v-else>
                        Already completed for {{ selectedCareer.name }}.
                      </template>
                    </p>
                  </div>
                  <button
                    class="h-10 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                    :disabled="!basicTrainingRequired || basicTrainingApplied"
                    type="button"
                    @click="applyBasicTraining"
                  >
                    Apply
                  </button>
                </div>

                <div class="mt-4 grid gap-2 sm:grid-cols-2">
                  <div
                    v-for="entry in basicTrainingEntries"
                    :key="entry"
                    class="rounded-md bg-stone-50 px-3 py-2 text-sm text-zinc-800"
                  >
                    {{ entry }}
                  </div>
                </div>

                <div v-if="pendingBasicTrainingChoices.length" class="mt-3 grid gap-2 rounded-md bg-amber-50 p-3 text-sm">
                  <div
                    v-for="(choiceGroup, index) in pendingBasicTrainingChoices"
                    :key="choiceGroup.label"
                    class="flex flex-wrap items-center justify-between gap-3"
                  >
                    <p class="font-medium text-amber-950">
                      {{ choiceGroup.selected ? `${choiceGroup.label}: ${choiceGroup.selected}` : `Choose for ${choiceGroup.label}` }}
                    </p>
                    <div v-if="!choiceGroup.selected" class="flex flex-wrap gap-2">
                      <button
                        v-for="choice in choiceGroup.options"
                        :key="choice"
                        class="h-9 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
                        type="button"
                        @click="resolveBasicTrainingChoice(index, choice)"
                      >
                        {{ choice }}
                      </button>
                    </div>
                  </div>
                </div>

                <p v-if="basicTrainingApplied" class="mt-3 rounded-md bg-stone-50 p-3 text-sm font-semibold text-zinc-700">
                  Basic training applied to Current Traveller.
                </p>
              </div>

              <div v-if="termRolls.careerQualification?.finalSuccess && (!basicTrainingRequired || basicTrainingApplied)" class="rounded-md border border-zinc-200 p-4">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p class="text-sm font-semibold">Skill Training</p>
                    <p class="text-sm text-zinc-600">Choose a table, then roll 1D for this term's career skill.</p>
                  </div>
                  <button
                    class="h-10 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                    :disabled="!!termRolls.careerSkill"
                    type="button"
                    @click="rollCareerSkillTable"
                  >
                    Roll 1D
                  </button>
                </div>

                <div class="mt-4 grid gap-3 lg:grid-cols-[16rem_1fr]">
                  <label class="grid h-fit gap-2">
                    <span class="text-xs font-semibold uppercase tracking-wide text-zinc-500">Skill Table</span>
                    <select
                      v-model="selectedCareerSkillTableId"
                      class="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                      :disabled="!!termRolls.careerSkill"
                    >
                      <option v-for="table in availableCareerSkillTables" :key="table.id" :value="table.id">
                        {{ table.label }}
                      </option>
                    </select>
                  </label>

                  <div class="grid gap-2 sm:grid-cols-2">
                    <div
                      v-for="(entry, index) in selectedCareerSkillEntries"
                      :key="`${selectedCareerSkillTableId}-${index}`"
                      class="flex items-center justify-between gap-3 rounded-md bg-stone-50 px-3 py-2 text-sm"
                    >
                      <span class="font-semibold text-zinc-500">{{ index + 1 }}</span>
                      <span class="text-right text-zinc-800">{{ entry }}</span>
                    </div>
                  </div>
                </div>

                <div class="mt-3 flex flex-wrap gap-2">
                  <input
                    v-model.number="manualRollTotals.careerSkill"
                    class="h-10 w-28 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                    :disabled="!!termRolls.careerSkill"
                    max="6"
                    min="1"
                    placeholder="1D"
                    type="number"
                  >
                  <button
                    class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:border-amber-600 disabled:cursor-not-allowed disabled:text-zinc-400"
                    :disabled="!!termRolls.careerSkill"
                    type="button"
                    @click="enterManualCareerSkillTable"
                  >
                    Manual
                  </button>
                </div>

                <div v-if="termRolls.careerSkill" class="mt-3 rounded-md bg-stone-50 p-3 text-sm">
                  <p class="font-semibold">{{ rollSummary(termRolls.careerSkill) }} · {{ termRolls.careerSkill.notes }}</p>
                  <p v-if="pendingSkillChoice" class="mt-1 text-zinc-600">{{ pendingSkillChoice.source }}: {{ pendingSkillChoice.label }}</p>
                  <div v-if="pendingSkillChoice" class="mt-3 flex flex-wrap gap-2">
                    <button
                      v-for="choice in pendingSkillChoice.options"
                      :key="choice"
                      class="h-9 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
                      type="button"
                      @click="resolvePendingSkillChoice(choice)"
                    >
                      {{ skillOptionLabel(choice) }}
                    </button>
                  </div>
                  <p v-else-if="careerSkillResult" class="mt-1 text-zinc-600">Applied to Current Traveller.</p>
                </div>
              </div>

              <div v-if="termRolls.careerSkill && !pendingSkillChoice" class="rounded-md border border-zinc-200 p-4">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p class="text-sm font-semibold">Survival Roll</p>
                    <p class="text-sm text-zinc-600">{{ checkLabel(selectedAssignment.survival) }}</p>
                  </div>
                  <button class="h-10 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800" type="button" @click="rollCheck('careerSurvival', 'Survival', selectedAssignment.survival)">
                    Roll 2D
                  </button>
                </div>
                <div class="mt-3 flex flex-wrap gap-2">
                  <input v-model.number="manualRollTotals.careerSurvival" class="h-10 w-28 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="2D total" type="number">
                  <button class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:border-amber-600" type="button" @click="enterManualCheck('careerSurvival', 'Survival', selectedAssignment.survival)">
                    Manual
                  </button>
                </div>
                <div v-if="termRolls.careerSurvival" class="mt-3 rounded-md bg-stone-50 p-3 text-sm">
                  <p class="font-semibold">{{ rollSummary(termRolls.careerSurvival) }} · {{ termRolls.careerSurvival.finalSuccess ? 'Survived' : 'Mishap' }}</p>
                  <p v-if="!termRolls.careerSurvival.finalSuccess" class="mt-1 text-zinc-600">Roll 1D on the {{ selectedCareer.name }} mishap table.</p>
                  <button class="mt-2 text-xs font-semibold text-amber-700 hover:text-amber-900" type="button" @click="toggleRollOverride('careerSurvival')">
                    {{ termRolls.careerSurvival.overridden ? 'Remove override' : 'Override outcome' }}
                  </button>
                </div>
              </div>

              <div v-if="termRolls.careerSurvival && !termRolls.careerSurvival.finalSuccess" class="rounded-md border border-zinc-200 p-4">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p class="text-sm font-semibold">Career Mishap</p>
                    <p class="text-sm text-zinc-600">Roll 1D on the {{ selectedCareer.name }} mishap table.</p>
                  </div>
                  <button
                    class="h-10 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                    :disabled="!!termRolls.careerMishap"
                    type="button"
                    @click="rollCareerMishap"
                  >
                    Roll 1D
                  </button>
                </div>
                <div class="mt-3 flex flex-wrap gap-2">
                  <input
                    v-model.number="manualRollTotals.careerMishap"
                    class="h-10 w-28 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                    :disabled="!!termRolls.careerMishap"
                    max="6"
                    min="1"
                    placeholder="1D"
                    type="number"
                  >
                  <button
                    class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:border-amber-600 disabled:cursor-not-allowed disabled:text-zinc-400"
                    :disabled="!!termRolls.careerMishap"
                    type="button"
                    @click="enterManualCareerMishap"
                  >
                    Manual
                  </button>
                </div>
                <div v-if="termRolls.careerMishap && careerMishap" class="mt-3 rounded-md bg-stone-50 p-3 text-sm">
                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <p class="font-semibold">{{ rollSummary(termRolls.careerMishap) }} · {{ careerMishap.name }}</p>
                    <button
                      class="text-xs font-semibold text-amber-700 hover:text-amber-900"
                      type="button"
                      @click="careerMishapExpanded = !careerMishapExpanded"
                    >
                      {{ careerMishapExpanded ? 'Hide text' : 'Show details' }}
                    </button>
                  </div>
                  <p v-if="!careerMishapExpanded" class="mt-2 line-clamp-2 text-zinc-600">{{ careerMishap.text }}</p>
                  <div v-if="careerMishapExpanded" class="mt-3 grid gap-3">
                    <p class="leading-6 text-zinc-700">{{ careerMishap.text }}</p>
                    <ul v-if="careerMishap.effects?.length" class="grid gap-1 text-zinc-600">
                      <li v-for="effect in careerMishap.effects" :key="`${careerMishap.name}-${effect.type}-${tableEffectLabel(effect)}`">
                        {{ tableEffectLabel(effect) }}
                      </li>
                    </ul>
                  </div>
                  <div v-if="pendingCareerEventSkillChoice" class="mt-3 rounded-md bg-white p-3 text-sm">
                    <p class="font-semibold text-zinc-800">{{ pendingCareerEventSkillChoice.label }}</p>
                    <div class="mt-3 flex flex-wrap gap-2">
                      <button
                        v-for="choice in pendingCareerEventSkillChoice.options"
                        :key="choice"
                        class="h-9 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
                        type="button"
                        @click="resolvePendingCareerEventSkillChoice(choice)"
                      >
                        {{ skillOptionLabel(choice) }}
                      </button>
                    </div>
                  </div>
                  <div v-if="careerEventResolutionNotes.length" class="mt-3 rounded-md bg-amber-50 p-3 text-xs text-amber-950">
                    <p class="font-semibold">Resolution needed</p>
                    <ul class="mt-1 grid gap-1">
                      <li v-for="note in careerEventResolutionNotes" :key="note">{{ note }}</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div v-if="termRolls.careerSurvival?.finalSuccess" class="rounded-md border border-zinc-200 p-4">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p class="text-sm font-semibold">Career Event</p>
                    <p class="text-sm text-zinc-600">Roll 2D on the {{ selectedCareer.name }} events table.</p>
                  </div>
                  <button
                    class="h-10 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                    :disabled="!!termRolls.careerEvent"
                    type="button"
                    @click="rollCareerEvent"
                  >
                    Roll 2D
                  </button>
                </div>
                <div class="mt-3 flex flex-wrap gap-2">
                  <input
                    v-model.number="manualRollTotals.careerEvent"
                    class="h-10 w-28 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                    :disabled="!!termRolls.careerEvent"
                    max="12"
                    min="2"
                    placeholder="2D total"
                    type="number"
                  >
                  <button
                    class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:border-amber-600 disabled:cursor-not-allowed disabled:text-zinc-400"
                    :disabled="!!termRolls.careerEvent"
                    type="button"
                    @click="enterManualCareerEvent"
                  >
                    Manual
                  </button>
                </div>
                <div v-if="termRolls.careerEvent && careerEvent" class="mt-3 rounded-md bg-stone-50 p-3 text-sm">
                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <p class="font-semibold">{{ rollSummary(termRolls.careerEvent) }} · {{ careerEvent.name }}</p>
                    <button
                      class="text-xs font-semibold text-amber-700 hover:text-amber-900"
                      type="button"
                      @click="careerEventExpanded = !careerEventExpanded"
                    >
                      {{ careerEventExpanded ? 'Hide text' : 'Show details' }}
                    </button>
                  </div>
                  <p v-if="!careerEventExpanded && careerEvent.text" class="mt-2 line-clamp-2 text-zinc-600">{{ careerEvent.text }}</p>
                  <div v-if="careerEventExpanded" class="mt-3 grid gap-3">
                    <p v-if="careerEvent.text" class="leading-6 text-zinc-700">{{ careerEvent.text }}</p>
                    <p v-else class="text-zinc-600">Full event text has not been entered for this career event yet.</p>
                    <ul v-if="careerEvent.effects?.length" class="grid gap-1 text-zinc-600">
                      <li v-for="effect in careerEvent.effects" :key="`${careerEvent.name}-${effect.type}-${tableEffectLabel(effect)}`">
                        {{ tableEffectLabel(effect) }}
                      </li>
                    </ul>
                  </div>
                  <div v-if="pendingCareerEventSkillChoice" class="mt-3 rounded-md bg-white p-3 text-sm">
                    <p class="font-semibold text-zinc-800">{{ pendingCareerEventSkillChoice.label }}</p>
                    <div class="mt-3 flex flex-wrap gap-2">
                      <button
                        v-for="choice in pendingCareerEventSkillChoice.options"
                        :key="choice"
                        class="h-9 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
                        type="button"
                        @click="resolvePendingCareerEventSkillChoice(choice)"
                      >
                        {{ skillOptionLabel(choice) }}
                      </button>
                    </div>
                  </div>
                  <div v-if="careerEventResolutionNotes.length" class="mt-3 rounded-md bg-amber-50 p-3 text-xs text-amber-950">
                    <p class="font-semibold">Resolution needed</p>
                    <ul class="mt-1 grid gap-1">
                      <li v-for="note in careerEventResolutionNotes" :key="note">{{ note }}</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div v-if="termRolls.careerSurvival?.finalSuccess && termRolls.careerEvent && !pendingCareerEventSkillChoice" class="rounded-md border border-zinc-200 p-4">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p class="text-sm font-semibold">Advancement Roll</p>
                    <p class="text-sm text-zinc-600">{{ checkLabel(selectedAssignment.advancement) }}</p>
                  </div>
                  <button class="h-10 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800" type="button" @click="rollCheck('careerAdvancement', 'Advancement', selectedAssignment.advancement)">
                    Roll 2D
                  </button>
                </div>
                <div class="mt-3 flex flex-wrap gap-2">
                  <input v-model.number="manualRollTotals.careerAdvancement" class="h-10 w-28 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="2D total" type="number">
                  <button class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:border-amber-600" type="button" @click="enterManualCheck('careerAdvancement', 'Advancement', selectedAssignment.advancement)">
                    Manual
                  </button>
                </div>
                <div v-if="termRolls.careerAdvancement" class="mt-3 rounded-md bg-stone-50 p-3 text-sm">
                  <p class="font-semibold">{{ rollSummary(termRolls.careerAdvancement) }} · {{ termRolls.careerAdvancement.finalSuccess ? 'Advanced' : 'No advancement' }}</p>
                  <button class="mt-2 text-xs font-semibold text-amber-700 hover:text-amber-900" type="button" @click="toggleRollOverride('careerAdvancement')">
                    {{ termRolls.careerAdvancement.overridden ? 'Remove override' : 'Override outcome' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="mt-5 grid gap-4 lg:grid-cols-[18rem_1fr]">
            <label class="grid h-fit gap-2">
              <span class="text-sm font-medium text-zinc-700">Education</span>
              <select
                v-model="selectedEducationId"
                class="h-11 rounded-md border border-zinc-300 bg-white px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
              >
                <option v-for="option in educationOptions" :key="option.id" :value="option.id">
                  {{ option.name }}
                </option>
              </select>
            </label>

            <div v-if="selectedEducation && selectedEducationEntry" class="grid gap-3">
              <div class="grid gap-3 sm:grid-cols-2">
                <div class="rounded-md bg-stone-50 p-4">
                  <p class="text-xs font-semibold uppercase tracking-wide text-zinc-500">Entry</p>
                  <p class="mt-2 text-lg font-semibold">{{ checkLabel(selectedEducationEntry) }}</p>
                  <div v-if="selectedEducation.entryModifiers?.length" class="mt-3 flex flex-wrap gap-2">
                    <span
                      v-for="modifier in selectedEducation.entryModifiers"
                      :key="modifier.condition"
                      class="rounded-md bg-white px-2 py-1 text-xs font-medium text-zinc-600"
                    >
                      {{ modifierLabel(modifier) }}
                    </span>
                  </div>
                </div>
                <div class="rounded-md bg-stone-50 p-4">
                  <p class="text-xs font-semibold uppercase tracking-wide text-zinc-500">Graduation</p>
                  <p class="mt-2 text-lg font-semibold">{{ checkLabel(selectedEducation.graduation) }}</p>
                  <p class="mt-1 text-sm text-zinc-600">Honours {{ selectedEducation.graduation.honoursTarget }}+</p>
                  <div v-if="selectedEducation.graduation.modifiers?.length" class="mt-3 flex flex-wrap gap-2">
                    <span
                      v-for="modifier in selectedEducation.graduation.modifiers"
                      :key="modifier.condition"
                      class="rounded-md bg-white px-2 py-1 text-xs font-medium text-zinc-600"
                    >
                      {{ modifierLabel(modifier) }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="grid gap-3 xl:grid-cols-2">
                <div class="rounded-md border border-zinc-200 p-4">
                  <p class="text-sm font-semibold text-zinc-900">Skills</p>
                  <p v-if="selectedEducation.id === 'university'" class="mt-2 text-sm leading-6 text-zinc-600">
                    Choose one listed skill at level 0 and one listed skill at level 1.
                  </p>
                  <p v-else class="mt-2 text-sm leading-6 text-zinc-600">
                    Gain the matching military career service skills at level 0.
                  </p>
                  <div v-if="selectedEducation.id === 'university'" class="mt-3 grid gap-3">
                    <label class="grid gap-1">
                      <span class="text-xs font-semibold uppercase tracking-wide text-zinc-500">Level 0</span>
                      <select
                        v-model="universityLevel0Skill"
                        class="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                        :disabled="educationSkillsApplied"
                      >
                        <option value="">-</option>
                        <option v-for="skill in educationSkillOptions" :key="`level-0-${skill}`" :value="skill">
                          {{ skillOptionLabel(skill) }}
                        </option>
                      </select>
                    </label>
                    <label class="grid gap-1">
                      <span class="text-xs font-semibold uppercase tracking-wide text-zinc-500">Level 1</span>
                      <select
                        v-model="universityLevel1Skill"
                        class="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                        :disabled="educationSkillsApplied"
                      >
                        <option value="">-</option>
                        <option v-for="skill in educationSkillOptions" :key="`level-1-${skill}`" :value="skill">
                          {{ skillOptionLabel(skill) }}
                        </option>
                      </select>
                    </label>
                  </div>
                  <div v-else class="mt-3 flex flex-wrap gap-2">
                    <span
                      v-for="skill in militaryAcademyServiceSkills"
                      :key="skill"
                      class="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-700"
                    >
                      {{ skill }}
                    </span>
                  </div>
                  <button
                    class="mt-3 h-10 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                    :disabled="educationSkillsApplied || (selectedEducation.id === 'university' && (!universityLevel0Skill || !universityLevel1Skill))"
                    type="button"
                    @click="applyEducationSkills"
                  >
                    Apply Skills
                  </button>
                  <div v-if="pendingEducationSkillChoices.length" class="mt-3 grid gap-2 rounded-md bg-amber-50 p-3 text-sm">
                    <div
                      v-for="(choiceGroup, index) in pendingEducationSkillChoices"
                      :key="choiceGroup.label"
                      class="flex flex-wrap items-center justify-between gap-3"
                    >
                      <p class="font-medium text-amber-950">
                        {{ choiceGroup.selected ? `${choiceGroup.label}: ${choiceGroup.selected}` : `Choose for ${choiceGroup.label}` }}
                      </p>
                      <div v-if="!choiceGroup.selected" class="flex flex-wrap gap-2">
                        <button
                          v-for="choice in choiceGroup.options"
                          :key="choice"
                          class="h-9 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
                          type="button"
                          @click="resolveEducationSkillChoice(index, choice)"
                        >
                          {{ choice }}
                        </button>
                      </div>
                    </div>
                  </div>
                  <p v-if="educationSkillsApplied" class="mt-3 rounded-md bg-stone-50 p-3 text-sm font-semibold text-zinc-700">
                    Education skills applied to Current Traveller.
                  </p>
                </div>

                <div class="rounded-md border border-zinc-200 p-4">
                  <p class="text-sm font-semibold text-zinc-900">Graduation Benefits</p>
                  <ul class="mt-2 grid gap-2 text-sm leading-6 text-zinc-600">
                    <li v-for="benefit in selectedEducation.graduationBenefits" :key="benefit.type">
                      {{ educationBenefitLabel(benefit) }}
                    </li>
                  </ul>
                </div>
              </div>

              <div class="grid gap-3">
                <div class="rounded-md border border-zinc-200 p-4">
                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p class="text-sm font-semibold">Entry Roll</p>
                      <p class="text-sm text-zinc-600">{{ checkLabel(selectedEducationEntry) }}</p>
                    </div>
                    <button class="h-10 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800" type="button" @click="rollCheck('educationEntry', 'Education Entry', selectedEducationEntry)">
                      Roll 2D
                    </button>
                  </div>
                  <div class="mt-3 flex flex-wrap gap-2">
                    <input v-model.number="manualRollTotals.educationEntry" class="h-10 w-28 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="2D total" type="number">
                    <button class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:border-amber-600" type="button" @click="enterManualCheck('educationEntry', 'Education Entry', selectedEducationEntry)">
                      Manual
                    </button>
                  </div>
                  <div v-if="termRolls.educationEntry" class="mt-3 rounded-md bg-stone-50 p-3 text-sm">
                    <p class="font-semibold">{{ rollSummary(termRolls.educationEntry) }} · {{ termRolls.educationEntry.finalSuccess ? 'Entered' : 'Failed entry' }}</p>
                    <p v-if="!termRolls.educationEntry.finalSuccess" class="mt-1 text-zinc-600">Failed entry has moved this term to a career attempt.</p>
                    <button class="mt-2 text-xs font-semibold text-amber-700 hover:text-amber-900" type="button" @click="toggleRollOverride('educationEntry')">
                      {{ termRolls.educationEntry.overridden ? 'Remove override' : 'Override outcome' }}
                    </button>
                  </div>
                </div>

                <div v-if="termRolls.educationEntry?.finalSuccess && educationSkillsApplied" class="rounded-md border border-zinc-200 p-4">
                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p class="text-sm font-semibold">Pre-Career Event</p>
                      <p class="text-sm text-zinc-600">Roll 2D on the pre-career events table.</p>
                    </div>
                    <button
                      class="h-10 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                      :disabled="!!termRolls.educationEvent"
                      type="button"
                      @click="rollPreCareerEvent"
                    >
                      Roll 2D
                    </button>
                  </div>
                  <div class="mt-3 flex flex-wrap gap-2">
                    <input
                      v-model.number="manualRollTotals.educationEvent"
                      class="h-10 w-28 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                      :disabled="!!termRolls.educationEvent"
                      max="12"
                      min="2"
                      placeholder="2D total"
                      type="number"
                    >
                    <button
                      class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:border-amber-600 disabled:cursor-not-allowed disabled:text-zinc-400"
                      :disabled="!!termRolls.educationEvent"
                      type="button"
                      @click="enterManualPreCareerEvent"
                    >
                      Manual
                    </button>
                  </div>
                  <div v-if="termRolls.educationEvent && preCareerEvent" class="mt-3 rounded-md bg-stone-50 p-3 text-sm">
                    <div class="flex flex-wrap items-center justify-between gap-3">
                      <p class="font-semibold">{{ rollSummary(termRolls.educationEvent) }} · {{ preCareerEvent.name }}</p>
                      <button
                        class="text-xs font-semibold text-amber-700 hover:text-amber-900"
                        type="button"
                        @click="educationEventExpanded = !educationEventExpanded"
                      >
                        {{ educationEventExpanded ? 'Hide text' : 'Show text' }}
                      </button>
                    </div>
                    <div v-if="educationEventExpanded" class="mt-3 grid gap-3">
                      <p v-if="preCareerEvent.text" class="leading-6 text-zinc-700">{{ preCareerEvent.text }}</p>
                      <ul class="grid gap-1 text-zinc-600">
                        <li v-for="effect in preCareerEvent.effects" :key="`${preCareerEvent.id}-${effect.type}-${preCareerEventEffectLabel(effect)}`">
                          {{ preCareerEventEffectLabel(effect) }}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div v-if="termRolls.educationEntry?.finalSuccess && termRolls.educationEvent" class="rounded-md border border-zinc-200 p-4">
                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p class="text-sm font-semibold">Graduation Roll</p>
                      <p class="text-sm text-zinc-600">{{ checkLabel(selectedEducation.graduation) }}</p>
                    </div>
                    <button class="h-10 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800" type="button" @click="rollCheck('educationGraduation', 'Graduation', selectedEducation.graduation)">
                      Roll 2D
                    </button>
                  </div>
                  <div class="mt-3 flex flex-wrap gap-2">
                    <input v-model.number="manualRollTotals.educationGraduation" class="h-10 w-28 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="2D total" type="number">
                    <button class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:border-amber-600" type="button" @click="enterManualCheck('educationGraduation', 'Graduation', selectedEducation.graduation)">
                      Manual
                    </button>
                  </div>
                  <div v-if="termRolls.educationGraduation" class="mt-3 rounded-md bg-stone-50 p-3 text-sm">
                    <p class="font-semibold">{{ rollSummary(termRolls.educationGraduation) }} · {{ termRolls.educationGraduation.finalSuccess ? 'Graduated' : 'Did not graduate' }}</p>
                    <p v-if="termRolls.educationGraduation.notes" class="mt-1 text-zinc-600">{{ termRolls.educationGraduation.notes }}</p>
                    <button class="mt-2 text-xs font-semibold text-amber-700 hover:text-amber-900" type="button" @click="toggleRollOverride('educationGraduation')">
                      {{ termRolls.educationGraduation.overridden ? 'Remove override' : 'Override outcome' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="rounded-md border border-zinc-200 bg-stone-50 p-4">
              <p class="text-sm font-semibold text-zinc-900">Education data unavailable</p>
              <p class="mt-2 text-sm leading-6 text-zinc-600">Select a different education path or check the Core data file.</p>
            </div>
          </div>

          <div v-if="agingRequired" class="mt-5 rounded-md border border-amber-300 bg-amber-50 p-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="text-sm font-semibold text-amber-950">Aging Roll</p>
                <p class="text-sm text-amber-900">Roll 2D with DM {{ formatDm(-currentTermNumber) }} at the end of term {{ currentTermNumber }}.</p>
              </div>
              <button class="h-10 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800" type="button" @click="rollAging">
                Roll 2D
              </button>
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              <input v-model.number="manualRollTotals.aging" class="h-10 w-28 rounded-md border border-amber-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="2D total" type="number">
              <button class="h-10 rounded-md border border-amber-400 px-3 text-sm font-semibold text-amber-950 hover:border-amber-700" type="button" @click="enterManualAging">
                Manual
              </button>
            </div>
            <div v-if="termRolls.aging" class="mt-3 rounded-md bg-white p-3 text-sm">
              <p class="font-semibold">{{ rollSummary(termRolls.aging) }} · {{ agingEffect }}</p>
              <p class="mt-1 text-zinc-600">Apply any characteristic reductions manually for now.</p>
            </div>
          </div>

          <div class="mt-5 flex flex-wrap justify-end gap-3 border-t border-zinc-200 pt-5">
            <button
              class="h-10 rounded-md border border-zinc-300 px-4 text-sm font-semibold text-zinc-700 hover:border-zinc-500 disabled:cursor-not-allowed disabled:text-zinc-400"
              :disabled="termHistory.length === 0 || lifepathComplete"
              type="button"
              @click="musterOut"
            >
              Muster Out
            </button>
            <button
              class="h-10 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
              :disabled="!canCompleteTerm"
              type="button"
              @click="addTermTab"
            >
              {{ nextTermButtonLabel }}
            </button>
          </div>
        </div>
          </div>
        </div>
      </section>

      <aside class="h-fit rounded-lg border border-zinc-300 bg-zinc-950 p-5 text-white shadow-sm lg:sticky lg:top-6">
        <p class="text-sm font-semibold uppercase tracking-wide text-amber-300">Current Traveller</p>
        <h2 class="mt-2 text-2xl font-semibold">{{ characterName || 'Unnamed Traveller' }}</h2>

        <div class="mt-5 grid grid-cols-3 gap-2">
          <div v-for="item in characteristicRows" :key="item.id" class="rounded-md border border-white/15 p-3">
            <p class="text-xs text-zinc-400">{{ item.abbreviation }}</p>
            <p class="mt-1 text-xl font-semibold">{{ item.value }}</p>
            <p class="text-xs text-zinc-400">DM {{ formatDm(item.dm) }}</p>
          </div>
        </div>

        <div class="mt-5 border-t border-white/15 pt-5">
          <div class="flex items-center justify-between gap-3">
            <p class="text-sm font-semibold text-zinc-200">Skills</p>
            <span class="rounded-md bg-white/10 px-2 py-1 text-xs text-zinc-300">
              {{ currentTravellerSkills.length }}
            </span>
          </div>
          <div v-if="currentTravellerSkills.length" class="mt-3 grid gap-2">
            <div
              v-for="skill in currentTravellerSkills"
              :key="skill.id"
              class="grid grid-cols-[1fr_auto] gap-3 rounded-md bg-white/10 px-3 py-2"
            >
              <div>
                <p class="text-sm font-semibold text-zinc-100">{{ skill.name }}</p>
                <p class="text-xs text-zinc-400">{{ skill.sources.join(', ') }}</p>
              </div>
              <span class="self-center rounded-md bg-zinc-950 px-2 py-1 text-sm font-semibold text-amber-300">
                {{ skill.level }}
              </span>
            </div>
          </div>
          <span v-else class="mt-3 block text-sm text-zinc-400">No skills assigned</span>
        </div>

        <div class="mt-5 border-t border-white/15 pt-5">
          <p class="text-sm font-semibold text-zinc-200">Term {{ currentTermNumber }} Direction</p>
          <template v-if="selectedTermPath === 'career'">
            <p class="mt-2 text-lg font-semibold">{{ selectedCareer.name }}</p>
            <p class="text-sm text-zinc-400">{{ selectedAssignment.name }}</p>
          </template>
          <template v-else>
            <p class="mt-2 text-lg font-semibold">{{ selectedEducationOption.name }}</p>
            <p v-if="selectedEducationEntry" class="text-sm text-zinc-400">Entry {{ checkLabel(selectedEducationEntry) }}</p>
          </template>
        </div>

        <div class="mt-5 border-t border-white/15 pt-5">
          <div class="flex items-center justify-between gap-3">
            <p class="text-sm font-semibold text-zinc-200">Term History</p>
            <span class="rounded-md bg-white/10 px-2 py-1 text-xs text-zinc-300">
              {{ termHistory.length }}
            </span>
          </div>
          <div v-if="termHistory.length" class="mt-3 grid gap-2">
            <div
              v-for="term in termHistory"
              :key="term.termNumber"
              class="rounded-md bg-white/10 px-3 py-2"
            >
              <p class="text-sm font-semibold text-zinc-100">Term {{ term.termNumber }} · Age {{ term.startAge }}-{{ term.endAge }}</p>
              <p class="text-xs text-zinc-400">{{ term.summary }}</p>
            </div>
          </div>
          <span v-else class="mt-3 block text-sm text-zinc-400">No completed terms</span>
        </div>
      </aside>
    </div>

    <div
      v-if="showRerollConfirm"
      class="fixed inset-0 z-50 grid place-items-center bg-zinc-950/60 px-4"
      role="presentation"
      @click.self="cancelCharacteristicReroll"
    >
      <section
        aria-labelledby="reroll-title"
        aria-modal="true"
        class="w-full max-w-md rounded-lg border border-zinc-300 bg-white p-5 shadow-xl"
        role="dialog"
      >
        <div class="flex items-start gap-3">
          <span class="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-amber-100 text-amber-900">
            <AppIcon name="dice" />
          </span>
          <div>
            <h2 id="reroll-title" class="text-lg font-semibold text-zinc-950">Roll characteristics again?</h2>
            <p class="mt-2 text-sm leading-6 text-zinc-600">
              This will replace the current stat bank, clear characteristic assignments, and reset selected background skills.
            </p>
          </div>
        </div>

        <div class="mt-5 flex justify-end gap-3">
          <button
            class="h-10 rounded-md border border-zinc-300 px-4 text-sm font-semibold text-zinc-700 hover:border-zinc-500"
            type="button"
            @click="cancelCharacteristicReroll"
          >
            Cancel
          </button>
          <button
            class="inline-flex h-10 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
            type="button"
            @click="confirmCharacteristicReroll"
          >
            <AppIcon name="dice" />
            Roll again
          </button>
        </div>
      </section>
    </div>
  </main>
</template>
