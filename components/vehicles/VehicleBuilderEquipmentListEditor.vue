<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import AppIcon from '~/components/AppIcon.vue'
import type { CustomVehicleEquipmentEntry } from '~/types/vehicle'
import type { VehicleBuilderEquipmentCategoryGroup } from '~/utils/traveller/vehicles'

const props = defineProps<{
  items: CustomVehicleEquipmentEntry[]
  library: VehicleBuilderEquipmentCategoryGroup[]
}>()

const emit = defineEmits<{
  (event: 'add'): void
  (event: 'remove', index: number): void
}>()

const allLibraryItems = computed(() => props.library.flatMap((group) => group.items))

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
</script>

<template>
  <div class="grid gap-3 rounded-md border border-cyan-400/20 bg-slate-950/30 p-3">
    <div class="flex items-center justify-between gap-3">
      <p class="text-sm font-semibold text-cyan-50">Equipment</p>
      <button class="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 hover:border-amber-600" type="button" @click="emit('add')">
        Add Equipment
      </button>
    </div>

    <div v-if="props.items.length" class="grid gap-3">
      <div
        v-for="(item, index) in props.items"
        :key="`vehicle-equipment-${index}`"
        class="rounded-md border border-cyan-400/20 bg-slate-950/40 p-3"
      >
        <div class="mb-3 flex justify-end">
          <button class="inline-flex items-center text-red-300 hover:text-red-200" type="button" @click="emit('remove', index)">
            <AppIcon class="h-4 w-4" name="close" />
          </button>
        </div>

        <div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_8rem]">
          <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <span>Category</span>
            <select
              :value="item.category || ''"
              class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
              @change="updateEquipmentCategory(item, ($event.target as HTMLSelectElement).value)"
            >
              <option value="">Select category</option>
              <option v-for="group in props.library" :key="group.id" :value="group.id">{{ group.label }}</option>
            </select>
          </label>
          <label class="group relative grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 md:col-span-2">
            <span>Equipment</span>
            <select
              :value="item.catalogueId || ''"
              class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
              @change="updateEquipmentSelection(item, ($event.target as HTMLSelectElement).value)"
            >
              <option value="">{{ item.category ? 'Select equipment' : 'Choose category first' }}</option>
              <option v-for="entry in itemsForCategory(item.category || '')" :key="entry.id" :value="entry.id">
                {{ entry.label }}
              </option>
            </select>
            <span v-if="selectedLibraryItemFor(item)" class="text-[11px] font-normal normal-case tracking-normal text-zinc-400">
              {{ selectedLibraryItemFor(item)?.effect || 'Selected equipment will be carried into the vehicle draft.' }}
            </span>
            <div v-if="selectedLibraryItemFor(item)" class="pointer-events-none absolute left-0 top-full z-20 mt-2 w-[26rem] opacity-0 transition duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
              <div class="rounded-md border border-cyan-300/35 bg-slate-950/95 px-3 py-3 shadow-[0_0_24px_rgba(34,211,238,0.18)] backdrop-blur-sm">
                <p class="text-[11px] font-semibold uppercase tracking-wide text-cyan-100">{{ selectedLibraryItemFor(item)?.name }}</p>
                <p class="mt-1 text-[11px] uppercase tracking-wide text-zinc-500">
                  {{ selectedLibraryItemFor(item)?.categoryLabel }}<span v-if="selectedLibraryItemFor(item)?.techLevel !== null"> · TL {{ selectedLibraryItemFor(item)?.techLevel }}</span>
                </p>
                <p class="mt-2 text-xs leading-5 text-zinc-300">
                  {{ selectedLibraryItemFor(item)?.effect }}
                </p>
                <p v-if="selectedLibraryItemFor(item)?.traits.length" class="mt-2 text-[11px] leading-5 text-cyan-100/80">
                  {{ selectedLibraryItemFor(item)?.traits.join(', ') }}
                </p>
                <p class="mt-2 text-[11px] uppercase tracking-wide text-zinc-500">
                  {{ selectedLibraryItemFor(item)?.sourceName }}<span v-if="selectedLibraryItemFor(item)?.sourcePage"> · p. {{ selectedLibraryItemFor(item)?.sourcePage }}</span>
                </p>
              </div>
            </div>
          </label>
          <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <span>Spaces</span>
            <input v-model.number="item.spaces" min="0" step="1" type="number" class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
          </label>
        </div>
      </div>
    </div>

    <p v-else class="rounded-md bg-stone-50 p-3 text-sm text-zinc-600">No equipment added.</p>
  </div>
</template>
