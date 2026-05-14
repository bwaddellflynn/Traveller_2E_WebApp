<script setup lang="ts">
import { computed, watch } from 'vue'
import type { CustomVehicleDesign } from '~/types/vehicle'
import { vehicleFamilyRule, vehicleHitDmForSpaces, vehicleSizeBandForSpaces } from '~/utils/traveller/vehicles'
import { hasWalkerSilhouetteAsset, vehicleSilhouetteSource } from '~/utils/vehicleBuilderSilhouettes'

const props = defineProps<{
  vehicle: CustomVehicleDesign
  optionSets: {
    baseFamilies: Array<{ id: string, label: string, category: string }>
    hulls: string[]
    skills: string[]
  }
}>()

const emit = defineEmits<{
  (event: 'sync-derivations'): void
}>()

const familyRule = computed(() => vehicleFamilyRule(props.vehicle.baseFamily))
const derivedSizeBand = computed(() => vehicleSizeBandForSpaces(props.vehicle.spaces))
const derivedType = computed(() => `${derivedSizeBand.value.label} ${familyRule.value.typeLabel}`)
const formatCredits = (value: number) => value >= 1000000 ? `MCr${value / 1000000}` : `Cr${value}`
const formatNumber = (value: number) => Number.isInteger(value) ? String(value) : String(value)
const formatTlBand = (minimum: number, maximum?: number) => maximum === undefined
  ? `${minimum}+`
  : minimum === maximum
    ? String(minimum)
    : `${minimum}-${maximum}`
const formatRange = (range: number) => range > 0 ? String(range) : '0'
const typeStats = computed(() => [
  { label: 'Tech Level', value: String(familyRule.value.minimumTechLevel) },
  { label: 'Skill', value: familyRule.value.defaultSkill },
  { label: 'Agility', value: `${familyRule.value.baseAgility >= 0 ? '+' : ''}${familyRule.value.baseAgility}` },
  { label: 'Hull', value: `${formatNumber(familyRule.value.hullPerSpace)} per Space` },
  { label: 'Shipping', value: `${formatNumber(familyRule.value.shippingRatio)} tons per Space` },
  ...(familyRule.value.defaultTraits?.length ? [{ label: 'Traits', value: familyRule.value.defaultTraits.join(', ') }] : []),
  { label: 'Cost', value: `${formatCredits(familyRule.value.baseCostPerSpace)} per Space` },
  { label: 'Examples', value: familyRule.value.examples },
  { label: 'Allowed Features', value: familyRule.value.allowedFeatures.join(', ') },
])
const visualKind = computed(() => props.vehicle.baseFamily)
const useWalkerFallback = computed(() => visualKind.value === 'walker' && !hasWalkerSilhouetteAsset())
const silhouetteSource = computed(() => vehicleSilhouetteSource(visualKind.value === 'walker' ? 'walker' : 'wheeled'))
const silhouetteImageClass = computed(() => (
  visualKind.value === 'walker'
    ? 'h-80 w-[40rem]'
    : 'h-64 w-[32rem]'
))

// Switching the base vehicle family resets handbook-driven defaults that should follow
// from the family definition rather than remain stuck on a value from a prior family.
watch(
  () => props.vehicle.baseFamily,
  () => {
    const nextCategory = familyRule.value.category
    const nextType = derivedType.value
    const nextTechLevel = Math.max(props.vehicle.techLevel, familyRule.value.minimumTechLevel)
    const nextSkill = familyRule.value.defaultSkill
    if (props.vehicle.category !== nextCategory) props.vehicle.category = nextCategory
    if (props.vehicle.type !== nextType) props.vehicle.type = nextType
    if (props.vehicle.techLevel !== nextTechLevel) props.vehicle.techLevel = nextTechLevel
    if (props.vehicle.skill !== nextSkill) props.vehicle.skill = nextSkill
    emit('sync-derivations')
  },
)

