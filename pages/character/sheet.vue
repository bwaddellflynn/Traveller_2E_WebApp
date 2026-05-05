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
const portraitInput = ref<HTMLInputElement | null>(null)
const isPortraitDragActive = ref(false)
const portraitClearConfirmOpen = ref(false)
const isMobileSheetViewport = ref(false)
const mobileSheetMenuOpen = ref(false)
const mobileSheetActionsOpen = ref(false)
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
const associateActionLabels: Record<typeof associateGroups[number]['id'], string> = {
  contacts: 'Contact',
  allies: 'Ally',
  rivals: 'Rival',
  enemies: 'Enemy',
}
const mobileSheetSections = [
  { id: 'profile', label: 'Profile' },
  { id: 'stats', label: 'Stats' },
  { id: 'skills', label: 'Skills' },
  { id: 'loadout', label: 'Loadout' },
  { id: 'career', label: 'Career' },
  { id: 'network', label: 'Network' },
  { id: 'status', label: 'Status' },
] as const
type MobileSheetSectionId = typeof mobileSheetSections[number]['id']
const activeMobileSheetSection = ref<MobileSheetSectionId>('profile')
const activeMobileSheetSectionLabel = computed(() => mobileSheetSections.find((section) => section.id === activeMobileSheetSection.value)?.label ?? 'Profile')
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

const setCharacteristicValue = (id: TravellerCharacteristicId, nextValue: number | string) => {
  const parsed = Number(nextValue)
  draft.value.characteristics[id].value = Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0
  syncCharacteristicDm(id)
}

const adjustCharacteristicValue = (id: TravellerCharacteristicId, delta: number) => {
  setCharacteristicValue(id, (Number(draft.value.characteristics[id].value) || 0) + delta)
}

const handleCharacteristicInput = (id: TravellerCharacteristicId, event: Event) => {
  const target = event.target as HTMLInputElement | null
  setCharacteristicValue(id, target?.value ?? 0)
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

const openPortraitPicker = () => {
  portraitInput.value?.click()
}

const requestClearPortrait = () => {
  portraitClearConfirmOpen.value = true
}

const confirmClearPortrait = () => {
  portraitClearConfirmOpen.value = false
  draft.value.identity.portraitDataUrl = ''
  if (portraitInput.value) portraitInput.value.value = ''
}

const cancelClearPortrait = () => {
  portraitClearConfirmOpen.value = false
}

const applyPortraitFile = (file: File | null | undefined) => {
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    draft.value.identity.portraitDataUrl = typeof reader.result === 'string' ? reader.result : ''
    if (portraitInput.value) portraitInput.value.value = ''
  }
  reader.readAsDataURL(file)
}

const importPortrait = async (event: Event) => {
  const input = event.target as HTMLInputElement | null
  applyPortraitFile(input?.files?.[0])
}

const handlePortraitDrop = (event: DragEvent) => {
  event.preventDefault()
  isPortraitDragActive.value = false
  applyPortraitFile(event.dataTransfer?.files?.[0])
}

const updateSheetViewport = () => {
  if (!import.meta.client) return
  isMobileSheetViewport.value = window.innerWidth <= 760
  if (!isMobileSheetViewport.value) {
    mobileSheetMenuOpen.value = false
    mobileSheetActionsOpen.value = false
  }
}

const selectMobileSheetSection = (sectionId: MobileSheetSectionId) => {
  activeMobileSheetSection.value = sectionId
  mobileSheetMenuOpen.value = false
  mobileSheetActionsOpen.value = false
  portraitClearConfirmOpen.value = false
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
  updateSheetViewport()
  window.addEventListener('resize', updateSheetViewport)
  travellers.loadProfiles()
  const id = typeof route.query.id === 'string' ? route.query.id : ''
  const existing = id ? travellers.getProfile(id) : null
  const cachedDraft = loadBuilderDraft<TravellerProfile>(
    manualTravellerDraftCacheKey(id),
    MANUAL_TRAVELLER_DRAFT_CACHE_VERSION,
  )

  if (cachedDraft) {
    draft.value = cloneTravellerProfile(cachedDraft)
  } else if (existing) {
    draft.value = cloneTravellerProfile(existing)
    draft.value.metadata.lastOpenedAt = new Date().toISOString()
  }

  manualSheetDraftRestored.value = true
})

