<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { TravellerRobotCategory, TravellerRobotEntryType, TravellerRobotRecord } from '~/types/robot'
import { useRobotsStore } from '~/stores/robots'

type RobotSortKey = 'name' | 'entryType' | 'techLevel' | 'category' | 'locomotion' | 'costCredits'
type RobotSortIcon = 'sort-asc' | 'sort-desc'

const robotsStore = useRobotsStore()
const { referenceRobots } = storeToRefs(robotsStore)

const selectedCategory = ref<TravellerRobotCategory | 'all'>('all')
const search = ref('')
const robotSortKey = ref<RobotSortKey>('name')
const robotSortDirection = ref<'asc' | 'desc'>('asc')
const selectedRobotId = ref('')
const expandedRobotId = ref('')
const categoryMenuOpen = ref(false)

const categories: { id: TravellerRobotCategory | 'all', label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'military', label: 'Military' },
  { id: 'service', label: 'Service' },
  { id: 'utility', label: 'Utility' },
  { id: 'brain', label: 'Brains' },
  { id: 'drone', label: 'Drones' },
  { id: 'microbot', label: 'Microbots' },
  { id: 'nanorobot', label: 'Nanorobots' },
  { id: 'android', label: 'Androids' },
  { id: 'biological-robot', label: 'Biological Robots' },
  { id: 'cyborg', label: 'Cyborgs' },
  { id: 'other', label: 'Other' },
]

