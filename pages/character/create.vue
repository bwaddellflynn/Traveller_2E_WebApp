<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { nextTick, onBeforeUnmount } from 'vue'
import CharacterCreatorHeader from '~/components/character/CharacterCreatorHeader.vue'
import CreationStepPanel from '~/components/character/CreationStepPanel.vue'
import DiceRollModal from '~/components/character/DiceRollModal.vue'
import CreatorResolvedEventCard from '~/components/character/CreatorResolvedEventCard.vue'
import CreatorTabNavigation from '~/components/character/CreatorTabNavigation.vue'
import CurrentTravellerCard from '~/components/character/CurrentTravellerCard.vue'
import EventResolutionList from '~/components/character/EventResolutionList.vue'
import MusterOutPanel from '~/components/character/MusterOutPanel.vue'
import MusterOutRollModal from '~/components/character/MusterOutRollModal.vue'
import PsionicsPanel from '~/components/character/PsionicsPanel.vue'
import RerollConfirmDialog from '~/components/character/RerollConfirmDialog.vue'
import TermActionFooter from '~/components/character/TermActionFooter.vue'
import { useCharacterCreatorStore } from '~/stores/characterCreator'
import { useTravellersStore } from '~/stores/travellers'
import { clearBuilderDraft, loadBuilderDraft, saveBuilderDraft } from '~/utils/traveller/draftCache'

const CHARACTER_CREATOR_DRAFT_CACHE_KEY = 'scoutsuite.builder.characterCreator.v1'
const CHARACTER_CREATOR_DRAFT_CACHE_VERSION = 1

const characterCreator = useCharacterCreatorStore()
const travellers = useTravellersStore()
const router = useRouter()
const creatorSaveMessage = ref('')
const musterOutModalOpen = ref(false)
const activeTermStep = ref('direction')
const characterCreatorDraftRestored = ref(false)
const restartConfirmOpen = ref(false)
const skipRestartConfirm = ref(false)
const restartInProgress = ref(false)
const {
  formatDm,
  skillOptionLabel,
  resolvePendingSkillChoice,
  applyBasicTraining,
  resolveBasicTrainingChoice,
  applyEducationSkills,
  resolveEducationSkillChoice,
  checkLabel,
  rollPreCareerEvent,
  enterManualPreCareerEvent,
  rollCheck,
  enterManualCheck,
  toggleRollOverride,
  chooseDrifterFallback,
  rollDraftFallback,
  enterManualDraftFallback,
  rollSummary,
  dismissAdvancementResult,
  dismissCommissionResult,
  rollPrisonerParoleThreshold,
  enterManualPrisonerParoleThreshold,
  rollCareerSkillTable,
  enterManualCareerSkillTable,
  rollAdvancementSkillTable,
  enterManualAdvancementSkillTable,
  rollCareerEvent,
  enterManualCareerEvent,
  rollCareerMishap,
  enterManualCareerMishap,
  rollAging,
  enterManualAging,
  rollPsiTest,
  enterManualPsiTest,
  resetCreatorState,
  selectTermTab,
  modifierLabel,
  educationBenefitLabel,
  preCareerEventEffectLabel,
  tableEffectLabel,
} = characterCreator
const {
  selectedEducationId,
  selectedTermPath,
  selectedCareerId,
  selectedAssignmentId,
  selectedCareerSkillTableId,
  selectedAdvancementSkillTableId,
  gmManualCheckRollEntryEnabled,
  gmManualTableRollEntryEnabled,
  gmManualAgingRollEntryEnabled,
  gmManualBenefitRollEntryEnabled,
  gmManualPsionicsRollEntryEnabled,
  gmOutcomeOverridesEnabled,
  gmRerollsEnabled,
  currentTermNumber,
  activeCreatorTab,
  lifepathComplete,
  educationSkillsApplied,
  universityLevel0Skill,
  universityLevel1Skill,
  pendingEducationSkillChoices,
  basicTrainingApplied,
  pendingBasicTrainingChoices,
  careerSkillResult,
  prisonerParoleThreshold,
  prisonerParoleThresholdRoll,
  prisonerParoleThresholdRequired,
  prisonerReleasedThisTerm,
  pendingEventResolutions,
  pendingSkillChoice,
  termRolls,
  manualRollTotals,
  currentAge,
  endOfTermAge,
  educationAvailable,
  agingRequired,
  musteringOutStarted,
  educationEntryFailed,
  currentTermTabId,
  activeTermNumber,
  activeTermHistoryEntry,
  termTabs,
  educationOptions,
  selectedEducation,
  selectedEducationTableOption,
  educationSkillOptions,
  educationGraduationHonours,
  educationGraduationFailureNotes,
  selectedEducationEntry,
  preCareerEvent,
  militaryAcademyServiceSkills,
  selectedCareer,
  selectedAssignment,
  careerSelectionComplete,
  careerOptions,
  careerConstraintMessages,
  careerPathLocked,
  draftUsed,
  draftRoll,
  draftFallbackAvailable,
  requiredDraftAvailable,
  drifterFallbackAvailable,
  sameCareerContinuationAvailable,
  automaticCareerEntryConstraint,
  selectedCareerCommissionCheck,
  careerCommissionAvailable,
  automaticCommissionConstraint,
  currentCareerQualificationDm,
  activeQualificationRollModifiers,
  activeQualificationRollModifierTotal,
  careerEvent,
  careerMishap,
  availableCareerSkillTables,
  selectedCareerSkillEntries,
  careerTermsCompleted,
  currentCareerOfficerRank,
  selectedAdvancementSkillEntries,
  basicTrainingRequired,
  basicTrainingAvailable,
  basicTrainingMode,
  basicTrainingEntries,
  basicTrainingOptions,
  basicTrainingLabel,
  agingEffect,
  advancementResult,
  advancementResultOpen,
  commissionResult,
  commissionResultOpen,
  characterProfile,
  psionicsPermissionSources,
  psionicsTestingAvailable,
  psiTermsServed,
  psiTested,
  psiScore,
  psiTestRoll,
  values,
} = storeToRefs(characterCreator)

const setupCreatorTabs = ['creation', 'setup-stats', 'setup-skills'] as const
const setupTabSet = new Set<string>(setupCreatorTabs)
const activeCreatorTabIsSetup = computed(() => setupTabSet.has(activeCreatorTab.value))
const isMobileViewport = ref(false)
let mobileViewportQuery: MediaQueryList | null = null
const handleCreatorViewportChange = (event: MediaQueryListEvent) => syncCreatorViewportMode(event.matches)

const syncCreatorViewportMode = (matches: boolean) => {
  isMobileViewport.value = matches
  if (matches && activeCreatorTab.value === 'creation') {
    activeCreatorTab.value = 'setup-stats'
    return
  }

  if (!matches && (activeCreatorTab.value === 'setup-stats' || activeCreatorTab.value === 'setup-skills')) {
    activeCreatorTab.value = 'creation'
  }
}

const creationStepPanelMode = computed<'all' | 'stats' | 'skills'>(() => {
  if (!isMobileViewport.value) return 'all'
  if (activeCreatorTab.value === 'setup-skills') return 'skills'
  return 'stats'
})
const creatorNavigationAnchor = ref<HTMLElement | null>(null)
const creatorRollModalOpen = ref(false)
const creatorRollModalRolling = ref(false)
const creatorRollModalTitle = ref('')
const creatorRollModalResult = ref('')
const creatorRollModalModifier = ref(0)
const creatorRollModalDice = ref<[number, number]>([1, 1])
const creatorRollModalDiceCount = ref<1 | 2>(2)
const creatorRollModalTotal = ref(0)
const creatorRollModalTimer = ref<number | null>(null)
const creatorRollModalFinishTimer = ref<number | null>(null)
const musterOutRollModalOpen = ref(false)
const musterOutRollModalPayload = ref<{
  title: string
  resultId: string
  careerName: string
  rollType: 'cash' | 'benefit'
  die: number
  modifier: number
  total: number
  tableRoll: number
  result: string
  options: Array<{ roll: number; cash: number; benefit: string }>
} | null>(null)
const eventTextModalOpen = ref(false)
const eventTextModalTitle = ref('')
const eventTextModalText = ref('')
const eventTextModalEffects = ref<string[]>([])

const scrollToCreatorNavigation = async () => {
  if (!import.meta.client) return
  await nextTick()
  const anchor = creatorNavigationAnchor.value
  if (!anchor) return
  const topOffset = 88
  const top = anchor.getBoundingClientRect().top + window.scrollY - topOffset
  window.scrollTo({
    top: Math.max(0, top),
    behavior: 'smooth',
  })
}

const educationEntryModifierApplies = (condition: string) => {
  if (condition === 'term == 2') return currentTermNumber.value === 2
  if (condition === 'term == 3') return currentTermNumber.value === 3
  if (condition === 'soc >= 9') return values.value.soc >= 9
  if (condition === 'soc >= 8') return values.value.soc >= 8
  if (condition === 'end >= 8') return values.value.end >= 8
  return true
}

const educationEntryModifierWarningLabel = (modifier: { condition: string; dm: number }) => {
  const conditionLabels: Record<string, string> = {
    'term == 2': 'Term 2',
    'term == 3': 'Term 3',
    'soc >= 9': 'SOC 9+',
    'soc >= 8': 'SOC 8+',
    'end >= 8': 'END 8+',
  }

  return `${conditionLabels[modifier.condition] ?? modifier.condition}: DM${formatDm(modifier.dm)}`
}

const activeEducationEntryModifiers = computed(() => {
  return (selectedEducation.value?.entryModifiers ?? []).filter((modifier) => educationEntryModifierApplies(modifier.condition))
})
const selectedEducationDirectionTargets = computed(() => {
  if (!selectedEducation.value || !selectedEducationEntry.value) return []

  const targets = [
    {
      id: 'entry',
      label: 'Entry',
      value: checkLabel(selectedEducationEntry.value),
    },
    {
      id: 'graduation',
      label: 'Graduation',
      value: checkLabel(selectedEducation.value.graduation),
    },
  ]

  if (typeof selectedEducation.value.graduation?.honoursTarget === 'number') {
    targets.push({
      id: 'honours',
      label: 'Honours',
      value: `${selectedEducation.value.graduation.honoursTarget}+`,
    })
  }

  return targets
})
const selectedAssignmentSkillPreview = computed(() => {
  const table = availableCareerSkillTables.value.find((entry) => entry.id === selectedAssignmentId.value)
  return (table?.entries ?? []).slice(0, 6).map((entry, index) => ({
    roll: index + 1,
    label: entry,
  }))
})

const termStepTabs = computed(() => {
  if (selectedTermPath.value === 'education') {
    const steps = [
      { id: 'direction', label: 'Direction' },
      { id: 'education-entry', label: 'Entry' },
      { id: 'education-skills', label: 'Skills' },
      { id: 'education-event', label: 'Event' },
      { id: 'education-graduation', label: 'Graduation' },
      { id: 'complete', label: 'Complete' },
    ]
    if (agingRequired.value) steps.splice(5, 0, { id: 'aging', label: 'Aging' })
    return steps
  }

  const steps = [
    { id: 'direction', label: 'Direction' },
    { id: 'qualification', label: 'Application' },
    { id: 'training', label: 'Training' },
    { id: 'survival', label: 'Survival' },
    { id: 'event', label: 'Event' },
    { id: 'advancement', label: 'Rank' },
    { id: 'complete', label: 'Complete' },
  ]
  if (agingRequired.value) steps.splice(6, 0, { id: 'aging', label: 'Aging' })
  return steps
})
const activeTermStepIndex = computed(() => Math.max(0, termStepTabs.value.findIndex((step) => step.id === activeTermStep.value)))
const mobileStepCarouselTouchStartX = ref<number | null>(null)
const mobileStepCarouselTouchStartAt = ref<number | null>(null)
const mobileStepCarouselSwipeDelta = ref(0)
const mobileStepCarouselTransition = ref<'forward' | 'backward' | 'none'>('none')
const mobileStepPrev = computed(() => {
  const count = termStepTabs.value.length
  return count ? termStepTabs.value[(activeTermStepIndex.value - 1 + count) % count] : null
})
const mobileStepCurrent = computed(() => termStepTabs.value[activeTermStepIndex.value] ?? null)
const mobileStepNext = computed(() => {
  const count = termStepTabs.value.length
  return count ? termStepTabs.value[(activeTermStepIndex.value + 1) % count] : null
})
const creatorShellTabs = computed(() => {
  const termIds = termTabs.value.map((termNumber) => `term-${termNumber}` as const)
  return isMobileViewport.value
    ? (['setup-stats', 'setup-skills', ...termIds] as const)
    : (['creation', ...termIds] as const)
})
const activeCreatorShellIndex = computed(() => creatorShellTabs.value.findIndex((tab) => tab === activeCreatorTab.value))
const activeCreatorTabIsTerm = computed(() => activeCreatorTab.value.startsWith('term-'))
const canFooterNavigatePrev = computed(() => {
  if (activeCreatorTabIsTerm.value) {
    return activeTermStepIndex.value > 0 || activeCreatorShellIndex.value > 0
  }
  return activeCreatorShellIndex.value > 0
})
const canFooterNavigateNext = computed(() => {
  if (activeCreatorTabIsTerm.value) {
    return activeTermStepIndex.value < termStepTabs.value.length - 1 || activeCreatorShellIndex.value < creatorShellTabs.value.length - 1
  }
  return activeCreatorShellIndex.value > -1 && activeCreatorShellIndex.value < creatorShellTabs.value.length - 1
})
const folderTabPosition = (index: number, count: number) => count <= 1 ? 0 : index / (count - 1)
const unresolvedEventResolutions = computed(() => pendingEventResolutions.value.some((resolution) => !resolution.resolved))
const unresolvedEducationSkillChoices = computed(() => pendingEducationSkillChoices.value.some((choice) => !choice.selected))

const navigateMobileTermStep = (direction: 'prev' | 'next') => {
  const count = termStepTabs.value.length
  if (!count) return
  mobileStepCarouselTransition.value = direction === 'next' ? 'forward' : 'backward'
  const nextIndex = direction === 'prev'
    ? (activeTermStepIndex.value - 1 + count) % count
    : (activeTermStepIndex.value + 1) % count
  const target = termStepTabs.value[nextIndex]
  if (!target) return
  activeTermStep.value = target.id
}

const handleMobileStepCarouselTouchStart = (event: TouchEvent) => {
  mobileStepCarouselTouchStartX.value = event.touches[0]?.clientX ?? null
  mobileStepCarouselTouchStartAt.value = performance.now()
}

const handleMobileStepCarouselTouchMove = (event: TouchEvent) => {
  if (mobileStepCarouselTouchStartX.value === null) return
  const currentX = event.touches[0]?.clientX
  if (typeof currentX !== 'number') return
  mobileStepCarouselSwipeDelta.value = currentX - mobileStepCarouselTouchStartX.value
}

const handleMobileStepCarouselTouchEnd = () => {
  const delta = mobileStepCarouselSwipeDelta.value
  const elapsed = mobileStepCarouselTouchStartAt.value === null ? 999 : performance.now() - mobileStepCarouselTouchStartAt.value
  const threshold = elapsed < 180 ? 18 : 36
  if (delta <= -threshold) navigateMobileTermStep('next')
  else if (delta >= threshold) navigateMobileTermStep('prev')

  mobileStepCarouselTouchStartX.value = null
  mobileStepCarouselTouchStartAt.value = null
  mobileStepCarouselSwipeDelta.value = 0
}
type CreatorStepActionKey =
  | 'open-muster-out'
  | 'roll-draft'
  | 'enter-drifter'
  | 'roll-qualification'
  | 'manual-qualification'
  | 'roll-parole-threshold'
  | 'manual-parole-threshold'
  | 'apply-basic-training'
  | 'roll-career-skill'
  | 'manual-career-skill'
  | 'roll-survival'
  | 'manual-survival'
  | 'roll-mishap'
  | 'manual-mishap'
  | 'roll-event'
  | 'manual-event'
  | 'roll-commission'
  | 'manual-commission'
  | 'roll-advancement'
  | 'manual-advancement'
  | 'roll-advancement-skill'
  | 'manual-advancement-skill'
  | 'roll-education-entry'
  | 'manual-education-entry'
  | 'apply-education-skills'
  | 'roll-pre-career-event'
  | 'manual-pre-career-event'
  | 'roll-education-graduation'
  | 'manual-education-graduation'
  | 'roll-aging'
  | 'manual-aging'

type CreatorStepActionDefinition = {
  key: CreatorStepActionKey
  label: string
  helper: string
  rerollOf?: CreatorStepActionKey
}

const rerollableCreatorStepActionKeys = new Set<CreatorStepActionKey>([
  'roll-draft',
  'roll-qualification',
  'roll-parole-threshold',
  'roll-career-skill',
  'roll-survival',
  'roll-mishap',
  'roll-event',
  'roll-commission',
  'roll-advancement',
  'roll-advancement-skill',
  'roll-education-entry',
  'roll-pre-career-event',
  'roll-education-graduation',
  'roll-aging',
])
const creatorRerollSnapshots = ref<Partial<Record<CreatorStepActionKey, Record<string, unknown>>>>({})
const psiTestRerollSnapshot = ref<Record<string, unknown> | null>(null)
const captureCreatorStateSnapshot = () => JSON.parse(JSON.stringify(characterCreator.$state)) as Record<string, unknown>
const restoreCreatorStateSnapshot = (snapshot: Record<string, unknown> | null) => {
  if (!snapshot) return false
  closeCreatorRollModal()
  closeEventTextModal()
  dismissAdvancementResult()
  dismissCommissionResult()
  characterCreator.$patch((state) => {
    Object.assign(state as any, JSON.parse(JSON.stringify(snapshot)))
  })
  if (mobileViewportQuery) syncCreatorViewportMode(mobileViewportQuery.matches)
  return true
}
const canRerollCreatorAction = (key: CreatorStepActionKey) => {
  return gmRerollsEnabled.value && Boolean(creatorRerollSnapshots.value[key])
}
const captureCreatorRerollSnapshot = (key: CreatorStepActionKey) => {
  if (!rerollableCreatorStepActionKeys.has(key)) return
  creatorRerollSnapshots.value = {
    ...creatorRerollSnapshots.value,
    [key]: captureCreatorStateSnapshot(),
  }
}
const restoreCreatorRerollSnapshot = (key: CreatorStepActionKey) => {
  return restoreCreatorStateSnapshot(creatorRerollSnapshots.value[key] ?? null)
}
const makeRerollAction = (key: CreatorStepActionKey, helper: string): CreatorStepActionDefinition => ({
  key,
  label: 'Re-roll',
  helper,
  rerollOf: key,
})