onBeforeUnmount(() => {
  if (!import.meta.client) return
  window.removeEventListener('resize', updateSheetViewport)
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
    <section class="mx-auto grid w-full max-w-[1500px] gap-6 px-4 py-6 sm:px-8 lg:px-10">
      <p v-if="saveMessage" class="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
        {{ saveMessage }}
      </p>

      <template v-if="isMobileSheetViewport">
        <div class="sheet-page">
          <div class="sheet-chrome sheet-chrome--with-actions">
            <span class="sheet-chrome__title">Traveller Character Sheet</span>
            <button
              class="sheet-chrome-actions-toggle"
              :aria-expanded="mobileSheetActionsOpen"
              aria-label="Toggle sheet actions"
              type="button"
              @click="mobileSheetActionsOpen = !mobileSheetActionsOpen"
            >
              <AppIcon name="sliders" />
            </button>
          </div>
          <div v-if="mobileSheetActionsOpen" class="sheet-chrome-actions-menu">
            <div class="sheet-toolbar">
              <button aria-label="Import JSON" class="sheet-toolbar-button" title="Import JSON" type="button" @click="openImportPicker">
                <AppIcon name="import" />
              </button>
              <button aria-label="Export JSON" class="sheet-toolbar-button" title="Export JSON" type="button" @click="exportJson">
                <AppIcon name="export" />
              </button>
              <button aria-label="Export PDF Fields" class="sheet-toolbar-button" title="Export PDF Fields" type="button" @click="exportPdfFields">
                <AppIcon name="briefcase" />
              </button>
              <button aria-label="Duplicate Sheet" class="sheet-toolbar-button" title="Duplicate Sheet" type="button" @click="duplicateSheet">
                <AppIcon name="copy" />
              </button>
              <button aria-label="Delete Sheet" class="sheet-toolbar-button sheet-toolbar-button--danger" title="Delete Sheet" type="button" @click="deleteSheet">
                <AppIcon name="trash" />
              </button>
              <button aria-label="Save Sheet" class="sheet-toolbar-button sheet-toolbar-button--primary" title="Save Sheet" type="button" @click="saveSheet">
                <AppIcon name="save" />
              </button>
            </div>
          </div>
          <input ref="importInput" accept="application/json" class="hidden" type="file" @change="importJson">
          <div class="sheet-mobile-nav">
            <button
              class="sheet-mobile-nav-toggle hud-link"
              :aria-expanded="mobileSheetMenuOpen"
              aria-label="Toggle character sheet sections"
              type="button"
              @click="mobileSheetMenuOpen = !mobileSheetMenuOpen"
            >
              <span class="sheet-mobile-nav-toggle__label">{{ activeMobileSheetSectionLabel }}</span>
              <span class="sheet-mobile-nav-toggle__icons">
                <AppIcon class="sheet-mobile-nav-icon" name="sliders" />
                <span class="sheet-mobile-nav-toggle__chevron" :class="{ 'is-open': mobileSheetMenuOpen }" aria-hidden="true" />
              </span>
            </button>

            <div v-if="mobileSheetMenuOpen" class="sheet-mobile-nav-menu">
              <button
                v-for="section in mobileSheetSections"
                :key="section.id"
                class="sheet-mobile-nav-option"
                :class="{ 'is-active': activeMobileSheetSection === section.id }"
                type="button"
                @click="selectMobileSheetSection(section.id)"
              >
                {{ section.label }}
              </button>
            </div>
          </div>

          <div class="sheet-mobile-content">
            <template v-if="activeMobileSheetSection === 'profile'">
              <section class="sheet-panel sheet-panel--personal">
                <header class="sheet-panel-title sheet-panel-title--compact">Personal Data File</header>
                <div class="sheet-personal-grid">
                  <label class="sheet-line-field sheet-line-field--personal sheet-line-field--emphasis">
                    <span>Name:</span>
                    <input v-model="draft.identity.name" class="sheet-line-input">
                  </label>
                  <label class="sheet-line-field sheet-line-field--personal">
                    <span>Title:</span>
                    <input v-model="draft.identity.title" class="sheet-line-input">
                  </label>
                  <div class="sheet-personal-split">
                    <label class="sheet-line-field sheet-line-field--personal">
                      <span>Age:</span>
                      <input v-model.number="draft.identity.age" class="sheet-line-input" min="0" type="number">
                    </label>
                    <label class="sheet-line-field sheet-line-field--personal">
                      <span>Species:</span>
                      <input v-model="draft.identity.species" class="sheet-line-input">
                    </label>
                  </div>
                  <label class="sheet-line-field sheet-line-field--personal">
                    <span>Homeworld:</span>
                    <input v-model="draft.identity.homeworld" class="sheet-line-input">
                  </label>
                  <label class="sheet-line-field sheet-line-field--personal">
                    <span>Traits:</span>
                    <input v-model="draft.identity.traits" class="sheet-line-input">
                  </label>
                </div>
              </section>

              <section class="sheet-panel">
                <div class="sheet-distinguishing-label">Distinguishing Features:</div>
                <div class="sheet-portrait-block">
                  <div
                    class="sheet-portrait-frame"
                    :class="{ 'sheet-portrait-frame--dragging': isPortraitDragActive }"
                    tabindex="0"
                    role="button"
                    aria-label="Upload portrait"
                    @click="openPortraitPicker"
                    @keydown.enter.prevent="openPortraitPicker"
                    @keydown.space.prevent="openPortraitPicker"
                    @dragenter.prevent="isPortraitDragActive = true"
                    @dragover.prevent="isPortraitDragActive = true"
                    @dragleave.prevent="isPortraitDragActive = false"
                    @drop="handlePortraitDrop"
                  >
                    <button
                      v-if="draft.identity.portraitDataUrl"
                      class="sheet-portrait-clear"
                      type="button"
                      aria-label="Remove portrait"
                      @click.stop="requestClearPortrait"
                    >
                      <AppIcon name="close" />
                    </button>
                    <div
                      v-if="portraitClearConfirmOpen"
                      class="sheet-portrait-confirm"
                      @click.stop
                    >
                      <p class="sheet-portrait-confirm-text">Remove portrait?</p>
                      <div class="sheet-portrait-confirm-actions">
                        <button class="sheet-portrait-confirm-button" type="button" @click="cancelClearPortrait">
                          Cancel
                        </button>
                        <button class="sheet-portrait-confirm-button sheet-portrait-confirm-button--danger" type="button" @click="confirmClearPortrait">
                          Remove
                        </button>
                      </div>
                    </div>
                    <img
                      v-if="draft.identity.portraitDataUrl"
                      :src="draft.identity.portraitDataUrl"
                      alt="Traveller portrait"
                      class="sheet-portrait-image"
                    >
                    <div v-else class="sheet-portrait-placeholder">
                      <span class="sheet-portrait-placeholder-icons">
                        <AppIcon class="sheet-portrait-icon sheet-portrait-icon--primary sheet-portrait-icon--large" name="portrait" />
                      </span>
                    </div>
                  </div>
                  <input
                    ref="portraitInput"
                    accept="image/*"
                    class="hidden"
                    type="file"
                    @change="importPortrait"
                  >
                </div>
              </section>
            </template>

            <section v-else-if="activeMobileSheetSection === 'stats'" class="sheet-characteristics-panel sheet-characteristics-panel--mobile">
              <div
                v-for="id in characteristicIds"
                :key="id"
                class="sheet-characteristic"
              >
                <span class="sheet-characteristic-label">{{ draft.characteristics[id].abbreviation }}</span>
                <div class="sheet-stat-entry">
                  <input
                    :value="draft.characteristics[id].value"
                    class="sheet-hex-input"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    type="text"
                    @input="handleCharacteristicInput(id, $event)"
                  >
                  <div class="sheet-stepper">
                    <button class="sheet-stepper-button" type="button" @click="adjustCharacteristicValue(id, 1)">
                      <AppIcon class="sheet-stepper-icon sheet-stepper-icon--up" name="arrow" />
                    </button>
                    <button class="sheet-stepper-button" type="button" @click="adjustCharacteristicValue(id, -1)">
                      <AppIcon class="sheet-stepper-icon sheet-stepper-icon--down" name="arrow" />
                    </button>
                  </div>
                </div>
                <div class="sheet-dm-block">
                  <input :value="formatDm(draft.characteristics[id].dm)" class="sheet-dm-input" readonly>
                  <span>DM</span>
                </div>
              </div>
            </section>

            <section v-else-if="activeMobileSheetSection === 'skills'" class="sheet-panel sheet-panel--skills">
              <header class="sheet-panel-title sheet-panel-title--side">Skills</header>
              <div class="sheet-skills-grid">
                <div v-for="(column, columnIndex) in skillColumns" :key="`mobile-skills-${columnIndex}`" class="sheet-skill-column">
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
                  <label class="sheet-line-field sheet-line-field--stacked">
                    <span>Skill:</span>
                    <input :value="trainingSkill?.name ?? ''" class="sheet-line-input" readonly>
                  </label>
                  <label class="sheet-line-field sheet-line-field--stacked">
                    <span>Completed Weeks:</span>
                    <input class="sheet-line-input" readonly>
                  </label>
                  <label class="sheet-line-field sheet-line-field--stacked">
                    <span>Completed Study Periods:</span>
                    <input class="sheet-line-input" readonly>
                  </label>
                  <button class="sheet-add sheet-add--inline" type="button" @click="addSkill">Add Skill</button>
                </div>
              </div>
            </section>

            <template v-else-if="activeMobileSheetSection === 'loadout'">
              <section class="sheet-panel sheet-panel--vertical">
                <header class="sheet-panel-title sheet-panel-title--side">Augments</header>
                <div class="sheet-table">
                  <div class="sheet-table-body">
                    <div v-for="(augment, index) in draft.augments" :key="augment.id" class="sheet-table-row sheet-table-row--augments">
                      <div class="sheet-cell-stack">
                        <input v-model="augment.name" class="sheet-cell-input" placeholder="Name">
                        <input v-model="augment.traits" class="sheet-cell-input" placeholder="Traits">
                      </div>
                      <div class="sheet-meta-grid sheet-meta-grid--augment">
                        <input v-model="augment.type" class="sheet-cell-input" placeholder="Type">
                        <input v-model="augment.techLevel" class="sheet-cell-input" placeholder="TL">
                      </div>
                      <button aria-label="Remove augment" class="sheet-remove" title="Remove augment" type="button" @click="removeAugment(index)">
                        <AppIcon name="close" />
                      </button>
                    </div>
                    <button class="sheet-add" type="button" @click="addAugment">Add Augment</button>
                  </div>
                </div>
              </section>

              <section class="sheet-panel sheet-panel--vertical">
                <header class="sheet-panel-title sheet-panel-title--side">Armour</header>
                <div class="sheet-table">
                  <div class="sheet-table-body">
                    <div v-for="(armour, index) in draft.armour" :key="armour.id" class="sheet-table-row sheet-table-row--armour">
                      <div class="sheet-cell-stack">
                        <input v-model="armour.name" class="sheet-cell-input" placeholder="Name">
                        <input v-model="armour.type" class="sheet-cell-input" placeholder="Type">
                      </div>
                      <div class="sheet-meta-grid sheet-meta-grid--armour">
                        <input v-model="armour.radiationProtection" class="sheet-cell-input" placeholder="Rad">
                        <input v-model="armour.protection" class="sheet-cell-input" placeholder="Protection">
                        <input v-model="armour.kg" class="sheet-cell-input" placeholder="Kg">
                      </div>
                      <div class="sheet-cell-stack">
                        <input v-model="armour.options" class="sheet-cell-input" placeholder="Options">
                        <input v-model="armour.traits" class="sheet-cell-input" placeholder="Traits">
                      </div>
                      <button aria-label="Remove armour" class="sheet-remove" title="Remove armour" type="button" @click="removeArmour(index)">
                        <AppIcon name="close" />
                      </button>
                    </div>
                    <button class="sheet-add" type="button" @click="addArmour">Add Armour</button>
                  </div>
                </div>
              </section>

              <section class="sheet-panel sheet-panel--vertical">
                <header class="sheet-panel-title sheet-panel-title--side">Weapons</header>
                <div class="sheet-table">
                  <div class="sheet-table-body">
                    <div v-for="(weapon, index) in draft.weapons" :key="weapon.id" class="sheet-table-row sheet-table-row--weapons">
                      <input v-model="weapon.name" class="sheet-cell-input" placeholder="Name">
                      <div class="sheet-meta-grid sheet-meta-grid--weapon">
                        <input v-model="weapon.techLevel" class="sheet-cell-input" placeholder="TL">
                        <input v-model="weapon.range" class="sheet-cell-input" placeholder="Range">
                        <input v-model="weapon.damage" class="sheet-cell-input" placeholder="Damage">
                        <input v-model="weapon.kg" class="sheet-cell-input" placeholder="Kg">
                        <input v-model="weapon.magazine" class="sheet-cell-input" placeholder="Mag">
                      </div>
                      <div class="sheet-cell-stack">
                        <input v-model="weapon.traits" class="sheet-cell-input" placeholder="Traits">
                        <input v-model="weapon.notes" class="sheet-cell-input" placeholder="Notes">
                      </div>
                      <button aria-label="Remove weapon" class="sheet-remove" title="Remove weapon" type="button" @click="removeWeapon(index)">
                        <AppIcon name="close" />
                      </button>
                    </div>
                    <button class="sheet-add" type="button" @click="addWeapon">Add Weapon</button>
                  </div>
                </div>
              </section>

              <section class="sheet-panel sheet-panel--vertical">
                <header class="sheet-panel-title sheet-panel-title--side">Equipment</header>
                <div class="sheet-table">
                  <div class="sheet-table-body">
                    <div v-for="(item, index) in draft.equipment" :key="item.id" class="sheet-table-row sheet-table-row--equipment">
                      <div class="sheet-cell-stack">
                        <input v-model="item.name" class="sheet-cell-input" placeholder="Name">
                        <input v-model="item.traits" class="sheet-cell-input" placeholder="Type / traits">
                      </div>
                      <div class="sheet-meta-grid sheet-meta-grid--equipment">
                        <input v-model="item.techLevel" class="sheet-cell-input" placeholder="TL">
                        <input v-model="item.kg" class="sheet-cell-input" placeholder="Kg">
                      </div>
                      <input v-model="item.notes" class="sheet-cell-input" placeholder="Notes">
                      <button aria-label="Remove equipment" class="sheet-remove" title="Remove equipment" type="button" @click="removeEquipment(index)">
                        <AppIcon name="close" />
                      </button>
                    </div>
                    <button class="sheet-add" type="button" @click="addEquipment">Add Equipment</button>
                  </div>
                </div>
              </section>
            </template>

            <template v-else-if="activeMobileSheetSection === 'career'">
              <section class="sheet-panel">
                <header class="sheet-panel-title sheet-panel-title--compact">Careers</header>
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
                    <div v-for="(term, index) in draft.careers" :key="`mobile-${term.termNumber}-${index}`" class="sheet-table-row sheet-table-row--careers">
                      <input v-model.number="term.termNumber" class="sheet-cell-input" type="number">
                      <input v-model="term.summary" class="sheet-cell-input" placeholder="Career / assignment">
                      <input :value="term.rolls.find((roll) => roll.label === 'Survival')?.total ?? ''" class="sheet-cell-input" readonly>
                      <input :value="term.rolls.find((roll) => roll.label === 'Advancement')?.total ?? ''" class="sheet-cell-input" readonly>
                      <input :value="`${term.startAge}-${term.endAge}`" class="sheet-cell-input" readonly>
                      <input :value="term.details.join(' | ')" class="sheet-cell-input" placeholder="Notes" readonly>
                      <button aria-label="Remove career" class="sheet-remove" title="Remove career" type="button" @click="removeCareer(index)">
                        <AppIcon name="close" />
                      </button>
                    </div>
                    <button class="sheet-add" type="button" @click="addCareer">Add Career</button>
                  </div>
                </div>
              </section>

              <section class="sheet-panel">
                <header class="sheet-panel-title sheet-panel-title--compact">History &amp; Background</header>
                <textarea v-model="historyBackgroundLines" class="sheet-textarea sheet-textarea--history" />
              </section>
            </template>

            <template v-else-if="activeMobileSheetSection === 'network'">
              <section
                v-for="group in associateGroups"
                :key="`mobile-${group.id}`"
                class="sheet-panel"
              >
                <header class="sheet-panel-title sheet-panel-title--compact sheet-panel-title--actionable">
                  <span>{{ group.label }}</span>
                  <button
                    :aria-label="`Add ${associateActionLabels[group.id]}`"
                    class="sheet-panel-action"
                    :title="`Add ${associateActionLabels[group.id]}`"
                    type="button"
                    @click="addAssociate(group.id)"
                  >
                    <AppIcon name="plus" />
                  </button>
                </header>
                <div class="sheet-table">
                  <div class="sheet-table-header sheet-table-header--associates">
                    <span>Name</span>
                    <span>Notes</span>
                  </div>
                  <div class="sheet-table-body">
                    <div v-for="(associate, index) in draft.associates[group.id]" :key="associate.id" class="sheet-table-row sheet-table-row--associates">
                      <input v-model="associate.name" class="sheet-cell-input" placeholder="Name">
                      <input v-model="associate.notes" class="sheet-cell-input" placeholder="Notes">
                      <button :aria-label="`Remove ${associateActionLabels[group.id].toLowerCase()}`" class="sheet-remove" :title="`Remove ${associateActionLabels[group.id].toLowerCase()}`" type="button" @click="removeAssociate(group.id, index)">
                        <AppIcon name="close" />
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </template>

            <template v-else-if="activeMobileSheetSection === 'status'">
              <section class="sheet-panel">
                <header class="sheet-panel-title sheet-panel-title--compact">Finances</header>
                <div class="sheet-finance-grid">
                  <label class="sheet-line-field sheet-line-field--stacked sheet-line-field--emphasis">
                    <span>Cash:</span>
                    <input v-model.number="draft.finances.cashOnHand" class="sheet-line-input" type="number">
                  </label>
                  <label class="sheet-line-field sheet-line-field--stacked sheet-line-field--emphasis">
                    <span>Monthly Cash Flow:</span>
                    <input v-model="draft.finances.monthlyCashFlow" class="sheet-line-input">
                  </label>
                  <label class="sheet-line-field sheet-line-field--stacked">
                    <span>Ship Shares:</span>
                    <input v-model.number="draft.finances.shipShares" class="sheet-line-input" type="number">
                  </label>
                  <label class="sheet-line-field sheet-line-field--stacked">
                    <span>Income:</span>
                    <input v-model="draft.finances.income" class="sheet-line-input">
                  </label>
                  <label class="sheet-line-field sheet-line-field--stacked">
                    <span>Living Costs:</span>
                    <input v-model="draft.finances.livingCosts" class="sheet-line-input">
                  </label>
                  <label class="sheet-line-field sheet-line-field--stacked">
                    <span>Debt:</span>
                    <input v-model.number="draft.finances.debt" class="sheet-line-input" type="number">
                  </label>
                  <label class="sheet-line-field sheet-line-field--stacked">
                    <span>Annual Pension:</span>
                    <input v-model="draft.finances.annualPension" class="sheet-line-input">
                  </label>
                  <label class="sheet-line-field sheet-line-field--stacked">
                    <span>Ship Payments:</span>
                    <input v-model="draft.finances.shipPayments" class="sheet-line-input">
                  </label>
                </div>
              </section>

              <section class="sheet-panel">
                <header class="sheet-panel-title sheet-panel-title--compact">Wounds</header>
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
                      <button aria-label="Remove wound" class="sheet-remove" title="Remove wound" type="button" @click="removeWound(index)">
                        <AppIcon name="close" />
                      </button>
                    </div>
                    <button class="sheet-add" type="button" @click="addWound">Add Wound</button>
                  </div>
                </div>
              </section>
            </template>
          </div>
        </div>
      </template>

      <template v-else>
      <div class="sheet-page">
        <div class="sheet-chrome sheet-chrome--with-actions">
          <span class="sheet-chrome__title">Traveller Character Sheet</span>
          <div class="sheet-toolbar">
            <button aria-label="Import JSON" class="sheet-toolbar-button" title="Import JSON" type="button" @click="openImportPicker">
              <AppIcon name="import" />
            </button>
            <button aria-label="Export JSON" class="sheet-toolbar-button" title="Export JSON" type="button" @click="exportJson">
              <AppIcon name="export" />
            </button>
            <button aria-label="Export PDF Fields" class="sheet-toolbar-button" title="Export PDF Fields" type="button" @click="exportPdfFields">
              <AppIcon name="briefcase" />
            </button>
            <button aria-label="Duplicate Sheet" class="sheet-toolbar-button" title="Duplicate Sheet" type="button" @click="duplicateSheet">
              <AppIcon name="copy" />
            </button>
            <button aria-label="Delete Sheet" class="sheet-toolbar-button sheet-toolbar-button--danger" title="Delete Sheet" type="button" @click="deleteSheet">
              <AppIcon name="trash" />
            </button>
            <button aria-label="Save Sheet" class="sheet-toolbar-button sheet-toolbar-button--primary" title="Save Sheet" type="button" @click="saveSheet">
              <AppIcon name="save" />
            </button>
          </div>
          <input ref="importInput" accept="application/json" class="hidden" type="file" @change="importJson">
        </div>
        <div class="sheet-page-grid sheet-page-grid--front">
          <div class="sheet-page-left">
            <section class="sheet-panel sheet-panel--vertical">
              <header class="sheet-panel-title sheet-panel-title--side">Augments</header>
              <div class="sheet-table">
                <div class="sheet-table-body">
                  <div v-for="(augment, index) in draft.augments" :key="augment.id" class="sheet-table-row sheet-table-row--augments">
                    <div class="sheet-cell-stack">
                      <input v-model="augment.name" class="sheet-cell-input" placeholder="Name">
                      <input v-model="augment.traits" class="sheet-cell-input" placeholder="Traits">
                    </div>
                    <div class="sheet-meta-grid sheet-meta-grid--augment">
                      <input v-model="augment.type" class="sheet-cell-input" placeholder="Type">
                      <input v-model="augment.techLevel" class="sheet-cell-input" placeholder="TL">
                    </div>
                    <button aria-label="Remove augment" class="sheet-remove" title="Remove augment" type="button" @click="removeAugment(index)">
                      <AppIcon name="close" />
                    </button>
                  </div>
                  <button class="sheet-add" type="button" @click="addAugment">Add Augment</button>
                </div>
              </div>
            </section>

            <section class="sheet-panel sheet-panel--vertical">
              <header class="sheet-panel-title sheet-panel-title--side">Armour</header>
              <div class="sheet-table">
                <div class="sheet-table-body">
                  <div v-for="(armour, index) in draft.armour" :key="armour.id" class="sheet-table-row sheet-table-row--armour">
                    <div class="sheet-cell-stack">
                      <input v-model="armour.name" class="sheet-cell-input" placeholder="Name">
                      <input v-model="armour.type" class="sheet-cell-input" placeholder="Type">
                    </div>
                    <div class="sheet-meta-grid sheet-meta-grid--armour">
                      <input v-model="armour.radiationProtection" class="sheet-cell-input" placeholder="Rad">
                      <input v-model="armour.protection" class="sheet-cell-input" placeholder="Protection">
                      <input v-model="armour.kg" class="sheet-cell-input" placeholder="Kg">
                    </div>
                    <div class="sheet-cell-stack">
                      <input v-model="armour.options" class="sheet-cell-input" placeholder="Options">
                      <input v-model="armour.traits" class="sheet-cell-input" placeholder="Traits">
                    </div>
                    <button aria-label="Remove armour" class="sheet-remove" title="Remove armour" type="button" @click="removeArmour(index)">
                      <AppIcon name="close" />
                    </button>
                  </div>
                  <button class="sheet-add" type="button" @click="addArmour">Add Armour</button>
                </div>
              </div>
            </section>

            <section class="sheet-panel sheet-panel--vertical">
              <header class="sheet-panel-title sheet-panel-title--side">Weapons</header>
              <div class="sheet-table">
                <div class="sheet-table-body">
                  <div v-for="(weapon, index) in draft.weapons" :key="weapon.id" class="sheet-table-row sheet-table-row--weapons">
                    <input v-model="weapon.name" class="sheet-cell-input" placeholder="Name">
                    <div class="sheet-meta-grid sheet-meta-grid--weapon">
                      <input v-model="weapon.techLevel" class="sheet-cell-input" placeholder="TL">
                      <input v-model="weapon.range" class="sheet-cell-input" placeholder="Range">
                      <input v-model="weapon.damage" class="sheet-cell-input" placeholder="Damage">
                      <input v-model="weapon.kg" class="sheet-cell-input" placeholder="Kg">
                      <input v-model="weapon.magazine" class="sheet-cell-input" placeholder="Mag">
                    </div>
                    <div class="sheet-cell-stack">
                      <input v-model="weapon.traits" class="sheet-cell-input" placeholder="Traits">
                      <input v-model="weapon.notes" class="sheet-cell-input" placeholder="Notes">
                    </div>
                    <button aria-label="Remove weapon" class="sheet-remove" title="Remove weapon" type="button" @click="removeWeapon(index)">
                      <AppIcon name="close" />
                    </button>
                  </div>
                  <button class="sheet-add" type="button" @click="addWeapon">Add Weapon</button>
                </div>
              </div>
            </section>

            <section class="sheet-panel sheet-panel--vertical">
              <header class="sheet-panel-title sheet-panel-title--side">Equipment</header>
              <div class="sheet-table">
                <div class="sheet-table-body">
                  <div v-for="(item, index) in draft.equipment" :key="item.id" class="sheet-table-row sheet-table-row--equipment">
                    <div class="sheet-cell-stack">
                      <input v-model="item.name" class="sheet-cell-input" placeholder="Name">
                      <input v-model="item.traits" class="sheet-cell-input" placeholder="Type / traits">
                    </div>
                    <div class="sheet-meta-grid sheet-meta-grid--equipment">
                      <input v-model="item.techLevel" class="sheet-cell-input" placeholder="TL">
                      <input v-model="item.kg" class="sheet-cell-input" placeholder="Kg">
                    </div>
                    <input v-model="item.notes" class="sheet-cell-input" placeholder="Notes">
                    <button aria-label="Remove equipment" class="sheet-remove" title="Remove equipment" type="button" @click="removeEquipment(index)">
                      <AppIcon name="close" />
                    </button>
                  </div>
                  <button class="sheet-add" type="button" @click="addEquipment">Add Equipment</button>
                </div>
              </div>
            </section>
          </div>

          <div class="sheet-page-right">
            <div class="sheet-identity-grid">
              <section class="sheet-panel sheet-panel--personal">
                <header class="sheet-panel-title sheet-panel-title--compact">Personal Data File</header>
                <div class="sheet-personal-grid">
                  <label class="sheet-line-field sheet-line-field--personal sheet-line-field--emphasis">
                    <span>Name:</span>
                    <input v-model="draft.identity.name" class="sheet-line-input">
                  </label>
                  <label class="sheet-line-field sheet-line-field--personal">
                    <span>Title:</span>
                    <input v-model="draft.identity.title" class="sheet-line-input">
                  </label>
                  <div class="sheet-personal-split">
                    <label class="sheet-line-field sheet-line-field--personal">
                      <span>Age:</span>
                      <input v-model.number="draft.identity.age" class="sheet-line-input" min="0" type="number">
                    </label>
                    <label class="sheet-line-field sheet-line-field--personal">
                      <span>Species:</span>
                      <input v-model="draft.identity.species" class="sheet-line-input">
                    </label>
                  </div>
                  <label class="sheet-line-field sheet-line-field--personal">
                    <span>Homeworld:</span>
                    <input v-model="draft.identity.homeworld" class="sheet-line-input">
                  </label>
                  <label class="sheet-line-field sheet-line-field--personal">
                    <span>Traits:</span>
                    <input v-model="draft.identity.traits" class="sheet-line-input">
                  </label>
                </div>
              </section>

              <section class="sheet-panel">
                <div class="sheet-distinguishing-label">Distinguishing Features:</div>
                <div class="sheet-portrait-block">
                  <div
                    class="sheet-portrait-frame"
                    :class="{ 'sheet-portrait-frame--dragging': isPortraitDragActive }"
                    tabindex="0"
                    role="button"
                    aria-label="Upload portrait"
                    @click="openPortraitPicker"
                    @keydown.enter.prevent="openPortraitPicker"
                    @keydown.space.prevent="openPortraitPicker"
                    @dragenter.prevent="isPortraitDragActive = true"
                    @dragover.prevent="isPortraitDragActive = true"
                    @dragleave.prevent="isPortraitDragActive = false"
                    @drop="handlePortraitDrop"
                  >
                    <button
                      v-if="draft.identity.portraitDataUrl"
                      class="sheet-portrait-clear"
                      type="button"
                      aria-label="Remove portrait"
                      @click.stop="requestClearPortrait"
                    >
                      <AppIcon name="close" />
                    </button>
                    <div
                      v-if="portraitClearConfirmOpen"
                      class="sheet-portrait-confirm"
                      @click.stop
                    >
                      <p class="sheet-portrait-confirm-text">Remove portrait?</p>
                      <div class="sheet-portrait-confirm-actions">
                        <button class="sheet-portrait-confirm-button" type="button" @click="cancelClearPortrait">
                          Cancel
                        </button>
                        <button class="sheet-portrait-confirm-button sheet-portrait-confirm-button--danger" type="button" @click="confirmClearPortrait">
                          Remove
                        </button>
                      </div>
                    </div>
                    <img
                      v-if="draft.identity.portraitDataUrl"
                      :src="draft.identity.portraitDataUrl"
                      alt="Traveller portrait"
                      class="sheet-portrait-image"
                    >
                    <div v-else class="sheet-portrait-placeholder">
                      <span class="sheet-portrait-placeholder-icons">
                        <AppIcon class="sheet-portrait-icon sheet-portrait-icon--primary sheet-portrait-icon--large" name="portrait" />
                      </span>
                    </div>
                  </div>
                  <input
                    ref="portraitInput"
                    accept="image/*"
                    class="hidden"
                    type="file"
                    @change="importPortrait"
                  >
                </div>
              </section>
            </div>

            <section class="sheet-characteristics-panel">
              <div
                v-for="id in characteristicIds"
                :key="id"
                class="sheet-characteristic"
              >
                <span class="sheet-characteristic-label">{{ draft.characteristics[id].abbreviation }}</span>
                <div class="sheet-stat-entry">
                  <input
                    :value="draft.characteristics[id].value"
                    class="sheet-hex-input"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    type="text"
                    @input="handleCharacteristicInput(id, $event)"
                  >
                  <div class="sheet-stepper">
                    <button class="sheet-stepper-button" type="button" @click="adjustCharacteristicValue(id, 1)">
                      <AppIcon class="sheet-stepper-icon sheet-stepper-icon--up" name="arrow" />
                    </button>
                    <button class="sheet-stepper-button" type="button" @click="adjustCharacteristicValue(id, -1)">
                      <AppIcon class="sheet-stepper-icon sheet-stepper-icon--down" name="arrow" />
                    </button>
                  </div>
                </div>
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
                  <label class="sheet-line-field sheet-line-field--stacked">
                    <span>Skill:</span>
                    <input :value="trainingSkill?.name ?? ''" class="sheet-line-input" readonly>
                  </label>
                  <label class="sheet-line-field sheet-line-field--stacked">
                    <span>Completed Weeks:</span>
                    <input class="sheet-line-input" readonly>
                  </label>
                  <label class="sheet-line-field sheet-line-field--stacked">
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
              <header class="sheet-panel-title sheet-panel-title--compact">Finances</header>
              <div class="sheet-finance-grid">
                <label class="sheet-line-field sheet-line-field--stacked sheet-line-field--emphasis">
                  <span>Cash:</span>
                  <input v-model.number="draft.finances.cashOnHand" class="sheet-line-input" type="number">
                </label>
                <label class="sheet-line-field sheet-line-field--stacked sheet-line-field--emphasis">
                  <span>Monthly Cash Flow:</span>
                  <input v-model="draft.finances.monthlyCashFlow" class="sheet-line-input">
                </label>
                <label class="sheet-line-field sheet-line-field--stacked">
                  <span>Ship Shares:</span>
                  <input v-model.number="draft.finances.shipShares" class="sheet-line-input" type="number">
                </label>
                <label class="sheet-line-field sheet-line-field--stacked">
                  <span>Income:</span>
                  <input v-model="draft.finances.income" class="sheet-line-input">
                </label>
                <label class="sheet-line-field sheet-line-field--stacked">
                  <span>Living Costs:</span>
                  <input v-model="draft.finances.livingCosts" class="sheet-line-input">
                </label>
                <label class="sheet-line-field sheet-line-field--stacked">
                  <span>Debt:</span>
                  <input v-model.number="draft.finances.debt" class="sheet-line-input" type="number">
                </label>
                <label class="sheet-line-field sheet-line-field--stacked">
                  <span>Annual Pension:</span>
                  <input v-model="draft.finances.annualPension" class="sheet-line-input">
                </label>
                <label class="sheet-line-field sheet-line-field--stacked">
                  <span>Ship Payments:</span>
                  <input v-model="draft.finances.shipPayments" class="sheet-line-input">
                </label>
              </div>
            </section>

            <section class="sheet-panel">
              <header class="sheet-panel-title sheet-panel-title--compact">Wounds</header>
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
                    <button aria-label="Remove wound" class="sheet-remove" title="Remove wound" type="button" @click="removeWound(index)">
                      <AppIcon name="close" />
                    </button>
                  </div>
                  <button class="sheet-add" type="button" @click="addWound">Add Wound</button>
                </div>
              </div>
            </section>

            <section class="sheet-panel">
              <header class="sheet-panel-title sheet-panel-title--compact">Careers</header>
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
                    <button aria-label="Remove career" class="sheet-remove" title="Remove career" type="button" @click="removeCareer(index)">
                      <AppIcon name="close" />
                    </button>
                  </div>
                  <button class="sheet-add" type="button" @click="addCareer">Add Career</button>
                </div>
              </div>
            </section>

            <section class="sheet-panel">
              <header class="sheet-panel-title sheet-panel-title--compact">History &amp; Background</header>
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
              <header class="sheet-panel-title sheet-panel-title--compact sheet-panel-title--actionable">
                <span>{{ group.label }}</span>
                <button
                  :aria-label="`Add ${associateActionLabels[group.id]}`"
                  class="sheet-panel-action"
                  :title="`Add ${associateActionLabels[group.id]}`"
                  type="button"
                  @click="addAssociate(group.id)"
                >
                  <AppIcon name="plus" />
                </button>
              </header>
              <div class="sheet-table">
                <div class="sheet-table-header sheet-table-header--associates">
                  <span>Name</span>
                  <span>Notes</span>
                </div>
                <div class="sheet-table-body">
                  <div v-for="(associate, index) in draft.associates[group.id]" :key="associate.id" class="sheet-table-row sheet-table-row--associates">
                    <input v-model="associate.name" class="sheet-cell-input" placeholder="Name">
                    <input v-model="associate.notes" class="sheet-cell-input" placeholder="Notes">
                    <button :aria-label="`Remove ${associateActionLabels[group.id].toLowerCase()}`" class="sheet-remove" :title="`Remove ${associateActionLabels[group.id].toLowerCase()}`" type="button" @click="removeAssociate(group.id, index)">
                      <AppIcon name="close" />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
      </template>
    </section>
  </main>
</template>

<style scoped>
.sheet-page {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(34, 211, 238, 0.42);
  border-radius: 16px 0 16px 0;
  clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 18px 100%, 0 calc(100% - 18px));
  background:
    linear-gradient(180deg, rgba(8, 18, 32, 0.96), rgba(3, 7, 18, 0.96)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.16), transparent 24rem);
  box-shadow:
    0 0 26px rgba(34, 211, 238, 0.13),
    inset 0 0 36px rgba(34, 211, 238, 0.07),
    0 0 0 1px rgba(34, 211, 238, 0.08) inset,
    0 0 0 10px rgba(7, 12, 21, 0.55) inset,
    0 20px 50px rgba(0, 0, 0, 0.35);
}

