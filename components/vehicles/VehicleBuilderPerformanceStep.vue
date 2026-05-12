<script setup lang="ts">
import { computed, watch } from 'vue'
import type { CustomVehicleDesign } from '~/types/vehicle'
import { vehicleFamilyRule } from '~/utils/traveller/vehicles'

const props = defineProps<{
  vehicle: CustomVehicleDesign
  optionSets: {
    primaryPowerOptions: Array<{ id: string, label: string, minimumTechLevel: number, notes: string, endurance?: string, powerPerSpace?: number, supportsFusionPlusFuelType?: boolean }>
    auxiliaryDriveOptions: Array<{ id: string, label: string, minimumTechLevel: number, notes: string }>
  }
  summary: {
    availableSpaces: number
    powerPlantSpaces: number
    auxiliarySpaces: number
    auxiliarySummary: null | { speed: string, agility: string, range: string }
  }
}>()

const emit = defineEmits<{
  (event: 'sync-derivations'): void
}>()

const familyRule = computed(() => vehicleFamilyRule(props.vehicle.baseFamily))
const selectedPrimaryPower = computed(() => props.optionSets.primaryPowerOptions.find((option) => option.id === props.vehicle.primaryPower) ?? null)
const selectedAuxiliaryDrive = computed(() => props.optionSets.auxiliaryDriveOptions.find((option) => option.id === props.vehicle.auxiliaryDrive) ?? null)
const primaryPowerTooltip = computed(() => {
  if (!selectedPrimaryPower.value) return ''
  const details = [
    `Minimum TL ${selectedPrimaryPower.value.minimumTechLevel}+`,
    selectedPrimaryPower.value.powerPerSpace ? `${selectedPrimaryPower.value.powerPerSpace} Power/Space` : '',
    selectedPrimaryPower.value.endurance ? selectedPrimaryPower.value.endurance : '',
    selectedPrimaryPower.value.notes,
  ].filter(Boolean)
  return details.join(' • ')
})
const currentMovementProfile = computed(() => ({
  operatingSkill: props.vehicle.skill || familyRule.value.defaultSkill,
  primaryMovement: familyRule.value.label,
  secondaryMovement: selectedAuxiliaryDrive.value?.label ?? 'None',
}))
const speedStepOptions = [
  { value: -3, label: '-3' },
  { value: -2, label: '-2' },
  { value: -1, label: '-1' },
  { value: 0, label: '0' },
  { value: 1, label: '+1' },
  { value: 2, label: '+2' },
  { value: 3, label: '+3' },
]
const rangeEfficiencyOptions = [
  { value: -3, label: '-3' },
  { value: -2, label: '-2' },
  { value: -1, label: '-1' },
  { value: 0, label: '0' },
  { value: 1, label: '+1' },
  { value: 2, label: '+2' },
  { value: 3, label: '+3' },
]
const fuelCapacityOptions = [
  { value: -2, label: '-2' },
  { value: -1, label: '-1' },
  { value: 0, label: '0' },
  { value: 1, label: '+1' },
  { value: 2, label: '+2' },
  { value: 3, label: '+3' },
  { value: 4, label: '+4' },
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
  <div class="grid gap-4">
    <section class="rounded-md border border-cyan-400/20 bg-slate-950/30 p-4">
      <h3 class="text-sm font-semibold text-cyan-50">Movement Profile</h3>
      <div class="mt-3 grid auto-rows-fr gap-3 md:grid-cols-3">
        <label class="flex h-full flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span class="min-h-4 leading-4">Operating Skill</span>
          <input :value="currentMovementProfile.operatingSkill" readonly class="h-11 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none">
          <span aria-hidden="true" class="min-h-[1.5rem]">&nbsp;</span>
        </label>
        <label class="flex h-full flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span class="min-h-4 leading-4">Primary Movement</span>
          <input :value="currentMovementProfile.primaryMovement" readonly class="h-11 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none">
          <span aria-hidden="true" class="min-h-[1.5rem]">&nbsp;</span>
        </label>
        <label class="flex h-full flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span class="min-h-4 leading-4">Secondary Movement</span>
          <input :value="currentMovementProfile.secondaryMovement" readonly class="h-11 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none">
          <span aria-hidden="true" class="min-h-[1.5rem]">&nbsp;</span>
        </label>
      </div>
    </section>

    <section class="rounded-md border border-cyan-400/20 bg-slate-950/30 p-4">
      <h3 class="text-sm font-semibold text-cyan-50">Power Plant</h3>
      <div class="mt-3 grid auto-rows-fr gap-4 md:grid-cols-2">
        <label class="flex h-full flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span class="min-h-4 leading-4">Power Plant</span>
          <select v-model="vehicle.primaryPower" :title="primaryPowerTooltip" class="h-11 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
            <option v-for="option in optionSets.primaryPowerOptions" :key="option.id" :value="option.id">{{ option.label }} (TL {{ option.minimumTechLevel }})</option>
          </select>
          <span class="min-h-[1.5rem] text-[11px] font-normal normal-case tracking-normal text-zinc-400">
            TL {{ selectedPrimaryPower?.minimumTechLevel }}+<template v-if="selectedPrimaryPower?.notes"> · {{ selectedPrimaryPower?.notes }}</template>
          </span>
        </label>
        <label class="flex h-full flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span class="min-h-4 leading-4">Build Spaces</span>
          <input :value="summary.availableSpaces" readonly class="h-11 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none">
          <span class="min-h-[1.5rem] text-[11px] font-normal normal-case tracking-normal text-zinc-400">Available after current power and secondary-movement burden are applied.</span>
        </label>
        <label class="flex h-full flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span class="min-h-4 leading-4">Power Plant Size</span>
          <input :value="summary.powerPlantSpaces" readonly class="h-11 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none">
          <span class="min-h-[1.5rem] text-[11px] font-normal normal-case tracking-normal text-zinc-400">Installed plant size reserved by the selected power source.</span>
        </label>
        <label class="flex h-full flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span class="min-h-4 leading-4">Power Summary</span>
          <input :value="selectedPrimaryPower?.endurance || (selectedPrimaryPower?.powerPerSpace ? `${selectedPrimaryPower.powerPerSpace} Power/Space` : 'Baseline vehicle power')" :title="primaryPowerTooltip" readonly class="h-11 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none">
          <span class="min-h-[1.5rem] text-[11px] font-normal normal-case tracking-normal text-zinc-400">Shows the most important power-note from the selected plant.</span>
        </label>
      </div>

      <div v-if="selectedPrimaryPower?.supportsFusionPlusFuelType" class="mt-4 grid auto-rows-fr gap-4 md:max-w-md">
        <label class="flex h-full flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span class="min-h-4 leading-4">Fusion+ Fuel</span>
          <select v-model="vehicle.fusionPlusFuelType" class="h-11 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
            <option value="water">Water</option>
            <option value="deuterium-enriched-water">Deuterium-Enriched Water</option>
          </select>
          <span class="min-h-[1.5rem] text-[11px] font-normal normal-case tracking-normal text-zinc-400">Deuterium-enriched water increases Fusion+ range by a further x3 but is specialised industrial fuel.</span>
        </label>
      </div>
    </section>

    <section class="rounded-md border border-cyan-400/20 bg-slate-950/30 p-4">
      <h3 class="text-sm font-semibold text-cyan-50">Tuning</h3>
      <div class="mt-3 grid auto-rows-fr gap-4 md:grid-cols-3">
        <label class="flex h-full flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span class="min-h-4 leading-4">Speed Tuning</span>
          <select v-model.number="vehicle.speedModificationSteps" class="h-11 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
            <option v-for="option in speedStepOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
          <span class="min-h-[1.5rem] text-[11px] font-normal normal-case tracking-normal text-zinc-400">Pushes the design faster or slower than its family baseline.</span>
        </label>
        <label class="flex h-full flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span class="min-h-4 leading-4">Range Tuning</span>
          <select v-model.number="vehicle.fuelEfficiencySteps" class="h-11 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
            <option v-for="option in rangeEfficiencyOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
          <span class="min-h-[1.5rem] text-[11px] font-normal normal-case tracking-normal text-zinc-400">Changes range and cost relative to the baseline vehicle profile.</span>
        </label>
        <label class="flex h-full flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span class="min-h-4 leading-4">Fuel Capacity</span>
          <select v-model.number="vehicle.fuelCapacitySteps" class="h-11 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
            <option v-for="option in fuelCapacityOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
          <span class="min-h-[1.5rem] text-[11px] font-normal normal-case tracking-normal text-zinc-400">Extends or trims endurance without changing the core movement profile.</span>
        </label>
      </div>
    </section>

    <section class="rounded-md border border-cyan-400/20 bg-slate-950/30 p-4">
      <h3 class="text-sm font-semibold text-cyan-50">Result</h3>
      <div class="mt-3 grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label class="flex h-full flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span class="min-h-4 leading-4">Secondary Movement</span>
          <select v-model="vehicle.auxiliaryDrive" class="h-11 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
            <option v-for="option in optionSets.auxiliaryDriveOptions" :key="option.id" :value="option.id">{{ option.label }}</option>
          </select>
          <span class="min-h-[1.5rem] text-[11px] font-normal normal-case tracking-normal text-zinc-400">
            {{ selectedAuxiliaryDrive?.notes }}
          </span>
        </label>
        <label class="flex h-full flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span class="min-h-4 leading-4">Speed</span>
          <input :value="vehicle.speed" readonly class="h-11 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none">
          <span aria-hidden="true" class="min-h-[1.5rem]">&nbsp;</span>
        </label>
        <label class="flex h-full flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span class="min-h-4 leading-4">Cruise Speed</span>
          <input :value="vehicle.cruiseSpeed" readonly class="h-11 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none">
          <span aria-hidden="true" class="min-h-[1.5rem]">&nbsp;</span>
        </label>
        <label class="flex h-full flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span class="min-h-4 leading-4">Range</span>
          <input :value="vehicle.range" readonly class="h-11 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none">
          <span aria-hidden="true" class="min-h-[1.5rem]">&nbsp;</span>
        </label>
        <label class="flex h-full flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span class="min-h-4 leading-4">Agility</span>
          <input :value="vehicle.agility" readonly class="h-11 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none">
          <span aria-hidden="true" class="min-h-[1.5rem]">&nbsp;</span>
        </label>
        <label class="flex h-full flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span class="min-h-4 leading-4">Secondary Space Burden</span>
          <input :value="summary.auxiliarySpaces" readonly class="h-11 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none">
          <span class="min-h-[1.5rem] text-[11px] font-normal normal-case tracking-normal text-zinc-400">Reserved by the selected secondary movement package.</span>
        </label>
      </div>

      <div v-if="summary.auxiliarySummary" class="mt-4 grid auto-rows-fr gap-3 md:grid-cols-3">
        <label class="flex h-full flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span class="min-h-4 leading-4">Aux Speed</span>
          <input :value="summary.auxiliarySummary.speed" readonly class="h-11 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none">
          <span aria-hidden="true" class="min-h-[1.5rem]">&nbsp;</span>
        </label>
        <label class="flex h-full flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span class="min-h-4 leading-4">Aux Agility</span>
          <input :value="summary.auxiliarySummary.agility" readonly class="h-11 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none">
          <span aria-hidden="true" class="min-h-[1.5rem]">&nbsp;</span>
        </label>
        <label class="flex h-full flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span class="min-h-4 leading-4">Aux Range</span>
          <input :value="summary.auxiliarySummary.range" readonly class="h-11 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none">
          <span class="min-h-[1.5rem] text-[11px] font-normal normal-case tracking-normal text-transparent select-none">.</span>
        </label>
      </div>
    </section>

  </div>
</template>
