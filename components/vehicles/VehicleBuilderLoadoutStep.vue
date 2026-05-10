<script setup lang="ts">
import VehicleBuilderEquipmentListEditor from '~/components/vehicles/VehicleBuilderEquipmentListEditor.vue'
import VehicleBuilderWeaponListEditor from '~/components/vehicles/VehicleBuilderWeaponListEditor.vue'
import type { CustomVehicleDesign } from '~/types/vehicle'

defineProps<{
  vehicle: CustomVehicleDesign
  allowedFeatures: string[]
  equipmentSuggestions: string[]
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
  (event: 'remove-weapon', index: number): void
}>()
</script>

<template>
  <!-- Systems, equipment, and mounted weapons are grouped after chassis and protection are locked in. -->
  <div class="grid gap-4">
    <section class="rounded-md border border-cyan-400/20 bg-slate-950/30 p-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 class="text-sm font-semibold text-cyan-50">Space Summary</h3>
          <p class="mt-2 text-xs leading-5 text-zinc-400">
            Use this step for features, internal equipment, and mounted weapons. The current builder tracks baseline available spaces and auxiliary-drive consumption here.
          </p>
          <p class="mt-2 text-xs leading-5 text-zinc-500">
            Feature space costs are not encoded yet, so the current allocation summary counts armour, equipment, and mounted weapon spaces but not feature-specific occupancy.
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
        <h3 class="text-sm font-semibold text-cyan-50">Features</h3>
        <span class="text-xs text-cyan-100/60">{{ vehicle.features.length }} selected</span>
      </div>
      <p class="mt-2 text-xs text-zinc-400">This list is limited to features allowed by the current handbook base vehicle type. Selected features feed the derived trait line and any automated agility or speed modifiers.</p>
      <div class="mt-3 flex flex-wrap gap-2">
        <button
          v-for="feature in allowedFeatures"
          :key="feature"
          class="rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition"
          :class="vehicle.features.includes(feature) ? 'border-cyan-300/70 bg-cyan-300/15 text-cyan-50' : 'border-cyan-400/20 bg-slate-950/20 text-zinc-300 hover:border-cyan-300/50 hover:text-cyan-50'"
          type="button"
          @click="$emit('toggle-feature', feature)"
        >
          {{ feature }}
        </button>
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
      :suggestions="equipmentSuggestions"
      @add="$emit('add-equipment')"
      @remove="$emit('remove-equipment', $event)"
    />

    <VehicleBuilderWeaponListEditor
      :weapons="vehicle.weapons"
      @add="$emit('add-weapon')"
      @remove="$emit('remove-weapon', $event)"
    />
  </div>
</template>
