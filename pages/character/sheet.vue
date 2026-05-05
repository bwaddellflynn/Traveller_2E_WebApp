<script setup lang="ts">
import type { TravellerAssociate, TravellerCharacteristicId, TravellerProfile } from '~/types/traveller'
import { useTravellersStore } from '~/stores/travellers'
import { clearBuilderDraft, loadBuilderDraft, saveBuilderDraft } from '~/utils/traveller/draftCache'
import { travellerProfileToPdfFields, validateTravellerPdfFields } from '~/utils/traveller/pdfFields'
import { cloneTravellerProfile, createBlankTravellerProfile } from '~/utils/traveller/profile'

const MANUAL_TRAVELLER_DRAFT_CACHE_VERSION = 1
const manualTravellerDraftCacheKey = (id: string) => `scoutsuite.builder.manualTraveller.${id || 'new'}.v1`

const route = useRoute()
const router = useRouter()
const travellers = useTravellersStore()

const draft = ref<TravellerProfile>(createBlankTravellerProfile('manual'))
const saveMessage = ref('')
const importInput = ref<HTMLInputElement | null>(null)
const manualSheetDraftRestored = ref(false)
const manualSheetDraftCachePaused = ref(false)
const activeManualSheetDraftCacheKey = computed(() => {
  const id = typeof route.query.id === 'string' ? route.query.id : ''
  return manualTravellerDraftCacheKey(id)
})

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
const skillColumnCount = 3
const skillRowsPerColumn = 16
const skillPadCount = computed(() => Math.max(0, skillColumnCount * skillRowsPerColumn - draft.value.skills.length))
const paddedSkills = computed(() => [
  ...draft.value.skills,
  ...Array.from({ length: skillPadCount.value }, (_, index) => ({
    id: `skill-placeholder-${index}`,
    name: '',
    speciality: '',
    level: null,
    notes: '',
    placeholder: true,
  })),
])
const skillColumns = computed(() => Array.from({ length: skillColumnCount }, (_, columnIndex) =>
  paddedSkills.value.slice(columnIndex * skillRowsPerColumn, (columnIndex + 1) * skillRowsPerColumn)))
const trainingSkill = computed(() => draft.value.skills.find((skill) => skill.sources?.some((source) => /training/i.test(source))) ?? null)
const historyBackgroundLines = computed({
  get: () => {
    const blocks = [draft.value.history.background, draft.value.history.notes].filter(Boolean)
    return blocks.join('\n')
  },
  set: (value: string) => {
    const [background, ...rest] = value.split('\n')
    draft.value.history.background = background ?? ''
    draft.value.history.notes = rest.join('\n').trim()
  },
})

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
  manualSheetDraftCachePaused.value = true
  clearBuilderDraft(activeManualSheetDraftCacheKey.value)
  const saved = travellers.saveProfile(draft.value)
  draft.value = cloneTravellerProfile(saved)
  saveMessage.value = `Saved ${saved.identity.name || 'Traveller'}`
  router.replace({ path: '/character/sheet', query: { id: saved.id } })
  nextTick(() => {
    manualSheetDraftCachePaused.value = false
  })
}

const duplicateSheet = () => {
  manualSheetDraftCachePaused.value = true
  clearBuilderDraft(activeManualSheetDraftCacheKey.value)
  const saved = travellers.saveProfile(draft.value)
  const copy = travellers.duplicateProfile(saved.id)
  if (!copy) {
    manualSheetDraftCachePaused.value = false
    return
  }
  draft.value = cloneTravellerProfile(copy)
  saveMessage.value = `Duplicated ${copy.identity.name || 'Traveller'}`
  router.replace({ path: '/character/sheet', query: { id: copy.id } })
  nextTick(() => {
    manualSheetDraftCachePaused.value = false
  })
}

const deleteSheet = () => {
  if (!window.confirm(`Delete ${draft.value.identity.name || 'this Traveller'}?`)) return
  clearBuilderDraft(activeManualSheetDraftCacheKey.value)
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
  const cachedDraft = loadBuilderDraft<TravellerProfile>(
    manualTravellerDraftCacheKey(id),
    MANUAL_TRAVELLER_DRAFT_CACHE_VERSION,
  )

  if (cachedDraft) {
    draft.value = cloneTravellerProfile(cachedDraft)
    saveMessage.value = 'Restored cached manual Traveller draft.'
  } else if (existing) {
    draft.value = cloneTravellerProfile(existing)
    draft.value.metadata.lastOpenedAt = new Date().toISOString()
  }

  manualSheetDraftRestored.value = true
})

