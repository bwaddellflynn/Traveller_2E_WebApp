<script setup lang="ts">
import { storeToRefs } from 'pinia'
import CharacterCreatorHeader from '~/components/character/CharacterCreatorHeader.vue'
import CreationStepPanel from '~/components/character/CreationStepPanel.vue'
import CreatorTabNavigation from '~/components/character/CreatorTabNavigation.vue'
import CurrentTravellerCard from '~/components/character/CurrentTravellerCard.vue'
import EventResolutionList from '~/components/character/EventResolutionList.vue'
import PsionicsPanel from '~/components/character/PsionicsPanel.vue'
import RerollConfirmDialog from '~/components/character/RerollConfirmDialog.vue'
import TermActionFooter from '~/components/character/TermActionFooter.vue'
import { useCharacterCreatorStore } from '~/stores/characterCreator'

const characterCreator = useCharacterCreatorStore()
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
  rollSummary,
  dismissAdvancementResult,
  rollPrisonerParoleThreshold,
  enterManualPrisonerParoleThreshold,
  rollCareerSkillTable,
  enterManualCareerSkillTable,
  rollCareerEvent,
  enterManualCareerEvent,
  rollCareerMishap,
  enterManualCareerMishap,
  rollAging,
  enterManualAging,
  rollMusteringOutBenefit,
  enterManualMusteringOutBenefit,
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
  gmManualCheckRollEntryEnabled,
  gmManualTableRollEntryEnabled,
  gmManualAgingRollEntryEnabled,
  gmManualBenefitRollEntryEnabled,
  gmOutcomeOverridesEnabled,
  currentTermNumber,
  activeCreatorTab,
  lifepathComplete,
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
  prisonerParoleThreshold,
  prisonerParoleThresholdRoll,
  prisonerParoleThresholdRequired,
  pendingEventResolutions,
  pendingSkillChoice,
  termRolls,
  manualRollTotals,
  currentAge,
  endOfTermAge,
  educationAvailable,
  agingRequired,
  educationEntryFailed,
  currentTermTabId,
  activeTermNumber,
  activeTermHistoryEntry,
  educationOptions,
  selectedEducation,
  educationSkillOptions,
  selectedEducationEntry,
  preCareerEvent,
  militaryAcademyServiceSkills,
  selectedCareer,
  selectedAssignment,
  careerOptions,
  careerConstraintMessages,
  careerPathLocked,
  currentCareerQualificationDm,
  careerEvent,
  careerMishap,
  availableCareerSkillTables,
  selectedCareerSkillEntries,
  basicTrainingRequired,
  basicTrainingEntries,
  basicTrainingLabel,
  agingEffect,
  musteringOutResults,
  selectedMusteringCareerId,
  selectedMusteringRollType,
  startingCredits,
  personalBenefits,
  remainingBenefitRolls,
  cashRollsUsed,
  cashRollLimit,
  canRollMusteringOut,
  musteringCareerOptions,
  selectedMusteringCareerBenefits,
  advancementResult,
} = storeToRefs(characterCreator)
</script>

