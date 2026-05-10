<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { CustomVehicleDesign, TravellerVehicleCategory, TravellerVehicleRecord } from '~/types/vehicle'
import VehicleBuilderCoreStep from '~/components/vehicles/VehicleBuilderCoreStep.vue'
import VehicleBuilderLoadoutStep from '~/components/vehicles/VehicleBuilderLoadoutStep.vue'
import VehicleBuilderPerformanceStep from '~/components/vehicles/VehicleBuilderPerformanceStep.vue'
import VehicleBuilderReviewStep from '~/components/vehicles/VehicleBuilderReviewStep.vue'
import VehicleBuilderTabs from '~/components/vehicles/VehicleBuilderTabs.vue'
import { useVehiclesStore } from '~/stores/vehicles'
import {
  applyVehicleHandbookDerivations,
  cloneVehicle,
  createBlankCustomVehicle,
  createBlankVehicleWeapon,
  normalizeCustomVehicleDesign,
  validateCustomVehicle,
  vehicleAuxiliaryDriveOptions,
  vehicleBuilderOptionSets,
  vehicleConstructionSummary,
  vehicleFamilyRule,
  vehiclePrimaryPowerOptions,
} from '~/utils/traveller/vehicles'

type VehicleSortKey = 'name' | 'techLevel' | 'category' | 'speed' | 'agility' | 'spaces' | 'costCredits'
type VehicleSortIcon = 'sort-asc' | 'sort-desc'

const vehiclesStore = useVehiclesStore()
const { activeUserId, referenceVehicles, playerBuiltVehicles } = storeToRefs(vehiclesStore)

const activeGarageTab = ref('reference')
const selectedCategory = ref<TravellerVehicleCategory | 'all'>('all')
const search = ref('')
const vehicleSortKey = ref<VehicleSortKey>('name')
const vehicleSortDirection = ref<'asc' | 'desc'>('asc')
const selectedVehicleId = ref('')
const expandedVehicleId = ref('')
const categoryMenuOpen = ref(false)
const saveMessage = ref('')
const activeBuildStep = ref(0)
const buildDraft = ref<CustomVehicleDesign | null>(null)
const selectedCustomVehicleId = ref('')
let applyingBuildDraftDerivations = false

type VehicleBuildStep = { id: string, label: string, title: string, description: string }

const categories: { id: TravellerVehicleCategory | 'all', label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'ground', label: 'Ground' },
  { id: 'grav', label: 'Grav' },
  { id: 'aircraft', label: 'Aircraft' },
  { id: 'watercraft', label: 'Watercraft' },
  { id: 'hovercraft', label: 'Hovercraft' },
  { id: 'walker', label: 'Walker' },
  { id: 'rail', label: 'Rail' },
  { id: 'biotech', label: 'Biotech' },
]

const garageTabs = [
  { id: 'reference', label: 'Pre-Fab Vehicles' },
  { id: 'builds', label: 'Custom Vehicles' },
]
const builderSteps: VehicleBuildStep[] = [
  { id: 'core', label: 'Frame', title: 'Frame', description: 'Name the vehicle and define its category, hull, skill, and core classification.' },
  { id: 'performance', label: 'Performance', title: 'Performance', description: 'Set movement, crew, commercial, and structural values.' },
  { id: 'loadout', label: 'Loadout', title: 'Loadout', description: 'Define armour, traits, equipment, and mounted weapons.' },
  { id: 'review', label: 'Review', title: 'Review', description: 'Validate the finished vehicle record before saving it.' },
]
const builderOptionSets = vehicleBuilderOptionSets()
const allPrimaryPowerOptions = vehiclePrimaryPowerOptions()
const allAuxiliaryDriveOptions = vehicleAuxiliaryDriveOptions()
const sortableVehicleColumns: { key: VehicleSortKey, label: string }[] = [
  { key: 'name', label: 'Vehicle' },
  { key: 'techLevel', label: 'TL' },
  { key: 'category', label: 'Category' },
  { key: 'speed', label: 'Speed' },
  { key: 'agility', label: 'Agility' },
  { key: 'spaces', label: 'Spaces' },
  { key: 'costCredits', label: 'Cost' },
]

