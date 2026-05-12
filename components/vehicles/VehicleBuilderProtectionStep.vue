<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CustomVehicleDesign } from '~/types/vehicle'
import vehicleDiagramDesktopRaw from '~/assets/armoury_icons/vehicle_exploded_grouped_detailed.svg?raw'
import vehicleDiagramMobileRaw from '~/assets/armoury_icons/vehicle_exploded_grouped_detailed.svg?raw'
import vehicleDiagramDesktopOverlayRaw from '~/assets/armoury_icons/vehicle_exploded_grouped_preserved_guttered_overlay.svg?raw'
import vehicleDiagramMobileOverlayRaw from '~/assets/armoury_icons/vehicle_exploded_grouped_preserved_guttered_overlay.svg?raw'

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

type ArmourRuleDisplayRow = {
  tl: number
  materials: string
  baseProtection: number
  maximumProtection: number
}

const facingToRegionId: Record<ArmourFacing, string> = {
  forward: 'front',
  aft: 'back',
  port: 'left-side',
  starboard: 'right-side',
  dorsal: 'roof',
  ventral: 'cockpit',
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

const armourRuleDisplayRows: ArmourRuleDisplayRow[] = Array.from({ length: 21 }, (_, tl) => {
  const currentRule = armourRuleRows.find((row) => {
    if (row.tl === '18+') return tl >= 18
    const [minTl, maxTl] = row.tl.split('-').map(Number)
    return tl >= minTl && tl <= maxTl
  }) ?? armourRuleRows[armourRuleRows.length - 1]

  return {
    tl,
    materials: currentRule.materials,
    baseProtection: currentRule.baseProtection,
    maximumProtection: currentRule.maximumProtection,
  }
})

const handbookAddedArmourPoints = ref(0)
const activeFacing = ref<ArmourFacing | null>(null)
const purchaseInputDirty = ref(false)
const reallocationUnlocked = ref(false)
const manualAllocationDirty = ref(false)

const appliedAdditionalArmourPoints = computed(() => Math.max(0, Math.round(props.summary.armourSummary.equivalentAddedProtection)))
const purchasedAdditionalArmourPoints = computed(() => Math.max(0, Math.round(handbookAddedArmourPoints.value)))
const displayedAdditionalArmourPoints = computed(() => (
  purchaseInputDirty.value
    ? purchasedAdditionalArmourPoints.value
    : appliedAdditionalArmourPoints.value
))

const previewArmourSpend = computed(() => {
  const additionalArmourPoints = Math.max(0, Math.round(handbookAddedArmourPoints.value))
  const vehicleSpaces = Math.max(0, Number(props.vehicle.spaces) || 0)
  const techLevel = Math.max(0, Number(props.vehicle.techLevel) || 0)
  const currentRule = armourRuleRows.find((row) => {
    if (row.tl === '18+') return techLevel >= 18
    const [minTl, maxTl] = row.tl.split('-').map(Number)
    return techLevel >= minTl && techLevel <= maxTl
  }) ?? armourRuleRows[0]

  const vehicleSpacesPerPointPercentByTl: Record<string, number> = {
    '0-2': 0.025,
    '3-4': 0.015,
    '5-6': 0.01,
    '7-9': 0.01,
    '10-11': 0.005,
    '12-13': 0.004,
    '14-15': 0.0032,
    '16': 0.002,
    '17': 0.0016,
    '18+': 0.001,
  }

  const costPerArmourSpaceByTl: Record<string, number> = {
    '0-2': 1000,
    '3-4': 5000,
    '5-6': 7500,
    '7-9': 12500,
    '10-11': 50000,
    '12-13': 75000,
    '14-15': 125000,
    '16': 375000,
    '17': 500000,
    '18+': 1000000,
  }

  const costPerPointPerVehicleSpaceByTl: Record<string, number> = {
    '0-2': 25,
    '3-4': 75,
    '5-6': 75,
    '7-9': 125,
    '10-11': 250,
    '12-13': 300,
    '14-15': 400,
    '16': 750,
    '17': 800,
    '18+': 1000,
  }

  const sizeBandMultiplier = (() => {
    if (vehicleSpaces <= 3) return 2
    if (vehicleSpaces <= 19) return 1.5
    if (vehicleSpaces <= 99) return 1
    if (vehicleSpaces <= 199) return 0.75
    if (vehicleSpaces <= 999) return 0.5
    if (vehicleSpaces <= 1999) return 0.4
    return 0.25
  })()

  const rawArmourSpaces = vehicleSpaces
    * vehicleSpacesPerPointPercentByTl[currentRule.tl]
    * sizeBandMultiplier
    * additionalArmourPoints

  const armourSpaces = rawArmourSpaces > 0 ? Math.ceil(rawArmourSpaces) : 0
  const armourCost = rawArmourSpaces > 0
    ? (
        Number.isInteger(rawArmourSpaces)
          ? rawArmourSpaces * costPerArmourSpaceByTl[currentRule.tl]
          : additionalArmourPoints * vehicleSpaces * sizeBandMultiplier * costPerPointPerVehicleSpaceByTl[currentRule.tl]
      )
    : 0

  return {
    armourSpaces,
    armourCost,
  }
})

const overallArmourRating = computed(() => (
  props.summary.armourSummary.baseProtection + purchasedAdditionalArmourPoints.value
))

const purchasedArmourCap = computed(() => (
  Math.max(0, props.summary.armourSummary.maximumProtection - props.summary.armourSummary.baseProtection)
))

const buildVehicleDiagramImage = (svgMarkup: string, idPrefix: string) => {
  const cleanedSvgMarkup = svgMarkup.replace(/<title>[\s\S]*?<\/title>/i, '')
  const defsAndStyle = `
<defs>
  <linearGradient id="${idPrefix}-body-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#0f2a40" />
    <stop offset="52%" stop-color="#0b2135" />
    <stop offset="100%" stop-color="#081727" />
  </linearGradient>
  <filter id="${idPrefix}-body-glow" x="-30%" y="-30%" width="160%" height="160%">
    <feDropShadow dx="0" dy="0" stdDeviation="3.8" flood-color="#c8f4ff" flood-opacity="0.7" />
    <feDropShadow dx="0" dy="0" stdDeviation="8.5" flood-color="#38bdf8" flood-opacity="0.42" />
  </filter>
  <filter id="${idPrefix}-detail-glow" x="-40%" y="-40%" width="180%" height="180%">
    <feDropShadow dx="0" dy="0" stdDeviation="2.8" flood-color="#c8f4ff" flood-opacity="0.95" />
    <feDropShadow dx="0" dy="0" stdDeviation="6.5" flood-color="#38bdf8" flood-opacity="0.55" />
  </filter>
</defs>
<style>
  .body {
    fill: url(#${idPrefix}-body-gradient) !important;
    filter: url(#${idPrefix}-body-glow);
  }
  .detail {
    fill: #8fe9ff !important;
    filter: url(#${idPrefix}-detail-glow);
  }
</style>`

  const svgWithRuntimeStyling = cleanedSvgMarkup.replace(/<style>[\s\S]*?<\/style>/, defsAndStyle)
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgWithRuntimeStyling)}`
}

const buildVehicleDiagramRegionOverlay = (
  svgMarkup: string,
  idPrefix: string,
  selectedFacing: ArmourFacing | null,
) => {
  const cleanedSvgMarkup = svgMarkup.replace(/<title>[\s\S]*?<\/title>/i, '')
  const selectedRegionId = selectedFacing ? facingToRegionId[selectedFacing] : null
  const defsAndStyle = `