const activeTermStepComplete = computed(() => {
  if (activeTermStep.value === 'complete') return false

  if (selectedTermPath.value === 'education') {
    if (activeTermStep.value === 'direction') return Boolean(selectedEducation.value && selectedEducationEntry.value)
    if (activeTermStep.value === 'education-entry') return Boolean(termRolls.value.educationEntry)
    if (activeTermStep.value === 'education-skills') {
      return Boolean(
        termRolls.value.educationEntry?.finalSuccess
        && educationSkillsApplied.value
        && !unresolvedEducationSkillChoices.value,
      )
    }
    if (activeTermStep.value === 'education-event') {
      return Boolean(termRolls.value.educationEvent && !unresolvedEventResolutions.value)
    }
    if (activeTermStep.value === 'education-graduation') return Boolean(termRolls.value.educationGraduation)
    if (activeTermStep.value === 'aging') return Boolean(termRolls.value.aging && !unresolvedEventResolutions.value)
    return false
  }

  if (activeTermStep.value === 'direction') return careerSelectionComplete.value
  if (activeTermStep.value === 'qualification') {
    return Boolean(termRolls.value.careerQualification?.finalSuccess && !prisonerParoleThresholdRequired.value)
  }
  if (activeTermStep.value === 'training') {
    return Boolean(
      (!basicTrainingRequired.value || basicTrainingApplied.value)
      && !pendingBasicTrainingChoices.value.some((choice) => !choice.selected)
      && termRolls.value.careerSkill
      && !pendingSkillChoice.value,
    )
  }
  if (activeTermStep.value === 'survival') return Boolean(termRolls.value.careerSurvival)
  if (activeTermStep.value === 'event') {
    if (!termRolls.value.careerSurvival) return false
    if (!termRolls.value.careerSurvival.finalSuccess) {
      return Boolean(termRolls.value.careerMishap && !unresolvedEventResolutions.value)
    }
    return Boolean(termRolls.value.careerEvent && !unresolvedEventResolutions.value)
  }
  if (activeTermStep.value === 'advancement') {
    if (!termRolls.value.careerSurvival?.finalSuccess) return true
    if (selectedCareerId.value === 'prisoner') return prisonerReleasedThisTerm.value || Boolean(termRolls.value.careerAdvancement)
    if (careerCommissionAvailable.value && !automaticCommissionConstraint.value && !termRolls.value.careerCommission) return false
    if (termRolls.value.careerCommission?.finalSuccess) return true
    return Boolean(
      termRolls.value.careerAdvancement
      && (!termRolls.value.careerAdvancement.finalSuccess || termRolls.value.careerAdvancementSkill),
    )
  }
  if (activeTermStep.value === 'aging') return Boolean(termRolls.value.aging && !unresolvedEventResolutions.value)
  return false
})
const activeStepPrimaryAction = computed<CreatorStepActionDefinition | null>(() => {
  if (activeTermStep.value === 'complete' && lifepathComplete.value && !musteringOutStarted.value) {
    return {
      key: 'open-muster-out',
      label: 'Open Muster Out',
      helper: 'Resolve mustering out and then save to the character sheet.',
    }
  }

  if (selectedTermPath.value === 'education') {
    if (activeTermStep.value === 'education-entry' && termRolls.value.educationEntry && canRerollCreatorAction('roll-education-entry')) {
      return makeRerollAction('roll-education-entry', 'Roll education entry again and reset later education or career progress from this term.')
    }
    if (activeTermStep.value === 'education-entry' && !termRolls.value.educationEntry && selectedEducationEntry.value) {
      return {
        key: 'roll-education-entry',
        label: 'Roll 2D',
        helper: 'Resolve education entry.',
      }
    }

    if (
      activeTermStep.value === 'education-skills'
      && termRolls.value.educationEntry?.finalSuccess
      && !educationSkillsApplied.value
      && !unresolvedEducationSkillChoices.value
    ) {
      return {
        key: 'apply-education-skills',
        label: 'Apply Skills',
        helper: 'Apply this term’s education skills.',
      }
    }

    if (
      activeTermStep.value === 'education-event'
      && termRolls.value.educationEntry?.finalSuccess
      && educationSkillsApplied.value
      && termRolls.value.educationEvent
      && canRerollCreatorAction('roll-pre-career-event')
    ) {
      return makeRerollAction('roll-pre-career-event', 'Roll the pre-career event again and overwrite its outcomes for this term.')
    }
    if (
      activeTermStep.value === 'education-event'
      && termRolls.value.educationEntry?.finalSuccess
      && educationSkillsApplied.value
      && !termRolls.value.educationEvent
    ) {
      return {
        key: 'roll-pre-career-event',
        label: 'Roll 2D',
        helper: 'Roll the pre-career event.',
      }
    }

    if (
      activeTermStep.value === 'education-graduation'
      && termRolls.value.educationEntry?.finalSuccess
      && termRolls.value.educationEvent
      && termRolls.value.educationGraduation
      && canRerollCreatorAction('roll-education-graduation')
    ) {
      return makeRerollAction('roll-education-graduation', 'Roll graduation again and overwrite graduation outcomes for this term.')
    }
    if (
      activeTermStep.value === 'education-graduation'
      && termRolls.value.educationEntry?.finalSuccess
      && termRolls.value.educationEvent
      && !termRolls.value.educationGraduation
    ) {
      return {
        key: 'roll-education-graduation',
        label: 'Roll 2D',
        helper: 'Resolve graduation.',
      }
    }

    if (activeTermStep.value === 'aging' && termRolls.value.aging && canRerollCreatorAction('roll-aging')) {
      return makeRerollAction('roll-aging', 'Roll aging again and overwrite the aging outcome for this term.')
    }
    if (activeTermStep.value === 'aging' && !termRolls.value.aging) {
      return {
        key: 'roll-aging',
        label: 'Roll 2D',
        helper: 'Resolve aging for this term.',
      }
    }

    return null
  }

  if (activeTermStep.value === 'qualification') {
    if (requiredDraftAvailable.value) {
      if (termRolls.value.draft && canRerollCreatorAction('roll-draft')) {
        return makeRerollAction('roll-draft', 'Roll the draft result again and overwrite the fallback career for this term.')
      }
      return {
        key: 'roll-draft',
        label: 'Roll Draft',
        helper: 'An event requires a Draft roll before this career can begin.',
      }
    }
    if (drifterFallbackAvailable.value) {
      if (draftFallbackAvailable.value) {
        return {
          key: 'roll-draft',
          label: 'Roll Draft',
          helper: 'Qualification failed. Use the draft fallback.',
        }
      }
      return {
        key: 'enter-drifter',
        label: 'Enter Drifter',
        helper: 'Qualification failed and no draft fallback remains.',
      }
    }
    if (
      selectedCareerId.value === 'prisoner'
      && termRolls.value.careerQualification?.finalSuccess
      && prisonerParoleThresholdRequired.value
    ) {
      if (termRolls.value.prisonerParoleThreshold && canRerollCreatorAction('roll-parole-threshold')) {
        return makeRerollAction('roll-parole-threshold', 'Roll the parole threshold again and overwrite the current Prisoner term setup.')
      }
      return {
        key: 'roll-parole-threshold',
        label: 'Roll 1D',
        helper: 'Set the parole threshold for this Prisoner term.',
      }
    }
    if (termRolls.value.careerQualification && canRerollCreatorAction('roll-qualification')) {
      return makeRerollAction('roll-qualification', 'Roll qualification again and reset later career progress from this term.')
    }
    if (
      !automaticCareerEntryConstraint.value
      && !sameCareerContinuationAvailable.value
      && !requiredDraftAvailable.value
      && !termRolls.value.careerQualification
    ) {
      return {
        key: 'roll-qualification',
        label: 'Roll 2D',
        helper: 'Resolve qualification for this career.',
      }
    }
    return null
  }

  if (activeTermStep.value === 'training') {
    if (basicTrainingAvailable.value && !basicTrainingApplied.value) {
      return {
        key: 'apply-basic-training',
        label: 'Apply',
        helper: 'Apply this term’s basic training.',
      }
    }
    if (
      termRolls.value.careerQualification?.finalSuccess
      && (!basicTrainingRequired.value || basicTrainingApplied.value)
      && termRolls.value.careerSkill
      && canRerollCreatorAction('roll-career-skill')
    ) {
      return makeRerollAction('roll-career-skill', 'Roll the career skill table again and overwrite this term’s skill result.')
    }
    if (
      termRolls.value.careerQualification?.finalSuccess
      && (!basicTrainingRequired.value || basicTrainingApplied.value)
      && !termRolls.value.careerSkill
    ) {
      return {
        key: 'roll-career-skill',
        label: 'Roll 1D',
        helper: 'Roll this term’s career skill table.',
      }
    }
    return null
  }

  if (activeTermStep.value === 'survival' && termRolls.value.careerSurvival && canRerollCreatorAction('roll-survival')) {
    return makeRerollAction('roll-survival', 'Roll survival again and overwrite later term outcomes from this point.')
  }
  if (activeTermStep.value === 'survival' && termRolls.value.careerSkill && !pendingSkillChoice.value && !termRolls.value.careerSurvival) {
    return {
      key: 'roll-survival',
      label: 'Roll 2D',
      helper: 'Resolve survival for this term.',
    }
  }

  if (activeTermStep.value === 'event') {
    if (termRolls.value.careerSurvival?.finalSuccess === false && termRolls.value.careerMishap && canRerollCreatorAction('roll-mishap')) {
      return makeRerollAction('roll-mishap', 'Roll the mishap table again and overwrite this term’s mishap outcomes.')
    }
    if (termRolls.value.careerSurvival?.finalSuccess === false && !termRolls.value.careerMishap) {
      return {
        key: 'roll-mishap',
        label: 'Roll 2D',
        helper: 'Resolve the mishap for this failed term.',
      }
    }
    if (termRolls.value.careerSurvival?.finalSuccess && termRolls.value.careerEvent && canRerollCreatorAction('roll-event')) {
      return makeRerollAction('roll-event', 'Roll the career event again and overwrite this term’s event outcomes.')
    }
    if (termRolls.value.careerSurvival?.finalSuccess && !termRolls.value.careerEvent) {
      return {
        key: 'roll-event',
        label: 'Roll 2D',
        helper: 'Resolve the career event for this term.',
      }
    }
    return null
  }

  if (activeTermStep.value === 'advancement') {
    if (
      careerCommissionAvailable.value
      && !automaticCommissionConstraint.value
      && !termRolls.value.careerCommission
    ) {
      return {
        key: 'roll-commission',
        label: 'Roll 2D',
        helper: 'Attempt commission; success replaces advancement this term.',
      }
    }
    if (
      termRolls.value.careerSurvival?.finalSuccess
      && (automaticCommissionConstraint.value || !!termRolls.value.careerCommission || !careerCommissionAvailable.value)
      && !termRolls.value.careerCommission?.finalSuccess
      && !termRolls.value.careerAdvancement
    ) {
      return {
        key: 'roll-advancement',
        label: 'Roll 2D',
        helper: 'Resolve advancement for this term.',
      }
    }
    if (
      termRolls.value.careerAdvancement?.finalSuccess
      && !termRolls.value.careerAdvancementSkill
    ) {
      return {
        key: 'roll-advancement-skill',
        label: 'Roll 1D',
        helper: 'Roll the advancement skill table.',
      }
    }
    if (termRolls.value.careerAdvancement?.finalSuccess && termRolls.value.careerAdvancementSkill && canRerollCreatorAction('roll-advancement-skill')) {
      return makeRerollAction('roll-advancement-skill', 'Roll the advancement skill table again and overwrite the extra skill result.')
    }
    if (
      termRolls.value.careerSurvival?.finalSuccess
      && (automaticCommissionConstraint.value || !!termRolls.value.careerCommission || !careerCommissionAvailable.value)
      && !termRolls.value.careerCommission?.finalSuccess
      && termRolls.value.careerAdvancement
      && canRerollCreatorAction('roll-advancement')
    ) {
      return makeRerollAction('roll-advancement', 'Roll advancement again and overwrite later rank outcomes from this term.')
    }
    if (termRolls.value.careerCommission && !automaticCommissionConstraint.value && canRerollCreatorAction('roll-commission')) {
      return makeRerollAction('roll-commission', 'Roll commission again and overwrite later advancement state from this term.')
    }
    return null
  }

  if (activeTermStep.value === 'aging' && termRolls.value.aging && canRerollCreatorAction('roll-aging')) {
    return makeRerollAction('roll-aging', 'Roll aging again and overwrite the aging outcome for this term.')
  }
  if (activeTermStep.value === 'aging' && !termRolls.value.aging) {
    return {
      key: 'roll-aging',
      label: 'Roll 2D',
      helper: 'Resolve aging for this term.',
    }
  }

  return null
})
const activeStepSecondaryAction = computed<CreatorStepActionDefinition | null>(() => {
  const primaryKey = activeStepPrimaryAction.value?.key
  if (!primaryKey) return null

  const manualMap: Partial<Record<CreatorStepActionKey, CreatorStepActionDefinition>> = {
    'roll-qualification': {
      key: 'manual-qualification',
      label: 'Manual',
      helper: 'Enter the qualification total manually.',
    },
    'roll-parole-threshold': {
      key: 'manual-parole-threshold',
      label: 'Manual',
      helper: 'Enter the threshold manually.',
    },
    'roll-career-skill': {
      key: 'manual-career-skill',
      label: 'Manual',
      helper: 'Enter the 1D result manually.',
    },
    'roll-survival': {
      key: 'manual-survival',
      label: 'Manual',
      helper: 'Enter the survival total manually.',
    },
    'roll-mishap': {
      key: 'manual-mishap',
      label: 'Manual',
      helper: 'Enter the mishap table result manually.',
    },
    'roll-event': {
      key: 'manual-event',
      label: 'Manual',
      helper: 'Enter the event table result manually.',
    },
    'roll-commission': {
      key: 'manual-commission',
      label: 'Manual',
      helper: 'Enter the commission total manually.',
    },
    'roll-advancement': {
      key: 'manual-advancement',
      label: 'Manual',
      helper: 'Enter the advancement total manually.',
    },
    'roll-advancement-skill': {
      key: 'manual-advancement-skill',
      label: 'Manual',
      helper: 'Enter the advancement table result manually.',
    },
    'roll-education-entry': {
      key: 'manual-education-entry',
      label: 'Manual',
      helper: 'Enter the education entry total manually.',
    },
    'roll-pre-career-event': {
      key: 'manual-pre-career-event',
      label: 'Manual',
      helper: 'Enter the pre-career event result manually.',
    },
    'roll-education-graduation': {
      key: 'manual-education-graduation',
      label: 'Manual',
      helper: 'Enter the graduation total manually.',
    },
    'roll-aging': {
      key: 'manual-aging',
      label: 'Manual',
      helper: 'Enter the aging total manually.',
    },
  }

  if (
    ['manual-qualification', 'manual-parole-threshold', 'manual-survival', 'manual-commission', 'manual-advancement', 'manual-education-entry', 'manual-education-graduation'].includes(primaryKey)
  ) return null

  const secondary = manualMap[primaryKey]
  if (!secondary) return null

  if (
    (secondary.key === 'manual-qualification' || secondary.key === 'manual-survival' || secondary.key === 'manual-commission' || secondary.key === 'manual-advancement' || secondary.key === 'manual-education-entry' || secondary.key === 'manual-education-graduation')
    && !gmManualCheckRollEntryEnabled.value
  ) return null
  if (
    (secondary.key === 'manual-career-skill' || secondary.key === 'manual-mishap' || secondary.key === 'manual-event' || secondary.key === 'manual-advancement-skill' || secondary.key === 'manual-pre-career-event' || secondary.key === 'manual-parole-threshold')
    && !gmManualTableRollEntryEnabled.value
  ) return null
  if (secondary.key === 'manual-aging' && !gmManualAgingRollEntryEnabled.value) return null

  return secondary
})
const showActiveStepNextAction = computed(() => {
  if (gmRerollsEnabled.value) return false
  if (!activeCreatorTabIsTerm.value) return false
  if (activeTermStep.value === 'complete') return false
  if (activeStepPrimaryAction.value) return false
  if (!activeTermStepComplete.value) return false
  return canFooterNavigateNext.value
})
const activeStepActionHelper = computed(() => {
  if (activeStepPrimaryAction.value?.helper) return activeStepPrimaryAction.value.helper
  if (activeStepSecondaryAction.value?.helper) return activeStepSecondaryAction.value.helper
  if (showActiveStepNextAction.value) return 'This step is resolved. Continue to the next step.'
  return ''
})
const executeCreatorStepActionByKey = (key: CreatorStepActionKey, reroll = false) => {
  if (!reroll) captureCreatorRerollSnapshot(key)

  switch (key) {
    case 'open-muster-out':
      openMusterOutModal()
      return
    case 'roll-draft':
      triggerRollDraftFallback()
      return
    case 'enter-drifter':
      chooseDrifterFallback()
      return
    case 'roll-qualification':
      triggerRollCheck('careerQualification', 'Qualification', selectedCareer.value.qualification)
      return
    case 'manual-qualification':
      triggerManualCheck('careerQualification', 'Qualification', selectedCareer.value.qualification)
      return
    case 'roll-parole-threshold':
      triggerRollPrisonerParoleThreshold()
      return
    case 'manual-parole-threshold':
      triggerManualPrisonerParoleThreshold()
      return
    case 'apply-basic-training':
      applyBasicTraining()
      return
    case 'roll-career-skill':
      triggerRollCareerSkillTable()
      return
    case 'manual-career-skill':
      triggerManualCareerSkillTable()
      return
    case 'roll-survival':
      triggerRollCheck('careerSurvival', 'Survival', selectedAssignment.value.survival)
      return
    case 'manual-survival':
      triggerManualCheck('careerSurvival', 'Survival', selectedAssignment.value.survival)
      return
    case 'roll-mishap':
      triggerRollCareerMishap()
      return
    case 'manual-mishap':
      triggerManualCareerMishap()
      return
    case 'roll-event':
      triggerRollCareerEvent()
      return
    case 'manual-event':
      triggerManualCareerEvent()
      return
    case 'roll-commission':
      if (selectedCareerCommissionCheck.value) triggerRollCheck('careerCommission', 'Commission', selectedCareerCommissionCheck.value)
      return
    case 'manual-commission':
      if (selectedCareerCommissionCheck.value) triggerManualCheck('careerCommission', 'Commission', selectedCareerCommissionCheck.value)
      return
    case 'roll-advancement':
      triggerRollCheck('careerAdvancement', 'Advancement', selectedAssignment.value.advancement)
      return
    case 'manual-advancement':
      triggerManualCheck('careerAdvancement', 'Advancement', selectedAssignment.value.advancement)
      return
    case 'roll-advancement-skill':
      triggerRollAdvancementSkillTable()
      return
    case 'manual-advancement-skill':
      triggerManualAdvancementSkillTable()
      return
    case 'roll-education-entry':
      if (selectedEducationEntry.value) triggerRollCheck('educationEntry', 'Education Entry', selectedEducationEntry.value)
      return
    case 'manual-education-entry':
      if (selectedEducationEntry.value) triggerManualCheck('educationEntry', 'Education Entry', selectedEducationEntry.value)
      return
    case 'apply-education-skills':
      applyEducationSkills()
      return
    case 'roll-pre-career-event':
      triggerRollPreCareerEvent()
      return
    case 'manual-pre-career-event':
      triggerManualPreCareerEvent()
      return
    case 'roll-education-graduation':
      if (selectedEducation.value?.graduation) triggerRollCheck('educationGraduation', 'Graduation', selectedEducation.value.graduation)
      return
    case 'manual-education-graduation':
      if (selectedEducation.value?.graduation) triggerManualCheck('educationGraduation', 'Graduation', selectedEducation.value.graduation)
      return
    case 'roll-aging':
      triggerRollAging()
      return
    case 'manual-aging':
      triggerManualAging()
      return
  }
}
const executeCreatorStepAction = async (action: CreatorStepActionDefinition) => {
  const key = action.rerollOf ?? action.key
  if (action.rerollOf) {
    if (!restoreCreatorRerollSnapshot(action.rerollOf)) return
    await nextTick()
    executeCreatorStepActionByKey(key, true)
    return
  }

  executeCreatorStepActionByKey(key)
}
const previousTermStep = () => {
  activeTermStep.value = termStepTabs.value[Math.max(0, activeTermStepIndex.value - 1)]?.id ?? 'direction'
  scrollToCreatorNavigation()
}
const nextTermStep = () => {
  activeTermStep.value = termStepTabs.value[Math.min(termStepTabs.value.length - 1, activeTermStepIndex.value + 1)]?.id ?? 'direction'
  scrollToCreatorNavigation()
}
const navigateCreatorShell = (direction: -1 | 1) => {
  const nextIndex = activeCreatorShellIndex.value + direction
  const nextTab = creatorShellTabs.value[nextIndex]
  if (!nextTab) return
  if (nextTab.startsWith('term-')) {
    selectTermTab(Number(nextTab.replace('term-', '')))
  } else {
    activeCreatorTab.value = nextTab
  }
  scrollToCreatorNavigation()
}
const navigateFooter = async (direction: -1 | 1) => {
  if (!activeCreatorTabIsTerm.value) {
    navigateCreatorShell(direction)
    return
  }

  if (direction === -1 && activeTermStepIndex.value > 0) {
    previousTermStep()
    return
  }

  if (direction === 1 && activeTermStepIndex.value < termStepTabs.value.length - 1) {
    nextTermStep()
    return
  }

  const nextIndex = activeCreatorShellIndex.value + direction
  const nextTab = creatorShellTabs.value[nextIndex]
  if (!nextTab) return

  if (nextTab.startsWith('term-')) {
    selectTermTab(Number(nextTab.replace('term-', '')))
    await nextTick()
    activeTermStep.value = direction === -1
      ? (termStepTabs.value[termStepTabs.value.length - 1]?.id ?? 'direction')
      : (termStepTabs.value[0]?.id ?? 'direction')
  } else {
    activeCreatorTab.value = nextTab
  }

  scrollToCreatorNavigation()
}