const speedRank: Record<string, number> = {
  Idle: 0,
  'Very Slow': 1,
  Slow: 2,
  Medium: 3,
  High: 4,
  Fast: 5,
  'Very Fast': 6,
  Subsonic: 7,
  Supersonic: 8,
  Hypersonic: 9,
  Orbital: 10,
}

const compareValues = (firstValue: unknown, secondValue: unknown, direction: number) => {
  if (firstValue === null || firstValue === undefined) return 1
  if (secondValue === null || secondValue === undefined) return -1

  if (typeof firstValue === 'number' || typeof secondValue === 'number') {
    const left = typeof firstValue === 'number' ? firstValue : Number(firstValue)
    const right = typeof secondValue === 'number' ? secondValue : Number(secondValue)
    return (left - right) * direction
  }

  return String(firstValue ?? '').localeCompare(String(secondValue ?? ''), undefined, { numeric: true, sensitivity: 'base' }) * direction
}

const sortReferenceVehicles = (vehicles: TravellerVehicleRecord[]) => {
  const direction = vehicleSortDirection.value === 'asc' ? 1 : -1
  const key = vehicleSortKey.value

  return [...vehicles].sort((first, second) => {
    const firstValue = key === 'speed' ? speedRank[first.speed] ?? -1 : first[key]
    const secondValue = key === 'speed' ? speedRank[second.speed] ?? -1 : second[key]
    return compareValues(firstValue, secondValue, direction)
  })
}

const filteredReferenceVehicles = computed(() => sortReferenceVehicles(referenceVehicles.value.filter((vehicle) => {
  const matchesCategory = selectedCategory.value === 'all' || vehicle.category === selectedCategory.value
  const query = search.value.trim().toLowerCase()
  const matchesSearch = !query || [
    vehicle.name,
    vehicle.type,
    vehicle.skill,
    vehicle.speed,
    vehicle.cruiseSpeed,
    vehicle.traits.join(' '),
    vehicle.equipment.join(' '),
    vehicle.weapons.map((weapon) => `${weapon.name} ${weapon.damage} ${weapon.traits.join(' ')}`).join(' '),
    vehicle.sourceName,
  ].filter(Boolean).join(' ').toLowerCase().includes(query)

  return matchesCategory && matchesSearch
})))

const selectedVehicle = computed(() => {
  if (selectedVehicleId.value) {
    return referenceVehicles.value.find((vehicle) => vehicle.id === selectedVehicleId.value) ?? filteredReferenceVehicles.value[0] ?? null
  }
  return filteredReferenceVehicles.value[0] ?? null
})

watch(filteredReferenceVehicles, (vehicles) => {
  if (!vehicles.length) {
    selectedVehicleId.value = ''
    return
  }
  if (!vehicles.some((vehicle) => vehicle.id === selectedVehicleId.value)) {
    selectedVehicleId.value = vehicles[0]?.id ?? ''
  }
}, { immediate: true })

const setVehicleSort = (key: VehicleSortKey) => {
  if (vehicleSortKey.value === key) {
    vehicleSortDirection.value = vehicleSortDirection.value === 'asc' ? 'desc' : 'asc'
    return
  }
  vehicleSortKey.value = key
  vehicleSortDirection.value = 'asc'
}

const toggleExpandedVehicle = (vehicleId: string) => {
  expandedVehicleId.value = expandedVehicleId.value === vehicleId ? '' : vehicleId
  selectedVehicleId.value = vehicleId
}

const selectVehicleCategory = (categoryId: TravellerVehicleCategory | 'all') => {
  selectedCategory.value = categoryId
  categoryMenuOpen.value = false
}

const vehicleSortIndicator = (key: VehicleSortKey): VehicleSortIcon | null => {
  if (vehicleSortKey.value !== key) return null
  return vehicleSortDirection.value === 'asc' ? 'sort-asc' : 'sort-desc'
}

const formatCredits = (credits: number | null) => {
  if (credits === null) return '-'
  return credits >= 1000000 ? `MCr${credits / 1000000}` : `Cr${credits.toLocaleString()}`
}

