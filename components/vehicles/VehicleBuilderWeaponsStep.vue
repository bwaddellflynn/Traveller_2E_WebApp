<script setup lang="ts">
import VehicleBuilderWeaponListEditor from '~/components/vehicles/VehicleBuilderWeaponListEditor.vue'
import type { CustomVehicleDesign } from '~/types/vehicle'
import type { VehicleBuilderStockWeaponOption } from '~/utils/traveller/vehicles'

defineProps<{
  vehicle: CustomVehicleDesign
  stockWeaponLibrary: VehicleBuilderStockWeaponOption[]
}>()

defineEmits<{
  (event: 'add-weapon'): void
  (event: 'add-stock-weapon', stockWeaponId: string): void
  (event: 'remove-weapon', index: number): void
}>()
</script>

<template>
  <!-- Weapons are kept separate so combat-system configuration has its own pass. -->
  <div class="grid gap-4">
    <section class="rounded-md border border-cyan-400/20 bg-slate-950/30 p-4">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h3 class="text-sm font-semibold text-cyan-50">Weapons</h3>
          <p class="mt-2 text-xs leading-5 text-zinc-400">
            Add mounted weapons after the frame, protection, systems, occupants, and cargo are settled.
          </p>
        </div>
        <span class="text-xs text-cyan-100/60">{{ vehicle.weapons.length }} mounted</span>
      </div>
    </section>

    <VehicleBuilderWeaponListEditor
      :weapons="vehicle.weapons"
      :stock-weapons="stockWeaponLibrary"
      @add="$emit('add-weapon')"
      @add-stock="$emit('add-stock-weapon', $event)"
      @remove="$emit('remove-weapon', $event)"
    />
  </div>
</template>
