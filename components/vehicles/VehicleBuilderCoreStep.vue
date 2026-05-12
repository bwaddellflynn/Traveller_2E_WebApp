<script setup lang="ts">
import { computed, watch } from 'vue'
import type { CustomVehicleDesign } from '~/types/vehicle'
import { vehicleFamilyRule, vehicleHitDmForSpaces, vehicleSizeBandForSpaces, vehicleSizeReferenceForVehicle, vehicleSizeReferenceRowsForFamily } from '~/utils/traveller/vehicles'

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

const constructionArmourRowsByBand = [
  { minTl: 0, maxTl: 2, materials: 'Wood, Bone, etc.', baseProtection: 0, maximumProtection: 10 },
  { minTl: 3, maxTl: 4, materials: 'Iron', baseProtection: 1, maximumProtection: 15 },
  { minTl: 5, maxTl: 6, materials: 'Steel', baseProtection: 2, maximumProtection: 20 },
  { minTl: 7, maxTl: 9, materials: 'Alloys, Composites', baseProtection: 3, maximumProtection: 30 },
  { minTl: 10, maxTl: 11, materials: 'Crystaliron', baseProtection: 5, maximumProtection: 40 },
  { minTl: 12, maxTl: 13, materials: 'Superdense', baseProtection: 6, maximumProtection: 50 },
  { minTl: 14, maxTl: 15, materials: 'Bonded Superdense', baseProtection: 8, maximumProtection: 60 },
  { minTl: 16, maxTl: 16, materials: 'Molecular Bonded', baseProtection: 10, maximumProtection: 80 },
  { minTl: 17, maxTl: 17, materials: 'Coherent Superdense', baseProtection: 15, maximumProtection: 100 },
  { minTl: 18, maxTl: 20, materials: 'Collapsium', baseProtection: 20, maximumProtection: 160 },
] as const

