<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useTravellersStore } from '~/stores/travellers'

const travellers = useTravellersStore()
const { userProfiles } = storeToRefs(travellers)

onMounted(() => {
  travellers.loadProfiles()
})

const tools = [
  {
    title: 'Character Creator',
    eyebrow: 'Core Rulebook',
    description: 'Build a Traveller from characteristics through early career choices using structured Core data.',
    icon: 'user',
    to: '/character/create',
    disabled: false,
  },
  {
    title: 'Catalogue',
    eyebrow: 'Armory',
    description: 'Reference weapons, armor, support items, and equipment from Core and catalogue source data.',
    icon: 'briefcase',
    to: '/weapons',
    disabled: false,
  },
  {
    title: 'Garage',
    eyebrow: 'Vehicles',
    description: 'Vehicle records and construction tools for ground, air, and specialist designs.',
    icon: 'car',
    to: undefined,
    disabled: true,
  },
  {
    title: 'Factory',
    eyebrow: 'Robots',
    description: 'Robot chassis, traits, components, and package assembly.',
    icon: 'bot',
    to: undefined,
    disabled: true,
  },
  {
    title: 'Shuttle Bay',
    eyebrow: 'Small Craft',
    description: 'Launches, ship boats, fighters, and utility craft.',
    icon: 'rocket',
    to: undefined,
    disabled: true,
  },
  {
    title: 'Shipyard',
    eyebrow: 'Spacecraft',
    description: 'Hull planning, systems, drives, weapons, and operational summaries.',
    icon: 'ship',
    to: undefined,
    disabled: true,
  },
] as const

</script>

<template>
  <main class="min-h-screen">
    <section class="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
      <div class="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div>
          <p class="hud-kicker text-sm font-semibold uppercase tracking-wide">Creation tools</p>
          <h1 class="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
            Build and reference Traveller records from structured book data.
          </h1>
        </div>
        <div class="grid grid-cols-3 gap-3 text-sm">
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
      </div>
    </section>

    <section class="mx-auto w-full max-w-7xl px-5 pb-8 sm:px-8 lg:px-10">
      <div class="grid content-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <ToolCard
          v-for="tool in tools"
          :key="tool.title"
          :description="tool.description"
          :disabled="tool.disabled"
          :eyebrow="tool.eyebrow"
          :icon="tool.icon"
          :title="tool.title"
          :to="tool.to"
        />
      </div>
    </section>
  </main>
</template>
