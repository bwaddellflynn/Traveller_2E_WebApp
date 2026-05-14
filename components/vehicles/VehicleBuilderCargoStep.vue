<script setup lang="ts">
import AppIcon from '~/components/AppIcon.vue'
import type { CustomVehicleDesign } from '~/types/vehicle'

const props = defineProps<{
  vehicle: CustomVehicleDesign
  cargoSpaces: number
}>()

defineEmits<{
  (event: 'add-cargo'): void
  (event: 'remove-cargo', index: number): void
  (event: 'sync-derivations'): void
}>()
</script>

<template>
  <div class="grid gap-4">
    <section class="rounded-md border border-cyan-400/20 bg-slate-950/30 p-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 class="text-sm font-semibold text-cyan-50">Cargo</h3>
          <p class="mt-2 text-xs leading-5 text-zinc-400">
            Reserve space for carried freight, stores, or mission payload. One Space is roughly a quarter displacement ton.
          </p>
        </div>
        <div class="flex items-start gap-2">
          <div class="rounded-md border border-cyan-400/20 bg-slate-950/40 px-3 py-2 text-right">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Reserved</p>
            <p class="mt-1 text-sm font-semibold text-cyan-50">{{ cargoSpaces }} Spaces</p>
          </div>
          <button class="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 hover:border-amber-600" type="button" @click="$emit('add-cargo')">
            Add Cargo
          </button>
        </div>
      </div>
    </section>

    <section class="rounded-md border border-cyan-400/20 bg-slate-950/30 p-4">
      <div v-if="props.vehicle.cargoEntries.length" class="grid gap-3">
        <div
          v-for="(entry, index) in props.vehicle.cargoEntries"
          :key="`vehicle-cargo-${index}`"
          class="rounded-md border border-cyan-400/20 bg-slate-950/40 p-3"
        >
          <div class="mb-3 flex justify-end">
            <button class="inline-flex items-center text-red-300 hover:text-red-200" type="button" @click="$emit('remove-cargo', index)">
              <AppIcon class="h-4 w-4" name="close" />
            </button>
          </div>

          <div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_8rem_8rem]">
            <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <span>Payload</span>
              <input
                v-model="entry.name"
                class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                placeholder="Cargo"
                @input="$emit('sync-derivations')"
              >
            </label>
            <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <span>Spaces</span>
              <input
                v-model.number="entry.spaces"
                min="0"
                step="1"
                type="number"
                class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                @input="$emit('sync-derivations')"
              >
            </label>
            <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <span>Tons</span>
              <input
                v-model.number="entry.tons"
                min="0"
                step="0.25"
                type="number"
                class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                @input="$emit('sync-derivations')"
              >
            </label>
          </div>
        </div>
      </div>

      <p v-else class="rounded-md bg-stone-50 p-3 text-sm text-zinc-600">
        No cargo space reserved.
      </p>
    </section>
  </div>
</template>