const creatorRandomDie = () => Math.floor(Math.random() * 6) + 1
const clearCreatorRollModalTimers = () => {
  if (!import.meta.client) return
  if (creatorRollModalTimer.value !== null) window.clearInterval(creatorRollModalTimer.value)
  if (creatorRollModalFinishTimer.value !== null) window.clearTimeout(creatorRollModalFinishTimer.value)
  creatorRollModalTimer.value = null
  creatorRollModalFinishTimer.value = null
}

const closeCreatorRollModal = () => {
  clearCreatorRollModalTimers()
  creatorRollModalOpen.value = false
  creatorRollModalRolling.value = false
}

const closeMusterOutRollModal = () => {
  musterOutRollModalOpen.value = false
}

const startCreatorRollModal = async (title: string, result: string, modifier = 0, total?: number, fixedDice?: number[]) => {
  clearCreatorRollModalTimers()
  if (creatorRollModalOpen.value) {
    creatorRollModalOpen.value = false
    creatorRollModalRolling.value = false
    await nextTick()
  }
  creatorRollModalTitle.value = title
  creatorRollModalResult.value = result
  creatorRollModalModifier.value = modifier
  creatorRollModalOpen.value = true
  creatorRollModalRolling.value = true
  creatorRollModalDiceCount.value = fixedDice && fixedDice.length < 2 ? 1 : (fixedDice?.[1] === 0 ? 1 : 2)
  const finalDice: [number, number] = [
    fixedDice?.[0] ?? creatorRandomDie(),
    creatorRollModalDiceCount.value === 2 ? (fixedDice?.[1] ?? creatorRandomDie()) : 0,
  ]
  const finalTotal = typeof total === 'number'
    ? total
    : finalDice[0] + (creatorRollModalDiceCount.value === 2 ? finalDice[1] : 0) + modifier

  const updateRoll = () => {
    const nextDice: [number, number] = [
      creatorRandomDie(),
      creatorRollModalDiceCount.value === 2 ? creatorRandomDie() : 0,
    ]
    creatorRollModalDice.value = nextDice
    creatorRollModalTotal.value = nextDice[0] + (creatorRollModalDiceCount.value === 2 ? nextDice[1] : 0) + modifier
  }

  updateRoll()
  if (!import.meta.client) {
    creatorRollModalDice.value = finalDice
    creatorRollModalTotal.value = finalTotal
    creatorRollModalRolling.value = false
    return
  }

  creatorRollModalTimer.value = window.setInterval(updateRoll, 90)
  creatorRollModalFinishTimer.value = window.setTimeout(() => {
    clearCreatorRollModalTimers()
    creatorRollModalDice.value = finalDice
    creatorRollModalTotal.value = finalTotal
    creatorRollModalRolling.value = false
  }, 1100)
}

const openEventTextModal = (title: string, text?: string, effects: string[] = []) => {
  if (creatorRollModalOpen.value) closeCreatorRollModal()
  eventTextModalTitle.value = title
  eventTextModalText.value = text?.trim() || 'Full event text has not been entered for this event yet.'
  eventTextModalEffects.value = effects
  eventTextModalOpen.value = true
}

const closeEventTextModal = () => {
  eventTextModalOpen.value = false
}

const handleCreatorRollModalPayload = (payload: {
  title: string
  result: string
  modifier?: number
  total?: number
  dice?: number[]
}) => {
  void startCreatorRollModal(payload.title, payload.result, payload.modifier ?? 0, payload.total, payload.dice)
}

const handleMusterOutRollModalPayload = async (payload: {
  title: string
  resultId: string
  careerName: string
  rollType: 'cash' | 'benefit'
  die: number
  modifier: number
  total: number
  tableRoll: number
  result: string
  options: Array<{ roll: number; cash: number; benefit: string }>
}) => {
  musterOutRollModalOpen.value = false
  musterOutRollModalPayload.value = null
  await nextTick()
  musterOutRollModalPayload.value = payload
  musterOutRollModalOpen.value = true
}

const showRollFromRecord = (roll: { label: string; notes?: string; dm: number; total: number; dice: number[]; finalSuccess?: boolean } | null | undefined, fallbackResult?: string) => {
  if (!roll) return
  const result = fallbackResult || roll.notes || (roll.finalSuccess === undefined ? `${roll.total}` : (roll.finalSuccess ? 'Success' : 'Failure'))
  const dice = roll.dice.length >= 2 ? [roll.dice[0], roll.dice[1]] : [roll.dice[0] ?? creatorRandomDie()]
  void startCreatorRollModal(roll.label, result, roll.dm, roll.total, dice)
}

const triggerRollPsiTest = () => {
  psiTestRerollSnapshot.value = captureCreatorStateSnapshot()
  rollPsiTest()
  showRollFromRecord(psiTestRoll.value, psiScore.value !== null ? `PSI ${psiScore.value}` : 'PSI Test')
}

const rerollPsiTest = async () => {
  if (!restoreCreatorStateSnapshot(psiTestRerollSnapshot.value)) return
  await nextTick()
  triggerRollPsiTest()
}

const triggerManualPsiTest = () => {
  enterManualPsiTest(manualRollTotals.value.psiTest ?? Number.NaN)
  showRollFromRecord(psiTestRoll.value, psiScore.value !== null ? `PSI ${psiScore.value}` : 'PSI Test')
}

const triggerRollCheck = (key: string, label: string, check: Parameters<typeof rollCheck>[2]) => {
  rollCheck(key, label, check)
  showRollFromRecord(termRolls.value[key], termRolls.value[key]?.finalSuccess ? 'Success' : 'Failure')
}

const triggerManualCheck = (key: string, label: string, check: Parameters<typeof rollCheck>[2]) => {
  enterManualCheck(key, label, check)
  showRollFromRecord(termRolls.value[key], termRolls.value[key]?.finalSuccess ? 'Success' : 'Failure')
}

const triggerRollPreCareerEvent = () => {
  rollPreCareerEvent()
  showRollFromRecord(termRolls.value.educationEvent, preCareerEvent.value?.name)
}

const triggerRollDraftFallback = () => {
  rollDraftFallback()
  showRollFromRecord(termRolls.value.draft, termRolls.value.draft?.notes)
}

const triggerManualDraftFallback = () => {
  enterManualDraftFallback()
  showRollFromRecord(termRolls.value.draft, termRolls.value.draft?.notes)
}

const triggerManualPreCareerEvent = () => {
  enterManualPreCareerEvent()
  showRollFromRecord(termRolls.value.educationEvent, preCareerEvent.value?.name)
}

const triggerRollCareerEvent = () => {
  rollCareerEvent()
  showRollFromRecord(termRolls.value.careerEvent, careerEvent.value?.name)
}

const triggerManualCareerEvent = () => {
  enterManualCareerEvent()
  showRollFromRecord(termRolls.value.careerEvent, careerEvent.value?.name)
}

const triggerRollCareerMishap = () => {
  rollCareerMishap()
  showRollFromRecord(termRolls.value.careerMishap, careerMishap.value?.name)
}

const triggerManualCareerMishap = () => {
  enterManualCareerMishap()
  showRollFromRecord(termRolls.value.careerMishap, careerMishap.value?.name)
}

const triggerRollCareerSkillTable = () => {
  rollCareerSkillTable()
  showRollFromRecord(termRolls.value.careerSkill, termRolls.value.careerSkill?.notes)
}

const triggerManualCareerSkillTable = () => {
  enterManualCareerSkillTable()
  showRollFromRecord(termRolls.value.careerSkill, termRolls.value.careerSkill?.notes)
}

const triggerRollAdvancementSkillTable = () => {
  rollAdvancementSkillTable()
  showRollFromRecord(termRolls.value.careerAdvancementSkill, termRolls.value.careerAdvancementSkill?.notes)
}

const triggerManualAdvancementSkillTable = () => {
  enterManualAdvancementSkillTable()
  showRollFromRecord(termRolls.value.careerAdvancementSkill, termRolls.value.careerAdvancementSkill?.notes)
}

const triggerRollPrisonerParoleThreshold = () => {
  rollPrisonerParoleThreshold()
  showRollFromRecord(termRolls.value.prisonerParoleThreshold, prisonerParoleThreshold.value !== null ? `Threshold ${prisonerParoleThreshold.value}` : 'Set')
}

const triggerManualPrisonerParoleThreshold = () => {
  enterManualPrisonerParoleThreshold()
  showRollFromRecord(termRolls.value.prisonerParoleThreshold, prisonerParoleThreshold.value !== null ? `Threshold ${prisonerParoleThreshold.value}` : 'Set')
}

const triggerRollAging = () => {
  rollAging()
  showRollFromRecord(termRolls.value.aging, agingEffect.value ?? 'Aging resolved')
}

const triggerManualAging = () => {
  enterManualAging()
  showRollFromRecord(termRolls.value.aging, agingEffect.value ?? 'Aging resolved')
}

watch([currentTermNumber, selectedTermPath], () => {
  activeTermStep.value = 'direction'
})

watch(termStepTabs, (steps) => {
  if (steps.some((step) => step.id === activeTermStep.value)) return
  activeTermStep.value = steps[steps.length - 1]?.id ?? 'direction'
})

onMounted(() => {
  if (import.meta.client) {
    mobileViewportQuery = window.matchMedia('(max-width: 639px)')
    syncCreatorViewportMode(mobileViewportQuery.matches)
    mobileViewportQuery.addEventListener('change', handleCreatorViewportChange)
  }

  const cachedDraft = loadBuilderDraft<Record<string, unknown>>(
    CHARACTER_CREATOR_DRAFT_CACHE_KEY,
    CHARACTER_CREATOR_DRAFT_CACHE_VERSION,
  )

  if (cachedDraft) {
    characterCreator.$patch((state) => {
      Object.assign(state as any, JSON.parse(JSON.stringify(cachedDraft)))
    })
    characterCreator.characteristicRollSequence = 0
    if (mobileViewportQuery) syncCreatorViewportMode(mobileViewportQuery.matches)
    creatorSaveMessage.value = 'Restored cached character creation draft.'
  }

  creatorRerollSnapshots.value = {}
  psiTestRerollSnapshot.value = null

  characterCreatorDraftRestored.value = true
})

onBeforeUnmount(() => {
  clearCreatorRollModalTimers()
  if (!mobileViewportQuery) return
  mobileViewportQuery.removeEventListener('change', handleCreatorViewportChange)
})

watch(
  () => characterCreator.$state,
  (state) => {
    if (!characterCreatorDraftRestored.value || restartInProgress.value) return
    saveBuilderDraft(
      CHARACTER_CREATOR_DRAFT_CACHE_KEY,
      CHARACTER_CREATOR_DRAFT_CACHE_VERSION,
      JSON.parse(JSON.stringify(state)) as Record<string, unknown>,
    )
  },
  { deep: true },
)

const saveCreatedTraveller = async () => {
  const saved = await travellers.saveCreatorProfile(characterProfile.value)
  creatorSaveMessage.value = `Saved ${saved.identity.name || 'Traveller'}`
  return saved
}

const saveAndOpenCreatedTraveller = async () => {
  const saved = await saveCreatedTraveller()
  if (!saved) return
  clearBuilderDraft(CHARACTER_CREATOR_DRAFT_CACHE_KEY)
  await router.push(`/character/sheet?id=${saved.id}`)
}

const openMusterOutModal = () => {
  musterOutModalOpen.value = true
}

const closeMusterOutModal = () => {
  musterOutModalOpen.value = false
}

const restartCharacterCreation = () => {
  restartInProgress.value = true
  restartConfirmOpen.value = false
  creatorSaveMessage.value = ''
  clearCreatorRollModalTimers()
  closeCreatorRollModal()
  closeEventTextModal()
  dismissAdvancementResult()
  dismissCommissionResult()
  creatorRerollSnapshots.value = {}
  psiTestRerollSnapshot.value = null
  activeCreatorTab.value = 'creation'
  activeTermStep.value = 'direction'
  clearBuilderDraft(CHARACTER_CREATOR_DRAFT_CACHE_KEY)
  resetCreatorState()
  characterCreatorDraftRestored.value = true
  restartInProgress.value = false
}

const requestRestartCharacterCreation = () => {
  if (skipRestartConfirm.value) {
    restartCharacterCreation()
    return
  }
  restartConfirmOpen.value = true
}

const confirmRestartCharacterCreation = () => {
  restartConfirmOpen.value = false
  restartCharacterCreation()
}

const cancelRestartCharacterCreation = () => {
  restartConfirmOpen.value = false
}

if (import.meta.client) {
  skipRestartConfirm.value = window.localStorage.getItem('scoutsuite.skipCharacterRestartConfirm') === 'true'
  watch(skipRestartConfirm, (value) => {
    window.localStorage.setItem('scoutsuite.skipCharacterRestartConfirm', value ? 'true' : 'false')
  })
}
</script>

