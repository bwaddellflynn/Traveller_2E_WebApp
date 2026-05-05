<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useTravellersStore } from '~/stores/travellers'

const travellers = useTravellersStore()
const { userProfiles } = storeToRefs(travellers)

onMounted(async () => {
  await travellers.loadProfiles()
})
</script>

<template>
  <main class="min-h-screen">
    <section class="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 lg:px-10">
      <p class="hud-kicker text-sm font-semibold uppercase tracking-wide">About</p>
      <h1 class="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
        A local toolkit for structured Traveller 2E creation and reference data.
      </h1>
      <p class="mt-5 max-w-3xl text-sm leading-6 text-cyan-100/80">
        ScoutSuite organizes character creation, armory references, vehicle records, and future construction tools into a persistent workspace for Mongoose Traveller 2E campaigns.
      </p>

      <div class="mt-8 grid gap-3 text-sm sm:grid-cols-3">
        <div class="hud-stat rounded-md border p-4">
          <p class="text-2xl font-semibold">7</p>
          <p class="mt-1 text-zinc-400">Core JSON files</p>
        </div>
        <div class="hud-stat rounded-md border p-4">
          <p class="text-2xl font-semibold">12</p>
          <p class="mt-1 text-zinc-400">Core careers</p>
        </div>
        <div class="hud-stat rounded-md border p-4">
          <p class="text-2xl font-semibold">{{ userProfiles.length }}</p>
          <p class="mt-1 text-zinc-400">Saved Travellers</p>
        </div>
      </div>

      <div class="hud-panel mt-8 rounded-lg border p-5">
        <h2 class="text-xl font-semibold">Current Scope</h2>
        <div class="mt-4 grid gap-3 text-sm leading-6 text-cyan-100/80 sm:grid-cols-2">
          <p>Character creation is focused on Core Rulebook lifepath flow, term history, events, mishaps, education, and mustering out.</p>
          <p>Reference views are being expanded across weapons, armour, equipment, vehicles, and later robots, small craft, and spacecraft.</p>
        </div>
      </div>
    </section>
  </main>
</template>