<defs>
  <linearGradient id="${idPrefix}-region-active-fill" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="rgba(120, 53, 15, 0.9)" />
    <stop offset="100%" stop-color="rgba(69, 26, 3, 0.94)" />
  </linearGradient>
  <filter id="${idPrefix}-region-outline" x="-24%" y="-24%" width="148%" height="148%" color-interpolation-filters="sRGB">
    <feDropShadow dx="0" dy="0" stdDeviation="2.4" flood-color="#67e8f9" flood-opacity="0.42" />
    <feDropShadow dx="0" dy="0" stdDeviation="5.2" flood-color="#38bdf8" flood-opacity="0.2" />
  </filter>
  <filter id="${idPrefix}-region-active-outline" x="-34%" y="-34%" width="168%" height="168%" color-interpolation-filters="sRGB">
    <feDropShadow dx="0" dy="0" stdDeviation="3.2" flood-color="#fde68a" flood-opacity="0.62" />
    <feDropShadow dx="0" dy="0" stdDeviation="7.2" flood-color="#f59e0b" flood-opacity="0.34" />
  </filter>
</defs>
<style>
  .region-shape {
    fill: transparent;
    stroke: transparent;
    stroke-width: 0;
    stroke-linejoin: round;
    stroke-linecap: round;
    vector-effect: non-scaling-stroke;
    paint-order: stroke;
    filter: none;
  }
  ${selectedRegionId ? `#${selectedRegionId} .region-shape {
    fill: url(#${idPrefix}-region-active-fill);
    fill-opacity: 0.28;
    stroke: rgba(251, 191, 36, 0.42);
    stroke-width: 1.4;
    filter: url(#${idPrefix}-region-active-outline);
  }` : ''}
