<script setup lang="ts">
import characteristicsData from '~/data/traveller2e/core/characteristics.json'
import skillsData from '~/data/traveller2e/core/skills.json'
import careersData from '~/data/traveller2e/core/careers-summary.json'
import creationRulesData from '~/data/traveller2e/core/character-creation-rules.json'
import agingData from '~/data/traveller2e/core/aging-and-injuries.json'
import careerTablesData from '~/data/traveller2e/core/career-tables.json'

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
  startAge: number
  endAge: number
  summary: string
  rolls: RollResult[]
}

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
const selectedEducationId = ref('university')
const selectedTermPath = ref<'career' | 'education'>('career')
const selectedCareerId = ref('agent')
const selectedAssignmentId = ref('law-enforcement')
const selectedCareerSkillTableId = ref('personal-development')
const hasRolledCharacteristics = ref(false)
const showRerollConfirm = ref(false)
const currentTermNumber = ref(1)
const lifepathComplete = ref(false)
const termHistory = ref<TermHistoryEntry[]>([])
const appliedSkillRecords = reactive<Record<string, CharacterSkill>>({})
const careerSkillResult = ref<string | null>(null)
const pendingSkillChoice = ref<{ label: string; source: string; options: string[] } | null>(null)
const termRolls = reactive<Record<string, RollResult | null>>({
  educationEntry: null,
  educationGraduation: null,
  careerQualification: null,
  careerSkill: null,
  careerSurvival: null,
  careerAdvancement: null,
  aging: null,
})
const manualRollTotals = reactive<Record<string, number | null>>({
  educationEntry: null,
  educationGraduation: null,
  careerQualification: null,
  careerSkill: null,
  careerSurvival: null,
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

watch(currentTermNumber, (termNumber) => {
  if (termNumber > 3 && selectedTermPath.value === 'education') {
    selectedTermPath.value = 'career'
  }
})

const backgroundSkillLimit = computed(() => Math.max(0, Math.min(6, diceModifier(values.edu) + 3)))
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
const selectedEducationEntry = computed(() => {
  if (!selectedEducation.value) return null
  if (selectedEducation.value.id === 'military-academy' && selectedEducationVariant.value) {
    return selectedEducation.value.entryByVariant[selectedEducationVariant.value as 'army' | 'marine' | 'navy']
  }

  return selectedEducation.value.entry
})
const selectedCareer = computed(() => careersData.careers.find((career) => career.id === selectedCareerId.value) ?? careersData.careers[0])
const selectedAssignment = computed(() => {
  const assignment = selectedCareer.value.assignments.find((item) => item.id === selectedAssignmentId.value)
  return assignment ?? selectedCareer.value.assignments[0]
})
const currentCareerTableData = computed(() => {
  return (careerTablesData.careers as Record<string, any>)[selectedCareerId.value] ?? null
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

watch(selectedCareerId, () => {
  selectedAssignmentId.value = selectedCareer.value.assignments[0].id
})

watch(availableCareerSkillTables, (tables) => {
  if (!tables.some((table) => table.id === selectedCareerSkillTableId.value)) {
    selectedCareerSkillTableId.value = tables[0]?.id ?? 'personal-development'
  }
})

watch(backgroundSkillLimit, (limit) => {
  selectedBackgroundSkills.value = selectedBackgroundSkills.value.slice(0, limit)
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
  const specialityMatch = trimmed.match(/^(.+?)\s*\((.+)\)$/)
  const baseName = (specialityMatch?.[1] ?? trimmed).trim()
  const speciality = specialityMatch?.[2]?.trim()
  const baseSkill = skillsData.skills.find((item) => item.name.toLowerCase() === baseName.toLowerCase())
  const id = speciality
    ? `${baseSkill?.id ?? slugifySkill(baseName)}:${slugifySkill(speciality)}`
    : baseSkill?.id ?? slugifySkill(baseName)
  const name = speciality
    ? `${baseSkill?.name ?? baseName} (${speciality})`
    : baseSkill?.name ?? baseName

  return { id, name }
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
  applyTrainingResult(choice, pending.source)
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

const resetTermRolls = () => {
  for (const key of Object.keys(termRolls)) {
    termRolls[key] = null
    manualRollTotals[key] = null
  }
  careerSkillResult.value = null
  pendingSkillChoice.value = null
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
    return Boolean(termRolls.educationGraduation)
  }

  if (!termRolls.careerQualification) return false
  if (!termRolls.careerQualification.finalSuccess) return false
  if (!termRolls.careerSkill || pendingSkillChoice.value) return false
  if (!termRolls.careerSurvival) return false
  if (!termRolls.careerSurvival.finalSuccess) return true
  return Boolean(termRolls.careerAdvancement)
})

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
      startAge: currentAge.value,
      endAge: endOfTermAge.value,
      summary,
      rolls,
    },
  ]

  currentTermNumber.value += 1
  resetTermRolls()
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
            <span class="rounded-md bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900">
              {{ selectedBackgroundSkills.length }} / {{ backgroundSkillLimit }}
            </span>
          </div>

          <div class="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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

        <div class="rounded-lg border border-zinc-300 bg-white p-5 shadow-sm">
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
                  <p v-if="pendingSkillChoice" class="mt-1 text-zinc-600">Choose which result to apply.</p>
                  <div v-if="pendingSkillChoice" class="mt-3 flex flex-wrap gap-2">
                    <button
                      v-for="choice in pendingSkillChoice.options"
                      :key="choice"
                      class="h-9 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
                      type="button"
                      @click="resolvePendingSkillChoice(choice)"
                    >
                      {{ choice }}
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
                  <p v-if="!termRolls.careerSurvival.finalSuccess" class="mt-1 text-zinc-600">Detailed mishap tables will unlock after career tables are entered.</p>
                  <button class="mt-2 text-xs font-semibold text-amber-700 hover:text-amber-900" type="button" @click="toggleRollOverride('careerSurvival')">
                    {{ termRolls.careerSurvival.overridden ? 'Remove override' : 'Override outcome' }}
                  </button>
                </div>
              </div>

              <div v-if="termRolls.careerSurvival?.finalSuccess" class="rounded-md border border-zinc-200 p-4">
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
                  <div v-if="selectedEducation.id === 'university'" class="mt-3 flex flex-wrap gap-2">
                    <span
                      v-for="skill in selectedEducation.skillOptions.slice(0, 8)"
                      :key="skill"
                      class="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-700"
                    >
                      {{ skill }}
                    </span>
                    <span class="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-700">
                      {{ selectedEducation.skillOptions.length - 8 }} more
                    </span>
                  </div>
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
                    <p v-if="!termRolls.educationEntry.finalSuccess" class="mt-1 text-zinc-600">Failed entry should move this term to a career attempt.</p>
                    <button class="mt-2 text-xs font-semibold text-amber-700 hover:text-amber-900" type="button" @click="toggleRollOverride('educationEntry')">
                      {{ termRolls.educationEntry.overridden ? 'Remove override' : 'Override outcome' }}
                    </button>
                  </div>
                </div>

                <div v-if="termRolls.educationEntry?.finalSuccess" class="rounded-md border border-zinc-200 p-4">
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
              @click="completeCurrentTerm"
            >
              Complete Term
            </button>
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
