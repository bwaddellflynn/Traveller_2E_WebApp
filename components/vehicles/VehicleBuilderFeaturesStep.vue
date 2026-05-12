<script setup lang="ts">
import { computed } from 'vue'
import type { CustomVehicleDesign } from '~/types/vehicle'
import {
  vehicleFeatureMechanicalEffects,
  vehicleFeatureRuleText,
} from '~/utils/traveller/vehicles'

const props = defineProps<{
  vehicle: CustomVehicleDesign
  allowedFeatures: string[]
}>()

defineEmits<{
  (event: 'toggle-feature', value: string): void
}>()

type FeatureGroupId =
  | 'locomotion'
  | 'handling'
  | 'exposure'
  | 'water'
  | 'air'
  | 'speed-regime'
  | 'structure'

const featureGroupMeta: Record<FeatureGroupId, { label: string, description: string }> = {
  locomotion: {
    label: 'Locomotion',
    description: 'Choices that change how the chassis fundamentally moves or what surface it is built to use.',
  },
  handling: {
    label: 'Handling & Terrain',
    description: 'Mobility refinements and rough-terrain behavior traits.',
  },
  exposure: {
    label: 'Exposure & Armour',
    description: 'Open-frame and combat-survivability traits that interact with later protection decisions.',
  },
  water: {
    label: 'Water & Buoyancy',
    description: 'Water-operation and buoyancy-related configuration traits.',
  },
  air: {
    label: 'Airframe & Lift',
    description: 'Flight-body, lift, and wing-system configuration traits.',
  },
  'speed-regime': {
    label: 'Speed Regime',
    description: 'High-speed and drag-related shaping traits.',
  },
  structure: {
    label: 'Structural Form',
    description: 'Body-plan and frame-form traits that change what the vehicle physically is.',
  },
}

const featureGroupFor = (feature: string): FeatureGroupId => {
  switch (feature) {
    case 'Tracks':
    case 'Rail Rider':
    case 'Tunneller':
      return 'locomotion'
    case 'Agile':
    case 'ATV':
    case 'Fast':
    case 'Off-Roader':
    case 'Slow':
    case 'Smart Wheels':
      return 'handling'
    case 'AFV':
    case 'Open Frame':
    case 'Open-Topped':
      return 'exposure'
    case 'Floats':
    case 'Hydrofoil':
      return 'water'
    case 'Aerodyne':
    case 'Folding Wings':
    case 'Jet Engines':
    case 'Ornithopter':
    case 'STOL':
    case 'Tilt Engines':
      return 'air'
    case 'Hypersonic':
    case 'Streamlined':
    case 'Supersonic':
      return 'speed-regime'
    default:
      return 'structure'
  }
}

const featureHelpText = (feature: string) => (
  vehicleFeatureRuleText[feature]
  ?? 'This feature is allowed for the current handbook vehicle family. Detailed rule treatment may still be expanded in a later pass.'
)

const groupedFeatures = computed(() => {
  const grouped = new Map<FeatureGroupId, string[]>()

  for (const feature of props.allowedFeatures) {
    const groupId = featureGroupFor(feature)
    const existing = grouped.get(groupId) ?? []
    existing.push(feature)
    grouped.set(groupId, existing)
  }

  return (Object.keys(featureGroupMeta) as FeatureGroupId[])
    .map((groupId) => ({
      id: groupId,
      ...featureGroupMeta[groupId],
      features: (grouped.get(groupId) ?? []).sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' })),
    }))
    .filter((group) => group.features.length > 0)
})

const selectedFeatureEffects = computed(() => (
  props.vehicle.features.map((feature) => ({
    feature,
    effects: vehicleFeatureMechanicalEffects(feature, { familyId: props.vehicle.baseFamily, techLevel: props.vehicle.techLevel }),
  }))
))

const locomotionSummary = computed(() => {
  if (props.vehicle.features.includes('Tunneller')) return 'Subsurface tunneller'
  if (props.vehicle.features.includes('Tracks')) return 'Tracked chassis'
  if (props.vehicle.features.includes('Rail Rider')) return 'Rail-bound chassis'
  if (props.vehicle.features.includes('Hydrofoil')) return 'Hydrofoil-capable hull'
  return 'Baseline chassis locomotion'
})

</script>

