<script setup lang="ts">
import VehicleBuilderCoreOptionsPanel from '~/components/vehicles/VehicleBuilderCoreOptionsPanel.vue'
import type { CustomVehicleDesign } from '~/types/vehicle'
import type { VehicleBuilderCoreOptionFamily } from '~/utils/traveller/vehicles'

defineProps<{
  vehicle: CustomVehicleDesign
  coreOptionFamilies: VehicleBuilderCoreOptionFamily[]
}>()
</script>

<template>
  <div class="grid gap-4">
    <section class="rounded-md border border-cyan-400/20 bg-slate-950/30 p-4">
      <h3 class="text-sm font-semibold text-cyan-50">Automation</h3>
      <p class="mt-2 text-xs leading-5 text-zinc-400">
        Choose control, navigation, sensor, communication, and assisted-operation systems before final weapons and review.
      </p>
    </section>

    <VehicleBuilderCoreOptionsPanel
      :vehicle="vehicle"
      :families="coreOptionFamilies"
    />
  </div>
</template>