const categoryLabel = (category: string) => category.split('-').map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join(' ')
const buildValidationIssues = computed(() => buildDraft.value ? validateCustomVehicle(buildDraft.value) : [])
const buildDraftFamilyRule = computed(() => buildDraft.value ? vehicleFamilyRule(buildDraft.value.baseFamily) : null)
const buildDraftConstructionSummary = computed(() => buildDraft.value ? vehicleConstructionSummary(buildDraft.value) : null)
const buildDraftPrimaryPowerOptions = computed(() => {
  if (!buildDraft.value) return allPrimaryPowerOptions
  return allPrimaryPowerOptions.filter((option) => !option.allowedFamilies || option.allowedFamilies.includes(buildDraft.value!.baseFamily))
})
const buildDraftAuxiliaryDriveOptions = computed(() => {
  if (!buildDraft.value) return allAuxiliaryDriveOptions
  return allAuxiliaryDriveOptions.filter((option) => !option.allowedFamilies || option.allowedFamilies.includes(buildDraft.value!.baseFamily) || option.id === 'none')
})
const activeBuildStepMeta = computed(() => builderSteps[activeBuildStep.value] ?? builderSteps[0])

// Vehicle handbook derivations mutate the draft in place. This guard prevents
// those derived writes from recursively retriggering the same synchronization
// watcher during a single reactive flush.
const syncBuildDraftDerivations = () => {
  if (!buildDraft.value || applyingBuildDraftDerivations) return
  applyingBuildDraftDerivations = true
  try {
    applyVehicleHandbookDerivations(buildDraft.value)
  }
  finally {
    applyingBuildDraftDerivations = false
  }
}

const coreStepComplete = computed(() => {
  if (!buildDraft.value) return false
  return Boolean(
    buildDraft.value.name.trim()
    && buildDraft.value.baseFamily
    && buildDraft.value.hull.trim()
    && buildDraft.value.spaces > 0,
  )
})

const performanceStepComplete = computed(() => {
  if (!buildDraft.value) return false
  return Boolean(
    buildDraft.value.speed.trim()
    && buildDraft.value.comfortLevel.trim()
    && buildDraft.value.crew.trim()
    && buildDraft.value.passengers.trim()
    && buildDraft.value.cost.trim(),
  )
})

const loadoutStepComplete = computed(() => {
  if (!buildDraft.value) return false
  return Object.values(buildDraft.value.armour).every((value) => String(value ?? '').trim())
})

const canAccessBuildStep = (index: number) => {
  if (index <= 0) return true
  if (index === 1) return coreStepComplete.value
  if (index === 2) return coreStepComplete.value && performanceStepComplete.value
  return coreStepComplete.value && performanceStepComplete.value && loadoutStepComplete.value
}

const setBuildStep = (index: number) => {
  if (!canAccessBuildStep(index)) return
  activeBuildStep.value = index
}

const ensureBuildDraft = () => {
  if (buildDraft.value) return
  buildDraft.value = createBlankCustomVehicle(activeUserId.value)
  syncBuildDraftDerivations()
}

const newVehicle = () => {
  buildDraft.value = createBlankCustomVehicle(activeUserId.value)
  selectedCustomVehicleId.value = ''
  activeBuildStep.value = 0
  saveMessage.value = ''
  syncBuildDraftDerivations()
}

const editVehicle = (vehicleId: string) => {
  const vehicle = vehiclesStore.getCustomVehicle(vehicleId)
  if (!vehicle) return
  buildDraft.value = normalizeCustomVehicleDesign(cloneVehicle(vehicle))
  syncBuildDraftDerivations()
  selectedCustomVehicleId.value = vehicle.id
  activeBuildStep.value = 0
  saveMessage.value = ''
}

const saveVehicle = () => {
  if (!buildDraft.value) return
  if (buildValidationIssues.value.length) return
  const saved = vehiclesStore.saveCustomVehicle(buildDraft.value)
  buildDraft.value = cloneVehicle(saved)
  selectedCustomVehicleId.value = saved.id
  saveMessage.value = `Saved ${saved.name || 'Custom Vehicle'}`
}