.sheet-page::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-top: 1px solid rgba(103, 232, 249, 0.65);
  background:
    linear-gradient(90deg, rgba(34, 211, 238, 0.44), transparent 22%, transparent 78%, rgba(34, 211, 238, 0.38)) top / 100% 2px no-repeat;
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

.sheet-chrome--with-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.sheet-chrome__title {
  min-width: 0;
}

.sheet-chrome-actions-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid rgba(34, 211, 238, 0.34);
  border-radius: 10px 0 10px 0;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  background:
    linear-gradient(180deg, rgba(8, 18, 32, 0.86), rgba(3, 7, 18, 0.9)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.14), transparent 8rem);
  color: #67e8f9;
}

.sheet-chrome-actions-menu {
  padding: 12px 16px 0;
}

.sheet-mobile-nav {
  display: grid;
  gap: 10px;
  padding: 14px 16px 0;
}

.sheet-mobile-nav-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 44px;
  padding: 0.75rem 0.9rem;
  border: 1px solid rgba(34, 211, 238, 0.32);
  border-radius: 10px 0 10px 0;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
}

.sheet-mobile-nav-toggle__label {
  color: #e0f2fe;
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.sheet-mobile-nav-toggle__icons {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #67e8f9;
}

.sheet-mobile-nav-icon {
  width: 0.95rem;
  height: 0.95rem;
}

.sheet-mobile-nav-toggle__chevron {
  width: 0.55rem;
  height: 0.55rem;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: rotate(45deg) translateY(-0.1rem);
  transition: transform 160ms ease;
}

.sheet-mobile-nav-toggle__chevron.is-open {
  transform: rotate(225deg) translateY(-0.1rem);
}

.sheet-mobile-nav-menu {
  display: grid;
  gap: 8px;
}

.sheet-mobile-nav-option {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-height: 40px;
  width: 100%;
  padding: 0 0.9rem;
  border: 1px solid rgba(34, 211, 238, 0.22);
  border-radius: 8px 0 8px 0;
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
  background: rgba(8, 18, 32, 0.72);
  color: #cbd5e1;
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.sheet-mobile-nav-option.is-active {
  border-color: rgba(34, 211, 238, 0.48);
  color: #e0f2fe;
  box-shadow: 0 0 14px rgba(34, 211, 238, 0.1);
}

.sheet-mobile-content {
  display: grid;
  gap: 12px;
  padding: 14px 16px 16px;
}

.sheet-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.sheet-toolbar-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px 0 10px 0;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  background:
    linear-gradient(180deg, rgba(8, 18, 32, 0.9), rgba(3, 7, 18, 0.92)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.14), transparent 8rem);
  color: #f4f4f5;
  transition: border-color 140ms ease, color 140ms ease, box-shadow 140ms ease, background 140ms ease;
}

