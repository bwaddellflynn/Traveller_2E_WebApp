<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppIcon from '~/components/AppIcon.vue'
import type { CustomVehicleDesign, TravellerVehicleWeapon } from '~/types/vehicle'
import {
  vehicleWeaponBaseSpaces,
  vehicleWeaponFireControlRuleFor,
  vehicleWeaponFireControlRules,
  vehicleWeaponInstalledSpaces,
  vehicleWeaponMountRuleFor,
  vehicleWeaponMountRules,
} from '~/utils/traveller/vehicles'
import { vehicleSilhouetteImageClass, vehicleSilhouetteSource } from '~/utils/vehicleBuilderSilhouettes'

type HandbookWeaponOption = {
  id: string
  category: string
  name: string
  techLevel: number
  range: string
  damage: string
  tons: string
  spaces: number
  cost: string
  power: string
  traits: string[]
  magazine?: string
  crew?: string
  loaders?: string
}

const props = defineProps<{
  vehicle: CustomVehicleDesign
  weaponSpaces: number
}>()

const emit = defineEmits<{
  (event: 'add-weapon'): void
  (event: 'add-handbook-weapon', weapon: TravellerVehicleWeapon): void
  (event: 'remove-weapon', index: number): void
  (event: 'sync-derivations'): void
}>()

const mountRules = vehicleWeaponMountRules
const fireControlRules = vehicleWeaponFireControlRules

