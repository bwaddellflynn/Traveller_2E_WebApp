<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { TravellerCraftCategory, TravellerCraftRecord } from '~/types/craft'
import { useCraftStore } from '~/stores/craft'

type CraftSortKey = 'name' | 'tons' | 'category' | 'techLevel' | 'thrust'
type CraftSortIcon = 'sort-asc' | 'sort-desc'

const craftStore = useCraftStore()
const { referenceCraft } = storeToRefs(craftStore)
const selectedCategory = ref<TravellerCraftCategory | 'all'>('all')
const search = ref('')
const craftSortKey = ref<CraftSortKey>('name')
const craftSortDirection = ref<'asc' | 'desc'>('asc')
const selectedCraftId = ref('')
const expandedCraftId = ref('')
const categoryMenuOpen = ref(false)

const categories: { id: TravellerCraftCategory | 'all', label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'working', label: 'Working' },
  { id: 'fighter', label: 'Fighters' },
  { id: 'military', label: 'Military' },
  { id: 'luxury', label: 'Luxury' },
  { id: 'alien', label: 'Alien' },
  { id: 'module', label: 'Modules' },
  { id: 'other', label: 'Other' },
]

const sortableCraftColumns: { key: CraftSortKey, label: string }[] = [
  { key: 'name', label: 'Craft' },
  { key: 'tons', label: 'Tons' },
  { key: 'category', label: 'Category' },
  { key: 'techLevel', label: 'TL' },
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

const sortReferenceCraft = (craft: TravellerCraftRecord[]) => {
  const direction = craftSortDirection.value === 'asc' ? 1 : -1
  const key = craftSortKey.value
  return [...craft].sort((first, second) => compareValues(first[key], second[key], direction))
}

const filteredReferenceCraft = computed(() => sortReferenceCraft(referenceCraft.value.filter((craft) => {
  const matchesCategory = selectedCategory.value === 'all' || craft.category === selectedCategory.value
  const query = search.value.trim().toLowerCase()
  const matchesSearch = !query || [
    craft.name,
    craft.role,
    craft.description,
    craft.traits.join(' '),
    craft.sourceName,
  ].filter(Boolean).join(' ').toLowerCase().includes(query)
  return matchesCategory && matchesSearch
})))

const selectedCraft = computed(() => {
  if (selectedCraftId.value) return referenceCraft.value.find((craft) => craft.id === selectedCraftId.value) ?? filteredReferenceCraft.value[0] ?? null
  return filteredReferenceCraft.value[0] ?? null
})

watch(filteredReferenceCraft, (craft) => {
  if (!craft.length) {
    selectedCraftId.value = ''
    return
  }
  if (!craft.some((entry) => entry.id === selectedCraftId.value)) selectedCraftId.value = craft[0]?.id ?? ''
}, { immediate: true })

const setCraftSort = (key: CraftSortKey) => {
  if (craftSortKey.value === key) {
    craftSortDirection.value = craftSortDirection.value === 'asc' ? 'desc' : 'asc'
    return
  }
  craftSortKey.value = key
  craftSortDirection.value = 'asc'
}

const toggleExpandedCraft = (craftId: string) => {
  expandedCraftId.value = expandedCraftId.value === craftId ? '' : craftId
  selectedCraftId.value = craftId
}

const selectCraftCategory = (categoryId: TravellerCraftCategory | 'all') => {
  selectedCategory.value = categoryId
  categoryMenuOpen.value = false
}

const craftSortIndicator = (key: CraftSortKey): CraftSortIcon | null => {
  if (craftSortKey.value !== key) return null
  return craftSortDirection.value === 'asc' ? 'sort-asc' : 'sort-desc'
}

const formatCredits = (credits: number | null) => {
  if (credits === null) return '-'
  return credits >= 1000000 ? `MCr${credits / 1000000}` : `Cr${credits.toLocaleString()}`
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
              <input v-model="search" class="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="Search small craft">
              <button class="list-category-toggle hud-link h-10 w-11" :aria-expanded="categoryMenuOpen" aria-label="Toggle craft categories" type="button" @click.stop.prevent="categoryMenuOpen = !categoryMenuOpen">
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
              @click="selectCraftCategory(category.id)"
            >
              {{ category.label }}
            </button>
          </div>

          <div class="hud-table-shell hud-scrollbar mt-4 max-h-[46rem] overflow-auto rounded-md border">
            <table class="mobile-collapsible-table w-full min-w-[56rem] text-left text-sm">
              <thead class="sticky top-0 z-10 bg-stone-100 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th v-for="column in sortableCraftColumns" :key="column.key" class="px-3 py-2">
                    <button class="flex items-center gap-1 font-semibold uppercase tracking-wide hover:text-zinc-950" type="button" @click="setCraftSort(column.key)">
                      <span>{{ column.label }}</span>
                      <span class="inline-flex h-4 w-4 items-center text-amber-700">
                        <AppIcon v-if="craftSortIndicator(column.key)" class="h-4 w-4" :name="craftSortIndicator(column.key) ?? 'sort-asc'" />
                      </span>
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                <template v-for="craft in filteredReferenceCraft" :key="craft.id">
                  <tr class="cursor-pointer border-t border-zinc-200 align-top" :class="selectedCraft?.id === craft.id ? 'bg-cyan-50/80' : 'hover:bg-stone-50'" @click="selectedCraftId = craft.id">
                    <td class="px-3 py-2 font-semibold text-zinc-950">
                      <button class="mobile-row-toggle block w-full text-left font-semibold" type="button" @click.stop="toggleExpandedCraft(craft.id)">
                        {{ craft.name }}
                      </button>
                      <span class="mt-1 block text-xs font-medium text-zinc-500">{{ craft.sourceName ?? craft.sourceId }}<template v-if="craft.sourcePage"> p. {{ craft.sourcePage }}</template></span>
                    </td>
                    <td class="px-3 py-2">{{ craft.tons }}</td>
                    <td class="px-3 py-2">{{ categoryLabel(craft.category) }}</td>
                    <td class="px-3 py-2">{{ craft.techLevel ?? '-' }}</td>
                    <td class="px-3 py-2">{{ craft.thrust }}</td>
                  </tr>
                  <tr v-if="expandedCraftId === craft.id" class="mobile-detail-row border-t border-cyan-400/20">
                    <td :colspan="sortableCraftColumns.length" class="px-3 py-3">
                      <div class="mobile-row-detail-grid">
                        <div><span>Tons</span><strong>{{ craft.tons }}</strong></div>
                        <div><span>TL</span><strong>{{ craft.techLevel ?? '-' }}</strong></div>
                        <div><span>Thrust</span><strong>{{ craft.thrust }}</strong></div>
                        <div><span>Crew</span><strong>{{ craft.crew }}</strong></div>
                        <div><span>Passengers</span><strong>{{ craft.passengers }}</strong></div>
                        <div><span>Cost</span><strong>{{ formatCredits(craft.costCredits) }}</strong></div>
                        <div class="sm:col-span-2"><span>Role</span><strong>{{ craft.role }}</strong></div>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <aside v-if="selectedCraft" class="hud-panel hud-scrollbar rounded-lg border p-5 shadow-sm xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-auto">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/70">{{ categoryLabel(selectedCraft.category) }}</p>
        <h2 class="mt-2 text-2xl font-semibold">{{ selectedCraft.name }}</h2>
        <p class="mt-2 text-sm text-cyan-100/72">{{ selectedCraft.description }}</p>
        <dl class="mt-5 grid gap-3 text-sm text-cyan-100/78">
          <div class="flex items-center justify-between gap-4"><dt>Tonnage</dt><dd>{{ selectedCraft.tons }} tons</dd></div>
          <div class="flex items-center justify-between gap-4"><dt>Role</dt><dd>{{ selectedCraft.role }}</dd></div>
          <div class="flex items-center justify-between gap-4"><dt>Thrust</dt><dd>{{ selectedCraft.thrust }}</dd></div>
          <div class="flex items-center justify-between gap-4"><dt>Crew</dt><dd>{{ selectedCraft.crew }}</dd></div>
          <div class="flex items-center justify-between gap-4"><dt>Passengers</dt><dd>{{ selectedCraft.passengers }}</dd></div>
          <div class="flex items-center justify-between gap-4"><dt>Cost</dt><dd>{{ formatCredits(selectedCraft.costCredits) }}</dd></div>
        </dl>
        <div v-if="selectedCraft.notes" class="mt-5 rounded-md border border-cyan-400/20 bg-white/5 px-4 py-3">
          <h3 class="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-200/78">Notes</h3>
          <p class="mt-2 text-sm text-cyan-100/78">{{ selectedCraft.notes }}</p>
        </div>
      </aside>
    </section>
  </main>
</template>
