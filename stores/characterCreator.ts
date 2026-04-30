import { computed, reactive, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import characteristicsData from '~/data/traveller2e/core/characteristics.json'
import skillsData from '~/data/traveller2e/core/skills.json'
import careersData from '~/data/traveller2e/core/careers-summary.json'
import creationRulesData from '~/data/traveller2e/core/character-creation-rules.json'
import agingData from '~/data/traveller2e/core/aging-and-injuries.json'
import careerTablesData from '~/data/traveller2e/core/career-tables.json'
import careerRanksData from '~/data/traveller2e/core/career-ranks.json'
import type { TravellerCharacteristicId, TravellerProfile } from '~/types/traveller'
import { getCareerEvent, getCareerMishap, getEducationEvent, getEventFromTable, normalizeTravellerEventEffect, type TravellerEvent, type TravellerEventEffect } from '~/utils/traveller/events'
import { createBlankTravellerProfile } from '~/utils/traveller/profile'

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
  honoursTarget?: number
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
  details: string[]
  rolls: RollResult[]
}
type CreatorTab = 'creation' | `term-${number}`
type GmOverrideOptionId = 'manualCheckRollEntry' | 'manualTableRollEntry' | 'manualAgingRollEntry' | 'manualBenefitRollEntry' | 'manualPsionicsRollEntry' | 'outcomeOverrides' | 'characteristicAdjustments'
type EventResolutionKind = 'manual' | 'skill_choice' | 'skill_table_roll' | 'benefit_wager' | 'table_roll' | 'check' | 'choice' | 'associate' | 'narrative' | 'characteristic_adjustment' | 'medical_care'
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
  characteristicOptions?: CharacteristicId[]
  characteristicAmount?: number | string
  medicalCharacteristic?: CharacteristicId
  medicalMaxRestore?: number
  medicalCostPerPoint?: number
  medicalCrisis?: boolean
  tableId?: string
  skillTableId?: string
  diceCount?: 1 | 2
  wagerChecks?: Array<{
    label: string
    skill: string
    target: number
    dm: number
  }>
  check?: {
    label: string
    target: number
    dm: number
  }
  level?: number
  increase?: boolean
  resolved?: boolean
  selected?: string
  details?: string
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
type TravellerNarrativeEvent = {
  id: string
  source: string
  title: string
  category?: string
  text?: string
  notes?: string
}
type PsionicTalent = {
  id: string
  name: string
  learningDm: number
}
type PsionicTalentAttempt = {
  id: string
  talentId: string
  talentName: string
  dice: number[]
  psiDm: number
  learningDm: number
  attemptDm: number
  total: number
  target: number
  success: boolean
  source: 'rolled' | 'manual' | 'automatic'
}
type TravellerRollModifier = {
  id: string
  source: string
  label: string
  target: 'advancement' | 'qualification' | 'benefit' | 'survival' | 'commission' | 'career' | 'any'
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
  careerId?: string
}
type MusteringOutRollType = 'cash' | 'benefit'
type MusteringOutResult = {
  id: string
  careerId: string
  careerName: string
  rollType: MusteringOutRollType
  dice: number[]
  dm: number
  total: number
  tableRoll: number
  cash?: number
  benefit?: string
}
type MedicalCareEntry = {
  id: string
  source: string
  characteristic: CharacteristicId
  restored: number
  cost: number
  crisis?: boolean
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
type PrisonerParoleThresholdRoll = {
  dice: number
  total: number
  source: 'rolled' | 'manual'
}
type DraftRoll = {
  dice: number
  careerId: string
  assignmentId?: string
  source: 'rolled' | 'manual'
}
type CareerRankRow = {
  rank: number
  title?: string
  bonus?: string
}
type CareerRankState = {
  careerId: string
  careerName: string
  assignmentId?: string
  assignmentName?: string
  rank: number
  title?: string
  bonus?: string
}
type AdvancementResult = {
  success: boolean
  careerName: string
  assignmentName: string
  previousRank: number
  newRank: number
  previousTitle: string
  newTitle: string
  bonus?: string
  track: Array<CareerRankRow & { achieved: boolean, current: boolean }>
}
export const useCharacterCreatorStore = defineStore('characterCreator', () => {
  const creatorProfileSeed = createBlankTravellerProfile('lifepath')
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
  const selectedAdvancementSkillTableId = ref('personal-development')
  const hasRolledCharacteristics = ref(false)
  const showRerollConfirm = ref(false)
  const skipCharacteristicRerollConfirm = ref(false)
  const currentTermNumber = ref(1)
  const activeCreatorTab = ref<CreatorTab>('creation')
  const draftUsed = ref(false)
  const draftRoll = ref<DraftRoll | null>(null)
  const gmOverrideMenuOpen = ref(false)
  const gmOverrideOptions = reactive<Record<GmOverrideOptionId, boolean>>({
    manualCheckRollEntry: false,
    manualTableRollEntry: false,
    manualAgingRollEntry: false,
    manualBenefitRollEntry: false,
    manualPsionicsRollEntry: false,
    outcomeOverrides: false,
    characteristicAdjustments: false,
  })
  const lifepathComplete = ref(false)
  const termHistory = ref<TermHistoryEntry[]>([])
  const careerRanks = ref<CareerRankState[]>([])
  const advancementResult = ref<AdvancementResult | null>(null)
  const appliedSkillRecords = reactive<Record<string, CharacterSkill>>({})
  const educationSkillsApplied = ref(false)
  const universityLevel0Skill = ref('')
  const universityLevel1Skill = ref('')
  const pendingEducationSkillChoices = ref<Array<{ label: string; level: number; options: string[]; selected?: string }>>([])
  const educationEventExpanded = ref(false)
  const basicTrainingApplied = ref(false)
  const basicTrainingCareerIds = ref<string[]>([])
  const pendingBasicTrainingChoices = ref<Array<{ label: string; options: string[]; selected?: string }>>([])
  const careerEventExpanded = ref(false)
  const careerMishapExpanded = ref(false)
  const careerSkillResult = ref<string | null>(null)
  const activeEvent = ref<TravellerEvent | null>(null)
  const pendingEventResolutions = ref<PendingEventResolution[]>([])
  const eventOutcomeLog = ref<EventOutcomeLogEntry[]>([])
  const associates = ref<TravellerAssociate[]>([])
  const narrativeEvents = ref<TravellerNarrativeEvent[]>([])
  const psionicsPermissionSources = ref<string[]>([])
  const psiScore = ref<number | null>(null)
  const psiTestRoll = ref<RollResult | null>(null)
  const psionicTalentAttempts = ref<PsionicTalentAttempt[]>([])
  const psionicsTrainingCost = ref(0)
  const psionicsTestCharged = ref(false)
  const psionicsTrainingCharged = ref(false)
  const prisonerParoleThreshold = ref<number | null>(null)
  const prisonerParoleThresholdRoll = ref<PrisonerParoleThresholdRoll | null>(null)
  const prisonerReleasedThisTerm = ref(false)
  const prisonerBenefitRollsLost = ref(false)
  const rollModifiers = ref<TravellerRollModifier[]>([])
  const benefitRollAdjustments = ref<BenefitRollAdjustment[]>([])
  const benefitRollLedger = ref<BenefitRollLedgerEntry[]>([])
  const musteringOutResults = ref<MusteringOutResult[]>([])
  const selectedMusteringCareerId = ref('')
  const selectedMusteringRollType = ref<MusteringOutRollType>('benefit')
  const startingCredits = ref(0)
  const personalBenefits = ref<string[]>([])
  const medicalDebt = ref(0)
  const totalDebt = computed(() => medicalDebt.value + psionicsTrainingCost.value)
  const medicalCareLog = ref<MedicalCareEntry[]>([])
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
    careerCommission: null,
    careerAdvancement: null,
    careerAdvancementSkill: null,
    draft: null,
    prisonerParoleThreshold: null,
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
    careerCommission: null,
    careerAdvancement: null,
    careerAdvancementSkill: null,
    draft: null,
    prisonerParoleThreshold: null,
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
      if (skipCharacteristicRerollConfirm.value) {
        performCharacteristicRoll()
        return
      }
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

  if (import.meta.client) {
    skipCharacteristicRerollConfirm.value = window.localStorage.getItem('traveller2e.skipCharacteristicRerollConfirm') === 'true'
    watch(skipCharacteristicRerollConfirm, (value) => {
      window.localStorage.setItem('traveller2e.skipCharacteristicRerollConfirm', value ? 'true' : 'false')
    })
  }

  const currentAge = computed(() => 18 + ((currentTermNumber.value - 1) * 4))
  const endOfTermAge = computed(() => currentAge.value + 4)
  const psionicTalents: PsionicTalent[] = [
    { id: 'telepathy', name: 'Telepathy', learningDm: 4 },
    { id: 'clairvoyance', name: 'Clairvoyance', learningDm: 3 },
    { id: 'telekinesis', name: 'Telekinesis', learningDm: 2 },
    { id: 'awareness', name: 'Awareness', learningDm: 1 },
    { id: 'teleportation', name: 'Teleportation', learningDm: 0 },
  ]
  const psiTermsServed = computed(() => termHistory.value.length)
  const psiDm = computed(() => diceModifier(psiScore.value ?? 0))
  const psionicsTestingAvailable = computed(() => psionicsPermissionSources.value.length > 0)
  const psiTested = computed(() => Boolean(psiTestRoll.value))
  const psionicsTrainingAvailable = computed(() => (psiScore.value ?? 0) > 0)
  const learnedPsionicTalentIds = computed(() => new Set(currentTravellerSkills.value
    .filter((skill) => psionicTalents.some((talent) => talent.id === skill.id))
    .map((skill) => skill.id)))
  const learnedPsionicTalents = computed(() => psionicTalents.filter((talent) => learnedPsionicTalentIds.value.has(talent.id)))
  const psionicTalentChecksAttempted = computed(() => psionicTalentAttempts.value.filter((attempt) => attempt.source !== 'automatic').length)
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
  const backgroundSkillsComplete = computed(() => selectedBackgroundSkills.value.length >= backgroundSkillLimit.value)
  const characteristicsAssigned = computed(() => characteristicOrder.every((id) => Boolean(assignedRollIds[id])))
  const setupComplete = computed(() => hasRolledCharacteristics.value && characteristicsAssigned.value && backgroundSkillsComplete.value)
  const gmManualCheckRollEntryEnabled = computed(() => gmOverrideOptions.manualCheckRollEntry)
  const gmManualTableRollEntryEnabled = computed(() => gmOverrideOptions.manualTableRollEntry)
  const gmManualAgingRollEntryEnabled = computed(() => gmOverrideOptions.manualAgingRollEntry)
  const gmManualBenefitRollEntryEnabled = computed(() => gmOverrideOptions.manualBenefitRollEntry)
  const gmManualPsionicsRollEntryEnabled = computed(() => gmOverrideOptions.manualPsionicsRollEntry)
  const gmOutcomeOverridesEnabled = computed(() => gmOverrideOptions.outcomeOverrides)
  const gmCharacteristicAdjustmentsEnabled = computed(() => gmOverrideOptions.characteristicAdjustments)
  const prisonerCareerSelected = computed(() => selectedTermPath.value === 'career' && selectedCareerId.value === 'prisoner')
  const prisonerParoleThresholdRequired = computed(() => prisonerCareerSelected.value && prisonerParoleThreshold.value === null)
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
  const educationGraduationHonours = computed(() => {
    const graduation = termRolls.educationGraduation
    const honoursTarget = selectedEducation.value?.graduation?.honoursTarget
    if (!graduation?.finalSuccess || typeof honoursTarget !== 'number') return false
    return graduation.total >= honoursTarget
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
        return constraint.effectType === 'next_career' || constraint.effectType === 'draft_assignment' || constraint.effectType === 'automatic_career_entry' || constraint.effectType === 'natural_12_continue'
      })
  })
  const automaticCareerEntryConstraint = computed(() => {
    return [...activeCareerConstraints.value]
      .reverse()
      .find((constraint) => {
        if (constraint.effectType !== 'automatic_career_entry') return false
        return !constraint.careerId || constraint.careerId === selectedCareerId.value
      })
  })
  const automaticCommissionConstraint = computed(() => {
    return [...activeCareerConstraints.value]
      .reverse()
      .find((constraint) => {
        if (constraint.effectType !== 'automatic_commission') return false
        return !constraint.careerId || constraint.careerId === selectedCareerId.value
      })
  })
  const careerPathLocked = computed(() => activeCareerConstraints.value.some((constraint) => {
    return constraint.effectType === 'next_career' || constraint.effectType === 'draft_assignment' || constraint.effectType === 'draft_next_term' || constraint.effectType === 'automatic_career_entry' || constraint.effectType === 'natural_12_continue'
  }))
  const forcedOutCareerIds = computed(() => new Set(activeCareerConstraints.value
    .filter((constraint) => constraint.forcedOut && constraint.careerId)
    .map((constraint) => constraint.careerId as string)))
  const cannotContinueCareerIds = computed(() => new Set(activeCareerConstraints.value
    .filter((constraint) => constraint.effectType === 'cannot_continue_career' && constraint.careerId)
    .map((constraint) => constraint.careerId as string)))
  const careerQualificationFailed = computed(() => termRolls.careerQualification?.finalSuccess === false)
  const draftFallbackAvailable = computed(() => careerQualificationFailed.value && !draftUsed.value)
  const drifterFallbackAvailable = computed(() => careerQualificationFailed.value)
  const mustContinueCareer = computed(() => activeCareerConstraints.value.some((constraint) => {
    return constraint.effectType === 'natural_12_continue' && constraint.careerId === selectedCareerId.value
  }))
  const currentAdvancementNaturalTwelve = computed(() => {
    const roll = termRolls.careerAdvancement
    if (!roll) return false
    return roll.dice.reduce((sum, value) => sum + value, 0) === 12
  })
  const canMusterOut = computed(() => termHistory.value.length > 0 && !lifepathComplete.value && !mustContinueCareer.value && !currentAdvancementNaturalTwelve.value)
  const careerOptions = computed(() => careersData.careers.map((career) => {
    const forcedCareerId = forcedCareerConstraint.value?.careerId
    const forcedOut = forcedOutCareerIds.value.has(career.id)
    const cannotContinue = cannotContinueCareerIds.value.has(career.id)
    const permissionLocked = career.id === 'psion' && !psionicsTestingAvailable.value
    const psiUntested = career.id === 'psion' && psionicsTestingAvailable.value && !psiTested.value
    const prisonerLocked = career.id === 'prisoner' && forcedCareerId !== 'prisoner'
    const disabled = Boolean((forcedCareerId && career.id !== forcedCareerId) || forcedOut || cannotContinue || permissionLocked || psiUntested || prisonerLocked)
    const disabledReason = forcedCareerId && career.id !== forcedCareerId
      ? `Must enter ${forcedCareerConstraint.value?.label ?? forcedCareerId}`
      : forcedOut
        ? 'Forced out of this career'
        : cannotContinue
          ? 'Cannot continue this career next term'
          : permissionLocked
            ? 'Requires psionics permission'
            : psiUntested
              ? 'Requires PSI test'
              : prisonerLocked
                ? 'Requires Prisoner event or GM override'
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
  const draftTable = computed(() => creationRulesData.draft.table as Array<{ roll: number, careerId: string, assignment?: string }>)
  const currentCareerTableData = computed(() => {
    return (careerTablesData.careers as Record<string, any>)[selectedCareerId.value] ?? null
  })
  const previousCareerCount = computed(() => new Set(termHistory.value
    .map((term) => term.careerId)
    .filter((careerId): careerId is string => Boolean(careerId) && careerId !== selectedCareerId.value)).size)
  const currentCareerQualificationDm = computed(() => {
    const modifiers = currentCareerTableData.value?.qualificationModifiers
    if (!Array.isArray(modifiers)) return 0

    return modifiers.reduce((sum: number, modifier: Record<string, unknown>) => {
      if (modifier.condition !== 'previous_careers') return sum
      return sum + (Number(modifier.dmPer ?? 0) * previousCareerCount.value)
    }, 0)
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
        if (tableId === 'officer') return currentCareerIsOfficer.value
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
  const selectedAdvancementSkillTable = computed(() => {
    return availableCareerSkillTables.value.find((table) => table.id === selectedAdvancementSkillTableId.value) ?? availableCareerSkillTables.value[0]
  })
  const selectedAdvancementSkillEntries = computed(() => selectedAdvancementSkillTable.value?.entries ?? [])
  const careerTermsCompleted = computed(() => {
    return termHistory.value.filter((entry) => entry.path === 'career' && entry.careerId === selectedCareerId.value).length
  })
  const completedBasicTrainingCareerIds = computed(() => new Set([
    ...basicTrainingCareerIds.value,
    ...termHistory.value
      .filter((entry) => entry.path === 'career' && entry.careerId)
      .map((entry) => entry.careerId as string),
  ]))
  const militaryCareerIds = ['army', 'marine', 'navy']
  const selectedCareerIsMilitary = computed(() => militaryCareerIds.includes(selectedCareerId.value))
  const currentCareerOfficerRank = computed(() => {
    return careerRanks.value.find((rank) => rank.careerId === selectedCareerId.value && rank.assignmentId === 'officer') ?? null
  })
  const currentCareerIsOfficer = computed(() => Boolean(currentCareerOfficerRank.value))
  const selectedCareerCommissionCheck = computed<CheckRule | null>(() => currentCareerTableData.value?.commission ?? null)
  const careerCommissionAvailable = computed(() => {
    if (!selectedCareerIsMilitary.value || !selectedCareerCommissionCheck.value) return false
    if (currentCareerIsOfficer.value) return false
    if (!termRolls.careerSurvival?.finalSuccess) return false
    return careerTermsCompleted.value === 0 || values.soc >= 9
  })
  const careerRankAssignmentId = computed(() => selectedCareerIsMilitary.value && currentCareerIsOfficer.value ? 'officer' : selectedAssignmentId.value)
  const basicTrainingRequired = computed(() => {
    return selectedTermPath.value === 'career' && !completedBasicTrainingCareerIds.value.has(selectedCareerId.value)
  })
  const basicTrainingAvailable = computed(() => Boolean(termRolls.careerQualification?.finalSuccess && basicTrainingRequired.value))
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
    if (!tables.some((table) => table.id === selectedAdvancementSkillTableId.value)) {
      selectedAdvancementSkillTableId.value = tables[0]?.id ?? 'personal-development'
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

  const toggleGmOverrideControls = () => {
    gmOverrideMenuOpen.value = !gmOverrideMenuOpen.value
  }

  const toggleGmOverrideOption = (optionId: GmOverrideOptionId) => {
    gmOverrideOptions[optionId] = !gmOverrideOptions[optionId]
  }

  const forcePrisonerCareer = () => {
    careerConstraints.value = [
      ...careerConstraints.value,
      {
        id: makeEventOutcomeId('career-constraint'),
        source: 'GM Override',
        label: 'GM override: Prisoner career',
        effectType: 'next_career',
        appliesTermNumber: currentTermNumber.value,
        careerId: 'prisoner',
      },
    ]
    selectedTermPath.value = 'career'
    selectedCareerId.value = 'prisoner'
    prisonerParoleThreshold.value = null
    prisonerParoleThresholdRoll.value = null
    recordEventOutcome('GM Override', { type: 'next_career', careerId: 'prisoner' }, 'Prisoner career selected', 'manual')
  }

  const grantPsionicsTestingOverride = () => {
    grantPsionicsPermission('GM Override', 'May test PSI')
    recordEventOutcome('GM Override', { type: 'may_test_psi' }, 'Psionics testing enabled', 'manual')
  }

  const skillName = (skillId: string) => {
    if (skillId.includes(':') || skillId.includes('/')) return skillOptionLabel(skillId)
    const skill = skillsData.skills.find((item) => item.id === skillId)
    return skill?.name ?? skillId
  }

  const slugifySkill = (value: string) => value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const skillFromLabel = (label: string) => {
    const trimmed = label.trim()
    const normalizeSpeciality = (baseSkill: { specialities?: string[] } | undefined, value: string) => {
      const slug = slugifySkill(value === '*' ? 'any' : value)
      if (slug === 'any') return slug
      const exact = baseSkill?.specialities?.find((speciality) => slugifySkill(speciality) === slug)
      if (exact) return slugifySkill(exact)
      const singular = slug.endsWith('s') ? slug.slice(0, -1) : slug
      const singularMatch = baseSkill?.specialities?.find((speciality) => slugifySkill(speciality) === singular)
      return singularMatch ? slugifySkill(singularMatch) : slug
    }
    const slashSpecialityMatch = trimmed.match(/^(.+?)\/(.+)$/)
    if (slashSpecialityMatch) {
      const baseSkill = skillsData.skills.find((item) => item.id === slashSpecialityMatch[1] || item.name.toLowerCase() === slashSpecialityMatch[1].toLowerCase())
      const specialityId = normalizeSpeciality(baseSkill, slashSpecialityMatch[2])
      const speciality = specialityId === 'any'
        ? 'any'
        : baseSkill?.specialities?.find((item) => slugifySkill(item) === specialityId) ?? slashSpecialityMatch[2]
      return {
        id: `${baseSkill?.id ?? slugifySkill(slashSpecialityMatch[1])}:${specialityId}`,
        name: `${baseSkill?.name ?? slashSpecialityMatch[1]} (${speciality})`,
        baseId: baseSkill?.id ?? slugifySkill(slashSpecialityMatch[1]),
        specialityId,
      }
    }

    const specialityMatch = trimmed.match(/^(.+?)\s*\((.+)\)$/)
    const baseName = (specialityMatch?.[1] ?? trimmed).trim()
    const speciality = specialityMatch?.[2]?.trim()
    const baseSkill = skillsData.skills.find((item) => item.id === baseName || item.name.toLowerCase() === baseName.toLowerCase())
    const specialityId = speciality ? normalizeSpeciality(baseSkill, speciality) : undefined
    const specialityName = specialityId === 'any'
      ? 'any'
      : baseSkill?.specialities?.find((item) => slugifySkill(item) === specialityId) ?? speciality
    const id = speciality
      ? `${baseSkill?.id ?? slugifySkill(baseName)}:${specialityId}`
      : baseSkill?.id ?? slugifySkill(baseName)
    const name = speciality
      ? `${baseSkill?.name ?? baseName} (${specialityName})`
      : baseSkill?.name ?? baseName

    return {
      id,
      name,
      baseId: baseSkill?.id ?? slugifySkill(baseName),
      specialityId,
    }
  }

  const skillOptionLabel = (label: string) => skillFromLabel(label).name
  const safeSkillOptionLabel = (label?: string) => label ? skillOptionLabel(label) : 'Skill'

  const skillLevel = (label: string) => {
    const skill = skillFromLabel(label)
    const exactLevel = appliedSkillRecords[skill.id]?.level
    if (typeof exactLevel === 'number') return exactLevel

    const baseLevel = appliedSkillRecords[skill.baseId]?.level
    const backgroundLevel = selectedBackgroundSkills.value.includes(skill.baseId) ? 0 : undefined
    const specialityLevels = Object.values(appliedSkillRecords)
      .filter((record) => record.id.startsWith(`${skill.baseId}:`))
      .map((record) => record.level)

    const candidateLevels = [
      typeof baseLevel === 'number' ? baseLevel : undefined,
      typeof backgroundLevel === 'number' ? backgroundLevel : undefined,
      ...(!skill.specialityId || skill.specialityId === 'any' ? specialityLevels : []),
    ].filter((level): level is number => typeof level === 'number')

    if (candidateLevels.length) return Math.max(...candidateLevels)

    const jackOfAllTrades = appliedSkillRecords['jack-of-all-trades']?.level ?? -3
    const untrainedPenalty = Number(skillsData.rules.untrainedPenalty ?? -3)
    return jackOfAllTrades >= 0
      ? Math.min(0, untrainedPenalty + jackOfAllTrades)
      : untrainedPenalty
  }

  const defaultSkillCharacteristic = (label: string): CharacteristicId | null => {
    const skill = skillFromLabel(label)
    const defaults: Record<string, CharacteristicId> = {
      athletics: 'str',
      carouse: 'soc',
      deception: 'int',
      diplomat: 'soc',
      'gun-combat': 'dex',
      gambler: 'int',
      investigate: 'int',
      leadership: 'soc',
      melee: 'str',
      persuade: 'soc',
      recon: 'int',
      stealth: 'dex',
      streetwise: 'soc',
      survival: 'end',
      tactics: 'int',
    }

    return defaults[skill.baseId] ?? null
  }

  const skillCheckDm = (label: string, characteristic?: string) => {
    const characteristicId = (characteristic as CharacteristicId | undefined) ?? defaultSkillCharacteristic(label)
    const characteristicDm = characteristicId ? diceModifier(values[characteristicId] ?? 0) : 0
    return skillLevel(label) + characteristicDm
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

  const changePsiScore = (amount: number) => {
    psiScore.value = Math.max(0, (psiScore.value ?? 0) + amount)
  }

  const applyCharacteristicIncrease = (result: string) => {
    const psiMatch = result.trim().match(/^PSI\s*\+(\d+)$/i)
    if (psiMatch) {
      changePsiScore(Number(psiMatch[1]))
      return true
    }

    const match = result.trim().match(/^(STR|DEX|END|INT|EDU|SOC)\s*\+(\d+)$/i)
    if (!match) return false

    const characteristicId = match[1].toLowerCase() as CharacteristicId
    characteristicAdjustments[characteristicId] += Number(match[2])
    applyAssignedScores()
    return true
  }

  const careerRankSource = careerRanksData as {
    careers: Record<string, Record<string, CareerRankRow[] | string>>
  }

  const resolveCareerRankRows = (careerId: string, assignmentId?: string): CareerRankRow[] => {
    const careerRanksForCareer = careerRankSource.careers[careerId]
    if (!careerRanksForCareer) return []
    const rawRows = careerRanksForCareer[assignmentId ?? ''] ?? careerRanksForCareer.shared ?? careerRanksForCareer.enlisted ?? Object.values(careerRanksForCareer)[0]

    if (typeof rawRows === 'string') {
      const [aliasCareerId, aliasAssignmentId] = rawRows.split('.')
      return resolveCareerRankRows(aliasCareerId, aliasAssignmentId)
    }

    return Array.isArray(rawRows) ? rawRows : []
  }

  const rankTitle = (row?: CareerRankRow, rank?: number) => row?.title ?? (rank !== undefined ? `Rank ${rank}` : 'Rank')

  const careerRankKey = (careerId: string, assignmentId?: string) => `${careerId}:${assignmentId ?? 'shared'}`

  const makeDefaultCareerRankState = (careerId: string, assignmentId?: string): CareerRankState => {
    const rows = resolveCareerRankRows(careerId, assignmentId)
    const startingRow = rows.find((row) => row.rank === 0) ?? rows[0]
    const career = careersData.careers.find((item) => item.id === careerId)
    const assignment = career?.assignments.find((item) => item.id === assignmentId)
    const state: CareerRankState = {
      careerId,
      careerName: career?.name ?? careerId,
      rank: startingRow?.rank ?? 0,
    }
    if (assignmentId) state.assignmentId = assignmentId
    if (assignment) state.assignmentName = assignment.name
    if (startingRow?.title) state.title = startingRow.title
    if (startingRow?.bonus) state.bonus = startingRow.bonus
    return state
  }

  const findCareerRankState = (careerId: string, assignmentId?: string) => {
    const key = careerRankKey(careerId, assignmentId)
    return careerRanks.value.find((rank) => careerRankKey(rank.careerId, rank.assignmentId) === key)
  }

  const currentCareerRankState = (careerId: string, assignmentId?: string) => {
    const existing = findCareerRankState(careerId, assignmentId)
    if (existing) return existing

    const created = makeDefaultCareerRankState(careerId, assignmentId)
    careerRanks.value = [...careerRanks.value, created]
    return created
  }

  const advancementPreview = (roll?: RollResult | null): AdvancementResult | null => {
    if (!roll || selectedTermPath.value !== 'career') return null
    const rankAssignmentId = careerRankAssignmentId.value
    const rows = resolveCareerRankRows(selectedCareerId.value, rankAssignmentId)
    const state = findCareerRankState(selectedCareerId.value, rankAssignmentId)
      ?? makeDefaultCareerRankState(selectedCareerId.value, rankAssignmentId)
    const maxRank = rows.reduce((highest, row) => Math.max(highest, row.rank), state.rank)
    const success = Boolean(roll.finalSuccess && state.rank < maxRank)
    const nextRank = success ? Math.min(state.rank + 1, maxRank) : state.rank
    const previousRow = rows.find((row) => row.rank === state.rank)
    const nextRow = rows.find((row) => row.rank === nextRank)

    const result: AdvancementResult = {
      success,
      careerName: selectedCareer.value.name,
      assignmentName: selectedAssignment.value.name,
      previousRank: state.rank,
      newRank: nextRank,
      previousTitle: rankTitle(previousRow, state.rank),
      newTitle: rankTitle(nextRow, nextRank),
      track: rows.map((row) => ({
        ...row,
        achieved: row.rank <= nextRank,
        current: row.rank === nextRank,
      })),
    }
    if (success && nextRank > state.rank && nextRow?.bonus) result.bonus = nextRow.bonus
    return result
  }

  const previewCareerAdvancement = () => {
    advancementResult.value = advancementPreview(termRolls.careerAdvancement)
  }

  const dismissAdvancementResult = () => {
    advancementResult.value = null
  }

  const applyCareerRankBonus = (bonus: string | undefined) => {
    if (!bonus) return
    if (applyCharacteristicIncrease(bonus)) return
    if (/\bor\b|whichever|any/i.test(bonus)) {
      recordEventOutcome('Career Rank', { type: 'narrative_event' }, `Resolve rank bonus manually: ${bonus}`, 'pending')
      return
    }

    const skillBonusMatch = bonus.match(/^(.+?)\s+(\d+)$/)
    if (skillBonusMatch) {
      setSkillMinimum(skillBonusMatch[1].trim(), Number(skillBonusMatch[2]), 'Career rank')
      return
    }

    recordEventOutcome('Career Rank', { type: 'narrative_event' }, `Resolve rank bonus manually: ${bonus}`, 'pending')
  }

  const applyCareerAdvancement = () => {
    const roll = termRolls.careerAdvancement
    if (selectedTermPath.value !== 'career' || !roll?.finalSuccess) return null

    const preview = advancementPreview(roll)
    if (!preview || preview.newRank <= preview.previousRank) return preview

    const rankAssignmentId = careerRankAssignmentId.value
    const state = currentCareerRankState(selectedCareerId.value, rankAssignmentId)
    const nextRow = resolveCareerRankRows(selectedCareerId.value, rankAssignmentId).find((row) => row.rank === preview.newRank)
    state.rank = preview.newRank
    if (nextRow?.title) state.title = nextRow.title
    else delete state.title
    if (nextRow?.bonus) state.bonus = nextRow.bonus
    else delete state.bonus
    applyCareerRankBonus(nextRow?.bonus)
    return preview
  }

  const applyAutomaticPromotion = (source: string) => {
    if (selectedTermPath.value !== 'career') return null
    const rankAssignmentId = careerRankAssignmentId.value
    const rows = resolveCareerRankRows(selectedCareerId.value, rankAssignmentId)
    const state = currentCareerRankState(selectedCareerId.value, rankAssignmentId)
    const maxRank = rows.reduce((highest, row) => Math.max(highest, row.rank), state.rank)
    const nextRank = Math.min(state.rank + 1, maxRank)
    const nextRow = rows.find((row) => row.rank === nextRank)

    if (nextRank <= state.rank) {
      recordEventOutcome(source, { type: 'automatic_promotion' }, 'Automatic promotion: already at maximum rank')
      return state
    }

    state.rank = nextRank
    if (nextRow?.title) state.title = nextRow.title
    else delete state.title
    if (nextRow?.bonus) state.bonus = nextRow.bonus
    else delete state.bonus
    applyCareerRankBonus(nextRow?.bonus)
    recordEventOutcome(source, { type: 'automatic_promotion' }, `Automatic promotion: ${rankTitle(nextRow, nextRank)}`)
    return state
  }

  const applyCareerCommission = (source = 'Commission') => {
    if (!selectedCareerIsMilitary.value) return null
    const rows = resolveCareerRankRows(selectedCareerId.value, 'officer')
    const officerRank = rows.find((row) => row.rank === 1) ?? rows[0]
    if (!officerRank) return null

    const state = currentCareerRankState(selectedCareerId.value, 'officer')
    if (state.rank >= officerRank.rank) return state

    state.rank = officerRank.rank
    state.title = officerRank.title ?? 'Officer'
    if (officerRank.bonus) state.bonus = officerRank.bonus
    else delete state.bonus
    applyCareerRankBonus(officerRank.bonus)
    recordEventOutcome(source, { type: 'automatic_commission' }, `${selectedCareer.value.name} commission: ${rankTitle(officerRank, officerRank.rank)}`)
    return state
  }

  const isPsionicTalentId = (skillId: string) => psionicTalents.some((talent) => talent.id === skillId)
  const psionicTalentIdFromLabel = (label: string) => {
    const skill = skillFromLabel(label)
    return isPsionicTalentId(skill.id) ? skill.id : ''
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
    if (selectedCareerId.value === 'psion' && selectedCareerSkillTableId.value === 'service-skills') {
      if (/^any talent$/i.test(result.trim())) {
        const learnedTalentIds = psionicTalents
          .map((talent) => talent.id)
          .filter((talentId) => learnedPsionicTalentIds.value.has(talentId))
        if (learnedTalentIds.length) {
          pendingSkillChoice.value = {
            label: result,
            source,
            options: learnedTalentIds,
            increase: true,
          }
        } else {
          recordEventOutcome('Psion Service Skills', { type: 'psionic_talent_prompt' }, 'Attempt to learn any talent in Psionics panel', 'manual')
        }
        return false
      }
    }

    const talentId = selectedCareerId.value === 'psion' ? psionicTalentIdFromLabel(result) : ''
    if (talentId && !learnedPsionicTalentIds.value.has(talentId)) {
      recordEventOutcome('Psion Training', { type: 'psionic_talent_prompt', talentId }, `Attempt to learn ${skillOptionLabel(talentId)} in Psionics panel`, 'manual')
      return false
    }

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

  const applyBasicTrainingEntry = (entry: string) => {
    const talentId = selectedCareerId.value === 'psion' ? psionicTalentIdFromLabel(entry) : ''
    if (talentId && !learnedPsionicTalentIds.value.has(talentId)) {
      recordEventOutcome('Psion Basic Training', { type: 'psionic_talent_prompt', talentId }, `Attempt to learn ${skillOptionLabel(talentId)} in Psionics panel`, 'manual')
      return
    }

    setSkillMinimum(entry, 0, 'Basic Training')
  }

  const markBasicTrainingComplete = () => {
    if (!basicTrainingCareerIds.value.includes(selectedCareerId.value)) {
      basicTrainingCareerIds.value = [...basicTrainingCareerIds.value, selectedCareerId.value]
    }
  }

  const applyBasicTraining = () => {
    if (!basicTrainingAvailable.value) return
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

      applyBasicTrainingEntry(entry)
    }

    basicTrainingApplied.value = pendingBasicTrainingChoices.value.length === 0
    if (basicTrainingApplied.value) markBasicTrainingComplete()
  }

  const resolveBasicTrainingChoice = (index: number, choice: string) => {
    const pending = pendingBasicTrainingChoices.value[index]
    if (!pending || pending.selected) return

    applyBasicTrainingEntry(choice)
    pendingBasicTrainingChoices.value[index] = {
      ...pending,
      selected: choice,
    }

    basicTrainingApplied.value = pendingBasicTrainingChoices.value.every((item) => item.selected)
    if (basicTrainingApplied.value) markBasicTrainingComplete()
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

  const addEducationQualificationModifier = (dm: number, source: string) => {
    rollModifiers.value = [
      ...rollModifiers.value,
      {
        id: makeEventOutcomeId('education-qualification-dm'),
        source,
        label: `Education qualification DM ${formatDm(dm)}`,
        target: 'qualification',
        dm,
        scope: 'next',
      },
    ]
  }

  const addEducationCommissionModifier = (dm: number, source: string) => {
    rollModifiers.value = [
      ...rollModifiers.value,
      {
        id: makeEventOutcomeId('education-commission-dm'),
        source,
        label: `Education commission DM ${formatDm(dm)}`,
        target: 'commission',
        dm,
        scope: 'next',
      },
    ]
  }

  const applyEducationGraduationBenefits = () => {
    const graduation = termRolls.educationGraduation
    if (!selectedEducation.value || !graduation?.finalSuccess) return

    const source = educationGraduationHonours.value
      ? `${selectedEducationOption.value.name} Honours`
      : `${selectedEducationOption.value.name} Graduation`

    for (const benefit of selectedEducation.value.graduationBenefits ?? []) {
      if (benefit.type === 'characteristic_increase' && benefit.characteristic) {
        characteristicAdjustments[benefit.characteristic as CharacteristicId] += Number(benefit.amount ?? 1)
        applyAssignedScores()
        recordEventOutcome(source, { type: 'characteristic_increase' }, `${benefit.characteristic.toUpperCase()} +${benefit.amount ?? 1}`)
      }

      if (benefit.type === 'honours_characteristic_increase' && educationGraduationHonours.value && benefit.characteristic) {
        characteristicAdjustments[benefit.characteristic as CharacteristicId] += Number(benefit.amount ?? 1)
        applyAssignedScores()
        recordEventOutcome(source, { type: 'characteristic_increase' }, `${benefit.characteristic.toUpperCase()} +${benefit.amount ?? 1}`)
      }

      if (benefit.type === 'increase_chosen_pre_career_skills') {
        if (universityLevel0Skill.value) increaseSkill(universityLevel0Skill.value, source)
        if (universityLevel1Skill.value) increaseSkill(universityLevel1Skill.value, source)
      }

      if (benefit.type === 'qualification_dm') {
        addEducationQualificationModifier(Number(educationGraduationHonours.value ? benefit.honoursDm ?? benefit.dm ?? 0 : benefit.dm ?? 0), source)
      }

      if (benefit.type === 'automatic_entry_same_military_career' && selectedEducationVariant.value) {
        careerConstraints.value = [
          ...careerConstraints.value,
          {
            id: makeEventOutcomeId('education-career-entry'),
            source,
            label: `Automatic entry from ${selectedEducationOption.value.name}`,
            effectType: 'automatic_career_entry',
            appliesTermNumber: currentTermNumber.value + 1,
            careerId: militaryAcademyCareerId.value,
          },
        ]
      }

      if (benefit.type === 'first_military_career_commission_allowed') {
        if (educationGraduationHonours.value && benefit.honoursAutomaticSuccess && selectedEducationVariant.value) {
          careerConstraints.value = [
            ...careerConstraints.value,
            {
              id: makeEventOutcomeId('education-automatic-commission'),
              source,
              label: `Automatic commission from ${selectedEducationOption.value.name} honours`,
              effectType: 'automatic_commission',
              appliesTermNumber: currentTermNumber.value + 1,
              careerId: militaryAcademyCareerId.value,
            },
          ]
        } else {
          const dm = Number(educationGraduationHonours.value ? benefit.honoursCommissionDm ?? benefit.dm ?? 0 : benefit.dm ?? 0)
          if (dm) addEducationCommissionModifier(dm, source)
        }
      }
    }
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

  const generalSkillOptions = computed(() => skillsData.skills
    .filter((skill) => !skill.special && !skill.psionic)
    .map((skill) => skill.id)
    .sort((left, right) => skillOptionLabel(left).localeCompare(skillOptionLabel(right))))

  const existingSkillOptions = computed(() => currentTravellerSkills.value
    .map((skill) => skill.id)
    .sort((left, right) => skillOptionLabel(left).localeCompare(skillOptionLabel(right))))
  const scienceSpecialityOptions = computed(() => {
    const science = skillsData.skills.find((skill) => skill.id === 'science')
    return (science?.specialities ?? [])
      .map((speciality) => `science/${speciality}`)
      .sort((left, right) => skillOptionLabel(left).localeCompare(skillOptionLabel(right)))
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
    if (rule.characteristic === 'psi') return psiDm.value
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

  const resetCareerProgressAfterQualification = () => {
    termRolls.careerSkill = null
    termRolls.careerSurvival = null
    termRolls.careerMishap = null
    termRolls.careerEvent = null
    termRolls.careerCommission = null
    termRolls.careerAdvancement = null
    termRolls.careerAdvancementSkill = null
    termRolls.prisonerParoleThreshold = null
    manualRollTotals.careerSkill = null
    manualRollTotals.careerSurvival = null
    manualRollTotals.careerMishap = null
    manualRollTotals.careerEvent = null
    manualRollTotals.careerCommission = null
    manualRollTotals.careerAdvancement = null
    manualRollTotals.careerAdvancementSkill = null
    manualRollTotals.prisonerParoleThreshold = null
    careerSkillResult.value = null
    pendingSkillChoice.value = null
    basicTrainingApplied.value = false
    pendingBasicTrainingChoices.value = []
    pendingEventResolutions.value = []
    activeEvent.value = null
    careerEventExpanded.value = false
    careerMishapExpanded.value = false
    prisonerParoleThreshold.value = null
    prisonerParoleThresholdRoll.value = null
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
    if (check?.skill) {
      const characteristic = check.characteristic ?? defaultSkillCharacteristic(String(check.skill))
      return `${skillOptionLabel(String(check.skill))}${characteristic ? ` + ${String(characteristic).toUpperCase()}` : ''} ${check.target ?? 8}+`
    }
    if (effect.type === 'check_known_term_skill') return `Known term skill ${effect.target ?? 8}+`
    return `Check ${check?.target ?? effect.target ?? 8}+`
  }

  const eventCheckTarget = (effect: TravellerEventEffect) => {
    const check = effect.check as Record<string, any> | undefined
    return Number(check?.target ?? effect.target ?? 8)
  }

  const eventCheckDm = (effect: TravellerEventEffect) => {
    const check = effect.check as Record<string, any> | undefined
    if (check?.characteristic === 'psi') return psiDm.value
    if (check?.characteristic) return diceModifier(values[String(check.characteristic) as CharacteristicId] ?? 0)
    if (check?.skill) return skillCheckDm(String(check.skill), typeof check.characteristic === 'string' ? check.characteristic : undefined)
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
      recordEventOutcome(source, effect, label, 'manual')
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

  const addCheckAnyChoiceResolution = (effect: TravellerEventEffect, source: string) => {
    if (!Array.isArray(effect.checks) || !effect.checks.length) {
      addCheckResolution(effect, source)
      return
    }

    const sharedBranches = {
      always: effect.always,
      success: effect.success,
      failure: effect.failure,
      naturalTwo: effect.naturalTwo,
    }

    addChoiceResolution({
      ...effect,
      type: 'choice',
      options: effect.checks.map((check) => ({
        label: tableEffectLabel({ type: 'check', check }),
        effects: [
          {
            type: 'check',
            check,
            ...sharedBranches,
          },
        ],
      })),
    }, source, tableEffectLabel(effect))
  }

  const assignmentSkillChecks = (effect: TravellerEventEffect) => {
    if (selectedCareerId.value === 'navy') {
      const checksByAssignment: Record<string, Array<Record<string, unknown>>> = {
        'line-crew': [
          { skill: 'electronics/sensors', target: effect.target ?? 8 },
          { skill: 'gunner', target: effect.target ?? 8 },
        ],
        'engineer-gunner': [
          { skill: 'mechanic', target: effect.target ?? 8 },
          { skill: 'vacc-suit', target: effect.target ?? 8 },
        ],
        flight: [
          { skill: 'pilot/small-craft', target: effect.target ?? 8 },
          { skill: 'pilot/spacecraft', target: effect.target ?? 8 },
          { skill: 'tactics/naval', target: effect.target ?? 8 },
        ],
      }

      return checksByAssignment[selectedAssignmentId.value] ?? []
    }

    return []
  }

  const addAssignmentSkillCheckResolution = (effect: TravellerEventEffect, source: string) => {
    const checks = assignmentSkillChecks(effect)
    if (!checks.length) {
      addManualEventResolution(effect, source, tableEffectLabel(effect))
      return
    }

    addCheckAnyChoiceResolution({
      ...effect,
      type: 'check_any',
      checks,
    }, source)
  }

  const conditionalConcreteEffect = (effect: TravellerEventEffect): TravellerEventEffect | null => {
    const dm = typeof effect.dm === 'number' ? effect.dm : undefined
    const mappings: Record<string, TravellerEventEffect> = {
      possible_ally: { type: 'gain_associate', associateTypes: ['ally'], count: 1 },
      possible_alien_contact: { type: 'gain_associate', associateTypes: ['contact'], count: 1, tags: ['alien'] },
      possible_contact: { type: 'gain_associate', associateTypes: ['contact'], count: 1 },
      possible_choose_skill_increase: { type: 'choose_skill_increase', amount: 1 },
      possible_enemy: { type: 'gain_associate', associateTypes: ['enemy'], count: 1 },
      possible_extra_benefit_roll: { type: 'extra_benefit_roll', count: 1 },
      possible_forced_out: { type: 'forced_out' },
      possible_injury: { type: 'roll_table', tableId: 'injury' },
      possible_keep_benefit_roll: { type: 'keep_current_term_benefit_roll' },
      possible_keep_current_benefit_roll: { type: 'keep_current_term_benefit_roll' },
      possible_lose_all_career_benefits: { type: 'lose_all_career_benefits' },
      possible_lose_benefit_roll: { type: 'lose_benefit_roll', count: 1 },
      possible_mishap: { type: 'roll_table', tableId: 'mishaps' },
      possible_mishap_not_ejected: { type: 'roll_table', tableId: 'mishaps', ejected: false },
      possible_next_career: { type: 'next_career', careerId: typeof effect.careerId === 'string' ? effect.careerId : 'prisoner' },
      possible_no_reenlist: { type: 'forced_out' },
      possible_not_forced_out: { type: 'not_forced_out' },
      possible_skill_increase: { type: 'choose_skill_increase', amount: 1 },
    }

    if (effect.type === 'possible_benefit_roll_change') return { type: 'extra_benefit_roll', count: 1 }
    if (effect.type === 'possible_benefit_roll_dm') return { type: 'benefit_roll_dm', dm: dm ?? 1 }
    if (effect.type === 'possible_next_advancement_dm') return { type: 'next_advancement_dm', dm: dm ?? 1 }
    if (effect.type === 'possible_next_survival_dm') return { type: 'next_survival_dm', dm: dm ?? 1 }
    if (effect.type === 'possible_physical_characteristic_loss') return { type: 'injury_characteristic_loss', category: 'physical', count: 1, amount: -1 }
    if (effect.type === 'possible_set_skill' && effect.skillId) {
      return { type: 'set_skill', skillId: effect.skillId, level: typeof effect.level === 'number' ? effect.level : 1 }
    }
    if (effect.type === 'possible_soc_change') return { type: 'choose_characteristic_change', characteristic: 'soc', amount: typeof effect.amount === 'number' ? effect.amount : 1 }

    return mappings[effect.type] ? { ...mappings[effect.type] } : null
  }

  const addConditionalEffectResolution = (effect: TravellerEventEffect, source: string, label = tableEffectLabel(effect)) => {
    const concreteEffect = conditionalConcreteEffect(effect)
    if (!concreteEffect) {
      addManualEventResolution(effect, source, label)
      return
    }

    addChoiceResolution({
      ...effect,
      type: 'choice',
      options: [
        {
          label: `Apply: ${tableEffectLabel(concreteEffect)}`,
          effects: [concreteEffect],
        },
        {
          label: 'Skip',
          effects: [],
        },
      ],
    }, source, label)
  }

  const addSkillChoiceResolution = (
    effect: TravellerEventEffect,
    source: string,
    options: string[],
    label = tableEffectLabel(effect),
    level?: number,
    increase = false,
  ) => {
    if (!options.length) {
      addManualEventResolution(effect, source, `${label} manually.`)
      return
    }

    addPendingEventResolution({
      kind: 'skill_choice',
      label,
      source,
      effect,
      options,
      level,
      increase,
    })
    recordEventOutcome(source, effect, label, 'pending')
  }

  const characteristicOptionsForEffect = (effect: Record<string, any>): CharacteristicId[] => {
    if (Array.isArray(effect.characteristics)) {
      return effect.characteristics
        .map((characteristic: string) => characteristic.toLowerCase())
        .filter((characteristic: string): characteristic is CharacteristicId => characteristicOrder.includes(characteristic as CharacteristicId))
    }

    if (effect.characteristic && characteristicOrder.includes(String(effect.characteristic).toLowerCase() as CharacteristicId)) {
      return [String(effect.characteristic).toLowerCase() as CharacteristicId]
    }

    if (effect.category === 'physical') return ['str', 'dex', 'end']
    if (effect.category === 'mental') return ['int', 'edu', 'soc']
    return [...characteristicOrder]
  }

  const addCharacteristicAdjustmentResolution = (effect: TravellerEventEffect, source: string, label = tableEffectLabel(effect)) => {
    const count = typeof effect.count === 'number' ? Math.max(1, effect.count) : 1
    const options = characteristicOptionsForEffect(effect)

    for (let index = 0; index < count; index += 1) {
      addPendingEventResolution({
        kind: 'characteristic_adjustment',
        label: count > 1 ? `${label} (${index + 1} of ${count})` : label,
        source,
        effect,
        characteristicOptions: options,
        characteristicAmount: typeof effect.amount === 'number' || typeof effect.amount === 'string' ? effect.amount : -1,
      })
    }
    recordEventOutcome(source, effect, label, 'pending')
  }

  const addMedicalCareResolution = (
    source: string,
    characteristicId: CharacteristicId,
    maxRestore: number,
    crisis = false,
  ) => {
    if (maxRestore <= 0) return

    const costPerPoint = agingData.injury.medicalCare.restoreCostPerCharacteristicPoint
    addPendingEventResolution({
      kind: 'medical_care',
      label: crisis
        ? `${characteristicId.toUpperCase()} has reached 0. Restore at least 1 point with medical care.`
        : `Optional medical care for ${characteristicId.toUpperCase()}`,
      source,
      effect: normalizeTravellerEventEffect({
        type: 'medical_care',
        characteristic: characteristicId,
        amount: maxRestore,
      }),
      medicalCharacteristic: characteristicId,
      medicalMaxRestore: maxRestore,
      medicalCostPerPoint: costPerPoint,
      medicalCrisis: crisis,
    })
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

  const addAssociateConversionResolution = (effect: TravellerEventEffect, source: string, label = tableEffectLabel(effect)) => {
    const fromTypes = Array.isArray(effect.from) ? effect.from.map(String) : ['contact', 'ally']
    const toTypes = Array.isArray(effect.to) ? effect.to.map(String) : ['rival', 'enemy']
    const convertibleAssociates = associates.value.filter((associate) => fromTypes.includes(associate.type))
    const conversionOptions = convertibleAssociates.flatMap((associate) => toTypes.map((toType) => ({
      label: `Convert ${associate.name} (${associateTypeLabel(associate.type)}) to ${associateTypeLabel(toType)}`,
      effects: [
        {
          type: 'convert_associate',
          associateId: associate.id,
          associateName: associate.name,
          fromType: associate.type,
          toType,
        },
      ],
    })))
    const gainOptions = toTypes.map((toType) => ({
      label: `Gain a new ${associateTypeLabel(toType)}`,
      effects: [
        {
          type: 'gain_associate',
          associateTypes: [toType],
          count: 1,
        },
      ],
    }))

    addChoiceResolution({
      ...effect,
      type: 'choice',
      options: [
        ...conversionOptions,
        ...gainOptions,
      ],
    }, source, label)
  }

  const addNarrativeEventResolution = (effect: TravellerEventEffect, source: string, event: TravellerEvent, label = tableEffectLabel(effect)) => {
    addPendingEventResolution({
      kind: 'narrative',
      label,
      source,
      effect: {
        ...effect,
        eventName: event.name,
        eventText: event.text,
      },
      details: typeof effect.prompt === 'string' ? effect.prompt : event.text,
    })
    recordEventOutcome(source, effect, label, 'pending')
  }

  const addSkillTableRollResolution = (effect: TravellerEventEffect, source: string, label = tableEffectLabel(effect)) => {
    const tableId = typeof effect.tableId === 'string' ? effect.tableId : ''
    const table = availableCareerSkillTables.value.find((item) => item.id === tableId)
    if (!table) {
      addManualEventResolution(effect, source, `${label} manually.`)
      return
    }

    addPendingEventResolution({
      kind: 'skill_table_roll',
      label: `${label}: ${table.label}`,
      source,
      effect,
      skillTableId: table.id,
      diceCount: 1,
    })
    recordEventOutcome(source, effect, `${label}: ${table.label}`, 'pending')
  }

  const addFreeSkillTableRollResolution = (effect: TravellerEventEffect, source: string, label = tableEffectLabel(effect)) => {
    const tableOptions = availableCareerSkillTables.value.map((table) => ({
      label: table.label,
      effects: [
        {
          type: 'skill_table_roll',
          tableId: table.id,
        },
      ],
    }))

    if (!tableOptions.length) {
      addManualEventResolution(effect, source, `${label} manually.`)
      return
    }

    addChoiceResolution({
      ...effect,
      type: 'choice',
      options: tableOptions,
    }, source, label)
  }

  const addBenefitWagerResolution = (effect: TravellerEventEffect, source: string, label = tableEffectLabel(effect)) => {
    const checks = Array.isArray(effect.checks) && effect.checks.length
      ? effect.checks
      : [{ skill: 'gambler', target: 8 }]
    const wagerChecks = checks
      .map((check) => check && typeof check === 'object' ? check as Record<string, unknown> : null)
      .filter((check): check is Record<string, unknown> => Boolean(check?.skill))
      .map((check) => {
        const skill = String(check.skill)
        const target = Number(check.target ?? 8)
        const characteristic = typeof check.characteristic === 'string'
          ? check.characteristic
          : defaultSkillCharacteristic(skill) ?? undefined
        return {
          label: `${skillOptionLabel(skill)}${characteristic ? ` + ${characteristic.toUpperCase()}` : ''} ${target}+`,
          skill,
          target,
          dm: skillCheckDm(skill, characteristic),
        }
      })

    if (!wagerChecks.length) {
      addManualEventResolution(effect, source, `${label} manually.`)
      return
    }

    addPendingEventResolution({
      kind: 'benefit_wager',
      label,
      source,
      effect,
      wagerChecks,
    })
    recordEventOutcome(source, effect, label, 'pending')
  }

  const grantPsionicsPermission = (source: string, label = 'May test PSI') => {
    const entry = `${source}: ${label}`
    if (!psionicsPermissionSources.value.includes(entry)) {
      psionicsPermissionSources.value = [...psionicsPermissionSources.value, entry]
    }
  }

  const applyEventEffect = (effect: TravellerEventEffect, event: TravellerEvent, sourcePrefix = 'Event') => {
    const source = `${sourcePrefix}: ${event.name}`
    const normalizedType = effect.normalizedType ?? effect.type

    if (effect.type.startsWith('possible_')) {
      addConditionalEffectResolution(effect, source)
      return
    }

    if (effect.type === 'check_any') {
      addCheckAnyChoiceResolution(effect, source)
      return
    }

    if (effect.type === 'assignment_skill_check') {
      addAssignmentSkillCheckResolution(effect, source)
      return
    }

    if (normalizedType === 'check') {
      addCheckResolution(effect, source)
      return
    }

    if (normalizedType === 'choice') {
      addChoiceResolution(effect, source)
      return
    }

    if (effect.type === 'convert_or_gain_associate') {
      addAssociateConversionResolution(effect, source)
      return
    }

    if (effect.type === 'convert_associate' && effect.associateId && effect.toType) {
      const label = tableEffectLabel(effect)
      let converted = false
      associates.value = associates.value.map((associate) => {
        if (associate.id !== effect.associateId) return associate
        converted = true
        return {
          ...associate,
          type: String(effect.toType),
          notes: [
            associate.notes,
            `Converted from ${associateTypeLabel(associate.type)} by ${source}`,
          ].filter(Boolean).join(' | '),
        }
      })

      if (converted) recordEventOutcome(source, effect, label)
      else addAssociateResolution({
        type: 'gain_associate',
        associateTypes: [String(effect.toType)],
        count: 1,
      }, source, label)
      return
    }

    if (effect.type === 'free_skill_table_roll') {
      addFreeSkillTableRollResolution(effect, source)
      return
    }

    if (effect.type === 'skill_table_roll') {
      addSkillTableRollResolution(effect, source)
      return
    }

    if (effect.type === 'wager_benefit_rolls') {
      addBenefitWagerResolution(effect, source)
      return
    }

    if (effect.type === 'narrative_event') {
      addNarrativeEventResolution(effect, source, event)
      return
    }

    if (effect.type === 'may_test_psi' || effect.type === 'may_test_psionic_strength') {
      const label = tableEffectLabel(effect)
      grantPsionicsPermission(source, label)
      recordEventOutcome(source, effect, label)
      return
    }

    if (effect.type === 'automatic_promotion') {
      applyAutomaticPromotion(source)
      return
    }

    if (effect.type === 'automatic_commission') {
      if (selectedCareerIsMilitary.value && !currentCareerIsOfficer.value) applyCareerCommission(source)
      else applyAutomaticPromotion(source)
      return
    }

    if (effect.type === 'automatic_next_promotion_or_commission') {
      const label = tableEffectLabel(effect)
      rollModifiers.value = [
        ...rollModifiers.value,
        {
          id: makeEventOutcomeId('automatic-promotion'),
          source,
          label,
          target: 'advancement',
          dm: 99,
          scope: 'next',
        },
        {
          id: makeEventOutcomeId('automatic-commission'),
          source,
          label,
          target: 'commission',
          dm: 99,
          scope: 'next',
        },
      ]
      recordEventOutcome(source, effect, label)
      return
    }

    if (effect.type === 'parole_threshold_change' && typeof effect.amount === 'number') {
      changePrisonerParoleThreshold(effect.amount, source)
      return
    }

    if (effect.type === 'parole_threshold_reroll') {
      prisonerParoleThreshold.value = null
      prisonerParoleThresholdRoll.value = null
      termRolls.prisonerParoleThreshold = null
      recordEventOutcome(source, effect, 'Re-roll Parole Threshold', 'manual')
      return
    }

    if (effect.type === 'leave_prisoner_career') {
      prisonerReleasedThisTerm.value = true
      recordEventOutcome(source, effect, 'Leaves Prisoner career', 'automatic')
      return
    }

    if (effect.type === 'lose_benefit_rolls_from_career' && effect.careerId === 'prisoner') {
      prisonerBenefitRollsLost.value = true
      benefitRollLedger.value = benefitRollLedger.value.map((entry) => entry.careerId === 'prisoner'
        ? { ...entry, count: 0, label: 'No benefit roll: lost Prisoner career benefits' }
        : entry)
      recordEventOutcome(source, effect, 'Lost all Prisoner benefit rolls', 'automatic')
      return
    }

    if (effect.type === 'choose_skill_or_contact') {
      const skillEffects = Array.isArray(effect.skills)
        ? effect.skills.map((skill) => ({
            label: `${skillOptionLabel(String(skill))} 1`,
            effects: [
              {
                type: 'set_skill',
                skillId: String(skill),
                level: typeof effect.level === 'number' ? effect.level : 1,
              },
            ],
          }))
        : []

      addChoiceResolution({
        ...effect,
        type: 'choice',
        options: [
          ...skillEffects,
          {
            label: effect.contactLabel && typeof effect.contactLabel === 'string'
              ? effect.contactLabel
              : 'Gain a Contact',
            effects: [
              {
                type: 'gain_associate',
                associateTypes: ['contact'],
                count: 1,
                context: typeof effect.context === 'string' ? effect.context : undefined,
              },
            ],
          },
        ],
      }, source, tableEffectLabel(effect))
      return
    }

    if (effect.type === 'science_speciality_levels') {
      const count = typeof effect.count === 'number' ? Math.max(1, effect.count) : 1
      for (let index = 0; index < count; index += 1) {
        addSkillChoiceResolution(
          effect,
          source,
          scienceSpecialityOptions.value,
          `Choose Science specialty increase (${index + 1} of ${count})`,
          undefined,
          true,
        )
      }
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
      if (effect.characteristic === 'psi') {
        changePsiScore(effect.amount)
        recordEventOutcome(source, effect)
        return
      }

      const characteristicId = effect.characteristic as CharacteristicId
      characteristicAdjustments[characteristicId] += effect.amount
      applyAssignedScores()
      recordEventOutcome(source, effect)
      return
    }

    if (normalizedType === 'characteristic_loss' || effect.type === 'choose_characteristic_change') {
      addCharacteristicAdjustmentResolution(effect, source)
      return
    }

    if ((effect.type === 'choose_skill_set' || effect.type === 'choose_skill_increase') && Array.isArray(effect.skills) && effect.skills.length) {
      addSkillChoiceResolution(
        effect,
        source,
        effect.skills.map(String),
        tableEffectLabel(effect),
        effect.type === 'choose_skill_set' ? (typeof effect.level === 'number' ? effect.level : 1) : undefined,
        effect.type === 'choose_skill_increase',
      )
      return
    }

    if (effect.type === 'choose_skill_increase') {
      const excludedSkills = Array.isArray(effect.excludedSkills) ? effect.excludedSkills.map(String) : []
      const options = generalSkillOptions.value.filter((skillId) => !excludedSkills.includes(skillId))
      addSkillChoiceResolution(
        effect,
        source,
        options,
        tableEffectLabel(effect),
        undefined,
        true,
      )
      return
    }

    if (effect.type === 'choose_skill') {
      const excludedSkills = Array.isArray(effect.excludedSkills) ? effect.excludedSkills.map(String) : []
      const options = generalSkillOptions.value.filter((skillId) => !excludedSkills.includes(skillId))
      addSkillChoiceResolution(
        effect,
        source,
        options,
        tableEffectLabel(effect),
        typeof effect.level === 'number' ? effect.level : 0,
      )
      return
    }

    if (effect.type === 'increase_existing_skill' || effect.type === 'increase_any_existing_skill') {
      addSkillChoiceResolution(
        effect,
        source,
        existingSkillOptions.value,
        tableEffectLabel(effect),
        undefined,
        true,
      )
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

    addManualEventResolution(effect, source, tableEffectLabel(effect))
  }

  const applyTravellerEventEffects = (event: TravellerEvent, sourcePrefix: string) => {
    resetEventResolutionState(event)
    const effects = event.effects
    for (let index = 0; index < effects.length; index += 1) {
      const effect = effects[index]
      const isBareCheck = (effect.normalizedType ?? effect.type) === 'check'
        && !effect.success
        && !effect.failure
        && !effect.always
        && !effect.naturalTwo
      const followingEffects = effects.slice(index + 1)

      if (isBareCheck && followingEffects.length) {
        applyEventEffect({
          ...effect,
          success: followingEffects,
        }, event, sourcePrefix)
        break
      }

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
      careerCommission: 'commission',
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
    const qualificationDm = key === 'careerQualification' ? currentCareerQualificationDm.value : 0
    const dm = checkDm(check) + modifierDm + qualificationDm
    const diceTotal = dice.reduce((sum, value) => sum + value, 0)
    const total = diceTotal + dm
    const target = rule.target
    const success = rule.automatic ? true : total >= target
    const appliedNotes = [
      matchingModifiers.length ? `Applied modifiers: ${matchingModifiers.map((modifier) => modifier.label).join(', ')}` : '',
      qualificationDm ? `Previous careers DM ${formatDm(qualificationDm)}` : '',
    ].filter(Boolean)
    const modifierNotes = appliedNotes.length ? appliedNotes.join('; ') : undefined

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
    if (key === 'careerAdvancement') previewCareerAdvancement()
  }

  const applyAutomaticCareerQualification = () => {
    const constraint = automaticCareerEntryConstraint.value
    if (!constraint || selectedTermPath.value !== 'career' || termRolls.careerQualification) return

    termRolls.careerQualification = {
      label: 'Qualification',
      dice: [],
      dm: 0,
      total: selectedCareer.value.qualification?.target ?? 0,
      target: selectedCareer.value.qualification?.target ?? 0,
      effect: 0,
      success: true,
      finalSuccess: true,
      source: 'rolled',
      notes: constraint.label,
    }
    recordEventOutcome(constraint.source, { type: 'automatic_career_entry' }, constraint.label)
  }

  watch([currentTermNumber, selectedTermPath, selectedCareerId, automaticCareerEntryConstraint], () => {
    applyAutomaticCareerQualification()
  }, { immediate: true })

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
    if (key === 'careerAdvancement') previewCareerAdvancement()
  }

  const setAutomaticCareerFallbackQualification = (source: string, previousCareerName: string) => {
    resetCareerProgressAfterQualification()
    termRolls.careerQualification = {
      label: 'Qualification',
      dice: [],
      dm: 0,
      total: selectedCareer.value.qualification?.target ?? 0,
      target: selectedCareer.value.qualification?.target ?? 0,
      effect: 0,
      success: true,
      finalSuccess: true,
      source: 'rolled',
      notes: `${source} after failed qualification for ${previousCareerName}`,
    }
  }

  const chooseDrifterFallback = () => {
    if (!drifterFallbackAvailable.value) return
    const previousCareerName = selectedCareer.value.name
    selectedCareerId.value = 'drifter'
    selectedAssignmentId.value = careersData.careers.find((career) => career.id === 'drifter')?.assignments[0]?.id ?? selectedAssignmentId.value
    setAutomaticCareerFallbackQualification('Drifter fallback', previousCareerName)
    recordEventOutcome('Qualification', { type: 'next_career', careerId: 'drifter' }, `Entered Drifter after failing qualification for ${previousCareerName}`, 'automatic')
  }

  const applyDraftFallback = (die: number, source: 'rolled' | 'manual') => {
    if (!draftFallbackAvailable.value || Number.isNaN(die) || die < 1 || die > 6) return
    const draftResult = draftTable.value.find((row) => row.roll === die)
    if (!draftResult) return

    const previousCareerName = selectedCareer.value.name
    draftUsed.value = true
    draftRoll.value = {
      dice: die,
      careerId: draftResult.careerId,
      assignmentId: draftResult.assignment === 'any' ? undefined : draftResult.assignment,
      source,
    }
    selectedCareerId.value = draftResult.careerId
    if (draftResult.assignment && draftResult.assignment !== 'any') selectedAssignmentId.value = draftResult.assignment
    else selectedAssignmentId.value = careersData.careers.find((career) => career.id === draftResult.careerId)?.assignments[0]?.id ?? selectedAssignmentId.value
    setAutomaticCareerFallbackQualification('Draft', previousCareerName)
    termRolls.draft = {
      label: 'Draft',
      dice: [die],
      dm: 0,
      total: die,
      target: 0,
      effect: 0,
      success: true,
      finalSuccess: true,
      source,
      notes: `Drafted into ${selectedCareer.value.name}`,
    }
    recordEventOutcome('Draft', { type: 'draft_assignment', careerId: draftResult.careerId, assignmentId: draftResult.assignment }, `Drafted into ${selectedCareer.value.name}`, 'automatic')
  }

  const rollDraftFallback = () => {
    applyDraftFallback(Math.ceil(Math.random() * 6), 'rolled')
  }

  const enterManualDraftFallback = () => {
    const manualTotal = manualRollTotals.draft
    if (manualTotal === null || Number.isNaN(manualTotal)) return
    applyDraftFallback(manualTotal, 'manual')
  }

  const rollSummary = (roll: RollResult) => {
    const diceText = roll.dice.length ? roll.dice.join(' + ') : 'Automatic'
    return `${diceText} ${formatDm(roll.dm)} = ${roll.total}`
  }

  const setPrisonerParoleThreshold = (die: number, source: 'rolled' | 'manual') => {
    if (Number.isNaN(die) || die < 1 || die > 6) return
    const total = Math.min(12, die + 2)
    prisonerParoleThreshold.value = total
    prisonerParoleThresholdRoll.value = { dice: die, total, source }
    termRolls.prisonerParoleThreshold = {
      label: 'Parole Threshold',
      dice: [die],
      dm: 2,
      total,
      target: 0,
      effect: 0,
      success: true,
      finalSuccess: true,
      source,
      notes: `Parole Threshold ${total}`,
    }
    recordEventOutcome('Prisoner', { type: 'parole_threshold_set' }, `Parole Threshold ${total}`, 'manual')
  }

  const rollPrisonerParoleThreshold = () => {
    setPrisonerParoleThreshold(Math.ceil(Math.random() * 6), 'rolled')
  }

  const enterManualPrisonerParoleThreshold = () => {
    const manualTotal = manualRollTotals.prisonerParoleThreshold
    if (manualTotal === null || Number.isNaN(manualTotal)) return
    setPrisonerParoleThreshold(manualTotal, 'manual')
  }

  const changePrisonerParoleThreshold = (amount: number, source: string) => {
    const current = prisonerParoleThreshold.value ?? 0
    prisonerParoleThreshold.value = Math.max(0, Math.min(12, current + amount))
    recordEventOutcome(source, { type: 'parole_threshold_change', amount }, `Parole Threshold ${amount >= 0 ? '+' : ''}${amount} = ${prisonerParoleThreshold.value}`, 'automatic')
  }

  const makeCareerSkillRoll = (
    die: number,
    source: 'rolled' | 'manual',
    key = 'careerSkill',
    tableId = selectedCareerSkillTableId.value,
    entries = selectedCareerSkillEntries.value,
    trainingSource = 'Career Training',
  ) => {
    const result = entries[die - 1]
    if (!result) return

    pendingSkillChoice.value = null
    if (key === 'careerSkill') careerSkillResult.value = result
    termRolls[key] = {
      label: `${skillTableLabel(tableId)} Skill`,
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
    applyTrainingResult(result, trainingSource)
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

  const rollAdvancementSkillTable = () => {
    makeCareerSkillRoll(
      Math.ceil(Math.random() * 6),
      'rolled',
      'careerAdvancementSkill',
      selectedAdvancementSkillTableId.value,
      selectedAdvancementSkillEntries.value,
      'Advancement Training',
    )
  }

  const enterManualAdvancementSkillTable = () => {
    const manualTotal = manualRollTotals.careerAdvancementSkill
    if (manualTotal === null || Number.isNaN(manualTotal)) return
    if (manualTotal < 1 || manualTotal > 6) return
    makeCareerSkillRoll(
      manualTotal,
      'manual',
      'careerAdvancementSkill',
      selectedAdvancementSkillTableId.value,
      selectedAdvancementSkillEntries.value,
      'Advancement Training',
    )
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
        details: nestedEvent.text,
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

  const resolveEventNarrative = (resolutionId: string, notes = '') => {
    const resolution = pendingEventResolutions.value.find((item) => item.id === resolutionId)
    if (!resolution || resolution.kind !== 'narrative' || resolution.resolved) return

    const trimmedNotes = notes.trim()
    const title = typeof resolution.effect.eventName === 'string'
      ? resolution.effect.eventName
      : resolution.label
    const text = typeof resolution.effect.eventText === 'string'
      ? resolution.effect.eventText
      : undefined
    const category = typeof resolution.effect.category === 'string'
      ? resolution.effect.category
      : undefined

    narrativeEvents.value = [
      ...narrativeEvents.value,
      {
        id: makeEventOutcomeId('narrative'),
        source: resolution.source,
        title,
        category,
        text,
        notes: trimmedNotes || undefined,
      },
    ]

    pendingEventResolutions.value = pendingEventResolutions.value.map((item) => {
      if (item.id !== resolutionId) return item
      return {
        ...item,
        resolved: true,
        selected: trimmedNotes || 'Recorded',
      }
    })
    recordEventOutcome(resolution.source, resolution.effect, `${resolution.label}: ${title}`, 'manual')
  }

  const resolveEventSkillTableRoll = (resolution: PendingEventResolution, die: number, source: 'rolled' | 'manual') => {
    if (resolution.kind !== 'skill_table_roll' || !resolution.skillTableId || resolution.resolved) return
    if (die < 1 || die > 6) return

    const table = availableCareerSkillTables.value.find((item) => item.id === resolution.skillTableId)
    const result = table?.entries[die - 1]
    if (!table || !result) return

    applyTrainingResult(result, resolution.source)
    pendingEventResolutions.value = pendingEventResolutions.value.map((item) => {
      if (item.id !== resolution.id) return item
      return {
        ...item,
        resolved: true,
        selected: `${die} (${source}): ${result}`,
      }
    })
    recordEventOutcome(resolution.source, resolution.effect, `${resolution.label}: ${die} = ${result}`, 'manual')
  }

  const rollEventResolutionSkillTable = (resolutionId: string) => {
    const resolution = pendingEventResolutions.value.find((item) => item.id === resolutionId)
    if (!resolution || resolution.kind !== 'skill_table_roll') return

    resolveEventSkillTableRoll(resolution, Math.ceil(Math.random() * 6), 'rolled')
  }

  const enterManualEventResolutionSkillTable = (resolutionId: string, die: number) => {
    const resolution = pendingEventResolutions.value.find((item) => item.id === resolutionId)
    if (!resolution || resolution.kind !== 'skill_table_roll') return
    if (Number.isNaN(die) || die < 1 || die > 6) return

    resolveEventSkillTableRoll(resolution, die, 'manual')
  }

  const resolveEventBenefitWager = (
    resolutionId: string,
    skill: string,
    wagered: number,
    diceTotal: number,
    source: 'rolled' | 'manual',
  ) => {
    const resolution = pendingEventResolutions.value.find((item) => item.id === resolutionId)
    if (!resolution || resolution.kind !== 'benefit_wager' || resolution.resolved) return
    if (Number.isNaN(wagered) || wagered < 1) return
    if (Number.isNaN(diceTotal) || diceTotal < 2 || diceTotal > 12) return

    const check = resolution.wagerChecks?.find((item) => item.skill === skill) ?? resolution.wagerChecks?.[0]
    if (!check) return

    const finalTotal = diceTotal + check.dm
    const succeeded = finalTotal >= check.target
    const adjustment = succeeded ? Math.ceil(wagered / 2) : -wagered
    const selected = `${wagered} wagered; ${diceTotal} ${formatDm(check.dm)} = ${finalTotal} (${succeeded ? 'success' : 'failure'}, ${source})`

    benefitRollAdjustments.value = [
      ...benefitRollAdjustments.value,
      {
        id: makeEventOutcomeId('benefit-wager'),
        source: resolution.source,
        label: `${resolution.label}: ${selected}`,
        adjustment,
        scope: 'career',
      },
    ]

    if (resolution.effect.increaseUsedSkill !== false) {
      increaseSkill(check.skill, resolution.source)
    }

    pendingEventResolutions.value = pendingEventResolutions.value.map((item) => {
      if (item.id !== resolutionId) return item
      return {
        ...item,
        resolved: true,
        selected,
      }
    })
    recordEventOutcome(resolution.source, resolution.effect, `${resolution.label}: ${selected}`, 'manual')
  }

  const rollEventResolutionBenefitWager = (resolutionId: string, skill: string, wagered: number) => {
    resolveEventBenefitWager(
      resolutionId,
      skill,
      wagered,
      Math.ceil(Math.random() * 6) + Math.ceil(Math.random() * 6),
      'rolled',
    )
  }

  const enterManualEventResolutionBenefitWager = (resolutionId: string, skill: string, wagered: number, total: number) => {
    resolveEventBenefitWager(resolutionId, skill, wagered, total, 'manual')
  }

  const declineEventResolutionBenefitWager = (resolutionId: string) => {
    const resolution = pendingEventResolutions.value.find((item) => item.id === resolutionId)
    if (!resolution || resolution.kind !== 'benefit_wager' || resolution.resolved) return

    pendingEventResolutions.value = pendingEventResolutions.value.map((item) => {
      if (item.id !== resolutionId) return item
      return {
        ...item,
        resolved: true,
        selected: 'No wager',
      }
    })
    recordEventOutcome(resolution.source, resolution.effect, `${resolution.label}: No wager`, 'manual')
  }

  const chargePsionicsTest = () => {
    if (psionicsTestCharged.value) return
    psionicsTrainingCost.value += 5000
    psionicsTestCharged.value = true
  }

  const chargePsionicsTraining = () => {
    if (psionicsTrainingCharged.value) return
    psionicsTrainingCost.value += 100000
    psionicsTrainingCharged.value = true
  }

  const resolvePsiTest = (diceTotal: number, source: 'rolled' | 'manual') => {
    if (!psionicsTestingAvailable.value || psiTested.value) return
    if (Number.isNaN(diceTotal) || diceTotal < 2 || diceTotal > 12) return

    chargePsionicsTest()
    const score = Math.max(0, diceTotal - psiTermsServed.value)
    psiScore.value = score
    psiTestRoll.value = {
      label: 'PSI Test',
      dice: [diceTotal],
      dm: -psiTermsServed.value,
      total: score,
      target: 1,
      effect: score - 1,
      success: score > 0,
      finalSuccess: score > 0,
      source,
      notes: `${diceTotal} ${formatDm(-psiTermsServed.value)} = PSI ${score}`,
    }
    recordEventOutcome('Psionics', { type: 'psi_test' }, `PSI ${score}`, 'manual')
  }

  const rollPsiTest = () => {
    resolvePsiTest(roll2D(), 'rolled')
  }

  const enterManualPsiTest = (total: number) => {
    resolvePsiTest(total, 'manual')
  }

  const psionicTalentAttemptDm = (talent: PsionicTalent) => {
    return psiDm.value + talent.learningDm - psionicTalentChecksAttempted.value
  }

  const resolvePsionicTalentAttempt = (talentId: string, diceTotal: number, source: 'rolled' | 'manual') => {
    if (!psionicsTrainingAvailable.value) return
    if (Number.isNaN(diceTotal) || diceTotal < 2 || diceTotal > 12) return
    const talent = psionicTalents.find((item) => item.id === talentId)
    if (!talent || learnedPsionicTalentIds.value.has(talent.id)) return

    chargePsionicsTraining()
    const attemptDm = -psionicTalentChecksAttempted.value
    const dm = psiDm.value + talent.learningDm + attemptDm
    const total = diceTotal + dm
    const success = total >= 8
    if (success) setSkillMinimum(talent.id, 0, 'Psionics Training')

    psionicTalentAttempts.value = [
      ...psionicTalentAttempts.value,
      {
        id: makeEventOutcomeId('psionic-talent'),
        talentId: talent.id,
        talentName: talent.name,
        dice: [diceTotal],
        psiDm: psiDm.value,
        learningDm: talent.learningDm,
        attemptDm,
        total,
        target: 8,
        success,
        source,
      },
    ]
    recordEventOutcome('Psionics Training', { type: 'psionic_talent', talentId: talent.id }, `${talent.name}: ${success ? 'learned' : 'not learned'}`, 'manual')
  }

  const learnPsionicTalentAutomatically = (talentId: string) => {
    if (!psionicsTrainingAvailable.value) return
    const talent = psionicTalents.find((item) => item.id === talentId)
    if (!talent || talent.id !== 'telepathy' || learnedPsionicTalentIds.value.has(talent.id) || psionicTalentAttempts.value.length) return

    chargePsionicsTraining()
    setSkillMinimum(talent.id, 0, 'Psionics Training')
    psionicTalentAttempts.value = [
      ...psionicTalentAttempts.value,
      {
        id: makeEventOutcomeId('psionic-talent'),
        talentId: talent.id,
        talentName: talent.name,
        dice: [],
        psiDm: psiDm.value,
        learningDm: talent.learningDm,
        attemptDm: 0,
        total: 0,
        target: 0,
        success: true,
        source: 'automatic',
      },
    ]
    recordEventOutcome('Psionics Training', { type: 'psionic_talent', talentId: talent.id }, 'Telepathy learned automatically', 'manual')
  }

  const rollPsionicTalent = (talentId: string) => {
    resolvePsionicTalentAttempt(talentId, roll2D(), 'rolled')
  }

  const enterManualPsionicTalent = (talentId: string, total: number) => {
    resolvePsionicTalentAttempt(talentId, total, 'manual')
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

  const resolveEventCharacteristicAdjustment = (resolutionId: string, characteristicId: CharacteristicId, amountValue?: number) => {
    const resolution = pendingEventResolutions.value.find((item) => item.id === resolutionId)
    if (!resolution || resolution.resolved || resolution.kind !== 'characteristic_adjustment') return
    if (!resolution.characteristicOptions?.includes(characteristicId)) return

    const rawAmount = resolution.characteristicAmount ?? -1
    let amount = typeof rawAmount === 'number' ? rawAmount : Number.NaN
    if (typeof rawAmount === 'string') {
      if (/^-?1D$/i.test(rawAmount)) {
        const dieAmount = typeof amountValue === 'number' && !Number.isNaN(amountValue)
          ? Math.max(1, Math.min(6, amountValue))
          : Math.ceil(Math.random() * 6)
        amount = rawAmount.startsWith('-') ? -dieAmount : dieAmount
      } else {
        amount = Number(rawAmount)
      }
    }
    if (Number.isNaN(amount)) return

    characteristicAdjustments[characteristicId] += amount
    applyAssignedScores()
    const adjustedValue = values[characteristicId]

    const selected = `${characteristicId.toUpperCase()} ${formatDm(amount)}`
    pendingEventResolutions.value = pendingEventResolutions.value.map((item) => {
      if (item.id !== resolutionId) return item
      return {
        ...item,
        resolved: true,
        selected,
      }
    })

    recordEventOutcome(resolution.source, resolution.effect, `${resolution.label}: ${selected}`, 'manual')

    if (amount < 0) {
      const restoreMinimum = adjustedValue <= 0 ? 1 - adjustedValue : 0
      const maxRestore = Math.abs(amount)
      addMedicalCareResolution(resolution.source, characteristicId, Math.max(restoreMinimum, maxRestore), adjustedValue <= 0)
    }
  }

  const resolveEventMedicalCare = (resolutionId: string, restorePoints: number) => {
    const resolution = pendingEventResolutions.value.find((item) => item.id === resolutionId)
    if (!resolution || resolution.resolved || resolution.kind !== 'medical_care' || !resolution.medicalCharacteristic) return

    const maxRestore = resolution.medicalMaxRestore ?? 0
    const minimumRestore = resolution.medicalCrisis ? 1 : 0
    const restore = Math.max(minimumRestore, Math.min(maxRestore, Number.isNaN(restorePoints) ? 0 : restorePoints))
    const costPerPoint = resolution.medicalCostPerPoint ?? agingData.injury.medicalCare.restoreCostPerCharacteristicPoint
    const cost = restore * costPerPoint

    if (restore > 0) {
      characteristicAdjustments[resolution.medicalCharacteristic] += restore
      applyAssignedScores()
      medicalDebt.value += cost
      medicalCareLog.value = [
        ...medicalCareLog.value,
        {
          id: makeEventOutcomeId('medical-care'),
          source: resolution.source,
          characteristic: resolution.medicalCharacteristic,
          restored: restore,
          cost,
          crisis: resolution.medicalCrisis,
        },
      ]
    }

    const selected = restore > 0
      ? `Restored ${resolution.medicalCharacteristic.toUpperCase()} +${restore}; debt ${cost.toLocaleString()} Cr`
      : 'Declined medical care'

    pendingEventResolutions.value = pendingEventResolutions.value.map((item) => {
      if (item.id !== resolutionId) return item
      return {
        ...item,
        resolved: true,
        selected,
      }
    })

    recordEventOutcome(resolution.source, resolution.effect, selected, 'manual')
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
    draftRoll.value = null
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

  const agingTableEffects = () => {
    const roll = termRolls.aging
    if (!roll) return []

    const table = (agingData.aging.table as Array<Record<string, any>>).find((row) => {
      if ('total' in row && row.total === roll.total) return true
      if ('totalMax' in row && roll.total <= row.totalMax) return true
      if ('totalMin' in row && roll.total >= row.totalMin) return true
      return false
    })

    return (table?.effects ?? []) as TravellerEventEffect[]
  }

  const applyAgingEffects = () => {
    pendingEventResolutions.value = pendingEventResolutions.value.filter((resolution) => resolution.source !== 'Aging')
    const effects = agingTableEffects()
    if (!effects.length) return

    for (const effect of effects) {
      addCharacteristicAdjustmentResolution(
        normalizeTravellerEventEffect({
          type: 'injury_characteristic_loss',
          ...effect,
        }),
        'Aging',
        `Aging: reduce ${effect.category ?? effect.characteristic ?? 'characteristic'} by ${effect.amount}`,
      )
    }
  }

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
    applyAgingEffects()
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
    applyAgingEffects()
  }

  const canCompleteTerm = computed(() => {
    if (lifepathComplete.value) return false
    if (agingRequired.value && !termRolls.aging) return false
    if (pendingEventResolutions.value.some((resolution) => !resolution.resolved)) return false

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
    if (prisonerParoleThresholdRequired.value) return false
    if (basicTrainingRequired.value && !basicTrainingApplied.value) return false
    if (!termRolls.careerSkill || pendingSkillChoice.value) return false
    if (!termRolls.careerSurvival) return false
    if (!termRolls.careerSurvival.finalSuccess && !termRolls.careerMishap) return false
    if (selectedCareerId.value === 'prisoner') return Boolean(termRolls.careerAdvancement)
    if (!termRolls.careerSurvival.finalSuccess) return true
    if (!termRolls.careerEvent) return false
    if (automaticCommissionConstraint.value) return true
    if (termRolls.careerCommission?.finalSuccess) return true
    if (!termRolls.careerAdvancement) return false
    if (termRolls.careerAdvancement.finalSuccess && !termRolls.careerAdvancementSkill) return false
    return true
  })
  const termCompletionBlockers = computed(() => {
    const blockers: string[] = []
    if (lifepathComplete.value) return blockers
    if (agingRequired.value && !termRolls.aging) blockers.push('Resolve the aging roll.')
    if (pendingEventResolutions.value.some((resolution) => !resolution.resolved)) blockers.push('Resolve pending event choices.')

    if (selectedTermPath.value === 'education') {
      if (!educationAvailable.value) blockers.push('Pre-career education is no longer available.')
      if (!termRolls.educationEntry) blockers.push('Resolve education entry.')
      else if (!termRolls.educationEntry.finalSuccess) blockers.push('Education entry failed; attempt a career this term.')
      if (!educationSkillsApplied.value) blockers.push('Apply education skills.')
      if (!termRolls.educationEvent) blockers.push('Roll the pre-career event.')
      if (!termRolls.educationGraduation) blockers.push('Resolve graduation.')
      return blockers
    }

    if (!termRolls.careerQualification) blockers.push('Resolve career qualification.')
    else if (!termRolls.careerQualification.finalSuccess) blockers.push('Qualification failed; choose Draft or Drifter fallback.')
    if (prisonerParoleThresholdRequired.value) blockers.push('Roll the Prisoner parole threshold.')
    if (basicTrainingRequired.value && !basicTrainingApplied.value) {
      blockers.push(pendingBasicTrainingChoices.value.some((choice) => !choice.selected)
        ? 'Resolve basic training choices.'
        : 'Apply basic training.')
    }
    if (!termRolls.careerSkill) blockers.push('Roll this term\'s career skill.')
    if (pendingSkillChoice.value) blockers.push('Resolve the pending skill choice.')
    if (!termRolls.careerSurvival) blockers.push('Resolve survival.')
    if (termRolls.careerSurvival?.finalSuccess === false && !termRolls.careerMishap) blockers.push('Roll the mishap.')

    if (selectedCareerId.value === 'prisoner') {
      if (!termRolls.careerAdvancement) blockers.push('Resolve Prisoner advancement/parole.')
      return blockers
    }

    if (termRolls.careerSurvival?.finalSuccess) {
      if (!termRolls.careerEvent) blockers.push('Roll the career event.')
      if (
        termRolls.careerEvent
        && !pendingEventResolutions.value.some((resolution) => !resolution.resolved)
        && !automaticCommissionConstraint.value
        && !termRolls.careerCommission?.finalSuccess
        && !termRolls.careerAdvancement
      ) blockers.push('Resolve advancement.')
      if (termRolls.careerAdvancement?.finalSuccess && !termRolls.careerAdvancementSkill) blockers.push('Roll the advancement skill.')
    }

    return blockers
  })
  const canAddTermTab = computed(() => {
    if (lifepathComplete.value) return false
    if (activeCreatorTab.value === 'creation') return setupComplete.value
    if (activeCreatorTab.value !== currentTermTabId.value) return false
    return canCompleteTerm.value
  })
  const nextTermButtonLabel = computed(() => {
    if (activeCreatorTab.value === 'creation') return 'Start Term 1'
    return `Start Term ${currentTermNumber.value + 1}`
  })

  const selectTermTab = (termNumber: number) => {
    if (termNumber === 1 && !setupComplete.value) return
    activeCreatorTab.value = `term-${termNumber}` as CreatorTab
  }

  const addTermTab = () => {
    if (activeCreatorTab.value === 'creation') {
      if (!setupComplete.value) return
      activeCreatorTab.value = 'term-1'
      return
    }

    if (!canCompleteTerm.value || activeCreatorTab.value !== currentTermTabId.value) return
    completeCurrentTerm()
  }

  const buildTermHistoryDetails = (advancement?: AdvancementResult | null) => {
    const details: string[] = []

    if (selectedTermPath.value === 'education') {
      details.push(`Path: ${selectedEducationOption.value.name}`)
      if (preCareerEvent.value) details.push(`Event: ${preCareerEvent.value.name}`)
      if (termRolls.educationGraduation) {
        details.push(termRolls.educationGraduation.finalSuccess
          ? educationGraduationHonours.value ? 'Graduated with honours' : 'Graduated successfully'
          : 'Did not graduate')
      }
      if (educationSkillsApplied.value) details.push('Education skills applied')
      return details
    }

    details.push(`Career: ${selectedCareer.value.name} - ${selectedAssignment.value.name}`)
    if (termRolls.careerQualification) {
      details.push(`Qualification: ${termRolls.careerQualification.finalSuccess ? 'qualified' : 'failed'}`)
      if (termRolls.careerQualification.notes) details.push(termRolls.careerQualification.notes)
    }
    if (termRolls.draft) details.push(`Draft result: ${termRolls.draft.notes}`)
    if (careerSkillResult.value) details.push(`Skill training: ${careerSkillResult.value}`)
    if (termRolls.careerSurvival) {
      details.push(`Survival: ${termRolls.careerSurvival.finalSuccess ? 'survived' : 'mishap'}`)
    }
    if (careerMishap.value) details.push(`Mishap: ${careerMishap.value.name}`)
    if (careerEvent.value) details.push(`Event: ${careerEvent.value.name}`)
    if (automaticCommissionConstraint.value) details.push('Commissioned automatically')
    if (termRolls.careerCommission) {
      details.push(termRolls.careerCommission.finalSuccess ? 'Commissioned as officer rank 1' : 'Commission failed')
    }
    if (termRolls.careerAdvancement) {
      details.push(advancement?.success
        ? `Advanced to ${advancement?.newTitle ?? 'next rank'}`
        : 'No advancement')
      const advancementDiceTotal = termRolls.careerAdvancement.dice.reduce((sum, value) => sum + value, 0)
      const termsSpentIncludingCurrent = careerTermsCompleted.value + 1
      if (advancementDiceTotal === 12) details.push('Natural 12: must continue this career')
      else if (termRolls.careerAdvancement.total <= termsSpentIncludingCurrent) details.push('Advancement total means this career cannot continue next term')
    }
    if (advancement?.bonus) details.push(`Rank bonus: ${advancement.bonus}`)
    if (selectedCareerId.value === 'prisoner' && prisonerParoleThreshold.value !== null) {
      details.push(`Parole Threshold: ${prisonerParoleThreshold.value}`)
    }

    return details
  }

  const nextTermConstraintDetails = () => {
    return careerConstraints.value
      .filter((constraint) => !constraint.used && constraint.appliesTermNumber === currentTermNumber.value + 1)
      .map((constraint) => {
        if (constraint.effectType === 'forced_out') return `Next term: forced out of ${selectedCareer.value.name}`
        if (constraint.effectType === 'cannot_continue_career') return `Next term: cannot continue ${selectedCareer.value.name}`
        if (constraint.effectType === 'natural_12_continue') return `Next term: must continue ${selectedCareer.value.name}`
        if (constraint.effectType === 'automatic_career_entry') return `Next term: ${constraint.label}`
        if (constraint.effectType === 'automatic_commission') return `Next term: ${constraint.label}`
        if (constraint.effectType === 'next_career' && constraint.careerId) return `Next term: ${constraint.label}`
        if (constraint.effectType === 'draft_next_term') return 'Next term: must roll for the Draft'
        return `Next term: ${constraint.label}`
      })
  }

  const currentTermConstraintExists = (effectType: string, careerId = selectedCareerId.value) => {
    return careerConstraints.value.some((constraint) => {
      return constraint.appliesTermNumber === currentTermNumber.value + 1
        && constraint.effectType === effectType
        && (!constraint.careerId || constraint.careerId === careerId)
    })
  }

  const applyGenericMishapEjection = () => {
    if (selectedTermPath.value !== 'career') return
    if (selectedCareerId.value === 'prisoner') return
    if (termRolls.careerSurvival?.finalSuccess !== false) return
    if (currentTermConstraintExists('not_forced_out')) return
    if (currentTermConstraintExists('forced_out')) return

    careerConstraints.value = [
      ...careerConstraints.value,
      {
        id: makeEventOutcomeId('career-constraint'),
        source: 'Mishap',
        label: `Forced out of ${selectedCareer.value.name} after mishap`,
        effectType: 'forced_out',
        appliesTermNumber: currentTermNumber.value + 1,
        careerId: selectedCareerId.value,
        forcedOut: true,
      },
    ]
  }

  const applyNaturalTwelveContinuation = () => {
    const roll = termRolls.careerAdvancement
    if (selectedTermPath.value !== 'career' || !roll) return
    const diceTotal = roll.dice.reduce((sum, value) => sum + value, 0)
    if (diceTotal !== 12 || currentTermConstraintExists('natural_12_continue')) return

    careerConstraints.value = [
      ...careerConstraints.value,
      {
        id: makeEventOutcomeId('career-constraint'),
        source: 'Advancement',
        label: `Natural 12: must continue ${selectedCareer.value.name}`,
        effectType: 'natural_12_continue',
        appliesTermNumber: currentTermNumber.value + 1,
        careerId: selectedCareerId.value,
        assignmentId: selectedAssignmentId.value,
      },
    ]
  }

  const applyAdvancementContinuationFailure = () => {
    const roll = termRolls.careerAdvancement
    if (selectedTermPath.value !== 'career' || !roll) return
    if (selectedCareerId.value === 'prisoner') return
    const diceTotal = roll.dice.reduce((sum, value) => sum + value, 0)
    if (diceTotal === 12) return
    const termsSpentIncludingCurrent = careerTermsCompleted.value + 1
    if (roll.total > termsSpentIncludingCurrent || currentTermConstraintExists('cannot_continue_career')) return

    careerConstraints.value = [
      ...careerConstraints.value,
      {
        id: makeEventOutcomeId('career-constraint'),
        source: 'Advancement',
        label: `Advancement total ${roll.total} <= ${termsSpentIncludingCurrent} terms: cannot continue ${selectedCareer.value.name}`,
        effectType: 'cannot_continue_career',
        appliesTermNumber: currentTermNumber.value + 1,
        careerId: selectedCareerId.value,
      },
    ]
  }

  const completeCurrentTerm = () => {
    if (!canCompleteTerm.value) return

    const rolls = Object.values(termRolls).filter((roll): roll is RollResult => Boolean(roll))
    if (selectedTermPath.value === 'education') applyEducationGraduationBenefits()
    if (selectedTermPath.value === 'career' && automaticCommissionConstraint.value) applyCareerCommission(automaticCommissionConstraint.value.label)
    if (selectedTermPath.value === 'career' && termRolls.careerCommission?.finalSuccess) applyCareerCommission('Commission Roll')
    applyGenericMishapEjection()
    applyNaturalTwelveContinuation()
    applyAdvancementContinuationFailure()
    const advancement = applyCareerAdvancement()

    if (selectedTermPath.value === 'career') {
      const lostPrisonerBenefits = selectedCareerId.value === 'prisoner' && prisonerBenefitRollsLost.value
      const earnedBenefitRoll = termRolls.careerSurvival?.finalSuccess && !lostPrisonerBenefits ? 1 : 0
      benefitRollLedger.value = [
        ...benefitRollLedger.value,
        {
          id: makeEventOutcomeId('benefit-roll'),
          termNumber: currentTermNumber.value,
          source: `${selectedCareer.value.name} - ${selectedAssignment.value.name}`,
          label: earnedBenefitRoll
            ? 'Completed career term'
            : lostPrisonerBenefits
              ? 'No benefit roll: lost Prisoner career benefits'
              : 'No benefit roll: mishap term',
          count: earnedBenefitRoll,
          careerId: selectedCareerId.value,
        },
      ]
    }

    if (selectedTermPath.value === 'career' && selectedCareerId.value === 'prisoner') {
      const releasedByParole = Boolean(
        prisonerParoleThreshold.value !== null
        && termRolls.careerAdvancement
        && termRolls.careerAdvancement.total > prisonerParoleThreshold.value,
      )

      if (releasedByParole || prisonerReleasedThisTerm.value) {
        recordEventOutcome('Prisoner', { type: 'leave_prisoner_career' }, 'Released from Prisoner career', 'automatic')
        prisonerParoleThreshold.value = null
        prisonerParoleThresholdRoll.value = null
      } else {
        careerConstraints.value = [
          ...careerConstraints.value,
          {
            id: makeEventOutcomeId('career-constraint'),
            source: 'Prisoner Parole',
            label: `Remain in Prisoner career: advancement total ${termRolls.careerAdvancement?.total ?? 0} did not exceed Parole Threshold ${prisonerParoleThreshold.value ?? 0}`,
            effectType: 'next_career',
            appliesTermNumber: currentTermNumber.value + 1,
            careerId: 'prisoner',
          },
        ]
      }
    }

    const summary = selectedTermPath.value === 'education'
      ? `${selectedEducationOption.value.name}${termRolls.educationGraduation?.finalSuccess ? educationGraduationHonours.value ? ' honours graduate' : ' graduate' : ' incomplete'}`
      : `${selectedCareer.value.name} - ${selectedAssignment.value.name}${termRolls.careerSurvival?.finalSuccess ? '' : ' mishap'}`
    const details = [
      ...buildTermHistoryDetails(advancement),
      ...nextTermConstraintDetails(),
    ]

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
        details,
        rolls,
      },
    ]

    careerConstraints.value = careerConstraints.value.map((constraint) => {
      if (constraint.used || constraint.appliesTermNumber > currentTermNumber.value) return constraint
      if (constraint.effectType !== 'next_career' && constraint.effectType !== 'draft_assignment' && constraint.effectType !== 'draft_next_term' && constraint.effectType !== 'automatic_career_entry' && constraint.effectType !== 'automatic_commission' && constraint.effectType !== 'natural_12_continue' && constraint.effectType !== 'cannot_continue_career') return constraint
      return { ...constraint, used: true }
    })

    currentTermNumber.value += 1
    resetTermRolls()
    prisonerReleasedThisTerm.value = false
    activeCreatorTab.value = `term-${currentTermNumber.value}` as CreatorTab
  }

  const musterOut = () => {
    lifepathComplete.value = true
    selectedMusteringCareerId.value = musteringCareerOptions.value[0]?.id ?? ''
  }

  const totalBenefitRollsEarned = computed(() => benefitRollLedger.value.reduce((sum, entry) => sum + entry.count, 0))
  const totalBenefitRollAdjustments = computed(() => benefitRollAdjustments.value.reduce((sum, adjustment) => sum + adjustment.adjustment, 0))
  const totalAvailableBenefitRolls = computed(() => Math.max(0, totalBenefitRollsEarned.value + totalBenefitRollAdjustments.value))
  const spentBenefitRolls = computed(() => musteringOutResults.value.length)
  const remainingBenefitRolls = computed(() => Math.max(0, totalAvailableBenefitRolls.value - spentBenefitRolls.value))
  const cashRollsUsed = computed(() => musteringOutResults.value.filter((result) => result.rollType === 'cash').length)
  const cashRollLimit = creationRulesData.benefits.cashRollMaximumAcrossAllCareers
  const canRollMusteringOut = computed(() => {
    if (!lifepathComplete.value) return false
    if (!selectedMusteringCareerId.value) return false
    if (remainingBenefitRolls.value <= 0) return false
    if (selectedMusteringRollType.value === 'cash' && cashRollsUsed.value >= cashRollLimit) return false
    return Boolean(selectedMusteringCareerBenefits.value.length)
  })
  const musteringCareerOptions = computed(() => {
    const careerIds = Array.from(new Set(benefitRollLedger.value
      .filter((entry) => entry.careerId && entry.count > 0)
      .map((entry) => entry.careerId as string)))

    return careerIds.map((careerId) => {
      const career = careersData.careers.find((item) => item.id === careerId)
      return {
        id: careerId,
        name: career?.name ?? careerId,
        rolls: benefitRollLedger.value
          .filter((entry) => entry.careerId === careerId)
          .reduce((sum, entry) => sum + entry.count, 0),
      }
    })
  })
  const selectedMusteringCareer = computed(() => musteringCareerOptions.value.find((career) => career.id === selectedMusteringCareerId.value) ?? musteringCareerOptions.value[0] ?? null)
  const selectedMusteringCareerBenefits = computed(() => {
    if (!selectedMusteringCareer.value) return []
    return ((careerTablesData.careers as Record<string, any>)[selectedMusteringCareer.value.id]?.benefits ?? []) as Array<{ roll: number; cash: number; benefit: string }>
  })

  watch(musteringCareerOptions, (options) => {
    if (!options.length) {
      selectedMusteringCareerId.value = ''
      return
    }

    if (!options.some((option) => option.id === selectedMusteringCareerId.value)) {
      selectedMusteringCareerId.value = options[0].id
    }
  }, { immediate: true })

  const activeBenefitRollModifiers = () => rollModifiers.value.filter((modifier) => {
    if (modifier.used) return false
    return modifier.target === 'benefit' || modifier.target === 'any'
  })

  const consumeBenefitRollModifiers = (modifiers: TravellerRollModifier[]) => {
    const consumedIds = modifiers
      .filter((modifier) => modifier.scope === 'one' || modifier.scope === 'next')
      .map((modifier) => modifier.id)

    if (!consumedIds.length) return

    rollModifiers.value = rollModifiers.value.map((modifier) => consumedIds.includes(modifier.id)
      ? { ...modifier, used: true }
      : modifier)
  }

  const musteringBenefitRow = (total: number) => {
    if (!selectedMusteringCareerBenefits.value.length) return null
    const tableRoll = Math.max(1, Math.min(7, total))
    return selectedMusteringCareerBenefits.value.find((benefit) => benefit.roll === tableRoll) ?? null
  }

  const applyMusteringBenefit = (benefit: string, source: string) => {
    const parts = benefit.split(/\s+and\s+/i).map((part) => part.trim()).filter(Boolean)
    if (parts.length > 1 && parts.every((part) => /^(STR|DEX|END|INT|EDU|SOC)\s*\+\d+$/i.test(part))) {
      for (const part of parts) applyCharacteristicIncrease(part)
      return
    }

    if (applyCharacteristicIncrease(benefit)) return

    if (/^contact$/i.test(benefit) || /^ally$/i.test(benefit)) {
      associates.value = [
        ...associates.value,
        {
          id: makeEventOutcomeId('associate'),
          source,
          type: benefit.toLowerCase(),
          name: `${benefit} from mustering out`,
        },
      ]
      return
    }

    personalBenefits.value = [...personalBenefits.value, benefit]
  }

  const resolveMusteringOutRoll = (die: number, source: 'rolled' | 'manual') => {
    if (!canRollMusteringOut.value || !selectedMusteringCareer.value) return
    if (die < 1 || die > 6) return

    const modifiers = activeBenefitRollModifiers()
    const dm = modifiers.reduce((sum, modifier) => sum + modifier.dm, 0)
    const total = die + dm
    const row = musteringBenefitRow(total)
    if (!row) return

    const result: MusteringOutResult = {
      id: makeEventOutcomeId('mustering-out'),
      careerId: selectedMusteringCareer.value.id,
      careerName: selectedMusteringCareer.value.name,
      rollType: selectedMusteringRollType.value,
      dice: [die],
      dm,
      total,
      tableRoll: row.roll,
      cash: selectedMusteringRollType.value === 'cash' ? row.cash : undefined,
      benefit: selectedMusteringRollType.value === 'benefit' ? row.benefit : undefined,
    }

    musteringOutResults.value = [...musteringOutResults.value, result]
    consumeBenefitRollModifiers(modifiers)

    if (typeof result.cash === 'number') startingCredits.value += result.cash
    if (result.benefit) applyMusteringBenefit(result.benefit, `Mustering Out: ${selectedMusteringCareer.value.name}`)

    eventOutcomeLog.value = [
      {
        id: makeEventOutcomeId('mustering-out-log'),
        source: `Mustering Out: ${selectedMusteringCareer.value.name}`,
        label: selectedMusteringRollType.value === 'cash'
          ? `Cash ${result.cash?.toLocaleString() ?? 0} credits`
          : result.benefit ?? 'Benefit',
        effectType: 'mustering_out',
        normalizedType: 'mustering_out',
        status: 'automatic',
      },
      ...eventOutcomeLog.value,
    ].slice(0, 24)
  }

  const rollMusteringOutBenefit = () => {
    resolveMusteringOutRoll(Math.ceil(Math.random() * 6), 'rolled')
  }

  const enterManualMusteringOutBenefit = (die: number) => {
    if (Number.isNaN(die)) return
    resolveMusteringOutRoll(die, 'manual')
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
    if (effect.type === 'assignment_skill_check') return `${selectedAssignment.value.name} skill check ${effect.target ?? 8}+`
    if (effect.type === 'check') {
      if (effect.check?.characteristic) return `${effect.check.characteristic.toUpperCase()} ${effect.check.target}+`
      if (effect.check?.skill) {
        const characteristic = defaultSkillCharacteristic(effect.check.skill)
        return `${safeSkillOptionLabel(effect.check.skill)}${characteristic ? ` + ${characteristic.toUpperCase()}` : ''} ${effect.check.target ?? 8}+`
      }
      return `2D ${effect.check?.target ?? effect.target ?? 8}+`
    }
    if (effect.type === 'check_any') return `Check ${effect.checks?.map((check: Record<string, any>) => {
      const characteristic = check.skill ? defaultSkillCharacteristic(check.skill) : null
      return `${safeSkillOptionLabel(check.skill ?? check.characteristic)}${characteristic ? ` + ${characteristic.toUpperCase()}` : ''} ${check.target}+`
    }).join(' or ')}`
    if (effect.type === 'choose_skill_increase') return effect.skills
      ? `Choose skill increase: ${effect.skills.map((skill: string) => skillOptionLabel(skill)).join(', ')}`
      : 'Choose any skill to increase'
    if (effect.type === 'choose_skill_set') return `Choose skill at level ${effect.level ?? 1}: ${effect.skills?.map((skill: string) => skillOptionLabel(skill)).join(', ')}`
    if (effect.type === 'choose_skill_or_contact') return `Choose skill or contact: ${effect.skills?.map((skill: string) => skillOptionLabel(skill)).join(', ') ?? 'skill'}`
    if (effect.type === 'choose_skill') return `Choose any skill at level ${effect.level ?? 0}`
    if (effect.type === 'set_skill') return `${safeSkillOptionLabel(effect.skillId)} ${effect.level}`
    if (effect.type === 'increase_skill') return `Increase ${safeSkillOptionLabel(effect.skillId)} by ${effect.amount ?? 1}`
    if (effect.type === 'increase_existing_skill') return `Increase an existing skill by ${effect.amount ?? 1}`
    if (effect.type === 'increase_any_existing_skill') return `Increase any existing skill by ${effect.amount ?? 1}`
    if (effect.type === 'science_speciality_levels') return `Choose ${effect.count ?? 1} Science specialty increase${effect.count === 1 ? '' : 's'}`
    if (effect.type === 'free_skill_table_roll') return 'Free skill table roll'
    if (effect.type === 'skill_table_roll') return `Roll on ${skillTableLabel(effect.tableId ?? selectedCareerSkillTableId.value)}`
    if (effect.type === 'wager_benefit_rolls') return 'Wager benefit rolls'
    if (effect.type === 'gain_associate') return `Gain ${effect.count ? `${effect.count} ` : ''}${effect.associateTypes?.join(' or ') ?? 'associate'}`
    if (effect.type === 'convert_or_gain_associate') return `Convert ${effect.from?.join(' or ') ?? 'contact or ally'} to ${effect.to?.join(' or ') ?? 'rival or enemy'}`
    if (effect.type === 'convert_associate') return `Convert ${effect.associateName ?? 'associate'} to ${associateTypeLabel(String(effect.toType))}`
    if (effect.type === 'benefit_roll_dm') return `Benefit roll DM ${formatDm(effect.dm ?? 0)}`
    if (effect.type === 'one_benefit_roll_dm') return `One benefit roll DM ${formatDm(effect.dm ?? 0)}`
    if (effect.type === 'lose_benefit_roll') return `Lose ${effect.count ?? 1} benefit roll`
    if (effect.type === 'possible_no_reenlist') return 'May not re-enlist'
    if (effect.type === 'next_advancement_dm') return `Next advancement DM ${formatDm(effect.dm ?? 0)}`
    if (effect.type === 'next_qualification_dm') return `Next qualification DM ${formatDm(effect.dm ?? 0)}`
    if (effect.type === 'next_survival_dm') return `Next survival DM ${formatDm(effect.dm ?? 0)}`
    if (effect.type === 'parole_threshold_change') return `Parole Threshold ${effect.amount >= 0 ? '+' : ''}${effect.amount ?? 0}`
    if (effect.type === 'parole_threshold_reroll') return 'Re-roll Parole Threshold'
    if (effect.type === 'leave_prisoner_career') return 'Leave Prisoner career'
    if (effect.type === 'prison_lawyer') return 'Hire prison lawyer'
    if (effect.type === 'lose_benefit_rolls_from_career') return 'Lose Prisoner benefit rolls'
    if (effect.type === 'automatic_promotion') return 'Automatic promotion'
    if (effect.type === 'automatic_commission') return 'Automatic commission'
    if (effect.type === 'automatic_next_promotion_or_commission') return 'Automatic next promotion or commission'
    if (effect.type === 'injury') return 'Injury roll'
    if (effect.type === 'possible_injury') return 'Possible injury'
    if (effect.type === 'possible_mishap') return 'Possible mishap'
    if (effect.type === 'narrative_event') return 'Record narrative event'
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

  const characterProfile = computed<TravellerProfile>(() => {
    const profile = createBlankTravellerProfile('lifepath')
    const groupedAssociates = {
      allies: associates.value.filter((associate) => associate.type === 'ally'),
      contacts: associates.value.filter((associate) => associate.type === 'contact'),
      rivals: associates.value.filter((associate) => associate.type === 'rival'),
      enemies: associates.value.filter((associate) => associate.type === 'enemy'),
      other: associates.value.filter((associate) => !['ally', 'contact', 'rival', 'enemy'].includes(associate.type)),
    }

    profile.id = creatorProfileSeed.id
    profile.userId = creatorProfileSeed.userId
    profile.createdAt = creatorProfileSeed.createdAt
    profile.updatedAt = new Date().toISOString()
    profile.source = 'lifepath'
    profile.identity.name = characterName.value.trim() || 'Unnamed Traveller'
    profile.identity.age = currentAge.value
    for (const characteristic of characteristicRows.value) {
      profile.characteristics[characteristic.id as TravellerCharacteristicId] = { ...characteristic }
    }
    profile.characteristics.psi.value = psiScore.value ?? 0
    profile.characteristics.psi.dm = psiDm.value
    profile.skills = currentTravellerSkills.value.map((skill) => ({
      ...skill,
      sources: [...skill.sources],
    }))
    profile.careers = termHistory.value.map((term) => ({
      ...term,
      details: [...term.details],
      rolls: term.rolls.map((roll) => ({ ...roll, dice: [...roll.dice] })),
    }))
    profile.associates = {
      allies: groupedAssociates.allies.map((associate) => ({ ...associate, tags: associate.tags ? [...associate.tags] : undefined })),
      contacts: groupedAssociates.contacts.map((associate) => ({ ...associate, tags: associate.tags ? [...associate.tags] : undefined })),
      rivals: groupedAssociates.rivals.map((associate) => ({ ...associate, tags: associate.tags ? [...associate.tags] : undefined })),
      enemies: groupedAssociates.enemies.map((associate) => ({ ...associate, tags: associate.tags ? [...associate.tags] : undefined })),
      other: groupedAssociates.other.map((associate) => ({ ...associate, tags: associate.tags ? [...associate.tags] : undefined })),
    }
    profile.psionics = {
      permissionSources: [...psionicsPermissionSources.value],
      psiScore: psiScore.value,
      psiDm: psiDm.value,
      tested: psiTested.value,
      talents: learnedPsionicTalents.value.map((talent) => ({ ...talent })),
      talentAttempts: psionicTalentAttempts.value.map((attempt) => ({ ...attempt, dice: [...attempt.dice] })),
      trainingCost: psionicsTrainingCost.value,
    }
    profile.benefits = {
      earnedRolls: totalBenefitRollsEarned.value,
      adjustments: totalBenefitRollAdjustments.value,
      availableRolls: totalAvailableBenefitRolls.value,
      spentRolls: spentBenefitRolls.value,
      remainingRolls: remainingBenefitRolls.value,
      cashRollsUsed: cashRollsUsed.value,
      cashRollLimit,
      personal: [...personalBenefits.value],
      musteringOut: musteringOutResults.value.map((result) => ({ ...result, dice: [...result.dice] })),
    }
    profile.finances.cashOnHand = startingCredits.value
    profile.finances.debt = totalDebt.value
    profile.history.events = narrativeEvents.value.map((event) => ({ ...event }))
    profile.history.background = selectedBackgroundSkills.value.map((skill) => skillOptionLabel(skill)).join(', ')
    profile.metadata.creatorComplete = lifepathComplete.value
    return profile
  })

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
    selectedAdvancementSkillTableId,
    hasRolledCharacteristics,
    showRerollConfirm,
    skipCharacteristicRerollConfirm,
    currentTermNumber,
    activeCreatorTab,
    draftUsed,
    draftRoll,
    gmOverrideMenuOpen,
    gmOverrideOptions,
    lifepathComplete,
    termHistory,
    careerRanks,
    advancementResult,
    appliedSkillRecords,
    educationSkillsApplied,
    universityLevel0Skill,
    universityLevel1Skill,
    pendingEducationSkillChoices,
    educationEventExpanded,
    basicTrainingApplied,
    basicTrainingCareerIds,
    pendingBasicTrainingChoices,
    careerEventExpanded,
    careerMishapExpanded,
    careerSkillResult,
    activeEvent,
    pendingEventResolutions,
    eventOutcomeLog,
    associates,
    narrativeEvents,
    psionicsPermissionSources,
    psiScore,
    psiTestRoll,
    psionicTalentAttempts,
    psionicsTrainingCost,
    prisonerParoleThreshold,
    prisonerParoleThresholdRoll,
    prisonerReleasedThisTerm,
    prisonerBenefitRollsLost,
    rollModifiers,
    benefitRollAdjustments,
    benefitRollLedger,
    musteringOutResults,
    selectedMusteringCareerId,
    selectedMusteringRollType,
    startingCredits,
    personalBenefits,
    medicalDebt,
    totalDebt,
    medicalCareLog,
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
    psionicTalents,
    psiTermsServed,
    psiDm,
    psionicsTestingAvailable,
    psiTested,
    psionicsTrainingAvailable,
    learnedPsionicTalentIds,
    learnedPsionicTalents,
    psionicTalentChecksAttempted,
    educationAvailable,
    agingRequired,
    educationEntryFailed,
    currentTermTabId,
    termTabs,
    activeTermNumber,
    activeTermHistoryEntry,
    backgroundSkillLimit,
    backgroundSkillsComplete,
    characteristicsAssigned,
    setupComplete,
    gmManualCheckRollEntryEnabled,
    gmManualTableRollEntryEnabled,
    gmManualAgingRollEntryEnabled,
    gmManualBenefitRollEntryEnabled,
    gmManualPsionicsRollEntryEnabled,
    gmOutcomeOverridesEnabled,
    gmCharacteristicAdjustmentsEnabled,
    prisonerCareerSelected,
    prisonerParoleThresholdRequired,
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
    careerQualificationFailed,
    draftFallbackAvailable,
    drifterFallbackAvailable,
    canMusterOut,
    automaticCareerEntryConstraint,
    currentCareerTableData,
    previousCareerCount,
    currentCareerQualificationDm,
    careerEvent,
    careerMishap,
    currentCareerSkillTables,
    tableEntries,
    advancedEducationAllowed,
    skillTableLabel,
    availableCareerSkillTables,
    selectedCareerSkillTable,
    selectedCareerSkillEntries,
    selectedAdvancementSkillTable,
    selectedAdvancementSkillEntries,
    careerTermsCompleted,
    selectedCareerIsMilitary,
    currentCareerIsOfficer,
    selectedCareerCommissionCheck,
    careerCommissionAvailable,
    automaticCommissionConstraint,
    educationGraduationHonours,
    basicTrainingRequired,
    basicTrainingAvailable,
    basicTrainingTableId,
    basicTrainingEntries,
    basicTrainingLabel,
    toggleBackgroundSkill,
    canSelectBackgroundSkill,
    toggleBackgroundSkillsCollapsed,
    toggleGmOverrideControls,
    toggleGmOverrideOption,
    forcePrisonerCareer,
    grantPsionicsTestingOverride,
    skillName,
    slugifySkill,
    skillFromLabel,
    skillLevel,
    skillCheckDm,
    defaultSkillCharacteristic,
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
    chooseDrifterFallback,
    rollDraftFallback,
    enterManualDraftFallback,
    rollSummary,
    dismissAdvancementResult,
    rollPrisonerParoleThreshold,
    enterManualPrisonerParoleThreshold,
    makeCareerSkillRoll,
    rollCareerSkillTable,
    enterManualCareerSkillTable,
    rollAdvancementSkillTable,
    enterManualAdvancementSkillTable,
    applyEventEffect,
    applyTravellerEventEffects,
    applyCareerTableEffects,
    rollEventResolutionCheck,
    enterManualEventResolutionCheck,
    rollEventResolutionSkillTable,
    enterManualEventResolutionSkillTable,
    rollEventResolutionBenefitWager,
    enterManualEventResolutionBenefitWager,
    declineEventResolutionBenefitWager,
    rollPsiTest,
    enterManualPsiTest,
    psionicTalentAttemptDm,
    learnPsionicTalentAutomatically,
    rollPsionicTalent,
    enterManualPsionicTalent,
    rollEventResolutionTable,
    enterManualEventResolutionTable,
    resolveEventChoice,
    resolveEventCharacteristicAdjustment,
    resolveEventMedicalCare,
    resolveEventOutcomeChoice,
    resolveEventAssociate,
    resolveEventNarrative,
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
    termCompletionBlockers,
    canAddTermTab,
    nextTermButtonLabel,
    selectTermTab,
    addTermTab,
    completeCurrentTerm,
    musterOut,
    totalBenefitRollsEarned,
    totalBenefitRollAdjustments,
    totalAvailableBenefitRolls,
    spentBenefitRolls,
    remainingBenefitRolls,
    cashRollsUsed,
    cashRollLimit,
    canRollMusteringOut,
    musteringCareerOptions,
    selectedMusteringCareer,
    selectedMusteringCareerBenefits,
    rollMusteringOutBenefit,
    enterManualMusteringOutBenefit,
    modifierLabel,
    educationBenefitLabel,
    preCareerEventEffectLabel,
    tableEffectLabel,
    characteristicRows,
    characterProfile,
  }
})
