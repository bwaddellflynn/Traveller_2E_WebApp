<script setup lang="ts">
import AppIcon from '~/components/AppIcon.vue'
import type { CustomVehicleEquipmentEntry } from '~/types/vehicle'

const props = defineProps<{
  items: CustomVehicleEquipmentEntry[]
  suggestions?: string[]
}>()

const emit = defineEmits<{
  (event: 'add'): void
  (event: 'remove', index: number): void
}>()
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
            <span>Name</span>
            <input
              v-model="item.name"
              :list="suggestions?.length ? 'vehicle-builder-equipment-suggestions' : undefined"
              class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
              placeholder="Equipment name"
            >
          </label>
          <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <span>Spaces</span>
            <input v-model.number="item.spaces" min="0" step="1" type="number" class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
          </label>
        </div>
      </div>
    </div>

    <p v-else class="rounded-md bg-stone-50 p-3 text-sm text-zinc-600">No equipment added.</p>

    <datalist v-if="props.suggestions?.length" id="vehicle-builder-equipment-suggestions">
      <option v-for="option in props.suggestions" :key="option" :value="option" />
    </datalist>
  </div>
</template>