<template>
  <main class="min-h-screen">
    <CharacterCreatorHeader />

    <div class="mx-auto grid w-full max-w-7xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[1fr_24rem] lg:px-10">
      <section class="grid gap-6">
        <div class="rounded-lg border border-zinc-300 bg-white shadow-sm">
          <CreatorTabNavigation />

          <div class="p-5">
            <CreationStepPanel v-if="activeCreatorTab === 'creation'" />

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
                  : educationAvailable && !careerPathLocked
                    ? 'text-zinc-700 hover:text-zinc-950'
                    : 'cursor-not-allowed text-zinc-400'
              ]"
              :disabled="!educationAvailable || careerPathLocked"
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
                  <option v-for="career in careerOptions" :key="career.id" :disabled="career.disabled" :value="career.id">
                    {{ career.name }}{{ career.disabledReason ? ` - ${career.disabledReason}` : '' }}
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

            <div v-if="careerConstraintMessages.length" class="mt-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
              <p class="font-semibold">Career requirement</p>
              <ul class="mt-2 list-disc space-y-1 pl-5">
                <li v-for="message in careerConstraintMessages" :key="message">
                  {{ message }}
                </li>
              </ul>
            </div>

            <div class="mt-5 grid gap-3 sm:grid-cols-3">
              <div class="rounded-md bg-stone-50 p-4">
                <p class="text-xs font-semibold uppercase tracking-wide text-zinc-500">Qualification</p>
                <p class="mt-2 text-lg font-semibold">{{ checkLabel(selectedCareer.qualification) }}</p>
                <p v-if="currentCareerQualificationDm" class="mt-1 text-xs text-zinc-500">
                  Career DM {{ formatDm(currentCareerQualificationDm) }}
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
              <div class="rounded-md border border-zinc-200 p-4">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p class="text-sm font-semibold">Qualification Roll</p>
                    <p class="text-sm text-zinc-600">{{ checkLabel(selectedCareer.qualification) }}</p>
                    <p v-if="currentCareerQualificationDm" class="text-xs text-zinc-500">
                      Previous careers modifier {{ formatDm(currentCareerQualificationDm) }}
                    </p>
                  </div>
                  <button class="h-10 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800" type="button" @click="rollCheck('careerQualification', 'Qualification', selectedCareer.qualification)">
                    Roll 2D
                  </button>
                </div>
                <div v-if="gmManualCheckRollEntryEnabled" class="mt-3 flex flex-wrap gap-2">
                  <input v-model.number="manualRollTotals.careerQualification" class="h-10 w-28 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="2D total" type="number">
                  <button class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:border-amber-600" type="button" @click="enterManualCheck('careerQualification', 'Qualification', selectedCareer.qualification)">
                    Manual
                  </button>
                </div>
                <div v-if="termRolls.careerQualification" class="mt-3 rounded-md bg-stone-50 p-3 text-sm">
                  <p class="font-semibold">{{ rollSummary(termRolls.careerQualification) }} · {{ termRolls.careerQualification.finalSuccess ? 'Success' : 'Failure' }}</p>
                  <p v-if="termRolls.careerQualification.notes" class="mt-1 text-zinc-600">{{ termRolls.careerQualification.notes }}</p>
                  <button v-if="gmOutcomeOverridesEnabled" class="mt-2 text-xs font-semibold text-amber-700 hover:text-amber-900" type="button" @click="toggleRollOverride('careerQualification')">
                    {{ termRolls.careerQualification.overridden ? 'Remove override' : 'Override outcome' }}
                  </button>
                </div>
              </div>

              <div v-if="selectedCareerId === 'prisoner' && termRolls.careerQualification?.finalSuccess" class="rounded-md border border-zinc-200 p-4">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p class="text-sm font-semibold">Parole Threshold</p>
                    <p class="text-sm text-zinc-600">Roll 1D+2 before resolving the Prisoner term. Advancement must exceed this value to leave prison.</p>
                  </div>
                  <button
                    class="h-10 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                    :disabled="!prisonerParoleThresholdRequired"
                    type="button"
                    @click="rollPrisonerParoleThreshold"
                  >
                    Roll 1D
                  </button>
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
                    @click="enterManualPrisonerParoleThreshold"
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
                <div v-if="gmManualCheckRollEntryEnabled" class="mt-3 flex flex-wrap gap-2">
                  <input v-model.number="manualRollTotals.careerSurvival" class="h-10 w-28 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="2D total" type="number">
                  <button class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:border-amber-600" type="button" @click="enterManualCheck('careerSurvival', 'Survival', selectedAssignment.survival)">
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
                  <EventResolutionList source-prefix="Career Mishap" />
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
                  <EventResolutionList source-prefix="Career Event" />
                </div>
              </div>

              <div
                v-if="(
                  (termRolls.careerSurvival?.finalSuccess && termRolls.careerEvent)
                  || (selectedCareerId === 'prisoner' && termRolls.careerSurvival && (!termRolls.careerSurvival.finalSuccess ? termRolls.careerMishap : termRolls.careerEvent))
                ) && !pendingEventResolutions.some((resolution) => !resolution.resolved)"
                class="rounded-md border border-zinc-200 p-4"
              >
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p class="text-sm font-semibold">Advancement Roll</p>
                    <p class="text-sm text-zinc-600">{{ checkLabel(selectedAssignment.advancement) }}</p>
                  </div>
                  <button class="h-10 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800" type="button" @click="rollCheck('careerAdvancement', 'Advancement', selectedAssignment.advancement)">
                    Roll 2D
                  </button>
                </div>
                <div v-if="gmManualCheckRollEntryEnabled" class="mt-3 flex flex-wrap gap-2">
                  <input v-model.number="manualRollTotals.careerAdvancement" class="h-10 w-28 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="2D total" type="number">
                  <button class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:border-amber-600" type="button" @click="enterManualCheck('careerAdvancement', 'Advancement', selectedAssignment.advancement)">
                    Manual
                  </button>
                </div>
                <div v-if="termRolls.careerAdvancement" class="mt-3 rounded-md bg-stone-50 p-3 text-sm">
                  <p class="font-semibold">{{ rollSummary(termRolls.careerAdvancement) }} · {{ termRolls.careerAdvancement.finalSuccess ? 'Advanced' : 'No advancement' }}</p>
                  <p v-if="termRolls.careerAdvancement.notes" class="mt-1 text-zinc-600">{{ termRolls.careerAdvancement.notes }}</p>
                  <p v-if="selectedCareerId === 'prisoner' && prisonerParoleThreshold !== null" class="mt-1 text-zinc-600">
                    {{ termRolls.careerAdvancement.total > prisonerParoleThreshold ? 'Parole threshold exceeded: leave Prisoner after this term.' : 'Parole threshold not exceeded: continue Prisoner next term.' }}
                  </p>
                  <button v-if="gmOutcomeOverridesEnabled" class="mt-2 text-xs font-semibold text-amber-700 hover:text-amber-900" type="button" @click="toggleRollOverride('careerAdvancement')">
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
                  <div v-if="gmManualCheckRollEntryEnabled" class="mt-3 flex flex-wrap gap-2">
                    <input v-model.number="manualRollTotals.educationEntry" class="h-10 w-28 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="2D total" type="number">
                    <button class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:border-amber-600" type="button" @click="enterManualCheck('educationEntry', 'Education Entry', selectedEducationEntry)">
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
                    <EventResolutionList source-prefix="Pre-Career Event" />
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
                  <div v-if="gmManualCheckRollEntryEnabled" class="mt-3 flex flex-wrap gap-2">
                    <input v-model.number="manualRollTotals.educationGraduation" class="h-10 w-28 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="2D total" type="number">
                    <button class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:border-amber-600" type="button" @click="enterManualCheck('educationGraduation', 'Graduation', selectedEducation.graduation)">
                      Manual
                    </button>
                  </div>
                  <div v-if="termRolls.educationGraduation" class="mt-3 rounded-md bg-stone-50 p-3 text-sm">
                    <p class="font-semibold">{{ rollSummary(termRolls.educationGraduation) }} · {{ termRolls.educationGraduation.finalSuccess ? 'Graduated' : 'Did not graduate' }}</p>
                    <p v-if="termRolls.educationGraduation.notes" class="mt-1 text-zinc-600">{{ termRolls.educationGraduation.notes }}</p>
                    <button v-if="gmOutcomeOverridesEnabled" class="mt-2 text-xs font-semibold text-amber-700 hover:text-amber-900" type="button" @click="toggleRollOverride('educationGraduation')">
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
            <div v-if="gmManualAgingRollEntryEnabled" class="mt-3 flex flex-wrap gap-2">
              <input v-model.number="manualRollTotals.aging" class="h-10 w-28 rounded-md border border-amber-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="2D total" type="number">
              <button class="h-10 rounded-md border border-amber-400 px-3 text-sm font-semibold text-amber-950 hover:border-amber-700" type="button" @click="enterManualAging">
                Manual
              </button>
            </div>
            <div v-if="termRolls.aging" class="mt-3 rounded-md bg-white p-3 text-sm">
              <p class="font-semibold">{{ rollSummary(termRolls.aging) }} · {{ agingEffect }}</p>
              <p class="mt-1 text-zinc-600">Resolve any characteristic reductions below.</p>
              <EventResolutionList source-prefix="Aging" />
            </div>
          </div>

          <PsionicsPanel />

          <TermActionFooter />

          <div v-if="lifepathComplete" class="mt-5 rounded-lg border border-zinc-300 bg-white p-5">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 class="text-xl font-semibold">Mustering Out</h2>
                <p class="mt-1 text-sm text-zinc-600">
                  Resolve remaining benefit rolls. Cash rolls used: {{ cashRollsUsed }}/{{ cashRollLimit }}.
                </p>
              </div>
              <span class="rounded-md bg-stone-100 px-3 py-2 text-sm font-semibold text-zinc-700">
                {{ remainingBenefitRolls }} rolls remaining
              </span>
            </div>

            <div class="mt-5 grid gap-4 md:grid-cols-3">
              <label class="grid gap-2">
                <span class="text-sm font-medium text-zinc-700">Career</span>
                <select
                  v-model="selectedMusteringCareerId"
                  class="h-11 rounded-md border border-zinc-300 bg-white px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                >
                  <option v-for="career in musteringCareerOptions" :key="career.id" :value="career.id">
                    {{ career.name }} ({{ career.rolls }})
                  </option>
                </select>
              </label>
              <label class="grid gap-2">
                <span class="text-sm font-medium text-zinc-700">Roll Type</span>
                <select
                  v-model="selectedMusteringRollType"
                  class="h-11 rounded-md border border-zinc-300 bg-white px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                >
                  <option value="benefit">Benefit</option>
                  <option :disabled="cashRollsUsed >= cashRollLimit" value="cash">Cash</option>
                </select>
              </label>
              <div class="grid gap-2">
                <span class="text-sm font-medium text-zinc-700">Roll</span>
                <div class="flex gap-2">
                  <button
                    class="h-11 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                    :disabled="!canRollMusteringOut"
                    type="button"
                    @click="rollMusteringOutBenefit"
                  >
                    Roll 1D
                  </button>
                  <template v-if="gmManualBenefitRollEntryEnabled">
                    <input v-model.number="manualRollTotals.musteringOut" class="h-11 w-24 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" max="6" min="1" placeholder="1D" type="number">
                    <button
                      class="h-11 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:border-amber-600 disabled:cursor-not-allowed disabled:text-zinc-400"
                      :disabled="!canRollMusteringOut"
                      type="button"
                      @click="enterManualMusteringOutBenefit(manualRollTotals.musteringOut ?? Number.NaN)"
                    >
                      Manual
                    </button>
                  </template>
                </div>
              </div>
            </div>

            <div v-if="selectedMusteringCareerBenefits.length" class="mt-5 overflow-hidden rounded-md border border-zinc-200">
              <table class="w-full text-left text-sm">
                <thead class="bg-stone-100 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th class="px-3 py-2">Roll</th>
                    <th class="px-3 py-2">Cash</th>
                    <th class="px-3 py-2">Benefit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in selectedMusteringCareerBenefits" :key="row.roll" class="border-t border-zinc-200">
                    <td class="px-3 py-2 font-semibold">{{ row.roll }}</td>
                    <td class="px-3 py-2">{{ row.cash.toLocaleString() }} Cr</td>
                    <td class="px-3 py-2">{{ row.benefit }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="mt-5 grid gap-4 lg:grid-cols-3">
              <div class="rounded-md bg-stone-50 p-4">
                <p class="text-xs font-semibold uppercase tracking-wide text-zinc-500">Credits</p>
                <p class="mt-2 text-2xl font-semibold">{{ startingCredits.toLocaleString() }} Cr</p>
              </div>
              <div class="rounded-md bg-stone-50 p-4 lg:col-span-2">
                <p class="text-sm font-semibold text-zinc-900">Results</p>
                <div v-if="musteringOutResults.length" class="mt-3 grid gap-2">
                  <div v-for="result in musteringOutResults" :key="result.id" class="rounded-md bg-white px-3 py-2 text-sm">
                    <p class="font-semibold">{{ result.careerName }} · {{ result.rollType }} · {{ result.dice.join(' + ') }} {{ formatDm(result.dm) }} = {{ result.total }}</p>
                    <p class="text-zinc-600">
                      {{ result.cash !== undefined ? `${result.cash.toLocaleString()} Cr` : result.benefit }}
                    </p>
                  </div>
                </div>
                <p v-else class="mt-3 text-sm text-zinc-600">No mustering-out rolls resolved.</p>
              </div>
            </div>

            <div v-if="personalBenefits.length" class="mt-5 rounded-md border border-zinc-200 p-4">
              <p class="text-sm font-semibold text-zinc-900">Personal Benefits</p>
              <div class="mt-3 flex flex-wrap gap-2">
                <span v-for="benefit in personalBenefits" :key="benefit" class="rounded-md bg-stone-100 px-3 py-2 text-sm text-zinc-700">
                  {{ benefit }}
                </span>
              </div>
            </div>
          </div>
        </div>
          </div>
        </div>
      </section>

      <CurrentTravellerCard />
    </div>

    <RerollConfirmDialog />

    <Transition name="advancement-fade">
      <div
        v-if="advancementResult"
        class="fixed inset-0 z-40 grid place-items-center bg-zinc-950/45 px-4 py-8"
        role="dialog"
        aria-modal="true"
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
                  ? advancementResult.success
                    ? 'bg-emerald-50 text-emerald-950'
                    : 'bg-amber-50 text-amber-950'
                  : rank.achieved
                    ? 'bg-stone-50 text-zinc-700'
                    : 'bg-white text-zinc-400'
              ]"
            >
              <div>
                <p class="text-sm font-semibold">Rank {{ rank.rank }} · {{ rank.title ?? `Rank ${rank.rank}` }}</p>
                <p v-if="rank.bonus" class="text-xs">Bonus: {{ rank.bonus }}</p>
              </div>
              <span v-if="rank.current" class="rounded-md bg-white px-2 py-1 text-xs font-semibold shadow-sm">
                Current
              </span>
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
.advancement-fade-enter-active,
.advancement-fade-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.advancement-fade-enter-from,
.advancement-fade-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}
</style>
