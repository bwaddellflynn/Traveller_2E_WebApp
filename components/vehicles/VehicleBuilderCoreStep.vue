<script setup lang="ts">
import { computed, watch } from 'vue'
import type { CustomVehicleDesign } from '~/types/vehicle'
import { vehicleFamilyRule, vehicleHitDmForSpaces, vehicleSizeBandForSpaces } from '~/utils/traveller/vehicles'

const props = defineProps<{
  vehicle: CustomVehicleDesign
  optionSets: {
    baseFamilies: Array<{ id: string, label: string, category: string }>
    hulls: string[]
    skills: string[]
  }
}>()

const emit = defineEmits<{
  (event: 'sync-derivations'): void
}>()

const familyRule = computed(() => vehicleFamilyRule(props.vehicle.baseFamily))
const derivedSizeBand = computed(() => vehicleSizeBandForSpaces(props.vehicle.spaces))
const derivedType = computed(() => `${derivedSizeBand.value.label} ${familyRule.value.typeLabel}`)

// Switching the base vehicle family resets handbook-driven defaults that should follow
// from the family definition rather than remain stuck on a value from a prior family.
watch(
  () => props.vehicle.baseFamily,
  () => {
    const nextCategory = familyRule.value.category
    const nextType = derivedType.value
    const nextTechLevel = Math.max(props.vehicle.techLevel, familyRule.value.minimumTechLevel)
    const nextSkill = familyRule.value.defaultSkill
    if (props.vehicle.category !== nextCategory) props.vehicle.category = nextCategory
    if (props.vehicle.type !== nextType) props.vehicle.type = nextType
    if (props.vehicle.techLevel !== nextTechLevel) props.vehicle.techLevel = nextTechLevel
    if (props.vehicle.skill !== nextSkill) props.vehicle.skill = nextSkill
    emit('sync-derivations')
  },
)

// Type and target-size modifiers both flow from Spaces in the handbook construction sequence.
watch(
  () => props.vehicle.spaces,
  () => {
    const nextHitDm = vehicleHitDmForSpaces(props.vehicle.spaces)
    const nextType = derivedType.value
    if (props.vehicle.hitDm !== nextHitDm) props.vehicle.hitDm = nextHitDm
    if (props.vehicle.type !== nextType) props.vehicle.type = nextType
    emit('sync-derivations')
  },
  { immediate: true },
)

watch(
  () => [props.vehicle.techLevel, props.vehicle.hull],
  () => {
    emit('sync-derivations')
  },
)
</script>

<template>
  <!-- Chassis inputs stay separate from the derived handbook summary so users can see which
       values they control and which the builder calculates from those choices. -->
  <div class="grid gap-4">
    <section class="rounded-md border border-cyan-400/20 bg-slate-950/30 p-4">
      <div class="grid gap-4 md:grid-cols-2">
          <div class="md:col-span-2">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Choose</p>
          </div>
          <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 md:col-span-2">
            <span>Vehicle Name</span>
            <input v-model="props.vehicle.name" class="h-11 rounded-md border border-zinc-300 px-3 text-base font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="Name">
          </label>
          <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <span>Base Type</span>
            <select v-model="props.vehicle.baseFamily" class="h-11 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
              <option v-for="option in props.optionSets.baseFamilies" :key="option.id" :value="option.id">{{ option.label }}</option>
            </select>
            <span class="text-[11px] font-normal normal-case tracking-normal text-zinc-400">Choose the handbook vehicle family that sets the baseline construction rules.</span>
          </label>
          <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <span>Tech Level</span>
            <input v-model.number="props.vehicle.techLevel" class="h-11 rounded-md border border-zinc-300 px-3 text-sm font-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" min="0" type="number">
            <span class="text-[11px] font-normal normal-case tracking-normal text-zinc-400">Minimum TL {{ familyRule.minimumTechLevel }} for {{ familyRule.label }}. TL also determines the handbook armour row used later in Protection.</span>
          </label>
          <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <span>Spaces</span>
            <input v-model.number="props.vehicle.spaces" class="h-11 rounded-md border border-zinc-300 px-3 text-sm font-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" min="0" type="number">
            <span class="text-[11px] font-normal normal-case tracking-normal text-zinc-400">Primary chassis-size and internal-capacity value. This is not just seating. Most later handbook calculations key off Spaces first.</span>
          </label>
          <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <span>Hull Class</span>
            <select v-model="props.vehicle.hull" class="h-11 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
              <option value="">Select hull class</option>
              <option v-for="option in props.optionSets.hulls" :key="option" :value="option">{{ option }}</option>
            </select>
            <span class="text-[11px] font-normal normal-case tracking-normal text-zinc-400">Structural reinforcement choice. Light and Reinforced modify hull and total cost.</span>
          </label>
          <div class="md:col-span-2">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Advanced Override</p>
          </div>
          <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 md:col-span-2">
            <span>Operating Skill Override</span>
            <input v-model="props.vehicle.skill" list="vehicle-builder-skills" class="h-11 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="Drive (wheel)">
            <span class="text-[11px] font-normal normal-case tracking-normal text-zinc-400">Leave the handbook default in place unless this design really requires a different operating skill.</span>
          </label>
          <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 md:col-span-2">
            <span>Notes</span>
            <textarea v-model="props.vehicle.notes" class="min-h-[6rem] rounded-md border border-zinc-300 px-3 py-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="Variant notes, caveats, or construction notes" />
          </label>
      </div>
    </section>

    <datalist id="vehicle-builder-skills">
      <option v-for="option in props.optionSets.skills" :key="option" :value="option" />
    </datalist>
  </div>
</template>