const duplicateVehicle = (vehicleId: string) => {
  const copy = vehiclesStore.duplicateCustomVehicle(vehicleId)
  if (!copy) return
  buildDraft.value = normalizeCustomVehicleDesign(cloneVehicle(copy))
  syncBuildDraftDerivations()
  selectedCustomVehicleId.value = copy.id
  activeBuildStep.value = 0
  saveMessage.value = `Duplicated ${copy.name || 'Custom Vehicle'}`
}

const deleteVehicle = (vehicleId: string) => {
  vehiclesStore.deleteCustomVehicle(vehicleId)
  if (selectedCustomVehicleId.value === vehicleId) {
    selectedCustomVehicleId.value = ''
    buildDraft.value = createBlankCustomVehicle(activeUserId.value)
    syncBuildDraftDerivations()
  }
  saveMessage.value = 'Deleted vehicle'
}

const toggleFeature = (value: string) => {
  ensureBuildDraft()
  if (!buildDraft.value) return
  const features = buildDraft.value.features ?? []
  buildDraft.value.features = features.includes(value)
    ? features.filter((feature) => feature !== value)
    : [...features, value]
  syncBuildDraftDerivations()
}

const addEquipmentEntry = (value: string) => {
  ensureBuildDraft()
  if (!buildDraft.value) return
  if (!buildDraft.value.equipment.includes(value)) buildDraft.value.equipment.push(value)
}

const removeEquipmentEntry = (index: number) => {
  buildDraft.value?.equipment.splice(index, 1)
}

const addVehicleWeapon = () => {
  ensureBuildDraft()
  buildDraft.value?.weapons.push(createBlankVehicleWeapon())
}

const removeVehicleWeapon = (index: number) => {
  buildDraft.value?.weapons.splice(index, 1)
}

watch(activeGarageTab, (tab) => {
  if (tab === 'builds') ensureBuildDraft()
}, { immediate: true })
</script>