watch(
  draft,
  (profile) => {
    if (!manualSheetDraftRestored.value || manualSheetDraftCachePaused.value) return
    saveBuilderDraft(
      activeManualSheetDraftCacheKey.value,
      MANUAL_TRAVELLER_DRAFT_CACHE_VERSION,
      cloneTravellerProfile(profile),
    )
  },
  { deep: true },
)
</script>

<template>
  <main class="min-h-screen">
    <section class="mx-auto w-full max-w-7xl px-5 pt-6 sm:px-8 lg:px-10">
      <div class="hud-panel flex flex-wrap items-center justify-between gap-4 rounded-lg border p-5">
        <div>
          <p class="hud-kicker text-sm font-semibold uppercase tracking-wide">Traveller Record</p>
          <h1 class="mt-2 text-3xl font-semibold">Character Sheet</h1>
        </div>
        <div class="flex flex-wrap gap-2">
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

    <section class="mx-auto grid w-full max-w-[1500px] gap-6 px-4 py-6 sm:px-8 lg:px-10">
      <p v-if="saveMessage" class="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
        {{ saveMessage }}
      </p>

      <div class="sheet-page">
        <div class="sheet-chrome">Traveller Character Sheet</div>
        <div class="sheet-page-grid sheet-page-grid--front">
          <div class="sheet-page-left">
            <section class="sheet-panel sheet-panel--vertical">
              <header class="sheet-panel-title sheet-panel-title--side">Augments</header>
              <div class="sheet-table">
                <div class="sheet-table-header sheet-table-header--augments">
                  <span>Type</span>
                  <span>TL</span>
                  <span>Traits</span>
                </div>
                <div class="sheet-table-body">
                  <div v-for="(augment, index) in draft.augments" :key="augment.id" class="sheet-table-row sheet-table-row--augments">
                    <input v-model="augment.type" class="sheet-cell-input" placeholder="Type">
                    <input v-model="augment.techLevel" class="sheet-cell-input" placeholder="TL">
                    <div class="sheet-cell-stack">
                      <input v-model="augment.name" class="sheet-cell-input" placeholder="Name">
                      <input v-model="augment.traits" class="sheet-cell-input" placeholder="Traits">
                    </div>
                    <button class="sheet-remove" type="button" @click="removeAugment(index)">Remove</button>
                  </div>
                  <button class="sheet-add" type="button" @click="addAugment">Add Augment</button>
                </div>
              </div>
            </section>

            <section class="sheet-panel sheet-panel--vertical">
              <header class="sheet-panel-title sheet-panel-title--side">Armour</header>
              <div class="sheet-table">
                <div class="sheet-table-header sheet-table-header--armour">
                  <span>Type</span>
                  <span>Rad.</span>
                  <span>Protection</span>
                  <span>Kg</span>
                  <span>Options</span>
                </div>
                <div class="sheet-table-body">
                  <div v-for="(armour, index) in draft.armour" :key="armour.id" class="sheet-table-row sheet-table-row--armour">
                    <div class="sheet-cell-stack">
                      <input v-model="armour.name" class="sheet-cell-input" placeholder="Name">
                      <input v-model="armour.type" class="sheet-cell-input" placeholder="Type">
                    </div>
                    <input v-model="armour.radiationProtection" class="sheet-cell-input" placeholder="Rad">
                    <input v-model="armour.protection" class="sheet-cell-input" placeholder="Protection">
                    <input v-model="armour.kg" class="sheet-cell-input" placeholder="Kg">
                    <div class="sheet-cell-stack">
                      <input v-model="armour.options" class="sheet-cell-input" placeholder="Options">
                      <input v-model="armour.traits" class="sheet-cell-input" placeholder="Traits">
                    </div>
                    <button class="sheet-remove" type="button" @click="removeArmour(index)">Remove</button>
                  </div>
                  <button class="sheet-add" type="button" @click="addArmour">Add Armour</button>
                </div>
              </div>
            </section>

            <section class="sheet-panel sheet-panel--vertical">
              <header class="sheet-panel-title sheet-panel-title--side">Weapons</header>
              <div class="sheet-table">
                <div class="sheet-table-header sheet-table-header--weapons">
                  <span>Type</span>
                  <span>TL</span>
                  <span>Range</span>
                  <span>Damage</span>
                  <span>Kg</span>
                  <span>Mag.</span>
                  <span>Traits</span>
                </div>
                <div class="sheet-table-body">
                  <div v-for="(weapon, index) in draft.weapons" :key="weapon.id" class="sheet-table-row sheet-table-row--weapons">
                    <div class="sheet-cell-stack">
                      <input v-model="weapon.name" class="sheet-cell-input" placeholder="Name">
                    </div>
                    <input v-model="weapon.techLevel" class="sheet-cell-input" placeholder="TL">
                    <input v-model="weapon.range" class="sheet-cell-input" placeholder="Range">
                    <input v-model="weapon.damage" class="sheet-cell-input" placeholder="Damage">
                    <input v-model="weapon.kg" class="sheet-cell-input" placeholder="Kg">
                    <input v-model="weapon.magazine" class="sheet-cell-input" placeholder="Mag">
                    <div class="sheet-cell-stack">
                      <input v-model="weapon.traits" class="sheet-cell-input" placeholder="Traits">
                      <input v-model="weapon.notes" class="sheet-cell-input" placeholder="Notes">
                    </div>
                    <button class="sheet-remove" type="button" @click="removeWeapon(index)">Remove</button>
                  </div>
                  <button class="sheet-add" type="button" @click="addWeapon">Add Weapon</button>
                </div>
              </div>
            </section>

            <section class="sheet-panel sheet-panel--vertical">
              <header class="sheet-panel-title sheet-panel-title--side">Equipment</header>
              <div class="sheet-table">
                <div class="sheet-table-header sheet-table-header--equipment">
                  <span>Type</span>
                  <span>TL</span>
                  <span>Kg</span>
                  <span>Notes</span>
                </div>
                <div class="sheet-table-body">
                  <div v-for="(item, index) in draft.equipment" :key="item.id" class="sheet-table-row sheet-table-row--equipment">
                    <div class="sheet-cell-stack">
                      <input v-model="item.name" class="sheet-cell-input" placeholder="Name">
                      <input v-model="item.traits" class="sheet-cell-input" placeholder="Type / traits">
                    </div>
                    <input v-model="item.techLevel" class="sheet-cell-input" placeholder="TL">
                    <input v-model="item.kg" class="sheet-cell-input" placeholder="Kg">
                    <input v-model="item.notes" class="sheet-cell-input" placeholder="Notes">
                    <button class="sheet-remove" type="button" @click="removeEquipment(index)">Remove</button>
                  </div>
                  <button class="sheet-add" type="button" @click="addEquipment">Add Equipment</button>
                </div>
              </div>
            </section>
          </div>

          <div class="sheet-page-right">
            <div class="sheet-identity-grid">
              <section class="sheet-panel sheet-panel--personal">
                <header class="sheet-panel-title">Personal Data File</header>
                <div class="sheet-personal-grid">
                  <label class="sheet-line-field sheet-line-field--emphasis">
                    <span>Name:</span>
                    <input v-model="draft.identity.name" class="sheet-line-input">
                  </label>
                  <label class="sheet-line-field">
                    <span>Title:</span>
                    <input v-model="draft.identity.title" class="sheet-line-input">
                  </label>
                  <div class="sheet-personal-split">
                    <label class="sheet-line-field">
                      <span>Age:</span>
                      <input v-model.number="draft.identity.age" class="sheet-line-input" min="0" type="number">
                    </label>
                    <label class="sheet-line-field">
                      <span>Species:</span>
                      <input v-model="draft.identity.species" class="sheet-line-input">
                    </label>
                  </div>
                  <label class="sheet-line-field">
                    <span>Homeworld:</span>
                    <input v-model="draft.identity.homeworld" class="sheet-line-input">
                  </label>
                  <label class="sheet-line-field">
                    <span>Traits:</span>
                    <input v-model="draft.identity.traits" class="sheet-line-input">
                  </label>
                </div>
              </section>

              <section class="sheet-panel">
                <div class="sheet-distinguishing-label">Distinguishing Features:</div>
                <textarea v-model="draft.identity.distinguishingFeatures" class="sheet-textarea sheet-textarea--tall" />
              </section>
            </div>

            <section class="sheet-characteristics-panel">
              <div
                v-for="id in characteristicIds"
                :key="id"
                class="sheet-characteristic"
              >
                <span class="sheet-characteristic-label">{{ draft.characteristics[id].abbreviation }}</span>
                <input
                  v-model.number="draft.characteristics[id].value"
                  class="sheet-hex-input"
                  min="0"
                  type="number"
                  @change="syncCharacteristicDm(id)"
                >
                <div class="sheet-dm-block">
                  <input :value="formatDm(draft.characteristics[id].dm)" class="sheet-dm-input" readonly>
                  <span>DM</span>
                </div>
              </div>
            </section>

            <section class="sheet-panel sheet-panel--skills">
              <header class="sheet-panel-title sheet-panel-title--side">Skills</header>
              <div class="sheet-skills-grid">
                <div v-for="(column, columnIndex) in skillColumns" :key="`skills-${columnIndex}`" class="sheet-skill-column">
                  <div
                    v-for="entry in column"
                    :key="entry.id"
                    class="sheet-skill-row"
                    :class="{ 'sheet-skill-row--placeholder': 'placeholder' in entry }"
                  >
                    <template v-if="'placeholder' in entry">
                      <span class="sheet-skill-line"></span>
                      <span class="sheet-skill-level"></span>
                    </template>
                    <template v-else>
                      <input v-model="entry.name" class="sheet-skill-name" placeholder="Skill">
                      <input v-model.number="entry.level" class="sheet-skill-level-input" placeholder="0" type="number">
                    </template>
                  </div>
                </div>
                <div class="sheet-training-box">
                  <div class="sheet-training-title">Training</div>
                  <label class="sheet-line-field">
                    <span>Skill:</span>
                    <input :value="trainingSkill?.name ?? ''" class="sheet-line-input" readonly>
                  </label>
                  <label class="sheet-line-field">
                    <span>Completed Weeks:</span>
                    <input class="sheet-line-input" readonly>
                  </label>
                  <label class="sheet-line-field">
                    <span>Completed Study Periods:</span>
                    <input class="sheet-line-input" readonly>
                  </label>
                  <button class="sheet-add sheet-add--inline" type="button" @click="addSkill">Add Skill</button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <div class="sheet-page">
        <div class="sheet-chrome">Traveller Character Sheet</div>
        <div class="sheet-page-grid sheet-page-grid--back">
          <div class="sheet-page-left">
            <section class="sheet-panel">
              <header class="sheet-panel-title">Finances</header>
              <div class="sheet-finance-grid">
                <label class="sheet-line-field sheet-line-field--emphasis">
                  <span>Cash on Hand:</span>
                  <input v-model.number="draft.finances.cashOnHand" class="sheet-line-input" type="number">
                </label>
                <label class="sheet-line-field sheet-line-field--emphasis">
                  <span>Monthly Cash Flow:</span>
                  <input v-model="draft.finances.monthlyCashFlow" class="sheet-line-input">
                </label>
                <label class="sheet-line-field">
                  <span>Ship Shares:</span>
                  <input v-model.number="draft.finances.shipShares" class="sheet-line-input" type="number">
                </label>
                <label class="sheet-line-field">
                  <span>Income:</span>
                  <input v-model="draft.finances.income" class="sheet-line-input">
                </label>
                <label class="sheet-line-field">
                  <span>Living Costs:</span>
                  <input v-model="draft.finances.livingCosts" class="sheet-line-input">
                </label>
                <label class="sheet-line-field">
                  <span>Debt:</span>
                  <input v-model.number="draft.finances.debt" class="sheet-line-input" type="number">
                </label>
                <label class="sheet-line-field">
                  <span>Annual Pension:</span>
                  <input v-model="draft.finances.annualPension" class="sheet-line-input">
                </label>
                <label class="sheet-line-field">
                  <span>Ship Payments:</span>
                  <input v-model="draft.finances.shipPayments" class="sheet-line-input">
                </label>
              </div>
            </section>

            <section class="sheet-panel">
              <header class="sheet-panel-title">Wounds</header>
              <div class="sheet-table">
                <div class="sheet-table-header sheet-table-header--wounds">
                  <span>Type</span>
                  <span>Location</span>
                  <span>Recovery Period</span>
                  <span>Notes</span>
                </div>
                <div class="sheet-table-body">
                  <div v-for="(wound, index) in draft.wounds" :key="wound.id" class="sheet-table-row sheet-table-row--wounds">
                    <input v-model="wound.type" class="sheet-cell-input" placeholder="Type">
                    <input v-model="wound.location" class="sheet-cell-input" placeholder="Location">
                    <input v-model="wound.recoveryPeriod" class="sheet-cell-input" placeholder="Recovery">
                    <input v-model="wound.notes" class="sheet-cell-input" placeholder="Notes">
                    <button class="sheet-remove" type="button" @click="removeWound(index)">Remove</button>
                  </div>
                  <button class="sheet-add" type="button" @click="addWound">Add Wound</button>
                </div>
              </div>
            </section>

            <section class="sheet-panel">
              <header class="sheet-panel-title">Careers</header>
              <div class="sheet-table">
                <div class="sheet-table-header sheet-table-header--careers">
                  <span>Term</span>
                  <span>Career</span>
                  <span>Surv.</span>
                  <span>Adv.</span>
                  <span>Rank</span>
                  <span>Notes</span>
                </div>
                <div class="sheet-table-body">
                  <div v-for="(term, index) in draft.careers" :key="`${term.termNumber}-${index}`" class="sheet-table-row sheet-table-row--careers">
                    <input v-model.number="term.termNumber" class="sheet-cell-input" type="number">
                    <input v-model="term.summary" class="sheet-cell-input" placeholder="Career / assignment">
                    <input :value="term.rolls.find((roll) => roll.label === 'Survival')?.total ?? ''" class="sheet-cell-input" readonly>
                    <input :value="term.rolls.find((roll) => roll.label === 'Advancement')?.total ?? ''" class="sheet-cell-input" readonly>
                    <input :value="`${term.startAge}-${term.endAge}`" class="sheet-cell-input" readonly>
                    <input :value="term.details.join(' | ')" class="sheet-cell-input" placeholder="Notes" readonly>
                    <button class="sheet-remove" type="button" @click="removeCareer(index)">Remove</button>
                  </div>
                  <button class="sheet-add" type="button" @click="addCareer">Add Career</button>
                </div>
              </div>
            </section>

            <section class="sheet-panel">
              <header class="sheet-panel-title">History &amp; Background</header>
              <textarea v-model="historyBackgroundLines" class="sheet-textarea sheet-textarea--history" />
            </section>
          </div>

          <div class="sheet-page-right">
            <section
              v-for="group in [
                { id: 'allies', label: 'Allies' },
                { id: 'contacts', label: 'Contacts' },
                { id: 'rivals', label: 'Rivals' },
                { id: 'enemies', label: 'Enemies' },
              ]"
              :key="group.id"
              class="sheet-panel"
            >
              <header class="sheet-panel-title">{{ group.label }}</header>
              <div class="sheet-table">
                <div class="sheet-table-header sheet-table-header--associates">
                  <span>Name</span>
                  <span>Notes</span>
                </div>
                <div class="sheet-table-body">
                  <div v-for="(associate, index) in draft.associates[group.id]" :key="associate.id" class="sheet-table-row sheet-table-row--associates">
                    <input v-model="associate.name" class="sheet-cell-input" placeholder="Name">
                    <input v-model="associate.notes" class="sheet-cell-input" placeholder="Notes">
                    <button class="sheet-remove" type="button" @click="removeAssociate(group.id, index)">Remove</button>
                  </div>
                  <button class="sheet-add" type="button" @click="addAssociate(group.id)">Add {{ group.label.slice(0, -1) }}</button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.sheet-page {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(34, 211, 238, 0.4);
  border-radius: 18px;
  background:
    radial-gradient(circle at top left, rgba(34, 211, 238, 0.08), transparent 28%),
    radial-gradient(circle at bottom right, rgba(245, 158, 11, 0.08), transparent 26%),
    linear-gradient(180deg, rgba(11, 18, 32, 0.98), rgba(8, 13, 24, 0.98));
  box-shadow:
    0 0 0 1px rgba(34, 211, 238, 0.12) inset,
    0 20px 50px rgba(0, 0, 0, 0.35);
}