.sheet-toolbar-button:hover,
.sheet-toolbar-button:focus-visible {
  border-color: rgba(251, 191, 36, 0.62);
  color: #fde68a;
  box-shadow: 0 0 16px rgba(34, 211, 238, 0.14);
  outline: none;
}

.sheet-toolbar-button--danger {
  border-color: rgba(252, 165, 165, 0.45);
  color: #fee2e2;
}

.sheet-toolbar-button--danger:hover,
.sheet-toolbar-button--danger:focus-visible {
  border-color: rgba(248, 113, 113, 0.72);
  color: #fff;
  box-shadow: 0 0 16px rgba(248, 113, 113, 0.18);
}

.sheet-toolbar-button--primary {
  border-color: rgba(251, 191, 36, 0.55);
  background:
    linear-gradient(180deg, rgba(251, 191, 36, 0.92), rgba(245, 158, 11, 0.88));
  color: #111827;
}

.sheet-toolbar-button--primary:hover,
.sheet-toolbar-button--primary:focus-visible {
  border-color: rgba(253, 224, 71, 0.82);
  color: #111827;
  box-shadow: 0 0 18px rgba(251, 191, 36, 0.2);
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
  overflow: hidden;
  border: 1px solid rgba(34, 211, 238, 0.34);
  border-radius: 12px 0 12px 0;
  clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px));
  background:
    linear-gradient(180deg, rgba(8, 18, 32, 0.9), rgba(3, 7, 18, 0.9)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.08), transparent 16rem);
  padding: 12px 14px 14px;
  box-shadow:
    0 0 18px rgba(34, 211, 238, 0.08),
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
  display: flex;
  align-items: center;
  width: calc(100% + 28px);
  margin: -12px -14px 12px;
  padding: 7px 14px 8px;
  background:
    linear-gradient(90deg, rgba(34, 211, 238, 0.28), rgba(34, 211, 238, 0.08) 55%, rgba(15, 23, 42, 0.7)),
    rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(34, 211, 238, 0.28);
  border-left: 0;
  border-right: 0;
  border-top: 0;
  border-radius: 0;
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 100%);
  box-shadow:
    0 0 0 1px rgba(34, 211, 238, 0.08) inset;
  color: #cffafe;
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  line-height: 1.15;
  white-space: normal;
  overflow-wrap: anywhere;
}

