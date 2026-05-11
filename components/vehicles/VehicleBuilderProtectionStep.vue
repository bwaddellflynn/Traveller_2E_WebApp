<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CustomVehicleDesign } from '~/types/vehicle'
import vehicleDiagramDesktopRaw from '~/assets/armoury_icons/vehicle_exploded_grouped_detailed_rotated_right.svg?raw'
import vehicleDiagramMobileRaw from '~/assets/armoury_icons/vehicle_exploded_grouped_detailed.svg?raw'

const props = defineProps<{
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
      faceValues?: Record<string, number>
    }
  }
}>()

type ArmourFacing = keyof CustomVehicleDesign['armour']

type ArmourRuleRow = {
  tl: string
  materials: string
  baseProtection: number
  maximumProtection: number
}

const armourRuleRows: ArmourRuleRow[] = [
  { tl: '0-2', materials: 'Wood, Bone, etc.', baseProtection: 0, maximumProtection: 10 },
  { tl: '3-4', materials: 'Iron', baseProtection: 1, maximumProtection: 15 },
  { tl: '5-6', materials: 'Steel', baseProtection: 2, maximumProtection: 20 },
  { tl: '7-9', materials: 'Alloys, Composites', baseProtection: 3, maximumProtection: 30 },
  { tl: '10-11', materials: 'Crystaliron', baseProtection: 5, maximumProtection: 40 },
  { tl: '12-13', materials: 'Superdense', baseProtection: 6, maximumProtection: 50 },
  { tl: '14-15', materials: 'Bonded Superdense', baseProtection: 8, maximumProtection: 60 },
  { tl: '16', materials: 'Molecular Bonded', baseProtection: 10, maximumProtection: 80 },
  { tl: '17', materials: 'Coherent Superdense', baseProtection: 15, maximumProtection: 100 },
  { tl: '18+', materials: 'Collapsium', baseProtection: 20, maximumProtection: 160 },
]

const handbookAddedArmourPoints = ref(0)