<template>
  <main class="min-h-screen">
    <CharacterCreatorHeader @restart="requestRestartCharacterCreation" />

    <div class="mx-auto grid w-full max-w-7xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[1fr_24rem] lg:px-10">
      <section class="creator-shell-layout">
        <div ref="creatorNavigationAnchor" class="creator-shell-main rounded-lg border border-zinc-300 bg-white shadow-sm min-h-0">
          <CreatorTabNavigation />

          <div :class="['creator-shell-content p-5', creatorRollModalRolling ? 'creator-shell-content--roll-animating' : '']">
            <CreationStepPanel
              v-if="activeCreatorTabIsSetup"
              :allow-background-skill-collapse="!isMobileViewport"
              :mode="creationStepPanelMode"
            />

            <div v-else-if="activeCreatorTab !== currentTermTabId" class="rounded-lg border border-zinc-300 bg-white p-3 sm:p-5 shadow-sm">
              <div v-if="activeTermHistoryEntry">
                <div class="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 class="text-xl font-semibold">Term {{ activeTermHistoryEntry.termNumber }}</h2>
                    <p class="mt-1 text-sm text-zinc-600">{{ activeTermHistoryEntry.summary }}</p>
                    <div class="mt-3 flex flex-wrap gap-2">
                      <span class="rounded-md border border-cyan-400/20 bg-cyan-950/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-100">
                        {{ activeTermHistoryEntry.path === 'education' ? 'Education History' : 'Career History' }}
                      </span>
                    </div>
                  </div>
                  <span class="rounded-md bg-stone-100 px-3 py-2 text-sm font-semibold text-zinc-700">
                    Age {{ activeTermHistoryEntry.startAge }}-{{ activeTermHistoryEntry.endAge }}
                  </span>
                </div>

                <div v-if="activeTermHistoryEntry.details.length" class="mt-5 grid gap-2 rounded-md bg-stone-50 p-3 text-sm text-zinc-700">
                  <p class="font-semibold text-zinc-900">Term Notes</p>
                  <ul class="grid gap-1">
                    <li
                      v-for="detail in activeTermHistoryEntry.details"
                      :key="`${activeTermHistoryEntry.termNumber}-${detail}`"
                    >
                      {{ detail }}
                    </li>
                  </ul>
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

            <div v-else class="rounded-lg border border-zinc-300 bg-white p-3 sm:p-5 shadow-sm">
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 class="text-xl font-semibold">Term Direction</h2>
              <p class="mt-1 text-sm text-zinc-600">Choose whether this term starts with career entry or pre-career education.</p>
            </div>
            <span class="rounded-md bg-stone-100 px-3 py-2 text-sm font-semibold text-zinc-700">
              Term {{ currentTermNumber }} · Age {{ currentAge }}-{{ endOfTermAge }}
            </span>
          </div>

          <div
            :class="[
              'term-path-slider mt-5',
              selectedTermPath === 'education' ? 'is-education' : 'is-career',
              (!educationAvailable || careerPathLocked) ? 'is-education-disabled' : '',
            ]"
          >
            <span class="term-path-slider__thumb" aria-hidden="true" />
            <button
              :class="[
                'term-path-slider__option',
                selectedTermPath === 'career' ? 'is-active' : '',
              ]"
              type="button"
              @click="selectedTermPath = 'career'"
            >
              Career
            </button>
            <button
              :class="[
                'term-path-slider__option',
                selectedTermPath === 'education' ? 'is-active' : '',
              ]"
              :disabled="!educationAvailable || careerPathLocked"
              type="button"
              @click="selectedTermPath = 'education'"
            >
              Education
            </button>
          </div>

          <div v-if="!isMobileViewport" class="creator-step-strip mt-5">
            <button
              v-for="(step, index) in termStepTabs"
              :key="step.id"
              :class="[
                'creator-step-chip',
                index === termStepTabs.length - 1 ? 'is-terminal' : '',
                activeTermStep === step.id
                  ? 'is-active'
                  : [
                      index < activeTermStepIndex ? 'is-complete' : 'is-upcoming',
                    ]
              ]"
              type="button"
              @click="activeTermStep = step.id"
            >
              <span class="creator-step-chip__label">{{ step.label }}</span>
            </button>
          </div>
          <div
            v-else
            class="creator-step-carousel mt-5"
            @touchstart.passive="handleMobileStepCarouselTouchStart"
            @touchmove="handleMobileStepCarouselTouchMove"
            @touchend="handleMobileStepCarouselTouchEnd"
            @touchcancel="handleMobileStepCarouselTouchEnd"
          >
            <div class="creator-step-carousel__viewport">
              <div class="creator-step-carousel__track">
                <button
                  v-if="mobileStepPrev"
                  class="creator-step-carousel__item is-near"
                  type="button"
                  @click="navigateMobileTermStep('prev')"
                >
                  <Transition
                    :name="mobileStepCarouselTransition === 'forward'
                      ? 'creator-step-carousel-surface-forward'
                      : mobileStepCarouselTransition === 'backward'
                        ? 'creator-step-carousel-surface-backward'
                        : ''"
                    mode="out-in"
                  >
                    <span :key="mobileStepPrev.id" class="creator-step-carousel__surface">
                      <span class="creator-step-carousel__label">{{ mobileStepPrev.label }}</span>
                    </span>
                  </Transition>
                </button>
                <div
                  v-if="mobileStepCurrent"
                  class="creator-step-carousel__current-wrap"
                >
                  <span class="creator-step-carousel__marker creator-step-carousel__marker--left" aria-hidden="true">
                    <AppIcon name="arrow" />
                  </span>
                  <button
                    class="creator-step-carousel__item is-current"
                    type="button"
                  >
                    <Transition
                      :name="mobileStepCarouselTransition === 'forward'
                        ? 'creator-step-carousel-surface-forward'
                        : mobileStepCarouselTransition === 'backward'
                          ? 'creator-step-carousel-surface-backward'
                          : ''"
                      mode="out-in"
                    >
                      <span :key="mobileStepCurrent.id" class="creator-step-carousel__surface">
                        <span class="creator-step-carousel__label">{{ mobileStepCurrent.label }}</span>
                      </span>
                    </Transition>
                  </button>
                  <span class="creator-step-carousel__marker creator-step-carousel__marker--right" aria-hidden="true">
                    <AppIcon name="arrow" />
                  </span>
                </div>
                <button
                  v-if="mobileStepNext"
                  class="creator-step-carousel__item is-near"
                  type="button"
                  @click="navigateMobileTermStep('next')"
                >
                  <Transition
                    :name="mobileStepCarouselTransition === 'forward'
                      ? 'creator-step-carousel-surface-forward'
                      : mobileStepCarouselTransition === 'backward'
                        ? 'creator-step-carousel-surface-backward'
                        : ''"
                    mode="out-in"
                  >
                    <span :key="mobileStepNext.id" class="creator-step-carousel__surface">
                      <span class="creator-step-carousel__label">{{ mobileStepNext.label }}</span>
                    </span>
                  </Transition>
                </button>
              </div>
            </div>
          </div>

          <div class="relative creator-term-stage mt-5">
          <div v-if="pendingSkillChoice?.mode === 'background'" class="rounded-md border border-amber-300 bg-amber-50 p-4">
            <p class="text-sm font-semibold text-amber-950">Pending Skill Choice</p>
            <p class="mt-1 text-sm text-amber-900">{{ pendingSkillChoice.source }}: {{ pendingSkillChoice.label }}</p>
            <div class="mt-3 flex flex-wrap gap-2">
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
          </div>

          <div v-if="selectedTermPath === 'career'" class="mt-5">
            <div
              v-if="educationEntryFailed && !selectedCareerId"
              v-show="activeTermStep === 'direction'"
              class="mb-5 rounded-md border border-amber-300 bg-amber-50 p-4"
            >
              <p class="text-sm font-semibold text-amber-950">Education Entry Failed</p>
              <p class="mt-1 text-sm text-amber-900">
                Pre-career education failed. Select a career to continue this term as a forced career attempt.
              </p>
              <button
                v-if="canRerollCreatorAction('roll-education-entry')"
                class="mt-3 h-9 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
                type="button"
                @click="executeCreatorStepAction(makeRerollAction('roll-education-entry', 'Roll education entry again and reset later education or career progress from this term.'))"
              >
                Re-roll Education Entry
              </button>
            </div>

            <div v-show="activeTermStep === 'direction'" class="grid min-w-0 gap-4 2xl:grid-cols-2">
              <label class="grid min-w-0 gap-2">
                <span class="text-sm font-medium text-zinc-700">Career</span>
                <select
                  v-model="selectedCareerId"
                  class="h-11 min-w-0 max-w-full truncate rounded-md border border-zinc-300 bg-white px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                >
                  <option value="">No Career Selected</option>
                  <option v-for="career in careerOptions" :key="career.id" :disabled="career.disabled" :value="career.id">
                    {{ career.name }}{{ career.disabledReason ? ` - ${career.disabledReason}` : '' }}
                  </option>
                </select>
              </label>
              <label class="grid min-w-0 gap-2">
                <span class="text-sm font-medium text-zinc-700">Assignment</span>
                <select
                  v-model="selectedAssignmentId"
                  class="h-11 min-w-0 max-w-full truncate rounded-md border border-zinc-300 bg-white px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                  :disabled="!selectedCareerId"
                >
                  <option value="">No Assignment Selected</option>
                  <option v-for="assignment in selectedCareer.assignments" :key="assignment.id" :value="assignment.id">
                    {{ assignment.name }}
                  </option>
                </select>
              </label>
            </div>

            <div
              v-if="selectedAssignmentId && selectedAssignmentSkillPreview.length"
              v-show="activeTermStep === 'direction'"
              class="mt-4 rounded-md border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(8,20,35,0.94),rgba(4,10,20,0.96)),linear-gradient(135deg,rgba(34,211,238,0.08),transparent_42%),radial-gradient(circle_at_0_0,rgba(34,211,238,0.12),transparent_8rem)] p-3 shadow-[0_0_0_1px_rgba(34,211,238,0.05),0_14px_28px_rgba(2,6,23,0.18)] sm:p-4"
            >
              <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                <div
                  v-for="entry in selectedAssignmentSkillPreview"
                  :key="`${selectedAssignmentId}-${entry.roll}`"
                  class="rounded-md border border-cyan-400/20 bg-zinc-950/55 px-3 py-2 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.04)]"
                >
                  <div class="flex items-center gap-3">
                    <span class="inline-flex min-w-[2rem] items-center justify-center rounded-md border border-amber-300/35 bg-[linear-gradient(180deg,rgba(118,43,8,0.92),rgba(78,27,8,0.96))] px-2 py-1 text-sm font-extrabold text-amber-100 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_0_14px_rgba(245,158,11,0.16)] [text-shadow:0_1px_0_rgba(92,33,7,0.95),0_0_1px_rgba(255,251,235,0.92),0_0_6px_rgba(252,211,77,0.32)]">
                      {{ entry.roll }}
                    </span>
                    <p class="min-w-0 text-sm font-semibold text-cyan-50">{{ entry.label }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="careerConstraintMessages.length"
              v-show="activeTermStep === 'direction'"
              class="mt-4 rounded-md border border-amber-300/55 bg-[linear-gradient(180deg,rgba(82,43,12,0.94),rgba(56,28,8,0.97)),radial-gradient(circle_at_0_0,rgba(245,158,11,0.12),transparent_10rem)] p-3 text-sm text-amber-50 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_14px_28px_rgba(2,6,23,0.18)] sm:p-4"
            >
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p class="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-200/90">Career Requirement</p>
                  <ul class="mt-2 list-disc space-y-1 pl-5 text-amber-50/95">
                    <li v-for="message in careerConstraintMessages" :key="message">
                      {{ message }}
                    </li>
                  </ul>
                </div>
                <div
                  v-if="psionicsTestingAvailable && !psiTested"
                  class="grid min-w-[14rem] gap-2 rounded-md border border-violet-300/35 bg-zinc-950/35 p-3"
                >
                  <p class="text-xs font-semibold uppercase tracking-wide text-violet-200">PSI Test Available</p>
                  <p class="text-sm text-violet-50/90">
                    Roll 2D {{ formatDm(-psiTermsServed) }} to test PSI and unlock Psion entry.
                  </p>
                  <div v-if="psionicsPermissionSources.length" class="flex flex-wrap gap-2">
                    <span
                      v-for="source in psionicsPermissionSources"
                      :key="`direction-psi-${source}`"
                      class="rounded-md border border-violet-300/25 bg-white/10 px-2 py-1 text-[0.7rem] font-semibold text-violet-100"
                    >
                      {{ source }}
                    </span>
                  </div>
                  <div class="flex flex-wrap items-center gap-2">
                    <button
                      class="h-10 rounded-md border border-violet-300/40 bg-[linear-gradient(180deg,rgba(44,25,94,0.92),rgba(29,17,63,0.96))] px-4 text-sm font-semibold text-violet-50 shadow-[0_0_18px_rgba(168,85,247,0.14)] hover:border-violet-200/55"
                      type="button"
                      @click="gmRerollsEnabled && psiTested && psiTestRerollSnapshot ? rerollPsiTest() : triggerRollPsiTest()"
                    >
                      {{ gmRerollsEnabled && psiTested && psiTestRerollSnapshot ? 'Re-roll PSI 2D' : 'Roll PSI 2D' }}
                    </button>
                    <template v-if="gmManualPsionicsRollEntryEnabled">
                      <input
                        v-model.number="manualRollTotals.psiTest"
                        class="h-10 w-28 rounded-md border border-violet-300/35 bg-white px-3 text-violet-950 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200"
                        max="12"
                        min="2"
                        placeholder="2D total"
                        type="number"
                      >
                      <button
                        class="h-10 rounded-md border border-violet-300/35 bg-white px-3 text-sm font-semibold text-violet-900 hover:border-violet-700"
                        type="button"
                        @click="triggerManualPsiTest"
                      >
                        Manual
                      </button>
                    </template>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="selectedCareerId" v-show="activeTermStep === 'direction'" class="mt-5 grid gap-3 sm:grid-cols-3">
              <div class="rounded-md bg-stone-50 p-4">
                <p class="text-xs font-semibold uppercase tracking-wide text-zinc-500">Qualification</p>
                <p class="mt-2 text-lg font-semibold">{{ automaticCareerEntryConstraint || sameCareerContinuationAvailable ? 'Automatic' : checkLabel(selectedCareer.qualification) }}</p>
                <p v-if="currentCareerQualificationDm" class="mt-1 text-xs text-zinc-500">
                  Career DM {{ formatDm(currentCareerQualificationDm) }}
                </p>
                <p v-if="activeQualificationRollModifierTotal" class="mt-1 text-xs text-amber-700">
                  Active event DM {{ formatDm(activeQualificationRollModifierTotal) }}
                </p>
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
              <div v-if="!careerSelectionComplete && activeTermStep !== 'direction'" class="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
                Select a career and assignment before resolving this step.
              </div>
              <div v-if="requiredDraftAvailable" class="rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-950">
                <div class="flex flex-wrap items-center gap-3">
                  <div>
                    <p class="text-sm font-semibold">Required Draft</p>
                    <p class="mt-1 text-sm">An event requires a Draft roll before this term's career can begin.</p>
                  </div>
                </div>
                <div v-if="gmManualTableRollEntryEnabled" class="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    v-model.number="manualRollTotals.draft"
                    class="h-10 w-24 rounded-md border border-amber-300 bg-white px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                    max="6"
                    min="1"
                    placeholder="1D"
                    type="number"
                  >
                  <button
                    class="h-10 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
                    type="button"
                    @click="enterManualDraftFallback"
                  >
                    Manual
                  </button>
                </div>
              </div>

              <div v-show="activeTermStep === 'qualification'" class="rounded-md border border-zinc-200 p-3 sm:p-4">
                <div class="flex flex-wrap items-center gap-3">
                  <div>
                    <p class="text-sm font-semibold">Qualification Roll</p>
                    <p class="text-sm text-zinc-600">
                      {{
                        automaticCareerEntryConstraint
                          ? automaticCareerEntryConstraint.label
                          : sameCareerContinuationAvailable
                            ? `Continuing ${selectedCareer.name} - ${selectedAssignment.name}`
                            : checkLabel(selectedCareer.qualification)
                      }}
                    </p>
                    <p v-if="currentCareerQualificationDm" class="text-xs text-zinc-500">
                      Previous careers modifier {{ formatDm(currentCareerQualificationDm) }}
                    </p>
                    <p v-if="activeQualificationRollModifierTotal" class="text-xs text-amber-700">
                      Active event modifier {{ formatDm(activeQualificationRollModifierTotal) }}
                    </p>
                  </div>
                </div>
                <div v-if="gmManualCheckRollEntryEnabled && !automaticCareerEntryConstraint && !sameCareerContinuationAvailable && !requiredDraftAvailable" class="mt-3 flex flex-wrap gap-2">
                  <input v-model.number="manualRollTotals.careerQualification" class="h-10 w-28 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="2D total" type="number">
                  <button class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:border-amber-600" type="button" @click="triggerManualCheck('careerQualification', 'Qualification', selectedCareer.qualification)">
                    Manual
                  </button>
                </div>
                <div v-if="activeQualificationRollModifiers.length" class="mt-3 grid gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
                  <p class="font-semibold text-amber-950">Active Qualification Modifiers</p>
                  <div
                    v-for="modifier in activeQualificationRollModifiers"
                    :key="modifier.id"
                    class="rounded-md bg-white px-3 py-2 text-amber-950"
                  >
                    {{ modifier.label }} · DM {{ formatDm(modifier.dm) }}
                  </div>
                </div>
                <div v-if="termRolls.careerQualification" class="mt-3 rounded-md bg-stone-50 p-3 text-sm">
                  <p class="font-semibold">{{ rollSummary(termRolls.careerQualification) }} · {{ termRolls.careerQualification.finalSuccess ? 'Success' : 'Failure' }}</p>
                  <p v-if="termRolls.careerQualification.notes" class="mt-1 text-zinc-600">{{ termRolls.careerQualification.notes }}</p>
                  <button v-if="gmOutcomeOverridesEnabled" class="mt-2 text-xs font-semibold text-amber-700 hover:text-amber-900" type="button" @click="toggleRollOverride('careerQualification')">
                    {{ termRolls.careerQualification.overridden ? 'Remove override' : 'Override outcome' }}
                  </button>
                </div>
                <div v-if="drifterFallbackAvailable" class="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
                  <p class="font-semibold">Qualification failed</p>
                  <p class="mt-1">
                    Use the Draft if available, or enter the Drifter career.
                  </p>
                  <div v-if="draftFallbackAvailable" class="mt-3 flex flex-wrap items-center gap-2">
                    <template v-if="gmManualTableRollEntryEnabled">
                      <input
                        v-model.number="manualRollTotals.draft"
                        class="h-10 w-24 rounded-md border border-amber-300 bg-white px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                        max="6"
                        min="1"
                        placeholder="1D"
                        type="number"
                      >
                      <button
                        class="h-10 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
                        type="button"
                        @click="triggerManualDraftFallback"
                      >
                        Manual
                      </button>
                    </template>
                  </div>
                  <p v-if="draftUsed && !draftFallbackAvailable" class="mt-2 text-xs">
                    Draft has already been used.
                  </p>
                </div>
                <div v-if="draftRoll && termRolls.draft" class="mt-3 rounded-md bg-stone-50 p-3 text-sm">
                  <p class="font-semibold">{{ rollSummary(termRolls.draft) }} · {{ termRolls.draft.notes }}</p>
                </div>
              </div>

              <div v-if="selectedCareerId === 'prisoner' && termRolls.careerQualification?.finalSuccess" v-show="activeTermStep === 'qualification'" class="rounded-md border border-zinc-200 p-3 sm:p-4">
                <div class="flex flex-wrap items-center gap-3">
                  <div>
                    <p class="text-sm font-semibold">Parole Threshold</p>
                    <p class="text-sm text-zinc-600">Roll 1D+2 before resolving the Prisoner term. Advancement must exceed this value to leave prison.</p>
                  </div>
                </div>
                <div v-if="gmManualTableRollEntryEnabled && prisonerParoleThresholdRequired" class="mt-3 flex flex-wrap gap-2">
                  <input
                    v-model.number="manualRollTotals.prisonerParoleThreshold"
                    class="h-10 w-28 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                    max="6"
                    min="1"
                    placeholder="1D"
                    type="number"
                  >
                  <button
                    class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:border-amber-600"
                    type="button"
                    @click="triggerManualPrisonerParoleThreshold"
                  >
                    Manual
                  </button>
                </div>
                <div v-if="prisonerParoleThreshold !== null" class="mt-3 rounded-md bg-stone-50 p-3 text-sm">
                  <p class="font-semibold">Parole Threshold {{ prisonerParoleThreshold }}</p>
                  <p v-if="prisonerParoleThresholdRoll" class="mt-1 text-zinc-600">
                    {{ prisonerParoleThresholdRoll.dice }} + 2 = {{ prisonerParoleThresholdRoll.total }}
                  </p>
                </div>
              </div>

              <div v-if="basicTrainingAvailable" v-show="activeTermStep === 'training'" class="rounded-md border border-zinc-200 p-3 sm:p-4">
                <div class="flex flex-wrap items-start gap-3">
                  <div>
                    <p class="text-sm font-semibold">Basic Training</p>
                    <p class="text-sm text-zinc-600">
                      <template v-if="basicTrainingMode === 'full'">
                        First career: gain all {{ basicTrainingLabel }}.
                      </template>
                      <template v-else>
                        New career: choose one {{ basicTrainingLabel }}.
                      </template>
                    </p>
                  </div>
                </div>

                <div v-if="basicTrainingMode === 'full'" class="mt-4 grid gap-2 sm:grid-cols-2">
                  <div
                    v-for="entry in basicTrainingEntries"
                    :key="entry"
                    class="rounded-md bg-stone-50 px-3 py-2 text-sm text-zinc-800"
                  >
                    {{ entry }}
                  </div>
                </div>
                <div v-else class="mt-4 flex flex-wrap gap-2">
                  <span
                    v-for="entry in basicTrainingOptions"
                    :key="entry"
                    class="rounded-md bg-stone-50 px-3 py-2 text-sm text-zinc-800"
                  >
                    {{ entry }}
                  </span>
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

              <div v-if="termRolls.careerQualification?.finalSuccess && (!basicTrainingRequired || basicTrainingApplied)" v-show="activeTermStep === 'training'" class="rounded-md border border-zinc-200 p-3 sm:p-4">
                <div class="flex flex-wrap items-start gap-3">
                  <div>
                    <p class="text-sm font-semibold">Skill Training</p>
                    <p class="text-sm text-zinc-600">Choose a table, then roll 1D for this term's career skill.</p>
                  </div>
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

                <div v-if="gmManualTableRollEntryEnabled" class="mt-3 flex flex-wrap gap-2">
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
                    @click="triggerManualCareerSkillTable"
                  >
                    Manual
                  </button>
                </div>

                <div v-if="termRolls.careerSkill" class="mt-3 rounded-md bg-stone-50 p-3 text-sm">
                  <p class="font-semibold">{{ rollSummary(termRolls.careerSkill) }} · {{ termRolls.careerSkill.notes }}</p>
                  <p v-if="careerSkillResult" class="mt-1 text-zinc-600">Applied to Current Traveller.</p>
                </div>
              </div>

              <div v-if="termRolls.careerSkill && !pendingSkillChoice" v-show="activeTermStep === 'survival'" class="rounded-md border border-zinc-200 p-3 sm:p-4">
                <div class="flex flex-wrap items-center gap-3">
                  <div>
                    <p class="text-sm font-semibold">Survival Roll</p>
                    <p class="text-sm text-zinc-600">{{ checkLabel(selectedAssignment.survival) }}</p>
                  </div>
                </div>
                <div v-if="gmManualCheckRollEntryEnabled" class="mt-3 flex flex-wrap gap-2">
                  <input v-model.number="manualRollTotals.careerSurvival" class="h-10 w-28 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="2D total" type="number">
                  <button class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:border-amber-600" type="button" @click="triggerManualCheck('careerSurvival', 'Survival', selectedAssignment.survival)">
                    Manual
                  </button>
                </div>
                <div v-if="termRolls.careerSurvival" class="mt-3 rounded-md bg-stone-50 p-3 text-sm">
                  <p class="font-semibold">{{ rollSummary(termRolls.careerSurvival) }} · {{ termRolls.careerSurvival.finalSuccess ? 'Survived' : 'Mishap' }}</p>
                  <p v-if="termRolls.careerSurvival.notes" class="mt-1 text-zinc-600">{{ termRolls.careerSurvival.notes }}</p>
                  <p v-if="!termRolls.careerSurvival.finalSuccess" class="mt-1 text-zinc-600">Roll 1D on the {{ selectedCareer.name }} mishap table.</p>
                  <button v-if="gmOutcomeOverridesEnabled" class="mt-2 text-xs font-semibold text-amber-700 hover:text-amber-900" type="button" @click="toggleRollOverride('careerSurvival')">
                    {{ termRolls.careerSurvival.overridden ? 'Remove override' : 'Override outcome' }}
                  </button>
                </div>
              </div>

              <div
                v-if="activeTermStep === 'event' && !termRolls.careerSurvival"
                class="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
              >
                <p class="font-semibold">Event Pending</p>
                <p class="mt-1">
                  Resolve Survival first. This step will show a career event on success or a mishap on failure.
                </p>
              </div>

              <div v-if="termRolls.careerSurvival && !termRolls.careerSurvival.finalSuccess" v-show="activeTermStep === 'event'" class="rounded-md border border-zinc-200 p-3 sm:p-4">
                <div class="flex flex-wrap items-center gap-3">
                  <div>
                    <p class="text-sm font-semibold">Career Mishap</p>
                    <p class="text-sm text-zinc-600">Roll 1D on the {{ selectedCareer.name }} mishap table.</p>
                  </div>
                </div>
                <div v-if="gmManualTableRollEntryEnabled" class="mt-3 flex flex-wrap gap-2">
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
                    @click="triggerManualCareerMishap"
                  >
                    Manual
                  </button>
                </div>
                <CreatorResolvedEventCard
                  v-if="termRolls.careerMishap && careerMishap"
                  :summary="rollSummary(termRolls.careerMishap)"
                  :event-name="careerMishap.name"
                  :text="careerMishap.text"
                  source-prefix="Career Mishap"
                  @details="openEventTextModal(careerMishap.name, careerMishap.text, (careerMishap.effects ?? []).map((effect) => tableEffectLabel(effect)))"
                  @show-roll="handleCreatorRollModalPayload"
                />
              </div>

              <div v-if="termRolls.careerSurvival?.finalSuccess" v-show="activeTermStep === 'event'" class="rounded-md border border-zinc-200 p-3 sm:p-4">
                <div class="flex flex-wrap items-center gap-3">
                  <div>
                    <p class="text-sm font-semibold">Career Event</p>
                    <p class="text-sm text-zinc-600">Roll 2D on the {{ selectedCareer.name }} events table.</p>
                  </div>
                </div>
                <div v-if="gmManualTableRollEntryEnabled" class="mt-3 flex flex-wrap gap-2">
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
                    @click="triggerManualCareerEvent"
                  >
                    Manual
                  </button>
                </div>
                <CreatorResolvedEventCard
                  v-if="termRolls.careerEvent && careerEvent"
                  :summary="rollSummary(termRolls.careerEvent)"
                  :event-name="careerEvent.name"
                  :text="careerEvent.text"
                  source-prefix="Career Event"
                  @details="openEventTextModal(careerEvent.name, careerEvent.text, (careerEvent.effects ?? []).map((effect) => tableEffectLabel(effect)))"
                  @show-roll="handleCreatorRollModalPayload"
                />
              </div>

              <div
                v-if="activeTermStep === 'advancement' && !termRolls.careerSurvival"
                class="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
              >
                <p class="font-semibold">Rank Pending</p>
                <p class="mt-1">
                  Resolve Survival first. Rank handling opens after the career event is complete.
                </p>
              </div>

              <div
                v-else-if="activeTermStep === 'advancement' && termRolls.careerSurvival?.finalSuccess && !termRolls.careerEvent"
                class="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
              >
                <p class="font-semibold">Rank Pending</p>
                <p class="mt-1">
                  Resolve the career event first.
                  <span v-if="!selectedCareerIsMilitary"> This career has no commission roll; advancement will appear after the event.</span>
                </p>
              </div>

              <div
                v-if="termRolls.careerSurvival?.finalSuccess && termRolls.careerEvent && !pendingEventResolutions.some((resolution) => !resolution.resolved) && selectedCareerCommissionCheck && (careerCommissionAvailable || termRolls.careerCommission || automaticCommissionConstraint)"
                v-show="activeTermStep === 'advancement'"
                class="rounded-md border border-zinc-200 p-3 sm:p-4"
              >
                <div class="flex flex-wrap items-center gap-3">
                  <div>
                    <p class="text-sm font-semibold">Commission Roll</p>
                    <p class="text-sm text-zinc-600">
                      {{ automaticCommissionConstraint ? automaticCommissionConstraint.label : checkLabel(selectedCareerCommissionCheck) }}
                    </p>
                  </div>
                </div>
                <div v-if="gmManualCheckRollEntryEnabled && careerCommissionAvailable && !automaticCommissionConstraint" class="mt-3 flex flex-wrap gap-2">
                  <input v-model.number="manualRollTotals.careerCommission" class="h-10 w-28 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="2D total" type="number">
                  <button class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:border-amber-600" type="button" @click="triggerManualCheck('careerCommission', 'Commission', selectedCareerCommissionCheck)">
                    Manual
                  </button>
                </div>
                <div v-if="termRolls.careerCommission" class="mt-3 rounded-md bg-stone-50 p-3 text-sm">
                  <p class="font-semibold">{{ rollSummary(termRolls.careerCommission) }} · {{ termRolls.careerCommission.finalSuccess ? 'Commissioned' : 'No commission' }}</p>
                  <p v-if="termRolls.careerCommission.finalSuccess" class="mt-1 text-zinc-600">
                    Commission succeeds into officer rank 1 during this commission step.
                    <span v-if="currentCareerOfficerRank?.title"> Current rank: {{ currentCareerOfficerRank.title }}.</span>
                    No advancement roll is made in the same term.
                  </p>
                  <button v-if="gmOutcomeOverridesEnabled" class="mt-2 text-xs font-semibold text-amber-700 hover:text-amber-900" type="button" @click="toggleRollOverride('careerCommission')">
                    {{ termRolls.careerCommission.overridden ? 'Remove override' : 'Override outcome' }}
                  </button>
                </div>
                <div v-if="termRolls.careerCommission && commissionResult" class="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-950">
                  <p class="font-semibold">{{ commissionResult.success ? 'Commission Result' : 'Commission Failed' }}</p>
                  <p class="mt-1">
                    <template v-if="commissionResult.success">
                      <template v-if="commissionResult.newRank !== commissionResult.previousRank">
                        Rank updated from {{ commissionResult.previousTitle }} to {{ commissionResult.newTitle }}.
                      </template>
                      <template v-else>
                        Commission confirmed at {{ commissionResult.newTitle }}.
                      </template>
                    </template>
                    <template v-else>
                      Remains at {{ commissionResult.previousTitle }}.
                    </template>
                  </p>
                  <p v-if="commissionResult.bonus" class="mt-2 text-xs font-semibold text-amber-900">
                    Rank bonus: {{ commissionResult.bonus }}
                  </p>
                </div>
              </div>

              <div
                v-if="(
                  (termRolls.careerSurvival?.finalSuccess && termRolls.careerEvent && !termRolls.careerCommission?.finalSuccess)
                  || (selectedCareerId === 'prisoner' && termRolls.careerSurvival && (!termRolls.careerSurvival.finalSuccess ? termRolls.careerMishap : termRolls.careerEvent))
                ) && !pendingEventResolutions.some((resolution) => !resolution.resolved)"
                v-show="activeTermStep === 'advancement'"
                class="rounded-md border border-zinc-200 p-3 sm:p-4"
              >
                <div class="flex flex-wrap items-center gap-3">
                  <div>
                    <p class="text-sm font-semibold">Advancement Roll</p>
                    <p class="text-sm text-zinc-600">{{ checkLabel(selectedAssignment.advancement) }}</p>
                  </div>
                </div>
                <div v-if="gmManualCheckRollEntryEnabled" class="mt-3 flex flex-wrap gap-2">
                  <input v-model.number="manualRollTotals.careerAdvancement" class="h-10 w-28 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="2D total" type="number">
                  <button class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:border-amber-600" type="button" @click="triggerManualCheck('careerAdvancement', 'Advancement', selectedAssignment.advancement)">
                    Manual
                  </button>
                </div>
                <div v-if="termRolls.careerAdvancement" class="mt-3 rounded-md bg-stone-50 p-3 text-sm">
                  <p class="font-semibold">{{ rollSummary(termRolls.careerAdvancement) }} · {{ termRolls.careerAdvancement.finalSuccess ? 'Advanced' : 'No advancement' }}</p>
                  <p v-if="termRolls.careerAdvancement.notes" class="mt-1 text-zinc-600">{{ termRolls.careerAdvancement.notes }}</p>
                  <p v-if="selectedCareerId === 'prisoner' && prisonerParoleThreshold !== null" class="mt-1 text-zinc-600">
                    {{ termRolls.careerAdvancement.total > prisonerParoleThreshold ? 'Parole threshold exceeded: leave Prisoner after this term.' : 'Parole threshold not exceeded: continue Prisoner next term.' }}
                  </p>
                  <p v-else-if="termRolls.careerAdvancement.dice.reduce((sum, value) => sum + value, 0) === 12" class="mt-1 text-zinc-600">
                    Natural 12: this career must continue next term.
                  </p>
                  <p v-else-if="termRolls.careerAdvancement.total <= careerTermsCompleted + 1" class="mt-1 text-zinc-600">
                    Advancement total is equal to or less than terms spent in this career; this career cannot continue next term.
                  </p>
                  <button v-if="gmOutcomeOverridesEnabled" class="mt-2 text-xs font-semibold text-amber-700 hover:text-amber-900" type="button" @click="toggleRollOverride('careerAdvancement')">
                    {{ termRolls.careerAdvancement.overridden ? 'Remove override' : 'Override outcome' }}
                  </button>
                </div>
                <div v-if="termRolls.careerAdvancement && advancementResult" class="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-950">
                  <p class="font-semibold">{{ advancementResult.success ? 'Advancement Result' : 'Advancement Failed' }}</p>
                  <p class="mt-1">
                    <template v-if="advancementResult.success">
                      Rank updated from {{ advancementResult.previousTitle }} to {{ advancementResult.newTitle }}.
                    </template>
                    <template v-else>
                      Remains at {{ advancementResult.previousTitle }}.
                    </template>
                  </p>
                  <p v-if="advancementResult.bonus" class="mt-2 text-xs font-semibold text-amber-900">
                    Rank bonus: {{ advancementResult.bonus }}
                  </p>
                </div>
              </div>

              <div v-if="termRolls.careerAdvancement?.finalSuccess" v-show="activeTermStep === 'advancement'" class="rounded-md border border-zinc-200 p-3 sm:p-4">
                <div class="flex flex-wrap items-start gap-3">
                  <div>
                    <p class="text-sm font-semibold">Advancement Skill Roll</p>
                    <p class="text-sm text-zinc-600">Successful advancement grants one extra roll on an available skill table.</p>
                  </div>
                </div>

                <div class="mt-4 grid gap-3 lg:grid-cols-[16rem_1fr]">
                  <label class="grid h-fit gap-2">
                    <span class="text-xs font-semibold uppercase tracking-wide text-zinc-500">Skill Table</span>
                    <select
                      v-model="selectedAdvancementSkillTableId"
                      class="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                      :disabled="!!termRolls.careerAdvancementSkill"
                    >
                      <option v-for="table in availableCareerSkillTables" :key="table.id" :value="table.id">
                        {{ table.label }}
                      </option>
                    </select>
                  </label>

                  <div class="grid gap-2 sm:grid-cols-2">
                    <div
                      v-for="(entry, index) in selectedAdvancementSkillEntries"
                      :key="`advancement-${selectedAdvancementSkillTableId}-${index}`"
                      class="flex items-center justify-between gap-3 rounded-md bg-stone-50 px-3 py-2 text-sm"
                    >
                      <span class="font-semibold text-zinc-500">{{ index + 1 }}</span>
                      <span class="text-right text-zinc-800">{{ entry }}</span>
                    </div>
                  </div>
                </div>

                <div v-if="gmManualTableRollEntryEnabled" class="mt-3 flex flex-wrap gap-2">
                  <input
                    v-model.number="manualRollTotals.careerAdvancementSkill"
                    class="h-10 w-28 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                    :disabled="!!termRolls.careerAdvancementSkill"
                    max="6"
                    min="1"
                    placeholder="1D"
                    type="number"
                  >
                  <button
                    class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:border-amber-600 disabled:cursor-not-allowed disabled:text-zinc-400"
                    :disabled="!!termRolls.careerAdvancementSkill"
                    type="button"
                    @click="triggerManualAdvancementSkillTable"
                  >
                    Manual
                  </button>
                </div>

                <div v-if="termRolls.careerAdvancementSkill" class="mt-3 rounded-md bg-stone-50 p-3 text-sm">
                  <p class="font-semibold">{{ rollSummary(termRolls.careerAdvancementSkill) }} · {{ termRolls.careerAdvancementSkill.notes }}</p>
                  <p v-if="!pendingSkillChoice || pendingSkillChoice.mode === 'background'" class="mt-1 text-zinc-600">Applied to Current Traveller.</p>
                </div>
              </div>
            </div>
          </div>

          <div
            v-else
            :class="[
              'mt-5 grid gap-4',
              activeTermStep === 'direction' ? 'lg:grid-cols-[18rem_1fr]' : '',
            ]"
          >
            <div
              v-if="educationEntryFailed"
              class="rounded-md border border-amber-300 bg-amber-50 p-4 lg:col-span-2"
            >
              <p class="text-sm font-semibold text-amber-950">Education Entry Failed</p>
              <p class="mt-1 text-sm text-amber-900">
                This term now continues as a forced career attempt. The failed education entry roll remains in this term’s history.
              </p>
              <button
                v-if="canRerollCreatorAction('roll-education-entry')"
                class="mt-3 h-9 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
                type="button"
                @click="executeCreatorStepAction(makeRerollAction('roll-education-entry', 'Roll education entry again and reset later education or career progress from this term.'))"
              >
                Re-roll Education Entry
              </button>
            </div>

            <div v-show="activeTermStep === 'direction'" class="grid gap-3 lg:col-span-2">
              <div class="grid h-fit gap-2">
                <span class="text-sm font-medium text-zinc-700">Education</span>
                <div class="mx-auto grid w-full max-w-[24rem] gap-3">
                  <select
                    v-model="selectedEducationId"
                    class="h-11 rounded-md border border-zinc-300 bg-white px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                  >
                    <option value="">No Education Selected</option>
                    <option v-for="option in educationOptions" :key="option.id" :value="option.id">
                      {{ option.name }}
                    </option>
                  </select>

                  <div
                    v-if="selectedEducationDirectionTargets.length"
                    class="grid gap-2"
                  >
                    <div
                      v-for="target in selectedEducationDirectionTargets.filter((target) => target.id === 'entry')"
                      :key="target.id"
                      class="rounded-md border border-cyan-400/20 bg-zinc-950/60 px-3 py-2 shadow-[0_0_0_1px_rgba(34,211,238,0.04)]"
                    >
                      <p class="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-cyan-200/75">
                        {{ target.label }}
                      </p>
                      <p class="mt-1 text-sm font-semibold text-cyan-50">
                        {{ target.value }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-if="selectedEducationDirectionTargets.length"
                class="mx-auto grid w-full max-w-[24rem] gap-2"
              >
                <div
                  v-for="target in selectedEducationDirectionTargets.filter((target) => target.id !== 'entry')"
                  :key="target.id"
                  class="rounded-md border border-cyan-400/20 bg-zinc-950/60 px-3 py-2 shadow-[0_0_0_1px_rgba(34,211,238,0.04)]"
                >
                  <p class="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-cyan-200/75">
                    {{ target.label }}
                  </p>
                  <p class="mt-1 text-sm font-semibold text-cyan-50">
                    {{ target.value }}
                  </p>
                </div>
              </div>
            </div>

            <div
              v-if="selectedEducation && selectedEducationEntry && !educationEntryFailed"
              v-show="activeTermStep !== 'direction'"
              class="grid gap-3"
            >
              <div
                v-show="activeTermStep === 'education-entry'"
                :class="[
                  'grid gap-3',
                  'xl:grid-cols-2 xl:items-stretch',
                ]"
              >
                <div v-show="activeTermStep === 'education-entry'" class="flex h-full flex-col rounded-md border border-zinc-200 p-3 sm:p-4">
                  <div class="flex flex-wrap items-center gap-3">
                    <div>
                      <p class="text-sm font-semibold">Entry Roll</p>
                      <p class="text-sm text-zinc-600">{{ checkLabel(selectedEducationEntry) }}</p>
                    </div>
                  </div>
                  <div
                    v-if="activeEducationEntryModifiers.length"
                    :class="[
                      'mt-3 flex flex-wrap gap-2',
                      activeEducationEntryModifiers.length === 1 ? 'justify-center' : '',
                    ]"
                  >
                    <span
                      v-for="modifier in activeEducationEntryModifiers"
                      :key="modifier.condition"
                      class="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900"
                    >
                      {{ educationEntryModifierWarningLabel(modifier) }}
                    </span>
                  </div>
                  <div v-if="gmManualCheckRollEntryEnabled" class="mt-3 flex flex-wrap gap-2">
                    <input v-model.number="manualRollTotals.educationEntry" class="h-10 w-28 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="2D total" type="number">
                    <button class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:border-amber-600" type="button" @click="triggerManualCheck('educationEntry', 'Education Entry', selectedEducationEntry)">
                      Manual
                    </button>
                  </div>
                  <div v-if="termRolls.educationEntry" class="mt-3 rounded-md bg-stone-50 p-3 text-sm">
                    <p class="font-semibold">{{ rollSummary(termRolls.educationEntry) }} · {{ termRolls.educationEntry.finalSuccess ? 'Entered' : 'Failed entry' }}</p>
                    <p v-if="!termRolls.educationEntry.finalSuccess" class="mt-1 text-zinc-600">Failed entry has moved this term to a career attempt.</p>
                    <button v-if="gmOutcomeOverridesEnabled" class="mt-2 text-xs font-semibold text-amber-700 hover:text-amber-900" type="button" @click="toggleRollOverride('educationEntry')">
                      {{ termRolls.educationEntry.overridden ? 'Remove override' : 'Override outcome' }}
                    </button>
                  </div>
                </div>
                <div class="flex h-full flex-col rounded-md bg-stone-50 p-4">
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

              <div
                v-if="termRolls.educationEntry?.finalSuccess"
                v-show="activeTermStep === 'education-skills'"
                class="grid gap-3 xl:col-start-1 xl:row-start-2"
              >
                <div class="rounded-md border border-zinc-200 p-3 sm:p-4">
                  <p class="text-sm font-semibold text-zinc-900">Skills</p>
                  <p v-if="selectedEducation.id === 'university'" class="mt-2 text-sm leading-6 text-zinc-600">
                    Choose one listed skill at level 0 and one listed skill at level 1.
                  </p>
                  <p v-else class="mt-2 text-sm leading-6 text-zinc-600">
                    Gain the matching military career service skills at level 0.
                  </p>
                  <div v-if="selectedEducation.id === 'university'" class="mt-3 grid gap-3 sm:grid-cols-2">
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
                    <div class="flex flex-wrap justify-center gap-2 text-center sm:col-span-2">
                      <span
                        v-if="universityLevel0Skill"
                        class="rounded-full border border-cyan-400/25 bg-cyan-950/40 px-3 py-1 text-xs font-semibold text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.05)]"
                      >
                        Level 0: {{ skillOptionLabel(universityLevel0Skill) }}
                      </span>
                      <span
                        v-if="universityLevel1Skill"
                        class="rounded-full border border-cyan-400/25 bg-cyan-950/40 px-3 py-1 text-xs font-semibold text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.05)]"
                      >
                        Level 1: {{ skillOptionLabel(universityLevel1Skill) }}
                      </span>
                    </div>
                  </div>
                  <div v-else class="mt-3 flex flex-wrap justify-center gap-2 text-center">
                    <span
                      v-for="skill in militaryAcademyServiceSkills"
                      :key="skill"
                      class="rounded-full border border-cyan-400/25 bg-cyan-950/40 px-3 py-1 text-xs font-semibold text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.05)]"
                    >
                      {{ skill }}
                    </span>
                  </div>
                  <div v-if="pendingEducationSkillChoices.length" class="mt-3 grid gap-2 rounded-md bg-amber-50 p-3 text-sm text-center">
                    <div
                      v-for="(choiceGroup, index) in pendingEducationSkillChoices"
                      :key="choiceGroup.label"
                      class="flex flex-wrap items-center justify-center gap-3"
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
                  <p v-if="educationSkillsApplied" class="mt-3 rounded-md bg-stone-50 p-3 text-center text-sm font-semibold text-zinc-700">
                    Education skills applied to Current Traveller.
                  </p>
                </div>
              </div>

              <div
                v-show="activeTermStep === 'education-graduation'"
                class="grid gap-3"
              >
                <div class="grid gap-3 lg:grid-cols-3">
                  <div class="rounded-md border border-zinc-200 bg-stone-50 p-4">
                    <p class="text-xs font-semibold uppercase tracking-wide text-zinc-500">Graduation</p>
                    <p class="mt-2 text-lg font-semibold text-zinc-900">{{ checkLabel(selectedEducation.graduation) }}</p>
                  </div>
                  <div class="rounded-md border border-zinc-200 bg-stone-50 p-4">
                    <p class="text-xs font-semibold uppercase tracking-wide text-zinc-500">Honours</p>
                    <p class="mt-2 text-lg font-semibold text-zinc-900">{{ selectedEducation.graduation.honoursTarget }}+</p>
                  </div>
                  <div
                    class="rounded-md border border-zinc-200 bg-stone-50 p-4"
                    :class="selectedEducation.graduation.modifiers?.length ? '' : 'lg:col-span-1'"
                  >
                    <p class="text-xs font-semibold uppercase tracking-wide text-zinc-500">Modifiers</p>
                    <div v-if="selectedEducation.graduation.modifiers?.length" class="mt-3 flex flex-wrap gap-2">
                      <span
                        v-for="modifier in selectedEducation.graduation.modifiers"
                        :key="modifier.condition"
                        class="rounded-full border border-cyan-400/20 bg-cyan-950/50 px-3 py-1 text-xs font-semibold text-cyan-100"
                      >
                        {{ modifierLabel(modifier) }}
                      </span>
                    </div>
                    <p v-else class="mt-2 text-sm text-zinc-600">No graduation modifiers.</p>
                  </div>
                  <div class="rounded-md border border-zinc-200 bg-stone-50 p-4 lg:col-span-3">
                    <p class="text-sm font-semibold text-zinc-900">Graduation Benefits</p>
                    <div class="mt-3 grid gap-2 md:grid-cols-2">
                      <div
                        v-for="benefit in (selectedEducationTableOption?.graduationBenefits ?? selectedEducation.graduationBenefits)"
                        :key="benefit.type"
                        class="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
                      >
                        {{ educationBenefitLabel(benefit) }}
                      </div>
                    </div>
                    <div v-if="pendingEducationSkillChoices.length" class="mt-3 grid gap-2 rounded-md bg-amber-50 p-3 text-sm text-center">
                      <div
                        v-for="(choiceGroup, index) in pendingEducationSkillChoices"
                        :key="`graduation-${choiceGroup.label}-${index}`"
                        class="flex flex-wrap items-center justify-center gap-3"
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
                  </div>
                </div>
              </div>

              <div
                :class="[
                  'grid gap-3',
                  activeTermStep === 'education-entry' ? 'xl:col-start-1 xl:row-start-1' : '',
                ]"
              >
                <div v-if="termRolls.educationEntry?.finalSuccess && educationSkillsApplied" v-show="activeTermStep === 'education-event'" class="rounded-md border border-zinc-200 p-3 sm:p-4">
                  <div class="flex flex-wrap items-center gap-3">
                    <div>
                      <p class="text-sm font-semibold">Pre-Career Event</p>
                      <p class="text-sm text-zinc-600">Roll 2D on the pre-career events table.</p>
                    </div>
                  </div>
                  <div v-if="gmManualTableRollEntryEnabled" class="mt-3 flex flex-wrap gap-2">
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
                      @click="triggerManualPreCareerEvent"
                    >
                      Manual
                    </button>
                  </div>
                  <CreatorResolvedEventCard
                    v-if="termRolls.educationEvent && preCareerEvent"
                    :summary="rollSummary(termRolls.educationEvent)"
                    :event-name="preCareerEvent.name"
                    :text="preCareerEvent.text"
                    source-prefix="Pre-Career Event"
                    @details="openEventTextModal(preCareerEvent.name, preCareerEvent.text, (preCareerEvent.effects ?? []).map((effect) => preCareerEventEffectLabel(effect)))"
                    @show-roll="handleCreatorRollModalPayload"
                  />
                </div>

                <div v-if="termRolls.educationEntry?.finalSuccess && termRolls.educationEvent" v-show="activeTermStep === 'education-graduation'" class="rounded-md border border-zinc-200 p-3 sm:p-4">
                  <div class="flex flex-wrap items-center gap-3">
                    <div>
                      <p class="text-sm font-semibold">Graduation Roll</p>
                      <p class="text-sm text-zinc-600">Resolve graduation for the selected education path.</p>
                    </div>
                  </div>
                  <div v-if="gmManualCheckRollEntryEnabled" class="mt-3 flex flex-wrap gap-2">
                    <input v-model.number="manualRollTotals.educationGraduation" class="h-10 w-28 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="2D total" type="number">
                    <button class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:border-amber-600" type="button" @click="triggerManualCheck('educationGraduation', 'Graduation', selectedEducation.graduation)">
                      Manual
                    </button>
                  </div>
                  <div v-if="termRolls.educationGraduation" class="mt-3 rounded-md bg-stone-50 p-3 text-sm">
                    <p class="font-semibold">
                      {{ rollSummary(termRolls.educationGraduation) }} ·
                      {{ termRolls.educationGraduation.finalSuccess ? educationGraduationHonours ? 'Graduated with Honours' : 'Graduated' : 'Did not graduate' }}
                    </p>
                    <p v-if="termRolls.educationGraduation.notes" class="mt-1 text-zinc-600">{{ termRolls.educationGraduation.notes }}</p>
                    <div v-if="educationGraduationFailureNotes.length && !termRolls.educationGraduation.finalSuccess" class="mt-3 grid gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-950">
                      <p
                        v-for="note in educationGraduationFailureNotes"
                        :key="note"
                        class="text-sm"
                      >
                        {{ note }}
                      </p>
                    </div>
                    <button v-if="gmOutcomeOverridesEnabled" class="mt-2 text-xs font-semibold text-amber-700 hover:text-amber-900" type="button" @click="toggleRollOverride('educationGraduation')">
                      {{ termRolls.educationGraduation.overridden ? 'Remove override' : 'Override outcome' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div v-if="agingRequired" v-show="activeTermStep === 'aging'" class="mt-5 rounded-md border border-amber-300 bg-amber-50 p-4">
            <div class="flex flex-wrap items-center gap-3">
              <div>
                <p class="text-sm font-semibold text-amber-950">Aging Roll</p>
                <p class="text-sm text-amber-900">Roll 2D with DM {{ formatDm(-currentTermNumber) }} at the end of term {{ currentTermNumber }}.</p>
              </div>
            </div>
            <div v-if="gmManualAgingRollEntryEnabled" class="mt-3 flex flex-wrap gap-2">
              <input v-model.number="manualRollTotals.aging" class="h-10 w-28 rounded-md border border-amber-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="2D total" type="number">
              <button class="h-10 rounded-md border border-amber-400 px-3 text-sm font-semibold text-amber-950 hover:border-amber-700" type="button" @click="triggerManualAging">
                Manual
              </button>
            </div>
            <div v-if="termRolls.aging" class="mt-3 rounded-md bg-white p-3 text-sm">
              <p class="font-semibold">{{ rollSummary(termRolls.aging) }} · {{ agingEffect }}</p>
              <p class="mt-1 text-zinc-600">Resolve any characteristic reductions below.</p>
              <EventResolutionList source-prefix="Aging" @show-roll="handleCreatorRollModalPayload" />
            </div>
          </div>

          <div v-show="activeTermStep === 'complete'">
            <PsionicsPanel :roll-modal-open="creatorRollModalOpen" @roll-result="handleCreatorRollModalPayload" />

            <TermActionFooter />

            <p v-if="lifepathComplete && creatorSaveMessage" class="mt-5 rounded-md border border-emerald-300/30 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-100">
              {{ creatorSaveMessage }}
            </p>
          </div>

          <div class="mt-6">
          <div
            v-if="activeStepPrimaryAction || activeStepSecondaryAction || showActiveStepNextAction"
            class="creator-step-action-rail"
          >
            <div class="creator-step-action-rail__copy">
              <p class="creator-step-action-rail__label">Current Step Action</p>
              <p class="creator-step-action-rail__helper">
                {{ activeStepActionHelper }}
              </p>
            </div>
            <div class="creator-step-action-rail__actions">
              <button
                v-if="activeStepSecondaryAction"
                class="creator-step-action-rail__button creator-step-action-rail__button--secondary"
                type="button"
                @click="executeCreatorStepAction(activeStepSecondaryAction)"
              >
                {{ activeStepSecondaryAction.label }}
              </button>
              <button
                v-if="activeStepPrimaryAction"
                class="creator-step-action-rail__button creator-step-action-rail__button--primary"
                type="button"
                @click="executeCreatorStepAction(activeStepPrimaryAction)"
              >
                {{ activeStepPrimaryAction.label }}
              </button>
              <button
                v-else-if="showActiveStepNextAction"
                class="creator-step-action-rail__button creator-step-action-rail__button--primary"
                type="button"
                @click="navigateFooter(1)"
              >
                Next
              </button>
            </div>
          </div>
          </div>

          <div
            v-if="musteringOutStarted && !musterOutModalOpen"
            class="creator-term-stage__overlay absolute inset-0 z-20 grid place-items-center rounded-lg"
          >
            <div class="mx-4 w-full max-w-lg rounded-lg border border-cyan-400/25 bg-[linear-gradient(180deg,rgba(8,21,34,0.98),rgba(5,14,25,0.98)),linear-gradient(135deg,rgba(34,211,238,0.08),rgba(245,158,11,0.06))] p-5 text-center text-cyan-50 shadow-[0_0_0_1px_rgba(34,211,238,0.05),0_20px_40px_rgba(2,6,23,0.4)]">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/70">Muster Out In Progress</p>
              <h2 class="mt-2 text-2xl font-semibold">Return to Muster Out</h2>
              <p class="mt-2 text-sm leading-6 text-cyan-100/75">
                You can still move between term steps to review the build, but character creation is now in its final muster-out phase.
              </p>
              <button
                class="mt-4 h-11 rounded-md border border-cyan-300/30 bg-cyan-400/10 px-4 text-sm font-semibold text-cyan-50 hover:border-cyan-300 hover:bg-cyan-400/15"
                title="Mustering out has started. Return to the muster-out flow to finish benefit rolls and save this traveller."
                type="button"
                @click="openMusterOutModal"
              >
                Return to Muster Out
              </button>
            </div>
          </div>
          </div>

        </div>
        <div class="creator-shell-footer rounded-lg border border-cyan-400/20 bg-zinc-950/55 p-3 shadow-[0_0_0_1px_rgba(34,211,238,0.05),0_18px_32px_rgba(2,6,23,0.28)]">
          <button
            class="creator-shell-footer__restart"
            aria-label="Restart Character"
            title="Restart Character"
            type="button"
            @click="requestRestartCharacterCreation"
          >
            <span class="creator-shell-footer__restart-icon">
              <AppIcon name="restart" />
            </span>
            <span class="creator-shell-footer__restart-label">Restart Character</span>
          </button>
          <div class="creator-shell-footer__nav">
            <button
              class="creator-shell-footer__text-button"
              :disabled="!canFooterNavigatePrev"
              aria-label="Previous"
              title="Previous"
              type="button"
              @click="navigateFooter(-1)"
            >
              Prev
            </button>
            <button
              class="creator-shell-footer__text-button"
              :disabled="!canFooterNavigateNext"
              aria-label="Next"
              title="Next"
              type="button"
              @click="navigateFooter(1)"
            >
              Next
            </button>
          </div>
        </div>
          </div>
        </div>
      </section>

      <section class="current-traveller-shell">
        <CurrentTravellerCard />
      </section>
    </div>

    <RerollConfirmDialog />

    <DiceRollModal
      :open="creatorRollModalOpen"
      :rolling="creatorRollModalRolling"
      :title="creatorRollModalTitle"
      :modifier="creatorRollModalModifier"
      :dice="creatorRollModalDice"
      :dice-count="creatorRollModalDiceCount"
      :total="creatorRollModalTotal"
      :result="creatorRollModalResult"
      @close="closeCreatorRollModal"
    />

    <Transition name="creator-roll-fade">
      <div
        v-if="eventTextModalOpen"
        class="creator-roll-modal fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/60 px-4 py-8 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        @click.self="closeEventTextModal"
      >
        <div class="creator-roll-modal__panel creator-roll-modal__panel--event w-full max-w-2xl overflow-hidden">
          <div class="creator-roll-modal__header">
            <div>
              <p class="creator-roll-modal__kicker">Event Details</p>
              <h2 class="creator-roll-modal__title">{{ eventTextModalTitle }}</h2>
            </div>
            <button
              class="creator-roll-modal__close"
              type="button"
              aria-label="Close event details"
              @click="closeEventTextModal"
            >
              <AppIcon name="close" />
              <span class="creator-roll-modal__close-label">Close</span>
            </button>
          </div>

          <div class="creator-roll-modal__body creator-roll-modal__body--event">
            <p class="creator-roll-modal__event-text">{{ eventTextModalText }}</p>
            <div v-if="eventTextModalEffects.length" class="creator-roll-modal__effects">
              <div
                v-for="effect in eventTextModalEffects"
                :key="`${eventTextModalTitle}-${effect}`"
                class="creator-roll-modal__effect"
              >
                {{ effect }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="creator-roll-fade">
      <div
        v-if="musterOutModalOpen && lifepathComplete"
        class="fixed inset-0 z-[58] flex items-start justify-center overflow-y-auto bg-zinc-950/70 px-4 pb-6 pt-20 backdrop-blur-sm md:pb-8 md:pt-24"
        role="dialog"
        aria-modal="true"
        @click.self="closeMusterOutModal"
      >
        <div class="flex max-h-[calc(100vh-8rem)] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-cyan-400/25 bg-zinc-950 text-cyan-50 shadow-[0_0_0_1px_rgba(34,211,238,0.06),0_24px_60px_rgba(2,6,23,0.45)] md:max-h-[calc(100vh-9rem)]">
          <div class="flex flex-wrap items-start justify-between gap-4 border-b border-cyan-400/15 bg-[linear-gradient(135deg,rgba(8,47,73,0.44),rgba(2,6,23,0.96))] px-5 py-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/70">Mustering Out</p>
              <h2 class="mt-2 text-2xl font-semibold">Finalize this traveller</h2>
              <p class="mt-2 text-sm text-cyan-100/75">
                Resolve remaining benefit rolls, review the ledger, then save and open the character sheet.
              </p>
            </div>
            <button
              class="creator-roll-modal__close"
              type="button"
              aria-label="Close Muster Out"
              @click="closeMusterOutModal"
            >
              <AppIcon name="close" />
              <span class="creator-roll-modal__close-label">Close</span>
            </button>
          </div>

          <MusterOutPanel
            :save-message="creatorSaveMessage"
            @show-mustering-roll="handleMusterOutRollModalPayload"
            @show-roll="handleCreatorRollModalPayload"
            @save-open="saveAndOpenCreatedTraveller"
          />
        </div>
      </div>
    </Transition>

    <MusterOutRollModal
      :open="musterOutRollModalOpen"
      :payload="musterOutRollModalPayload"
      @close="closeMusterOutRollModal"
    />

    <div
      v-if="restartConfirmOpen"
      class="fixed inset-0 z-50 grid place-items-center bg-zinc-950/60 px-4 py-8"
      role="dialog"
      aria-modal="true"
    >
      <div class="w-full max-w-lg rounded-lg border border-amber-300 bg-zinc-950 p-5 text-cyan-50 shadow-2xl">
        <div>
          <p class="hud-kicker text-xs font-semibold uppercase tracking-wide">Restart Character</p>
          <h2 class="mt-2 text-2xl font-semibold">Clear this in-progress character?</h2>
          <p class="mt-2 text-sm leading-6 text-cyan-100/80">
            This clears the cached character creator draft and resets the creator to a blank state.
          </p>
        </div>

        <label class="mt-5 flex items-center gap-3 rounded-md border border-amber-300/40 bg-amber-50/10 px-3 py-2 text-sm font-semibold text-amber-100">
          <input
            v-model="skipRestartConfirm"
            class="h-4 w-4 rounded border-amber-300 bg-zinc-950 text-amber-400"
            type="checkbox"
          >
          <span>Don't ask me again for character restarts</span>
        </label>

        <div class="mt-5 flex flex-wrap justify-end gap-2">
          <button
            class="h-10 rounded-md border border-cyan-300/40 px-4 text-sm font-semibold text-cyan-50 hover:border-cyan-300"
            type="button"
            @click="cancelRestartCharacterCreation"
          >
            Cancel
          </button>
          <button
            class="h-10 rounded-md border border-amber-300 bg-amber-400 px-4 text-sm font-semibold text-zinc-950 hover:bg-amber-300"
            type="button"
            @click="confirmRestartCharacterCreation"
          >
            Restart Character
          </button>
        </div>
      </div>
    </div>

    <Transition name="advancement-fade">
      <div
        v-if="pendingSkillChoice && pendingSkillChoice.mode !== 'background' && !creatorRollModalOpen"
        class="fixed inset-0 z-[56] grid place-items-center bg-zinc-950/45 px-4 py-8"
        role="dialog"
        aria-modal="true"
      >
        <div class="w-full max-w-lg lg:min-w-[24rem] lg:w-fit lg:max-w-[calc(100vw-4rem)] rounded-lg border border-amber-300 bg-amber-50 p-5 text-amber-950 shadow-2xl">
          <div>
            <p class="text-sm font-semibold text-amber-950">Pending Skill Choice</p>
            <h2 class="mt-2 text-2xl font-semibold">{{ pendingSkillChoice.label }}</h2>
            <p class="mt-2 text-sm leading-6 text-amber-900">
              {{ pendingSkillChoice.source }}
            </p>
          </div>

          <div class="mt-5 grid gap-2 lg:[grid-template-columns:repeat(4,max-content)] lg:justify-start">
            <button
              v-for="choice in pendingSkillChoice.options"
              :key="choice"
              class="h-10 rounded-md border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-900 hover:border-amber-600"
              type="button"
              @click="resolvePendingSkillChoice(choice)"
            >
              {{ skillOptionLabel(choice) }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="advancement-fade">
      <div
        v-if="commissionResultOpen && commissionResult && !creatorRollModalOpen"
        class="fixed inset-0 z-[55] grid place-items-center bg-zinc-950/45 px-4 py-8"
        role="dialog"
        aria-modal="true"
        @click.self="dismissCommissionResult"
      >
        <div class="w-full max-w-xl rounded-lg border border-zinc-200 bg-white p-5 shadow-2xl">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {{ commissionResult.careerName }}
              </p>
              <h2 class="mt-1 text-2xl font-semibold text-zinc-950">
                {{ commissionResult.success ? 'Commission Earned' : 'No Commission' }}
              </h2>
              <p class="mt-2 text-sm text-zinc-600">
                <template v-if="commissionResult.success">
                  <template v-if="commissionResult.newRank !== commissionResult.previousRank">
                    Rank updated from {{ commissionResult.previousTitle }} to {{ commissionResult.newTitle }}.
                  </template>
                  <template v-else>
                    Commission confirmed at {{ commissionResult.newTitle }}.
                  </template>
                </template>
                <template v-else>
                  Remains at {{ commissionResult.previousTitle }}.
                </template>
              </p>
            </div>
            <button
              class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:border-amber-600"
              type="button"
              @click="dismissCommissionResult"
            >
              Close
            </button>
          </div>

          <div class="mt-5 overflow-hidden rounded-md border border-zinc-200">
            <div
              v-for="rank in commissionResult.track"
              :key="rank.rank"
              :class="[
                'flex items-center justify-between gap-3 border-t border-zinc-200 px-3 py-2 first:border-t-0',
                rank.current
                  ? 'bg-amber-50 text-amber-950'
                  : rank.achieved
                    ? 'bg-stone-50 text-zinc-700'
                    : 'bg-white text-zinc-400'
              ]"
            >
              <div>
                <p class="text-sm font-semibold">Rank {{ rank.rank }} · {{ rank.title ?? `Rank ${rank.rank}` }}</p>
                <p v-if="rank.bonus" class="text-xs">Bonus: {{ rank.bonus }}</p>
              </div>
            </div>
          </div>

          <p v-if="commissionResult.bonus" class="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-950">
            Rank bonus queued: {{ commissionResult.bonus }}
          </p>
        </div>
      </div>
    </Transition>

    <Transition name="advancement-fade">
      <div
        v-if="advancementResultOpen && advancementResult && !creatorRollModalOpen"
        class="fixed inset-0 z-[55] grid place-items-center bg-zinc-950/45 px-4 py-8"
        role="dialog"
        aria-modal="true"
        @click.self="dismissAdvancementResult"
      >
        <div class="w-full max-w-xl rounded-lg border border-zinc-200 bg-white p-5 shadow-2xl">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {{ advancementResult.careerName }} · {{ advancementResult.assignmentName }}
              </p>
              <h2 class="mt-1 text-2xl font-semibold text-zinc-950">
                {{ advancementResult.success ? 'Advancement Earned' : 'No Advancement' }}
              </h2>
              <p class="mt-2 text-sm text-zinc-600">
                <template v-if="advancementResult.success">
                  Advanced from {{ advancementResult.previousTitle }} to {{ advancementResult.newTitle }}.
                </template>
                <template v-else>
                  Remains at {{ advancementResult.previousTitle }}.
                </template>
              </p>
            </div>
            <button
              class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:border-amber-600"
              type="button"
              @click="dismissAdvancementResult"
            >
              Close
            </button>
          </div>

          <div class="mt-5 overflow-hidden rounded-md border border-zinc-200">
            <div
              v-for="rank in advancementResult.track"
              :key="rank.rank"
              :class="[
                'flex items-center justify-between gap-3 border-t border-zinc-200 px-3 py-2 first:border-t-0',
                rank.current
                  ? 'bg-amber-50 text-amber-950'
                  : rank.achieved
                    ? 'bg-stone-50 text-zinc-700'
                    : 'bg-white text-zinc-400'
              ]"
            >
              <div>
                <p class="text-sm font-semibold">Rank {{ rank.rank }} · {{ rank.title ?? `Rank ${rank.rank}` }}</p>
                <p v-if="rank.bonus" class="text-xs">Bonus: {{ rank.bonus }}</p>
              </div>
            </div>
          </div>

          <p v-if="advancementResult.bonus" class="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-950">
            Rank bonus queued: {{ advancementResult.bonus }}
          </p>
        </div>
      </div>
    </Transition>
  </main>
</template>

<style scoped>
.creator-shell-layout {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-height: calc(100vh - 14rem);
}

.creator-shell-main {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  min-height: 100%;
}

.creator-shell-content {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
}

.creator-shell-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.9rem;
  margin-top: auto;
  border-radius: 12px 0 12px 0;
  clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px));
  background:
    linear-gradient(180deg, rgba(8, 20, 35, 0.94), rgba(4, 10, 20, 0.96)),
    linear-gradient(135deg, rgba(251, 191, 36, 0.12), transparent 42%),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.14), transparent 8rem);
}

