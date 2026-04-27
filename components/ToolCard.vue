<script setup lang="ts">
defineProps<{
  title: string
  eyebrow: string
  description: string
  icon: 'user' | 'briefcase' | 'wrench' | 'car' | 'bot' | 'rocket' | 'ship'
  to?: string
  disabled?: boolean
}>()
</script>

<template>
  <NuxtLink
    v-if="to && !disabled"
    :to="to"
    class="group grid min-h-44 content-between rounded-lg border border-zinc-300 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-900 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-600"
  >
    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-amber-700">{{ eyebrow }}</p>
        <h2 class="mt-2 text-xl font-semibold text-zinc-950">{{ title }}</h2>
      </div>
      <span class="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-zinc-950 text-white">
        <AppIcon :name="icon" />
      </span>
    </div>
    <div class="mt-6 flex items-end justify-between gap-4">
      <p class="max-w-sm text-sm leading-6 text-zinc-600">{{ description }}</p>
      <span class="text-zinc-500 transition group-hover:translate-x-1 group-hover:text-zinc-950">
        <AppIcon name="arrow" />
      </span>
    </div>
  </NuxtLink>

  <div
    v-else
    class="grid min-h-44 content-between rounded-lg border border-zinc-200 bg-zinc-50 p-5 text-zinc-500"
  >
    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-zinc-500">{{ eyebrow }}</p>
        <h2 class="mt-2 text-xl font-semibold text-zinc-700">{{ title }}</h2>
      </div>
      <span class="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-zinc-200 text-zinc-600">
        <AppIcon :name="icon" />
      </span>
    </div>
    <div class="mt-6 flex items-end justify-between gap-4">
      <p class="max-w-sm text-sm leading-6">{{ description }}</p>
      <span class="grid h-8 w-8 place-items-center rounded-md bg-zinc-200">
        <AppIcon name="lock" />
      </span>
    </div>
  </div>
</template>
