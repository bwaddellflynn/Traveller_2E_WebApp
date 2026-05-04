<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useCharacterCreatorStore } from '~/stores/characterCreator'

const characterCreator = useCharacterCreatorStore()
const {
  activeCreatorTab,
  characterName,
  currentAge,
  endOfTermAge,
} = storeToRefs(characterCreator)

const characterCreatorAgeLabel = computed(() => {
  if (['creation', 'setup-stats', 'setup-skills'].includes(activeCreatorTab.value)) return 'Age 18'
  return `Age ${currentAge.value}-${endOfTermAge.value}`
})
</script>

<template>
  <header class="mx-auto w-full max-w-7xl px-5 pt-6 sm:px-8 lg:px-10">
    <div class="hud-panel rounded-lg border p-5">
      <div class="flex justify-end">
        <label class="w-full max-w-md">
          <div class="flex h-11 flex-nowrap items-center gap-2 overflow-hidden rounded-md border border-zinc-300 bg-white px-3 text-zinc-950 outline-none focus-within:border-amber-600 focus-within:ring-2 focus-within:ring-amber-200">
            <input
              v-model="characterName"
              class="min-w-0 flex-1 bg-transparent text-zinc-950 outline-none"
              placeholder="Unnamed Traveller"
            >
            <span class="shrink-0 whitespace-nowrap rounded-md bg-stone-100 px-2 py-1 text-sm font-semibold text-zinc-700">
              {{ characterCreatorAgeLabel }}
            </span>
          </div>
        </label>
      </div>
    </div>
  </header>
</template>
