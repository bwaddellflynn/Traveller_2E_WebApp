<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '~/components/AppIcon.vue'
import type { TravellerVehicleWeapon } from '~/types/vehicle'
import type { VehicleBuilderStockWeaponOption } from '~/utils/traveller/vehicles'

const props = defineProps<{
  weapons: TravellerVehicleWeapon[]
  stockWeapons: VehicleBuilderStockWeaponOption[]
}>()

const emit = defineEmits<{
  (event: 'add'): void
  (event: 'add-stock', stockWeaponId: string): void
  (event: 'remove', index: number): void
}>()

const selectedStockWeaponId = ref('')
const selectedStockWeapon = computed(() => props.stockWeapons.find((weapon) => weapon.id === selectedStockWeaponId.value) ?? null)

const weaponSignature = (weapon: TravellerVehicleWeapon) => JSON.stringify([
  weapon.name,
  weapon.range,
  weapon.damage,
  weapon.magazine,
  weapon.fireControl,
  weapon.traits,
])

const stockWeaponFor = (weapon: TravellerVehicleWeapon) => props.stockWeapons.find((stockWeapon) => weaponSignature(stockWeapon.weapon) === weaponSignature(weapon)) ?? null

const weaponEffect = (weapon: TravellerVehicleWeapon) => [
  weapon.damage ? `Damage ${weapon.damage}` : '',
  weapon.range ? `Range ${weapon.range}` : '',
  weapon.fireControl ? `Fire Control ${weapon.fireControl}` : '',
].filter(Boolean).join(' · ')

const addSelectedStockWeapon = () => {
  if (!selectedStockWeaponId.value) return
  emit('add-stock', selectedStockWeaponId.value)
  selectedStockWeaponId.value = ''
}
</script>

<template>
  <div class="grid gap-3 rounded-md border border-cyan-400/20 bg-slate-950/30 p-3">
    <div class="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
      <div>
        <p class="text-sm font-semibold text-cyan-50">Mounted Weapon Loadout</p>
        <label class="mt-2 grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>Stock Weapon</span>
          <select v-model="selectedStockWeaponId" class="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
            <option value="">Choose a mounted weapon</option>
            <option v-for="weapon in props.stockWeapons" :key="weapon.id" :value="weapon.id">
              {{ weapon.label }}
            </option>
          </select>
          <span class="min-h-[1.25rem] text-[11px] font-normal normal-case tracking-normal text-zinc-400">
            <template v-if="selectedStockWeapon">
              TL {{ selectedStockWeapon.sourceTechLevel }} · {{ weaponEffect(selectedStockWeapon.weapon) }}<template v-if="selectedStockWeapon.weapon.traits.length"> · {{ selectedStockWeapon.weapon.traits.join(', ') }}</template>
            </template>
            <template v-else>Pick from existing mounted weapons, or add a custom weapon.</template>
          </span>
        </label>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:border-amber-600 disabled:cursor-not-allowed disabled:opacity-50" :disabled="!selectedStockWeaponId" type="button" @click="addSelectedStockWeapon">
          Mount Stock
        </button>
        <button class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:border-amber-600" type="button" @click="emit('add')">
          Custom
        </button>
      </div>
    </div>

    <div v-if="props.weapons.length" class="grid gap-3">
      <div
        v-for="(weapon, index) in props.weapons"
        :key="`vehicle-weapon-${index}`"
        class="rounded-md border border-cyan-400/20 bg-slate-950/40 p-3"
      >
        <div class="mb-3 flex items-start justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-cyan-50">{{ weapon.name || `Weapon ${index + 1}` }}</p>
            <p class="mt-1 text-[11px] uppercase tracking-wide text-zinc-500">
              <template v-if="stockWeaponFor(weapon)">TL {{ stockWeaponFor(weapon)?.sourceTechLevel }} · {{ stockWeaponFor(weapon)?.sourceVehicle }}</template>
              <template v-else>Custom mount</template>
            </p>
          </div>
          <button class="inline-flex items-center text-red-300 hover:text-red-200" type="button" @click="emit('remove', index)">
            <AppIcon class="h-4 w-4" name="close" />
          </button>
        </div>

        <p v-if="weaponEffect(weapon)" class="mb-3 text-xs leading-5 text-zinc-300">{{ weaponEffect(weapon) }}</p>
        <p v-if="weapon.traits.length" class="mb-3 text-[11px] leading-5 text-cyan-100/80">{{ weapon.traits.join(', ') }}</p>

        <div class="grid gap-3 md:grid-cols-3">
          <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <span>Name</span>
            <input v-model="weapon.name" class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="Weapon name">
          </label>
          <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <span>Range</span>
            <input v-model="weapon.range" class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="Range">
          </label>
          <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <span>Damage</span>
            <input v-model="weapon.damage" class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="Damage">
          </label>
          <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <span>Magazine</span>
            <input v-model="weapon.magazine" class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="Magazine">
          </label>
          <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <span>Cost</span>
            <input v-model="weapon.cost" class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="Cost">
          </label>
          <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <span>Fire Control</span>
            <input v-model="weapon.fireControl" class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="Fire control">
          </label>
          <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <span>Spaces</span>
            <input v-model.number="weapon.spaces" min="0" step="1" type="number" class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="0">
          </label>
          <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 md:col-span-3">
            <span>Traits</span>
            <input
              :value="weapon.traits.join(', ')"
              class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
              placeholder="Comma-separated traits"
              @input="weapon.traits = ($event.target as HTMLInputElement).value.split(',').map((item) => item.trim()).filter(Boolean)"
            >
          </label>
        </div>
      </div>
    </div>

    <p v-else class="rounded-md bg-stone-50 p-3 text-sm text-zinc-600">No vehicle weapons added.</p>
  </div>
</template>
