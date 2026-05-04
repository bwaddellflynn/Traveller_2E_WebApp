<script setup lang="ts">
import type { TravellerAssociate, TravellerCharacteristicId, TravellerProfile } from '~/types/traveller'
import { useTravellersStore } from '~/stores/travellers'
import { travellerProfileToPdfFields, validateTravellerPdfFields } from '~/utils/traveller/pdfFields'
import { cloneTravellerProfile, createBlankTravellerProfile } from '~/utils/traveller/profile'

const route = useRoute()
const router = useRouter()
const travellers = useTravellersStore()

const draft = ref<TravellerProfile>(createBlankTravellerProfile('manual'))
const saveMessage = ref('')
const importInput = ref<HTMLInputElement | null>(null)

const characteristicIds: TravellerCharacteristicId[] = ['str', 'dex', 'end', 'int', 'edu', 'soc', 'psi']
const associateGroups = [
  { id: 'contacts', label: 'Contacts' },
  { id: 'allies', label: 'Allies' },
  { id: 'rivals', label: 'Rivals' },
  { id: 'enemies', label: 'Enemies' },
] as const
const associateTypeLabels: Record<keyof TravellerProfile['associates'], string> = {
  allies: 'ally',
  contacts: 'contact',
  rivals: 'rival',
  enemies: 'enemy',
  other: 'associate',
}

const diceModifier = (score: number) => {
  if (score <= 0) return -3
  if (score <= 2) return -2
  if (score <= 5) return -1
  if (score <= 8) return 0
  if (score <= 11) return 1
  if (score <= 14) return 2
  return 3
}

const formatDm = (value: number) => value >= 0 ? `+${value}` : `${value}`

const syncCharacteristicDm = (id: TravellerCharacteristicId) => {
  draft.value.characteristics[id].dm = diceModifier(Number(draft.value.characteristics[id].value) || 0)
}

const addSkill = () => {
  draft.value.skills.push({
    id: `manual-skill-${Date.now()}`,
    name: '',
    speciality: '',
    level: 0,
    sources: ['Manual Entry'],
    notes: '',
  })
}

const removeSkill = (index: number) => {
  draft.value.skills.splice(index, 1)
}

const addAssociate = (type: keyof TravellerProfile['associates']) => {
  draft.value.associates[type].push({
    id: `manual-${type}-${Date.now()}`,
    source: 'Manual Entry',
    type: associateTypeLabels[type],
    name: '',
    notes: '',
  } satisfies TravellerAssociate)
}

const removeAssociate = (type: keyof TravellerProfile['associates'], index: number) => {
  draft.value.associates[type].splice(index, 1)
}

const addCareer = () => {
  draft.value.careers.push({
    termNumber: draft.value.careers.length + 1,
    path: 'career',
    startAge: 18 + (draft.value.careers.length * 4),
    endAge: 22 + (draft.value.careers.length * 4),
    summary: '',
    details: [],
    rolls: [],
  })
}

const removeCareer = (index: number) => {
  draft.value.careers.splice(index, 1)
}

const addEquipment = () => {
  draft.value.equipment.push({
    id: `manual-equipment-${Date.now()}`,
    name: '',
    techLevel: '',
    kg: '',
    traits: '',
    notes: '',
  })
}

const removeEquipment = (index: number) => {
  draft.value.equipment.splice(index, 1)
}

const addWeapon = () => {
  draft.value.weapons.push({
    id: `manual-weapon-${Date.now()}`,
    name: '',
    techLevel: '',
    range: '',
    damage: '',
    kg: '',
    magazine: '',
    traits: '',
    notes: '',
  })
}

const removeWeapon = (index: number) => {
  draft.value.weapons.splice(index, 1)
}

const addArmour = () => {
  draft.value.armour.push({
    id: `manual-armour-${Date.now()}`,
    name: '',
    type: '',
    techLevel: '',
    protection: '',
    radiationProtection: '',
    kg: '',
    options: '',
    traits: '',
    notes: '',
  })
}

const removeArmour = (index: number) => {
  draft.value.armour.splice(index, 1)
}