.creator-shell-footer__restart {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-height: 2.75rem;
  padding: 0 1rem;
  border: 1px solid rgba(251, 191, 36, 0.35);
  border-radius: 10px 0 10px 0;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  background:
    linear-gradient(180deg, rgba(54, 20, 7, 0.92), rgba(34, 12, 5, 0.96)),
    radial-gradient(circle at 0 0, rgba(251, 191, 36, 0.18), transparent 5rem);
  color: rgb(255 237 213);
  font-size: 0.95rem;
  font-weight: 700;
  transition: border-color 140ms ease, box-shadow 140ms ease, color 140ms ease, transform 140ms ease;
}

.creator-shell-footer__restart:hover {
  border-color: rgba(251, 191, 36, 0.6);
  box-shadow:
    0 0 22px rgba(251, 191, 36, 0.14),
    inset 0 0 0 1px rgba(251, 191, 36, 0.12);
  color: rgb(255 247 237);
}

.creator-shell-footer__restart:active {
  transform: translateY(1px);
}

.creator-shell-footer__restart-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  overflow: visible;
  color: rgb(253 186 116);
  transform: translate(-0.04rem, -0.04rem);
}

.creator-shell-footer__restart-icon :deep(svg) {
  overflow: visible;
}

.creator-shell-footer__nav {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.55rem;
  margin-left: auto;
}

