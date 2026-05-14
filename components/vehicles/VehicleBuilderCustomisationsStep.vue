<script setup lang="ts">
import { computed, watch } from 'vue'
import type { CustomVehicleDesign } from '~/types/vehicle'
import { vehicleFamilyRule } from '~/utils/traveller/vehicles'
import { hasWalkerSilhouetteAsset, vehicleSilhouetteSource } from '~/utils/vehicleBuilderSilhouettes'

type PrimaryPowerOption = {
  id: string
  label: string
  minimumTechLevel: number
  notes: string
  endurance?: string
  powerPerSpace?: number
  rangeMultiplier?: number
  supportsFusionPlusFuelType?: boolean
}

type AuxiliaryDriveOption = {
  id: string
  label: string
  minimumTechLevel: number
  notes: string
}

const props = defineProps<{
  vehicle: CustomVehicleDesign
  optionSets: {
    primaryPowerOptions: PrimaryPowerOption[]
    auxiliaryDriveOptions: AuxiliaryDriveOption[]
  }
  summary: {
    availableSpaces: number
    powerPlantSpaces: number
    auxiliarySpaces: number
    remainingSpaces: number
    auxiliarySummary: null | { speed: string, agility: string, range: string }
  }
}>()

const emit = defineEmits<{
  (event: 'sync-derivations'): void
}>()

const familyRule = computed(() => vehicleFamilyRule(props.vehicle.baseFamily))
const selectedPrimaryPower = computed(() => props.optionSets.primaryPowerOptions.find((option) => option.id === props.vehicle.primaryPower) ?? null)
const selectedAuxiliaryDrive = computed(() => props.optionSets.auxiliaryDriveOptions.find((option) => option.id === props.vehicle.auxiliaryDrive) ?? null)
const useWalkerFallback = computed(() => props.vehicle.baseFamily === 'walker' && !hasWalkerSilhouetteAsset())
const silhouetteSource = computed(() => vehicleSilhouetteSource(props.vehicle.baseFamily === 'walker' ? 'walker' : 'wheeled'))
const silhouetteImageClass = computed(() => (
  props.vehicle.baseFamily === 'walker'
    ? 'h-80 w-[40rem]'
    : 'h-64 w-[32rem]'
))

const speedStepOptions = [-3, -2, -1, 0, 1, 2, 3]
const rangeEfficiencyOptions = [-3, -2, -1, 0, 1, 2, 3]
const fuelCapacityOptions = [-2, -1, 0, 1, 2, 3, 4]
const hullOptions = [
  {
    id: 'Standard',
    label: 'Standard Hull',
    hull: 'No change',
    cost: 'No change',
    notes: 'Baseline construction with no structural reinforcement modifier.',
  },
  {
    id: 'Reinforced',
    label: 'Reinforced Hull',
    hull: '+10%, minimum +1',
    cost: '+50%',
    notes: 'Strengthened with higher-quality materials or advanced construction methods to become tougher and more resilient.',
  },
  {
    id: 'Light',
    label: 'Light Hull',
    hull: '-25%, minimum -1',
    cost: '-25%',
    notes: 'Lightened construction reduces mass and cost but leaves the vehicle less resilient to damage.',
  },
]