const decorateVehicleDiagram = (svgMarkup: string, idPrefix: string) => {
  const defsAndStyle = `
<defs>
  <linearGradient id="${idPrefix}-body-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#12324a" />
    <stop offset="52%" stop-color="#0f2740" />
    <stop offset="100%" stop-color="#0a1b30" />
  </linearGradient>
  <filter id="${idPrefix}-body-glow" x="-30%" y="-30%" width="160%" height="160%">
    <feDropShadow dx="0" dy="0" stdDeviation="1.8" flood-color="#38bdf8" flood-opacity="0.22" />
  </filter>
  <filter id="${idPrefix}-detail-glow" x="-40%" y="-40%" width="180%" height="180%">
    <feDropShadow dx="0" dy="0" stdDeviation="2.8" flood-color="#c8f4ff" flood-opacity="0.95" />
    <feDropShadow dx="0" dy="0" stdDeviation="6.5" flood-color="#38bdf8" flood-opacity="0.55" />
  </filter>
</defs>
<style>
  .body {
    fill: url(#${idPrefix}-body-gradient) !important;
    stroke: #67e8f9;
    stroke-width: 2.8;
    paint-order: stroke fill;
    filter: url(#${idPrefix}-body-glow);
  }
  .detail {
    fill: #8fe9ff !important;
    filter: url(#${idPrefix}-detail-glow);
  }
</style>`

  const svgWithRuntimeStyling = svgMarkup
    .replace(/<style>[\s\S]*?<\/style>/, defsAndStyle)
    .replace(/<svg([^>]*)>/, '<svg$1>')

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgWithRuntimeStyling)}`
}

const vehicleDiagramDesktop = computed(() => decorateVehicleDiagram(vehicleDiagramDesktopRaw, 'vehicle-armour-desktop'))
const vehicleDiagramMobile = computed(() => decorateVehicleDiagram(vehicleDiagramMobileRaw, 'vehicle-armour-mobile'))

const minimumDorsalProtection = computed(() => (
  props.vehicle.features.includes('Open-Topped') || props.vehicle.features.includes('Open Frame')
    ? 0
    : props.summary.armourSummary.baseProtection
))

const currentProtectionTotal = computed(() => (
  currentFaceValues.value.forward
  + currentFaceValues.value.port
  + currentFaceValues.value.dorsal
  + currentFaceValues.value.aft
  + currentFaceValues.value.starboard
  + currentFaceValues.value.ventral
))

const parsedFacingValue = (rawValue: unknown, fallback: number) => {
  const parsedValue = Number(rawValue)
  return Number.isFinite(parsedValue) ? parsedValue : fallback
}

const currentFaceValues = computed<Record<ArmourFacing, number>>(() => {
  const baseProtection = props.summary.armourSummary.baseProtection
  const summaryFaces = props.summary.armourSummary.faceValues
  return {
    forward: parsedFacingValue(summaryFaces?.forward ?? props.vehicle.armour.forward, baseProtection),
    port: parsedFacingValue(summaryFaces?.port ?? props.vehicle.armour.port, baseProtection),
    dorsal: parsedFacingValue(summaryFaces?.dorsal ?? props.vehicle.armour.dorsal, baseProtection),
    aft: parsedFacingValue(summaryFaces?.aft ?? props.vehicle.armour.aft, baseProtection),
    starboard: parsedFacingValue(summaryFaces?.starboard ?? props.vehicle.armour.starboard, baseProtection),
    ventral: parsedFacingValue(summaryFaces?.ventral ?? props.vehicle.armour.ventral, baseProtection),
  }
})

watch(
  () => props.summary.armourSummary.baseProtection,
  (nextBaseProtection, previousBaseProtection) => {
    if (typeof previousBaseProtection !== 'number' || previousBaseProtection === nextBaseProtection) return

    const dorsalAndOpenTopAllowsZero = props.vehicle.features.includes('Open-Topped') || props.vehicle.features.includes('Open Frame')

    for (const facing of Object.keys(props.vehicle.armour) as ArmourFacing[]) {
      const previousMinimum = facing === 'dorsal' && dorsalAndOpenTopAllowsZero ? 0 : previousBaseProtection
      const nextMinimum = facing === 'dorsal' && dorsalAndOpenTopAllowsZero ? 0 : nextBaseProtection
      const currentValue = Number(props.vehicle.armour[facing] ?? previousMinimum)
      const addedAmount = Math.max(0, currentValue - previousMinimum)
      props.vehicle.armour[facing] = String(nextMinimum + addedAmount)
    }
  },
)

watch(
  () => props.summary.armourSummary.equivalentAddedProtection,
  (value) => {
    handbookAddedArmourPoints.value = Math.max(0, Math.round(value))
  },
  { immediate: true },
)

const applyHandbookArmourAllocation = () => {
  const addedPoints = Math.max(0, Math.round(handbookAddedArmourPoints.value))
  const baseProtection = props.summary.armourSummary.baseProtection
  const dorsalAndVentralAdded = Math.floor(addedPoints / 2)

  props.vehicle.armour.forward = String(baseProtection + addedPoints)
  props.vehicle.armour.aft = String(baseProtection + addedPoints)
  props.vehicle.armour.port = String(baseProtection + addedPoints)
  props.vehicle.armour.starboard = String(baseProtection + addedPoints)
  props.vehicle.armour.dorsal = String(Math.max(minimumDorsalProtection.value, baseProtection + dorsalAndVentralAdded))
  props.vehicle.armour.ventral = String(baseProtection + dorsalAndVentralAdded)
}

</script>

<template>
  <div class="grid gap-4">
    <section class="rounded-md border border-cyan-400/20 bg-slate-950/35 p-4">
      <div class="grid gap-4">
        <div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem_14rem]">
            <div class="group relative">
              <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <span>Material</span>
                <button
                  type="button"
                  class="flex h-11 items-center justify-between rounded-md border border-cyan-400/25 bg-slate-950/60 px-3 text-left text-sm font-semibold text-cyan-50 transition hover:border-cyan-300 hover:bg-slate-900/70"
                >
                  <span>{{ summary.armourSummary.rule.materials }}</span>
                  <span class="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/75">TL</span>
                </button>
              </label>

              <div class="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden w-[30rem] rounded-md border border-cyan-400/35 bg-slate-950/95 p-4 shadow-[0_0_32px_rgba(34,211,238,0.16)] group-hover:block group-focus-within:block">
                <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">Armour Materials By Tech Level</p>
                <div class="mt-3 overflow-hidden rounded-md border border-cyan-400/20">
                  <div class="grid grid-cols-[4.5rem_minmax(0,1fr)_6rem_7rem] bg-cyan-400/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100/80">
                    <span>TL</span>
                    <span>Material</span>
                    <span>Base</span>
                    <span>Max</span>
                  </div>
                  <div v-for="row in armourRuleRows" :key="row.tl" class="grid grid-cols-[4.5rem_minmax(0,1fr)_6rem_7rem] border-t border-cyan-400/10 px-3 py-2 text-xs text-zinc-200">
                    <span>{{ row.tl }}</span>
                    <span>{{ row.materials }}</span>
                    <span>+{{ row.baseProtection }}</span>
                    <span>+{{ row.maximumProtection }}</span>
                  </div>
                </div>
                <p class="mt-3 text-xs leading-5 text-zinc-400">
                  Base protection applies to every face. Additional armour is purchased separately and layered on top of that base.
                </p>
              </div>
            </div>

            <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <span>Additional Armour</span>
              <input
                v-model.number="handbookAddedArmourPoints"
                type="number"
                min="0"
                :max="summary.armourSummary.maximumProtection - summary.armourSummary.baseProtection"
                class="h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm font-normal text-zinc-900 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
              >
            </label>

            <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <span>Purchased Armour Cost</span>
              <input
                :value="`Cr${Math.round(summary.armourSummary.armourCost).toLocaleString()}`"
                readonly
                class="h-11 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none"
              >
            </label>
          </div>

          <div class="relative min-h-[42rem] w-full overflow-hidden rounded-md border border-cyan-400/20 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.08),_transparent_42%),linear-gradient(180deg,rgba(2,6,23,0.88),rgba(2,6,23,0.96))] p-4">
            <div class="absolute left-4 top-4 rounded-md border border-amber-300/35 bg-amber-300/10 px-3 py-2 shadow-[0_0_24px_rgba(251,191,36,0.10)]">
              <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200">Added Armour</p>
              <p class="mt-1 text-lg font-semibold text-amber-100">{{ currentProtectionTotal }} / {{ summary.armourSummary.maximumProtection }}</p>
            </div>

            <div class="absolute right-4 top-4 w-[16.5rem] rounded-md border border-cyan-400/20 bg-slate-950/70 p-4 shadow-[0_0_24px_rgba(34,211,238,0.10)]">
              <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">Armour Context</p>
              <dl class="mt-3 grid gap-3">
                <div class="flex items-center justify-between gap-3">
                  <dt class="text-xs font-semibold uppercase tracking-wide text-zinc-500">Base Protection</dt>
                  <dd class="text-sm font-semibold text-cyan-50">+{{ summary.armourSummary.baseProtection }}</dd>
                </div>
                <div class="flex items-center justify-between gap-3">
                  <dt class="text-xs font-semibold uppercase tracking-wide text-zinc-500">Armour Spaces</dt>
                  <dd class="text-sm font-semibold text-cyan-50">{{ summary.armourSummary.armourSpaces }}</dd>
                </div>
              </dl>
              <button
                type="button"
                class="mt-4 h-11 w-full rounded-md border border-amber-300/60 bg-amber-300/10 px-4 text-sm font-semibold text-amber-100 transition hover:border-amber-200 hover:bg-amber-300/15"
                @click="applyHandbookArmourAllocation"
              >
                Auto-Allocate Armour
              </button>
            </div>

            <div class="absolute left-1/2 top-[58%] w-[24rem] -translate-x-1/2 -translate-y-1/2 md:top-[60%] md:w-[42rem]">
              <div class="relative mx-auto">
                <img
                  :src="vehicleDiagramDesktop"
                  alt=""
                  class="hidden w-full max-w-[42rem] select-none md:block"
                  draggable="false"
                >
                <img
                  :src="vehicleDiagramMobile"
                  alt=""
                  class="block w-full max-w-[24rem] select-none md:hidden"
                  draggable="false"
                >
              </div>
            </div>
          </div>
        </div>
    </section>
  </div>
</template>
