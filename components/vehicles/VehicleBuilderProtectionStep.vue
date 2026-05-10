<script setup lang="ts">
import type { CustomVehicleDesign } from '~/types/vehicle'

defineProps<{
  vehicle: CustomVehicleDesign
  summary: {
    armourSummary: {
      rule: {
        materials: string
      }
      baseProtection: number
      maximumProtection: number
      equivalentAddedProtection: number
      armourSpaces: number
      armourCost: number
    }
  }
}>()
</script>

<template>
  <!-- Protection is separated so armour decisions read as their own build stage. -->
  <div class="grid gap-4">
    <section class="rounded-md border border-cyan-400/20 bg-slate-950/30 p-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 class="text-sm font-semibold text-cyan-50">Armour</h3>
          <p class="mt-2 text-xs leading-5 text-zinc-400">
            Enter the final protection on each face. Base protection, maximum protection, and armour-space consumption are all derived from handbook TL and size tables.
          </p>
        </div>
        <div class="rounded-md border border-cyan-400/20 bg-slate-950/40 px-3 py-2 text-right">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Derived Protection</p>
          <p class="mt-1 text-sm font-semibold text-cyan-50">Hull {{ vehicle.hull }}</p>
          <p class="text-sm text-cyan-100/80">Structure {{ vehicle.structure || '-' }}</p>
        </div>
      </div>

      <div class="mt-4 grid gap-3 md:grid-cols-3">
        <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>Materials</span>
          <input :value="summary.armourSummary.rule.materials" readonly class="h-10 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none">
        </label>
        <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>Base Protection</span>
          <input :value="`+${summary.armourSummary.baseProtection}`" readonly class="h-10 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none">
        </label>
        <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>Maximum Protection</span>
          <input :value="`+${summary.armourSummary.maximumProtection}`" readonly class="h-10 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none">
        </label>
        <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>Equivalent Added Armour</span>
          <input :value="summary.armourSummary.equivalentAddedProtection" readonly class="h-10 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none">
        </label>
        <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>Armour Spaces</span>
          <input :value="summary.armourSummary.armourSpaces" readonly class="h-10 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none">
        </label>
        <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>Armour Cost</span>
          <input :value="`Cr${Math.round(summary.armourSummary.armourCost).toLocaleString()}`" readonly class="h-10 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none">
        </label>
      </div>

      <div class="mt-4 grid gap-3 md:grid-cols-3">
        <label v-for="facing in ['forward', 'port', 'dorsal', 'aft', 'starboard', 'ventral']" :key="facing" class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>{{ facing }}</span>
          <input v-model="vehicle.armour[facing]" class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="Armour value">
        </label>
      </div>
      <p class="mt-3 text-xs leading-5 text-zinc-400">
        Dorsal armour may drop below the base value only on open-topped or open-frame vehicles. AFV multiplies the handbook maximum protection by three.
      </p>
    </section>
  </div>
</template>
