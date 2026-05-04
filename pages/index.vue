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
    title: 'Character Sheets',
    eyebrow: 'Profiles',
    description: 'Enter, edit, save, and later export Traveller sheets built around the official sheet sections.',
    icon: 'user',
    to: '/character/sheet',
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
              <p class="text-2xl font-semibold">{{ userProfiles.length }}</p>
              <p class="mt-1 text-zinc-400">Saved Travellers</p>
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

      <div class="mt-8 rounded-lg border border-zinc-300 bg-white p-5 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-amber-700">Saved profiles</p>
            <h2 class="mt-1 text-xl font-semibold text-zinc-950">Travellers</h2>
          </div>
          <NuxtLink class="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800" to="/character/sheet">
            Enter existing Traveller
          </NuxtLink>
        </div>

        <div v-if="userProfiles.length" class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <NuxtLink
            v-for="profile in userProfiles"
            :key="profile.id"
            class="rounded-md border border-zinc-200 bg-stone-50 p-4 hover:border-amber-500 hover:bg-white"
            :to="`/character/sheet?id=${profile.id}`"
          >
            <p class="font-semibold text-zinc-950">{{ profile.identity.name || 'Unnamed Traveller' }}</p>
            <p class="mt-1 text-sm text-zinc-600">
              Age {{ profile.identity.age }} · {{ profile.source }}
            </p>
            <p class="mt-3 text-xs text-zinc-500">
              Updated {{ new Date(profile.updatedAt).toLocaleDateString() }}
            </p>
          </NuxtLink>
        </div>
        <p v-else class="mt-4 rounded-md bg-stone-50 p-4 text-sm text-zinc-600">
          No saved Travellers yet. Create one through lifepath or enter an existing sheet manually.
        </p>
      </div>
    </section>
  </main>
</template>
