<script setup lang="ts">
const tools = [
  {
    title: 'Species',
    eyebrow: 'Embassy',
    description: 'Reference species, origin books, character creation hooks, and implementation status.',
    icon: 'scout-badge',
    to: '/embassy',
    disabled: false,
  },
  {
    title: 'Character Creator',
    eyebrow: 'Dossiers',
    description: 'Build a Traveller from characteristics through early career choices using structured Core data.',
    icon: 'user',
    to: '/character/create',
    disabled: false,
  },
  {
    title: 'Equipment',
    eyebrow: 'Armoury',
    description: 'Reference weapons, armor, support items, and equipment from Core and catalogue source data.',
    icon: 'briefcase',
    to: '/weapons',
    disabled: false,
  },
  {
    title: 'Vehicles',
    eyebrow: 'Garage',
    description: 'Vehicle records and construction tools for ground, air, and specialist designs.',
    icon: 'car',
    to: '/vehicles',
    disabled: false,
  },
  {
    title: 'Robotics',
    eyebrow: 'Factory',
    description: 'Robot chassis, traits, components, and package assembly.',
    icon: 'bot',
    to: '/robots',
    disabled: false,
  },
  {
    title: 'Smallcraft',
    eyebrow: 'Shuttle Bay',
    description: 'Launches, ship boats, fighters, and utility craft.',
    icon: 'rocket',
    to: '/shuttlebay',
    disabled: false,
  },
  {
    title: 'Spacecraft',
    eyebrow: 'Shipyard',
    description: 'Hull planning, systems, drives, weapons, and operational summaries.',
    icon: 'ship',
    to: '/shipyard',
    disabled: false,
  },
] as const

</script>

<template>
  <main class="min-h-screen">
    <section class="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
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