</style>`

  const svgWithRuntimeStyling = cleanedSvgMarkup.includes('<style>')
    ? cleanedSvgMarkup.replace(/<style>[\s\S]*?<\/style>/, defsAndStyle)
    : cleanedSvgMarkup.replace(/<svg([^>]*)>/, `<svg$1>${defsAndStyle}`)

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgWithRuntimeStyling)}`
}

const vehicleDiagramDesktop = computed(() => buildVehicleDiagramImage(
  vehicleDiagramDesktopRaw,
  'vehicle-armour-desktop',
))

const vehicleDiagramMobile = computed(() => buildVehicleDiagramImage(
  vehicleDiagramMobileRaw,
  'vehicle-armour-mobile',
))

const vehicleDiagramDesktopOverlay = computed(() => buildVehicleDiagramRegionOverlay(
  vehicleDiagramDesktopOverlayRaw,
  'vehicle-armour-desktop-overlay',
  reallocationUnlocked.value ? activeFacing.value : null,
))

const vehicleDiagramMobileOverlay = computed(() => buildVehicleDiagramRegionOverlay(
  vehicleDiagramMobileOverlayRaw,
  'vehicle-armour-mobile-overlay',
  reallocationUnlocked.value ? activeFacing.value : null,
))

const minimumDorsalProtection = computed(() => (
  props.vehicle.features.includes('Open-Topped') || props.vehicle.features.includes('Open Frame')
    ? 0
    : props.summary.armourSummary.baseProtection
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

const defaultAllocatedFaceValues = computed<Record<ArmourFacing, number>>(() => {
  const baseProtection = props.summary.armourSummary.baseProtection
  const addedPoints = purchasedAdditionalArmourPoints.value
  const dorsalAndVentralAdded = Math.floor(addedPoints / 2)
  return {
    forward: baseProtection + addedPoints,
    aft: baseProtection + addedPoints,
    port: baseProtection + addedPoints,
    starboard: baseProtection + addedPoints,
    dorsal: Math.max(minimumDorsalProtection.value, baseProtection + dorsalAndVentralAdded),
    ventral: baseProtection + dorsalAndVentralAdded,
  }
})

const manualReallocationPool = computed(() => {
  let removedPoints = 0
  let addedPoints = 0
  for (const facing of Object.keys(currentFaceValues.value) as ArmourFacing[]) {
    const defaultValue = defaultAllocatedFaceValues.value[facing]
    const currentValue = currentFaceValues.value[facing]
    if (currentValue < defaultValue) removedPoints += defaultValue - currentValue
    if (currentValue > defaultValue) addedPoints += currentValue - defaultValue
  }
  return removedPoints - addedPoints
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

    purchaseInputDirty.value = false
  },
)

watch(
  () => props.summary.armourSummary.equivalentAddedProtection,
  (value) => {
    if (purchaseInputDirty.value || manualAllocationDirty.value) return
    handbookAddedArmourPoints.value = Math.max(0, Math.round(value))
  },
  { immediate: true },
)

watch(reallocationUnlocked, (isUnlocked) => {
  if (!isUnlocked) activeFacing.value = null
})

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
  purchaseInputDirty.value = false
}

const handlePurchasedArmourInput = () => {
  purchaseInputDirty.value = true
  manualAllocationDirty.value = false
  if (!reallocationUnlocked.value) {
    applyHandbookArmourAllocation()
  }
}

const updateArmourFacingValue = (facing: ArmourFacing, rawValue: string) => {
  props.vehicle.armour[facing] = rawValue
  purchaseInputDirty.value = false
  manualAllocationDirty.value = true
}

const handleArmourFacingFocus = (facing: ArmourFacing) => {
  if (!reallocationUnlocked.value) return
  activeFacing.value = facing
}

const setAllocationMode = (manual: boolean) => {
  if (manual) {
    reallocationUnlocked.value = true
    return
  }
  reallocationUnlocked.value = false
  applyHandbookArmourAllocation()
}

const armourFacingFields: Array<{ key: ArmourFacing, label: string }> = [
  { key: 'forward', label: 'Forward' },
  { key: 'aft', label: 'Aft' },
  { key: 'port', label: 'Port' },
  { key: 'starboard', label: 'Starboard' },
  { key: 'dorsal', label: 'Dorsal' },
  { key: 'ventral', label: 'Ventral' },
]

</script>

<template>
  <div class="grid gap-4">
    <section class="rounded-md border border-cyan-400/20 bg-slate-950/35 p-4">
      <div class="grid gap-4">
          <div class="w-full overflow-hidden rounded-md border border-cyan-400/20 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.08),_transparent_42%),linear-gradient(180deg,rgba(2,6,23,0.88),rgba(2,6,23,0.96))] p-4">
            <div class="grid min-h-[42rem] gap-6 xl:grid-cols-[minmax(16rem,0.82fr)_minmax(0,2.18fr)]">
            <div class="group/material rounded-md border border-cyan-400/20 bg-slate-950/80 p-4 shadow-[0_0_24px_rgba(34,211,238,0.10)]">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">Armour Context</p>
                  <p class="mt-2 text-lg font-semibold text-cyan-50">+{{ overallArmourRating }} / +{{ summary.armourSummary.maximumProtection }}</p>
                  <p class="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200/75">Purchased +{{ purchasedAdditionalArmourPoints }} / +{{ purchasedArmourCap }}</p>
                </div>
                <div class="text-right">
                  <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Spaces</p>
                  <p class="mt-1 text-sm font-semibold text-cyan-50">{{ previewArmourSpend.armourSpaces }}</p>
                </div>
              </div>

              <div class="mt-4 grid gap-3">
                <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <span>Buy Additional Armour</span>
                  <div class="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-3">
                    <input
                      v-model.number="handbookAddedArmourPoints"
                      type="number"
                      min="0"
                      :max="purchasedArmourCap"
                      class="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm font-normal text-zinc-900 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                      @input="handlePurchasedArmourInput"
                    >
                    <input
                      :value="`Cr${Math.round(previewArmourSpend.armourCost).toLocaleString()}`"
                      readonly
                      class="h-10 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm font-normal text-zinc-700 outline-none"
                    >
                  </div>
                </label>

                <div class="group/material-field relative grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <span>Material</span>
                  <button
                    type="button"
                    class="flex h-10 items-center justify-between rounded-md border border-cyan-400/25 bg-slate-950/60 px-3 text-left text-sm font-semibold text-cyan-50 transition hover:border-cyan-300 hover:bg-slate-900/70"
                  >
                    <span>{{ summary.armourSummary.rule.materials }}</span>
                    <span class="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/75">TL {{ vehicle.techLevel }}</span>
                  </button>
                  <div class="pointer-events-none absolute left-0 top-full z-30 mt-2 hidden w-[30rem] rounded-md border border-cyan-400/35 bg-slate-950/95 p-4 shadow-[0_0_32px_rgba(34,211,238,0.16)] group-hover/material-field:block group-focus-within/material-field:block">
                    <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">Armour Materials By Tech Level</p>
                    <div class="mt-3 overflow-hidden rounded-md border border-cyan-400/20">
                      <div class="grid grid-cols-[4.5rem_minmax(0,1fr)_6rem_7rem] bg-cyan-400/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100/80">
                        <span>TL</span>
                        <span>Material</span>
                        <span>Base</span>
                        <span>Max</span>
                      </div>
                      <div
                        v-for="row in armourRuleDisplayRows"
                        :key="row.tl"
                        class="grid grid-cols-[4.5rem_minmax(0,1fr)_6rem_7rem] border-t border-cyan-400/10 px-3 py-2 text-xs text-zinc-200"
                        :class="row.tl === vehicle.techLevel ? 'bg-cyan-400/10 text-cyan-50' : ''"
                      >
                        <span>TL {{ row.tl }}</span>
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
              </div>

              <div class="mt-4 grid grid-cols-2 gap-x-2 gap-y-2">
                <label
                  v-for="field in armourFacingFields"
                  :key="field.key"
                  class="grid gap-1"
                >
                  <span class="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200/80">{{ field.label }}</span>
                  <input
                    type="text"
                    inputmode="numeric"
                    :value="currentFaceValues[field.key]"
                    :readonly="!reallocationUnlocked"
                    class="h-8 w-full rounded-md border border-cyan-400/25 bg-slate-950/78 px-2 text-sm font-semibold text-cyan-50 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/20 disabled:cursor-not-allowed disabled:border-cyan-400/10 disabled:text-cyan-200/60"
                    :class="reallocationUnlocked ? '' : 'cursor-not-allowed border-cyan-400/10 text-cyan-200/60'"
                    @focus="handleArmourFacingFocus(field.key)"
                    @blur="activeFacing = null"
                    @input="updateArmourFacingValue(field.key, ($event.target as HTMLInputElement).value)"
                  >
                </label>
              </div>

              <div class="mt-4 grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <span>Armour Allocation</span>
                <div
                  class="relative h-11 overflow-hidden rounded-md p-1"
                  style="
                    border: 1px solid rgba(34, 211, 238, 0.3);
                    background: rgba(2, 6, 23, 0.78);
                    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
                  "
                >
                  <div class="pointer-events-none absolute inset-1">
                    <div
                      class="h-full w-1/2 rounded-[5px] transition-[transform,background,box-shadow] duration-300 ease-out"
                      :style="{
                        transform: reallocationUnlocked ? 'translateX(100%)' : 'translateX(0)',
                        background: 'linear-gradient(180deg, rgba(56, 189, 248, 0.32), rgba(8, 145, 178, 0.26))',
                        boxShadow: 'inset 0 0 0 1px rgba(103, 232, 249, 0.42), 0 0 0 1px rgba(34, 211, 238, 0.18), 0 0 24px rgba(34, 211, 238, 0.18)',
                      }"
                    />
                  </div>
                  <div class="relative z-10 grid h-full grid-cols-2">
                  <button
                    type="button"
                    class="flex h-full items-center justify-center px-3 text-sm font-semibold transition-colors duration-200 outline-none"
                    :class="!reallocationUnlocked ? 'text-cyan-50' : 'text-cyan-200/70 hover:text-cyan-50'"
                    style="appearance: none; border: 0; border-radius: 0; background: transparent; box-shadow: none;"
                    @click="setAllocationMode(false)"
                  >
                    Automatic
                  </button>
                  <button
                    type="button"
                    class="flex h-full items-center justify-center px-3 text-sm font-semibold transition-colors duration-200 outline-none"
                    :class="reallocationUnlocked ? 'text-cyan-50' : 'text-cyan-200/70 hover:text-cyan-50'"
                    style="appearance: none; border: 0; border-radius: 0; background: transparent; box-shadow: none;"
                    @click="setAllocationMode(true)"
                  >
                    Manual
                  </button>
                  </div>
                </div>
              </div>

              <p v-if="reallocationUnlocked" class="mt-3 text-xs leading-5 text-zinc-400">
                Manual changes redistribute existing purchased armour between faces. They do not increase total purchased armour.
              </p>
              <div
                v-if="reallocationUnlocked"
                class="mt-3 rounded-md border px-3 py-2"
                style="
                  border-color: rgba(251, 191, 36, 0.42);
                  background: linear-gradient(180deg, rgba(120, 53, 15, 0.9), rgba(69, 26, 3, 0.94));
                  color: rgb(254 243 199);
                  box-shadow:
                    inset 0 0 0 1px rgba(255, 255, 255, 0.05),
                    0 0 16px rgba(251, 191, 36, 0.12);
                "
              >
                <p class="text-[10px] font-semibold uppercase tracking-[0.18em]" style="color: rgb(254 243 199);">Unallocated Armour</p>
                <p class="mt-1 text-sm font-semibold" style="color: rgb(254 243 199);">{{ manualReallocationPool }}</p>
              </div>
            </div>

            <div
              class="flex min-h-[28rem] items-center justify-center rounded-md border border-cyan-400/15 p-4 md:p-5"
              style="
                background-color: rgba(2, 6, 23, 0.86);
                background-image:
                  radial-gradient(circle at 50% 38%, rgba(34, 211, 238, 0.10), transparent 52%),
                  linear-gradient(rgba(103, 232, 249, 0.16) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(56, 189, 248, 0.13) 1px, transparent 1px),
                  linear-gradient(180deg, rgba(2, 6, 23, 0.56), rgba(2, 6, 23, 0.90));
                background-size: 100% 100%, 18px 18px, 18px 18px, 100% 100%;
                background-position: 0 0, 0 0, 0 0, 0 0;
                box-shadow: inset 0 0 0 1px rgba(34, 211, 238, 0.04);
              "
            >
              <div class="relative mx-auto w-full">
                <div class="vehicle-armour-diagram mx-auto hidden w-full max-w-[68rem] select-none md:block" aria-hidden="true">
                  <img
                    :src="vehicleDiagramDesktopOverlay"
                    alt=""
                    class="vehicle-armour-diagram__overlay-img"
                    draggable="false"
                  >
                  <img
                    :src="vehicleDiagramDesktop"
                    alt=""
                    class="block w-full"
                    draggable="false"
                  >
                </div>
                <div class="vehicle-armour-diagram mx-auto block w-full max-w-[40rem] select-none md:hidden" aria-hidden="true">
                  <img
                    :src="vehicleDiagramMobileOverlay"
                    alt=""
                    class="vehicle-armour-diagram__overlay-img"
                    draggable="false"
                  >
                  <img
                    :src="vehicleDiagramMobile"
                    alt=""
                    class="block w-full"
                    draggable="false"
                  >
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
    </section>
  </div>