const handbookWeapons: HandbookWeaponOption[] = [
  { id: 'machinegun-light', category: 'Direct Fire', name: 'Machinegun (light)', techLevel: 4, range: '0.4 km', damage: '3D', tons: '0.014', spaces: 1, cost: 'Cr1200', power: '-', traits: ['Auto 3'], magazine: '100', crew: '1', loaders: '1' },
  { id: 'machinegun-medium', category: 'Direct Fire', name: 'Machinegun (medium)', techLevel: 5, range: '0.6 km', damage: '4D', tons: '0.05', spaces: 1, cost: 'Cr3000', power: '-', traits: ['Auto 3'], magazine: '100', crew: '1', loaders: '1' },
  { id: 'machinegun-heavy', category: 'Direct Fire', name: 'Machinegun (heavy)', techLevel: 5, range: '1 km', damage: '5D', tons: '0.1', spaces: 1, cost: 'Cr4500', power: '-', traits: ['Auto 3'], magazine: '100', crew: '1', loaders: '1' },
  { id: 'autocannon-light', category: 'Direct Fire', name: 'Autocannon (light)', techLevel: 6, range: '1 km', damage: '6D', tons: '0.25', spaces: 1, cost: 'Cr10000', power: 'P', traits: ['Auto 3'], magazine: '500', crew: '1', loaders: '1' },
  { id: 'autocannon-medium', category: 'Direct Fire', name: 'Autocannon (medium)', techLevel: 6, range: '1 km', damage: '8D', tons: '0.5', spaces: 2, cost: 'Cr25000', power: 'P', traits: ['Auto 3'], magazine: '100', crew: '1', loaders: '1' },
  { id: 'autocannon-heavy', category: 'Direct Fire', name: 'Autocannon (heavy)', techLevel: 7, range: '1 km', damage: '1DD', tons: '1', spaces: 4, cost: 'Cr45000', power: 'P', traits: ['Auto 3'], magazine: '100', crew: '1', loaders: '1' },
  { id: 'cannon-light', category: 'Direct Fire', name: 'Cannon (light)', techLevel: 5, range: '1.5 km', damage: '6D', tons: '0.5', spaces: 2, cost: 'Cr100000', power: '-', traits: ['Blast 6'], magazine: '1', crew: '1', loaders: '1' },
  { id: 'cannon-medium', category: 'Direct Fire', name: 'Cannon (medium)', techLevel: 6, range: '2 km', damage: '1DD', tons: '1', spaces: 4, cost: 'Cr200000', power: '-', traits: ['Blast 10'], magazine: '1', crew: '1', loaders: '1' },
  { id: 'cannon-heavy', category: 'Direct Fire', name: 'Cannon (heavy)', techLevel: 7, range: '3 km', damage: '2DD', tons: '2', spaces: 8, cost: 'Cr300000', power: '-', traits: ['Blast 10'], magazine: '1', crew: '1', loaders: '1' },
  { id: 'gauss-cannon-light', category: 'Direct Fire', name: 'Gauss Cannon (light)', techLevel: 12, range: '1 km', damage: '6D', tons: '0.5', spaces: 2, cost: 'Cr60000', power: 'P', traits: ['AP 5', 'Auto 3'], magazine: '200', crew: '1', loaders: '1' },
  { id: 'railgun-light', category: 'Direct Fire', name: 'Railgun (light)', techLevel: 9, range: '5 km', damage: '1DD', tons: '0.5', spaces: 2, cost: 'Cr500000', power: 'F', traits: ['AP 30', 'Scope'], magazine: '50', crew: '1', loaders: '1' },
  { id: 'railgun-medium', category: 'Direct Fire', name: 'Railgun (medium)', techLevel: 10, range: '10 km', damage: '2DD', tons: '1', spaces: 4, cost: 'MCr1', power: 'F2', traits: ['AP 40', 'Scope'], magazine: '50', crew: '1', loaders: '1' },
  { id: 'railgun-heavy', category: 'Direct Fire', name: 'Railgun (heavy)', techLevel: 10, range: '20 km', damage: '3DD', tons: '2', spaces: 8, cost: 'MCr1.5', power: 'F3', traits: ['AP 45', 'Scope'], magazine: '50', crew: '1', loaders: '1' },
  { id: 'mortar-light', category: 'Artillery', name: 'Mortar (light)', techLevel: 4, range: '1 km', damage: '5D', tons: '0.03', spaces: 1, cost: 'Cr3500', power: '-', traits: ['Artillery', 'Blast 5'], magazine: '1', crew: '2', loaders: '1' },
  { id: 'mortar-heavy', category: 'Artillery', name: 'Mortar (heavy)', techLevel: 4, range: '3 km', damage: '9D', tons: '0.25', spaces: 1, cost: 'Cr11000', power: '-', traits: ['Artillery', 'Blast 8'], magazine: '1', crew: '2', loaders: '2' },
  { id: 'field-gun-light', category: 'Artillery', name: 'Field Gun (light)', techLevel: 4, range: '9 km', damage: '8D', tons: '2', spaces: 8, cost: 'Cr75000', power: '-', traits: ['AP 5', 'Artillery', 'Blast 10'], magazine: '1', crew: '2', loaders: '3' },
  { id: 'howitzer-medium', category: 'Artillery', name: 'Howitzer (medium)', techLevel: 5, range: '9 km', damage: '9D', tons: '5', spaces: 20, cost: 'Cr75000', power: '-', traits: ['Artillery', 'Blast 12'], magazine: '1', crew: '2', loaders: '4' },
  { id: 'mass-driver-light', category: 'Artillery', name: 'Mass Driver (light)', techLevel: 9, range: '20 km', damage: '8D', tons: '4', spaces: 16, cost: 'Cr300000', power: 'P', traits: ['Artillery', 'Blast 8'], magazine: '1', crew: '1', loaders: '2' },
  { id: 'laser-cannon-light', category: 'Energy', name: 'Laser Cannon (light)', techLevel: 8, range: '2 km', damage: '5D', tons: '0.25', spaces: 1, cost: 'Cr50000', power: 'P', traits: ['AP 3'], crew: '1', loaders: '0' },
  { id: 'laser-cannon-heavy', category: 'Energy', name: 'Laser Cannon (heavy)', techLevel: 11, range: '10 km', damage: '1DD', tons: '1', spaces: 4, cost: 'Cr200000', power: 'P', traits: ['AP 8'], crew: '1', loaders: '0' },
  { id: 'gatling-laser', category: 'Energy', name: 'Gatling Laser', techLevel: 8, range: '4 km', damage: '6D', tons: '2', spaces: 8, cost: 'Cr500000', power: 'P', traits: ['Accurate', 'AP 5', 'Auto 4'], crew: '1', loaders: '0' },
  { id: 'plasma-cannon-light', category: 'Energy', name: 'Plasma Cannon (light)', techLevel: 10, range: '1 km', damage: '1DD', tons: '1', spaces: 4, cost: 'Cr300000', power: 'P', traits: ['AP 6', 'Blast 4'], crew: '1', loaders: '0' },
  { id: 'fusion-cannon-light', category: 'Energy', name: 'Fusion Cannon (light)', techLevel: 12, range: '1 km', damage: '1DD', tons: '1', spaces: 4, cost: 'MCr1', power: 'F', traits: ['AP 8', 'Blast 6', 'Radiation'], crew: '1', loaders: '0' },
  { id: 'stun-cannon-light', category: 'Energy', name: 'Stun Cannon (light)', techLevel: 11, range: '0.02 km', damage: '3D', tons: '0.25', spaces: 1, cost: 'Cr50000', power: 'P', traits: ['Blast 10', 'Stun', 'Zero-G'], crew: '1', loaders: '0' },
  { id: 'anti-air-missile-light', category: 'Rockets, Bombs & Missiles', name: 'Anti-Air Missile (light)', techLevel: 7, range: '10 km', damage: '6D', tons: '0.1', spaces: 1, cost: 'Cr5000', power: '-', traits: ['One Use', 'Smart'], crew: '0', loaders: '0' },
  { id: 'anti-tank-missile', category: 'Rockets, Bombs & Missiles', name: 'Anti-Tank Missile', techLevel: 7, range: '6 km', damage: '8D', tons: '0.2', spaces: 1, cost: 'Cr18000', power: '-', traits: ['AP 30', 'One Use', 'Smart'], magazine: '1', crew: '0', loaders: '0' },
  { id: 'rocket-pod-medium', category: 'Rockets, Bombs & Missiles', name: 'Rocket Pod (medium)', techLevel: 6, range: '2 km', damage: '6D', tons: '0.5', spaces: 2, cost: 'Cr12000', power: 'P', traits: ['Auto 3', 'Blast 10'], magazine: '9', crew: '1', loaders: '0' },
  { id: 'plasma-missile-rack', category: 'Rockets, Bombs & Missiles', name: 'Plasma Missile Rack', techLevel: 12, range: '50 km', damage: '4DD', tons: '2', spaces: 8, cost: 'MCr1', power: 'P', traits: ['AP 20', 'Auto 3', 'Blast 15', 'Smart'], magazine: '12', crew: '1', loaders: '0' },
  { id: 'bomb-medium', category: 'Rockets, Bombs & Missiles', name: 'Bomb (medium)', techLevel: 4, range: '-', damage: '2DD', tons: '0.5', spaces: 2, cost: 'Cr4000', power: '-', traits: ['AP 25', 'Blast 25', 'One Use'], magazine: '1', crew: '0', loaders: '0' },
  { id: 'torpedo-advanced', category: 'Rockets, Bombs & Missiles', name: 'Torpedo (advanced)', techLevel: 8, range: '50 km', damage: '5DD', tons: '0.5', spaces: 2, cost: 'Cr12000', power: '-', traits: ['AP 50', 'One Use', 'Smart'], magazine: '1', crew: '0', loaders: '0' },
  { id: 'ballista-bolt', category: 'Archaic', name: 'Ballista (bolt)', techLevel: 1, range: '0.2 km', damage: '4D', tons: '0.5', spaces: 2, cost: 'Cr2000', power: '-', traits: ['AP 5', 'Inaccurate'], magazine: '1', crew: '3', loaders: '1' },
  { id: 'trebuchet-stone', category: 'Archaic', name: 'Trebuchet (100kg stone)', techLevel: 1, range: '0.4 km', damage: '8D', tons: '4', spaces: 16, cost: 'Cr20000', power: '-', traits: ['Artillery'], magazine: '1', crew: '12', loaders: '4' },
]

