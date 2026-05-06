<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { TravellerShipCategory, TravellerShipRecord } from '~/types/ship'
import { useShipsStore } from '~/stores/ships'

type ShipSortKey = 'name' | 'tons' | 'category' | 'jump' | 'thrust'
type ShipSortIcon = 'sort-asc' | 'sort-desc'

const shipsStore = useShipsStore()
const { referenceShips } = storeToRefs(shipsStore)
const selectedCategory = ref<TravellerShipCategory | 'all'>('all')
const search = ref('')
const shipSortKey = ref<ShipSortKey>('name')
const shipSortDirection = ref<'asc' | 'desc'>('asc')
const selectedShipId = ref('')
const expandedShipId = ref('')
const categoryMenuOpen = ref(false)

const categories: { id: TravellerShipCategory | 'all', label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'merchant', label: 'Merchant' },
  { id: 'civilian', label: 'Civilian' },
  { id: 'military', label: 'Military' },
  { id: 'courier', label: 'Courier' },
  { id: 'exploration', label: 'Exploration' },
  { id: 'luxury', label: 'Luxury' },
  { id: 'cruiser', label: 'Cruisers' },
  { id: 'other', label: 'Other' },
]

const sortableShipColumns: { key: ShipSortKey, label: string }[] = [
  { key: 'name', label: 'Ship' },
  { key: 'tons', label: 'Tons' },
  { key: 'category', label: 'Category' },
  { key: 'jump', label: 'Jump' },
  { key: 'thrust', label: 'Thrust' },
]

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

const sortReferenceShips = (ships: TravellerShipRecord[]) => {
  const direction = shipSortDirection.value === 'asc' ? 1 : -1
  const key = shipSortKey.value
  return [...ships].sort((first, second) => compareValues(first[key], second[key], direction))
}

const filteredReferenceShips = computed(() => sortReferenceShips(referenceShips.value.filter((ship) => {
  const matchesCategory = selectedCategory.value === 'all' || ship.category === selectedCategory.value
  const query = search.value.trim().toLowerCase()
  const matchesSearch = !query || [
    ship.name,
    ship.role,
    ship.description,
    ship.traits.join(' '),
    ship.sourceName,
  ].filter(Boolean).join(' ').toLowerCase().includes(query)
  return matchesCategory && matchesSearch
})))

const selectedShip = computed(() => {
  if (selectedShipId.value) return referenceShips.value.find((ship) => ship.id === selectedShipId.value) ?? filteredReferenceShips.value[0] ?? null
  return filteredReferenceShips.value[0] ?? null
})

watch(filteredReferenceShips, (ships) => {
  if (!ships.length) {
    selectedShipId.value = ''
    return
  }
  if (!ships.some((entry) => entry.id === selectedShipId.value)) selectedShipId.value = ships[0]?.id ?? ''
}, { immediate: true })

const setShipSort = (key: ShipSortKey) => {
  if (shipSortKey.value === key) {
    shipSortDirection.value = shipSortDirection.value === 'asc' ? 'desc' : 'asc'
    return
  }
  shipSortKey.value = key
  shipSortDirection.value = 'asc'
}

const toggleExpandedShip = (shipId: string) => {
  expandedShipId.value = expandedShipId.value === shipId ? '' : shipId
  selectedShipId.value = shipId
}

const selectShipCategory = (categoryId: TravellerShipCategory | 'all') => {
  selectedCategory.value = categoryId
  categoryMenuOpen.value = false
}

const shipSortIndicator = (key: ShipSortKey): ShipSortIcon | null => {
  if (shipSortKey.value !== key) return null
  return shipSortDirection.value === 'asc' ? 'sort-asc' : 'sort-desc'
}

const categoryLabel = (category: string) => category.split('-').map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join(' ')
</script>