.sheet-panel-title--side {
  display: flex;
  margin: 0;
  width: auto;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  border-radius: 10px 0 10px 0;
  border: 1px solid rgba(34, 211, 238, 0.28);
  padding: 12px 8px;
  text-align: center;
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
}

.sheet-panel-title--compact {
  font-size: 0.82rem;
  padding-inline: 12px;
}

.sheet-panel-title--actionable {
  justify-content: space-between;
  gap: 0.75rem;
}

.sheet-panel-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 2rem;
  height: 2rem;
  border: 1px solid rgba(34, 211, 238, 0.32);
  border-radius: 10px 0 10px 0;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  background:
    linear-gradient(180deg, rgba(10, 18, 32, 0.92), rgba(4, 10, 22, 0.92)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.1), transparent 5rem);
  color: #67e8f9;
  box-shadow:
    inset 0 0 0 1px rgba(34, 211, 238, 0.05),
    0 0 0 rgba(34, 211, 238, 0);
  transition: border-color 140ms ease, color 140ms ease, box-shadow 140ms ease, background 140ms ease;
}

.sheet-panel-action:hover,
.sheet-panel-action:focus-visible {
  border-color: rgba(34, 211, 238, 0.72);
  color: #cffafe;
  box-shadow:
    inset 0 0 0 1px rgba(34, 211, 238, 0.08),
    0 0 18px rgba(34, 211, 238, 0.14);
  outline: none;
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

.sheet-table-row--augments { grid-template-columns: minmax(0, 1.7fr) minmax(180px, 0.9fr) auto; }
.sheet-table-row--armour { grid-template-columns: minmax(0, 1.25fr) minmax(210px, 0.9fr) minmax(0, 1.15fr) auto; }
.sheet-table-row--weapons { grid-template-columns: minmax(0, 1.2fr) minmax(260px, 1fr) minmax(0, 1.15fr) auto; }
.sheet-table-row--equipment { grid-template-columns: minmax(0, 1.3fr) minmax(140px, 0.55fr) minmax(0, 1fr) auto; }
.sheet-table-row--wounds { grid-template-columns: 0.7fr 0.7fr 0.9fr 1fr auto; }
.sheet-table-row--careers { grid-template-columns: 0.35fr 1.4fr 0.35fr 0.35fr 0.45fr 1.1fr auto; }
.sheet-table-row--associates { grid-template-columns: 1fr 1.1fr auto; }

.sheet-cell-stack {
  display: grid;
  gap: 6px;
}

.sheet-meta-grid {
  display: grid;
  gap: 6px;
  align-content: start;
}

.sheet-meta-grid--augment,
.sheet-meta-grid--equipment {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.sheet-meta-grid--armour {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.sheet-meta-grid--weapon {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.sheet-cell-input,
.sheet-line-input,
.sheet-skill-name,
.sheet-skill-level-input,
.sheet-textarea {
  box-sizing: border-box;
  width: 100%;
  min-height: 2.2rem;
  border: 1px solid rgba(34, 211, 238, 0.24);
  border-radius: 10px 0 10px 0;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  background:
    linear-gradient(180deg, rgba(10, 18, 32, 0.9), rgba(4, 10, 22, 0.9)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.08), transparent 7rem);
  padding: 0.42rem 0.65rem 0.48rem;
  color: #e4e4e7;
  outline: none;
  box-shadow:
    inset 0 0 0 1px rgba(34, 211, 238, 0.04),
    0 0 0 rgba(34, 211, 238, 0);
  transition: border-color 140ms ease, box-shadow 140ms ease, background 140ms ease;
}

.sheet-cell-input:focus,
.sheet-line-input:focus,
.sheet-skill-name:focus,
.sheet-skill-level-input:focus,
.sheet-textarea:focus {
  border-color: rgba(34, 211, 238, 0.72);
  box-shadow:
    inset 0 0 0 1px rgba(34, 211, 238, 0.08),
    0 0 18px rgba(34, 211, 238, 0.14);
}

.sheet-cell-input::placeholder,
.sheet-line-input::placeholder,
.sheet-skill-name::placeholder,
.sheet-skill-level-input::placeholder,
.sheet-textarea::placeholder {
  color: rgba(148, 163, 184, 0.82);
}

.sheet-cell-input[readonly],
.sheet-line-input[readonly],
.sheet-textarea[readonly] {
  border-color: rgba(34, 211, 238, 0.16);
  background:
    linear-gradient(180deg, rgba(9, 15, 27, 0.82), rgba(5, 10, 19, 0.82));
  color: rgba(226, 232, 240, 0.92);
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

.sheet-remove {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: stretch;
  min-height: 2.5rem;
  height: 2.5rem;
  width: 2.5rem;
  padding: 0;
  border-color: rgba(248, 113, 113, 0.38);
  border-radius: 10px 0 10px 0;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  background:
    linear-gradient(180deg, rgba(56, 12, 18, 0.92), rgba(22, 8, 10, 0.94)),
    radial-gradient(circle at 0 0, rgba(248, 113, 113, 0.12), transparent 4rem);
  color: #fecaca;
  box-shadow:
    inset 0 0 0 1px rgba(248, 113, 113, 0.05),
    0 0 0 rgba(248, 113, 113, 0);
}

.sheet-remove:hover,
.sheet-remove:focus-visible {
  border-color: rgba(248, 113, 113, 0.72);
  background:
    linear-gradient(180deg, rgba(72, 16, 22, 0.94), rgba(30, 10, 14, 0.96)),
    radial-gradient(circle at 0 0, rgba(248, 113, 113, 0.18), transparent 4rem);
  color: #fff1f2;
  box-shadow:
    inset 0 0 0 1px rgba(248, 113, 113, 0.08),
    0 0 18px rgba(248, 113, 113, 0.18);
  outline: none;
}

.sheet-remove :deep(svg) {
  width: 1.1rem;
  height: 1.1rem;
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
  min-width: 0;
}

.sheet-line-field--personal {
  grid-template-columns: 88px minmax(0, 1fr);
}

.sheet-line-field--stacked {
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: 5px;
}

.sheet-line-field--stacked span {
  font-size: 0.76rem;
  line-height: 1.1;
  text-transform: uppercase;
  letter-spacing: 0.02em;
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

.sheet-portrait-block {
  display: grid;
  gap: 10px;
}

.sheet-portrait-frame {
  position: relative;
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  min-height: 196px;
  overflow: hidden;
  border: 1px solid rgba(34, 211, 238, 0.26);
  border-radius: 12px 0 12px 0;
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
  background:
    linear-gradient(180deg, rgba(10, 17, 29, 0.95), rgba(7, 12, 21, 0.92));
  box-shadow: 0 0 0 1px rgba(34, 211, 238, 0.08) inset;
  cursor: pointer;
  transition: border-color 140ms ease, box-shadow 140ms ease, background 140ms ease;
}

.sheet-portrait-frame:hover,
.sheet-portrait-frame:focus-visible,
.sheet-portrait-frame--dragging {
  border-color: rgba(34, 211, 238, 0.56);
  box-shadow:
    0 0 0 1px rgba(34, 211, 238, 0.12) inset,
    0 0 20px rgba(34, 211, 238, 0.14);
}

.sheet-portrait-frame:focus-visible {
  outline: none;
}

.sheet-portrait-clear {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid rgba(248, 113, 113, 0.42);
  border-radius: 8px 0 8px 0;
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
  background:
    linear-gradient(180deg, rgba(50, 12, 16, 0.9), rgba(22, 8, 10, 0.92));
  color: rgba(255, 232, 232, 0.98);
  opacity: 0;
  pointer-events: none;
  box-shadow: 0 0 10px rgba(248, 113, 113, 0.12);
  transition: opacity 140ms ease, border-color 140ms ease, color 140ms ease, box-shadow 140ms ease, background 140ms ease;
}

.sheet-portrait-frame:hover .sheet-portrait-clear,
.sheet-portrait-frame:focus-within .sheet-portrait-clear {
  opacity: 1;
  pointer-events: auto;
}

.sheet-portrait-clear:hover,
.sheet-portrait-clear:focus-visible {
  border-color: rgba(248, 113, 113, 0.72);
  color: #fff;
  background:
    linear-gradient(180deg, rgba(72, 16, 22, 0.94), rgba(30, 10, 14, 0.96));
  box-shadow: 0 0 16px rgba(248, 113, 113, 0.24);
  outline: none;
}

.sheet-portrait-confirm {
  position: absolute;
  top: 10px;
  right: 44px;
  z-index: 2;
  display: grid;
  gap: 8px;
  min-width: 148px;
  padding: 10px;
  border: 1px solid rgba(34, 211, 238, 0.34);
  border-radius: 10px 0 10px 0;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  background:
    linear-gradient(180deg, rgba(8, 18, 32, 0.96), rgba(3, 7, 18, 0.96)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.12), transparent 8rem);
  box-shadow:
    0 0 18px rgba(34, 211, 238, 0.12),
    inset 0 0 18px rgba(34, 211, 238, 0.05);
}

.sheet-portrait-confirm-text {
  color: #e4e4e7;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.sheet-portrait-confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.sheet-portrait-confirm-button {
  min-height: 26px;
  padding: 0 8px;
  border: 1px solid rgba(34, 211, 238, 0.28);
  border-radius: 8px 0 8px 0;
  clip-path: polygon(0 0, calc(100% - 7px) 0, 100% 7px, 100% 100%, 7px 100%, 0 calc(100% - 7px));
  background: rgba(8, 18, 32, 0.86);
  color: #cffafe;
  font-size: 0.72rem;
  font-weight: 700;
}

.sheet-portrait-confirm-button--danger {
  border-color: rgba(248, 113, 113, 0.42);
  color: #ffe4e6;
  background: rgba(58, 14, 20, 0.9);
}

.sheet-portrait-image {
  width: 100%;
  height: 196px;
  object-fit: cover;
}

.sheet-portrait-placeholder {
  display: grid;
  gap: 6px;
  color: #94a3b8;
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  text-align: center;
}

.sheet-portrait-placeholder-icons {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #67e8f9;
}

.sheet-portrait-icon {
  opacity: 0.82;
}

.sheet-portrait-icon--primary {
  color: #fbbf24;
}

.sheet-portrait-icon--large :deep(svg),
.sheet-portrait-icon--large {
  width: 5.5rem;
  height: 5.5rem;
}

.sheet-portrait-icon--large :deep(svg) {
  stroke-width: 1.4;
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

.sheet-characteristics-panel--mobile {
  padding: 12px 14px 14px;
  border: 1px solid rgba(34, 211, 238, 0.34);
  border-radius: 12px 0 12px 0;
  clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px));
  background:
    linear-gradient(180deg, rgba(8, 18, 32, 0.9), rgba(3, 7, 18, 0.9)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.08), transparent 16rem);
  box-shadow:
    0 0 18px rgba(34, 211, 238, 0.08),
    0 0 0 1px rgba(34, 211, 238, 0.08) inset,
    0 12px 24px rgba(0, 0, 0, 0.2);
}

.sheet-characteristic {
  display: grid;
  gap: 6px;
  justify-items: center;
}

.sheet-stat-entry {
  display: grid;
  grid-template-columns: auto 24px;
  align-items: center;
  gap: 6px;
}

.sheet-characteristic-label {
  color: #fbbf24;
  font-size: 1.05rem;
  font-weight: 700;
  text-transform: uppercase;
}

.sheet-hex-input,
.sheet-dm-input {
  width: 3.7rem;
  min-width: 3.7rem;
  height: 2.9rem;
  clip-path: polygon(24% 0, 76% 0, 100% 50%, 76% 100%, 24% 100%, 0 50%);
  border: 1px solid rgba(34, 211, 238, 0.65);
  border-bottom: 1px solid rgba(34, 211, 238, 0.65);
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(8, 13, 24, 0.98));
  padding: 0;
  text-align: center;
  line-height: 1;
  font-weight: 700;
  color: #e0f2fe;
  box-shadow: 0 0 0 1px rgba(34, 211, 238, 0.12) inset;
  justify-self: center;
  appearance: textfield;
  font-variant-numeric: tabular-nums;
}

.sheet-dm-input {
  width: 3.25rem;
  min-width: 3.25rem;
  height: 2.5rem;
}

.sheet-stepper {
  display: grid;
  gap: 4px;
}

.sheet-stepper-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 18px;
  border: 1px solid rgba(34, 211, 238, 0.34);
  border-radius: 8px 0 8px 0;
  clip-path: polygon(0 0, calc(100% - 7px) 0, 100% 7px, 100% 100%, 7px 100%, 0 calc(100% - 7px));
  background:
    linear-gradient(180deg, rgba(8, 18, 32, 0.92), rgba(3, 7, 18, 0.92)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.14), transparent 8rem);
  color: #67e8f9;
  box-shadow:
    0 0 0 1px rgba(34, 211, 238, 0.08) inset,
    0 0 12px rgba(34, 211, 238, 0.08);
  transition: border-color 140ms ease, color 140ms ease, box-shadow 140ms ease;
}

