<script setup lang="ts">
import type { CustomVehicleDesign } from '~/types/vehicle'
import type { VehicleBuilderCoreOptionFamily } from '~/utils/traveller/vehicles'

const props = defineProps<{
  vehicle: CustomVehicleDesign
  families: VehicleBuilderCoreOptionFamily[]
}>()

const selectedValueForFamily = (family: VehicleBuilderCoreOptionFamily) => {
  const familyNames = new Set(family.options.map((option) => option.name))
  return props.vehicle.equipmentEntries.find((entry) => familyNames.has(entry.name))?.name ?? ''
}

const updateFamilySelection = (family: VehicleBuilderCoreOptionFamily, selectedName: string) => {
  const familyNames = new Set(family.options.map((option) => option.name))
  const existingIndex = props.vehicle.equipmentEntries.findIndex((entry) => familyNames.has(entry.name))

  if (!selectedName) {
    if (existingIndex >= 0) props.vehicle.equipmentEntries.splice(existingIndex, 1)
    return
  }

  if (existingIndex >= 0) {
    props.vehicle.equipmentEntries[existingIndex].name = selectedName
    props.vehicle.equipmentEntries[existingIndex].category = family.category
    props.vehicle.equipmentEntries[existingIndex].catalogueId = ''
    return
  }

  props.vehicle.equipmentEntries.push({
    name: selectedName,
    spaces: 0,
    category: family.category,
    catalogueId: '',
  })
}
</script>

<template>
  <section class="rounded-md border border-cyan-400/20 bg-slate-950/30 p-4">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 class="text-sm font-semibold text-cyan-50">Core Options</h3>
        <p class="mt-2 text-xs leading-5 text-zinc-400">
          Choose the main operating systems for the vehicle. Any selected system is added to the installed options list.
        </p>
      </div>
    </div>

    <div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <label
        v-for="family in families"
        :key="family.id"
        class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500"
      >
        <span>{{ family.label }}</span>
        <select
          :value="selectedValueForFamily(family)"
          class="h-11 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
          @change="updateFamilySelection(family, ($event.target as HTMLSelectElement).value)"
        >
          <option value="">None</option>
          <option v-for="option in family.options" :key="option.id" :value="option.name">{{ option.label }}</option>
        </select>
        <span class="text-[11px] font-normal normal-case tracking-normal text-zinc-400">
          {{ family.description }}
        </span>
      </label>
    </div>
  </section>
</template>