<template>
  <main class="min-h-screen text-cyan-50">
    <section class="mx-auto w-full max-w-[96rem] px-5 pt-6 sm:px-8 lg:px-10">
      <div class="hud-tabs flex flex-wrap gap-2 border-b border-cyan-400/30">
        <button
          v-for="tab in garageTabs"
          :key="tab.id"
          class="-mb-px rounded-t-md border border-transparent px-4 py-3 text-sm font-semibold"
          :class="activeGarageTab === tab.id ? 'border-zinc-300 border-b-white bg-white text-zinc-950' : 'text-zinc-600 hover:text-zinc-950'"
          type="button"
          @click="activeGarageTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>
    </section>

    <section v-if="activeGarageTab === 'reference'" class="mx-auto grid w-full max-w-[96rem] gap-5 px-5 py-6 sm:px-8 xl:grid-cols-[minmax(0,1fr)_25rem] lg:px-10">
      <div class="grid gap-5">
        <section class="hud-panel rounded-lg border p-5 shadow-sm">
          <div class="list-reference-header flex flex-wrap items-center justify-between gap-3">
            <div class="list-reference-title">
              <h2 class="text-xl font-semibold">Reference Vehicles</h2>
            </div>
            <div class="list-search-actions">
              <input v-model="search" class="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="Search vehicles">
              <button
                class="list-category-toggle hud-link h-10 w-11"
                :aria-expanded="categoryMenuOpen"
                aria-label="Toggle vehicle categories"
                type="button"
                @click.stop.prevent="categoryMenuOpen = !categoryMenuOpen"
              >
                <span :class="['list-category-toggle__line', categoryMenuOpen ? 'is-open' : '']" />
                <span :class="['list-category-toggle__line', categoryMenuOpen ? 'is-open' : '']" />
                <span :class="['list-category-toggle__line', categoryMenuOpen ? 'is-open' : '']" />
              </button>
            </div>
          </div>

          <div :class="['list-category-panel mt-4', categoryMenuOpen ? 'is-open' : '']">
            <button
              v-for="category in categories"
              :key="category.id"
              class="rounded-md border px-3 py-2 text-sm font-semibold"
              :class="selectedCategory === category.id ? 'border-zinc-950 bg-zinc-950 text-white' : 'border-zinc-300 text-zinc-700 hover:border-amber-600'"
              type="button"
              @click="selectVehicleCategory(category.id)"
            >
              {{ category.label }}
            </button>
          </div>

          <div class="hud-table-shell hud-scrollbar mt-4 max-h-[46rem] overflow-auto rounded-md border">
            <table class="mobile-collapsible-table w-full min-w-[68rem] text-left text-sm">
              <thead class="sticky top-0 z-10 bg-stone-100 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th v-for="column in sortableVehicleColumns" :key="column.key" class="px-3 py-2">
                    <button class="flex items-center gap-1 font-semibold uppercase tracking-wide hover:text-zinc-950" type="button" @click="setVehicleSort(column.key)">
                      <span>{{ column.label }}</span>
                      <span class="inline-flex h-4 w-4 items-center text-amber-700">
                        <AppIcon v-if="vehicleSortIndicator(column.key)" class="h-4 w-4" :name="vehicleSortIndicator(column.key) ?? 'sort-asc'" />
                      </span>
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                <template v-for="vehicle in filteredReferenceVehicles" :key="vehicle.id">
                <tr
                  class="cursor-pointer border-t border-zinc-200 align-top"
                  :class="selectedVehicle?.id === vehicle.id ? 'bg-cyan-50/80' : 'hover:bg-stone-50'"
                  @click="selectedVehicleId = vehicle.id"
                >
                  <td class="px-3 py-2 font-semibold text-zinc-950">
                    <button class="mobile-row-toggle block w-full text-left font-semibold" type="button" @click.stop="toggleExpandedVehicle(vehicle.id)">
                      {{ vehicle.name }}
                    </button>
                    <span class="mt-1 block text-xs font-medium text-zinc-500">{{ vehicle.sourceName ?? vehicle.sourceId }}<template v-if="vehicle.sourcePage"> p. {{ vehicle.sourcePage }}</template></span>
                  </td>
                  <td class="px-3 py-2">{{ vehicle.techLevel }}</td>
                  <td class="px-3 py-2">{{ categoryLabel(vehicle.category) }}</td>
                  <td class="px-3 py-2">{{ vehicle.speed }} <span class="text-zinc-500">({{ vehicle.cruiseSpeed }})</span></td>
                  <td class="px-3 py-2">{{ vehicle.agility }}</td>
                  <td class="px-3 py-2">{{ vehicle.spaces }}</td>
                  <td class="px-3 py-2">{{ formatCredits(vehicle.costCredits) }}</td>
                </tr>
                <tr v-if="expandedVehicleId === vehicle.id" class="mobile-detail-row border-t border-cyan-400/20">
                  <td :colspan="sortableVehicleColumns.length" class="px-3 py-3">
                    <div class="mobile-row-detail-grid">
                      <div><span>TL</span><strong>{{ vehicle.techLevel }}</strong></div>
                      <div><span>Category</span><strong>{{ categoryLabel(vehicle.category) }}</strong></div>
                      <div><span>Speed</span><strong>{{ vehicle.speed }} ({{ vehicle.cruiseSpeed }})</strong></div>
                      <div><span>Agility</span><strong>{{ vehicle.agility }}</strong></div>
                      <div><span>Spaces</span><strong>{{ vehicle.spaces }}</strong></div>
                      <div><span>Cost</span><strong>{{ formatCredits(vehicle.costCredits) }}</strong></div>
                      <div><span>Skill</span><strong>{{ vehicle.skill }}</strong></div>
                      <div><span>Crew / Passengers</span><strong>{{ vehicle.crew }} / {{ vehicle.passengers }}</strong></div>
                      <div class="sm:col-span-2"><span>Traits</span><strong>{{ vehicle.traits.join(', ') || '-' }}</strong></div>
                    </div>
                  </td>
                </tr>
                </template>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <aside v-if="selectedVehicle" class="hud-panel hud-scrollbar rounded-lg border p-5 shadow-sm xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-auto">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="hud-kicker text-xs font-semibold uppercase tracking-wide">{{ selectedVehicle.type }}</p>
            <h2 class="mt-2 text-2xl font-semibold">{{ selectedVehicle.name }}</h2>
            <p class="mt-1 text-sm text-cyan-100/70">
              {{ selectedVehicle.sourceName }}
              <template v-if="selectedVehicle.sourcePage"> p. {{ selectedVehicle.sourcePage }}</template>
            </p>
          </div>
          <span class="hud-glyph grid h-10 w-10 shrink-0 place-items-center rounded-md">
            <AppIcon name="car" />
          </span>
        </div>

        <div class="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div class="hud-stat rounded-md border p-3">
            <p class="text-xs uppercase tracking-wide text-zinc-400">TL</p>
            <p class="mt-1 text-lg font-semibold">{{ selectedVehicle.techLevel }}</p>
          </div>
          <div class="hud-stat rounded-md border p-3">
            <p class="text-xs uppercase tracking-wide text-zinc-400">Agility</p>
            <p class="mt-1 text-lg font-semibold">{{ selectedVehicle.agility }}</p>
          </div>
          <div class="hud-stat rounded-md border p-3">
            <p class="text-xs uppercase tracking-wide text-zinc-400">Speed</p>
            <p class="mt-1 text-lg font-semibold">{{ selectedVehicle.speed }}</p>
            <p class="text-xs text-zinc-400">Cruise {{ selectedVehicle.cruiseSpeed }}</p>
          </div>
          <div class="hud-stat rounded-md border p-3">
            <p class="text-xs uppercase tracking-wide text-zinc-400">Range</p>
            <p class="mt-1 text-lg font-semibold">{{ selectedVehicle.range }}</p>
            <p class="text-xs text-zinc-400">Cruise {{ selectedVehicle.cruiseRange }}</p>
          </div>
        </div>

        <div class="mt-5 grid gap-2 text-sm">
          <div class="flex justify-between gap-3 rounded-md bg-white/5 px-3 py-2">
            <span class="text-cyan-100/70">Skill</span>
            <span class="font-semibold">{{ selectedVehicle.skill }}</span>
          </div>
          <div class="flex justify-between gap-3 rounded-md bg-white/5 px-3 py-2">
            <span class="text-cyan-100/70">Crew / Passengers</span>
            <span class="font-semibold">{{ selectedVehicle.crew }} / {{ selectedVehicle.passengers }}</span>
          </div>
          <div class="flex justify-between gap-3 rounded-md bg-white/5 px-3 py-2">
            <span class="text-cyan-100/70">Structure</span>
            <span class="font-semibold">{{ selectedVehicle.structure }}</span>
          </div>
          <div class="flex justify-between gap-3 rounded-md bg-white/5 px-3 py-2">
            <span class="text-cyan-100/70">Shipping</span>
            <span class="font-semibold">{{ selectedVehicle.shipping }}</span>
          </div>
          <div class="flex justify-between gap-3 rounded-md bg-white/5 px-3 py-2">
            <span class="text-cyan-100/70">Cost</span>
            <span class="font-semibold">{{ selectedVehicle.cost }}</span>
          </div>
        </div>

        <div class="mt-5">
          <p class="text-sm font-semibold">Traits</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <span v-for="trait in selectedVehicle.traits" :key="trait" class="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-2 py-1 text-xs font-semibold text-cyan-100">
              {{ trait }}
            </span>
            <span v-if="!selectedVehicle.traits.length" class="text-sm text-cyan-100/70">None</span>
          </div>
        </div>

        <div class="mt-5">
          <p class="text-sm font-semibold">Armour</p>
          <div class="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div v-for="(value, facing) in selectedVehicle.armour" :key="facing" class="rounded-md bg-white/5 px-3 py-2">
              <span class="capitalize text-cyan-100/70">{{ facing }}</span>
              <span class="float-right font-semibold">{{ value }}</span>
            </div>
          </div>
        </div>

        <div class="mt-5">
          <p class="text-sm font-semibold">Equipment</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <span v-for="item in selectedVehicle.equipment" :key="item" class="rounded-md bg-white/5 px-2 py-1 text-xs text-cyan-100/80">
              {{ item }}
            </span>
          </div>
        </div>

        <div v-if="selectedVehicle.weapons.length" class="mt-5">
          <p class="text-sm font-semibold">Weapons</p>
          <div class="mt-2 grid gap-2">
            <div v-for="weapon in selectedVehicle.weapons" :key="weapon.name" class="rounded-md border border-cyan-300/20 bg-white/5 p-3 text-sm">
              <p class="font-semibold">{{ weapon.name }}</p>
              <p class="mt-1 text-cyan-100/70">{{ weapon.range }} · {{ weapon.damage }} · FC {{ weapon.fireControl }}</p>
              <p v-if="weapon.traits.length" class="mt-1 text-xs text-cyan-100/60">{{ weapon.traits.join(', ') }}</p>
            </div>
          </div>
        </div>

        <p v-if="selectedVehicle.notes" class="mt-5 rounded-md border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">
          {{ selectedVehicle.notes }}
        </p>
      </aside>
    </section>

    <section v-else class="mx-auto w-full max-w-[96rem] px-5 py-6 sm:px-8 lg:px-10">
      <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section class="hud-panel rounded-lg border p-5 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="hud-kicker text-sm font-semibold uppercase tracking-wide">Player Builds</p>
              <h2 class="mt-2 text-2xl font-semibold">Custom Vehicle Builder</h2>
              <p class="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
                This builder now starts from the Vehicle Handbook base vehicle families and derives handbook defaults for type, target size, baseline speed and range, shipping, base cost, hull, structure, and a first pass of rule-driven customisations.
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button class="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 hover:border-amber-600" type="button" @click="newVehicle">
                New
              </button>
              <button
                class="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 hover:border-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="!buildDraft || !!buildValidationIssues.length"
                type="button"
                @click="saveVehicle"
              >
                Save
              </button>
            </div>
          </div>

          <p v-if="saveMessage" class="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900">
            {{ saveMessage }}
          </p>

          <VehicleBuilderTabs
            :steps="builderSteps"
            :active-step="activeBuildStep"
            :can-access-step="canAccessBuildStep"
            @select-step="setBuildStep"
          />

          <div v-if="buildDraft" class="mt-5 rounded-md border border-zinc-200 p-5">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 class="text-lg font-semibold">{{ activeBuildStepMeta.title }}</h3>
                <p class="mt-1 text-sm text-zinc-600">{{ activeBuildStepMeta.description }}</p>
              </div>
            </div>

            <div class="mt-5">
              <VehicleBuilderCoreStep
                v-if="activeBuildStep === 0"
                :vehicle="buildDraft"
                :option-sets="{
                  baseFamilies: builderOptionSets.baseFamilies,
                  hulls: builderOptionSets.hulls,
                  skills: builderOptionSets.skills,
                }"
                @sync-derivations="syncBuildDraftDerivations"
              />

              <VehicleBuilderPerformanceStep
                v-else-if="activeBuildStep === 1"
                :vehicle="buildDraft"
                :option-sets="{
                  comfortLevels: builderOptionSets.comfortLevels,
                  primaryPowerOptions: buildDraftPrimaryPowerOptions,
                  auxiliaryDriveOptions: buildDraftAuxiliaryDriveOptions,
                }"
                :summary="buildDraftConstructionSummary ?? { availableSpaces: 0, auxiliarySpaces: 0, auxiliarySummary: null }"
                @sync-derivations="syncBuildDraftDerivations"
              />

              <VehicleBuilderLoadoutStep
                v-else-if="activeBuildStep === 2"
                :vehicle="buildDraft"
                :allowed-features="buildDraftFamilyRule?.allowedFeatures ?? []"
                :equipment-suggestions="builderOptionSets.equipmentLibrary"
                @toggle-feature="toggleFeature"
                @add-equipment="addEquipmentEntry"
                @remove-equipment="removeEquipmentEntry"
                @add-weapon="addVehicleWeapon"
                @remove-weapon="removeVehicleWeapon"
              />

              <VehicleBuilderReviewStep
                v-else
                :vehicle="buildDraft"
                :validation-issues="buildValidationIssues"
              />
            </div>
          </div>
        </section>

        <aside class="grid gap-5">
          <section class="hud-panel rounded-lg border p-5 shadow-sm">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="hud-kicker text-xs font-semibold uppercase tracking-wide">Current Draft</p>
                <h3 class="mt-2 text-xl font-semibold">{{ buildDraft?.name || 'Unnamed Vehicle' }}</h3>
                <p class="mt-1 text-sm text-cyan-100/70">{{ buildDraft?.type || 'Vehicle type pending' }}</p>
              </div>
              <span class="hud-glyph grid h-10 w-10 shrink-0 place-items-center rounded-md">
                <AppIcon name="car" />
              </span>
            </div>

            <div v-if="buildDraft" class="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div class="hud-stat rounded-md border p-3">
                <p class="text-xs uppercase tracking-wide text-zinc-400">TL</p>
                <p class="mt-1 text-lg font-semibold">{{ buildDraft.techLevel }}</p>
              </div>
              <div class="hud-stat rounded-md border p-3">
                <p class="text-xs uppercase tracking-wide text-zinc-400">Spaces</p>
                <p class="mt-1 text-lg font-semibold">{{ buildDraft.spaces }}</p>
              </div>
              <div class="hud-stat rounded-md border p-3">
                <p class="text-xs uppercase tracking-wide text-zinc-400">Usable Spaces</p>
                <p class="mt-1 text-lg font-semibold">{{ buildDraftConstructionSummary?.availableSpaces ?? 0 }}</p>
              </div>
              <div class="hud-stat rounded-md border p-3">
                <p class="text-xs uppercase tracking-wide text-zinc-400">Speed</p>
                <p class="mt-1 text-lg font-semibold">{{ buildDraft.speed || '-' }}</p>
              </div>
              <div class="hud-stat rounded-md border p-3">
                <p class="text-xs uppercase tracking-wide text-zinc-400">Cost</p>
                <p class="mt-1 text-lg font-semibold">{{ buildDraft.cost || '-' }}</p>
              </div>
            </div>
          </section>

          <section class="hud-panel rounded-lg border p-5 shadow-sm">
            <div class="flex items-center justify-between gap-3">
              <h3 class="text-lg font-semibold">Saved Vehicles</h3>
              <span class="text-xs text-zinc-500">{{ playerBuiltVehicles.length }} saved</span>
            </div>

            <div v-if="playerBuiltVehicles.length" class="mt-4 grid gap-2">
              <div
                v-for="vehicle in playerBuiltVehicles"
                :key="vehicle.id"
                class="rounded-md border p-3"
                :class="selectedCustomVehicleId === vehicle.id ? 'border-cyan-400/50 bg-cyan-50/5' : 'border-zinc-200 bg-stone-50/30'"
              >
                <div class="flex items-start justify-between gap-3">
                  <button class="min-w-0 text-left" type="button" @click="editVehicle(vehicle.id)">
                    <p class="font-semibold text-zinc-950">{{ vehicle.name || 'Unnamed Vehicle' }}</p>
                    <p class="mt-1 text-sm text-zinc-600">{{ vehicle.type || '-' }} · TL {{ vehicle.techLevel }}</p>
                  </button>
                  <div class="flex items-center gap-2">
                    <button class="rounded-md border border-zinc-300 px-2 py-1 text-xs font-semibold text-zinc-700 hover:border-amber-600" type="button" @click="duplicateVehicle(vehicle.id)">
                      Duplicate
                    </button>
                    <button class="rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-700 hover:border-red-500" type="button" @click="deleteVehicle(vehicle.id)">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <p v-else class="mt-4 rounded-md bg-stone-50 p-4 text-sm text-zinc-600">No custom vehicles saved yet.</p>
          </section>
        </aside>
      </div>
    </section>
  </main>
</template>
