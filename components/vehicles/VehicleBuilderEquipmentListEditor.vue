<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import AppIcon from '~/components/AppIcon.vue'
import type { CustomVehicleEquipmentEntry } from '~/types/vehicle'
import type { VehicleBuilderEquipmentCategoryGroup } from '~/utils/traveller/vehicles'

const props = defineProps<{
  items: CustomVehicleEquipmentEntry[]
  library: VehicleBuilderEquipmentCategoryGroup[]
}>()

const emit = defineEmits<{
  (event: 'add', catalogueId?: string): void
  (event: 'remove', index: number): void
}>()

const selectedOptionId = ref('')
const allLibraryItems = computed(() => props.library.flatMap((group) => group.items))
const selectedOption = computed(() => allLibraryItems.value.find((entry) => entry.id === selectedOptionId.value) ?? null)
const groupedLibraryChapters = computed(() => {
  const chapters = new Map<string, {
    id: string
    label: string
    description: string
    order: number
    groups: VehicleBuilderEquipmentCategoryGroup[]
  }>()

  for (const group of props.library) {
    const existing = chapters.get(group.chapterId) ?? {
      id: group.chapterId,
      label: group.chapterLabel,
      description: group.chapterDescription,
      order: group.chapterOrder,
      groups: [],
    }
    existing.groups.push(group)
    chapters.set(group.chapterId, existing)
  }

  return [...chapters.values()]
    .map((chapter) => ({
      ...chapter,
      groups: chapter.groups.sort((left, right) => left.label.localeCompare(right.label, undefined, { sensitivity: 'base' })),
    }))
    .sort((left, right) => left.order - right.order)
})

const selectedCategoryFor = (item: CustomVehicleEquipmentEntry) => item.category || ''

const selectedLibraryItemIdFor = (item: CustomVehicleEquipmentEntry) => item.catalogueId || ''

const itemsForCategory = (categoryId: string) => props.library.find((group) => group.id === categoryId)?.items ?? []

const selectedLibraryItemFor = (item: CustomVehicleEquipmentEntry) => (
  item.catalogueId
    ? allLibraryItems.value.find((entry) => entry.id === item.catalogueId) ?? null
    : null
)

watchEffect(() => {
  for (const item of props.items) {
    if (item.catalogueId && item.category) continue
    const matchedItem = allLibraryItems.value.find((entry) => entry.id === item.catalogueId || entry.name === item.name)
    if (!matchedItem) continue
    if (!item.category) item.category = matchedItem.category
    if (!item.catalogueId) item.catalogueId = matchedItem.id
  }
})

const updateEquipmentCategory = (item: CustomVehicleEquipmentEntry, categoryId: string) => {
  item.category = categoryId
  item.catalogueId = ''
  item.name = ''
}

const updateEquipmentSelection = (item: CustomVehicleEquipmentEntry, catalogueId: string) => {
  const selected = allLibraryItems.value.find((entry) => entry.id === catalogueId)
  if (!selected) {
    item.catalogueId = ''
    item.name = ''
    return
  }

  item.catalogueId = selected.id
  item.category = selected.category
  item.name = selected.name
}

const addSelectedOption = () => {
  if (!selectedOptionId.value) return
  emit('add', selectedOptionId.value)
  selectedOptionId.value = ''
}
</script>