.sheet-stepper-button:hover,
.sheet-stepper-button:focus-visible {
  border-color: rgba(34, 211, 238, 0.6);
  color: #e0f2fe;
  box-shadow:
    0 0 0 1px rgba(34, 211, 238, 0.12) inset,
    0 0 16px rgba(34, 211, 238, 0.14);
  outline: none;
}

.sheet-stepper-icon {
  width: 0.8rem;
  height: 0.8rem;
}

.sheet-stepper-icon--up {
  transform: rotate(-90deg);
}

.sheet-stepper-icon--down {
  transform: rotate(90deg);
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
  gap: 8px;
  grid-column: 3;
  align-self: end;
  padding: 10px 10px 0;
  border: 1px solid rgba(34, 211, 238, 0.18);
  border-radius: 12px 0 12px 0;
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
  background: linear-gradient(180deg, rgba(8, 13, 24, 0.52), rgba(8, 13, 24, 0.18));
}

.sheet-training-title {
  color: #fbbf24;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 0.02em;
}

.sheet-finance-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 14px;
}

.sheet-finance-grid .sheet-line-input,
.sheet-training-box .sheet-line-input {
  min-height: 28px;
  padding-bottom: 6px;
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
  .sheet-chrome {
    font-size: 1rem;
    white-space: nowrap;
  }

  .sheet-chrome--with-actions {
    gap: 0.75rem;
  }

  .sheet-chrome-actions-toggle {
    display: inline-flex;
    flex: 0 0 auto;
  }

  .sheet-chrome--with-actions .sheet-toolbar {
    display: none;
  }

  .sheet-page-grid,
  .sheet-page-left,
  .sheet-page-right {
    gap: 12px;
  }

  .sheet-page-grid--front {
    display: flex;
    flex-direction: column;
  }

  .sheet-page-grid--front .sheet-page-right {
    order: 1;
  }

  .sheet-page-grid--front .sheet-page-left {
    order: 2;
  }

  .sheet-panel--vertical,
  .sheet-panel--skills {
    grid-template-columns: 1fr;
  }

  .sheet-panel-title--side {
    writing-mode: horizontal-tb;
    transform: none;
  }

  .sheet-table-header {
    display: none;
  }

  .sheet-table-header,
  .sheet-table-row {
    grid-template-columns: 1fr !important;
  }

  .sheet-meta-grid--augment,
  .sheet-meta-grid--equipment,
  .sheet-meta-grid--armour {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .sheet-meta-grid--weapon {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .sheet-characteristics-panel {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