const familyRule = computed(() => vehicleFamilyRule(props.vehicle.baseFamily))
const derivedSizeBand = computed(() => vehicleSizeBandForSpaces(props.vehicle.spaces))
const derivedType = computed(() => `${derivedSizeBand.value.label} ${familyRule.value.typeLabel}`)
const constructionArmourRows = computed(() => (
  Array.from({ length: 21 }, (_, tl) => {
    const rule = constructionArmourRowsByBand.find((row) => tl >= row.minTl && tl <= row.maxTl) ?? constructionArmourRowsByBand[constructionArmourRowsByBand.length - 1]
    return {
      tl,
      materials: rule.materials,
      baseProtection: rule.baseProtection,
      maximumProtection: rule.maximumProtection,
    }
  })
))
const constructionOptions = computed(() => (
  constructionArmourRows.value.map((row) => ({
    value: row.tl,
    label: `TL ${row.tl} · ${row.materials} · +${row.baseProtection} / +${row.maximumProtection}`,
  }))
))
const currentSizeReferenceRows = computed(() => vehicleSizeReferenceRowsForFamily(props.vehicle.baseFamily))
const currentSizeReference = computed(() => vehicleSizeReferenceForVehicle(props.vehicle.baseFamily, props.vehicle.spaces))
const formatSizeReferenceBand = (minimum: number, maximum: number | null) => (maximum === null ? `${minimum}+` : `${minimum}-${maximum}`)

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
      <div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div class="md:col-span-2">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Choose</p>
          </div>
          <div class="grid auto-rows-fr gap-4 self-start">
            <label class="flex h-full flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <span class="min-h-4 leading-4">Vehicle Name</span>
              <input v-model="props.vehicle.name" class="h-11 rounded-md border border-zinc-300 px-3 text-base font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="Name">
              <span aria-hidden="true" class="min-h-[1.5rem]">&nbsp;</span>
            </label>
            <label class="flex h-full flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <span class="min-h-4 leading-4">Base Type</span>
              <select v-model="props.vehicle.baseFamily" class="h-11 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
                <option v-for="option in props.optionSets.baseFamilies" :key="option.id" :value="option.id">{{ option.label }}</option>
              </select>
              <span class="min-h-[1.5rem] text-[11px] font-normal normal-case tracking-normal text-zinc-400">Choose the handbook vehicle family that sets the baseline construction rules.</span>
            </label>
            <label class="flex h-full flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <span class="min-h-4 leading-4">Construction</span>
              <select v-model.number="props.vehicle.techLevel" class="h-11 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
                <option v-for="option in constructionOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
              <span class="min-h-[1.5rem] text-[11px] font-normal normal-case tracking-normal text-zinc-400">Minimum TL {{ familyRule.minimumTechLevel }} for {{ familyRule.label }}. Construction also sets the armour material row used later in Protection.</span>
            </label>
            <label class="flex h-full flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <span class="min-h-4 leading-4">Hull Class</span>
              <select v-model="props.vehicle.hull" class="h-11 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
                <option v-for="option in props.optionSets.hulls" :key="option" :value="option">
                  {{
                    option === 'Light'
                      ? 'Light · Hull -25% · Cost -25%'
                      : option === 'Standard'
                        ? 'Standard · Hull +0% · Cost +0%'
                        : option === 'Reinforced'
                          ? 'Reinforced · Hull +10% · Cost +50%'
                          : option
                  }}
                </option>
              </select>
              <span class="min-h-[1.5rem] text-[11px] font-normal normal-case tracking-normal text-zinc-400">Structural reinforcement choice. Light and Reinforced modify hull and total cost.</span>
            </label>
            <label class="flex h-full flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <span class="min-h-4 leading-4">Operating Skill Override</span>
              <input v-model="props.vehicle.skill" list="vehicle-builder-skills" class="h-11 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="Drive (wheel)">
              <span class="min-h-[1.5rem] text-[11px] font-normal normal-case tracking-normal text-zinc-400">Leave the handbook default in place unless this design really requires a different operating skill.</span>
            </label>
          </div>
          <div class="grid gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 self-start">
            <span class="min-h-4 leading-4">Size/Capacity Spaces</span>
            <input v-model.number="props.vehicle.spaces" class="h-11 rounded-md border border-zinc-300 px-3 text-sm font-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" min="1" type="number">
            <span class="min-h-[1.5rem] text-[11px] font-normal normal-case tracking-normal text-zinc-400">Primary chassis-size and internal-capacity value. This is not just seating. Most later handbook calculations key off Spaces first.</span>
            <div class="overflow-hidden rounded-md border border-cyan-400/20 bg-slate-950/45">
              <div class="border-b border-cyan-400/10 bg-cyan-400/5 px-3 py-2">
                <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200/85">Rough Size Guidance</p>
                <p class="mt-1 text-sm font-semibold normal-case tracking-normal text-cyan-50">
                  {{ familyRule.label }} at {{ props.vehicle.spaces }} spaces reads as {{ currentSizeReference.form }}: {{ currentSizeReference.example }}.
                </p>
              </div>
              <div class="grid grid-cols-[4.5rem_8rem_minmax(0,1fr)] bg-cyan-400/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100/80">
                <span>Spaces</span>
                <span>Form</span>
                <span>Example</span>
              </div>
              <div
                v-for="row in currentSizeReferenceRows"
                :key="`${props.vehicle.baseFamily}-${row.key}`"
                class="grid grid-cols-[4.5rem_8rem_minmax(0,1fr)] border-t border-cyan-400/10 px-3 py-2 text-xs"
                :class="currentSizeReference === row ? 'bg-cyan-400/10 text-cyan-50' : 'text-zinc-200'"
              >
                <span>{{ formatSizeReferenceBand(row.minSpaces, row.maxSpaces) }}</span>
                <span class="normal-case tracking-normal">{{ row.form }}</span>
                <span class="normal-case tracking-normal">{{ row.example }}</span>
              </div>
            </div>
          </div>
          <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 md:col-span-2">
            <span class="min-h-4 leading-4">Notes</span>
            <textarea v-model="props.vehicle.notes" class="min-h-[6rem] rounded-md border border-zinc-300 px-3 py-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="Variant notes, caveats, or construction notes" />
          </label>
      </div>
    </section>

    <datalist id="vehicle-builder-skills">
      <option v-for="option in props.optionSets.skills" :key="option" :value="option" />
    </datalist>
  </div>
</template>
