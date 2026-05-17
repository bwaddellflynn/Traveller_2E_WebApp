<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCharacterCreatorStore } from '~/stores/characterCreator'

const emit = defineEmits<{
  musterOut: []
}>()
const characterCreator = useCharacterCreatorStore()
const {
  addTermTab,
  musterOutAtTermEnd,
} = characterCreator
const {
  canCompleteTerm,
  canMusterOutAtTermEnd,
  musterOutAccessState,
  nextTermButtonLabel,
  termCompletionBlockers,
} = storeToRefs(characterCreator)

const logMusterOutAccess = () => {
  console.info('[Character Creator] Muster out button state', musterOutAccessState.value)
}

const handleMusterOutAtTermEnd = () => {
  logMusterOutAccess()
  musterOutAtTermEnd()
  emit('musterOut')
}
</script>

<template>
  <div class="mt-5 grid gap-3 border-t border-zinc-200 pt-5">
    <div v-if="termCompletionBlockers.length" class="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
      <p class="font-semibold">Before starting the next term</p>
      <ul class="mt-1 grid gap-1">
        <li v-for="blocker in termCompletionBlockers" :key="blocker">
          {{ blocker }}
        </li>
      </ul>
    </div>

    <div class="flex flex-wrap justify-center gap-3">
      <button
        class="h-10 rounded-md border border-zinc-300 px-4 text-sm font-semibold text-zinc-700 hover:border-zinc-500 disabled:cursor-not-allowed disabled:text-zinc-400"
        :disabled="!canMusterOutAtTermEnd"
        type="button"
        @mouseenter="logMusterOutAccess"
        @focus="logMusterOutAccess"
        @click="handleMusterOutAtTermEnd"
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
</template>
