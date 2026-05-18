<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '~/components/AppIcon.vue'
import type { CustomVehicleDesign } from '~/types/vehicle'
import { vehicleComfortLevels, vehicleComfortLevelRuleForValue, vehicleOccupantComfortSummaries } from '~/utils/traveller/vehicles'
import { vehicleSilhouetteImageClass, vehicleSilhouetteSource } from '~/utils/vehicleBuilderSilhouettes'

const props = defineProps<{
  vehicle: CustomVehicleDesign
  occupantSpaces: number
}>()

const emit = defineEmits<{
  (event: 'add-occupant', category: CustomVehicleDesign['occupantEntries'][number]['category']): void
  (event: 'remove-occupant', index: number): void
  (event: 'sync-derivations'): void
}>()

const comfortRules = vehicleComfortLevels()
const roleOptions = [
  'Driver',
  'Pilot',
  'Operator',
  'Commander',
  'Gunner',
  'Loader',
  'Engineer',
  'Sensor Operator',
  'Comms Operator',
  'Mechanic',
  'Medic',
  'Troops',
  'Passengers',
  'Residents',
]
const occupantComfortSummaries = computed(() => vehicleOccupantComfortSummaries(props.vehicle.occupantEntries))
const silhouetteSource = computed(() => vehicleSilhouetteSource(props.vehicle.baseFamily))
const silhouetteImageClass = computed(() => vehicleSilhouetteImageClass(props.vehicle.baseFamily))
const totalOccupants = computed(() => props.vehicle.occupantEntries.reduce((total, entry) => total + Math.max(0, Number(entry.count ?? 0)), 0))
const crewCount = computed(() => props.vehicle.occupantEntries.filter((entry) => entry.category === 'crew').reduce((total, entry) => total + Math.max(0, Number(entry.count ?? 0)), 0))
const passengerCount = computed(() => props.vehicle.occupantEntries.filter((entry) => entry.category === 'passenger').reduce((total, entry) => total + Math.max(0, Number(entry.count ?? 0)), 0))
const seatingOptions = computed(() => comfortRules.map((rule) => ({
  ...rule,
  spacesEach: rule.id === 'intolerable' ? 0.25 : rule.minimum,
})))

const formatNumber = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
const formatComfortRange = (minimum: number, maximum: number | null) => (
  maximum === null
    ? `${minimum}+`
    : minimum === 0
      ? `< ${maximum}`
      : `${minimum}-${maximum}`
)
const comfortRuleForEntry = (spacesEach: number) => vehicleComfortLevelRuleForValue(Math.max(0, Number(spacesEach ?? 0)))
const seatingValueForEntry = (spacesEach: number) => Number(spacesEach ?? 0) > 0 ? comfortRuleForEntry(spacesEach).id : ''
const selectValue = (event: Event) => (event.target as HTMLSelectElement).value
const updateEntrySeating = (entry: CustomVehicleDesign['occupantEntries'][number], ruleId: string) => {
  const selected = seatingOptions.value.find((option) => option.id === ruleId)
  if (!selected) {
    entry.spacesEach = 0
    emit('sync-derivations')
    return
  }
  entry.spacesEach = selected.spacesEach
  emit('sync-derivations')
}
const updateEntryCategory = (entry: CustomVehicleDesign['occupantEntries'][number], category: CustomVehicleDesign['occupantEntries'][number]['category']) => {
  entry.category = category
  if (category === 'passenger') {
    entry.role = 'Passenger'
  }
  else if (!category) {
    entry.role = ''
  }
  emit('sync-derivations')
}
</script>

