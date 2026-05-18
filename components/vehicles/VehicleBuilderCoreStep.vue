<script setup lang="ts">
import { computed, watch } from 'vue'
import type { CustomVehicleDesign } from '~/types/vehicle'
import { vehicleFamilyRule, vehicleHitDmForSpaces, vehicleSizeBandForSpaces } from '~/utils/traveller/vehicles'
import { hasVehicleSilhouetteAsset, vehicleSilhouetteImageClass, vehicleSilhouetteSource } from '~/utils/vehicleBuilderSilhouettes'

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

const familyRule = computed(() => props.vehicle.baseFamily ? vehicleFamilyRule(props.vehicle.baseFamily) : null)
const derivedSizeBand = computed(() => vehicleSizeBandForSpaces(props.vehicle.spaces))
const derivedType = computed(() => familyRule.value ? `${derivedSizeBand.value.label} ${familyRule.value.typeLabel}` : '')
const formatCredits = (value: number) => value >= 1000000 ? `MCr${value / 1000000}` : `Cr${value}`
const formatNumber = (value: number) => Number.isInteger(value) ? String(value) : String(value)
const formatTlBand = (minimum: number, maximum?: number) => maximum === undefined
  ? `${minimum}+`
  : minimum === maximum
    ? String(minimum)
    : `${minimum}-${maximum}`
const formatRange = (range: number) => range > 0 ? String(range) : '0'
const typeStats = computed(() => [
  ...(familyRule.value
    ? [
        { label: 'Tech Level', value: String(familyRule.value.minimumTechLevel) },
        { label: 'Skill', value: familyRule.value.defaultSkill },
        { label: 'Agility', value: `${familyRule.value.baseAgility >= 0 ? '+' : ''}${familyRule.value.baseAgility}` },
        { label: 'Hull', value: `${formatNumber(familyRule.value.hullPerSpace)} per Space` },
        { label: 'Shipping', value: `${formatNumber(familyRule.value.shippingRatio)} tons per Space` },
        ...(familyRule.value.defaultTraits?.length ? [{ label: 'Traits', value: familyRule.value.defaultTraits.join(', ') }] : []),
        { label: 'Cost', value: `${formatCredits(familyRule.value.baseCostPerSpace)} per Space` },
        { label: 'Examples', value: familyRule.value.examples },
        { label: 'Allowed Features', value: familyRule.value.allowedFeatures.join(', ') },
      ]
    : [
        { label: 'Tech Level', value: '—' },
        { label: 'Skill', value: '—' },
        { label: 'Agility', value: '—' },
        { label: 'Hull', value: '—' },
        { label: 'Shipping', value: '—' },
        { label: 'Cost', value: '—' },
        { label: 'Examples', value: 'Choose a vehicle type.' },
        { label: 'Allowed Features', value: '—' },
      ]),
])
const visualKind = computed(() => props.vehicle.baseFamily)
const useSilhouetteFallback = computed(() => !hasVehicleSilhouetteAsset(visualKind.value))
const silhouetteSource = computed(() => vehicleSilhouetteSource(visualKind.value))
const silhouetteImageClass = computed(() => vehicleSilhouetteImageClass(visualKind.value))