.creator-shell-footer__text-button,
.creator-term-nav__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 2.75rem;
  border: 1px solid rgba(34, 211, 238, 0.26);
  border-radius: 10px 0 10px 0;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  background:
    linear-gradient(180deg, rgba(8, 18, 32, 0.92), rgba(3, 7, 18, 0.95)),
    radial-gradient(circle at 50% 0, rgba(34, 211, 238, 0.14), transparent 4rem);
  color: rgb(207 250 254);
  font-size: 0.92rem;
  font-weight: 700;
  transition: border-color 140ms ease, box-shadow 140ms ease, color 140ms ease, transform 140ms ease;
}

.creator-shell-footer__text-button {
  min-width: 5.25rem;
  padding: 0 1rem;
}

.creator-term-nav__button {
  width: 2.75rem;
}

.creator-shell-footer__text-button:hover:not(:disabled),
.creator-term-nav__button:hover:not(:disabled) {
  border-color: rgba(34, 211, 238, 0.5);
  color: rgb(236 254 255);
  box-shadow:
    0 0 18px rgba(34, 211, 238, 0.14),
    inset 0 0 0 1px rgba(34, 211, 238, 0.1);
}

.creator-shell-footer__text-button:active:not(:disabled),
.creator-term-nav__button:active:not(:disabled) {
  transform: translateY(1px);
}

