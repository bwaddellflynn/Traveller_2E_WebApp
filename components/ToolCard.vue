<script setup lang="ts">
defineProps<{
  title: string
  eyebrow: string
  description: string
  icon: 'user' | 'briefcase' | 'wrench' | 'car' | 'bot' | 'rocket' | 'ship' | 'scout-badge'
  to?: string
  disabled?: boolean
}>()
</script>

<template>
  <NuxtLink
    v-if="to && !disabled"
    :to="to"
    class="hud-panel group grid min-h-44 content-between rounded-lg border p-5 shadow-sm transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-cyan-300"
  >
    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-amber-700">{{ eyebrow }}</p>
        <h2 class="mt-2 text-xl font-semibold text-zinc-950">{{ title }}</h2>
      </div>
      <span class="hud-glyph grid h-10 w-10 shrink-0 place-items-center rounded-md">
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
    class="hud-panel grid min-h-44 content-between rounded-lg border p-5 opacity-55"
  >
    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-zinc-500">{{ eyebrow }}</p>
        <h2 class="mt-2 text-xl font-semibold text-zinc-700">{{ title }}</h2>
        <p class="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[rgba(253,230,138,0.82)]">
          <AppIcon name="warning" />
          Coming soon
        </p>
      </div>
      <span class="hud-glyph grid h-10 w-10 shrink-0 place-items-center rounded-md opacity-60">
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
