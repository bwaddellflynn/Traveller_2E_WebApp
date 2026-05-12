<script setup lang="ts">
import type { CustomVehicleDesign } from '~/types/vehicle'
import { vehicleFeatureRuleText } from '~/utils/traveller/vehicles'

const props = defineProps<{
  vehicle: CustomVehicleDesign
  allowedFeatures: string[]
}>()

defineEmits<{
  (event: 'toggle-feature', value: string): void
}>()

const featureHelpText = (feature: string) => (
  vehicleFeatureRuleText[feature]
  ?? 'This feature is allowed for the current handbook vehicle family. Detailed rule treatment may still be expanded in a later pass.'
)
</script>

<template>
  <div class="grid gap-4">
    <section class="rounded-md border border-cyan-400/20 bg-slate-950/30 p-4">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h3 class="text-sm font-semibold text-cyan-50">Features</h3>
          <p class="mt-2 text-xs leading-5 text-zinc-400">
            Choose inherent vehicle features here. These are configuration-defining traits from the handbook, not later-installed options. Locomotion-shaping choices such as Tracks, Rail Rider, and Tunneller belong here before customisation and armour.
          </p>
        </div>
        <span class="text-xs text-cyan-100/60">{{ vehicle.features.length }} selected</span>
      </div>
      <p class="mt-2 text-xs text-cyan-100/60">Hover a feature for its current rule context. Click a highlighted feature again to remove it.</p>
      <div class="mt-3 flex flex-wrap gap-2">
        <div
          v-for="feature in allowedFeatures"
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
            </div>
          </div>
        </div>
      </div>
      <div v-if="vehicle.traits.length" class="mt-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-zinc-500">Derived Traits</p>
        <div class="mt-2 flex flex-wrap gap-2">
          <span
            v-for="trait in vehicle.traits"
            :key="trait"
            class="inline-flex items-center rounded-md border border-cyan-300/25 bg-cyan-300/10 px-2 py-1 text-xs text-cyan-100"
          >
            {{ trait }}
          </span>
        </div>
      </div>
    </section>
  </div>
</template>