.creator-shell-footer__text-button:disabled,
.creator-term-nav__button:disabled {
  cursor: not-allowed;
  opacity: 0.38;
}

.current-traveller-shell {
  display: flex;
  min-height: 0;
  align-self: stretch;
  align-items: stretch;
}

.current-traveller-shell :deep(.current-traveller-card) {
  width: 100%;
  height: 100%;
}

.creator-term-nav__icon {
  width: 1.05rem;
  height: 1.05rem;
}

.creator-term-nav__icon--left {
  transform: rotate(180deg);
}

.creator-term-nav__icon--right {
  transform: rotate(0deg);
}

@media (max-width: 639px) {
  .creator-shell-layout {
    min-height: auto;
    gap: 1rem;
  }

  .creator-shell-footer {
    gap: 0.65rem;
    padding: 0.65rem;
  }

  .creator-shell-footer {
    align-items: center;
    flex-wrap: wrap;
  }

  .creator-shell-footer__restart {
    flex: 0 0 3rem;
    justify-content: center;
    width: 2.75rem;
    min-width: 2.75rem;
    height: 2.75rem;
    min-height: 2.75rem;
    padding: 0;
    font-size: 0.88rem;
  }

  .creator-shell-footer__restart-label {
    display: none;
  }

  .creator-shell-footer__restart-icon {
    width: 1.35rem;
    height: 1.35rem;
    transform: translate(-0.06rem, -0.06rem);
  }

  .creator-shell-footer__nav {
    flex: 0 0 auto;
    justify-content: flex-end;
    margin-left: 0;
  }

  .creator-shell-footer__text-button {
    min-width: 4.5rem;
    padding: 0 0.75rem;
    font-size: 0.84rem;
  }

  .creator-term-nav__button {
    width: 2.5rem;
    height: 2.5rem;
  }

  .creator-term-nav__icon {
    width: 0.95rem;
    height: 0.95rem;
  }
}

.creator-roll-fade-enter-active,
.creator-roll-fade-leave-active,
.advancement-fade-enter-active,
.advancement-fade-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.creator-roll-fade-enter-from,
.creator-roll-fade-leave-to,
.advancement-fade-enter-from,
.advancement-fade-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

.creator-roll-modal__panel {
  position: relative;
  border: 1px solid rgb(34 211 238 / 0.35);
  background:
    linear-gradient(180deg, rgb(8 20 35 / 0.96), rgb(4 10 20 / 0.98)),
    linear-gradient(135deg, rgb(251 191 36 / 0.12), transparent 58%);
  box-shadow:
    0 0 0 1px rgb(14 116 144 / 0.28),
    0 24px 64px rgb(0 0 0 / 0.45),
    inset 0 1px 0 rgb(255 255 255 / 0.04);
  clip-path: polygon(0 0, calc(100% - 1rem) 0, 100% 1rem, 100% 100%, 1rem 100%, 0 calc(100% - 1rem));
}

.creator-roll-modal__panel::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgb(250 204 21 / 0.08), transparent 28%),
    repeating-linear-gradient(
      180deg,
      rgb(255 255 255 / 0.02) 0,
      rgb(255 255 255 / 0.02) 1px,
      transparent 1px,
      transparent 6px
    );
}

.creator-roll-modal__panel--event {
  max-height: min(80vh, 48rem);
}

.creator-roll-modal__header {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid rgb(34 211 238 / 0.18);
  padding: 1.25rem 1.25rem 1rem;
}

.creator-roll-modal__header-actions {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 0.65rem;
}

.creator-roll-modal__kicker {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgb(251 191 36 / 0.88);
}

.creator-roll-modal__title {
  margin: 0.35rem 0 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: rgb(236 254 255);
}

.creator-roll-modal__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  height: 2.25rem;
  padding: 0 0.85rem;
  border: 1px solid rgb(34 211 238 / 0.28);
  background: rgb(8 20 35 / 0.82);
  color: rgb(207 250 254);
  font-size: 0.82rem;
  font-weight: 700;
  clip-path: polygon(0 0, calc(100% - 0.55rem) 0, 100% 0.55rem, 100% 100%, 0.55rem 100%, 0 calc(100% - 0.55rem));
  transition: border-color 160ms ease, color 160ms ease, background-color 160ms ease;
}

.creator-roll-modal__close:hover {
  border-color: rgb(34 211 238 / 0.5);
  color: rgb(255 251 235);
  background: rgb(14 32 52 / 0.96);
}

.creator-roll-modal__close-label {
  white-space: nowrap;
}

.creator-roll-modal__body {
  position: relative;
  display: grid;
  gap: 1.25rem;
  padding: 1.4rem 1.25rem 1.5rem;
}

.creator-roll-modal__body--event {
  overflow-y: auto;
}

.creator-shell-content--roll-animating {
  opacity: 0;
  pointer-events: none;
}

.creator-step-strip {
  display: flex;
  flex-wrap: nowrap;
  gap: 0;
  width: 100%;
  overflow-x: auto;
  padding-bottom: 0.15rem;
  scrollbar-width: none;
}

.creator-step-strip::-webkit-scrollbar {
  display: none;
}

.creator-step-carousel {
  display: flex;
  justify-content: center;
  touch-action: pan-y;
}

.creator-step-carousel__viewport {
  width: clamp(10.5rem, 58vw, 13rem);
  overflow: hidden;
}

.creator-step-carousel__track {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  will-change: transform;
}