<template>
  <div class="grid gap-4">
    <section class="rounded-md border border-cyan-400/20 bg-slate-950/30 p-4">
      <div class="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.9fr)]">
        <div class="grid gap-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="text-sm font-semibold text-cyan-50">Features</h3>
              <p class="mt-2 text-xs leading-5 text-zinc-400">
                Choose the chassis-defining feature set here before customisation and armour. This is where locomotion-changing decisions belong, not later options.
              </p>
            </div>
            <span class="text-xs text-cyan-100/60">{{ vehicle.features.length }} selected</span>
          </div>

          <div class="grid gap-3">
            <section class="rounded-md border border-cyan-400/20 bg-slate-950/35 p-3">
              <p class="text-xs font-semibold uppercase tracking-wide text-cyan-100/80">Current Configuration</p>
              <div class="mt-3 grid gap-3 md:grid-cols-2">
                <div class="rounded-md border border-cyan-400/15 bg-slate-950/40 p-3">
                  <p class="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Operating Skill</p>
                  <p class="mt-2 text-sm font-semibold text-cyan-50">{{ vehicle.skill || 'Unassigned' }}</p>
                </div>
                <div class="rounded-md border border-cyan-400/15 bg-slate-950/40 p-3">
                  <p class="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Locomotion Profile</p>
                  <p class="mt-2 text-sm font-semibold text-cyan-50">{{ locomotionSummary }}</p>
                </div>
              </div>
            </section>
          </div>

          <div class="grid gap-4">
            <section
              v-for="group in groupedFeatures"
              :key="group.id"
              class="rounded-md border border-cyan-400/20 bg-slate-950/25 p-3"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wide text-cyan-100/80">{{ group.label }}</p>
                  <p class="mt-1 text-xs leading-5 text-zinc-400">{{ group.description }}</p>
                </div>
                <span class="text-[11px] text-cyan-100/50">{{ group.features.length }} options</span>
              </div>

              <div class="mt-3 flex flex-wrap gap-2">
                <div
                  v-for="feature in group.features"
                  :key="feature"
                  class="group relative"
                >
                  <button
                    class="rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition"
                    :class="vehicle.features.includes(feature) ? 'border-amber-300/70 bg-amber-300/15 text-amber-100 shadow-[0_0_18px_rgba(251,191,36,0.18)] hover:border-amber-200 hover:bg-amber-300/20' : 'border-cyan-400/20 bg-slate-950/20 text-zinc-300 hover:border-cyan-300/50 hover:text-cyan-50'"
                    type="button"
                    @click="$emit('toggle-feature', feature)"
                  >
                    <span class="inline-flex items-center gap-2">
                      <span>{{ feature }}</span>
                      <span v-if="vehicle.features.includes(feature)" class="text-[10px] font-bold leading-none text-amber-200/90">×</span>
                    </span>
                  </button>
                  <div class="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-72 -translate-x-1/2 opacity-0 transition duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                    <div class="rounded-md border border-cyan-300/35 bg-slate-950/95 px-3 py-3 shadow-[0_0_24px_rgba(34,211,238,0.18)] backdrop-blur-sm">
                      <p class="text-[11px] font-semibold uppercase tracking-wide text-cyan-100">{{ feature }}</p>
                      <p class="mt-2 text-xs leading-5 text-zinc-300">
                        {{ featureHelpText(feature) }}
                      </p>
                      <ul class="mt-2 grid gap-1 text-[11px] leading-5 text-cyan-100/80">
                        <li
                          v-for="effect in vehicleFeatureMechanicalEffects(feature, { familyId: vehicle.baseFamily, techLevel: vehicle.techLevel })"
                          :key="`${feature}-tooltip-${effect}`"
                        >
                          {{ effect }}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div class="grid gap-3">
          <section class="rounded-md border border-cyan-400/20 bg-slate-950/40 p-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-cyan-100/80">Selected Feature Effects</p>
            <div v-if="selectedFeatureEffects.length" class="mt-3 grid gap-3">
              <div
                v-for="entry in selectedFeatureEffects"
                :key="`${entry.feature}-effects`"
                class="rounded-md border border-cyan-400/15 bg-slate-950/35 p-3"
              >
                <div class="flex items-center justify-between gap-3">
                  <p class="text-sm font-semibold text-cyan-50">{{ entry.feature }}</p>
                </div>
                <ul class="mt-2 grid gap-1 text-xs leading-5 text-zinc-300">
                  <li v-for="effect in entry.effects" :key="`${entry.feature}-${effect}`">
                    {{ effect }}
                  </li>
                </ul>
              </div>
            </div>
            <p v-else class="mt-3 rounded-md border border-cyan-400/15 bg-slate-950/35 p-3 text-sm text-zinc-400">
              No features selected yet.
            </p>
          </section>
        </div>
      </div>
    </section>
  </div>
</template>
