<script setup lang="ts">
import type { CustomVehicleDesign } from '~/types/vehicle'
import { vehicleConstructionSummary, vehicleFamilyRule, vehiclePrimaryPowerOptions, vehicleAuxiliaryDriveOptions, vehicleSizeBandForSpaces } from '~/utils/traveller/vehicles'

const props = defineProps<{
  vehicle: CustomVehicleDesign
  validationIssues: string[]
}>()

const primaryPowerLabels = Object.fromEntries(vehiclePrimaryPowerOptions().map((option) => [option.id, option.label]))
const auxiliaryDriveLabels = Object.fromEntries(vehicleAuxiliaryDriveOptions().map((option) => [option.id, option.label]))
</script>

<template>
  <!-- Final review and validation summary before saving. -->
  <div class="grid gap-4">
    <section class="rounded-md border border-cyan-400/20 bg-slate-950/30 p-4">
      <h3 class="text-sm font-semibold text-cyan-50">Validation</h3>
      <ul v-if="props.validationIssues.length" class="mt-3 grid gap-2">
        <li v-for="issue in props.validationIssues" :key="issue" class="rounded-md border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">
          {{ issue }}
        </li>
      </ul>
      <p v-else class="mt-3 rounded-md border border-emerald-300/30 bg-emerald-300/10 px-3 py-2 text-sm text-emerald-100">
        Vehicle build is valid and ready to save.
      </p>
    </section>

    <section class="rounded-md border border-cyan-400/20 bg-slate-950/30 p-4">
      <div class="grid gap-3 md:grid-cols-2">
        <div><span class="text-xs uppercase tracking-wide text-zinc-400">Vehicle</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ props.vehicle.name || 'Unnamed Vehicle' }}</p></div>
        <div><span class="text-xs uppercase tracking-wide text-zinc-400">Base Type</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ vehicleFamilyRule(props.vehicle.baseFamily).label }}</p></div>
        <div><span class="text-xs uppercase tracking-wide text-zinc-400">Category</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ props.vehicle.category }}</p></div>
        <div><span class="text-xs uppercase tracking-wide text-zinc-400">Type</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ props.vehicle.type || '-' }}</p></div>
        <div><span class="text-xs uppercase tracking-wide text-zinc-400">TL / Spaces</span><p class="mt-1 text-base font-semibold text-cyan-50">TL {{ props.vehicle.techLevel }} / {{ props.vehicle.spaces }}</p></div>
        <div><span class="text-xs uppercase tracking-wide text-zinc-400">Usable Spaces</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ vehicleConstructionSummary(props.vehicle).availableSpaces }}</p></div>
        <div><span class="text-xs uppercase tracking-wide text-zinc-400">Size / Hit DM</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ vehicleSizeBandForSpaces(props.vehicle.spaces).label }} / {{ vehicleSizeBandForSpaces(props.vehicle.spaces).hitDm }}</p></div>
        <div><span class="text-xs uppercase tracking-wide text-zinc-400">Speed</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ props.vehicle.speed || '-' }} / {{ props.vehicle.cruiseSpeed || '-' }}</p></div>
        <div><span class="text-xs uppercase tracking-wide text-zinc-400">Cost</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ props.vehicle.cost || '-' }}</p></div>
        <div><span class="text-xs uppercase tracking-wide text-zinc-400">Primary Power</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ primaryPowerLabels[props.vehicle.primaryPower] || props.vehicle.primaryPower }}</p></div>
        <div><span class="text-xs uppercase tracking-wide text-zinc-400">Auxiliary Drive</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ auxiliaryDriveLabels[props.vehicle.auxiliaryDrive] || props.vehicle.auxiliaryDrive }}</p></div>
        <div><span class="text-xs uppercase tracking-wide text-zinc-400">Traits</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ props.vehicle.traits.join(', ') || '-' }}</p></div>
      </div>
    </section>
  </div>
</template>