<template>
  <div class="grid gap-3 rounded-md border border-cyan-400/20 bg-slate-950/30 p-3">
    <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
      <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        <span>Option</span>
        <select v-model="selectedOptionId" class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
          <option value="">Choose an option to install</option>
          <optgroup v-for="chapter in groupedLibraryChapters" :key="chapter.id" :label="chapter.label">
            <template v-for="group in chapter.groups" :key="group.id">
              <option v-for="entry in group.items" :key="entry.id" :value="entry.id">
                {{ entry.label }}
              </option>
            </template>
          </optgroup>
        </select>
        <span class="min-h-[1.25rem] text-[11px] font-normal normal-case tracking-normal text-zinc-400">
          <template v-if="selectedOption">
            {{ selectedOption.categoryLabel }}<template v-if="selectedOption.techLevel !== null"> · TL {{ selectedOption.techLevel }}</template> · {{ selectedOption.effect || 'Vehicle option.' }}
          </template>
          <template v-else>Pick from the Handbook option library, then install it as a compact card.</template>
        </span>
      </label>
      <div class="flex flex-wrap gap-2">
        <button class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:border-amber-600 disabled:cursor-not-allowed disabled:opacity-50" :disabled="!selectedOptionId" type="button" @click="addSelectedOption">
          Install Option
        </button>
        <button class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:border-amber-600" type="button" @click="emit('add')">
          Custom
        </button>
      </div>
    </div>

    <div v-if="props.items.length" class="grid gap-3">
      <div
        v-for="(item, index) in props.items"
        :key="`vehicle-equipment-${index}`"
        class="rounded-md border border-cyan-400/20 bg-slate-950/40 p-3"
      >
        <div class="mb-3 flex items-start justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-cyan-50">{{ selectedLibraryItemFor(item)?.name || item.name || 'Custom Option' }}</p>
            <p class="mt-1 text-[11px] uppercase tracking-wide text-zinc-500">
              {{ selectedLibraryItemFor(item)?.categoryLabel || props.library.find((group) => group.id === item.category)?.label || 'Manual entry' }}<span v-if="selectedLibraryItemFor(item)?.techLevel !== null && selectedLibraryItemFor(item)?.techLevel !== undefined"> · TL {{ selectedLibraryItemFor(item)?.techLevel }}</span>
            </p>
          </div>
          <button class="inline-flex items-center text-red-300 hover:text-red-200" type="button" @click="emit('remove', index)">
            <AppIcon class="h-4 w-4" name="close" />
          </button>
        </div>

        <p v-if="selectedLibraryItemFor(item)?.effect" class="mb-3 text-xs leading-5 text-zinc-300">
          {{ selectedLibraryItemFor(item)?.effect }}
        </p>
        <p v-if="selectedLibraryItemFor(item)?.traits.length" class="mb-3 text-[11px] leading-5 text-cyan-100/80">
          {{ selectedLibraryItemFor(item)?.traits.join(', ') }}
        </p>

        <div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_8rem]">
          <label v-if="!selectedLibraryItemFor(item)" class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <span>Option Category</span>
            <select
              :value="item.category || ''"
              class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
              @change="updateEquipmentCategory(item, ($event.target as HTMLSelectElement).value)"
            >
              <option value="">Select option category</option>
              <optgroup v-for="chapter in groupedLibraryChapters" :key="chapter.id" :label="chapter.label">
                <option v-for="group in chapter.groups" :key="group.id" :value="group.id">{{ group.label }}</option>
              </optgroup>
            </select>
            <span v-if="item.category" class="text-[11px] font-normal normal-case tracking-normal text-zinc-400">
              {{ props.library.find((group) => group.id === item.category)?.description }}
            </span>
          </label>
          <label v-if="!selectedLibraryItemFor(item)" class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <span>Installed Option</span>
            <select
              :value="item.catalogueId || ''"
              class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
              @change="updateEquipmentSelection(item, ($event.target as HTMLSelectElement).value)"
            >
              <option value="">{{ item.category ? 'Select option' : 'Choose category first' }}</option>
              <option v-for="entry in itemsForCategory(item.category || '')" :key="entry.id" :value="entry.id">
                {{ entry.label }}
              </option>
            </select>
          </label>
          <label v-if="!selectedLibraryItemFor(item)" class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 md:col-span-2">
            <span>Name</span>
            <input v-model="item.name" class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="Custom option name">
          </label>
          <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500" :class="selectedLibraryItemFor(item) ? 'md:col-span-1' : ''">
            <span>Spaces</span>
            <input v-model.number="item.spaces" min="0" step="1" type="number" class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
          </label>
          <p v-if="selectedLibraryItemFor(item)" class="self-end text-[11px] uppercase tracking-wide text-zinc-500 md:col-span-2">
            {{ selectedLibraryItemFor(item)?.sourceName }}<span v-if="selectedLibraryItemFor(item)?.sourcePage"> · p. {{ selectedLibraryItemFor(item)?.sourcePage }}</span>
          </p>
        </div>
      </div>
    </div>

    <p v-else class="rounded-md bg-stone-50 p-3 text-sm text-zinc-600">No installed options added.</p>
  </div>
</template>