const weaponCategories = [...new Set(handbookWeapons.map((weapon) => weapon.category))]
const selectedCategory = ref('')
const selectedHandbookWeaponId = ref('')
const silhouetteSource = computed(() => vehicleSilhouetteSource(props.vehicle.baseFamily))
const silhouetteImageClass = computed(() => vehicleSilhouetteImageClass(props.vehicle.baseFamily))
const categoryWeapons = computed(() => handbookWeapons.filter((weapon) => weapon.category === selectedCategory.value))
const selectedHandbookWeapon = computed(() => handbookWeapons.find((weapon) => weapon.id === selectedHandbookWeaponId.value) ?? null)
const fireControlCount = computed(() => props.vehicle.weapons.filter((weapon) => weapon.fireControlSystem && weapon.fireControlSystem !== 'none').length)
const externalMountCount = computed(() => props.vehicle.weapons.filter((weapon) => ['hardpoint', 'pintle', 'ring'].includes(weapon.mountType ?? '')).length)

watch(selectedCategory, () => {
  selectedHandbookWeaponId.value = ''
})

const formatNumber = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
const mountRuleFor = vehicleWeaponMountRuleFor
const fireControlRuleFor = vehicleWeaponFireControlRuleFor
const weaponBaseSpaces = vehicleWeaponBaseSpaces
const installedWeaponSpaces = vehicleWeaponInstalledSpaces
const attributeHelp = {
  mount: 'How the weapon is installed. External mounts such as ring, pintle, and hardpoint do not consume internal weapon Spaces, but still count as external load.',
  fireControl: 'Fire control adds the selected targeting aid to the weapon system and contributes its listed cost to the installed weapon total.',
  linked: 'Number of identical weapons installed together. Linked weapons multiply the base weapon Spaces, base weapon cost, and external load before mount rules are applied.',
  weaponSpaces: 'The handbook Spaces for one copy of the weapon. This is the weapon size before linked count, mount type, and ammunition storage are applied.',
  ammoSpaces: 'Internal vehicle Spaces reserved for ammunition, magazines, missiles, or reloads. Ammo Spaces always consume vehicle capacity.',
  installedSpaces: 'Final internal Spaces spent by this weapon system after linked count, mount type, pop-up mount, crew/loaders for turrets, and ammunition are applied.',
  autoloader: 'Replaces loader crew for the mount calculation. In the current builder it affects turret loader Space requirements, not the weapon base cost.',
  modularMount: 'Marks the weapon as modular or swappable. It is tracked on the weapon profile but does not currently change Spaces or cost by itself.',
  popupMount: 'Adds concealed pop-up installation burden. This increases installed Spaces while selected and is removed again when deselected.',
}
const syncWeaponSpaces = (weapon: TravellerVehicleWeapon) => {
  weapon.baseSpaces = weaponBaseSpaces(weapon)
  weapon.linkedCount = Math.max(1, Number(weapon.linkedCount ?? 1))
  weapon.spaces = installedWeaponSpaces(weapon)
  emit('sync-derivations')
}
const toWeaponRecord = (weapon: HandbookWeaponOption): TravellerVehicleWeapon => ({
  id: weapon.id,
  name: weapon.name,
  techLevel: weapon.techLevel,
  range: weapon.range,
  damage: weapon.damage,
  magazine: weapon.magazine ?? '',
  cost: weapon.cost,
  baseCostCredits: undefined,
  costCredits: undefined,
  tonnes: Number(weapon.tons),
  traits: [...weapon.traits],
  fireControl: '',
  spaces: weapon.spaces,
  baseSpaces: weapon.spaces,
  mountType: '',
  mountFacing: '',
  linkedCount: 1,
  ammunitionSpaces: 0,
  fireControlSystem: '',
  autoloader: false,
  modularMount: false,
  popupMount: false,
  powerRequirement: weapon.power,
  crew: weapon.crew ?? '',
  loaders: weapon.loaders ?? '',
  sourceCategory: weapon.category,
})
const addSelectedHandbookWeapon = () => {
  if (!selectedHandbookWeapon.value) return
  const weapon = toWeaponRecord(selectedHandbookWeapon.value)
  weapon.spaces = installedWeaponSpaces(weapon)
  emit('add-handbook-weapon', weapon)
}
</script>

