<script setup lang="ts">
import { computed, watch } from 'vue'
import type { CustomVehicleDesign } from '~/types/vehicle'
import { vehicleArmourRules } from '~/utils/traveller/vehicles'

const props = defineProps<{
  vehicle: CustomVehicleDesign
}>()

const emit = defineEmits<{
  (event: 'sync-derivations'): void
}>()

const techLevelOptions = Array.from({ length: 20 }, (_, index) => index + 1)
const armourRules = vehicleArmourRules()
const currentArmourRule = computed(() => (
  armourRules.find((rule) => props.vehicle.techLevel >= rule.minTl && (rule.maxTl === undefined || props.vehicle.techLevel <= rule.maxTl))
  ?? armourRules[armourRules.length - 1]
))

const formatTlRange = (minimum: number, maximum?: number) => maximum === undefined
  ? `${minimum}+`
  : minimum === maximum
    ? String(minimum)
    : `${minimum}-${maximum}`

const formatCredits = (value: number) => value >= 1000000 ? `MCr${value / 1000000}` : `Cr${value.toLocaleString()}`
const formatPercent = (value: number) => `${(value * 100).toFixed(value < 0.01 ? 2 : 1).replace(/\.0$/, '')}%`

const techLevelContext = computed(() => [
  'Vehicle type availability and baseline speed/range tables.',
  'Feature availability, including advanced locomotion and high-speed airframes.',
  'Power plant options such as grid, beamed, fission, fusion, Fusion+, solar, and antimatter.',
  'Speed and range customisation limits.',
  'Armour materials, base protection, maximum protection, armour volume, and armour cost.',
])

watch(
  () => props.vehicle.techLevel,
  () => {
    if (props.vehicle.techLevel < 1) props.vehicle.techLevel = 1
    emit('sync-derivations')
  },
)
</script>

<template>
  <div class="grid gap-4">
    <section class="overflow-hidden rounded-md border border-cyan-400/25 bg-slate-950/45 text-cyan-50 shadow-[0_0_28px_rgba(34,211,238,0.08)]">
      <div class="border-b border-cyan-400/30 bg-cyan-400/10 px-4 py-3 sm:px-5">
        <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-end">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200/80">Vehicle Design Step 1</p>
            <h3 class="mt-1 text-xl font-black uppercase tracking-wide text-cyan-50">Set Tech Level</h3>
          </div>
          <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            <span>Tech Level</span>
            <select v-model.number="props.vehicle.techLevel" class="h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm font-normal normal-case tracking-normal text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
              <option v-for="techLevel in techLevelOptions" :key="techLevel" :value="techLevel">TL {{ techLevel }}</option>
            </select>
          </label>
        </div>
      </div>

      <div class="grid min-h-[38rem] gap-6 p-4 sm:p-5 lg:grid-cols-[minmax(24rem,0.8fr)_minmax(22rem,1fr)]">
        <div class="relative flex h-[35.75rem] min-h-[35.75rem] w-full flex-col justify-start overflow-hidden rounded-md border border-cyan-400/20 bg-slate-900/35 p-5">
          <div
            aria-hidden="true"
            class="pointer-events-none absolute inset-0 opacity-30"
            style="background-image: linear-gradient(rgba(103,232,249,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(103,232,249,0.22) 1px, transparent 1px); background-size: 22px 22px;"
          />
          <div aria-hidden="true" class="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950/95 to-transparent" />
          <div class="relative z-10">
            <h4 class="text-3xl font-black uppercase leading-none tracking-wide text-cyan-50">Tech Level {{ vehicle.techLevel }}</h4>
            <p class="mt-3 max-w-xl text-sm leading-5 text-zinc-300">
              Tech Level sets the construction era for the design. It gates vehicle types, feature choices, power systems, speed and range customisation limits, and the armour materials available later in Protection.
            </p>
          </div>
          <div class="relative z-10 mt-8 grid gap-3">
            <div class="rounded-md border border-cyan-400/20 bg-slate-950/45 p-3">
              <p class="text-xs font-semibold uppercase tracking-wide text-cyan-100/80">Current Armour Context</p>
              <p class="mt-2 text-2xl font-black uppercase tracking-wide text-cyan-50">{{ currentArmourRule.materials }}</p>
              <p class="mt-2 text-sm leading-5 text-zinc-300">
                Base Protection +{{ currentArmourRule.baseProtection }} / Maximum Protection +{{ currentArmourRule.maximumProtection }}
              </p>
            </div>
            <ul class="grid gap-2 text-sm leading-5 text-zinc-300">
              <li v-for="item in techLevelContext" :key="item" class="rounded-md border border-cyan-400/15 bg-slate-950/35 px-3 py-2">{{ item }}</li>
            </ul>
          </div>
        </div>

        <div class="grid min-h-[35.75rem] content-start gap-5">
          <div class="grid content-start gap-px">
            <div class="grid grid-cols-[4rem_minmax(0,1fr)_5.5rem_5.5rem] text-xs font-black uppercase tracking-wide text-cyan-100">
              <div class="bg-cyan-400/20 px-2 py-2">TL</div>
              <div class="bg-cyan-400/20 px-2 py-2">Materials</div>
              <div class="bg-cyan-400/20 px-2 py-2">Base</div>
              <div class="bg-cyan-400/20 px-2 py-2">Max</div>
            </div>
            <div
              v-for="rule in armourRules"
              :key="`${rule.minTl}-${rule.maxTl ?? 'plus'}`"
              class="grid grid-cols-[4rem_minmax(0,1fr)_5.5rem_5.5rem] border-b border-cyan-400/25 text-sm"
              :class="rule === currentArmourRule ? 'bg-amber-300/10 text-amber-100' : 'text-zinc-200'"
            >
              <div class="border-r border-cyan-400/25 px-2 py-1">{{ formatTlRange(rule.minTl, rule.maxTl) }}</div>
              <div class="border-r border-cyan-400/25 px-2 py-1">{{ rule.materials }}</div>
              <div class="border-r border-cyan-400/25 px-2 py-1">+{{ rule.baseProtection }}</div>
              <div class="px-2 py-1">+{{ rule.maximumProtection }}</div>
            </div>
          </div>

          <div class="grid gap-2 rounded-md border border-cyan-400/20 bg-slate-950/35 p-3 text-sm">
            <div class="grid grid-cols-[9rem_minmax(0,1fr)] gap-px">
              <div class="bg-cyan-400/20 px-2 py-1 font-black uppercase tracking-wide text-cyan-100">Spaces / Point</div>
              <div class="border-b border-cyan-400/25 px-2 py-1 text-zinc-200">{{ formatPercent(currentArmourRule.vehicleSpacesPerPointPercent) }}</div>
              <div class="bg-cyan-400/20 px-2 py-1 font-black uppercase tracking-wide text-cyan-100">Armour Space</div>
              <div class="border-b border-cyan-400/25 px-2 py-1 text-zinc-200">{{ formatCredits(currentArmourRule.costPerArmourSpace) }}</div>
              <div class="bg-cyan-400/20 px-2 py-1 font-black uppercase tracking-wide text-cyan-100">Point Cost</div>
              <div class="border-b border-cyan-400/25 px-2 py-1 text-zinc-200">{{ formatCredits(currentArmourRule.costPerPointPerVehicleSpace) }} per vehicle Space</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
