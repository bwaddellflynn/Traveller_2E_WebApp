<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '~/components/AppIcon.vue'
import type { CustomVehicleDesign } from '~/types/vehicle'
import { vehicleSilhouetteImageClass, vehicleSilhouetteSource } from '~/utils/vehicleBuilderSilhouettes'

const props = defineProps<{
  vehicle: CustomVehicleDesign
  cargoSpaces: number
}>()

const emit = defineEmits<{
  (event: 'add-cargo'): void
  (event: 'remove-cargo', index: number): void
  (event: 'sync-derivations'): void
}>()

const silhouetteSource = computed(() => vehicleSilhouetteSource(props.vehicle.baseFamily))
const silhouetteImageClass = computed(() => vehicleSilhouetteImageClass(props.vehicle.baseFamily))
const cargoTonnes = computed(() => props.vehicle.cargoEntries.reduce((total, entry) => total + Math.max(0, Number(entry.tons ?? 0)), 0))
const remainingSpaces = computed(() => Math.max(0, Number(props.vehicle.spaces ?? 0) - props.cargoSpaces))
const formatNumber = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
const syncCargoTons = (index: number) => {
  const entry = props.vehicle.cargoEntries[index]
  if (!entry) return
  entry.tons = Math.max(0, Number(entry.spaces ?? 0)) * 0.25
  emit('sync-derivations')
}
</script>