</template>

<style scoped>
.vehicle-armour-diagram :deep(svg) {
  display: block;
  width: 100%;
  height: auto;
}

.vehicle-armour-diagram {
  position: relative;
}

.vehicle-armour-diagram-pane {
  background:
    linear-gradient(180deg, rgba(2, 6, 23, 0.72), rgba(2, 6, 23, 0.9)),
    repeating-linear-gradient(
      0deg,
      rgba(56, 189, 248, 0.07) 0,
      rgba(56, 189, 248, 0.07) 1px,
      transparent 1px,
      transparent 28px
    ),
    repeating-linear-gradient(
      90deg,
      rgba(56, 189, 248, 0.07) 0,
      rgba(56, 189, 248, 0.07) 1px,
      transparent 1px,
      transparent 28px
    );
  box-shadow: inset 0 0 0 1px rgba(34, 211, 238, 0.04);
}

.allocation-toggle__thumb {
  background: linear-gradient(180deg, rgba(56, 189, 248, 0.32), rgba(8, 145, 178, 0.26));
  box-shadow:
    inset 0 0 0 1px rgba(103, 232, 249, 0.42),
    0 0 0 1px rgba(34, 211, 238, 0.18),
    0 0 24px rgba(34, 211, 238, 0.18);
  transform: translateX(0);
  transition:
    transform 220ms ease-out,
    background 220ms ease-out,
    box-shadow 220ms ease-out;
  will-change: transform;
}

.allocation-toggle__thumb.is-manual {
  transform: translateX(100%);
}

.vehicle-armour-diagram__overlay-img {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: block;
  width: 100%;
  height: auto;
  pointer-events: none;
}
</style>