<template>
  <section class="overflow-hidden rounded-md border border-cyan-400/30 bg-slate-950/80">
    <datalist id="vehicle-occupant-role-options">
      <option v-for="role in roleOptions" :key="role" :value="role" />
    </datalist>

    <div class="vehicle-builder-step-header">
      <div class="vehicle-builder-step-header__inner">
      <div class="vehicle-builder-step-header__title">
        <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200/80">Vehicle Design Step 11</p>
        <h3 class="mt-1 text-xl font-black uppercase tracking-wide text-cyan-50">Crew & Passengers</h3>
      </div>
      <div class="vehicle-builder-step-header__controls">
        <div class="vehicle-builder-step-header__control-row justify-items-start sm:justify-items-end">
          <button class="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-sm font-semibold text-cyan-50 hover:border-cyan-200" type="button" @click="$emit('add-occupant', '')">
            Add Occupant
          </button>
        </div>
        <p class="vehicle-builder-step-header__message" aria-hidden="true">&nbsp;</p>
      </div>
      </div>
    </div>
    </div>

    <div class="vehicle-builder-two-panel p-4 sm:p-5">
      <div class="vehicle-builder-panel-card vehicle-builder-visual-card relative flex w-full flex-col bg-slate-900/35 p-5">
        <div
          aria-hidden="true"
          class="pointer-events-none absolute inset-0 opacity-30"
          style="background-image: linear-gradient(rgba(103,232,249,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(103,232,249,0.22) 1px, transparent 1px); background-size: 22px 22px;"
        />
        <div aria-hidden="true" class="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950/95 to-transparent" />
        <div class="vehicle-builder-visual-copy">
          <h4 class="text-3xl font-black uppercase leading-none tracking-wide text-cyan-50">Occupancy</h4>
          <p class="mt-3 max-w-xl text-sm leading-5 text-zinc-300">
            Assign crew stations and passenger capacity. Each occupant group spends vehicle Spaces, and the Space per person determines the comfort result used in the final vehicle profile.
          </p>
        </div>

        <div class="vehicle-builder-visual-summary mt-6 grid gap-3 rounded-md border border-cyan-400/20 bg-slate-950/45 p-3">
          <div class="grid grid-cols-3 gap-2">
            <div class="rounded-md border border-cyan-400/20 bg-slate-950/50 p-3">
              <p class="text-[11px] font-black uppercase tracking-wide text-cyan-100/70">Crew</p>
              <p class="mt-2 text-xl font-black text-cyan-50">{{ crewCount }}</p>
            </div>
            <div class="rounded-md border border-cyan-400/20 bg-slate-950/50 p-3">
              <p class="text-[11px] font-black uppercase tracking-wide text-cyan-100/70">Passengers</p>
              <p class="mt-2 text-xl font-black text-cyan-50">{{ passengerCount }}</p>
            </div>
            <div class="rounded-md border border-cyan-400/20 bg-slate-950/50 p-3">
              <p class="text-[11px] font-black uppercase tracking-wide text-cyan-100/70">Spaces</p>
              <p class="mt-2 text-xl font-black text-cyan-50">{{ formatNumber(occupantSpaces) }}</p>
            </div>
          </div>
          <div v-if="occupantComfortSummaries.length" class="grid gap-2">
            <div v-for="summary in occupantComfortSummaries" :key="summary.category" class="rounded-md border border-cyan-400/20 bg-slate-950/50 p-3">
              <p class="text-[11px] font-black uppercase tracking-wide text-cyan-100/70">{{ summary.label }}</p>
              <p class="mt-1 text-base font-black uppercase tracking-wide text-cyan-50">{{ summary.rule.label }}</p>
              <p class="mt-1 text-xs leading-5 text-zinc-300">{{ summary.rule.effect }}</p>
            </div>
          </div>
        </div>

        <img
          :src="silhouetteSource"
          alt=""
          class="vehicle-builder-visual-art pointer-events-none object-contain object-bottom opacity-80 drop-shadow-[0_0_32px_rgba(103,232,249,0.26)]"
          :class="silhouetteImageClass"
          draggable="false"
        >
      </div>

      <div class="vehicle-builder-panel grid content-start gap-5">
        <div class="min-w-0 rounded-md border border-cyan-400/25 bg-slate-950/45 p-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-black uppercase tracking-wide text-cyan-100/70">Occupant Groups</p>
              <p class="mt-1 text-sm text-zinc-300">{{ totalOccupants }} assigned across {{ vehicle.occupantEntries.length }} groups.</p>
            </div>
            <p class="text-sm font-black text-cyan-50">{{ formatNumber(occupantSpaces) }} Spaces</p>
          </div>

          <div v-if="vehicle.occupantEntries.length" class="mt-4 grid gap-3">
            <div v-for="(entry, index) in vehicle.occupantEntries" :key="`occupant-${index}`" class="min-w-0 rounded-md border border-cyan-400/20 bg-slate-950/50 p-3">
              <div class="mb-3 flex items-center justify-between gap-3">
                <p class="text-xs font-black uppercase tracking-wide text-cyan-100/70">{{ comfortRuleForEntry(entry.spacesEach).label }}</p>
                <button class="grid h-8 w-8 place-items-center rounded-md border border-red-300/25 text-red-200 hover:border-red-200" type="button" @click="$emit('remove-occupant', index)">
                  <AppIcon class="h-4 w-4" name="close" />
                </button>
              </div>

              <div class="grid min-w-0 gap-3 sm:grid-cols-2">
                <label class="grid gap-1 text-[11px] font-black uppercase tracking-wide text-cyan-100/70">
                  <span>Type</span>
                  <select :value="entry.category" class="h-10 min-w-0 rounded-md border border-cyan-400/25 bg-slate-950/70 px-3 text-sm font-normal normal-case tracking-normal text-cyan-50 outline-none focus:border-cyan-200" @change="updateEntryCategory(entry, selectValue($event) === 'crew' || selectValue($event) === 'passenger' ? selectValue($event) as CustomVehicleDesign['occupantEntries'][number]['category'] : '')">
                    <option value="">—</option>
                    <option value="crew">Crew</option>
                    <option value="passenger">Passenger</option>
                  </select>
                </label>
                <label class="grid gap-1 text-[11px] font-black uppercase tracking-wide text-cyan-100/70">
                  <span>Seating</span>
                  <select :value="seatingValueForEntry(entry.spacesEach)" class="h-10 min-w-0 rounded-md border border-cyan-400/25 bg-slate-950/70 px-3 text-sm font-normal normal-case tracking-normal text-cyan-50 outline-none focus:border-cyan-200" @change="updateEntrySeating(entry, selectValue($event))">
                    <option value="">—</option>
                    <option v-for="option in seatingOptions" :key="option.id" :value="option.id">
                      {{ option.label }} ({{ formatNumber(option.spacesEach) }} Space{{ option.spacesEach === 1 ? '' : 's' }})
                    </option>
                  </select>
                </label>
                <label class="grid gap-1 text-[11px] font-black uppercase tracking-wide text-cyan-100/70">
                  <span>Count</span>
                  <input v-model.number="entry.count" min="0" step="1" type="number" class="h-10 min-w-0 rounded-md border border-cyan-400/25 bg-slate-950/70 px-3 text-sm font-normal text-cyan-50 outline-none focus:border-cyan-200" @input="$emit('sync-derivations')">
                </label>
                <label
                  class="grid gap-1 text-[11px] font-black uppercase tracking-wide transition-opacity"
                  :class="entry.category === 'passenger' ? 'text-cyan-100/35 opacity-70' : 'text-cyan-100/70'"
                >
                  <span>Role</span>
                  <input
                    v-model="entry.role"
                    :disabled="entry.category === 'passenger'"
                    list="vehicle-occupant-role-options"
                    class="h-10 min-w-0 rounded-md border border-cyan-400/25 bg-slate-950/70 px-3 text-sm font-normal normal-case tracking-normal text-cyan-50 outline-none transition focus:border-cyan-200 disabled:cursor-not-allowed disabled:border-cyan-400/10 disabled:bg-slate-900/35 disabled:text-cyan-200/35 disabled:shadow-none"
                    placeholder="Driver, Gunner, Passengers"
                    @input="$emit('sync-derivations')"
                  >
                </label>
              </div>
              <p class="mt-3 text-[11px] font-black uppercase tracking-wide text-cyan-100/70">
                {{ formatNumber(Math.max(0, Number(entry.count ?? 0)) * Math.max(0, Number(entry.spacesEach ?? 0))) }} Spaces reserved / {{ formatNumber(Math.max(0, Number(entry.spacesEach ?? 0))) }} per occupant
              </p>
              <p class="mt-3 text-xs leading-5 text-zinc-400">{{ comfortRuleForEntry(entry.spacesEach).description }}</p>
            </div>
          </div>
          <p v-else class="mt-4 rounded-md border border-cyan-400/20 bg-slate-950/50 p-3 text-sm text-zinc-300">Add at least one crew station.</p>
        </div>

        <div class="min-w-0 overflow-hidden rounded-md border border-cyan-400/25">
          <div class="grid grid-cols-[5.25rem_minmax(7rem,0.75fr)_minmax(0,1fr)] bg-cyan-400/15 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100">
            <span>Level</span>
            <span>Comfort</span>
            <span>Effect</span>
          </div>
          <div v-for="rule in comfortRules" :key="rule.id" class="grid grid-cols-[5.25rem_minmax(7rem,0.75fr)_minmax(0,1fr)] items-start border-t border-cyan-400/10 px-3 py-2 text-xs text-zinc-200">
            <span>{{ formatComfortRange(rule.minimum, rule.maximum) }}</span>
            <span class="font-semibold text-cyan-50">{{ rule.label }}</span>
            <span class="min-w-0 whitespace-normal break-words leading-5">{{ rule.effect }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
