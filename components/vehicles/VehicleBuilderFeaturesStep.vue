<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CustomVehicleDesign } from '~/types/vehicle'
import { vehicleFeatureRules } from '~/utils/traveller/vehicles'
import { hasVehicleSilhouetteAsset, vehicleSilhouetteImageClass, vehicleSilhouetteKindForFeature, vehicleSilhouetteSource } from '~/utils/vehicleBuilderSilhouettes'

const props = defineProps<{
  vehicle: CustomVehicleDesign
  allowedFeatures: string[]
}>()

const emit = defineEmits<{
  (event: 'toggle-feature', value: string): void
}>()

const sortedFeatures = computed(() => [...props.allowedFeatures].sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' })))
const selectedFeatureName = ref(sortedFeatures.value[0] ?? '')

watch(
  sortedFeatures,
  (features) => {
    if (!features.includes(selectedFeatureName.value)) selectedFeatureName.value = features[0] ?? ''
  },
  { immediate: true },
)

const selectedRule = computed(() => vehicleFeatureRules[selectedFeatureName.value])
const selectedFeatureAdded = computed(() => props.vehicle.features.includes(selectedFeatureName.value))
const selectedFeatureRows = computed(() => {
  const rule = selectedRule.value
  if (!rule) return []

  return [
    { label: 'Tech Level', value: String(rule.minimumTechLevel) },
    { label: 'Applies to', value: rule.appliesTo.join(', ') },
    { label: 'Effect', value: rule.effect },
    ...(rule.traits?.length ? [{ label: 'Traits', value: rule.traits.join(', ') }] : []),
    ...(rule.prerequisite ? [{ label: 'Prerequisite', value: rule.prerequisite }] : []),
    ...(rule.notCompatible?.length ? [{ label: 'Not Compatible with', value: rule.notCompatible.join(', ') }] : []),
    ...(rule.sizeLimits ? [{ label: 'Size Limits', value: rule.sizeLimits }] : []),
    ...(rule.agility ? [{ label: 'Agility', value: rule.agility }] : []),
    ...(rule.speed ? [{ label: 'Speed', value: rule.speed }] : []),
    ...(rule.range ? [{ label: 'Range', value: rule.range }] : []),
    ...(rule.shipping ? [{ label: 'Shipping', value: rule.shipping }] : []),
    ...(rule.addedCost ? [{ label: 'Added Cost', value: rule.addedCost }] : []),
  ]
})

const featureBlocker = (feature: string) => {
  const rule = vehicleFeatureRules[feature]
  if (!rule) return ''
  if (props.vehicle.techLevel < rule.minimumTechLevel) return `Requires TL ${rule.minimumTechLevel}+`
  if (rule.minimumSpaces && props.vehicle.spaces < rule.minimumSpaces) return rule.sizeLimits ?? `Requires ${rule.minimumSpaces}+ Spaces`
  const incompatible = (rule.notCompatible ?? []).find((item) => props.vehicle.features.includes(item))
  if (incompatible) return `Not compatible with ${incompatible}`
  return ''
}

const selectedFeatureBlocker = computed(() => featureBlocker(selectedFeatureName.value))
const selectedFeatureButtonLabel = computed(() => selectedFeatureAdded.value ? 'Remove Feature' : 'Add Feature')
const selectedFeatureButtonDisabled = computed(() => !selectedRule.value || (!selectedFeatureAdded.value && Boolean(selectedFeatureBlocker.value)))

const toggleSelectedFeature = () => {
  if (!selectedFeatureName.value || selectedFeatureButtonDisabled.value) return
  emit('toggle-feature', selectedFeatureName.value)
}

const featureVisualKind = computed(() => {
  const visualFeature = selectedFeatureName.value || props.vehicle.features[0] || ''
  return vehicleSilhouetteKindForFeature(visualFeature, props.vehicle.baseFamily)
})
const useSilhouetteFallback = computed(() => !hasVehicleSilhouetteAsset(featureVisualKind.value))
const silhouetteSource = computed(() => vehicleSilhouetteSource(featureVisualKind.value))
const silhouetteImageClass = computed(() => vehicleSilhouetteImageClass(featureVisualKind.value))
</script>

<template>
  <div class="grid gap-4">
    <section class="overflow-hidden rounded-md border border-cyan-400/25 bg-slate-950/45 text-cyan-50 shadow-[0_0_28px_rgba(34,211,238,0.08)]">
      <div class="vehicle-builder-step-header">
        <div class="vehicle-builder-step-header__inner">
          <div class="vehicle-builder-step-header__title">
            <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200/80">Vehicle Design Step 5</p>
            <h3 class="mt-1 text-xl font-black uppercase tracking-wide text-cyan-50">Select Features</h3>
          </div>
          <div class="vehicle-builder-step-header__controls">
            <div class="vehicle-builder-step-header__control-row sm:grid-cols-[minmax(0,1fr)_9.5rem]">
              <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                <span>Feature</span>
                <select v-model="selectedFeatureName" class="h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm font-normal normal-case tracking-normal text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
                  <option v-for="feature in sortedFeatures" :key="feature" :value="feature">{{ feature }}</option>
                </select>
              </label>
              <button
                class="h-11 rounded-md border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45"
                :class="selectedFeatureAdded ? 'border-amber-300/60 bg-amber-300/15 text-amber-100 hover:border-amber-200' : 'border-cyan-300/35 bg-cyan-300/10 text-cyan-50 hover:border-cyan-200'"
                :disabled="selectedFeatureButtonDisabled"
                type="button"
                @click="toggleSelectedFeature"
              >
                {{ selectedFeatureButtonLabel }}
              </button>
            </div>
            <p class="vehicle-builder-step-header__message">{{ selectedFeatureBlocker && !selectedFeatureAdded ? selectedFeatureBlocker : '\u00a0' }}</p>
          </div>
        </div>
      </div>

      <div class="p-4 sm:p-5">
        <section class="vehicle-builder-two-panel">
          <div class="vehicle-builder-panel-card vehicle-builder-visual-card relative flex w-full flex-col bg-slate-900/35 p-5">
            <div
              aria-hidden="true"
              class="pointer-events-none absolute inset-0 opacity-25"
              style="background-image: linear-gradient(rgba(103,232,249,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(103,232,249,0.2) 1px, transparent 1px); background-size: 22px 22px;"
            />
            <div aria-hidden="true" class="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950/95 to-transparent" />
            <div v-if="selectedRule" class="vehicle-builder-visual-copy">
              <h4 class="text-3xl font-black uppercase leading-none tracking-wide text-cyan-50">{{ selectedRule.name }}</h4>
              <p class="mt-3 max-w-xl text-sm leading-5 text-zinc-300">{{ selectedRule.description }}</p>
            </div>
            <img
              v-if="!useSilhouetteFallback"
              :src="silhouetteSource"
              alt=""
              class="vehicle-builder-visual-art pointer-events-none object-contain object-bottom opacity-95 drop-shadow-[0_0_32px_rgba(103,232,249,0.32)]"
              :class="silhouetteImageClass"
              draggable="false"
            >
            <svg v-else class="vehicle-builder-visual-art pointer-events-none text-cyan-100/55 drop-shadow-[0_0_22px_rgba(103,232,249,0.22)]" viewBox="0 0 360 190" role="img" aria-label="Feature silhouette">
              <g fill="currentColor">
                <g v-if="featureVisualKind === 'walker-multi'">
                  <rect x="118" y="42" width="124" height="54" rx="10" />
                  <rect x="126" y="92" width="18" height="42" rx="5" />
                  <rect x="160" y="92" width="18" height="42" rx="5" />
                  <rect x="196" y="92" width="18" height="42" rx="5" />
                  <rect x="230" y="92" width="18" height="42" rx="5" />
                  <rect x="110" y="132" width="48" height="12" rx="6" />
                  <rect x="152" y="132" width="48" height="12" rx="6" />
                  <rect x="194" y="132" width="48" height="12" rx="6" />
                  <rect x="236" y="132" width="48" height="12" rx="6" />
                </g>
                <g v-else-if="featureVisualKind === 'tracked' || featureVisualKind === 'tunneller'">
                  <path d="M70 92h44l24-30h112l42 30h18v26H70z" />
                  <rect x="74" y="122" width="228" height="34" rx="17" />
                  <circle cx="118" cy="139" r="9" fill="#020617" opacity="0.55" />
                  <circle cx="168" cy="139" r="9" fill="#020617" opacity="0.55" />
                  <circle cx="218" cy="139" r="9" fill="#020617" opacity="0.55" />
                  <circle cx="268" cy="139" r="9" fill="#020617" opacity="0.55" />
                  <path v-if="featureVisualKind === 'tunneller'" d="M304 88l38 18-38 18 18-18z" />
                </g>
                <g v-else-if="featureVisualKind === 'rail'">
                  <path d="M68 82h218l34 34H48z" />
                  <rect x="68" y="118" width="228" height="28" rx="8" />
                  <rect x="48" y="154" width="264" height="8" rx="4" />
                  <rect x="72" y="166" width="216" height="6" rx="3" />
                </g>
                <g v-else-if="featureVisualKind === 'monowheel'">
                  <circle cx="180" cy="104" r="68" />
                  <circle cx="180" cy="104" r="38" fill="#020617" opacity="0.55" />
                  <rect x="154" y="82" width="52" height="34" rx="10" />
                </g>
                <g v-else-if="featureVisualKind === 'hydrofoil'">
                  <path d="M54 98h244c-20 30-62 48-126 48-56 0-94-16-118-48z" />
                  <rect x="134" y="144" width="12" height="28" rx="4" />
                  <rect x="232" y="144" width="12" height="28" rx="4" />
                  <rect x="104" y="170" width="72" height="8" rx="4" />
                  <rect x="202" y="170" width="72" height="8" rx="4" />
                </g>
                <g v-else-if="featureVisualKind === 'floats'">
                  <path d="M42 84h276l-42 20H84z" />
                  <path d="M144 38h72l48 46H96z" />
                  <rect x="82" y="132" width="86" height="14" rx="7" />
                  <rect x="192" y="132" width="86" height="14" rx="7" />
                </g>
                <g v-else-if="featureVisualKind === 'aerodyne'">
                  <path d="M68 82h170l64 30-66 28H70l42-30z" />
                  <ellipse cx="110" cy="148" rx="36" ry="8" />
                  <ellipse cx="250" cy="148" rx="36" ry="8" />
                </g>
                <g v-else-if="featureVisualKind === 'ornithopter'">
                  <rect x="138" y="80" width="84" height="34" rx="16" />
                  <path d="M138 88L34 42l80 74z" />
                  <path d="M222 88l104-46-80 74z" />
                  <path d="M154 116l-52 34h156l-52-34z" />
                </g>
                <g v-else-if="featureVisualKind === 'open-frame'">
                  <path d="M80 112h192l-32 20H112z" />
                  <circle cx="126" cy="144" r="18" />
                  <circle cx="246" cy="144" r="18" />
                  <rect x="150" y="82" width="58" height="18" rx="9" />
                </g>
                <g v-else-if="featureVisualKind === 'walker'">
                  <rect x="126" y="38" width="112" height="58" rx="10" />
                  <rect x="148" y="92" width="22" height="42" rx="6" />
                  <rect x="198" y="92" width="22" height="42" rx="6" />
                  <rect x="132" y="132" width="48" height="12" rx="6" />
                  <rect x="188" y="132" width="48" height="12" rx="6" />
                </g>
                <g v-else-if="featureVisualKind === 'aeroplane'">
                  <path d="M38 96h284l-40 22H188l-42 42h-36l24-42H72z" />
                  <path d="M154 34h44l44 62H98z" />
                </g>
                <g v-else>
                  <path d="M62 104h34l22-34h122l44 34h32v24H62z" />
                  <circle cx="118" cy="137" r="18" />
                  <circle cx="260" cy="137" r="18" />
                </g>
              </g>
            </svg>
          </div>

          <div class="vehicle-builder-panel grid content-start gap-4">
            <div class="grid min-w-0 content-start gap-px overflow-hidden rounded-sm">
              <div v-for="row in selectedFeatureRows" :key="row.label" class="grid min-w-0 grid-cols-[minmax(7.5rem,10rem)_minmax(0,1fr)] items-stretch text-sm">
                <div class="bg-cyan-400/20 px-2 py-1 font-black uppercase tracking-wide text-cyan-100">{{ row.label }}</div>
                <div class="min-w-0 break-words border-b border-cyan-400/25 px-2 py-1 leading-5 text-zinc-200">{{ row.value }}</div>
              </div>
            </div>

            <div v-if="selectedRule" class="rounded-md border border-cyan-400/20 bg-slate-950/35 p-4">
              <p class="text-xs font-black uppercase tracking-wide text-cyan-100">Description</p>
              <p class="mt-2 text-sm leading-6 text-zinc-300">{{ selectedRule.description }}</p>
            </div>
          </div>
        </section>
      </div>
    </section>
  </div>
</template>