<template>
  <section class="overflow-hidden rounded-md border border-cyan-400/30 bg-slate-950/80">
    <div class="grid min-h-[5.75rem] gap-3 border-b border-cyan-400/25 bg-cyan-950/55 px-5 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div>
        <p class="text-xs font-black uppercase tracking-[0.22em] text-cyan-100/70">Vehicle Design Step</p>
        <h3 class="mt-2 text-2xl font-black uppercase leading-none tracking-wide text-cyan-50">Weapons</h3>
      </div>
      <div class="flex flex-wrap gap-2">
        <button class="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-sm font-semibold text-cyan-50 hover:border-cyan-200 disabled:cursor-not-allowed disabled:border-cyan-300/10 disabled:bg-cyan-300/5 disabled:text-cyan-100/35" type="button" :disabled="!selectedHandbookWeapon" @click="addSelectedHandbookWeapon">
          Add Weapon
        </button>
      </div>
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
          <h4 class="text-3xl font-black uppercase leading-none tracking-wide text-cyan-50">Combat Loadout</h4>
          <p class="mt-3 max-w-xl text-sm leading-5 text-zinc-300">
            Install weapons after crew, cargo, and systems are understood. The Handbook treats weapon mass, mount type, fire control, crew, ammunition, and external load as the key decisions.
          </p>
        </div>

        <div class="relative z-10 mt-6 grid gap-3 rounded-md border border-cyan-400/20 bg-slate-950/45 p-3">
          <div class="grid grid-cols-3 gap-2">
            <div class="rounded-md border border-cyan-400/20 bg-slate-950/50 p-3">
              <p class="text-[11px] font-black uppercase tracking-wide text-cyan-100/70">Mounts</p>
              <p class="mt-2 text-xl font-black text-cyan-50">{{ vehicle.weapons.length }}</p>
            </div>
            <div class="rounded-md border border-cyan-400/20 bg-slate-950/50 p-3">
              <p class="text-[11px] font-black uppercase tracking-wide text-cyan-100/70">Spaces</p>
              <p class="mt-2 text-xl font-black text-cyan-50">{{ formatNumber(weaponSpaces) }}</p>
            </div>
            <div class="rounded-md border border-cyan-400/20 bg-slate-950/50 p-3">
              <p class="text-[11px] font-black uppercase tracking-wide text-cyan-100/70">Fire Control</p>
              <p class="mt-2 text-xl font-black text-cyan-50">{{ fireControlCount }}</p>
            </div>
          </div>
          <div class="rounded-md border border-cyan-400/20 bg-slate-950/50 p-3">
            <p class="text-[11px] font-black uppercase tracking-wide text-cyan-100/70">External Load</p>
            <p class="mt-1 text-sm leading-5 text-zinc-300">
              {{ externalMountCount }} external mounts. Weapons over 100 kg per vehicle Space reduce maximum and cruise Speed Bands by one; more than 250 kg per Space is not allowed.
            </p>
          </div>
        </div>

        <img
          :src="silhouetteSource"
          alt=""
          class="pointer-events-none absolute bottom-7 left-1/2 z-0 max-w-[calc(100%-4rem)] -translate-x-1/2 object-contain object-bottom opacity-80 drop-shadow-[0_0_32px_rgba(103,232,249,0.26)]"
          :class="silhouetteImageClass"
          draggable="false"
        >
      </div>

      <div class="grid min-h-[35.75rem] min-w-0 content-start gap-5">
        <div class="min-w-0 rounded-md border border-cyan-400/25 bg-slate-950/45 p-4">
          <div class="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <label class="grid gap-1 text-[11px] font-black uppercase tracking-wide text-cyan-100/70">
              <span>Weapon Category</span>
              <select v-model="selectedCategory" class="h-10 min-w-0 rounded-md border border-cyan-400/25 bg-slate-950/70 px-3 text-sm font-normal normal-case tracking-normal text-cyan-50 outline-none focus:border-cyan-200">
                <option value="">—</option>
                <option v-for="category in weaponCategories" :key="category" :value="category">{{ category }}</option>
              </select>
            </label>
            <label class="grid gap-1 text-[11px] font-black uppercase tracking-wide text-cyan-100/70">
              <span>Handbook Weapon</span>
              <select v-model="selectedHandbookWeaponId" class="h-10 min-w-0 rounded-md border border-cyan-400/25 bg-slate-950/70 px-3 text-sm font-normal normal-case tracking-normal text-cyan-50 outline-none focus:border-cyan-200">
                <option value="">—</option>
                <option v-for="weapon in categoryWeapons" :key="weapon.id" :value="weapon.id">
                  {{ weapon.name }} · TL {{ weapon.techLevel }}
                </option>
              </select>
            </label>
          </div>

          <div v-if="selectedHandbookWeapon" class="mt-4 grid gap-px overflow-hidden rounded-md border border-cyan-400/20">
            <div class="grid grid-cols-[8rem_minmax(0,1fr)] text-sm">
              <div class="bg-cyan-400/20 px-2 py-1 font-black uppercase tracking-wide text-cyan-100">TL</div>
              <div class="border-b border-cyan-400/20 px-2 py-1 text-zinc-200">{{ selectedHandbookWeapon.techLevel }}</div>
            </div>
            <div class="grid grid-cols-[8rem_minmax(0,1fr)] text-sm">
              <div class="bg-cyan-400/20 px-2 py-1 font-black uppercase tracking-wide text-cyan-100">Attack</div>
              <div class="border-b border-cyan-400/20 px-2 py-1 text-zinc-200">{{ selectedHandbookWeapon.damage }} · {{ selectedHandbookWeapon.range }}</div>
            </div>
            <div class="grid grid-cols-[8rem_minmax(0,1fr)] text-sm">
              <div class="bg-cyan-400/20 px-2 py-1 font-black uppercase tracking-wide text-cyan-100">Spaces</div>
              <div class="border-b border-cyan-400/20 px-2 py-1 text-zinc-200">{{ selectedHandbookWeapon.spaces }} weapon Spaces · {{ selectedHandbookWeapon.tons }} tonnes</div>
            </div>
            <div class="grid grid-cols-[8rem_minmax(0,1fr)] text-sm">
              <div class="bg-cyan-400/20 px-2 py-1 font-black uppercase tracking-wide text-cyan-100">Power</div>
              <div class="border-b border-cyan-400/20 px-2 py-1 text-zinc-200">{{ selectedHandbookWeapon.power }}</div>
            </div>
            <div class="grid grid-cols-[8rem_minmax(0,1fr)] text-sm">
              <div class="bg-cyan-400/20 px-2 py-1 font-black uppercase tracking-wide text-cyan-100">Traits</div>
              <div class="border-b border-cyan-400/20 px-2 py-1 text-zinc-200">{{ selectedHandbookWeapon.traits.join(', ') || '-' }}</div>
            </div>
          </div>
        </div>

        <div class="min-w-0 rounded-md border border-cyan-400/25 bg-slate-950/45 p-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-black uppercase tracking-wide text-cyan-100/70">Mounted Weapons</p>
              <p class="mt-1 text-sm text-zinc-300">Choose mount, facing, fire control, linking, and ammunition allocation for each weapon.</p>
            </div>
            <p class="text-sm font-black text-cyan-50">{{ formatNumber(weaponSpaces) }} Spaces</p>
          </div>

          <div v-if="vehicle.weapons.length" class="mt-4 grid gap-3">
            <div v-for="(weapon, index) in vehicle.weapons" :key="`weapon-${index}`" class="min-w-0 rounded-md border border-cyan-400/20 bg-slate-950/50 p-3">
              <div class="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p class="text-sm font-black uppercase tracking-wide text-cyan-50">{{ weapon.name || `Weapon ${index + 1}` }}</p>
                  <p class="mt-1 text-[11px] text-cyan-100/60">{{ mountRuleFor(weapon.mountType).label }} · {{ formatNumber(Number(weapon.spaces ?? 0)) }} installed Spaces</p>
                </div>
                <button class="grid h-8 w-8 place-items-center rounded-md border border-red-300/25 text-red-200 hover:border-red-200" type="button" @click="$emit('remove-weapon', index)">
                  <AppIcon class="h-4 w-4" name="close" />
                </button>
              </div>

              <div class="grid min-w-0 gap-3 xl:grid-cols-3">
                <label class="grid gap-1 text-[11px] font-black uppercase tracking-wide text-cyan-100/70 xl:col-span-2">
                  <span>Weapon</span>
                  <input v-model="weapon.name" class="h-10 min-w-0 rounded-md border border-cyan-400/25 bg-slate-950/70 px-3 text-sm font-normal normal-case tracking-normal text-cyan-50 outline-none focus:border-cyan-200" placeholder="Weapon name" @input="$emit('sync-derivations')">
                </label>
                <label class="grid gap-1 text-[11px] font-black uppercase tracking-wide text-cyan-100/70">
                  <span class="flex items-center gap-1">
                    Mount
                    <span class="group/help relative inline-grid h-4 w-4 place-items-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-[10px] text-cyan-50">
                      ?
                      <span class="pointer-events-none absolute right-0 top-5 z-30 hidden w-72 rounded-md border border-cyan-300/35 bg-slate-950/95 p-3 text-xs font-normal normal-case leading-5 tracking-normal text-zinc-200 shadow-[0_0_24px_rgba(34,211,238,0.22)] group-hover/help:block">{{ attributeHelp.mount }}</span>
                    </span>
                  </span>
                  <select v-model="weapon.mountType" class="h-10 min-w-0 rounded-md border border-cyan-400/25 bg-slate-950/70 px-3 text-sm font-normal normal-case tracking-normal text-cyan-50 outline-none focus:border-cyan-200" @change="syncWeaponSpaces(weapon)">
                    <option value="">—</option>
                    <option v-for="mount in mountRules" :key="mount.id" :value="mount.id">{{ mount.label }}</option>
                  </select>
                </label>
                <label class="grid gap-1 text-[11px] font-black uppercase tracking-wide text-cyan-100/70">
                  <span>Facing</span>
                  <select v-model="weapon.mountFacing" class="h-10 min-w-0 rounded-md border border-cyan-400/25 bg-slate-950/70 px-3 text-sm font-normal normal-case tracking-normal text-cyan-50 outline-none focus:border-cyan-200" @change="$emit('sync-derivations')">
                    <option value="">—</option>
                    <option>Forward</option>
                    <option>Port</option>
                    <option>Starboard</option>
                    <option>Aft</option>
                    <option>Dorsal</option>
                    <option>Ventral</option>
                    <option>Turreted</option>
                  </select>
                </label>
                <label class="grid gap-1 text-[11px] font-black uppercase tracking-wide text-cyan-100/70">
                  <span class="flex items-center gap-1">
                    Fire Control
                    <span class="group/help relative inline-grid h-4 w-4 place-items-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-[10px] text-cyan-50">
                      ?
                      <span class="pointer-events-none absolute right-0 top-5 z-30 hidden w-72 rounded-md border border-cyan-300/35 bg-slate-950/95 p-3 text-xs font-normal normal-case leading-5 tracking-normal text-zinc-200 shadow-[0_0_24px_rgba(34,211,238,0.22)] group-hover/help:block">{{ attributeHelp.fireControl }}</span>
                    </span>
                  </span>
                  <select v-model="weapon.fireControlSystem" class="h-10 min-w-0 rounded-md border border-cyan-400/25 bg-slate-950/70 px-3 text-sm font-normal normal-case tracking-normal text-cyan-50 outline-none focus:border-cyan-200" @change="weapon.fireControl = fireControlRuleFor(weapon.fireControlSystem).label; $emit('sync-derivations')">
                    <option value="">—</option>
                    <option v-for="rule in fireControlRules" :key="rule.id" :value="rule.id">{{ rule.label }} {{ rule.dm !== '-' ? rule.dm : '' }}</option>
                  </select>
                </label>
                <label class="grid gap-1 text-[11px] font-black uppercase tracking-wide text-cyan-100/70">
                  <span class="flex items-center gap-1">
                    Linked
                    <span class="group/help relative inline-grid h-4 w-4 place-items-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-[10px] text-cyan-50">
                      ?
                      <span class="pointer-events-none absolute right-0 top-5 z-30 hidden w-72 rounded-md border border-cyan-300/35 bg-slate-950/95 p-3 text-xs font-normal normal-case leading-5 tracking-normal text-zinc-200 shadow-[0_0_24px_rgba(34,211,238,0.22)] group-hover/help:block">{{ attributeHelp.linked }}</span>
                    </span>
                  </span>
                  <input v-model.number="weapon.linkedCount" min="1" step="1" type="number" class="h-10 min-w-0 rounded-md border border-cyan-400/25 bg-slate-950/70 px-3 text-sm font-normal text-cyan-50 outline-none focus:border-cyan-200" @input="syncWeaponSpaces(weapon)">
                </label>
                <label class="grid gap-1 text-[11px] font-black uppercase tracking-wide text-cyan-100/70">
                  <span class="flex items-center gap-1">
                    Weapon Spaces
                    <span class="group/help relative inline-grid h-4 w-4 place-items-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-[10px] text-cyan-50">
                      ?
                      <span class="pointer-events-none absolute right-0 top-5 z-30 hidden w-72 rounded-md border border-cyan-300/35 bg-slate-950/95 p-3 text-xs font-normal normal-case leading-5 tracking-normal text-zinc-200 shadow-[0_0_24px_rgba(34,211,238,0.22)] group-hover/help:block">{{ attributeHelp.weaponSpaces }}</span>
                    </span>
                  </span>
                  <input v-model.number="weapon.baseSpaces" min="0" step="1" type="number" class="h-10 min-w-0 rounded-md border border-cyan-400/25 bg-slate-950/70 px-3 text-sm font-normal text-cyan-50 outline-none focus:border-cyan-200" @input="syncWeaponSpaces(weapon)">
                </label>
                <label class="grid gap-1 text-[11px] font-black uppercase tracking-wide text-cyan-100/70">
                  <span class="flex items-center gap-1">
                    Ammo Spaces
                    <span class="group/help relative inline-grid h-4 w-4 place-items-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-[10px] text-cyan-50">
                      ?
                      <span class="pointer-events-none absolute right-0 top-5 z-30 hidden w-72 rounded-md border border-cyan-300/35 bg-slate-950/95 p-3 text-xs font-normal normal-case leading-5 tracking-normal text-zinc-200 shadow-[0_0_24px_rgba(34,211,238,0.22)] group-hover/help:block">{{ attributeHelp.ammoSpaces }}</span>
                    </span>
                  </span>
                  <input v-model.number="weapon.ammunitionSpaces" min="0" step="1" type="number" class="h-10 min-w-0 rounded-md border border-cyan-400/25 bg-slate-950/70 px-3 text-sm font-normal text-cyan-50 outline-none focus:border-cyan-200" @input="syncWeaponSpaces(weapon)">
                </label>
                <label class="grid gap-1 text-[11px] font-black uppercase tracking-wide text-cyan-100/70">
                  <span class="flex items-center gap-1">
                    Installed Spaces
                    <span class="group/help relative inline-grid h-4 w-4 place-items-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-[10px] text-cyan-50">
                      ?
                      <span class="pointer-events-none absolute right-0 top-5 z-30 hidden w-72 rounded-md border border-cyan-300/35 bg-slate-950/95 p-3 text-xs font-normal normal-case leading-5 tracking-normal text-zinc-200 shadow-[0_0_24px_rgba(34,211,238,0.22)] group-hover/help:block">{{ attributeHelp.installedSpaces }}</span>
                    </span>
                  </span>
                  <input :value="formatNumber(Number(weapon.spaces ?? 0))" disabled class="h-10 min-w-0 rounded-md border border-cyan-400/15 bg-slate-950/40 px-3 text-sm font-normal text-cyan-100/60 outline-none">
                </label>
                <label class="grid gap-1 text-[11px] font-black uppercase tracking-wide text-cyan-100/70">
                  <span>Damage</span>
                  <input v-model="weapon.damage" class="h-10 min-w-0 rounded-md border border-cyan-400/25 bg-slate-950/70 px-3 text-sm font-normal normal-case tracking-normal text-cyan-50 outline-none focus:border-cyan-200" placeholder="Damage" @input="$emit('sync-derivations')">
                </label>
                <label class="grid gap-1 text-[11px] font-black uppercase tracking-wide text-cyan-100/70">
                  <span>Range</span>
                  <input v-model="weapon.range" class="h-10 min-w-0 rounded-md border border-cyan-400/25 bg-slate-950/70 px-3 text-sm font-normal normal-case tracking-normal text-cyan-50 outline-none focus:border-cyan-200" placeholder="Range" @input="$emit('sync-derivations')">
                </label>
                <label class="grid gap-1 text-[11px] font-black uppercase tracking-wide text-cyan-100/70">
                  <span>Power</span>
                  <input v-model="weapon.powerRequirement" class="h-10 min-w-0 rounded-md border border-cyan-400/25 bg-slate-950/70 px-3 text-sm font-normal normal-case tracking-normal text-cyan-50 outline-none focus:border-cyan-200" placeholder="P, F, F3" @input="$emit('sync-derivations')">
                </label>
                <label class="grid gap-1 text-[11px] font-black uppercase tracking-wide text-cyan-100/70">
                  <span>Crew</span>
                  <input v-model="weapon.crew" class="h-10 min-w-0 rounded-md border border-cyan-400/25 bg-slate-950/70 px-3 text-sm font-normal normal-case tracking-normal text-cyan-50 outline-none focus:border-cyan-200" placeholder="Crew" @input="syncWeaponSpaces(weapon)">
                </label>
                <label class="grid gap-1 text-[11px] font-black uppercase tracking-wide text-cyan-100/70">
                  <span>Loaders</span>
                  <input v-model="weapon.loaders" class="h-10 min-w-0 rounded-md border border-cyan-400/25 bg-slate-950/70 px-3 text-sm font-normal normal-case tracking-normal text-cyan-50 outline-none focus:border-cyan-200" placeholder="Loaders" @input="syncWeaponSpaces(weapon)">
                </label>
                <label class="grid gap-1 text-[11px] font-black uppercase tracking-wide text-cyan-100/70 xl:col-span-3">
                  <span>Traits</span>
                  <input
                    :value="weapon.traits.join(', ')"
                    class="h-10 min-w-0 rounded-md border border-cyan-400/25 bg-slate-950/70 px-3 text-sm font-normal normal-case tracking-normal text-cyan-50 outline-none focus:border-cyan-200"
                    placeholder="Comma-separated traits"
                    @input="weapon.traits = ($event.target as HTMLInputElement).value.split(',').map((item) => item.trim()).filter(Boolean); $emit('sync-derivations')"
                  >
                </label>
              </div>

              <div class="mt-3 flex flex-wrap gap-3">
                <label class="inline-flex items-center gap-2 text-xs font-semibold text-cyan-100/70">
                  <input v-model="weapon.autoloader" type="checkbox" class="h-4 w-4 rounded border-cyan-400/30 bg-slate-950" @change="syncWeaponSpaces(weapon)">
                  <span class="flex items-center gap-1">
                    Autoloader
                    <span class="group/help relative inline-grid h-4 w-4 place-items-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-[10px] text-cyan-50">
                      ?
                      <span class="pointer-events-none absolute left-0 top-5 z-30 hidden w-72 rounded-md border border-cyan-300/35 bg-slate-950/95 p-3 text-xs font-normal leading-5 text-zinc-200 shadow-[0_0_24px_rgba(34,211,238,0.22)] group-hover/help:block">{{ attributeHelp.autoloader }}</span>
                    </span>
                  </span>
                </label>
                <label class="inline-flex items-center gap-2 text-xs font-semibold text-cyan-100/70">
                  <input v-model="weapon.modularMount" type="checkbox" class="h-4 w-4 rounded border-cyan-400/30 bg-slate-950" @change="syncWeaponSpaces(weapon)">
                  <span class="flex items-center gap-1">
                    Modular mount
                    <span class="group/help relative inline-grid h-4 w-4 place-items-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-[10px] text-cyan-50">
                      ?
                      <span class="pointer-events-none absolute left-0 top-5 z-30 hidden w-72 rounded-md border border-cyan-300/35 bg-slate-950/95 p-3 text-xs font-normal leading-5 text-zinc-200 shadow-[0_0_24px_rgba(34,211,238,0.22)] group-hover/help:block">{{ attributeHelp.modularMount }}</span>
                    </span>
                  </span>
                </label>
                <label class="inline-flex items-center gap-2 text-xs font-semibold text-cyan-100/70">
                  <input v-model="weapon.popupMount" type="checkbox" class="h-4 w-4 rounded border-cyan-400/30 bg-slate-950" @change="syncWeaponSpaces(weapon)">
                  <span class="flex items-center gap-1">
                    Pop-up mount
                    <span class="group/help relative inline-grid h-4 w-4 place-items-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-[10px] text-cyan-50">
                      ?
                      <span class="pointer-events-none absolute left-0 top-5 z-30 hidden w-72 rounded-md border border-cyan-300/35 bg-slate-950/95 p-3 text-xs font-normal leading-5 text-zinc-200 shadow-[0_0_24px_rgba(34,211,238,0.22)] group-hover/help:block">{{ attributeHelp.popupMount }}</span>
                    </span>
                  </span>
                </label>
              </div>

              <div class="mt-3 grid gap-px overflow-hidden rounded-md border border-cyan-400/15">
                <div class="grid grid-cols-[8rem_minmax(0,1fr)] text-xs">
                  <div class="bg-cyan-400/15 px-2 py-1 font-black uppercase tracking-wide text-cyan-100">Mount Rule</div>
                  <div class="px-2 py-1 leading-5 text-zinc-300">{{ mountRuleFor(weapon.mountType).spaces }} · {{ mountRuleFor(weapon.mountType).cost }}</div>
                </div>
                <div class="grid grid-cols-[8rem_minmax(0,1fr)] border-t border-cyan-400/10 text-xs">
                  <div class="bg-cyan-400/15 px-2 py-1 font-black uppercase tracking-wide text-cyan-100">Effect</div>
                  <div class="px-2 py-1 leading-5 text-zinc-300">{{ mountRuleFor(weapon.mountType).effect }}</div>
                </div>
              </div>
            </div>
          </div>
          <p v-else class="mt-4 rounded-md border border-cyan-400/20 bg-slate-950/50 p-3 text-sm text-zinc-300">No mounted weapons installed.</p>
        </div>

        <div class="min-w-0 overflow-hidden rounded-md border border-cyan-400/25">
          <div class="grid grid-cols-[7rem_5rem_5rem_minmax(0,1fr)] bg-cyan-400/15 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100">
            <span>Fire Control</span>
            <span>TL</span>
            <span>DM</span>
            <span>Cost</span>
          </div>
          <div v-for="rule in fireControlRules" :key="rule.id" class="grid grid-cols-[7rem_5rem_5rem_minmax(0,1fr)] items-start border-t border-cyan-400/10 px-3 py-2 text-xs text-zinc-200">
            <span class="font-semibold text-cyan-50">{{ rule.label }}</span>
            <span>{{ rule.techLevel }}+</span>
            <span>{{ rule.dm }}</span>
            <span class="min-w-0 whitespace-normal break-words leading-5">{{ rule.cost }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
