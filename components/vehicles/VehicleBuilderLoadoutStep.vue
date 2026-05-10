<script setup lang="ts">
import VehicleBuilderStringListEditor from '~/components/vehicles/VehicleBuilderStringListEditor.vue'
import VehicleBuilderWeaponListEditor from '~/components/vehicles/VehicleBuilderWeaponListEditor.vue'
import type { CustomVehicleDesign } from '~/types/vehicle'

defineProps<{
  vehicle: CustomVehicleDesign
  allowedFeatures: string[]
  equipmentSuggestions: string[]
}>()

defineEmits<{
  (event: 'toggle-feature', value: string): void
  (event: 'add-equipment', value: string): void
  (event: 'remove-equipment', index: number): void
  (event: 'add-weapon'): void
  (event: 'remove-weapon', index: number): void
}>()
</script>

<template>
  <!-- Armour and payload editing for the builder. -->
  <div class="grid gap-4">
    <section class="rounded-md border border-cyan-400/20 bg-slate-950/30 p-4">
      <h3 class="text-sm font-semibold text-cyan-50">Armour</h3>
      <div class="mt-3 grid gap-3 md:grid-cols-3">
        <label v-for="facing in ['forward', 'port', 'dorsal', 'aft', 'starboard', 'ventral']" :key="facing" class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>{{ facing }}</span>
          <input v-model="vehicle.armour[facing]" class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="Armour value">
        </label>
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

    <VehicleBuilderStringListEditor
      title="Equipment"
      :items="vehicle.equipment"
      :suggestions="equipmentSuggestions"
      add-label="Add equipment"
      @add="$emit('add-equipment', $event)"
      @remove="$emit('remove-equipment', $event)"
    />

    <VehicleBuilderWeaponListEditor
      :weapons="vehicle.weapons"
      @add="$emit('add-weapon')"
      @remove="$emit('remove-weapon', $event)"
    />
  </div>
</template>
