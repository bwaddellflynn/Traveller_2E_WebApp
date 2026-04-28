<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCharacterCreatorStore } from '~/stores/characterCreator'

const characterCreator = useCharacterCreatorStore()
const {
  careersData,
  roll2D,
  diceModifier,
  formatDm,
  assignableRollsFor,
  applyAssignedScores,
  performCharacteristicRoll,
  autoAssignCharacteristics,
  rollCharacteristics,
  confirmCharacteristicReroll,
  cancelCharacteristicReroll,
  resolveCareerTableRow,
  tableEntries,
  advancedEducationAllowed,
  skillTableLabel,
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
  noteCareerEventEffect,
  applyCareerTableEffects,
  resolvePendingCareerEventSkillChoice,
  makeCareerEventRoll,
  rollCareerEvent,
  enterManualCareerEvent,
  makeCareerMishapRoll,
  rollCareerMishap,
  enterManualCareerMishap,
  resetTermRolls,
  rollAging,
  enterManualAging,
  selectTermTab,
  addTermTab,
  completeCurrentTerm,
  musterOut,
  modifierLabel,
  educationBenefitLabel,
  preCareerEventEffectLabel,
  tableEffectLabel,
} = characterCreator
const {
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
  careerEventResolutionNotes,
  pendingCareerEventSkillChoice,
  pendingSkillChoice,
  termRolls,
  manualRollTotals,
  assignedRollIdSet,
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
  currentCareerTableData,
  currentCareerEventData,
  careerEvent,
  careerMishap,
  currentCareerSkillTables,
  availableCareerSkillTables,
  selectedCareerSkillTable,
  selectedCareerSkillEntries,
  careerTermsCompleted,
  basicTrainingRequired,
  basicTrainingTableId,
  basicTrainingEntries,
  basicTrainingLabel,
  currentTravellerSkills,
  agingEffect,
  canCompleteTerm,
  canAddTermTab,
  nextTermButtonLabel,
  characteristicRows,
} = storeToRefs(characterCreator)
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
