<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { TravellerVehicleCategory, TravellerVehicleRecord } from '~/types/vehicle'
import { useVehiclesStore } from '~/stores/vehicles'

type VehicleSortKey = 'name' | 'techLevel' | 'category' | 'speed' | 'agility' | 'spaces' | 'costCredits'
type VehicleSortIcon = 'sort-asc' | 'sort-desc'

const vehiclesStore = useVehiclesStore()
const { referenceVehicles, playerBuiltVehicles } = storeToRefs(vehiclesStore)

const activeGarageTab = ref('reference')
const selectedCategory = ref<TravellerVehicleCategory | 'all'>('all')
const search = ref('')
const vehicleSortKey = ref<VehicleSortKey>('name')
const vehicleSortDirection = ref<'asc' | 'desc'>('asc')
const selectedVehicleId = ref('')

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
  { id: 'reference', label: 'Reference Vehicles' },
  { id: 'builds', label: 'Player-Built Vehicles' },
]

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

const vehicleSortIndicator = (key: VehicleSortKey): VehicleSortIcon | null => {
  if (vehicleSortKey.value !== key) return null
  return vehicleSortDirection.value === 'asc' ? 'sort-asc' : 'sort-desc'
}

const formatCredits = (credits: number | null) => {
  if (credits === null) return '-'
  return credits >= 1000000 ? `MCr${credits / 1000000}` : `Cr${credits.toLocaleString()}`
}

const categoryLabel = (category: string) => category.split('-').map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join(' ')
</script>

<template>
  <main class="min-h-screen text-cyan-50">
    <section class="mx-auto w-full max-w-[96rem] px-5 pt-6 sm:px-8 lg:px-10">
      <div class="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="hud-kicker text-sm font-semibold uppercase tracking-wide">Garage</p>
          <h1 class="mt-2 text-3xl font-semibold">Vehicle Catalogue</h1>
        </div>
        <div class="hud-stat rounded-md border px-4 py-3 text-sm">
          <p class="text-2xl font-semibold">{{ referenceVehicles.length }}</p>
          <p class="text-zinc-400">Seeded vehicles</p>
        </div>
      </div>

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
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="text-xl font-semibold">Reference Vehicles</h2>
              <p class="mt-1 text-sm text-zinc-600">{{ filteredReferenceVehicles.length }} shown from seeded vehicle reference data.</p>
            </div>
            <input v-model="search" class="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="Search vehicles">
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <button
              v-for="category in categories"
              :key="category.id"
              class="rounded-md border px-3 py-2 text-sm font-semibold"
              :class="selectedCategory === category.id ? 'border-zinc-950 bg-zinc-950 text-white' : 'border-zinc-300 text-zinc-700 hover:border-amber-600'"
              type="button"
              @click="selectedCategory = category.id"
            >
              {{ category.label }}
            </button>
          </div>

          <div class="hud-table-shell hud-scrollbar mt-4 max-h-[46rem] overflow-auto rounded-md border">
            <table class="w-full min-w-[68rem] text-left text-sm">
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
                <tr
                  v-for="vehicle in filteredReferenceVehicles"
                  :key="vehicle.id"
                  class="cursor-pointer border-t border-zinc-200 align-top"
                  :class="selectedVehicle?.id === vehicle.id ? 'bg-cyan-50/80' : 'hover:bg-stone-50'"
                  @click="selectedVehicleId = vehicle.id"
                >
                  <td class="px-3 py-2 font-semibold text-zinc-950">
                    <span class="block">{{ vehicle.name }}</span>
                    <span class="mt-1 block text-xs font-medium text-zinc-500">{{ vehicle.sourceName ?? vehicle.sourceId }}<template v-if="vehicle.sourcePage"> p. {{ vehicle.sourcePage }}</template></span>
                  </td>
                  <td class="px-3 py-2">{{ vehicle.techLevel }}</td>
                  <td class="px-3 py-2">{{ categoryLabel(vehicle.category) }}</td>
                  <td class="px-3 py-2">{{ vehicle.speed }} <span class="text-zinc-500">({{ vehicle.cruiseSpeed }})</span></td>
                  <td class="px-3 py-2">{{ vehicle.agility }}</td>
                  <td class="px-3 py-2">{{ vehicle.spaces }}</td>
                  <td class="px-3 py-2">{{ formatCredits(vehicle.costCredits) }}</td>
                </tr>
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
      <div class="hud-panel grid gap-4 rounded-lg border p-6 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p class="hud-kicker text-sm font-semibold uppercase tracking-wide">Player Builds</p>
          <h2 class="mt-2 text-2xl font-semibold">Vehicle builder placeholder</h2>
          <p class="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
            Player-built vehicles will use the same record shape as the reference catalogue, with draft caching and construction steps added in a later pass.
          </p>
        </div>
        <button class="hud-link h-10 cursor-not-allowed px-4 text-sm font-semibold opacity-60" disabled type="button">
          Builder Coming Later
        </button>
      </div>

      <div v-if="playerBuiltVehicles.length" class="mt-5 grid gap-3">
        <div v-for="vehicle in playerBuiltVehicles" :key="vehicle.id" class="hud-panel rounded-lg border p-4">
          <p class="font-semibold">{{ vehicle.name }}</p>
          <p class="mt-1 text-sm text-zinc-600">{{ vehicle.notes }}</p>
        </div>
      </div>
    </section>
  </main>
</template>