.sheet-chrome {
  padding: 14px 20px;
  background:
    linear-gradient(90deg, rgba(34, 211, 238, 0.22), rgba(34, 211, 238, 0.08) 45%, rgba(245, 158, 11, 0.16)),
    rgba(15, 23, 42, 0.92);
  border-bottom: 1px solid rgba(34, 211, 238, 0.35);
  color: #e0f2fe;
  font-size: 1.35rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  text-shadow: 0 0 16px rgba(34, 211, 238, 0.28);
}

.sheet-page-grid {
  display: grid;
  gap: 16px;
  padding: 16px;
}

.sheet-page-grid--front {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

.sheet-page-grid--back {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

.sheet-page-left,
.sheet-page-right {
  display: grid;
  gap: 16px;
  align-content: start;
}

.sheet-panel {
  position: relative;
  border: 1px solid rgba(34, 211, 238, 0.3);
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgba(12, 20, 35, 0.92), rgba(9, 15, 27, 0.9));
  padding: 12px 14px 14px;
  box-shadow:
    0 0 0 1px rgba(34, 211, 238, 0.08) inset,
    0 12px 24px rgba(0, 0, 0, 0.2);
}

.sheet-panel--vertical {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  align-items: stretch;
  gap: 12px;
}

.sheet-panel-title {
  margin: -12px -14px 10px;
  padding: 8px 18px;
  background:
    linear-gradient(90deg, rgba(34, 211, 238, 0.28), rgba(34, 211, 238, 0.08) 55%, rgba(15, 23, 42, 0.7)),
    rgba(15, 23, 42, 0.95);
  border-bottom: 1px solid rgba(34, 211, 238, 0.3);
  color: #cffafe;
  font-size: 0.95rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.sheet-panel-title--side {
  margin: 0;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  border-radius: 10px;
  padding: 12px 8px;
  text-align: center;
}

.sheet-table-header {
  display: grid;
  gap: 10px;
  padding: 0 8px 6px;
  border-bottom: 1px solid rgba(34, 211, 238, 0.35);
  color: #fbbf24;
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
  text-shadow: 0 0 10px rgba(251, 191, 36, 0.12);
}

.sheet-table-header--augments { grid-template-columns: 1.2fr 0.25fr 1.6fr; }
.sheet-table-header--armour { grid-template-columns: 1.2fr 0.4fr 0.6fr 0.35fr 1.15fr; }
.sheet-table-header--weapons { grid-template-columns: 1.2fr 0.35fr 0.55fr 0.55fr 0.35fr 0.4fr 1.3fr; }
.sheet-table-header--equipment { grid-template-columns: 1.1fr 0.25fr 0.35fr 1.25fr; }
.sheet-table-header--wounds { grid-template-columns: 0.7fr 0.7fr 0.9fr 1fr; }
.sheet-table-header--careers { grid-template-columns: 0.35fr 1.4fr 0.35fr 0.35fr 0.45fr 1.1fr; }
.sheet-table-header--associates { grid-template-columns: 1fr 1.1fr; }

.sheet-table-body {
  display: grid;
  gap: 8px;
  padding-top: 10px;
}

.sheet-table-row {
  display: grid;
  gap: 10px;
  align-items: start;
}

.sheet-table-row--augments { grid-template-columns: 1.2fr 0.25fr 1.6fr auto; }
.sheet-table-row--armour { grid-template-columns: 1.2fr 0.4fr 0.6fr 0.35fr 1.15fr auto; }
.sheet-table-row--weapons { grid-template-columns: 1.2fr 0.35fr 0.55fr 0.55fr 0.35fr 0.4fr 1.3fr auto; }
.sheet-table-row--equipment { grid-template-columns: 1.1fr 0.25fr 0.35fr 1.25fr auto; }
.sheet-table-row--wounds { grid-template-columns: 0.7fr 0.7fr 0.9fr 1fr auto; }
.sheet-table-row--careers { grid-template-columns: 0.35fr 1.4fr 0.35fr 0.35fr 0.45fr 1.1fr auto; }
.sheet-table-row--associates { grid-template-columns: 1fr 1.1fr auto; }

.sheet-cell-stack {
  display: grid;
  gap: 6px;
}

.sheet-cell-input,
.sheet-line-input,
.sheet-skill-name,
.sheet-skill-level-input,
.sheet-hex-input,
.sheet-dm-input,
.sheet-textarea {
  width: 100%;
  border: none;
  border-bottom: 1px dotted rgba(103, 232, 249, 0.28);
  background: transparent;
  padding: 2px 0 4px;
  color: #e4e4e7;
  outline: none;
}

.sheet-cell-input:focus,
.sheet-line-input:focus,
.sheet-skill-name:focus,
.sheet-skill-level-input:focus,
.sheet-hex-input:focus,
.sheet-textarea:focus {
  border-bottom-color: rgba(34, 211, 238, 0.75);
}

.sheet-remove,
.sheet-add {
  border: 1px solid rgba(34, 211, 238, 0.35);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(34, 211, 238, 0.16), rgba(34, 211, 238, 0.06));
  padding: 7px 10px;
  color: #cffafe;
  font-size: 0.82rem;
  font-weight: 700;
  transition: border-color 140ms ease, background 140ms ease, color 140ms ease, box-shadow 140ms ease;
}

.sheet-remove:hover,
.sheet-add:hover {
  border-color: rgba(34, 211, 238, 0.7);
  background:
    linear-gradient(180deg, rgba(34, 211, 238, 0.22), rgba(34, 211, 238, 0.1));
  box-shadow: 0 0 18px rgba(34, 211, 238, 0.14);
}

.sheet-add {
  justify-self: start;
}

.sheet-add--inline {
  margin-top: 6px;
}

.sheet-identity-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(220px, 0.65fr);
  gap: 14px;
}

