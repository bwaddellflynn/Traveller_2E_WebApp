<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCharacterCreatorStore } from '~/stores/characterCreator'

const characterCreator = useCharacterCreatorStore()
const {
  addTermTab,
  musterOut,
} = characterCreator
const {
  canCompleteTerm,
  lifepathComplete,
  nextTermButtonLabel,
  termHistory,
} = storeToRefs(characterCreator)
</script>

<template>
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
</template>
