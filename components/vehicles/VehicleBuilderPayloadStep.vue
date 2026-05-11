<script setup lang="ts">
import VehicleBuilderEquipmentListEditor from '~/components/vehicles/VehicleBuilderEquipmentListEditor.vue'
import type { CustomVehicleDesign } from '~/types/vehicle'
import type { VehicleBuilderEquipmentCategoryGroup } from '~/utils/traveller/vehicles'
import { vehicleFeatureRuleText } from '~/utils/traveller/vehicles'

const props = defineProps<{
  vehicle: CustomVehicleDesign
  comfortLevels: string[]
  allowedFeatures: string[]
  equipmentLibrary: VehicleBuilderEquipmentCategoryGroup[]
  availableSpaces: number
  auxiliarySpaces: number
  allocatedSpaces: number
  remainingSpaces: number
}>()

defineEmits<{
  (event: 'toggle-feature', value: string): void
  (event: 'add-equipment'): void
  (event: 'remove-equipment', index: number): void
}>()

const featureHelpText = (feature: string) => (
  vehicleFeatureRuleText[feature]
  ?? 'This feature is allowed for the current handbook vehicle family. Detailed option-space and cost treatment may still be expanded in a later pass.'
)
</script>

<template>
  <!-- Payload groups occupancy, features, and non-weapon system allocation. -->
  <div class="grid gap-4">
    <section class="rounded-md border border-cyan-400/20 bg-slate-950/30 p-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 class="text-sm font-semibold text-cyan-50">Payload Space</h3>
          <p class="mt-2 text-xs leading-5 text-zinc-400">
            Use this step for occupancy assumptions, carried systems, and non-weapon payload. The running space summary shows how much capacity the current chassis still has available.
          </p>
        </div>
        <div class="grid gap-2 text-right text-sm">
          <div class="rounded-md border border-cyan-400/20 bg-slate-950/40 px-3 py-2">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Available Spaces</p>
            <p class="mt-1 font-semibold text-cyan-50">{{ availableSpaces }}</p>
          </div>
          <div class="rounded-md border border-cyan-400/20 bg-slate-950/40 px-3 py-2">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Allocated Spaces</p>
            <p class="mt-1 font-semibold text-cyan-50">{{ allocatedSpaces }}</p>
          </div>
          <div class="rounded-md border border-cyan-400/20 bg-slate-950/40 px-3 py-2">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Remaining Spaces</p>
            <p class="mt-1 font-semibold" :class="remainingSpaces < 0 ? 'text-amber-200' : 'text-cyan-50'">{{ remainingSpaces }}</p>
          </div>
          <div class="rounded-md border border-cyan-400/20 bg-slate-950/40 px-3 py-2">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Auxiliary Allocation</p>
            <p class="mt-1 font-semibold text-cyan-50">{{ auxiliarySpaces }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="rounded-md border border-cyan-400/20 bg-slate-950/30 p-4">
      <h3 class="text-sm font-semibold text-cyan-50">Occupancy</h3>
      <div class="mt-3 grid gap-4 md:grid-cols-2">
        <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>Crew</span>
          <input v-model="vehicle.crew" class="h-11 rounded-md border border-zinc-300 px-3 text-sm font-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="1">
        </label>
        <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>Passengers</span>
          <input v-model="vehicle.passengers" class="h-11 rounded-md border border-zinc-300 px-3 text-sm font-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="4">
        </label>
        <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>Comfort</span>
          <input v-model="vehicle.comfortLevel" list="vehicle-builder-comfort-payload" class="h-11 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="Comfort level">
        </label>
        <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>Cargo</span>
          <input v-model="vehicle.cargo" class="h-11 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="0.25 tons">
        </label>
      </div>
    </section>

    <section class="rounded-md border border-cyan-400/20 bg-slate-950/30 p-4">
      <div class="flex items-center justify-between gap-3">
        <h3 class="text-sm font-semibold text-cyan-50">Features</h3>
        <span class="text-xs text-cyan-100/60">{{ vehicle.features.length }} selected</span>
      </div>
      <p class="mt-2 text-xs text-zinc-400">This list is limited to features allowed by the current handbook base vehicle type. Selected features feed the derived trait line and any automated locomotion or agility modifiers.</p>
      <p class="mt-1 text-xs text-cyan-100/60">Hover a feature for its current rule context. Click a highlighted feature again to remove it.</p>
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

    <VehicleBuilderEquipmentListEditor
      :items="vehicle.equipmentEntries"
      :library="equipmentLibrary"
      @add="$emit('add-equipment')"
      @remove="$emit('remove-equipment', $event)"
    />

    <datalist id="vehicle-builder-comfort-payload">
      <option v-for="option in comfortLevels" :key="option" :value="option" />
    </datalist>
  </div>
</template>
