<script setup lang="ts">
import { computed, watch } from 'vue'
import type { CustomVehicleDesign } from '~/types/vehicle'
import { vehicleFamilyRule, vehicleHitDmForSpaces, vehicleSizeBandForSpaces, vehicleSizeReferenceRowsForFamily } from '~/utils/traveller/vehicles'

const props = defineProps<{
  vehicle: CustomVehicleDesign
}>()

const emit = defineEmits<{
  (event: 'sync-derivations'): void
}>()

const familyRule = computed(() => vehicleFamilyRule(props.vehicle.baseFamily))
const sizeRows = computed(() => vehicleSizeReferenceRowsForFamily(props.vehicle.baseFamily))
const currentSize = computed(() => vehicleSizeBandForSpaces(props.vehicle.spaces))
const currentRow = computed(() => sizeRows.value.find((row) => props.vehicle.spaces >= row.minSpaces && (row.maxSpaces === null || props.vehicle.spaces <= row.maxSpaces)) ?? sizeRows.value[0])
const currentType = computed(() => `${currentSize.value.label} ${familyRule.value.typeLabel}`)
const visualKind = computed(() => props.vehicle.baseFamily)
const formatSpacesRange = (minimum: number, maximum: number | null) => maximum === null ? `${minimum}+` : `${minimum}-${maximum}`
const formattedShipping = computed(() => {
  const value = props.vehicle.spaces * familyRule.value.shippingRatio
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '')
})
const sizeEffects = computed(() => [
  { label: 'Size', value: currentSize.value.label },
  { label: 'Type', value: currentType.value },
  { label: 'Hit DM', value: currentSize.value.hitDm },
  { label: 'Agility', value: `${currentSize.value.agilityModifier >= 0 ? '+' : ''}${currentSize.value.agilityModifier}` },
  { label: 'Speed', value: `${currentSize.value.speedModifier >= 0 ? '+' : ''}${currentSize.value.speedModifier} band` },
  { label: 'Shipping', value: `${formattedShipping.value} tons` },
])

watch(
  () => props.vehicle.spaces,
  () => {
    if (!Number.isFinite(props.vehicle.spaces) || props.vehicle.spaces < 1) props.vehicle.spaces = 1
    const nextHitDm = vehicleHitDmForSpaces(props.vehicle.spaces)
    const nextType = currentType.value
    if (props.vehicle.hitDm !== nextHitDm) props.vehicle.hitDm = nextHitDm
    if (props.vehicle.type !== nextType) props.vehicle.type = nextType
    emit('sync-derivations')
  },
  { immediate: true },
)
</script>