<template>
  <section class="overflow-hidden rounded-md border border-cyan-400/30 bg-slate-950/80">
    <div class="vehicle-builder-step-header">
      <div class="vehicle-builder-step-header__inner">
      <div class="vehicle-builder-step-header__title">
        <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200/80">Vehicle Design Step 12</p>
        <h3 class="mt-1 text-xl font-black uppercase tracking-wide text-cyan-50">Cargo & Payload</h3>
      </div>
      <div class="vehicle-builder-step-header__controls">
        <div class="vehicle-builder-step-header__control-row justify-items-start sm:justify-items-end">
          <button class="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-sm font-semibold text-cyan-50 hover:border-cyan-200" type="button" @click="$emit('add-cargo')">
            Add Cargo
          </button>
        </div>
        <p class="vehicle-builder-step-header__message" aria-hidden="true">&nbsp;</p>
      </div>
      </div>
    </div>

    <div class="vehicle-builder-two-panel p-4 sm:p-5">
      <div class="vehicle-builder-panel-card vehicle-builder-visual-card relative flex w-full flex-col bg-slate-900/35 p-5">
        <div
          aria-hidden="true"
          class="pointer-events-none absolute inset-0 opacity-30"
          style="background-image: linear-gradient(rgba(103,232,249,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(103,232,249,0.22) 1px, transparent 1px); background-size: 22px 22px;"
        />
        <div aria-hidden="true" class="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950/95 to-transparent" />
        <div class="vehicle-builder-visual-copy">
          <h4 class="text-3xl font-black uppercase leading-none tracking-wide text-cyan-50">Payload Bay</h4>
          <p class="mt-3 max-w-xl text-sm leading-5 text-zinc-300">
            Reserve internal Spaces for freight, stores, mission payloads, or special load capacity. Cargo spends the same usable design pool needed by systems, armour, occupants, and weapons.
          </p>
        </div>

        <div class="vehicle-builder-visual-summary mt-6 rounded-md border border-cyan-400/20 bg-slate-950/45 p-3">
          <div class="grid grid-cols-3 gap-2">
            <div class="rounded-md border border-cyan-400/20 bg-slate-950/50 p-3">
              <p class="text-[11px] font-black uppercase tracking-wide text-cyan-100/70">Cargo Spaces</p>
              <p class="mt-2 text-xl font-black text-cyan-50">{{ formatNumber(cargoSpaces) }}</p>
            </div>
            <div class="rounded-md border border-cyan-400/20 bg-slate-950/50 p-3">
              <p class="text-[11px] font-black uppercase tracking-wide text-cyan-100/70">Cargo Tonnes</p>
              <p class="mt-2 text-xl font-black text-cyan-50">{{ formatNumber(cargoTonnes) }}</p>
            </div>
            <div class="rounded-md border border-cyan-400/20 bg-slate-950/50 p-3">
              <p class="text-[11px] font-black uppercase tracking-wide text-cyan-100/70">After Cargo</p>
              <p class="mt-2 text-xl font-black text-cyan-50">{{ formatNumber(remainingSpaces) }}</p>
            </div>
          </div>
          <p class="mt-3 text-xs leading-5 text-zinc-400">One vehicle Space is displayed here as 0.25 tonnes for cargo planning.</p>
        </div>

        <img
          :src="silhouetteSource"
          alt=""
          class="vehicle-builder-visual-art pointer-events-none object-contain object-bottom opacity-80 drop-shadow-[0_0_32px_rgba(103,232,249,0.26)]"
          :class="silhouetteImageClass"
          draggable="false"
        >
      </div>

      <div class="vehicle-builder-panel grid content-start gap-5">
        <div class="rounded-md border border-cyan-400/25 bg-slate-950/45 p-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-black uppercase tracking-wide text-cyan-100/70">Payload Records</p>
              <p class="mt-1 text-sm text-zinc-300">Name each cargo pool if the vehicle has multiple mission payload areas.</p>
            </div>
            <p class="text-sm font-black text-cyan-50">{{ formatNumber(cargoSpaces) }} Spaces</p>
          </div>

          <div v-if="vehicle.cargoEntries.length" class="mt-4 grid gap-3">
            <div v-for="(entry, index) in vehicle.cargoEntries" :key="`cargo-${index}`" class="rounded-md border border-cyan-400/20 bg-slate-950/50 p-3">
              <div class="mb-3 flex justify-end">
                <button class="grid h-8 w-8 place-items-center rounded-md border border-red-300/25 text-red-200 hover:border-red-200" type="button" @click="$emit('remove-cargo', index)">
                  <AppIcon class="h-4 w-4" name="close" />
                </button>
              </div>

              <div class="grid gap-3 sm:grid-cols-3">
                <label class="grid gap-1 text-[11px] font-black uppercase tracking-wide text-cyan-100/70">
                  <span>Payload</span>
                  <input v-model="entry.name" class="h-10 min-w-0 rounded-md border border-cyan-400/25 bg-slate-950/70 px-3 text-sm font-normal normal-case tracking-normal text-cyan-50 outline-none focus:border-cyan-200" placeholder="Cargo" @input="$emit('sync-derivations')">
                </label>
                <label class="grid gap-1 text-[11px] font-black uppercase tracking-wide text-cyan-100/70">
                  <span>Spaces</span>
                  <input v-model.number="entry.spaces" min="0" step="1" type="number" class="h-10 min-w-0 rounded-md border border-cyan-400/25 bg-slate-950/70 px-3 text-sm font-normal text-cyan-50 outline-none focus:border-cyan-200" @input="syncCargoTons(index)">
                </label>
                <label class="grid gap-1 text-[11px] font-black uppercase tracking-wide text-cyan-100/70">
                  <span>Tonnes</span>
                  <input :value="formatNumber(entry.tons)" disabled class="h-10 min-w-0 rounded-md border border-cyan-400/15 bg-slate-950/40 px-3 text-sm font-normal text-cyan-100/60 outline-none">
                </label>
              </div>
            </div>
          </div>
          <p v-else class="mt-4 rounded-md border border-cyan-400/20 bg-slate-950/50 p-3 text-sm text-zinc-300">No cargo space reserved.</p>
        </div>

        <div class="rounded-md border border-cyan-400/25 bg-slate-950/45 p-4">
          <p class="text-xs font-black uppercase tracking-wide text-cyan-100/70">Builder Effect</p>
          <div class="mt-3 grid gap-px overflow-hidden rounded-md border border-cyan-400/20">
            <div class="grid grid-cols-[9rem_minmax(0,1fr)] text-sm">
              <div class="bg-cyan-400/20 px-2 py-1 font-black uppercase tracking-wide text-cyan-100">Spaces</div>
              <div class="border-b border-cyan-400/20 px-2 py-1 text-zinc-200">Consumes available vehicle Spaces.</div>
            </div>
            <div class="grid grid-cols-[9rem_minmax(0,1fr)] text-sm">
              <div class="bg-cyan-400/20 px-2 py-1 font-black uppercase tracking-wide text-cyan-100">Display</div>
              <div class="border-b border-cyan-400/20 px-2 py-1 text-zinc-200">Adds cargo capacity to the final vehicle profile.</div>
            </div>
            <div class="grid grid-cols-[9rem_minmax(0,1fr)] text-sm">
              <div class="bg-cyan-400/20 px-2 py-1 font-black uppercase tracking-wide text-cyan-100">Mass</div>
              <div class="border-b border-cyan-400/20 px-2 py-1 text-zinc-200">Displayed as 0.25 tonnes per Space.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
