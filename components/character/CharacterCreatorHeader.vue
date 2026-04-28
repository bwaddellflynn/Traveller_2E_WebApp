<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCharacterCreatorStore } from '~/stores/characterCreator'

const characterCreator = useCharacterCreatorStore()
const {
  characterName,
} = storeToRefs(characterCreator)
</script>

<template>
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
</template>