// Type and target-size modifiers both flow from Spaces in the handbook construction sequence.
watch(
  () => props.vehicle.spaces,
  () => {
    const nextHitDm = vehicleHitDmForSpaces(props.vehicle.spaces)
    const nextType = derivedType.value
    if (props.vehicle.hitDm !== nextHitDm) props.vehicle.hitDm = nextHitDm
    if (props.vehicle.type !== nextType) props.vehicle.type = nextType
    emit('sync-derivations')
  },
  { immediate: true },
)

watch(
  () => [props.vehicle.techLevel, props.vehicle.hull],
  () => {
    emit('sync-derivations')
  },
)
</script>

<template>
  <div class="grid gap-4">
    <section class="overflow-hidden rounded-md border border-cyan-400/25 bg-slate-950/45 text-cyan-50 shadow-[0_0_28px_rgba(34,211,238,0.08)]">
      <div class="border-b border-cyan-400/30 bg-cyan-400/10 px-4 py-3 sm:px-5">
        <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200/80">Vehicle Design Step 2</p>
            <h3 class="mt-1 text-xl font-black uppercase tracking-wide text-cyan-50">Pick Vehicle Type</h3>
          </div>
          <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            <span>Vehicle Type</span>
            <select v-model="props.vehicle.baseFamily" class="h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm font-normal normal-case tracking-normal text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
              <option v-for="option in props.optionSets.baseFamilies" :key="option.id" :value="option.id">{{ option.label }}</option>
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
          <div class="relative z-10 min-h-[12rem]">
            <h4 class="text-3xl font-black uppercase leading-none tracking-wide text-cyan-50">{{ familyRule.label }}</h4>
            <p class="mt-3 line-clamp-6 max-w-xl text-sm leading-5 text-zinc-300">{{ familyRule.description }}</p>
          </div>
          <img
            v-if="!useWalkerFallback"
            :src="silhouetteSource"
            alt=""
            class="pointer-events-none absolute bottom-7 left-1/2 z-0 max-w-[calc(100%-4rem)] -translate-x-1/2 object-contain object-bottom opacity-95 drop-shadow-[0_0_32px_rgba(103,232,249,0.32)]"
            :class="silhouetteImageClass"
            draggable="false"
          >
          <svg v-else class="pointer-events-none absolute inset-x-8 bottom-8 z-0 h-56 w-[calc(100%-4rem)] text-cyan-100/55 drop-shadow-[0_0_22px_rgba(103,232,249,0.22)]" viewBox="0 0 360 190" role="img" aria-label="Vehicle silhouette">
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

        <div class="grid min-h-[35.75rem] content-start gap-5">
          <div class="grid min-h-[20rem] content-start gap-px">
            <div v-for="row in typeStats" :key="row.label" class="grid grid-cols-[8.25rem_minmax(0,1fr)] items-stretch text-sm">
              <div class="bg-cyan-400/20 px-2 py-1 font-black uppercase tracking-wide text-cyan-100">{{ row.label }}</div>
              <div class="border-b border-cyan-400/25 px-2 py-1 leading-5 text-zinc-200">{{ row.value }}</div>
            </div>
          </div>

          <div class="min-h-[12rem] max-w-sm">
            <div class="grid grid-cols-[4.75rem_minmax(0,1fr)_5.5rem] text-sm font-bold text-cyan-100">
              <span class="px-2 py-1">TL</span>
              <span class="px-2 py-1">Speed</span>
              <span class="px-2 py-1">Range</span>
            </div>
            <div
              v-for="row in familyRule.speedBaselines"
              :key="`${row.minTl}-${row.maxTl ?? 'plus'}`"
              class="grid grid-cols-[4.75rem_minmax(0,1fr)_5.5rem] border-x border-t border-cyan-400/30 text-sm text-zinc-200 last:border-b"
            >
              <span class="border-r border-cyan-400/30 px-2 py-1">{{ formatTlBand(row.minTl, row.maxTl) }}</span>
              <span class="border-r border-cyan-400/30 px-2 py-1">{{ row.speed }}</span>
              <span class="px-2 py-1">{{ formatRange(row.range) }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