.sheet-personal-grid {
  display: grid;
  gap: 8px;
}

.sheet-personal-split {
  display: grid;
  grid-template-columns: minmax(0, 0.55fr) minmax(0, 0.95fr);
  gap: 10px;
}

.sheet-line-field {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  color: #a1a1aa;
}

.sheet-line-field--emphasis span {
  color: #fbbf24;
  font-weight: 700;
  text-transform: uppercase;
}

.sheet-distinguishing-label {
  margin-bottom: 10px;
  color: #cbd5e1;
}

.sheet-textarea--tall {
  min-height: 186px;
  resize: vertical;
}

.sheet-characteristics-panel {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 10px;
  align-items: start;
}

.sheet-characteristic {
  display: grid;
  gap: 6px;
  justify-items: center;
}

.sheet-characteristic-label {
  color: #fbbf24;
  font-size: 1.05rem;
  font-weight: 700;
  text-transform: uppercase;
}

.sheet-hex-input,
.sheet-dm-input {
  clip-path: polygon(18% 0, 82% 0, 100% 50%, 82% 100%, 18% 100%, 0 50%);
  border: 1px solid rgba(34, 211, 238, 0.65);
  border-bottom: 1px solid rgba(34, 211, 238, 0.65);
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(8, 13, 24, 0.98));
  padding: 10px 0;
  text-align: center;
  font-weight: 700;
  color: #e0f2fe;
  box-shadow: 0 0 0 1px rgba(34, 211, 238, 0.12) inset;
}