// Switching the base vehicle family resets handbook-driven defaults that should follow
// from the family definition rather than remain stuck on a value from a prior family.
watch(
  () => props.vehicle.baseFamily,
  () => {
    if (!familyRule.value) {
      props.vehicle.type = ''
      props.vehicle.skill = ''
      emit('sync-derivations')
      return
    }
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
      <div class="vehicle-builder-step-header">
        <div class="vehicle-builder-step-header__inner">
          <div class="vehicle-builder-step-header__title">
            <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200/80">Vehicle Design Step 3</p>
            <h3 class="mt-1 text-xl font-black uppercase tracking-wide text-cyan-50">Pick Vehicle Type</h3>
          </div>
          <div class="vehicle-builder-step-header__controls">
            <div class="vehicle-builder-step-header__control-row">
              <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                <span>Vehicle Type</span>
                <select v-model="props.vehicle.baseFamily" class="h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm font-normal normal-case tracking-normal text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
                  <option value="">—</option>
                  <option v-for="option in props.optionSets.baseFamilies" :key="option.id" :value="option.id">{{ option.label }}</option>
                </select>
              </label>
            </div>
            <p class="vehicle-builder-step-header__message" aria-hidden="true">&nbsp;</p>
          </div>
        </div>
      </div>

      <div class="vehicle-builder-two-panel p-4 sm:p-5">
        <div class="vehicle-builder-panel-card vehicle-builder-visual-card relative flex w-full flex-col justify-start bg-slate-900/35 p-5">
          <div
            aria-hidden="true"
            class="pointer-events-none absolute inset-0 opacity-30"
            style="background-image: linear-gradient(rgba(103,232,249,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(103,232,249,0.22) 1px, transparent 1px); background-size: 22px 22px;"
          />
          <div aria-hidden="true" class="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950/95 to-transparent" />
          <div class="vehicle-builder-visual-copy min-h-[12rem]">
            <h4 class="text-3xl font-black uppercase leading-none tracking-wide text-cyan-50">{{ familyRule?.label ?? 'Choose Vehicle Type' }}</h4>
            <p class="mt-3 line-clamp-6 max-w-xl text-sm leading-5 text-zinc-300">{{ familyRule?.description ?? 'Select a vehicle type to establish the baseline chassis, skill, hull, shipping, traits, and allowed features.' }}</p>
          </div>
          <img
            v-if="!useSilhouetteFallback"
            :src="silhouetteSource"
            alt=""
            class="vehicle-builder-visual-art pointer-events-none object-contain object-bottom opacity-95 drop-shadow-[0_0_32px_rgba(103,232,249,0.32)]"
            :class="silhouetteImageClass"
            draggable="false"
          >
          <svg v-else class="vehicle-builder-visual-art pointer-events-none text-cyan-100/55 drop-shadow-[0_0_22px_rgba(103,232,249,0.22)]" viewBox="0 0 360 190" role="img" aria-label="Vehicle silhouette">
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

        <div class="vehicle-builder-panel grid content-start gap-5">
          <div class="grid min-w-0 content-start gap-px overflow-hidden rounded-sm">
            <div v-for="row in typeStats" :key="row.label" class="grid min-w-0 grid-cols-[minmax(7rem,9rem)_minmax(0,1fr)] items-stretch text-sm">
              <div class="bg-cyan-400/20 px-2 py-1 font-black uppercase tracking-wide text-cyan-100">{{ row.label }}</div>
              <div class="min-w-0 break-words border-b border-cyan-400/25 px-2 py-1 leading-5 text-zinc-200">{{ row.value }}</div>
            </div>
          </div>

          <div class="min-h-[12rem] min-w-0 overflow-x-auto">
            <div class="grid min-w-[18rem] grid-cols-[4.75rem_minmax(0,1fr)_5.5rem] text-sm font-bold text-cyan-100">
              <span class="px-2 py-1">TL</span>
              <span class="px-2 py-1">Speed</span>
              <span class="px-2 py-1">Range</span>
            </div>
            <div
              v-for="row in familyRule?.speedBaselines ?? []"
              :key="`${row.minTl}-${row.maxTl ?? 'plus'}`"
              class="grid min-w-[18rem] grid-cols-[4.75rem_minmax(0,1fr)_5.5rem] border-x border-t border-cyan-400/30 text-sm text-zinc-200 last:border-b"
            >
              <span class="border-r border-cyan-400/30 px-2 py-1">{{ formatTlBand(row.minTl, row.maxTl) }}</span>
              <span class="border-r border-cyan-400/30 px-2 py-1">{{ row.speed }}</span>
              <span class="px-2 py-1">{{ formatRange(row.range) }}</span>
            </div>
            <p v-if="!familyRule" class="border border-cyan-400/30 px-2 py-3 text-sm text-zinc-300">Select a vehicle type to view baseline speed and range.</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