<template>
  <div class="grid gap-4">
    <section class="overflow-hidden rounded-md border border-cyan-400/25 bg-slate-950/45 text-cyan-50 shadow-[0_0_28px_rgba(34,211,238,0.08)]">
      <div class="border-b border-cyan-400/30 bg-cyan-400/10 px-4 py-3 sm:px-5">
        <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-end">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200/80">Vehicle Design Step 3</p>
            <h3 class="mt-1 text-xl font-black uppercase tracking-wide text-cyan-50">Pick Size In Spaces</h3>
          </div>
          <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            <span>Spaces</span>
            <input
              v-model.number="props.vehicle.spaces"
              class="h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm font-normal normal-case tracking-normal text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
              min="1"
              step="1"
              type="number"
            >
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
            <h4 class="text-3xl font-black uppercase leading-none tracking-wide text-cyan-50">{{ currentSize.label }} {{ familyRule.typeLabel }}</h4>
            <p class="mt-3 max-w-xl text-sm leading-5 text-zinc-300">
              A usable Space is one quarter of a spacecraft ton. This size sets the vehicle scale, target profile, shipping burden, structure baseline, and the pool later spent on armour, systems, crew, cargo, and weapons. The reference chart is tailored to the selected vehicle type.
            </p>
          </div>

          <svg class="pointer-events-none absolute inset-x-8 bottom-8 z-0 h-56 w-[calc(100%-4rem)] text-cyan-100/55 drop-shadow-[0_0_22px_rgba(103,232,249,0.22)]" viewBox="0 0 360 190" role="img" aria-label="Vehicle silhouette">
            <g fill="currentColor">
              <g v-if="visualKind === 'walker'">
                <rect x="126" y="38" width="112" height="58" rx="10" />
                <rect x="148" y="92" width="22" height="42" rx="6" />
                <rect x="198" y="92" width="22" height="42" rx="6" />
                <rect x="132" y="132" width="48" height="12" rx="6" />
                <rect x="188" y="132" width="48" height="12" rx="6" />
                <rect x="232" y="55" width="46" height="14" rx="7" />
              </g>
              <g v-else-if="visualKind === 'ground-vehicle'">
                <path d="M62 104h34l22-34h122l44 34h32v24H62z" />
                <circle cx="118" cy="137" r="18" />
                <circle cx="260" cy="137" r="18" />
              </g>
              <g v-else-if="visualKind === 'aeroplane'">
                <path d="M38 96h284l-40 22H188l-42 42h-36l24-42H72z" />
                <path d="M154 34h44l44 62H98z" />
              </g>
              <g v-else-if="visualKind === 'airship'">
                <ellipse cx="180" cy="78" rx="138" ry="44" />
                <rect x="132" y="114" width="96" height="24" rx="6" />
                <path d="M286 62l40-28v88z" />
              </g>
              <g v-else-if="visualKind === 'grav-vehicle'">
                <path d="M74 78h190l42 34-38 28H96l-42-32z" />
                <ellipse cx="124" cy="152" rx="54" ry="8" />
                <ellipse cx="238" cy="152" rx="54" ry="8" />
              </g>
              <g v-else-if="visualKind === 'hovercraft'">
                <path d="M58 84h226l42 34-34 26H82l-48-32z" />
                <rect x="78" y="126" width="210" height="22" rx="11" />
              </g>
              <g v-else-if="visualKind === 'rotorcraft'">
                <rect x="124" y="78" width="116" height="44" rx="18" />
                <rect x="96" y="50" width="168" height="8" rx="4" />
                <rect x="176" y="28" width="8" height="52" rx="4" />
                <path d="M238 90h58l28 18h-86z" />
                <rect x="138" y="128" width="84" height="8" rx="4" />
              </g>
              <g v-else-if="visualKind === 'structure'">
                <path d="M142 34h76l18 124H124z" />
                <rect x="112" y="158" width="136" height="12" rx="3" />
                <rect x="156" y="58" width="48" height="12" rx="2" fill="#020617" opacity="0.55" />
                <rect x="150" y="88" width="60" height="12" rx="2" fill="#020617" opacity="0.55" />
              </g>
              <g v-else>
                <path d="M48 108h232c-18 30-54 46-108 46s-96-16-124-46z" />
                <path d="M130 72h86l54 36H76z" />
              </g>
            </g>
          </svg>
        </div>

        <div class="grid min-h-[35.75rem] content-start gap-5">
          <div class="grid content-start gap-px">
            <div class="grid grid-cols-[5.5rem_7.5rem_minmax(0,1fr)] text-xs font-black uppercase tracking-wide text-cyan-100">
              <div class="bg-cyan-400/20 px-2 py-2">Spaces</div>
              <div class="bg-cyan-400/20 px-2 py-2">Size</div>
              <div class="bg-cyan-400/20 px-2 py-2">Examples</div>
            </div>
            <div
              v-for="row in sizeRows"
              :key="row.key"
              class="grid grid-cols-[5.5rem_7.5rem_minmax(0,1fr)] border-b border-cyan-400/25 text-sm"
              :class="row === currentRow ? 'bg-amber-300/10 text-amber-100' : 'text-zinc-200'"
            >
              <div class="border-r border-cyan-400/25 px-2 py-1">{{ formatSpacesRange(row.minSpaces, row.maxSpaces) }}</div>
              <div class="border-r border-cyan-400/25 px-2 py-1 font-semibold capitalize">{{ row.form }}</div>
              <div class="px-2 py-1 leading-5">{{ row.example }}</div>
            </div>
          </div>

          <div class="grid gap-2 rounded-md border border-cyan-400/20 bg-slate-950/35 p-3 text-sm">
            <div class="grid grid-cols-[8rem_minmax(0,1fr)] gap-px">
              <template v-for="row in sizeEffects" :key="row.label">
                <div class="bg-cyan-400/20 px-2 py-1 font-black uppercase tracking-wide text-cyan-100">{{ row.label }}</div>
                <div class="border-b border-cyan-400/25 px-2 py-1 text-zinc-200">{{ row.value }}</div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
