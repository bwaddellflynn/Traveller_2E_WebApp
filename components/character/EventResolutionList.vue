<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { reactive } from 'vue'
import { useCharacterCreatorStore } from '~/stores/characterCreator'

const characterCreator = useCharacterCreatorStore()
const {
  resolveEventChoice,
  resolveManualEventResolution,
  rollEventResolutionTable,
  enterManualEventResolutionTable,
  skillOptionLabel,
} = characterCreator
const {
  pendingEventResolutions,
} = storeToRefs(characterCreator)

const manualTableRolls = reactive<Record<string, number | null>>({})
</script>

<template>
  <div v-if="pendingEventResolutions.length" class="mt-3 grid gap-3">
    <div
      v-for="resolution in pendingEventResolutions"
      :key="resolution.id"
      :class="[
        'rounded-md p-3 text-sm',
        resolution.resolved ? 'bg-emerald-50 text-emerald-950' : 'bg-amber-50 text-amber-950'
      ]"
    >
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="font-semibold">{{ resolution.resolved ? 'Resolved' : 'Resolution needed' }}</p>
          <p class="mt-1">{{ resolution.label }}</p>
          <p v-if="resolution.selected" class="mt-1 text-xs">Selected: {{ skillOptionLabel(resolution.selected) }}</p>
        </div>
      </div>

      <div v-if="resolution.kind === 'skill_choice' && !resolution.resolved" class="mt-3 flex flex-wrap gap-2">
        <button
          v-for="choice in resolution.options"
          :key="choice"
          class="h-9 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
          type="button"
          @click="resolveEventChoice(resolution.id, choice)"
        >
          {{ skillOptionLabel(choice) }}
        </button>
      </div>

      <button
        v-if="resolution.kind === 'manual' && !resolution.resolved"
        class="mt-3 h-9 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
        type="button"
        @click="resolveManualEventResolution(resolution.id)"
      >
        Mark resolved
      </button>

      <div v-if="resolution.kind === 'table_roll' && !resolution.resolved" class="mt-3 flex flex-wrap items-center gap-2">
        <button
          class="h-9 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
          type="button"
          @click="rollEventResolutionTable(resolution.id)"
        >
          Roll {{ resolution.diceCount }}D
        </button>
        <input
          v-model.number="manualTableRolls[resolution.id]"
          class="h-9 w-20 rounded-md border border-amber-300 bg-white px-2 text-sm text-amber-950"
          :max="resolution.diceCount === 2 ? 12 : 6"
          :min="resolution.diceCount === 2 ? 2 : 1"
          type="number"
        >
        <button
          class="h-9 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
          type="button"
          @click="enterManualEventResolutionTable(resolution.id, manualTableRolls[resolution.id] ?? Number.NaN)"
        >
          Apply
        </button>
      </div>
    </div>
  </div>
</template>