<template>
  <main class="min-h-screen text-cyan-50">
    <section class="mx-auto grid w-full max-w-[96rem] gap-5 px-5 py-6 sm:px-8 xl:grid-cols-[minmax(0,1fr)_25rem] lg:px-10">
      <div class="grid gap-5">
        <section class="hud-panel rounded-lg border p-5 shadow-sm">
          <div class="list-reference-header flex flex-wrap items-center justify-between gap-3">
            <div class="list-search-actions">
              <input v-model="search" class="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="Search ships">
              <button class="list-category-toggle hud-link h-10 w-11" :aria-expanded="categoryMenuOpen" aria-label="Toggle ship categories" type="button" @click.stop.prevent="categoryMenuOpen = !categoryMenuOpen">
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
              @click="selectShipCategory(category.id)"
            >
              {{ category.label }}
            </button>
          </div>

          <div class="hud-table-shell hud-scrollbar mt-4 max-h-[46rem] overflow-auto rounded-md border">
            <table class="mobile-collapsible-table w-full min-w-[56rem] text-left text-sm">
              <thead class="sticky top-0 z-10 bg-stone-100 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th v-for="column in sortableShipColumns" :key="column.key" class="px-3 py-2">
                    <button class="flex items-center gap-1 font-semibold uppercase tracking-wide hover:text-zinc-950" type="button" @click="setShipSort(column.key)">
                      <span>{{ column.label }}</span>
                      <span class="inline-flex h-4 w-4 items-center text-amber-700">
                        <AppIcon v-if="shipSortIndicator(column.key)" class="h-4 w-4" :name="shipSortIndicator(column.key) ?? 'sort-asc'" />
                      </span>
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                <template v-for="ship in filteredReferenceShips" :key="ship.id">
                  <tr class="cursor-pointer border-t border-zinc-200 align-top" :class="selectedShip?.id === ship.id ? 'bg-cyan-50/80' : 'hover:bg-stone-50'" @click="selectedShipId = ship.id">
                    <td class="px-3 py-2 font-semibold text-zinc-950">
                      <button class="mobile-row-toggle block w-full text-left font-semibold" type="button" @click.stop="toggleExpandedShip(ship.id)">
                        {{ ship.name }}
                      </button>
                      <span class="mt-1 block text-xs font-medium text-zinc-500">{{ ship.sourceName ?? ship.sourceId }}<template v-if="ship.sourcePage"> p. {{ ship.sourcePage }}</template></span>
                    </td>
                    <td class="px-3 py-2">{{ ship.tons }}</td>
                    <td class="px-3 py-2">{{ categoryLabel(ship.category) }}</td>
                    <td class="px-3 py-2">{{ ship.jump }}</td>
                    <td class="px-3 py-2">{{ ship.thrust }}</td>
                  </tr>
                  <tr v-if="expandedShipId === ship.id" class="mobile-detail-row border-t border-cyan-400/20">
                    <td :colspan="sortableShipColumns.length" class="px-3 py-3">
                      <div class="mobile-row-detail-grid">
                        <div><span>Tons</span><strong>{{ ship.tons }}</strong></div>
                        <div><span>Jump</span><strong>{{ ship.jump }}</strong></div>
                        <div><span>Thrust</span><strong>{{ ship.thrust }}</strong></div>
                        <div><span>Crew</span><strong>{{ ship.crew }}</strong></div>
                        <div class="sm:col-span-2"><span>Role</span><strong>{{ ship.role }}</strong></div>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <aside v-if="selectedShip" class="hud-panel hud-scrollbar rounded-lg border p-5 shadow-sm xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-auto">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/70">{{ categoryLabel(selectedShip.category) }}</p>
        <h2 class="mt-2 text-2xl font-semibold">{{ selectedShip.name }}</h2>
        <p class="mt-2 text-sm text-cyan-100/72">{{ selectedShip.description }}</p>
        <dl class="mt-5 grid gap-3 text-sm text-cyan-100/78">
          <div class="flex items-center justify-between gap-4"><dt>Tonnage</dt><dd>{{ selectedShip.tons }} tons</dd></div>
          <div class="flex items-center justify-between gap-4"><dt>Role</dt><dd>{{ selectedShip.role }}</dd></div>
          <div class="flex items-center justify-between gap-4"><dt>Jump</dt><dd>{{ selectedShip.jump }}</dd></div>
          <div class="flex items-center justify-between gap-4"><dt>Thrust</dt><dd>{{ selectedShip.thrust }}</dd></div>
          <div class="flex items-center justify-between gap-4"><dt>Crew</dt><dd>{{ selectedShip.crew }}</dd></div>
        </dl>
        <div v-if="selectedShip.traits.length" class="mt-5 rounded-md border border-cyan-400/20 bg-white/5 px-4 py-3">
          <h3 class="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-200/78">Traits</h3>
          <p class="mt-2 text-sm text-cyan-100/78">{{ selectedShip.traits.join(', ') }}</p>
        </div>
        <div v-if="selectedShip.notes" class="mt-5 rounded-md border border-cyan-400/20 bg-white/5 px-4 py-3">
          <h3 class="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-200/78">Notes</h3>
          <p class="mt-2 text-sm text-cyan-100/78">{{ selectedShip.notes }}</p>
        </div>
      </aside>
    </section>
  </main>
</template>