const addAugment = () => {
  draft.value.augments.push({
    id: `manual-augment-${Date.now()}`,
    name: '',
    type: '',
    techLevel: '',
    traits: '',
    notes: '',
  })
}

const removeAugment = (index: number) => {
  draft.value.augments.splice(index, 1)
}

const addWound = () => {
  draft.value.wounds.push({
    id: `manual-wound-${Date.now()}`,
    type: '',
    location: '',
    recoveryPeriod: '',
    notes: '',
  })
}

const removeWound = (index: number) => {
  draft.value.wounds.splice(index, 1)
}

const saveSheet = () => {
  const saved = travellers.saveProfile(draft.value)
  draft.value = cloneTravellerProfile(saved)
  saveMessage.value = `Saved ${saved.identity.name || 'Traveller'}`
  router.replace({ path: '/character/sheet', query: { id: saved.id } })
}

const duplicateSheet = () => {
  const saved = travellers.saveProfile(draft.value)
  const copy = travellers.duplicateProfile(saved.id)
  if (!copy) return
  draft.value = cloneTravellerProfile(copy)
  saveMessage.value = `Duplicated ${copy.identity.name || 'Traveller'}`
  router.replace({ path: '/character/sheet', query: { id: copy.id } })
}

const deleteSheet = () => {
  if (!window.confirm(`Delete ${draft.value.identity.name || 'this Traveller'}?`)) return
  travellers.deleteProfile(draft.value.id)
  router.push('/')
}

const downloadJson = (payload: unknown, filename: string) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

const profileFileSlug = () => {
  return (draft.value.identity.name || 'traveller').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'traveller'
}

const exportJson = () => {
  downloadJson(cloneTravellerProfile(draft.value), `${profileFileSlug()}-profile.json`)
}

const exportPdfFields = () => {
  const fields = travellerProfileToPdfFields(draft.value)
  const validation = validateTravellerPdfFields(fields)
  downloadJson({
    template: draft.value.metadata.pdfTemplate ?? 'Character Sheet 2026_fillable.pdf',
    valid: validation.valid,
    unknownFields: validation.unknownFields,
    fields,
  }, `${profileFileSlug()}-pdf-fields.json`)
}

const openImportPicker = () => {
  importInput.value?.click()
}

const importJson = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    const imported = JSON.parse(await file.text()) as TravellerProfile
    draft.value = cloneTravellerProfile({
      ...createBlankTravellerProfile(imported.source ?? 'imported'),
      ...imported,
      source: imported.source ?? 'imported',
      updatedAt: new Date().toISOString(),
    })
    saveMessage.value = `Imported ${draft.value.identity.name || 'Traveller'}`
  } catch {
    saveMessage.value = 'Import failed. Select a Traveller profile JSON file.'
  } finally {
    input.value = ''
  }
}

onMounted(() => {
  travellers.loadProfiles()
  const id = typeof route.query.id === 'string' ? route.query.id : ''
  const existing = id ? travellers.getProfile(id) : null

  if (existing) {
    draft.value = cloneTravellerProfile(existing)
    draft.value.metadata.lastOpenedAt = new Date().toISOString()
  }
})
</script>

