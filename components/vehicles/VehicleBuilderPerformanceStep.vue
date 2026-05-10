<script setup lang="ts">
import { computed, watch } from 'vue'
import type { CustomVehicleDesign } from '~/types/vehicle'
import { vehicleFamilyRule } from '~/utils/traveller/vehicles'

const props = defineProps<{
  vehicle: CustomVehicleDesign
  optionSets: {
    comfortLevels: string[]
    primaryPowerOptions: Array<{ id: string, label: string, minimumTechLevel: number, notes: string }>
    auxiliaryDriveOptions: Array<{ id: string, label: string, minimumTechLevel: number, notes: string }>
  }
  summary: {
    availableSpaces: number
    auxiliarySpaces: number
    auxiliarySummary: null | { speed: string, agility: string, range: string }
  }
}>()

const emit = defineEmits<{
  (event: 'sync-derivations'): void
}>()

const familyRule = computed(() => vehicleFamilyRule(props.vehicle.baseFamily))
const speedStepOptions = [
  { value: -3, label: '-3 Bands' },
  { value: -2, label: '-2 Bands' },
  { value: -1, label: '-1 Band' },
  { value: 0, label: 'No Change' },
  { value: 1, label: '+1 Band' },
  { value: 2, label: '+2 Bands' },
  { value: 3, label: '+3 Bands' },
]
const rangeEfficiencyOptions = [
  { value: -3, label: '-75%' },
  { value: -2, label: '-50%' },
  { value: -1, label: '-25%' },
  { value: 0, label: 'No Change' },
  { value: 1, label: '+50%' },
  { value: 2, label: '+100%' },
  { value: 3, label: '+150%' },
]
const fuelCapacityOptions = [
  { value: -2, label: '-50%' },
  { value: -1, label: '-25%' },
  { value: 0, label: 'No Change' },
  { value: 1, label: '+25%' },
  { value: 2, label: '+50%' },
  { value: 3, label: '+75%' },
  { value: 4, label: '+100%' },
]

watch(
  () => [
    props.vehicle.primaryPower,
    props.vehicle.auxiliaryDrive,
    props.vehicle.speedModificationSteps,
    props.vehicle.fuelEfficiencySteps,
    props.vehicle.fuelCapacitySteps,
  ],
  () => {
    emit('sync-derivations')
  },
)
</script>