.sheet-dm-block {
  display: grid;
  gap: 4px;
  justify-items: center;
}

.sheet-dm-block span {
  color: #94a3b8;
  font-weight: 700;
}

.sheet-panel--skills {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 12px;
}

.sheet-skills-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.sheet-skill-column {
  display: grid;
  gap: 4px;
  align-content: start;
}

.sheet-skill-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 34px;
  gap: 8px;
  align-items: center;
  min-height: 26px;
}

.sheet-skill-row--placeholder .sheet-skill-line,
.sheet-skill-row--placeholder .sheet-skill-level {
  display: block;
  border-bottom: 1px dotted rgba(103, 232, 249, 0.22);
  min-height: 18px;
}

.sheet-skill-level-input {
  text-align: center;
}

.sheet-training-box {
  display: grid;
  gap: 6px;
  grid-column: 3;
  align-self: end;
  padding-top: 8px;
}

.sheet-training-title {
  color: #fbbf24;
  font-weight: 700;
  text-transform: uppercase;
}

.sheet-finance-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px 14px;
}

.sheet-textarea--history {
  min-height: 220px;
  resize: vertical;
}

@media (max-width: 1200px) {
  .sheet-page-grid--front,
  .sheet-page-grid--back,
  .sheet-identity-grid,
  .sheet-skills-grid,
  .sheet-finance-grid {
    grid-template-columns: 1fr;
  }

  .sheet-characteristics-panel {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .sheet-training-box {
    grid-column: auto;
  }
}

@media (max-width: 760px) {
  .sheet-page-grid,
  .sheet-page-left,
  .sheet-page-right {
    gap: 12px;
  }

  .sheet-panel--vertical,
  .sheet-panel--skills {
    grid-template-columns: 1fr;
  }

  .sheet-panel-title--side {
    writing-mode: horizontal-tb;
    transform: none;
  }

  .sheet-table-header,
  .sheet-table-row {
    grid-template-columns: 1fr !important;
  }

  .sheet-characteristics-panel {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