<template>
  <main class="min-h-screen">
    <section class="hud-hero border-b border-cyan-400/30 text-white">
      <div class="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-6 sm:px-8 lg:px-10">
        <div>
          <p class="hud-kicker text-sm font-semibold uppercase tracking-wide">Traveller Record</p>
          <h1 class="mt-2 text-3xl font-semibold">Character Sheet</h1>
        </div>
        <div class="flex flex-wrap gap-2">
          <NuxtLink class="hud-link px-3 py-2 text-sm font-semibold" to="/">
            Hub
          </NuxtLink>
          <button class="rounded-md border border-white/20 px-3 py-2 text-sm font-semibold text-zinc-100 hover:border-amber-400 hover:text-amber-200" type="button" @click="openImportPicker">
            Import JSON
          </button>
          <button class="rounded-md border border-white/20 px-3 py-2 text-sm font-semibold text-zinc-100 hover:border-amber-400 hover:text-amber-200" type="button" @click="exportJson">
            Export JSON
          </button>
          <button class="rounded-md border border-white/20 px-3 py-2 text-sm font-semibold text-zinc-100 hover:border-amber-400 hover:text-amber-200" type="button" @click="exportPdfFields">
            Export PDF Fields
          </button>
          <button class="rounded-md border border-white/20 px-3 py-2 text-sm font-semibold text-zinc-100 hover:border-amber-400 hover:text-amber-200" type="button" @click="duplicateSheet">
            Duplicate
          </button>
          <button class="rounded-md border border-red-300/50 px-3 py-2 text-sm font-semibold text-red-100 hover:border-red-300 hover:text-white" type="button" @click="deleteSheet">
            Delete
          </button>
          <button class="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400" type="button" @click="saveSheet">
            Save Sheet
          </button>
          <input ref="importInput" accept="application/json" class="hidden" type="file" @change="importJson">
        </div>
      </div>
    </section>

    <section class="mx-auto grid w-full max-w-7xl gap-5 px-5 py-6 sm:px-8 lg:px-10">
      <p v-if="saveMessage" class="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
        {{ saveMessage }}
      </p>

      <div class="rounded-lg border border-zinc-300 bg-white p-5 shadow-sm">
        <div class="grid gap-4 md:grid-cols-3">
          <label class="grid gap-2 md:col-span-2">
            <span class="text-sm font-semibold text-zinc-700">Name</span>
            <input v-model="draft.identity.name" class="h-11 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
          </label>
          <label class="grid gap-2">
            <span class="text-sm font-semibold text-zinc-700">Title</span>
            <input v-model="draft.identity.title" class="h-11 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
          </label>
          <label class="grid gap-2">
            <span class="text-sm font-semibold text-zinc-700">Age</span>
            <input v-model.number="draft.identity.age" class="h-11 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" min="0" type="number">
          </label>
          <label class="grid gap-2">
            <span class="text-sm font-semibold text-zinc-700">Species</span>
            <input v-model="draft.identity.species" class="h-11 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
          </label>
          <label class="grid gap-2">
            <span class="text-sm font-semibold text-zinc-700">Homeworld</span>
            <input v-model="draft.identity.homeworld" class="h-11 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
          </label>
          <label class="grid gap-2 md:col-span-3">
            <span class="text-sm font-semibold text-zinc-700">Distinguishing Features</span>
            <textarea v-model="draft.identity.distinguishingFeatures" class="min-h-20 rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" />
          </label>
        </div>
      </div>

      <div class="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <section class="rounded-lg border border-zinc-300 bg-white p-5 shadow-sm">
          <h2 class="text-xl font-semibold">Characteristics</h2>
          <div class="mt-4 grid gap-3">
            <div v-for="id in characteristicIds" :key="id" class="grid grid-cols-[minmax(0,1fr)_4.5rem] items-end gap-2">
              <label class="grid min-w-0 gap-1">
                <span class="text-sm font-semibold text-zinc-700">{{ draft.characteristics[id].abbreviation }}</span>
                <input v-model.number="draft.characteristics[id].value" class="h-10 min-w-0 rounded-md border border-zinc-300 px-2 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" min="0" type="number" @change="syncCharacteristicDm(id)">
              </label>
              <label class="grid min-w-0 gap-1">
                <span class="text-sm font-semibold text-zinc-700">DM</span>
                <input :value="formatDm(draft.characteristics[id].dm)" class="h-10 min-w-0 rounded-md border border-zinc-200 bg-stone-50 px-2 text-zinc-700" readonly>
              </label>
            </div>
          </div>
        </section>

        <section class="rounded-lg border border-zinc-300 bg-white p-5 shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-xl font-semibold">Skills</h2>
            <button class="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold hover:border-amber-600" type="button" @click="addSkill">
              Add Skill
            </button>
          </div>
          <div class="mt-4 grid gap-2">
            <div v-for="(skill, index) in draft.skills" :key="skill.id" class="grid gap-2 rounded-md bg-stone-50 p-3 lg:grid-cols-[1fr_1fr_5rem_auto]">
              <input v-model="skill.name" class="h-10 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="Skill">
              <input v-model="skill.speciality" class="h-10 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="Specialty">
              <input v-model.number="skill.level" class="h-10 rounded-md border border-zinc-300 px-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="Level" type="number">
              <button class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-600 hover:border-red-500 hover:text-red-700" type="button" @click="removeSkill(index)">
                Remove
              </button>
              <textarea v-model="skill.notes" class="min-h-16 rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200 lg:col-span-4" placeholder="Notes" />
            </div>
            <p v-if="!draft.skills.length" class="text-sm text-zinc-600">No skills entered.</p>
          </div>
        </section>
      </div>

      <section class="rounded-lg border border-zinc-300 bg-white p-5 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-xl font-semibold">Career History</h2>
          <button class="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold hover:border-amber-600" type="button" @click="addCareer">
            Add Term
          </button>
        </div>
        <div class="mt-4 grid gap-2">
          <div v-for="(term, index) in draft.careers" :key="`${term.termNumber}-${index}`" class="grid gap-2 rounded-md bg-stone-50 p-3 md:grid-cols-[5rem_1fr_7rem_7rem_auto]">
            <input v-model.number="term.termNumber" class="h-10 rounded-md border border-zinc-300 px-3" type="number">
            <input v-model="term.summary" class="h-10 rounded-md border border-zinc-300 px-3" placeholder="Career, assignment, rank, notes">
            <input v-model.number="term.startAge" class="h-10 rounded-md border border-zinc-300 px-3" type="number">
            <input v-model.number="term.endAge" class="h-10 rounded-md border border-zinc-300 px-3" type="number">
            <button class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-600 hover:border-red-500 hover:text-red-700" type="button" @click="removeCareer(index)">
              Remove
            </button>
          </div>
        </div>
      </section>

      <section class="grid gap-5 lg:grid-cols-2">
        <div v-for="group in associateGroups" :key="group.id" class="rounded-lg border border-zinc-300 bg-white p-5 shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-xl font-semibold">{{ group.label }}</h2>
            <button class="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold hover:border-amber-600" type="button" @click="addAssociate(group.id)">
              Add
            </button>
          </div>
          <div class="mt-4 grid gap-2">
            <div v-for="(associate, index) in draft.associates[group.id]" :key="associate.id" class="grid gap-2 rounded-md bg-stone-50 p-3">
              <input v-model="associate.name" class="h-10 rounded-md border border-zinc-300 px-3" placeholder="Name">
              <textarea v-model="associate.notes" class="min-h-16 rounded-md border border-zinc-300 px-3 py-2" placeholder="Notes" />
              <button class="justify-self-start rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-600 hover:border-red-500 hover:text-red-700" type="button" @click="removeAssociate(group.id, index)">
                Remove
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="grid gap-5 lg:grid-cols-2">
        <div class="rounded-lg border border-zinc-300 bg-white p-5 shadow-sm">
          <h2 class="text-xl font-semibold">Finances</h2>
          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <label class="grid gap-1">
              <span class="text-sm font-semibold text-zinc-700">Cash on Hand</span>
              <input v-model.number="draft.finances.cashOnHand" class="h-10 rounded-md border border-zinc-300 px-3" type="number">
            </label>
            <label class="grid gap-1">
              <span class="text-sm font-semibold text-zinc-700">Monthly Cash Flow</span>
              <input v-model="draft.finances.monthlyCashFlow" class="h-10 rounded-md border border-zinc-300 px-3">
            </label>
            <label class="grid gap-1">
              <span class="text-sm font-semibold text-zinc-700">Income</span>
              <input v-model="draft.finances.income" class="h-10 rounded-md border border-zinc-300 px-3">
            </label>
            <label class="grid gap-1">
              <span class="text-sm font-semibold text-zinc-700">Living Costs</span>
              <input v-model="draft.finances.livingCosts" class="h-10 rounded-md border border-zinc-300 px-3">
            </label>
            <label class="grid gap-1">
              <span class="text-sm font-semibold text-zinc-700">Debt</span>
              <input v-model.number="draft.finances.debt" class="h-10 rounded-md border border-zinc-300 px-3" type="number">
            </label>
            <label class="grid gap-1">
              <span class="text-sm font-semibold text-zinc-700">Ship Shares</span>
              <input v-model.number="draft.finances.shipShares" class="h-10 rounded-md border border-zinc-300 px-3" type="number">
            </label>
            <label class="grid gap-1">
              <span class="text-sm font-semibold text-zinc-700">Annual Pension</span>
              <input v-model="draft.finances.annualPension" class="h-10 rounded-md border border-zinc-300 px-3">
            </label>
            <label class="grid gap-1">
              <span class="text-sm font-semibold text-zinc-700">Ship Payments</span>
              <input v-model="draft.finances.shipPayments" class="h-10 rounded-md border border-zinc-300 px-3">
            </label>
          </div>
        </div>

        <div class="rounded-lg border border-zinc-300 bg-white p-5 shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-xl font-semibold">Wounds</h2>
            <button class="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold hover:border-amber-600" type="button" @click="addWound">
              Add Wound
            </button>
          </div>
          <div class="mt-4 grid gap-2">
            <div v-for="(wound, index) in draft.wounds" :key="wound.id" class="grid gap-2 rounded-md bg-stone-50 p-3">
              <input v-model="wound.type" class="h-10 rounded-md border border-zinc-300 px-3" placeholder="Type">
              <input v-model="wound.location" class="h-10 rounded-md border border-zinc-300 px-3" placeholder="Location">
              <input v-model="wound.recoveryPeriod" class="h-10 rounded-md border border-zinc-300 px-3" placeholder="Recovery period">
              <textarea v-model="wound.notes" class="min-h-16 rounded-md border border-zinc-300 px-3 py-2" placeholder="Notes" />
              <button class="justify-self-start rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-600 hover:border-red-500 hover:text-red-700" type="button" @click="removeWound(index)">
                Remove
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="grid gap-5 lg:grid-cols-2">
        <div class="rounded-lg border border-zinc-300 bg-white p-5 shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-xl font-semibold">Weapons</h2>
            <button class="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold hover:border-amber-600" type="button" @click="addWeapon">
              Add Weapon
            </button>
          </div>
          <div class="mt-4 grid gap-2">
            <div v-for="(weapon, index) in draft.weapons" :key="weapon.id" class="grid gap-2 rounded-md bg-stone-50 p-3">
              <input v-model="weapon.name" class="h-10 rounded-md border border-zinc-300 px-3" placeholder="Name">
              <div class="grid gap-2 sm:grid-cols-3">
                <input v-model="weapon.techLevel" class="h-10 rounded-md border border-zinc-300 px-3" placeholder="TL">
                <input v-model="weapon.range" class="h-10 rounded-md border border-zinc-300 px-3" placeholder="Range">
                <input v-model="weapon.damage" class="h-10 rounded-md border border-zinc-300 px-3" placeholder="Damage">
                <input v-model="weapon.kg" class="h-10 rounded-md border border-zinc-300 px-3" placeholder="KG">
                <input v-model="weapon.magazine" class="h-10 rounded-md border border-zinc-300 px-3" placeholder="Mag">
                <input v-model="weapon.traits" class="h-10 rounded-md border border-zinc-300 px-3" placeholder="Traits">
              </div>
              <textarea v-model="weapon.notes" class="min-h-16 rounded-md border border-zinc-300 px-3 py-2" placeholder="Notes" />
              <button class="justify-self-start rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-600 hover:border-red-500 hover:text-red-700" type="button" @click="removeWeapon(index)">
                Remove
              </button>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-zinc-300 bg-white p-5 shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-xl font-semibold">Armour</h2>
            <button class="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold hover:border-amber-600" type="button" @click="addArmour">
              Add Armour
            </button>
          </div>
          <div class="mt-4 grid gap-2">
            <div v-for="(armour, index) in draft.armour" :key="armour.id" class="grid gap-2 rounded-md bg-stone-50 p-3">
              <div class="grid gap-2 sm:grid-cols-2">
                <input v-model="armour.name" class="h-10 rounded-md border border-zinc-300 px-3" placeholder="Name">
                <input v-model="armour.type" class="h-10 rounded-md border border-zinc-300 px-3" placeholder="Type">
              </div>
              <div class="grid gap-2 sm:grid-cols-5">
                <input v-model="armour.techLevel" class="h-10 rounded-md border border-zinc-300 px-3" placeholder="TL">
                <input v-model="armour.protection" class="h-10 rounded-md border border-zinc-300 px-3" placeholder="Protection">
                <input v-model="armour.radiationProtection" class="h-10 rounded-md border border-zinc-300 px-3" placeholder="Rad">
                <input v-model="armour.kg" class="h-10 rounded-md border border-zinc-300 px-3" placeholder="KG">
                <input v-model="armour.options" class="h-10 rounded-md border border-zinc-300 px-3" placeholder="Options">
              </div>
              <input v-model="armour.traits" class="h-10 rounded-md border border-zinc-300 px-3" placeholder="Traits">
              <textarea v-model="armour.notes" class="min-h-16 rounded-md border border-zinc-300 px-3 py-2" placeholder="Notes" />
              <button class="justify-self-start rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-600 hover:border-red-500 hover:text-red-700" type="button" @click="removeArmour(index)">
                Remove
              </button>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-zinc-300 bg-white p-5 shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-xl font-semibold">Augments</h2>
            <button class="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold hover:border-amber-600" type="button" @click="addAugment">
              Add Augment
            </button>
          </div>
          <div class="mt-4 grid gap-2">
            <div v-for="(augment, index) in draft.augments" :key="augment.id" class="grid gap-2 rounded-md bg-stone-50 p-3">
              <div class="grid gap-2 sm:grid-cols-3">
                <input v-model="augment.name" class="h-10 rounded-md border border-zinc-300 px-3" placeholder="Name">
                <input v-model="augment.type" class="h-10 rounded-md border border-zinc-300 px-3" placeholder="Type">
                <input v-model="augment.techLevel" class="h-10 rounded-md border border-zinc-300 px-3" placeholder="TL">
              </div>
              <input v-model="augment.traits" class="h-10 rounded-md border border-zinc-300 px-3" placeholder="Traits">
              <textarea v-model="augment.notes" class="min-h-16 rounded-md border border-zinc-300 px-3 py-2" placeholder="Notes" />
              <button class="justify-self-start rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-600 hover:border-red-500 hover:text-red-700" type="button" @click="removeAugment(index)">
                Remove
              </button>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-zinc-300 bg-white p-5 shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-xl font-semibold">Equipment</h2>
            <button class="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold hover:border-amber-600" type="button" @click="addEquipment">
              Add Equipment
            </button>
          </div>
          <div class="mt-4 grid gap-2">
            <div v-for="(item, index) in draft.equipment" :key="item.id" class="grid gap-2 rounded-md bg-stone-50 p-3">
              <input v-model="item.name" class="h-10 rounded-md border border-zinc-300 px-3" placeholder="Name">
              <div class="grid gap-2 sm:grid-cols-3">
                <input v-model="item.techLevel" class="h-10 rounded-md border border-zinc-300 px-3" placeholder="TL">
                <input v-model="item.kg" class="h-10 rounded-md border border-zinc-300 px-3" placeholder="KG">
                <input v-model="item.traits" class="h-10 rounded-md border border-zinc-300 px-3" placeholder="Traits">
              </div>
              <textarea v-model="item.notes" class="min-h-16 rounded-md border border-zinc-300 px-3 py-2" placeholder="Notes" />
              <button class="justify-self-start rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-600 hover:border-red-500 hover:text-red-700" type="button" @click="removeEquipment(index)">
                Remove
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-lg border border-zinc-300 bg-white p-5 shadow-sm">
        <h2 class="text-xl font-semibold">History & Background</h2>
        <div class="mt-4 grid gap-3">
          <textarea v-model="draft.history.background" class="min-h-24 rounded-md border border-zinc-300 px-3 py-2" placeholder="Background" />
          <textarea v-model="draft.history.notes" class="min-h-24 rounded-md border border-zinc-300 px-3 py-2" placeholder="Notes" />
        </div>
      </section>
    </section>
  </main>
</template>
