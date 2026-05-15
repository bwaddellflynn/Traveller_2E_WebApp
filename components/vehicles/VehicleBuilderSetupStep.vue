<script setup lang="ts">
import { computed } from 'vue'
import type { CustomVehicleDesign } from '~/types/vehicle'

const props = defineProps<{
  vehicle: CustomVehicleDesign
}>()

const emit = defineEmits<{
  (event: 'sync-derivations'): void
}>()

const roleOptions = ['Civilian', 'Military', 'Industrial', 'Exploration', 'Transport', 'Utility', 'Emergency', 'Security']
const environmentOptions = ['Ground', 'Air', 'Water', 'Underwater', 'Grav', 'Vacuum', 'Hostile Atmosphere', 'Urban', 'Wilderness']
const combatOptions = ['Unarmed', 'Lightly Armed', 'Defensive', 'Combat Vehicle', 'Front-Line Combatant']

const brief = computed(() => {
  props.vehicle.buildBrief ??= {
    role: '',
    environment: '',
    combatLevel: '',
    crewTarget: '',
    passengerTarget: '',
    cargoTarget: '',
    budgetTarget: '',
  }
  return props.vehicle.buildBrief
})
</script>

<template>
  <section class="overflow-hidden rounded-md border border-cyan-400/30 bg-slate-950/80">
    <div class="grid min-h-[5.75rem] gap-3 border-b border-cyan-400/25 bg-cyan-950/55 px-5 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div>
        <p class="text-xs font-black uppercase tracking-[0.22em] text-cyan-100/70">Vehicle Design Step</p>
        <h3 class="mt-2 text-2xl font-black uppercase leading-none tracking-wide text-cyan-50">Setup</h3>
      </div>
      <p class="max-w-sm text-sm leading-5 text-cyan-100/75">
        Define the build brief before choosing the handbook mechanics.
      </p>
    </div>

    <div class="grid min-h-[38rem] gap-6 p-4 sm:p-5 lg:grid-cols-[minmax(20rem,0.8fr)_minmax(0,1fr)]">
      <div class="relative flex h-[35.75rem] min-h-[35.75rem] w-full min-w-0 flex-col overflow-hidden rounded-md border border-cyan-400/20 bg-slate-900/35 p-5">
        <div
          aria-hidden="true"
          class="pointer-events-none absolute inset-0 opacity-30"
          style="background-image: linear-gradient(rgba(103,232,249,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(103,232,249,0.22) 1px, transparent 1px); background-size: 22px 22px;"
        />
        <div aria-hidden="true" class="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950/95 to-transparent" />
        <div class="relative z-10">
          <h4 class="text-3xl font-black uppercase leading-none tracking-wide text-cyan-50">Build Brief</h4>
          <p class="mt-3 max-w-xl text-sm leading-5 text-zinc-300">
            The brief gives the builder a target. It does not spend Spaces or Credits, but it makes the final review easier to judge against the vehicle’s intended job.
          </p>
        </div>

        <div class="relative z-10 mt-6 grid gap-3 rounded-md border border-cyan-400/20 bg-slate-950/45 p-3">
          <div class="rounded-md border border-cyan-400/20 bg-slate-950/50 p-4">
            <p class="text-[11px] font-black uppercase tracking-wide text-cyan-100/70">Current Brief</p>
            <p class="mt-2 text-xl font-black uppercase leading-snug text-cyan-50">{{ vehicle.name || 'Unnamed Vehicle' }}</p>
            <p class="mt-2 text-sm leading-5 text-zinc-300">
              {{ [brief.role, brief.environment, brief.combatLevel].filter(Boolean).join(' / ') || 'No role, environment, or combat target selected.' }}
            </p>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="rounded-md border border-cyan-400/20 bg-slate-950/50 p-3">
              <p class="text-[11px] font-black uppercase tracking-wide text-cyan-100/70">Crew</p>
              <p class="mt-2 text-lg font-black text-cyan-50">{{ brief.crewTarget || '-' }}</p>
            </div>
            <div class="rounded-md border border-cyan-400/20 bg-slate-950/50 p-3">
              <p class="text-[11px] font-black uppercase tracking-wide text-cyan-100/70">Passengers</p>
              <p class="mt-2 text-lg font-black text-cyan-50">{{ brief.passengerTarget || '-' }}</p>
            </div>
            <div class="rounded-md border border-cyan-400/20 bg-slate-950/50 p-3">
              <p class="text-[11px] font-black uppercase tracking-wide text-cyan-100/70">Cargo</p>
              <p class="mt-2 text-lg font-black text-cyan-50">{{ brief.cargoTarget || '-' }}</p>
            </div>
            <div class="rounded-md border border-cyan-400/20 bg-slate-950/50 p-3">
              <p class="text-[11px] font-black uppercase tracking-wide text-cyan-100/70">Budget</p>
              <p class="mt-2 text-lg font-black text-cyan-50">{{ brief.budgetTarget || '-' }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid min-h-[35.75rem] min-w-0 content-start gap-5">
        <div class="min-w-0 rounded-md border border-cyan-400/25 bg-slate-950/45 p-4">
          <label class="grid gap-1 text-[11px] font-black uppercase tracking-wide text-cyan-100/70">
            <span>Vehicle Name</span>
            <input
              v-model="vehicle.name"
              class="h-11 min-w-0 rounded-md border border-cyan-400/25 bg-slate-950/70 px-3 text-base font-semibold normal-case tracking-normal text-cyan-50 outline-none focus:border-cyan-200"
              placeholder="Unnamed Vehicle"
              @input="emit('sync-derivations')"
            >
          </label>
        </div>

        <div class="grid gap-4 rounded-md border border-cyan-400/25 bg-slate-950/45 p-4 xl:grid-cols-3">
          <label class="grid gap-1 text-[11px] font-black uppercase tracking-wide text-cyan-100/70">
            <span>Role</span>
            <select v-model="brief.role" class="h-10 min-w-0 rounded-md border border-cyan-400/25 bg-slate-950/70 px-3 text-sm font-normal normal-case tracking-normal text-cyan-50 outline-none focus:border-cyan-200">
              <option value="">-</option>
              <option v-for="option in roleOptions" :key="option">{{ option }}</option>
            </select>
          </label>
          <label class="grid gap-1 text-[11px] font-black uppercase tracking-wide text-cyan-100/70">
            <span>Environment</span>
            <select v-model="brief.environment" class="h-10 min-w-0 rounded-md border border-cyan-400/25 bg-slate-950/70 px-3 text-sm font-normal normal-case tracking-normal text-cyan-50 outline-none focus:border-cyan-200">
              <option value="">-</option>
              <option v-for="option in environmentOptions" :key="option">{{ option }}</option>
            </select>
          </label>
          <label class="grid gap-1 text-[11px] font-black uppercase tracking-wide text-cyan-100/70">
            <span>Combat Target</span>
            <select v-model="brief.combatLevel" class="h-10 min-w-0 rounded-md border border-cyan-400/25 bg-slate-950/70 px-3 text-sm font-normal normal-case tracking-normal text-cyan-50 outline-none focus:border-cyan-200">
              <option value="">-</option>
              <option v-for="option in combatOptions" :key="option">{{ option }}</option>
            </select>
          </label>
        </div>

        <div class="grid gap-4 rounded-md border border-cyan-400/25 bg-slate-950/45 p-4 md:grid-cols-2">
          <label class="grid gap-1 text-[11px] font-black uppercase tracking-wide text-cyan-100/70">
            <span>Crew Target</span>
            <input v-model="brief.crewTarget" class="h-10 min-w-0 rounded-md border border-cyan-400/25 bg-slate-950/70 px-3 text-sm font-normal normal-case tracking-normal text-cyan-50 outline-none focus:border-cyan-200" placeholder="e.g. 2 crew">
          </label>
          <label class="grid gap-1 text-[11px] font-black uppercase tracking-wide text-cyan-100/70">
            <span>Passenger Target</span>
            <input v-model="brief.passengerTarget" class="h-10 min-w-0 rounded-md border border-cyan-400/25 bg-slate-950/70 px-3 text-sm font-normal normal-case tracking-normal text-cyan-50 outline-none focus:border-cyan-200" placeholder="e.g. 6 passengers">
          </label>
          <label class="grid gap-1 text-[11px] font-black uppercase tracking-wide text-cyan-100/70">
            <span>Cargo Target</span>
            <input v-model="brief.cargoTarget" class="h-10 min-w-0 rounded-md border border-cyan-400/25 bg-slate-950/70 px-3 text-sm font-normal normal-case tracking-normal text-cyan-50 outline-none focus:border-cyan-200" placeholder="e.g. 20 Spaces">
          </label>
          <label class="grid gap-1 text-[11px] font-black uppercase tracking-wide text-cyan-100/70">
            <span>Budget Target</span>
            <input v-model="brief.budgetTarget" class="h-10 min-w-0 rounded-md border border-cyan-400/25 bg-slate-950/70 px-3 text-sm font-normal normal-case tracking-normal text-cyan-50 outline-none focus:border-cyan-200" placeholder="e.g. MCr2">
          </label>
        </div>
      </div>
    </div>
  </section>
</template>
