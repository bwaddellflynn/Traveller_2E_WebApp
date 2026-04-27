<script setup lang="ts">
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
    title: 'Weapons',
    eyebrow: 'Catalogue',
    description: 'Weapon lookup, filtering, comparison, and loadout planning.',
    icon: 'briefcase',
    to: undefined,
    disabled: true,
  },
  {
    title: 'Vehicles',
    eyebrow: 'Workshop',
    description: 'Vehicle records and construction tools for ground, air, and specialist designs.',
    icon: 'car',
    to: undefined,
    disabled: true,
  },
  {
    title: 'Robots',
    eyebrow: 'Factory',
    description: 'Robot chassis, traits, components, and package assembly.',
    icon: 'bot',
    to: undefined,
    disabled: true,
  },
  {
    title: 'Small Craft',
    eyebrow: 'Hangar',
    description: 'Launches, ship boats, fighters, and utility craft.',
    icon: 'rocket',
    to: undefined,
    disabled: true,
  },
  {
    title: 'Spacecraft',
    eyebrow: 'Shipyard',
    description: 'Hull planning, systems, drives, weapons, and operational summaries.',
    icon: 'ship',
    to: undefined,
    disabled: true,
  },
] as const
</script>

<template>
  <main class="min-h-screen">
    <section class="border-b border-zinc-300 bg-zinc-950 text-white">
      <div class="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10">
        <nav class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <span class="grid h-10 w-10 place-items-center rounded-md bg-amber-500 text-zinc-950">
              <AppIcon name="dice" />
            </span>
            <div>
              <p class="text-sm font-semibold">Traveller 2E Toolkit</p>
              <p class="text-xs text-zinc-400">Local rules data workspace</p>
            </div>
          </div>
          <NuxtLink
            class="rounded-md border border-white/20 px-3 py-2 text-sm font-medium text-zinc-100 hover:border-amber-400 hover:text-amber-200"
            to="/character/create"
          >
            Open creator
          </NuxtLink>
        </nav>

        <div class="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p class="text-sm font-semibold uppercase tracking-wide text-amber-300">Creation tools</p>
            <h1 class="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
              Build and reference Traveller records from structured book data.
            </h1>
          </div>
          <div class="grid grid-cols-3 gap-3 text-sm">
            <div class="rounded-md border border-white/15 p-4">
              <p class="text-2xl font-semibold">7</p>
              <p class="mt-1 text-zinc-400">Core JSON files</p>
            </div>
            <div class="rounded-md border border-white/15 p-4">
              <p class="text-2xl font-semibold">12</p>
              <p class="mt-1 text-zinc-400">Core careers</p>
            </div>
            <div class="rounded-md border border-white/15 p-4">
              <p class="text-2xl font-semibold">6</p>
              <p class="mt-1 text-zinc-400">Tool areas</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
