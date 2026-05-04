<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCharacterCreatorStore } from '~/stores/characterCreator'

const characterCreator = useCharacterCreatorStore()
const {
  characterName,
} = storeToRefs(characterCreator)
</script>

<template>
  <header class="mx-auto w-full max-w-7xl px-5 pt-6 sm:px-8 lg:px-10">
    <div class="hud-panel rounded-lg border p-5">
      <div class="grid gap-5 lg:grid-cols-[1fr_22rem] lg:items-end">
        <div>
          <p class="hud-kicker text-sm font-semibold uppercase tracking-wide">Core Rulebook</p>
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
</template>
