<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCharacterCreatorStore } from '~/stores/characterCreator'

const characterCreator = useCharacterCreatorStore()
const {
  formatDm,
  checkLabel,
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
  eventOutcomeLog,
  associates,
  rollModifiers,
  benefitRollAdjustments,
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
      v-if="eventOutcomeLog.length || associates.length || rollModifiers.length || benefitRollAdjustments.length || careerConstraints.length"
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
</template>