<template>
  <!-- Handbook-derived performance values stay read-only here, while the builder only edits
       the inputs the rules actually let the designer vary at this stage. -->
  <div class="grid gap-4">
    <section class="rounded-md border border-cyan-400/20 bg-slate-950/30 p-4">
      <h3 class="text-sm font-semibold text-cyan-50">Handbook Baseline</h3>
      <div class="mt-3 grid gap-3 md:grid-cols-3">
        <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>Base Agility</span>
          <input :value="familyRule.baseAgility >= 0 ? `+${familyRule.baseAgility}` : String(familyRule.baseAgility)" readonly class="h-11 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none">
        </label>
        <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>Hull per Space</span>
          <input :value="familyRule.hullPerSpace" readonly class="h-11 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none">
        </label>
        <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>Shipping Ratio</span>
          <input :value="`${familyRule.shippingRatio} tons / space`" readonly class="h-11 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none">
        </label>
        <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>Base Cost per Space</span>
          <input :value="`Cr${familyRule.baseCostPerSpace.toLocaleString()}`" readonly class="h-11 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none">
        </label>
        <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>Derived Agility</span>
          <input :value="vehicle.agility" readonly class="h-11 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none">
        </label>
        <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>Derived Structure</span>
          <input :value="vehicle.structure" readonly class="h-11 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none">
        </label>
      </div>
    </section>

    <section class="rounded-md border border-cyan-400/20 bg-slate-950/30 p-4">
      <h3 class="text-sm font-semibold text-cyan-50">Power and Available Spaces</h3>
      <div class="mt-3 grid gap-4 md:grid-cols-2">
        <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>Primary Power</span>
          <select v-model="vehicle.primaryPower" class="h-11 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
            <option v-for="option in optionSets.primaryPowerOptions" :key="option.id" :value="option.id">{{ option.label }}</option>
          </select>
          <span class="text-[11px] font-normal normal-case tracking-normal text-zinc-400">
            {{ optionSets.primaryPowerOptions.find((option) => option.id === vehicle.primaryPower)?.notes }}
          </span>
        </label>
        <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>Available Spaces</span>
          <input :value="summary.availableSpaces" readonly class="h-11 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none">
          <span class="text-[11px] font-normal normal-case tracking-normal text-zinc-400">Derived from base spaces, power, and auxiliary drive consumption.</span>
        </label>
      </div>
    </section>

    <section class="rounded-md border border-cyan-400/20 bg-slate-950/30 p-4">
      <h3 class="text-sm font-semibold text-cyan-50">Customisations</h3>
      <div class="mt-3 grid gap-4 md:grid-cols-3">
        <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>Speed Modification</span>
          <select v-model.number="vehicle.speedModificationSteps" class="h-11 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
            <option v-for="option in speedStepOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
          <span class="text-[11px] font-normal normal-case tracking-normal text-zinc-400">Faster adds one band and +100% base cost per step. Slower subtracts one band and -10% base cost per step.</span>
        </label>
        <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>Fuel Efficiency</span>
          <select v-model.number="vehicle.fuelEfficiencySteps" class="h-11 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
            <option v-for="option in rangeEfficiencyOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
          <span class="text-[11px] font-normal normal-case tracking-normal text-zinc-400">Efficiency changes alter range and cost from the baseline vehicle, not from previously modified values.</span>
        </label>
        <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>Fuel Capacity</span>
          <select v-model.number="vehicle.fuelCapacitySteps" class="h-11 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
            <option v-for="option in fuelCapacityOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
          <span class="text-[11px] font-normal normal-case tracking-normal text-zinc-400">Fuel capacity changes only range here. Internal component space accounting can be layered on later.</span>
        </label>
      </div>
    </section>

    <section class="rounded-md border border-cyan-400/20 bg-slate-950/30 p-4">
      <h3 class="text-sm font-semibold text-cyan-50">Derived Performance</h3>
      <div class="mt-3 grid gap-3 md:grid-cols-2">
        <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>Speed</span>
          <input :value="vehicle.speed" readonly class="h-11 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none">
        </label>
        <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>Cruise Speed</span>
          <input :value="vehicle.cruiseSpeed" readonly class="h-11 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none">
        </label>
        <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>Range</span>
          <input :value="vehicle.range" readonly class="h-11 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none">
        </label>
        <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>Cruise Range</span>
          <input :value="vehicle.cruiseRange" readonly class="h-11 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none">
        </label>
        <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>Shipping</span>
          <input :value="vehicle.shipping" readonly class="h-11 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none">
        </label>
        <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>Cost</span>
          <input :value="vehicle.cost" readonly class="h-11 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none">
        </label>
      </div>
    </section>

    <section class="rounded-md border border-cyan-400/20 bg-slate-950/30 p-4">
      <h3 class="text-sm font-semibold text-cyan-50">Auxiliary Drive</h3>
      <div class="mt-3 grid gap-4 md:grid-cols-2">
        <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>Auxiliary Drive</span>
          <select v-model="vehicle.auxiliaryDrive" class="h-11 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
            <option v-for="option in optionSets.auxiliaryDriveOptions" :key="option.id" :value="option.id">{{ option.label }}</option>
          </select>
          <span class="text-[11px] font-normal normal-case tracking-normal text-zinc-400">
            {{ optionSets.auxiliaryDriveOptions.find((option) => option.id === vehicle.auxiliaryDrive)?.notes }}
          </span>
        </label>
        <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>Auxiliary Spaces</span>
          <input :value="summary.auxiliarySpaces" readonly class="h-11 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none">
          <span class="text-[11px] font-normal normal-case tracking-normal text-zinc-400">Reserved for the selected auxiliary locomotion package.</span>
        </label>
      </div>

      <div v-if="summary.auxiliarySummary" class="mt-4 grid gap-3 md:grid-cols-3">
        <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>Aux Speed</span>
          <input :value="summary.auxiliarySummary.speed" readonly class="h-11 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none">
        </label>
        <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>Aux Agility</span>
          <input :value="summary.auxiliarySummary.agility" readonly class="h-11 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none">
        </label>
        <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>Aux Range</span>
          <input :value="summary.auxiliarySummary.range" readonly class="h-11 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none">
        </label>
      </div>
    </section>

    <section class="grid gap-4 md:grid-cols-2">
      <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        <span>Crew</span>
        <input v-model="vehicle.crew" class="h-11 rounded-md border border-zinc-300 px-3 text-sm font-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="1">
      </label>
      <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        <span>Passengers</span>
        <input v-model="vehicle.passengers" class="h-11 rounded-md border border-zinc-300 px-3 text-sm font-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="4">
      </label>
      <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        <span>Comfort Level</span>
        <input v-model="vehicle.comfortLevel" list="vehicle-builder-comfort" class="h-11 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="Comfort level">
      </label>
      <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        <span>Cargo</span>
        <input v-model="vehicle.cargo" class="h-11 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="0.25 tons">
      </label>
    </section>

    <datalist id="vehicle-builder-comfort">
      <option v-for="option in optionSets.comfortLevels" :key="option" :value="option" />
    </datalist>
  </div>
</template>