const sortableRobotColumns: { key: RobotSortKey, label: string }[] = [
  { key: 'name', label: 'Robot' },
  { key: 'entryType', label: 'Type' },
  { key: 'techLevel', label: 'TL' },
  { key: 'category', label: 'Category' },
  { key: 'locomotion', label: 'Locomotion' },
  { key: 'costCredits', label: 'Cost' },
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

const sortReferenceRobots = (robots: TravellerRobotRecord[]) => {
  const direction = robotSortDirection.value === 'asc' ? 1 : -1
  const key = robotSortKey.value
  return [...robots].sort((first, second) => compareValues(first[key], second[key], direction))
}

const filteredReferenceRobots = computed(() => sortReferenceRobots(referenceRobots.value.filter((robot) => {
  const matchesCategory = selectedCategory.value === 'all' || robot.category === selectedCategory.value
  const query = search.value.trim().toLowerCase()
  const matchesSearch = !query || [
    robot.name,
    robot.entryType,
    robot.originCulture,
    robot.summary,
    robot.description,
    robot.programming,
    robot.attacks.join(' '),
    robot.manipulators,
    robot.locomotion,
    robot.skills.join(' '),
    robot.traits.join(' '),
    robot.options.join(' '),
    robot.sourceName,
  ].filter(Boolean).join(' ').toLowerCase().includes(query)

  return matchesCategory && matchesSearch
})))

const selectedRobot = computed(() => {
  if (selectedRobotId.value) return referenceRobots.value.find((robot) => robot.id === selectedRobotId.value) ?? filteredReferenceRobots.value[0] ?? null
  return filteredReferenceRobots.value[0] ?? null
})

watch(filteredReferenceRobots, (robots) => {
  if (!robots.length) {
    selectedRobotId.value = ''
    return
  }
  if (!robots.some((robot) => robot.id === selectedRobotId.value)) selectedRobotId.value = robots[0]?.id ?? ''
}, { immediate: true })

const setRobotSort = (key: RobotSortKey) => {
  if (robotSortKey.value === key) {
    robotSortDirection.value = robotSortDirection.value === 'asc' ? 'desc' : 'asc'
    return
  }
  robotSortKey.value = key
  robotSortDirection.value = 'asc'
}

const toggleExpandedRobot = (robotId: string) => {
  expandedRobotId.value = expandedRobotId.value === robotId ? '' : robotId
  selectedRobotId.value = robotId
}

const selectRobotCategory = (categoryId: TravellerRobotCategory | 'all') => {
  selectedCategory.value = categoryId
  categoryMenuOpen.value = false
}

const robotSortIndicator = (key: RobotSortKey): RobotSortIcon | null => {
  if (robotSortKey.value !== key) return null
  return robotSortDirection.value === 'asc' ? 'sort-asc' : 'sort-desc'
}

const formatCredits = (credits: number | null) => {
  if (credits === null) return '-'
  return credits >= 1000000 ? `MCr${credits / 1000000}` : `Cr${credits.toLocaleString()}`
}

const categoryLabel = (category: string) => category.split('-').map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join(' ')
const entryTypeLabel = (entryType: TravellerRobotEntryType) => entryType.split('-').map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join(' ')
</script>

<template>
  <main class="min-h-screen text-cyan-50">
    <section class="mx-auto grid w-full max-w-[96rem] gap-5 px-5 py-6 sm:px-8 xl:grid-cols-[minmax(0,1fr)_25rem] lg:px-10">
      <div class="grid gap-5">
        <section class="hud-panel rounded-lg border p-5 shadow-sm">
          <div class="list-reference-header flex flex-wrap items-center justify-between gap-3">
            <div class="list-search-actions">
              <input v-model="search" class="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="Search robots">
              <button class="list-category-toggle hud-link h-10 w-11" :aria-expanded="categoryMenuOpen" aria-label="Toggle robot categories" type="button" @click.stop.prevent="categoryMenuOpen = !categoryMenuOpen">
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
              @click="selectRobotCategory(category.id)"
            >
              {{ category.label }}
            </button>
          </div>

          <div class="hud-table-shell hud-scrollbar mt-4 max-h-[46rem] overflow-auto rounded-md border">
            <table class="mobile-collapsible-table w-full min-w-[56rem] text-left text-sm">
              <thead class="sticky top-0 z-10 bg-stone-100 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th v-for="column in sortableRobotColumns" :key="column.key" class="px-3 py-2">
                    <button class="flex items-center gap-1 font-semibold uppercase tracking-wide hover:text-zinc-950" type="button" @click="setRobotSort(column.key)">
                      <span>{{ column.label }}</span>
                      <span class="inline-flex h-4 w-4 items-center text-amber-700">
                        <AppIcon v-if="robotSortIndicator(column.key)" class="h-4 w-4" :name="robotSortIndicator(column.key) ?? 'sort-asc'" />
                      </span>
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                <template v-for="robot in filteredReferenceRobots" :key="robot.id">
                  <tr class="cursor-pointer border-t border-zinc-200 align-top" :class="selectedRobot?.id === robot.id ? 'bg-cyan-50/80' : 'hover:bg-stone-50'" @click="selectedRobotId = robot.id">
                    <td class="px-3 py-2 font-semibold text-zinc-950">
                      <button class="mobile-row-toggle block w-full text-left font-semibold" type="button" @click.stop="toggleExpandedRobot(robot.id)">
                        {{ robot.name }}
                      </button>
                      <span class="mt-1 block text-xs font-medium text-zinc-500">{{ robot.originCulture }} / {{ robot.sourceName ?? robot.sourceId }}<template v-if="robot.sourcePage"> p. {{ robot.sourcePage }}</template></span>
                    </td>
                    <td class="px-3 py-2">{{ entryTypeLabel(robot.entryType) }}</td>
                    <td class="px-3 py-2">{{ robot.techLevel }}</td>
                    <td class="px-3 py-2">{{ categoryLabel(robot.category) }}</td>
                    <td class="px-3 py-2">{{ robot.locomotion }}</td>
                    <td class="px-3 py-2">{{ formatCredits(robot.costCredits) }}</td>
                  </tr>
                  <tr v-if="expandedRobotId === robot.id" class="mobile-detail-row border-t border-cyan-400/20">
                    <td :colspan="sortableRobotColumns.length" class="px-3 py-3">
                    <div class="mobile-row-detail-grid">
                        <div><span>Type</span><strong>{{ entryTypeLabel(robot.entryType) }}</strong></div>
                        <div><span>TL</span><strong>{{ robot.techLevel }}</strong></div>
                        <div><span>Locomotion</span><strong>{{ robot.locomotion }}</strong></div>
                        <div><span>Origin</span><strong>{{ robot.originCulture }}</strong></div>
                        <div><span>Speed</span><strong>{{ robot.speed }}</strong></div>
                        <div><span>Hits</span><strong>{{ robot.hits ?? '-' }}</strong></div>
                        <div><span>Cost</span><strong>{{ formatCredits(robot.costCredits) }}</strong></div>
                        <div><span>Endurance</span><strong>{{ robot.endurance }}</strong></div>
                        <div class="sm:col-span-2"><span>Programming</span><strong>{{ robot.programming }}</strong></div>
                        <div class="sm:col-span-2"><span>Traits</span><strong>{{ robot.traits.join(', ') || '-' }}</strong></div>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <aside v-if="selectedRobot" class="hud-panel hud-scrollbar rounded-lg border p-5 shadow-sm xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-auto">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/70">{{ categoryLabel(selectedRobot.category) }} / {{ entryTypeLabel(selectedRobot.entryType) }}</p>
        <h2 class="mt-2 text-2xl font-semibold">{{ selectedRobot.name }}</h2>
        <p class="mt-2 text-sm text-cyan-100/72">{{ selectedRobot.summary }}</p>
        <p class="mt-3 text-sm text-cyan-100/78">{{ selectedRobot.description }}</p>
        <dl class="mt-5 grid gap-3 text-sm text-cyan-100/78">
          <div class="flex items-center justify-between gap-4"><dt>Origin</dt><dd>{{ selectedRobot.originCulture }}</dd></div>
          <div class="flex items-center justify-between gap-4"><dt>Source</dt><dd>{{ selectedRobot.sourceName ?? selectedRobot.sourceId }}<template v-if="selectedRobot.sourcePage"> p. {{ selectedRobot.sourcePage }}</template></dd></div>
          <div class="flex items-center justify-between gap-4"><dt>TL</dt><dd>{{ selectedRobot.techLevel }}</dd></div>
          <div class="flex items-center justify-between gap-4"><dt>Locomotion</dt><dd>{{ selectedRobot.locomotion }}</dd></div>
          <div class="flex items-center justify-between gap-4"><dt>Speed</dt><dd>{{ selectedRobot.speed }}</dd></div>
          <div class="flex items-center justify-between gap-4"><dt>Hits</dt><dd>{{ selectedRobot.hits ?? '-' }}</dd></div>
          <div class="flex items-center justify-between gap-4"><dt>Cost</dt><dd>{{ formatCredits(selectedRobot.costCredits) }}</dd></div>
          <div class="flex items-center justify-between gap-4"><dt>Endurance</dt><dd>{{ selectedRobot.endurance }}</dd></div>
          <div class="flex items-center justify-between gap-4"><dt>Manipulators</dt><dd class="text-right">{{ selectedRobot.manipulators }}</dd></div>
          <div class="flex items-center justify-between gap-4"><dt>Programming</dt><dd class="text-right">{{ selectedRobot.programming }}</dd></div>
        </dl>
        <div class="mt-5 grid gap-4">
          <div class="rounded-md border border-cyan-400/20 bg-white/5 px-4 py-3">
            <h3 class="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-200/78">Attacks</h3>
            <p class="mt-2 text-sm text-cyan-100/78">{{ selectedRobot.attacks.join(', ') || '—' }}</p>
          </div>
          <div class="rounded-md border border-cyan-400/20 bg-white/5 px-4 py-3">
            <h3 class="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-200/78">Skills</h3>
            <p class="mt-2 text-sm text-cyan-100/78">{{ selectedRobot.skills.join(', ') || '—' }}</p>
          </div>
          <div class="rounded-md border border-cyan-400/20 bg-white/5 px-4 py-3">
            <h3 class="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-200/78">Traits</h3>
            <p class="mt-2 text-sm text-cyan-100/78">{{ selectedRobot.traits.join(', ') || '—' }}</p>
          </div>
          <div class="rounded-md border border-cyan-400/20 bg-white/5 px-4 py-3">
            <h3 class="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-200/78">Options</h3>
            <p class="mt-2 text-sm text-cyan-100/78">{{ selectedRobot.options.join(', ') || '—' }}</p>
          </div>
          <div v-if="selectedRobot.notes" class="rounded-md border border-cyan-400/20 bg-white/5 px-4 py-3">
            <h3 class="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-200/78">Notes</h3>
            <p class="mt-2 text-sm text-cyan-100/78">{{ selectedRobot.notes }}</p>
          </div>
        </div>
      </aside>
    </section>
  </main>
</template>
