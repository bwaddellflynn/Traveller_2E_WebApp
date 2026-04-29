<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCharacterCreatorStore } from '~/stores/characterCreator'

const characterCreator = useCharacterCreatorStore()
const {
  formatDm,
  checkLabel,
  associateTypeLabel,
} = characterCreator
const {
  characterName,
  characteristicRows,
  currentTravellerSkills,
  currentTermNumber,
  selectedTermPath,
  selectedCareer,
  selectedAssignment,
  selectedEducationOption,
  selectedEducationEntry,
  termHistory,
  careerRanks,
  eventOutcomeLog,
  associates,
  narrativeEvents,
  rollModifiers,
  benefitRollAdjustments,
  benefitRollLedger,
  psiScore,
  psiDm,
  learnedPsionicTalents,
  psionicsTrainingCost,
  prisonerParoleThreshold,
  prisonerBenefitRollsLost,
  totalBenefitRollsEarned,
  totalBenefitRollAdjustments,
  totalAvailableBenefitRolls,
  medicalDebt,
  totalDebt,
  medicalCareLog,
  careerConstraints,
} = storeToRefs(characterCreator)
</script>

<template>
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

    <div v-if="prisonerParoleThreshold !== null || prisonerBenefitRollsLost" class="mt-5 border-t border-white/15 pt-5">
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm font-semibold text-zinc-200">Prisoner</p>
        <span v-if="prisonerParoleThreshold !== null" class="rounded-md bg-white/10 px-2 py-1 text-xs text-zinc-300">
          Parole {{ prisonerParoleThreshold }}
        </span>
      </div>
      <p v-if="prisonerBenefitRollsLost" class="mt-2 text-xs text-zinc-400">
        Prisoner benefit rolls lost.
      </p>
    </div>

    <div v-if="careerRanks.length" class="mt-5 border-t border-white/15 pt-5">
      <p class="text-sm font-semibold text-zinc-200">Career Ranks</p>
      <div class="mt-3 grid gap-2">
        <div
          v-for="rank in careerRanks"
          :key="`${rank.careerId}-${rank.assignmentId ?? 'shared'}`"
          class="rounded-md bg-white/10 px-3 py-2"
        >
          <p class="text-sm font-semibold text-zinc-100">
            {{ rank.careerName }}<span v-if="rank.assignmentName"> · {{ rank.assignmentName }}</span>
          </p>
          <p class="text-xs text-zinc-400">
            Rank {{ rank.rank }} · {{ rank.title ?? 'Untitled rank' }}<span v-if="rank.bonus"> · {{ rank.bonus }}</span>
          </p>
        </div>
      </div>
    </div>

    <div v-if="psiScore !== null || learnedPsionicTalents.length" class="mt-5 border-t border-white/15 pt-5">
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm font-semibold text-zinc-200">Psionics</p>
        <span v-if="psiScore !== null" class="rounded-md bg-white/10 px-2 py-1 text-xs text-zinc-300">
          PSI {{ psiScore }} · DM {{ formatDm(psiDm) }}
        </span>
      </div>
      <div v-if="learnedPsionicTalents.length" class="mt-3 flex flex-wrap gap-2">
        <span
          v-for="talent in learnedPsionicTalents"
          :key="talent.id"
          class="rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-amber-300"
        >
          {{ talent.name }} 0
        </span>
      </div>
      <p v-if="psionicsTrainingCost" class="mt-2 text-xs text-zinc-400">
        Testing/training cost: {{ psionicsTrainingCost.toLocaleString() }} Cr
      </p>
    </div>

    <div v-if="associates.length" class="mt-5 border-t border-white/15 pt-5">
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm font-semibold text-zinc-200">Associates</p>
        <span class="rounded-md bg-white/10 px-2 py-1 text-xs text-zinc-300">
          {{ associates.length }}
        </span>
      </div>
      <div class="mt-3 grid gap-2">
        <div
          v-for="associate in associates"
          :key="associate.id"
          class="rounded-md bg-white/10 px-3 py-2"
        >
          <div class="flex flex-wrap items-start justify-between gap-2">
            <p class="text-sm font-semibold text-zinc-100">{{ associate.name }}</p>
            <span class="rounded-md bg-zinc-950 px-2 py-1 text-xs font-semibold text-amber-300">
              {{ associateTypeLabel(associate.type) }}
            </span>
          </div>
          <p v-if="associate.notes" class="mt-1 text-xs text-zinc-400">{{ associate.notes }}</p>
          <p class="mt-1 text-xs text-zinc-500">{{ associate.source }}</p>
        </div>
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

    <div
      v-if="eventOutcomeLog.length || associates.length || narrativeEvents.length || rollModifiers.length || benefitRollAdjustments.length || careerConstraints.length"
      class="mt-5 border-t border-white/15 pt-5"
    >
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm font-semibold text-zinc-200">Event Outcomes</p>
        <span class="rounded-md bg-white/10 px-2 py-1 text-xs text-zinc-300">
          {{ eventOutcomeLog.length }}
        </span>
      </div>
      <div class="mt-3 grid gap-2">
        <div
          v-for="outcome in eventOutcomeLog.slice(0, 5)"
          :key="outcome.id"
          class="rounded-md bg-white/10 px-3 py-2"
        >
          <p class="text-sm font-semibold text-zinc-100">{{ outcome.label }}</p>
          <p class="text-xs text-zinc-400">{{ outcome.source }} · {{ outcome.status }}</p>
        </div>
      </div>
    </div>

    <div v-if="narrativeEvents.length" class="mt-5 border-t border-white/15 pt-5">
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm font-semibold text-zinc-200">Narrative Events</p>
        <span class="rounded-md bg-white/10 px-2 py-1 text-xs text-zinc-300">
          {{ narrativeEvents.length }}
        </span>
      </div>
      <div class="mt-3 grid gap-2">
        <div
          v-for="event in narrativeEvents.slice(-3)"
          :key="event.id"
          class="rounded-md bg-white/10 px-3 py-2"
        >
          <p class="text-sm font-semibold text-zinc-100">{{ event.title }}</p>
          <p v-if="event.notes" class="mt-1 text-xs text-zinc-400">{{ event.notes }}</p>
          <p class="mt-1 text-xs text-zinc-500">{{ event.source }}</p>
        </div>
      </div>
    </div>

    <div v-if="rollModifiers.length" class="mt-5 border-t border-white/15 pt-5">
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm font-semibold text-zinc-200">Roll Modifiers</p>
        <span class="rounded-md bg-white/10 px-2 py-1 text-xs text-zinc-300">
          {{ rollModifiers.filter((modifier) => !modifier.used).length }}
        </span>
      </div>
      <div class="mt-3 grid gap-2">
        <div
          v-for="modifier in rollModifiers"
          :key="modifier.id"
          :class="[
            'rounded-md px-3 py-2',
            modifier.used ? 'bg-white/5 text-zinc-500' : 'bg-white/10 text-zinc-100'
          ]"
        >
          <div class="flex flex-wrap items-start justify-between gap-2">
            <p class="text-sm font-semibold">{{ modifier.label }}</p>
            <span class="rounded-md bg-zinc-950 px-2 py-1 text-xs font-semibold text-amber-300">
              {{ formatDm(modifier.dm) }}
            </span>
          </div>
          <p class="mt-1 text-xs text-zinc-400">
            {{ modifier.scope }} {{ modifier.target }}{{ modifier.used ? ' · used' : '' }}
          </p>
        </div>
      </div>
    </div>

    <div v-if="benefitRollLedger.length || benefitRollAdjustments.length" class="mt-5 border-t border-white/15 pt-5">
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm font-semibold text-zinc-200">Benefit Rolls</p>
        <span class="rounded-md bg-white/10 px-2 py-1 text-xs text-zinc-300">
          {{ totalAvailableBenefitRolls }}
        </span>
      </div>
      <div class="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div class="rounded-md bg-white/10 px-2 py-2">
          <p class="text-zinc-400">Earned</p>
          <p class="mt-1 text-sm font-semibold text-zinc-100">{{ totalBenefitRollsEarned }}</p>
        </div>
        <div class="rounded-md bg-white/10 px-2 py-2">
          <p class="text-zinc-400">Adjusted</p>
          <p class="mt-1 text-sm font-semibold text-zinc-100">{{ formatDm(totalBenefitRollAdjustments) }}</p>
        </div>
        <div class="rounded-md bg-white/10 px-2 py-2">
          <p class="text-zinc-400">Available</p>
          <p class="mt-1 text-sm font-semibold text-amber-300">{{ totalAvailableBenefitRolls }}</p>
        </div>
      </div>
      <div class="mt-3 grid gap-2">
        <div
          v-for="entry in benefitRollLedger.slice(-3)"
          :key="entry.id"
          class="rounded-md bg-white/10 px-3 py-2"
        >
          <p class="text-sm font-semibold text-zinc-100">{{ entry.label }}</p>
          <p class="text-xs text-zinc-400">Term {{ entry.termNumber }} · {{ entry.source }}</p>
        </div>
      </div>
    </div>

    <div v-if="totalDebt || medicalCareLog.length" class="mt-5 border-t border-white/15 pt-5">
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm font-semibold text-zinc-200">Debt</p>
        <span class="rounded-md bg-white/10 px-2 py-1 text-xs text-zinc-300">
          {{ totalDebt.toLocaleString() }} Cr
        </span>
      </div>
      <p v-if="psionicsTrainingCost" class="mt-2 text-xs text-zinc-400">
        Psionics testing/training: {{ psionicsTrainingCost.toLocaleString() }} Cr
      </p>
      <p v-if="medicalDebt" class="mt-1 text-xs text-zinc-400">
        Medical care: {{ medicalDebt.toLocaleString() }} Cr
      </p>
      <div v-if="medicalCareLog.length" class="mt-3 grid gap-2">
        <div
          v-for="entry in medicalCareLog.slice(-3)"
          :key="entry.id"
          class="rounded-md bg-white/10 px-3 py-2"
        >
          <p class="text-sm font-semibold text-zinc-100">
            {{ entry.characteristic.toUpperCase() }} +{{ entry.restored }}
          </p>
          <p class="text-xs text-zinc-400">
            {{ entry.cost.toLocaleString() }} Cr{{ entry.crisis ? ' · crisis care' : '' }}
          </p>
        </div>
      </div>
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
          <p v-if="term.details.length" class="mt-1 text-xs text-zinc-300">
            {{ term.details.slice(0, 2).join(' · ') }}
          </p>
        </div>
      </div>
      <span v-else class="mt-3 block text-sm text-zinc-400">No completed terms</span>
    </div>
  </aside>
</template>
