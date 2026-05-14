<script setup lang="ts">
import { computed } from 'vue'
import type { CustomVehicleDesign } from '~/types/vehicle'
import { vehicleConstructionSummary, vehicleFamilyRule, vehiclePrimaryPowerOptions, vehicleAuxiliaryDriveOptions, vehicleSizeBandForSpaces } from '~/utils/traveller/vehicles'

const props = defineProps<{
  vehicle: CustomVehicleDesign
  validationIssues: string[]
  validationIssueSteps?: Record<string, number>
  showValidation?: boolean
}>()

const emit = defineEmits<{
  (event: 'jump-to-step', index: number): void
}>()

const primaryPowerLabels = Object.fromEntries(vehiclePrimaryPowerOptions().map((option) => [option.id, option.label]))
const auxiliaryDriveLabels = Object.fromEntries(vehicleAuxiliaryDriveOptions().map((option) => [option.id, option.label]))
const summary = computed(() => vehicleConstructionSummary(props.vehicle))
const stepLabels = ['Frame', 'Features', 'Power', 'Protection', 'Options', 'Automation', 'Occupants', 'Cargo', 'Weapons', 'Review']
</script>

<template>
  <!-- Final review is presented as a datasheet grouped by chassis, mobility, protection, and payload. -->
  <div class="grid gap-4">
    <section class="rounded-md border border-cyan-400/20 bg-slate-950/30 p-4">
      <h3 class="text-sm font-semibold text-cyan-50">Validation</h3>
      <ul v-if="props.showValidation && props.validationIssues.length" class="mt-3 grid gap-2">
        <li v-for="issue in props.validationIssues" :key="issue">
          <button
            class="w-full rounded-md border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-left text-sm text-amber-200 transition hover:border-amber-200 hover:bg-amber-300/15"
            type="button"
            @click="typeof props.validationIssueSteps?.[issue] === 'number' ? emit('jump-to-step', props.validationIssueSteps[issue]!) : undefined"
          >
            <span class="font-semibold text-amber-200">{{ issue }}</span>
            <span v-if="typeof props.validationIssueSteps?.[issue] === 'number'" class="mt-1 block text-xs uppercase tracking-wide text-amber-300/80">
              Go to {{ stepLabels[props.validationIssueSteps[issue]!] ?? 'Step' }}
            </span>
          </button>
        </li>
      </ul>
      <p v-else-if="props.showValidation" class="mt-3 rounded-md border border-emerald-300/30 bg-emerald-300/10 px-3 py-2 text-sm text-emerald-100">
        Vehicle build is valid and ready to save.
      </p>
      <p v-else class="mt-3 rounded-md border border-cyan-400/20 bg-white/5 px-3 py-2 text-sm text-cyan-100/80">
        Review the final datasheet here. Validation will appear when you try to save the vehicle.
      </p>
    </section>

    <section class="rounded-md border border-cyan-400/20 bg-slate-950/30 p-4">
      <div class="grid gap-4 xl:grid-cols-2">
        <section class="rounded-md border border-cyan-400/15 bg-slate-950/30 p-4">
          <h3 class="text-sm font-semibold text-cyan-50">Frame</h3>
          <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <div><span class="text-xs uppercase tracking-wide text-zinc-400">Vehicle</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ props.vehicle.name || 'Unnamed Vehicle' }}</p></div>
            <div><span class="text-xs uppercase tracking-wide text-zinc-400">Base Type</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ vehicleFamilyRule(props.vehicle.baseFamily).label }}</p></div>
            <div><span class="text-xs uppercase tracking-wide text-zinc-400">Category</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ props.vehicle.category }}</p></div>
            <div><span class="text-xs uppercase tracking-wide text-zinc-400">Type</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ props.vehicle.type || '-' }}</p></div>
            <div><span class="text-xs uppercase tracking-wide text-zinc-400">TL / Spaces</span><p class="mt-1 text-base font-semibold text-cyan-50">TL {{ props.vehicle.techLevel }} / {{ props.vehicle.spaces }}</p></div>
            <div><span class="text-xs uppercase tracking-wide text-zinc-400">Usable Spaces</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ summary.availableSpaces }}</p></div>
            <div><span class="text-xs uppercase tracking-wide text-zinc-400">Size / Hit DM</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ vehicleSizeBandForSpaces(props.vehicle.spaces).label }} / {{ vehicleSizeBandForSpaces(props.vehicle.spaces).hitDm }}</p></div>
            <div><span class="text-xs uppercase tracking-wide text-zinc-400">Hull / Structure</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ props.vehicle.hull }} / {{ props.vehicle.structure || '-' }}</p></div>
          </div>
        </section>

        <section class="rounded-md border border-cyan-400/15 bg-slate-950/30 p-4">
          <h3 class="text-sm font-semibold text-cyan-50">Mobility and Power</h3>
          <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <div><span class="text-xs uppercase tracking-wide text-zinc-400">Speed</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ props.vehicle.speed || '-' }} / {{ props.vehicle.cruiseSpeed || '-' }}</p></div>
            <div><span class="text-xs uppercase tracking-wide text-zinc-400">Range</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ props.vehicle.range || '-' }} / {{ props.vehicle.cruiseRange || '-' }}</p></div>
            <div><span class="text-xs uppercase tracking-wide text-zinc-400">Primary Power</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ primaryPowerLabels[props.vehicle.primaryPower] || props.vehicle.primaryPower }}</p></div>
            <div v-if="props.vehicle.primaryPower.startsWith('fusion-plus')"><span class="text-xs uppercase tracking-wide text-zinc-400">Fusion+ Fuel</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ props.vehicle.fusionPlusFuelType === 'deuterium-enriched-water' ? 'Deuterium-Enriched Water' : 'Water' }}</p></div>
            <div><span class="text-xs uppercase tracking-wide text-zinc-400">Auxiliary Drive</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ auxiliaryDriveLabels[props.vehicle.auxiliaryDrive] || props.vehicle.auxiliaryDrive }}</p></div>
            <div><span class="text-xs uppercase tracking-wide text-zinc-400">Agility</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ props.vehicle.agility || '-' }}</p></div>
            <div><span class="text-xs uppercase tracking-wide text-zinc-400">Shipping</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ props.vehicle.shipping || '-' }}</p></div>
            <div><span class="text-xs uppercase tracking-wide text-zinc-400">Power Plant Spaces</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ summary.powerPlantSpaces }}</p></div>
          </div>
        </section>

        <section class="rounded-md border border-cyan-400/15 bg-slate-950/30 p-4">
          <h3 class="text-sm font-semibold text-cyan-50">Occupants and Cargo</h3>
          <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <div><span class="text-xs uppercase tracking-wide text-zinc-400">Crew</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ props.vehicle.crew || '-' }}</p></div>
            <div><span class="text-xs uppercase tracking-wide text-zinc-400">Passengers</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ props.vehicle.passengers || '-' }}</p></div>
            <div><span class="text-xs uppercase tracking-wide text-zinc-400">Comfort</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ props.vehicle.comfortLevel || '-' }}</p></div>
            <div><span class="text-xs uppercase tracking-wide text-zinc-400">Cargo</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ props.vehicle.cargo || '-' }}</p></div>
            <div><span class="text-xs uppercase tracking-wide text-zinc-400">Allocated Systems</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ summary.allocatedSpaces }}</p></div>
            <div><span class="text-xs uppercase tracking-wide text-zinc-400">Remaining Spaces</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ summary.remainingSpaces }}</p></div>
            <div><span class="text-xs uppercase tracking-wide text-zinc-400">Occupant Spaces</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ summary.occupantAllocatedSpaces }}</p></div>
            <div><span class="text-xs uppercase tracking-wide text-zinc-400">Cargo Spaces</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ summary.cargoAllocatedSpaces }}</p></div>
            <div class="sm:col-span-2"><span class="text-xs uppercase tracking-wide text-zinc-400">Traits</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ props.vehicle.traits.join(', ') || '-' }}</p></div>
          </div>
        </section>

        <section class="rounded-md border border-cyan-400/15 bg-slate-950/30 p-4">
          <h3 class="text-sm font-semibold text-cyan-50">Cost and Protection</h3>
          <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <div><span class="text-xs uppercase tracking-wide text-zinc-400">Cost</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ props.vehicle.cost || '-' }}</p></div>
            <div><span class="text-xs uppercase tracking-wide text-zinc-400">Armour Spaces</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ summary.armourSummary.armourSpaces }}</p></div>
            <div><span class="text-xs uppercase tracking-wide text-zinc-400">Armour Cost</span><p class="mt-1 text-base font-semibold text-cyan-50">Cr{{ Math.round(summary.armourSummary.armourCost).toLocaleString() }}</p></div>
            <div><span class="text-xs uppercase tracking-wide text-zinc-400">Base / Maximum</span><p class="mt-1 text-base font-semibold text-cyan-50">+{{ summary.armourSummary.baseProtection }} / +{{ summary.armourSummary.maximumProtection }}</p></div>
            <div><span class="text-xs uppercase tracking-wide text-zinc-400">Forward Armour</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ props.vehicle.armour.forward || '-' }}</p></div>
            <div><span class="text-xs uppercase tracking-wide text-zinc-400">Port Armour</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ props.vehicle.armour.port || '-' }}</p></div>
            <div><span class="text-xs uppercase tracking-wide text-zinc-400">Starboard Armour</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ props.vehicle.armour.starboard || '-' }}</p></div>
            <div><span class="text-xs uppercase tracking-wide text-zinc-400">Dorsal Armour</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ props.vehicle.armour.dorsal || '-' }}</p></div>
            <div><span class="text-xs uppercase tracking-wide text-zinc-400">Ventral Armour</span><p class="mt-1 text-base font-semibold text-cyan-50">{{ props.vehicle.armour.ventral || '-' }}</p></div>
          </div>
        </section>
      </div>
    </section>
  </div>
</template>
