<script setup lang="ts">
import VehicleBuilderCoreOptionsPanel from '~/components/vehicles/VehicleBuilderCoreOptionsPanel.vue'
import VehicleBuilderEquipmentListEditor from '~/components/vehicles/VehicleBuilderEquipmentListEditor.vue'
import type { CustomVehicleDesign } from '~/types/vehicle'
import type { VehicleBuilderCoreOptionFamily, VehicleBuilderEquipmentCategoryGroup } from '~/utils/traveller/vehicles'

const props = defineProps<{
  vehicle: CustomVehicleDesign
  comfortLevels: string[]
  coreOptionFamilies: VehicleBuilderCoreOptionFamily[]
  equipmentLibrary: VehicleBuilderEquipmentCategoryGroup[]
}>()

defineEmits<{
  (event: 'add-equipment'): void
  (event: 'remove-equipment', index: number): void
}>()
</script>

<template>
  <!-- Options groups occupancy assumptions and later-installed non-weapon systems. -->
  <div class="grid gap-4">
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

    <VehicleBuilderCoreOptionsPanel
      :vehicle="vehicle"
      :families="coreOptionFamilies"
    />

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
