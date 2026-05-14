<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '~/components/AppIcon.vue'
import type { CustomVehicleDesign } from '~/types/vehicle'
import { vehicleComfortLevels, vehicleComfortLevelRuleForValue, vehicleOccupantComfortSummaries } from '~/utils/traveller/vehicles'

const props = defineProps<{
  vehicle: CustomVehicleDesign
  occupantSpaces: number
}>()

defineEmits<{
  (event: 'add-occupant', category: 'crew' | 'passenger'): void
  (event: 'remove-occupant', index: number): void
  (event: 'sync-derivations'): void
}>()

const comfortRules = vehicleComfortLevels()
const occupantComfortSummaries = computed(() => vehicleOccupantComfortSummaries(props.vehicle.occupantEntries))
const comfortLevelForEntry = (count: number, spacesEach: number) => {
  const occupantCount = Math.max(0, Number(count ?? 0))
  if (occupantCount <= 0) return 0
  return Math.max(0, Number(spacesEach ?? 0))
}
const comfortRuleForEntry = (spacesEach: number) => vehicleComfortLevelRuleForValue(Math.max(0, Number(spacesEach ?? 0)))
const formatComfortNumber = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
const formatComfortRange = (minimum: number, maximum: number | null) => (
  maximum === null
    ? `${minimum}+`
    : minimum === 0
      ? `< ${maximum}`
      : `${minimum}-${maximum}`
)
</script>

<template>
  <div class="grid gap-4">
    <section class="rounded-md border border-cyan-400/20 bg-slate-950/30 p-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 class="text-sm font-semibold text-cyan-50">Crew & Passengers</h3>
          <p class="mt-2 text-xs leading-5 text-zinc-400">
            Assign the people this vehicle carries. Space per person determines seating comfort and long-duration task penalties.
          </p>
        </div>
        <div class="rounded-md border border-cyan-400/20 bg-slate-950/40 px-3 py-2 text-right">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Reserved</p>
          <p class="mt-1 text-sm font-semibold text-cyan-50">{{ occupantSpaces }} Spaces</p>
        </div>
      </div>

      <div class="mt-4 flex flex-wrap gap-2">
          <button class="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 hover:border-amber-600" type="button" @click="$emit('add-occupant', 'crew')">
            Add Crew
          </button>
          <button class="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 hover:border-amber-600" type="button" @click="$emit('add-occupant', 'passenger')">
            Add Passengers
          </button>
      </div>
    </section>

    <section v-if="occupantComfortSummaries.length" class="rounded-md border border-cyan-400/20 bg-slate-950/30 p-4">
      <h3 class="text-sm font-semibold text-cyan-50">Seating Result</h3>
      <div class="mt-3 grid gap-3 md:grid-cols-2">
        <div
          v-for="summary in occupantComfortSummaries"
          :key="summary.category"
          class="rounded-md border border-cyan-400/20 bg-slate-950/40 p-3"
        >
          <p class="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{{ summary.label }}</p>
          <p class="mt-2 text-base font-semibold text-cyan-50">
            {{ summary.rule.label }} <span class="text-sm text-cyan-100/70">({{ formatComfortNumber(summary.comfortLevel) }})</span>
          </p>
          <p class="mt-1 text-xs leading-5 text-zinc-400">{{ summary.rule.effect }}</p>
          <p class="mt-2 text-[11px] leading-5 text-cyan-100/70">
            {{ summary.count }} occupants / {{ formatComfortNumber(summary.spaces) }} Spaces
          </p>
        </div>
      </div>
    </section>

    <section class="rounded-md border border-cyan-400/20 bg-slate-950/30 p-4">
      <div v-if="props.vehicle.occupantEntries.length" class="grid gap-3">
        <div
          v-for="(entry, index) in props.vehicle.occupantEntries"
          :key="`vehicle-occupant-${index}`"
          class="rounded-md border border-cyan-400/20 bg-slate-950/40 p-3"
        >
          <div class="mb-3 flex justify-end">
            <button class="inline-flex items-center text-red-300 hover:text-red-200" type="button" @click="$emit('remove-occupant', index)">
              <AppIcon class="h-4 w-4" name="close" />
            </button>
          </div>

          <div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_8rem_8rem_10rem]">
            <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <span>Role</span>
              <input
                v-model="entry.role"
                class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                placeholder="Driver"
                @input="$emit('sync-derivations')"
              >
            </label>
            <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <span>Count</span>
              <input
                v-model.number="entry.count"
                min="0"
                step="1"
                type="number"
                class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                @input="$emit('sync-derivations')"
              >
            </label>
            <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <span>Spaces Each</span>
              <input
                v-model.number="entry.spacesEach"
                min="0"
                step="0.5"
                type="number"
                class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                @input="$emit('sync-derivations')"
              >
            </label>
            <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <span>Type</span>
              <select
                v-model="entry.category"
                class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                @change="$emit('sync-derivations')"
              >
                <option value="crew">Crew</option>
                <option value="passenger">Passenger</option>
              </select>
            </label>
          </div>

          <div class="mt-3 rounded-md border border-cyan-400/15 bg-slate-950/35 px-3 py-2">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              {{ comfortRuleForEntry(entry.spacesEach).label }} ({{ formatComfortNumber(comfortLevelForEntry(entry.count, entry.spacesEach)) }})
            </p>
            <p class="mt-1 text-xs leading-5 text-zinc-400">
              {{ comfortRuleForEntry(entry.spacesEach).effect }}
            </p>
          </div>
        </div>
      </div>

      <p v-else class="rounded-md bg-stone-50 p-3 text-sm text-zinc-600">
        Add at least one crew position.
      </p>
    </section>

    <section class="rounded-md border border-cyan-400/20 bg-slate-950/30 p-4">
      <h3 class="text-sm font-semibold text-cyan-50">Seat Types</h3>
      <div class="mt-3 overflow-hidden rounded-md border border-cyan-400/20">
        <div class="grid grid-cols-[6rem_minmax(9rem,0.8fr)_minmax(0,1.4fr)] bg-cyan-400/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100/80">
          <span>Level</span>
          <span>Type</span>
          <span>Effect</span>
        </div>
        <div
          v-for="rule in comfortRules"
          :key="rule.id"
          class="grid grid-cols-[6rem_minmax(9rem,0.8fr)_minmax(0,1.4fr)] border-t border-cyan-400/10 px-3 py-2 text-xs text-zinc-200"
        >
          <span>{{ formatComfortRange(rule.minimum, rule.maximum) }}</span>
          <span class="font-semibold text-cyan-50">{{ rule.label }}</span>
          <span>{{ rule.effect }}</span>
        </div>
      </div>
    </section>
  </div>
</template>
