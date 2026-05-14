<script setup lang="ts">
import VehicleBuilderEquipmentListEditor from '~/components/vehicles/VehicleBuilderEquipmentListEditor.vue'
import type { CustomVehicleDesign } from '~/types/vehicle'
import type { VehicleBuilderEquipmentCategoryGroup } from '~/utils/traveller/vehicles'

defineProps<{
  vehicle: CustomVehicleDesign
  equipmentLibrary: VehicleBuilderEquipmentCategoryGroup[]
}>()

defineEmits<{
  (event: 'add-equipment', catalogueId?: string): void
  (event: 'remove-equipment', index: number): void
}>()
</script>

<template>
  <div class="grid gap-4">
    <section class="rounded-md border border-cyan-400/20 bg-slate-950/30 p-4">
      <h3 class="text-sm font-semibold text-cyan-50">Installed Options</h3>
      <p class="mt-2 text-xs leading-5 text-zinc-400">
        Add vehicle systems, fittings, and mission equipment. Use the Spaces field for anything that occupies internal capacity.
      </p>
    </section>

    <VehicleBuilderEquipmentListEditor
      :items="vehicle.equipmentEntries"
      :library="equipmentLibrary"
      @add="$emit('add-equipment', $event)"
      @remove="$emit('remove-equipment', $event)"
    />
  </div>
</template>
