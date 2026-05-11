<script setup lang="ts">
import VehicleBuilderWeaponListEditor from '~/components/vehicles/VehicleBuilderWeaponListEditor.vue'
import type { CustomVehicleDesign } from '~/types/vehicle'
import type { VehicleBuilderStockWeaponOption } from '~/utils/traveller/vehicles'

defineProps<{
  vehicle: CustomVehicleDesign
  stockWeaponLibrary: VehicleBuilderStockWeaponOption[]
  availableSpaces: number
  allocatedSpaces: number
  remainingSpaces: number
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
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 class="text-sm font-semibold text-cyan-50">Mounted Weapons</h3>
          <p class="mt-2 text-xs leading-5 text-zinc-400">
            Use this step for mounted weapons only. Mount expansion, linked weapons, and deeper fire-control rules can layer in later, but weapon spaces are already counted against the current vehicle budget.
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
        </div>
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
