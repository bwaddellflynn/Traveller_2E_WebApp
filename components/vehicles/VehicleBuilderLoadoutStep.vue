<script setup lang="ts">
import VehicleBuilderEquipmentListEditor from '~/components/vehicles/VehicleBuilderEquipmentListEditor.vue'
import VehicleBuilderWeaponListEditor from '~/components/vehicles/VehicleBuilderWeaponListEditor.vue'
import type { CustomVehicleDesign } from '~/types/vehicle'
import type { VehicleBuilderEquipmentCategoryGroup, VehicleBuilderStockWeaponOption } from '~/utils/traveller/vehicles'
import { vehicleFeatureRuleText } from '~/utils/traveller/vehicles'

const props = defineProps<{
  vehicle: CustomVehicleDesign
  stepIssues?: string[]
  allowedFeatures: string[]
  equipmentLibrary: VehicleBuilderEquipmentCategoryGroup[]
  stockWeaponLibrary: VehicleBuilderStockWeaponOption[]
  availableSpaces: number
  auxiliarySpaces: number
  allocatedSpaces: number
  remainingSpaces: number
}>()

defineEmits<{
  (event: 'toggle-feature', value: string): void
  (event: 'add-equipment'): void
  (event: 'remove-equipment', index: number): void
  (event: 'add-weapon'): void
  (event: 'add-stock-weapon', stockWeaponId: string): void
  (event: 'remove-weapon', index: number): void
}>()

const featureHelpText = (feature: string) => (
  vehicleFeatureRuleText[feature]
  ?? 'This feature is available for the current vehicle type.'
)
</script>

<template>
  <!-- Systems, equipment, and mounted weapons are grouped after chassis and protection are locked in. -->
  <div class="grid gap-4">
    <section v-if="props.stepIssues?.length" class="rounded-md border border-amber-300/30 bg-amber-300/10 p-4">
      <p class="text-[11px] font-semibold uppercase tracking-wide text-amber-200">Still Required In This Step</p>
      <ul class="mt-3 grid gap-2">
        <li v-for="issue in props.stepIssues" :key="issue" class="text-sm text-amber-100">
          {{ issue }}
        </li>
      </ul>
    </section>

    <section class="rounded-md border border-cyan-400/20 bg-slate-950/30 p-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 class="text-sm font-semibold text-cyan-50">Space Summary</h3>
          <p class="mt-2 text-xs leading-5 text-zinc-400">
            Review available and reserved Spaces before adding more systems.
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 class="text-sm font-semibold text-cyan-50">Space Summary</h3>
          <p class="mt-2 text-xs leading-5 text-zinc-400">
            Add systems in this order: features first, then equipment, then mounted weapons. Watch the remaining spaces as you go.
          </p>
        </div>
        <div class="grid gap-2 text-right text-sm">
          <div class="rounded-md border border-cyan-400/20 bg-slate-950/40 px-3 py-2">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Available Spaces</p>
            <p class="mt-1 font-semibold text-cyan-50">{{ availableSpaces }}</p>
          </div>
          <div class="rounded-md border border-cyan-400/20 bg-slate-950/40 px-3 py-2">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Allocated Systems</p>
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
      <div class="flex items-center justify-between gap-3">
        <h3 class="text-sm font-semibold text-cyan-50">Choose Features</h3>
        <span class="text-xs text-cyan-100/60">{{ vehicle.features.length }} selected</span>
      </div>
      <p class="mt-2 text-xs text-zinc-400">This list is limited to features allowed by the current handbook base vehicle type. Selected features feed the derived trait line and any automated agility or speed modifiers.</p>
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

    <VehicleBuilderWeaponListEditor
      :weapons="vehicle.weapons"
      :stock-weapons="stockWeaponLibrary"
      @add="$emit('add-weapon')"
      @add-stock="$emit('add-stock-weapon', $event)"
      @remove="$emit('remove-weapon', $event)"
    />
  </div>
</template>