.creator-step-carousel__current-wrap {
  position: relative;
  display: inline-flex;
  flex: 0 0 4.65rem;
  width: 4.65rem;
  height: 2.45rem;
  align-items: center;
  justify-content: center;
}

.creator-step-carousel-shift-move,
.creator-step-carousel__item {
  position: relative;
  display: inline-flex;
  width: 4.65rem;
  flex: 0 0 4.65rem;
  height: 2.45rem;
  align-items: center;
  justify-content: center;
  border: 1px solid rgb(34 211 238 / 0.24);
  background: linear-gradient(180deg, rgb(9 33 49 / 0.96), rgb(6 24 38 / 0.98));
  color: rgb(224 247 255 / 0.94);
  font-size: 0.69rem;
  font-weight: 700;
  text-align: center;
  transition:
    transform 260ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 260ms ease,
    border-color 220ms ease,
    box-shadow 260ms ease,
    filter 260ms ease;
}

.creator-step-carousel__surface {
  position: relative;
  display: inline-flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
}

.creator-step-carousel__surface::before {
  content: '';
  position: absolute;
  inset: 1px;
  background: linear-gradient(180deg, rgb(8 21 34 / 0.86), rgb(5 14 25 / 0.92));
  z-index: 0;
}

.creator-step-carousel__item.is-current {
  clip-path: polygon(0 0, calc(100% - 0.5rem) 0, 100% 0.5rem, 100% 100%, 0.5rem 100%, 0 calc(100% - 0.5rem));
  border-color: rgb(103 232 249 / 0.54);
  box-shadow:
    inset 0 0 0 1px rgb(103 232 249 / 0.16),
    0 0 18px rgb(34 211 238 / 0.12);
  transform: scale(1.18);
  z-index: 2;
}

.creator-step-carousel__marker {
  position: absolute;
  top: 50%;
  color: rgb(165 243 252 / 0.96);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.035rem;
  height: 1.035rem;
  pointer-events: none;
  z-index: 4;
  filter:
    drop-shadow(0 0 4px rgb(103 232 249 / 0.52))
    drop-shadow(0 0 10px rgb(34 211 238 / 0.42));
}

.creator-step-carousel__marker--left {
  left: -2.63rem;
  transform: translate(0, -50%);
}

.creator-step-carousel__marker--left :deep(svg) {
  transform: rotate(180deg);
}

.creator-step-carousel__marker--right {
  right: -2.63rem;
  transform: translate(0, -50%);
}

.creator-step-carousel__marker :deep(svg) {
  width: 100%;
  height: 100%;
}

.creator-step-carousel__item.is-current .creator-step-carousel__surface::before {
  clip-path: polygon(0 0, calc(100% - 0.42rem) 0, 100% 0.42rem, 100% 100%, 0.42rem 100%, 0 calc(100% - 0.42rem));
  background:
    linear-gradient(135deg, rgb(66 214 255 / 0.34), rgb(26 122 162 / 0.28) 48%, rgb(14 66 93 / 0.88)),
    linear-gradient(180deg, rgb(11 59 81 / 0.94), rgb(8 30 48 / 0.98));
}

.creator-step-carousel__item.is-near {
  clip-path: polygon(0 0, calc(100% - 0.42rem) 0, 100% 0.42rem, 100% 100%, 0.42rem 100%, 0 calc(100% - 0.42rem));
  opacity: 0.52;
  transform: scale(0.74);
}

.creator-step-carousel__item.is-near .creator-step-carousel__surface::before {
  clip-path: polygon(0 0, calc(100% - 0.34rem) 0, 100% 0.34rem, 100% 100%, 0.34rem 100%, 0 calc(100% - 0.34rem));
}

.creator-step-carousel-surface-forward-enter-active,
.creator-step-carousel-surface-forward-leave-active,
.creator-step-carousel-surface-backward-enter-active,
.creator-step-carousel-surface-backward-leave-active {
  transition:
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 180ms ease;
}

.creator-step-carousel-surface-forward-leave-active,
.creator-step-carousel-surface-backward-leave-active {
  position: absolute;
  inset: 0;
}

.creator-step-carousel-surface-forward-enter-from {
  opacity: 0;
  transform: translateX(0.75rem);
}

.creator-step-carousel-surface-forward-leave-to {
  opacity: 0;
  transform: translateX(-0.75rem);
}

.creator-step-carousel-surface-backward-enter-from {
  opacity: 0;
  transform: translateX(-0.75rem);
}

.creator-step-carousel-surface-backward-leave-to {
  opacity: 0;
  transform: translateX(0.75rem);
}

.creator-step-carousel__item.is-far {
  clip-path: polygon(0 0, calc(100% - 0.42rem) 0, 100% 0.42rem, 100% 100%, 0.42rem 100%, 0 calc(100% - 0.42rem));
  opacity: 0;
  transform: scale(0.62);
  filter: saturate(0.8);
  pointer-events: none;
}

.creator-step-carousel__item.is-far::before {
  clip-path: polygon(0 0, calc(100% - 0.34rem) 0, 100% 0.34rem, 100% 100%, 0.34rem 100%, 0 calc(100% - 0.34rem));
}

.creator-step-carousel__label {
  position: relative;
  z-index: 1;
  overflow: hidden;
  max-width: 100%;
  padding: 0 0.35rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.creator-step-chip {
  position: relative;
  display: inline-flex;
  min-width: 0;
  height: 3rem;
  flex: 1 1 0;
  align-items: center;
  justify-content: center;
  padding: 0 1rem 0 1.35rem;
  border: 1px solid rgb(34 211 238 / 0.24);
  border-right-width: 0;
  background: linear-gradient(180deg, rgb(9 33 49 / 0.96), rgb(6 24 38 / 0.98));
  color: rgb(207 250 254 / 0.9);
  font-size: 0.92rem;
  font-weight: 700;
  text-align: center;
  transition:
    border-color 160ms ease,
    color 160ms ease,
    background 160ms ease,
    box-shadow 160ms ease;
  clip-path: polygon(0 0, calc(100% - 0.9rem) 0, 100% 50%, calc(100% - 0.9rem) 100%, 0 100%, 0.8rem 50%);
  z-index: 1;
}

.creator-step-chip::before {
  content: '';
  position: absolute;
  inset: 1px;
  background: linear-gradient(180deg, rgb(8 21 34 / 0.86), rgb(5 14 25 / 0.92));
  clip-path: polygon(0 0, calc(100% - 0.82rem) 0, 100% 50%, calc(100% - 0.82rem) 100%, 0 100%, 0.72rem 50%);
  z-index: 0;
}

.creator-step-chip:not(:first-child) {
  margin-left: -0.5rem;
}

.creator-step-chip:first-child {
  clip-path: polygon(0 0, calc(100% - 0.9rem) 0, 100% 50%, calc(100% - 0.9rem) 100%, 0 100%);
  padding-left: 1rem;
}

.creator-step-chip:first-child::before {
  clip-path: polygon(0 0, calc(100% - 0.82rem) 0, 100% 50%, calc(100% - 0.82rem) 100%, 0 100%);
}

.creator-step-chip.is-terminal {
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 0.8rem 50%);
  padding-right: 1.55rem;
  border-right-width: 1px;
}

.creator-step-chip.is-terminal::before {
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 0.72rem 50%);
}

.creator-step-chip.is-terminal::after {
  content: '';
  position: absolute;
  right: -1px;
  top: -1px;
  bottom: -1px;
  width: 0.55rem;
  background:
    repeating-linear-gradient(
      135deg,
      rgb(34 211 238 / 0.88) 0,
      rgb(34 211 238 / 0.88) 0.22rem,
      rgb(8 29 44 / 0.98) 0.22rem,
      rgb(8 29 44 / 0.98) 0.44rem
    );
  border-left: 1px solid rgb(34 211 238 / 0.34);
  box-shadow:
    inset 0 1px 0 rgb(34 211 238 / 0.34),
    inset 0 -1px 0 rgb(34 211 238 / 0.34),
    inset 0 0 0 1px rgb(255 255 255 / 0.04),
    0 0 10px rgb(34 211 238 / 0.14);
  z-index: 1;
}

.creator-step-chip:last-child {
  border-right-width: 1px;
}

.creator-step-chip__label {
  position: relative;
  z-index: 1;
  line-height: 1.1;
}

.creator-step-chip.is-upcoming {
  border-color: rgb(34 211 238 / 0.18);
  color: rgb(186 230 253 / 0.8);
}

.creator-step-chip.is-complete {
  border-color: rgb(34 211 238 / 0.32);
  color: rgb(232 249 252 / 0.95);
}

.creator-step-chip.is-complete::before {
  background: linear-gradient(180deg, rgb(9 54 70 / 0.82), rgb(7 34 49 / 0.9));
}

.creator-step-chip.is-active {
  border-color: rgb(103 232 249 / 0.58);
  color: rgb(248 253 255);
  box-shadow:
    inset 0 0 0 1px rgb(103 232 249 / 0.16),
    0 0 22px rgb(34 211 238 / 0.12);
  z-index: 3;
}

.creator-step-chip.is-active::before {
  background:
    linear-gradient(135deg, rgb(66 214 255 / 0.36), rgb(26 122 162 / 0.3) 48%, rgb(14 66 93 / 0.88)),
    linear-gradient(180deg, rgb(11 59 81 / 0.94), rgb(8 30 48 / 0.98));
}

.creator-step-chip:hover:not(.is-active) {
  border-color: rgb(103 232 249 / 0.36);
  color: rgb(240 253 255);
  z-index: 2;
}

@media (max-width: 639px) {
  .creator-step-carousel__track {
    gap: 0.2rem;
  }

  .creator-step-carousel__item {
    width: 4.35rem;
    flex-basis: 4.35rem;
    height: 2.35rem;
    font-size: 0.63rem;
  }

  .creator-step-chip {
    min-width: 7.35rem;
    height: 2.75rem;
    flex: 0 0 auto;
    padding: 0 0.9rem 0 1.15rem;
    font-size: 0.84rem;
  }

  .creator-step-chip:not(:first-child) {
    margin-left: -0.42rem;
  }

  .creator-step-chip.is-terminal {
    padding-right: 1.35rem;
  }

  .creator-step-chip.is-terminal::after {
    width: 0.4rem;
  }
}

.creator-step-action-rail {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.9rem;
  border: 1px solid rgb(34 211 238 / 0.18);
  background:
    linear-gradient(180deg, rgb(10 24 40 / 0.96), rgb(7 16 29 / 0.98)),
    linear-gradient(90deg, rgb(34 211 238 / 0.06), rgb(245 158 11 / 0.04));
  padding: 0.9rem 1rem;
  box-shadow:
    inset 0 0 0 1px rgb(34 211 238 / 0.05),
    0 14px 30px rgb(2 6 23 / 0.22);
  clip-path: polygon(0 0, calc(100% - 0.9rem) 0, 100% 0.9rem, 100% 100%, 0.9rem 100%, 0 calc(100% - 0.9rem));
}

.creator-term-stage {
  min-height: 34rem;
}

.creator-term-stage__overlay {
  background:
    linear-gradient(180deg, rgb(6 16 29 / 0.84), rgb(4 12 23 / 0.9)),
    linear-gradient(135deg, rgb(34 211 238 / 0.06), rgb(245 158 11 / 0.05));
}

.creator-step-action-rail__copy {
  min-width: 0;
}

.creator-step-action-rail__label {
  margin: 0;
  color: rgb(103 232 249 / 0.78);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.creator-step-action-rail__helper {
  margin: 0.3rem 0 0;
  color: rgb(232 249 252 / 0.9);
  font-size: 0.95rem;
  line-height: 1.45;
}

.creator-step-action-rail__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.65rem;
}

.creator-step-action-rail__button {
  height: 2.75rem;
  min-width: 7.5rem;
  padding: 0 1rem;
  font-size: 0.9rem;
  font-weight: 700;
  clip-path: polygon(0 0, calc(100% - 0.65rem) 0, 100% 0.65rem, 100% 100%, 0.65rem 100%, 0 calc(100% - 0.65rem));
}

.creator-step-action-rail__button--primary {
  border: 1px solid rgb(34 211 238 / 0.42);
  background: linear-gradient(180deg, rgb(15 88 117 / 0.94), rgb(10 59 79 / 0.98));
  color: rgb(240 253 255);
  box-shadow:
    inset 0 0 0 1px rgb(103 232 249 / 0.18),
    0 0 18px rgb(34 211 238 / 0.16);
}

.creator-step-action-rail__button--secondary {
  border: 1px solid rgb(251 191 36 / 0.26);
  background: linear-gradient(180deg, rgb(64 36 13 / 0.9), rgb(46 24 8 / 0.96));
  color: rgb(253 230 138);
}

@media (max-width: 639px) {
  .creator-term-stage {
    min-height: 30rem;
  }

  .creator-step-action-rail {
    padding: 0.7rem 0.75rem;
  }

  .creator-step-action-rail__copy,
  .creator-step-action-rail__actions {
    width: 100%;
  }

  .creator-step-action-rail__actions {
    justify-content: stretch;
  }

  .creator-step-action-rail__button {
    flex: 1 1 0;
    min-width: 0;
  }
}

.creator-roll-modal__dice-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
  flex-wrap: wrap;
}

.creator-roll-modal__die {
  display: grid;
  place-items: center;
  width: 3.3rem;
  height: 3.3rem;
  border: 1px solid rgb(34 211 238 / 0.3);
  background: linear-gradient(180deg, rgb(13 34 58 / 0.98), rgb(7 18 33 / 0.98));
  color: rgb(165 243 252);
  font-size: 1.45rem;
  font-weight: 800;
  box-shadow: inset 0 0 0 1px rgb(34 211 238 / 0.1), 0 0 22px rgb(34 211 238 / 0.14);
  clip-path: polygon(0 0, calc(100% - 0.8rem) 0, 100% 0.8rem, 100% 100%, 0.8rem 100%, 0 calc(100% - 0.8rem));
}

.creator-roll-modal__die.is-rolling {
  animation: creator-roll-pulse 140ms linear infinite;
}

.creator-roll-modal__plus {
  color: rgb(103 232 249 / 0.85);
  font-size: 1.4rem;
  font-weight: 700;
}

.creator-roll-modal__result-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.creator-roll-modal__modifier {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgb(251 191 36 / 0.24);
  background: rgb(251 191 36 / 0.1);
  color: rgb(253 186 55);
  padding: 0.35rem 0.7rem;
  font-size: 0.82rem;
  font-weight: 700;
  white-space: nowrap;
  clip-path: polygon(0 0, calc(100% - 0.45rem) 0, 100% 0.45rem, 100% 100%, 0.45rem 100%, 0 calc(100% - 0.45rem));
}

.creator-roll-modal__total {
  display: inline-flex;
  transform: scale(1);
}

.creator-roll-modal__total-frame {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 4.6rem;
  height: 4rem;
  border: 1px solid rgb(251 191 36 / 0.28);
  background: linear-gradient(180deg, rgb(118 43 8 / 0.92), rgb(78 27 8 / 0.96));
  color: rgb(255 248 214);
  font-size: 2.35rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  -webkit-text-stroke: 0.7px rgb(92 33 7 / 0.98);
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / 0.04),
    0 0 14px rgb(245 158 11 / 0.14);
  text-shadow:
    0 1px 0 rgb(92 33 7 / 0.95),
    0 0 1px rgb(255 251 235 / 0.92),
    0 0 6px rgb(252 211 77 / 0.44),
    0 0 14px rgb(245 158 11 / 0.28);
  clip-path: polygon(0 0, calc(100% - 0.6rem) 0, 100% 0.6rem, 100% 100%, 0.6rem 100%, 0 calc(100% - 0.6rem));
  font-variant-numeric: tabular-nums;
}

.creator-roll-modal__total.is-settled {
  animation: creator-roll-total-settle 320ms ease-out;
  filter:
    drop-shadow(0 0 8px rgb(252 211 77 / 0.32))
    drop-shadow(0 0 18px rgb(245 158 11 / 0.26));
}

.creator-roll-modal__result {
  margin: 0;
  text-align: center;
  color: rgb(232 249 252 / 0.92);
  font-size: 1rem;
  font-weight: 600;
}

@media (max-width: 639px) {
  .creator-roll-modal__header {
    align-items: center;
  }

  .creator-roll-modal__close {
    width: 2.25rem;
    padding: 0;
  }

  .creator-roll-modal__close-label {
    display: none;
  }

  .creator-roll-modal__die {
    width: 2.95rem;
    height: 2.95rem;
    font-size: 1.28rem;
  }

  .creator-roll-modal__total-frame {
    width: 4.2rem;
    height: 3.7rem;
    font-size: 2.1rem;
    -webkit-text-stroke: 0;
    text-shadow:
      0 1px 0 rgb(92 33 7 / 0.95),
      0 0 1px rgb(255 251 235 / 0.94),
      0 0 4px rgb(252 211 77 / 0.34),
      0 0 10px rgb(245 158 11 / 0.22);
  }
}

.creator-roll-modal__event-text {
  margin: 0;
  color: rgb(232 249 252 / 0.88);
  line-height: 1.7;
}

.creator-roll-modal__effects {
  display: grid;
  gap: 0.55rem;
}

.creator-roll-modal__effect {
  border: 1px solid rgb(34 211 238 / 0.16);
  background: rgb(11 27 44 / 0.8);
  color: rgb(207 250 254 / 0.94);
  padding: 0.7rem 0.85rem;
  font-size: 0.92rem;
  clip-path: polygon(0 0, calc(100% - 0.55rem) 0, 100% 0.55rem, 100% 100%, 0.55rem 100%, 0 calc(100% - 0.55rem));
}

@keyframes creator-roll-pulse {
  0%,
  100% {
    transform: translateY(0);
    color: rgb(165 243 252);
    box-shadow: inset 0 0 0 1px rgb(34 211 238 / 0.1), 0 0 18px rgb(34 211 238 / 0.14);
  }
  50% {
    transform: translateY(-1px);
    color: rgb(207 250 254);
    box-shadow: inset 0 0 0 1px rgb(34 211 238 / 0.18), 0 0 28px rgb(34 211 238 / 0.24);
  }
}

@keyframes creator-roll-total-settle {
  0% {
    transform: scale(1.52);
    filter:
      drop-shadow(0 0 12px rgb(252 211 77 / 0.4))
      drop-shadow(0 0 24px rgb(245 158 11 / 0.34));
  }
  100% {
    transform: scale(1);
    filter:
      drop-shadow(0 0 8px rgb(252 211 77 / 0.32))
      drop-shadow(0 0 18px rgb(245 158 11 / 0.26));
  }
}

</style>