const formatSignedStep = (value: number) => `${value >= 0 ? '+' : ''}${value}`
const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value}%`
const speedOptionLabel = (value: number) => {
  if (value === 0) return 'Standard'
  const cost = value > 0 ? value * 100 : value * 10
  return `${formatSignedStep(value)} Speed Band (${formatPercent(cost)} cost)`
}
const rangeOptionLabel = (value: number) => {
  if (value === 0) return 'Standard'
  const range = value > 0 ? value * 50 : value * 25
  const cost = value > 0 ? value * 25 : value * 10
  return `${formatPercent(range)} range (${formatPercent(cost)} cost)`
}
const fuelCapacityOptionLabel = (value: number) => {
  if (value === 0) return 'Standard'
  return `${formatPercent(value * 25)} range`
}
const formatPowerOutput = (option: PrimaryPowerOption | null) => {
  if (!option) return 'Baseline vehicle power'
  if (option.powerPerSpace) return `${option.powerPerSpace} Power / Space`
  if (option.endurance) return option.endurance
  return 'Baseline vehicle power'
}

const rangeContribution = computed(() => {
  const power = selectedPrimaryPower.value
  if (!power) return 'Baseline range'
  if (power.supportsFusionPlusFuelType && power.rangeMultiplier) {
    const fuelMultiplier = props.vehicle.fusionPlusFuelType === 'deuterium-enriched-water' ? 3 : 1
    return fuelMultiplier > 1 ? `Range x${power.rangeMultiplier * fuelMultiplier}` : `Range x${power.rangeMultiplier}`
  }
  if (power.rangeMultiplier) return `Range x${power.rangeMultiplier}`
  if (power.powerPerSpace) return 'No range multiplier'
  return 'Baseline range'
})

const powerRows = computed(() => {
  const option = selectedPrimaryPower.value
  if (!option) return []
  return [
    { label: 'Tech Level', value: `${option.minimumTechLevel}+` },
    { label: 'Spaces', value: props.summary.powerPlantSpaces > 0 ? `${props.summary.powerPlantSpaces} consumed` : 'No plant Spaces' },
    { label: 'Output', value: formatPowerOutput(option) },
    { label: 'Range', value: rangeContribution.value },
    { label: 'Effect', value: option.notes },
  ]
})

const performanceRows = computed(() => [
  { label: 'Speed', value: props.vehicle.speed },
  { label: 'Cruise', value: props.vehicle.cruiseSpeed },
  { label: 'Range', value: props.vehicle.range },
  { label: 'Agility', value: props.vehicle.agility },
  { label: 'Usable Spaces', value: String(props.summary.availableSpaces) },
  { label: 'Remaining', value: String(props.summary.remainingSpaces) },
])

const auxiliaryRows = computed(() => {
  const option = selectedAuxiliaryDrive.value
  if (!option) return []
  return [
    { label: 'Tech Level', value: `${option.minimumTechLevel}+` },
    { label: 'Spaces', value: props.summary.auxiliarySpaces > 0 ? `${props.summary.auxiliarySpaces} consumed` : 'No auxiliary burden' },
    { label: 'Speed', value: props.summary.auxiliarySummary?.speed ?? 'N/A' },
    { label: 'Agility', value: props.summary.auxiliarySummary?.agility ?? 'N/A' },
    { label: 'Range', value: props.summary.auxiliarySummary?.range ?? 'N/A' },
    { label: 'Effect', value: option.notes },
  ]
})

const selectedHullOption = computed(() => hullOptions.find((option) => option.id === props.vehicle.hull) ?? hullOptions[0])
const selectedHullContext = computed(() => {
  const option = selectedHullOption.value
  return `${option.hull} Hull, ${option.cost} cost. ${option.notes} One-Space vehicles cannot use Light or Reinforced hull modification.`
})
const hullOptionLabel = (option: typeof hullOptions[number]) => `${option.label} (${option.hull} Hull, ${option.cost} cost)`

const visualText = computed(() => {
  const power = selectedPrimaryPower.value?.label ?? 'Standard Power'
  const auxiliary = selectedAuxiliaryDrive.value?.id === 'none' ? 'no auxiliary drive' : selectedAuxiliaryDrive.value?.label
  return `${power}; ${auxiliary ?? 'no auxiliary drive'}`
})

watch(
  () => [
    props.vehicle.primaryPower,
    props.vehicle.fusionPlusFuelType,
    props.vehicle.auxiliaryDrive,
    props.vehicle.hull,
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
    <section class="overflow-hidden rounded-md border border-cyan-400/25 bg-slate-950/45 text-cyan-50 shadow-[0_0_28px_rgba(34,211,238,0.08)]">
      <div class="min-h-[6.75rem] border-b border-cyan-400/30 bg-cyan-400/10 px-4 py-3 sm:px-5">
        <div class="grid min-h-[5.25rem] gap-3 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200/80">Vehicle Design Step 5</p>
            <h3 class="mt-1 text-xl font-black uppercase tracking-wide text-cyan-50">Choose Customisations</h3>
          </div>
          <div class="grid min-w-0 gap-1">
            <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              <span>Hull Modification</span>
              <span class="group relative inline-flex">
                <span class="flex h-5 w-5 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-300/10 text-[11px] font-black text-cyan-100" aria-label="Hull modification information">i</span>
                <span class="pointer-events-none absolute right-0 top-7 z-30 hidden w-72 rounded-md border border-cyan-300/30 bg-slate-950 p-3 text-xs font-normal normal-case leading-5 tracking-normal text-cyan-50 shadow-[0_12px_34px_rgba(0,0,0,0.45)] group-hover:block">
                  Hull can be reinforced for more durability or lightened to reduce cost. One-Space vehicles cannot use Light or Reinforced hull modification.
                </span>
              </span>
            </div>
            <label class="grid min-w-0 gap-1">
              <select v-model="props.vehicle.hull" class="h-11 w-full min-w-0 truncate rounded-md border border-zinc-300 bg-white px-3 text-sm font-normal normal-case tracking-normal text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
                <option
                  v-for="option in hullOptions"
                  :key="option.id"
                  :disabled="props.vehicle.spaces === 1 && option.id !== 'Standard'"
                  :value="option.id"
                >
                  {{ hullOptionLabel(option) }}
                </option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <div class="grid min-h-[38rem] gap-6 p-4 sm:p-5 lg:grid-cols-[minmax(24rem,0.8fr)_minmax(22rem,1fr)]">
        <div class="grid content-start gap-4">
          <div class="relative flex h-[35.75rem] min-h-[35.75rem] w-full flex-col justify-start overflow-hidden rounded-md border border-cyan-400/20 bg-slate-900/35 p-5">
            <div
              aria-hidden="true"
              class="pointer-events-none absolute inset-0 opacity-30"
              style="background-image: linear-gradient(rgba(103,232,249,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(103,232,249,0.22) 1px, transparent 1px); background-size: 22px 22px;"
            />
            <div aria-hidden="true" class="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/95 to-transparent" />
            <div class="relative z-10">
              <h4 class="text-3xl font-black uppercase leading-none tracking-wide text-cyan-50">{{ familyRule.label }} Systems</h4>
              <p class="mt-3 max-w-xl text-sm leading-5 text-zinc-300">
                Customisations alter the vehicle after type, size, and features are set. Power plants, performance tuning, fuel capacity, and auxiliary drives change available Spaces, cost, range, and movement profile before protection is applied.
              </p>
            </div>

            <div class="relative z-10 mt-auto flex min-h-[16rem] items-end justify-center">
              <img
                v-if="!useWalkerFallback"
                :src="silhouetteSource"
                alt=""
                class="pointer-events-none max-w-[calc(100%-4rem)] object-contain object-bottom opacity-95 drop-shadow-[0_0_32px_rgba(103,232,249,0.32)]"
                :class="silhouetteImageClass"
                draggable="false"
              >
              <svg v-else class="pointer-events-none h-56 w-[calc(100%-4rem)] text-cyan-100/55 drop-shadow-[0_0_22px_rgba(103,232,249,0.22)]" viewBox="0 0 360 190" role="img" aria-label="Customisation system silhouette">
                <g fill="currentColor">
                  <rect x="126" y="38" width="112" height="58" rx="10" />
                  <rect x="148" y="92" width="22" height="42" rx="6" />
                  <rect x="198" y="92" width="22" height="42" rx="6" />
                  <rect x="132" y="132" width="48" height="12" rx="6" />
                  <rect x="188" y="132" width="48" height="12" rx="6" />
                  <rect x="232" y="55" width="46" height="14" rx="7" />
                </g>
              </svg>
            </div>
          </div>

          <div class="grid gap-3 rounded-md border border-cyan-400/20 bg-slate-950/35 p-3">
            <div class="rounded-md border border-cyan-400/20 bg-slate-950/45 p-3">
              <p class="text-xs font-semibold uppercase tracking-wide text-cyan-100/80">Current Fit</p>
              <p class="mt-2 text-lg font-black uppercase tracking-wide text-cyan-50">{{ visualText }}</p>
            </div>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div class="rounded-md border border-cyan-400/15 bg-slate-950/35 p-3">
                <p class="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Power Spaces</p>
                <p class="mt-1 text-xl font-black text-cyan-50">{{ props.summary.powerPlantSpaces }}</p>
              </div>
              <div class="rounded-md border border-cyan-400/15 bg-slate-950/35 p-3">
                <p class="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Aux Spaces</p>
                <p class="mt-1 text-xl font-black text-cyan-50">{{ props.summary.auxiliarySpaces }}</p>
              </div>
              <div class="rounded-md border border-cyan-400/15 bg-slate-950/35 p-3">
                <p class="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Usable</p>
                <p class="mt-1 text-xl font-black text-cyan-50">{{ props.summary.availableSpaces }}</p>
              </div>
              <div class="rounded-md border border-cyan-400/15 bg-slate-950/35 p-3">
                <p class="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Remaining</p>
                <p class="mt-1 text-xl font-black text-cyan-50">{{ props.summary.remainingSpaces }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="grid min-h-[35.75rem] content-start gap-4">
          <section class="min-w-0 rounded-md border border-cyan-400/20 bg-slate-950/35 p-3">
            <div class="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,12rem)] md:items-end">
              <div class="min-w-0">
                <p class="text-xs font-black uppercase tracking-wide text-cyan-100">Power Plant</p>
                <p class="mt-1 text-sm leading-5 text-zinc-300">{{ selectedPrimaryPower?.notes }}</p>
              </div>
              <label class="grid min-w-0 gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                <span>Power Plant</span>
                <select v-model="props.vehicle.primaryPower" class="h-10 w-full min-w-0 rounded-md border border-zinc-300 bg-white px-3 text-sm font-normal normal-case tracking-normal text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
                  <option
                    v-for="option in props.optionSets.primaryPowerOptions"
                    :key="option.id"
                    :disabled="props.vehicle.techLevel < option.minimumTechLevel"
                    :value="option.id"
                  >
                    {{ option.label }} (TL {{ option.minimumTechLevel }})
                  </option>
                </select>
              </label>
              <label v-if="selectedPrimaryPower?.supportsFusionPlusFuelType" class="grid min-w-0 gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                <span>Fusion+ Fuel</span>
                <select v-model="props.vehicle.fusionPlusFuelType" class="h-10 w-full min-w-0 rounded-md border border-zinc-300 bg-white px-3 text-sm font-normal normal-case tracking-normal text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
                  <option value="water">Water</option>
                  <option value="deuterium-enriched-water">Deuterium-Enriched Water</option>
                </select>
              </label>
            </div>
            <div class="mt-3 grid content-start gap-px">
              <div v-for="row in powerRows" :key="row.label" class="grid grid-cols-[8.25rem_minmax(0,1fr)] text-sm">
                <div class="bg-cyan-400/20 px-2 py-1 font-black uppercase tracking-wide text-cyan-100">{{ row.label }}</div>
                <div class="border-b border-cyan-400/25 px-2 py-1 leading-5 text-zinc-200">{{ row.value }}</div>
              </div>
            </div>
          </section>

          <section class="min-w-0 rounded-md border border-cyan-400/20 bg-slate-950/35 p-3">
            <p class="text-xs font-black uppercase tracking-wide text-cyan-100">Performance Tuning</p>
            <div class="mt-3 grid min-w-0 gap-3 md:grid-cols-[repeat(3,minmax(0,1fr))]">
              <label class="grid min-w-0 gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                <span>Speed</span>
                <select v-model.number="props.vehicle.speedModificationSteps" class="h-10 w-full min-w-0 rounded-md border border-zinc-300 bg-white px-3 text-sm font-normal normal-case tracking-normal text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
                  <option v-for="option in speedStepOptions" :key="option" :value="option">{{ speedOptionLabel(option) }}</option>
                </select>
              </label>
              <label class="grid min-w-0 gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                <span>Range</span>
                <select v-model.number="props.vehicle.fuelEfficiencySteps" class="h-10 w-full min-w-0 rounded-md border border-zinc-300 bg-white px-3 text-sm font-normal normal-case tracking-normal text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
                  <option v-for="option in rangeEfficiencyOptions" :key="option" :value="option">{{ rangeOptionLabel(option) }}</option>
                </select>
              </label>
              <label class="grid min-w-0 gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                <span>Fuel Capacity</span>
                <select v-model.number="props.vehicle.fuelCapacitySteps" class="h-10 w-full min-w-0 rounded-md border border-zinc-300 bg-white px-3 text-sm font-normal normal-case tracking-normal text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
                  <option v-for="option in fuelCapacityOptions" :key="option" :value="option">{{ fuelCapacityOptionLabel(option) }}</option>
                </select>
              </label>
            </div>
            <div class="mt-3 grid content-start gap-px">
              <div v-for="row in performanceRows" :key="row.label" class="grid grid-cols-[8.25rem_minmax(0,1fr)] text-sm">
                <div class="bg-cyan-400/20 px-2 py-1 font-black uppercase tracking-wide text-cyan-100">{{ row.label }}</div>
                <div class="border-b border-cyan-400/25 px-2 py-1 leading-5 text-zinc-200">{{ row.value }}</div>
              </div>
            </div>
          </section>

          <section class="min-w-0 rounded-md border border-cyan-400/20 bg-slate-950/35 p-3">
            <div class="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,14rem)] md:items-end">
              <div class="min-w-0">
                <p class="text-xs font-black uppercase tracking-wide text-cyan-100">Auxiliary Drive</p>
                <p class="mt-1 text-sm leading-5 text-zinc-300">{{ selectedAuxiliaryDrive?.notes }}</p>
              </div>
              <label class="grid min-w-0 gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                <span>Secondary Movement</span>
                <select v-model="props.vehicle.auxiliaryDrive" class="h-10 w-full min-w-0 rounded-md border border-zinc-300 bg-white px-3 text-sm font-normal normal-case tracking-normal text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
                  <option
                    v-for="option in props.optionSets.auxiliaryDriveOptions"
                    :key="option.id"
                    :disabled="props.vehicle.techLevel < option.minimumTechLevel"
                    :value="option.id"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </label>
            </div>
            <div class="mt-3 grid content-start gap-px">
              <div v-for="row in auxiliaryRows" :key="row.label" class="grid grid-cols-[8.25rem_minmax(0,1fr)] text-sm">
                <div class="bg-cyan-400/20 px-2 py-1 font-black uppercase tracking-wide text-cyan-100">{{ row.label }}</div>
                <div class="border-b border-cyan-400/25 px-2 py-1 leading-5 text-zinc-200">{{ row.value }}</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  </div>
</template>
