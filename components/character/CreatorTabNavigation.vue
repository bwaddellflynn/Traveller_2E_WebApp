<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCharacterCreatorStore } from '~/stores/characterCreator'

const characterCreator = useCharacterCreatorStore()
const {
  addTermTab,
  selectTermTab,
} = characterCreator
const {
  activeCreatorTab,
  canAddTermTab,
  termTabs,
} = storeToRefs(characterCreator)
</script>

<template>
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
</template>
