<script setup lang="ts">
import AppIcon from '~/components/AppIcon.vue'
import type { TravellerVehicleWeapon } from '~/types/vehicle'

const props = defineProps<{
  weapons: TravellerVehicleWeapon[]
}>()

const emit = defineEmits<{
  (event: 'add'): void
  (event: 'remove', index: number): void
}>()
</script>

<template>
  <div class="grid gap-3 rounded-md border border-cyan-400/20 bg-slate-950/30 p-3">
    <div class="flex items-center justify-between gap-3">
      <p class="text-sm font-semibold text-cyan-50">Weapons</p>
      <button class="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 hover:border-amber-600" type="button" @click="emit('add')">
        Add Weapon
      </button>
    </div>

    <div v-if="props.weapons.length" class="grid gap-3">
      <div
        v-for="(weapon, index) in props.weapons"
        :key="`vehicle-weapon-${index}`"
        class="rounded-md border border-cyan-400/20 bg-slate-950/40 p-3"
      >
        <div class="mb-3 flex justify-end">
          <button class="inline-flex items-center text-red-300 hover:text-red-200" type="button" @click="emit('remove', index)">
            <AppIcon class="h-4 w-4" name="close" />
          </button>
        </div>

        <div class="grid gap-3 md:grid-cols-2">
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
          <label class="grid gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 md:col-span-2">
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
