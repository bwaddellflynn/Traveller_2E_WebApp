<script setup lang="ts">
import skillsData from '~/data/traveller2e/core/skills.json'
import type { TravellerAssociate, TravellerCharacteristicId, TravellerProfile, TravellerSkill } from '~/types/traveller'
import { useTravellersStore } from '~/stores/travellers'
import { clearBuilderDraft, clearDraftPointer, loadBuilderDraft, saveBuilderDraft, saveDraftPointer } from '~/utils/traveller/draftCache'
import { MANUAL_TRAVELLER_ACTIVE_DRAFT_POINTER_KEY, MANUAL_TRAVELLER_DRAFT_CACHE_VERSION, manualTravellerDraftCacheKey } from '~/utils/traveller/manualDraft'
import { travellerProfileToPdfFields, validateTravellerPdfFields } from '~/utils/traveller/pdfFields'
import { cloneTravellerProfile, createBlankTravellerProfile, normalizeTravellerProfile } from '~/utils/traveller/profile'
import { buildTravellerSkill, formatTravellerSkillSpeciality, parseTravellerSkill, slugifyTravellerSkill, titleCaseTravellerSkill, travellerSkillHasSpecialities, travellerSkillMode } from '~/utils/traveller/skills'

const route = useRoute()
const router = useRouter()
const travellers = useTravellersStore()

const draft = ref<TravellerProfile>(createBlankTravellerProfile('manual'))
const saveMessage = ref('')
const importInput = ref<HTMLInputElement | null>(null)
const portraitInput = ref<HTMLInputElement | null>(null)
const isPortraitDragActive = ref(false)
const portraitClearConfirmOpen = ref(false)
const sheetDeleteConfirmOpen = ref(false)
const isMobileSheetViewport = ref(false)
const isWideSheetViewport = ref(false)
const mobileSheetMenuOpen = ref(false)
const mobileSheetActionsOpen = ref(false)
const manualSheetDraftRestored = ref(false)
const manualSheetDraftCachePaused = ref(false)
const activeSheetRouteId = computed(() => typeof route.query.id === 'string' ? route.query.id : '')
const activeSheetDraftId = computed(() => typeof route.query.draft === 'string' ? route.query.draft : '')
const activeManualSheetDraftCacheKey = computed(() => {
  return manualTravellerDraftCacheKey(activeSheetRouteId.value || activeSheetDraftId.value)
})
const isUnsavedManualDraftRoute = computed(() => !activeSheetRouteId.value && Boolean(activeSheetDraftId.value))

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
const showOnlyTrainedSkills = ref(false)
const trainingSkill = computed(() => draft.value.skills.find((skill) => skill.sources?.some((source) => /training/i.test(source))) ?? null)
const isVoucherEquipment = (item: TravellerProfile['equipment'][number]) => /voucher$/i.test(item.name) || /voucher/i.test(item.notes ?? '')
const voucherEquipmentEntries = computed(() => draft.value.equipment
  .map((item, index) => ({ item, index }))
  .filter(({ item }) => isVoucherEquipment(item)))
const nonVoucherEquipmentEntries = computed(() => draft.value.equipment
  .map((item, index) => ({ item, index }))
  .filter(({ item }) => !isVoucherEquipment(item)))
const voucherTypeThemes = {
  weapon: 'sheet-voucher-card--weapon',
  armour: 'sheet-voucher-card--armour',
  equipment: 'sheet-voucher-card--equipment',
  implant: 'sheet-voucher-card--implant',
  vehicle: 'sheet-voucher-card--vehicle',
  'small-craft': 'sheet-voucher-card--small-craft',
  ship: 'sheet-voucher-card--ship',
  generic: 'sheet-voucher-card--generic',
} as const
const voucherTypeLabelMap: Record<keyof typeof voucherTypeThemes, string> = {
  weapon: 'Weapon Voucher',
  armour: 'Armour Voucher',
  equipment: 'Equipment Voucher',
  implant: 'Implant Voucher',
  vehicle: 'Vehicle Voucher',
  'small-craft': 'Small Craft Voucher',
  ship: 'Ship Voucher',
  generic: 'Voucher Claim',
}
const voucherTypeOptions = [
  { value: 'weapon', label: 'Weapon' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'armour', label: 'Armour' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'small-craft', label: 'Small Craft' },
  { value: 'ship', label: 'Ship' },
] as const
const voucherTypeOptionLabelMap = Object.fromEntries(voucherTypeOptions.map((option) => [option.value, option.label])) as Record<(typeof voucherTypeOptions)[number]['value'], string>
type SkillDefinition = {
  id: string
  name: string
  specialities?: string[]
  specialityMode?: 'shared-zero' | 'independent'
  requiresSpeciality?: boolean
  psionic?: boolean
}
type NormalizedSheetSkill = {
  record: TravellerSkill
  baseId: string
  baseName: string
  specialityId?: string
  specialityName?: string
}
type SheetSkillGroup = {
  definition: SkillDefinition
  estimatedRows: number
}
const sheetSkillDefinitions = computed(() => {
  const definitions = skillsData.skills as SkillDefinition[]
  const nonPsionic = definitions
    .filter((skill) => !skill.psionic)
    .slice()
    .sort((left, right) => skillNameCollator.compare(left.name, right.name))
  const psionic = definitions
    .filter((skill) => skill.psionic)
    .slice()
    .sort((left, right) => skillNameCollator.compare(left.name, right.name))
  return [...nonPsionic, ...psionic]
})
const sheetSkillDefinitionsById = computed<Record<string, SkillDefinition>>(() => Object.fromEntries(
  sheetSkillDefinitions.value.map((skill) => [skill.id, skill]),
))
const skillColumnCount = computed(() => {
  if (isMobileSheetViewport.value) return 1
  return isWideSheetViewport.value ? 2 : 1
})
const customSpecialitySkillIds = new Set(['language', 'profession', 'science'])
const customSpecialityDrafts = reactive<Record<string, string>>({})
const activeSkillPickerId = ref<string | null>(null)
const skillNameCollator = new Intl.Collator('en', { sensitivity: 'base' })
const logSheetSpecialityDebug = (...args: unknown[]) => {
  console.debug('[SheetSpeciality]', ...args)
}

const loadSheetFromRoute = () => {
  const id = activeSheetRouteId.value
  const draftId = activeSheetDraftId.value
  const existing = id ? travellers.getProfile(id) : null
  const cachedDraft = loadBuilderDraft<TravellerProfile>(
    manualTravellerDraftCacheKey(id || draftId),
    MANUAL_TRAVELLER_DRAFT_CACHE_VERSION,
  )

  if (cachedDraft) {
    draft.value = cloneTravellerProfile(cachedDraft)
    return
  }

  if (existing) {
    draft.value = cloneTravellerProfile(existing)
    draft.value.metadata.lastOpenedAt = new Date().toISOString()
    void travellers.setActiveProfile(id)
    return
  }

  draft.value = createBlankTravellerProfile('manual')
}

const formatSheetSpeciality = (definition: SkillDefinition | undefined, value: string) => {
  const baseId = definition?.id ?? ''
  return baseId ? formatTravellerSkillSpeciality(baseId, value) : titleCaseTravellerSkill(value)
}

const normalizeSheetSkill = (skill: TravellerSkill): NormalizedSheetSkill => {
  const parsed = parseTravellerSkill(skill.id || skill.name)
  const definition = sheetSkillDefinitionsById.value[parsed.baseId]
    ?? sheetSkillDefinitions.value.find((item) => item.name.toLowerCase() === parsed.baseName.toLowerCase())
  const specialityName = skill.speciality?.trim() || parsed.specialityName || ''

  return {
    record: skill,
    baseId: definition?.id ?? parsed.baseId,
    baseName: definition?.name ?? parsed.baseName,
    specialityId: specialityName ? slugifyTravellerSkill(specialityName) : undefined,
    specialityName: specialityName ? formatSheetSpeciality(definition, specialityName) : undefined,
  }
}

const normalizedSheetSkills = computed(() => draft.value.skills.map(normalizeSheetSkill))
const findSheetSkillRecord = (baseId: string, specialityId?: string) => normalizedSheetSkills.value.find((skill) =>
  skill.baseId === baseId && (specialityId ? skill.specialityId === specialityId : !skill.specialityId))
const findSheetSkillIndex = (baseId: string, specialityId?: string) => normalizedSheetSkills.value.findIndex((skill) =>
  skill.baseId === baseId && (specialityId ? skill.specialityId === specialityId : !skill.specialityId))
const sheetSkillMode = (definition: SkillDefinition) => travellerSkillMode(definition.id)
const sheetSkillHasSpecialities = (definition: SkillDefinition) => travellerSkillHasSpecialities(definition.id)
const sheetSkillCustomSpecialities = (baseId: string) => normalizedSheetSkills.value
  .filter((skill) => skill.baseId === baseId && skill.specialityId && !sheetSkillDefinitionsById.value[baseId]?.specialities?.some((speciality) => slugifyTravellerSkill(speciality) === skill.specialityId))
  .map((skill) => ({
    specialityId: skill.specialityId as string,
    specialityName: skill.specialityName ?? titleCaseTravellerSkill(skill.specialityId as string),
  }))
  .filter((skill, index, array) => array.findIndex((candidate) => candidate.specialityId === skill.specialityId) === index)
const selectedSheetSpecialities = (definition: SkillDefinition) => {
  const selectedDefined = (definition.specialities ?? [])
    .filter((speciality) => specialitySkillChecked(definition, speciality))
    .map((speciality) => ({
      specialityId: specialitySlug(speciality),
      specialityName: specialityDisplayName(definition, speciality),
      isCustom: false,
    }))
  const selectedCustom = sheetSkillCustomSpecialities(definition.id).map((speciality) => ({
    ...speciality,
    isCustom: true,
  }))
  const selected = [...selectedDefined, ...selectedCustom]
  logSheetSpecialityDebug('selectedSheetSpecialities', {
    definitionId: definition.id,
    selected,
    normalized: normalizedSheetSkills.value
      .filter((skill) => skill.baseId === definition.id)
      .map((skill) => ({
        id: skill.record.id,
        name: skill.record.name,
        level: skill.record.level,
        specialityId: skill.specialityId,
        specialityName: skill.specialityName,
      })),
  })
  return selected
}
const availableSheetSpecialities = (definition: SkillDefinition) => (definition.specialities ?? [])
  .filter((speciality) => !specialitySkillChecked(definition, speciality))

const buildSheetSkillLabel = (definition: SkillDefinition, specialityName?: string) => specialityName
  ? `${definition.name} (${specialityName})`
  : definition.name

const ensureSheetSkill = (definition: SkillDefinition, level: number, specialityName?: string) => {
  const specialityId = specialityName ? slugifyTravellerSkill(specialityName) : undefined
  const existingIndex = findSheetSkillIndex(definition.id, specialityId)
  logSheetSpecialityDebug('ensureSheetSkill:start', {
    definitionId: definition.id,
    definitionName: definition.name,
    level,
    specialityName,
    specialityId,
    existingIndex,
  })
  if (existingIndex >= 0) {
    const existing = draft.value.skills[existingIndex]
    draft.value.skills[existingIndex] = buildTravellerSkill(definition.id, level, specialityName, {
      sources: existing.sources ?? ['Manual Sheet'],
      notes: existing.notes ?? '',
    })
    logSheetSpecialityDebug('ensureSheetSkill:update', {
      definitionId: definition.id,
      updatedSkill: draft.value.skills[existingIndex],
    })
    return
  }

  draft.value.skills.push(buildTravellerSkill(definition.id, level, specialityName, {
    sources: ['Manual Sheet'],
    notes: '',
  }))
  logSheetSpecialityDebug('ensureSheetSkill:create', {
    definitionId: definition.id,
    createdSkill: draft.value.skills[draft.value.skills.length - 1],
  })
}

const removeSheetSkill = (baseId: string, specialityId?: string) => {
  const index = findSheetSkillIndex(baseId, specialityId)
  logSheetSpecialityDebug('removeSheetSkill', { baseId, specialityId, index })
  if (index >= 0) draft.value.skills.splice(index, 1)
}

const specialityDisplayName = (definition: SkillDefinition, speciality: string) => formatSheetSpeciality(definition, speciality)
const specialitySlug = (value: string) => slugifyTravellerSkill(value)
const baseSkillEntry = (definition: SkillDefinition) => findSheetSkillRecord(definition.id)
const specialitySkillEntry = (definition: SkillDefinition, speciality: string) => findSheetSkillRecord(definition.id, specialitySlug(speciality))
const baseSkillHasAnySpeciality = (definition: SkillDefinition) => normalizedSheetSkills.value.some((skill) => skill.baseId === definition.id && skill.specialityId)
const baseSkillChecked = (definition: SkillDefinition) => {
  if (!sheetSkillHasSpecialities(definition)) return Boolean(baseSkillEntry(definition))
  if (sheetSkillMode(definition) === 'shared-zero') return Boolean(baseSkillEntry(definition) || baseSkillHasAnySpeciality(definition))
  return false
}
const baseSkillDisplayLevel = (definition: SkillDefinition) => {
  const existing = baseSkillEntry(definition)
  if (existing) return existing.record.level
  if (sheetSkillHasSpecialities(definition) && sheetSkillMode(definition) === 'shared-zero' && baseSkillHasAnySpeciality(definition)) return 0
  return null
}
const hasTrainedSheetSkill = (definition: SkillDefinition) => {
  if (baseSkillChecked(definition)) return true
  return selectedSheetSpecialities(definition).length > 0
}
const specialitySkillChecked = (definition: SkillDefinition, speciality: string) => Boolean(specialitySkillEntry(definition, speciality))
const specialitySkillDisplayLevel = (definition: SkillDefinition, speciality: string) => specialitySkillEntry(definition, speciality)?.record.level ?? null

const toggleBaseSkill = (definition: SkillDefinition) => {
  if (!sheetSkillHasSpecialities(definition)) {
    if (baseSkillChecked(definition)) removeSheetSkill(definition.id)
    else ensureSheetSkill(definition, 0)
    return
  }

  if (sheetSkillMode(definition) === 'shared-zero') {
    if (baseSkillChecked(definition)) {
      draft.value.skills = draft.value.skills.filter((skill) => normalizeSheetSkill(skill).baseId !== definition.id)
    } else {
      ensureSheetSkill(definition, 0)
    }
  }
}

const changeBaseSkillLevel = (definition: SkillDefinition, delta: number) => {
  if (sheetSkillHasSpecialities(definition)) return
  const existing = baseSkillEntry(definition)
  const currentLevel = existing?.record.level ?? 0
  const nextLevel = Math.max(0, currentLevel + delta)
  ensureSheetSkill(definition, nextLevel)
}

const toggleSpecialitySkill = (definition: SkillDefinition, speciality: string) => {
  logSheetSpecialityDebug('toggleSpecialitySkill', {
    definitionId: definition.id,
    speciality,
    existing: specialitySkillEntry(definition, speciality)?.record ?? null,
  })
  const existing = specialitySkillEntry(definition, speciality)
  if (existing) {
    removeSheetSkill(definition.id, specialitySlug(speciality))
    return
  }

  const nextLevel = sheetSkillMode(definition) === 'shared-zero' ? 1 : 0
  ensureSheetSkill(definition, nextLevel, specialityDisplayName(definition, speciality))
}

const changeSpecialitySkillLevel = (definition: SkillDefinition, speciality: string, delta: number) => {
  logSheetSpecialityDebug('changeSpecialitySkillLevel', {
    definitionId: definition.id,
    speciality,
    delta,
    currentLevel: specialitySkillDisplayLevel(definition, speciality),
  })
  const existing = specialitySkillEntry(definition, speciality)
  const currentLevel = existing?.record.level ?? 0
  const minimumLevel = sheetSkillMode(definition) === 'shared-zero' ? 1 : 0
  if (!existing && delta > 0) {
    ensureSheetSkill(definition, 1, specialityDisplayName(definition, speciality))
    return
  }

  if (!existing) return
  const nextLevel = currentLevel + delta
  if (nextLevel < minimumLevel) {
    removeSheetSkill(definition.id, specialitySlug(speciality))
    return
  }
  ensureSheetSkill(definition, nextLevel, specialityDisplayName(definition, speciality))
}

const addCustomSpecialitySkill = (definition: SkillDefinition) => {
  const raw = customSpecialityDrafts[definition.id]?.trim()
  logSheetSpecialityDebug('addCustomSpecialitySkill', {
    definitionId: definition.id,
    raw,
  })
  if (!raw) return
  const specialityId = specialitySlug(raw)
  if (!specialityId) return
  if (findSheetSkillRecord(definition.id, specialityId)) {
    customSpecialityDrafts[definition.id] = ''
    return
  }
  const initialLevel = sheetSkillMode(definition) === 'shared-zero' ? 1 : 0
  ensureSheetSkill(definition, initialLevel, raw)
  customSpecialityDrafts[definition.id] = ''
  activeSkillPickerId.value = null
}

const addSheetSpeciality = (definition: SkillDefinition, speciality: string) => {
  logSheetSpecialityDebug('addSheetSpeciality', {
    definitionId: definition.id,
    speciality,
    mode: sheetSkillMode(definition),
    existing: specialitySkillEntry(definition, speciality)?.record ?? null,
  })
  const initialLevel = sheetSkillMode(definition) === 'shared-zero' ? 1 : 0
  ensureSheetSkill(definition, initialLevel, specialityDisplayName(definition, speciality))
  activeSkillPickerId.value = null
}

const toggleSkillPicker = (definition: SkillDefinition) => {
  activeSkillPickerId.value = activeSkillPickerId.value === definition.id ? null : definition.id
}

const sheetRollModifier = (definition: SkillDefinition, specialityName?: string) => {
  if (specialityName) {
    const specialityLevel = specialitySkillDisplayLevel(definition, specialitySlug(specialityName))
    return specialityLevel ?? -3
  }

  const baseLevel = baseSkillDisplayLevel(definition)
  return baseLevel ?? -3
}

const openSheetSkillDefinitionRoll = (definition: SkillDefinition, specialityName?: string, explicitLevel?: number | null) => {
  const label = buildSheetSkillLabel(definition, specialityName)
  startRollModal(label, 'Skill Check', explicitLevel ?? sheetRollModifier(definition, specialityName))
}

const skillGroups = computed<SheetSkillGroup[]>(() => sheetSkillDefinitions.value
  .filter((definition) => !showOnlyTrainedSkills.value || hasTrainedSheetSkill(definition))
  .map((definition) => ({
    definition,
    estimatedRows: 1 + selectedSheetSpecialities(definition).length,
  })))
const skillGroupColumns = computed(() => {
  if (skillColumnCount.value === 1) return [skillGroups.value]

  const midpoint = Math.ceil(skillGroups.value.length / 2)
  return [
    skillGroups.value.slice(0, midpoint),
    skillGroups.value.slice(midpoint),
  ]
})

const rollModalOpen = ref(false)
const rollModalRolling = ref(false)
const rollModalTitle = ref('')
const rollModalSubtitle = ref('')
const rollModalModifier = ref(0)
const rollModalDice = ref<[number, number]>([1, 1])
const rollModalTotal = ref(0)
const rollModalTimer = ref<number | null>(null)
const rollModalFinishTimer = ref<number | null>(null)
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

const termRankLabel = (term: TravellerProfile['careers'][number]) => {
  if (typeof term.rank === 'number' && term.title) return `R${term.rank} · ${term.title}`
  if (typeof term.rank === 'number') return `Rank ${term.rank}`
  if (term.title) return term.title
  return ''
}

const termNotesLabel = (term: TravellerProfile['careers'][number]) => {
  const segments = [`Age ${term.startAge}-${term.endAge}`, ...term.details]
  return segments.filter(Boolean).join(' | ')
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
const randomDie = () => Math.floor(Math.random() * 6) + 1
const rollModalFormula = computed(() => {
  if (rollModalModifier.value === 0) return '2D'
  return `2D ${rollModalModifier.value > 0 ? '+' : '-'} ${Math.abs(rollModalModifier.value)}`
})

const clearRollModalTimers = () => {
  if (!import.meta.client) return
  if (rollModalTimer.value !== null) window.clearInterval(rollModalTimer.value)
  if (rollModalFinishTimer.value !== null) window.clearTimeout(rollModalFinishTimer.value)
  rollModalTimer.value = null
  rollModalFinishTimer.value = null
}

const closeRollModal = () => {
  clearRollModalTimers()
  rollModalOpen.value = false
  rollModalRolling.value = false
}

const startRollModal = (title: string, subtitle: string, modifier: number) => {
  clearRollModalTimers()
  rollModalTitle.value = title
  rollModalSubtitle.value = subtitle
  rollModalModifier.value = modifier
  rollModalOpen.value = true
  rollModalRolling.value = true

  const updateRoll = () => {
    const nextDice: [number, number] = [randomDie(), randomDie()]
    rollModalDice.value = nextDice
    rollModalTotal.value = nextDice[0] + nextDice[1] + rollModalModifier.value
  }

  updateRoll()
  if (!import.meta.client) {
    rollModalRolling.value = false
    return
  }

  rollModalTimer.value = window.setInterval(updateRoll, 90)
  rollModalFinishTimer.value = window.setTimeout(() => {
    clearRollModalTimers()
    updateRoll()
    rollModalRolling.value = false
  }, 1100)
}

const openCharacteristicRoll = (id: TravellerCharacteristicId) => {
  const characteristic = draft.value.characteristics[id]
  startRollModal(characteristic.name || characteristic.abbreviation, 'Characteristic Check', Number(characteristic.dm) || 0)
}

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

const detectVoucherType = (item: TravellerProfile['equipment'][number]) => {
  const explicitType = (item.traits ?? '').trim().toLowerCase()
  if (explicitType === 'weapon') return 'weapon'
  if (explicitType === 'equipment') return 'equipment'
  if (explicitType === 'armour' || explicitType === 'armor') return 'armour'
  if (explicitType === 'vehicle') return 'vehicle'
  if (explicitType === 'small-craft' || explicitType === 'small craft') return 'small-craft'
  if (explicitType === 'ship') return 'ship'
  const haystack = `${item.name} ${item.traits ?? ''} ${item.notes ?? ''}`.toLowerCase()
  if (/(free trader|lab ship|scout ship|ship's boat|ships boat|yacht|ship voucher|ship claim)/i.test(haystack)) return 'ship'
  if (/(small craft|small-craft|launch|launch craft|shuttle)/i.test(haystack)) return 'small-craft'
  if (/(personal vehicle|vehicle voucher|vehicle claim)/i.test(haystack)) return 'vehicle'
  if (/(cybernetic implant|combat implant|implant voucher|implant claim)/i.test(haystack)) return 'implant'
  if (/(scientific equipment|equipment voucher|equipment claim)/i.test(haystack)) return 'equipment'
  if (/(armour|armor)/i.test(haystack)) return 'armour'
  if (/(weapon|gun|blade)/i.test(haystack)) return 'weapon'
  return 'generic'
}

const voucherThemeClass = (item: TravellerProfile['equipment'][number]) => voucherTypeThemes[detectVoucherType(item)]
const voucherTypeLabel = (item: TravellerProfile['equipment'][number]) => voucherTypeLabelMap[detectVoucherType(item)]

const addVoucher = (type: keyof typeof voucherTypeThemes = 'generic') => {
  const label = voucherTypeLabelMap[type]
  draft.value.equipment.push({
    id: `manual-voucher-${Date.now()}`,
    name: label,
    techLevel: '10',
    kg: '',
    traits: type === 'generic' ? '' : label.replace(/\s+Voucher$/i, ''),
    notes: 'Manual voucher claim',
  })
}

const voucherSelectedType = (item: TravellerProfile['equipment'][number]) => {
  const value = (item.traits ?? '').trim().toLowerCase()
  return voucherTypeOptions.some((option) => option.value === value) ? value as (typeof voucherTypeOptions)[number]['value'] : ''
}

const setVoucherType = (item: TravellerProfile['equipment'][number], value: string) => {
  item.traits = value
  item.name = value ? `${voucherTypeOptionLabelMap[value as keyof typeof voucherTypeOptionLabelMap]} Voucher` : 'Voucher Claim'
}

const voucherDisplayHeading = (item: TravellerProfile['equipment'][number]) => {
  const selected = voucherSelectedType(item)
  if (selected) return voucherTypeOptionLabelMap[selected]
  const detected = detectVoucherType(item)
  return detected === 'generic' ? 'Select Type' : voucherTypeLabelMap[detected].replace(/\s+Voucher$/i, '')
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
  isWideSheetViewport.value = window.innerWidth >= 1450
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
  sheetDeleteConfirmOpen.value = false
}

const formatCreditDisplay = (value: number | string | null | undefined) => {
  const numericValue = typeof value === 'number'
    ? value
    : Number(String(value ?? '').replace(/,/g, ''))
  if (!Number.isFinite(numericValue)) return ''
  return Math.trunc(numericValue).toLocaleString()
}

const handleCreditInput = (event: Event) => {
  const target = event.target as HTMLInputElement | null
  const rawValue = target?.value ?? ''
  const digitsOnly = rawValue.replace(/[^\d-]/g, '')
  const parsed = Number(digitsOnly)
  draft.value.finances.cashOnHand = Number.isFinite(parsed) ? parsed : 0
}

const saveSheet = async () => {
  manualSheetDraftCachePaused.value = true
  clearBuilderDraft(activeManualSheetDraftCacheKey.value)
  if (isUnsavedManualDraftRoute.value) clearDraftPointer(MANUAL_TRAVELLER_ACTIVE_DRAFT_POINTER_KEY)
  const saved = await travellers.saveProfile(draft.value)
  draft.value = cloneTravellerProfile(saved)
  saveMessage.value = `Saved ${saved.identity.name || 'Traveller'}`
  await router.replace({ path: '/character/sheet', query: { id: saved.id } })
  nextTick(() => {
    manualSheetDraftCachePaused.value = false
  })
}

const duplicateSheet = async () => {
  manualSheetDraftCachePaused.value = true
  clearBuilderDraft(activeManualSheetDraftCacheKey.value)
  if (isUnsavedManualDraftRoute.value) clearDraftPointer(MANUAL_TRAVELLER_ACTIVE_DRAFT_POINTER_KEY)
  const saved = await travellers.saveProfile(draft.value)
  const copy = await travellers.duplicateProfile(saved.id)
  if (!copy) {
    manualSheetDraftCachePaused.value = false
    return
  }
  draft.value = cloneTravellerProfile(copy)
  saveMessage.value = `Duplicated ${copy.identity.name || 'Traveller'}`
  await router.replace({ path: '/character/sheet', query: { id: copy.id } })
  nextTick(() => {
    manualSheetDraftCachePaused.value = false
  })
}

const requestDeleteSheet = () => {
  sheetDeleteConfirmOpen.value = true
}

const cancelDeleteSheet = () => {
  sheetDeleteConfirmOpen.value = false
}

const confirmDeleteSheet = async () => {
  clearBuilderDraft(activeManualSheetDraftCacheKey.value)
  if (isUnsavedManualDraftRoute.value) clearDraftPointer(MANUAL_TRAVELLER_ACTIVE_DRAFT_POINTER_KEY)
  await travellers.deleteProfile(draft.value.id)
  sheetDeleteConfirmOpen.value = false
  await router.push('/character/sheet')
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
    draft.value = normalizeTravellerProfile({
      ...createBlankTravellerProfile(imported.source ?? 'imported'),
      ...imported,
      source: imported.source ?? 'imported',
      updatedAt: new Date().toISOString(),
    }, imported.source ?? 'imported')
    saveMessage.value = `Imported ${draft.value.identity.name || 'Traveller'}`
  } catch {
    saveMessage.value = 'Import failed. Select a Traveller profile JSON file.'
  } finally {
    input.value = ''
  }
}

onMounted(async () => {
  updateSheetViewport()
  window.addEventListener('resize', updateSheetViewport)
  await travellers.loadProfiles()
  loadSheetFromRoute()
  manualSheetDraftRestored.value = true
})

onBeforeUnmount(() => {
  if (!import.meta.client) return
  clearRollModalTimers()
  window.removeEventListener('resize', updateSheetViewport)
})

watch(
  draft,
  (profile) => {
    if (!manualSheetDraftRestored.value || manualSheetDraftCachePaused.value) return
    if (isUnsavedManualDraftRoute.value && activeSheetDraftId.value) {
      saveDraftPointer(MANUAL_TRAVELLER_ACTIVE_DRAFT_POINTER_KEY, activeSheetDraftId.value)
    }
    saveBuilderDraft(
      activeManualSheetDraftCacheKey.value,
      MANUAL_TRAVELLER_DRAFT_CACHE_VERSION,
      cloneTravellerProfile(profile),
    )
  },
  { deep: true },
)

watch(
  [activeSheetRouteId, activeSheetDraftId],
  () => {
    if (!manualSheetDraftRestored.value) return
    manualSheetDraftCachePaused.value = true
    if (activeSheetRouteId.value) {
      void travellers.setActiveProfile(activeSheetRouteId.value)
    }
    loadSheetFromRoute()
    nextTick(() => {
      manualSheetDraftCachePaused.value = false
    })
  },
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
              <button aria-label="Delete Sheet" class="sheet-toolbar-button sheet-toolbar-button--danger" title="Delete Sheet" type="button" @click="requestDeleteSheet">
                <AppIcon name="trash" />
              </button>
              <button aria-label="Save Sheet" class="sheet-toolbar-button sheet-toolbar-button--primary" title="Save Sheet" type="button" @click="saveSheet">
                <AppIcon name="save" />
              </button>
            </div>
            <div
              v-if="sheetDeleteConfirmOpen"
              class="sheet-toolbar-confirm"
              @click.stop
            >
              <p class="sheet-toolbar-confirm__text">Delete traveller?</p>
              <div class="sheet-toolbar-confirm__actions">
                <button class="sheet-toolbar-confirm__button" type="button" @click="cancelDeleteSheet">
                  Cancel
                </button>
                <button class="sheet-toolbar-confirm__button sheet-toolbar-confirm__button--danger" type="button" @click="confirmDeleteSheet">
                  Delete
                </button>
              </div>
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
                <div
                  class="sheet-dm-block sheet-dm-block--interactive"
                  role="button"
                  tabindex="0"
                  :title="`Roll ${draft.characteristics[id].name || draft.characteristics[id].abbreviation}`"
                  @click="openCharacteristicRoll(id)"
                  @keydown.enter.prevent="openCharacteristicRoll(id)"
                  @keydown.space.prevent="openCharacteristicRoll(id)"
                >
                  <input :value="formatDm(draft.characteristics[id].dm)" class="sheet-dm-input" readonly tabindex="-1">
                  <span>DM</span>
                </div>
              </div>
            </section>

            <section v-else-if="activeMobileSheetSection === 'skills'" class="sheet-panel sheet-panel--skills">
              <header class="sheet-panel-title sheet-panel-title--side sheet-panel-title--actionable">
                <span>Skills</span>
                <button
                  class="sheet-skill-visibility-toggle"
                  :aria-label="showOnlyTrainedSkills ? 'Show all skills' : 'Show trained skills only'"
                  :title="showOnlyTrainedSkills ? 'Show all skills' : 'Show trained skills only'"
                  type="button"
                  @click="showOnlyTrainedSkills = !showOnlyTrainedSkills"
                >
                  <svg v-if="showOnlyTrainedSkills" viewBox="0 0 24 24" class="sheet-skill-visibility-icon" aria-hidden="true">
                    <path fill="currentColor" d="M12 5c5.6 0 9.57 4.13 10.82 6.13a1.5 1.5 0 0 1 0 1.74C21.57 14.87 17.6 19 12 19S2.43 14.87 1.18 12.87a1.5 1.5 0 0 1 0-1.74C2.43 9.13 6.4 5 12 5Zm0 2c-4.62 0-8.02 3.28-9.2 5 1.18 1.72 4.58 5 9.2 5s8.02-3.28 9.2-5C20.02 10.28 16.62 7 12 7Zm0 2.25A2.75 2.75 0 1 1 9.25 12 2.75 2.75 0 0 1 12 9.25Zm0 2A.75.75 0 1 0 12.75 12 .75.75 0 0 0 12 11.25Z" />
                  </svg>
                  <svg v-else viewBox="0 0 24 24" class="sheet-skill-visibility-icon" aria-hidden="true">
                    <path fill="currentColor" d="M3.28 2.22 21.78 20.72l-1.06 1.06-3.07-3.06A12.3 12.3 0 0 1 12 20C6.4 20 2.43 15.87 1.18 13.87a1.5 1.5 0 0 1 0-1.74 18.2 18.2 0 0 1 5.07-5.19L2.22 3.28Zm8.01 8.01 2.48 2.48a1.75 1.75 0 0 0-2.48-2.48Zm5.09 5.09-1.45-1.45A4.75 4.75 0 0 1 8.13 9.07L7.09 8.03C5.19 9.17 3.7 10.81 2.8 12c1.18 1.72 4.58 6 9.2 6a10.2 10.2 0 0 0 4.38-1.68Zm1.65-1.18-1.45-1.45A9.45 9.45 0 0 0 21.2 12c-.69-1-2.25-2.82-4.62-4.07l-1.07-1.06c3.32 1.25 5.8 3.85 7.31 6.26a1.5 1.5 0 0 1 0 1.74 18.34 18.34 0 0 1-4.79 4.89Z" />
                  </svg>
                </button>
              </header>
              <div class="sheet-skills-grid" :class="{ 'sheet-skills-grid--two-column': skillColumnCount === 2 }">
                <div v-for="(column, columnIndex) in skillGroupColumns" :key="`mobile-skills-${columnIndex}`" class="sheet-skill-column">
                  <section v-for="group in column" :key="group.definition.id" class="sheet-skill-group">
                    <div class="sheet-skill-entry sheet-skill-entry--base">
                      <span v-if="sheetSkillMode(group.definition) === 'independent'" class="sheet-skill-toggle sheet-skill-toggle--empty" aria-hidden="true"></span>
                      <label v-else class="sheet-skill-toggle">
                        <input
                          :checked="baseSkillChecked(group.definition)"
                          type="checkbox"
                          @change="toggleBaseSkill(group.definition)"
                        >
                      </label>
                      <button
                        class="sheet-skill-roll-button"
                        type="button"
                        @click="openSheetSkillDefinitionRoll(group.definition, undefined, baseSkillDisplayLevel(group.definition))"
                      >
                        {{ group.definition.name }}
                      </button>
                      <div class="sheet-skill-rank" :class="{ 'sheet-skill-rank--disabled': sheetSkillHasSpecialities(group.definition) || sheetSkillMode(group.definition) === 'independent' }">
                        <template v-if="sheetSkillHasSpecialities(group.definition)">
                          <span class="sheet-skill-rank__value">{{ sheetSkillMode(group.definition) === 'independent' ? '--' : (baseSkillDisplayLevel(group.definition) ?? '0') }}</span>
                          <button
                            :aria-label="`Add ${group.definition.name} specialty`"
                            class="sheet-skill-group__add sheet-skill-rank__addon"
                            :title="`Add ${group.definition.name} specialty`"
                            type="button"
                            @click="toggleSkillPicker(group.definition)"
                          >
                            <AppIcon name="plus" />
                          </button>
                        </template>
                        <template v-else>
                          <button class="sheet-skill-rank__button" type="button" @click="changeBaseSkillLevel(group.definition, -1)">
                            <AppIcon class="sheet-skill-rank__icon sheet-skill-rank__icon--down" name="arrow" />
                          </button>
                          <span class="sheet-skill-rank__value">{{ baseSkillDisplayLevel(group.definition) ?? '0' }}</span>
                          <button class="sheet-skill-rank__button" type="button" @click="changeBaseSkillLevel(group.definition, 1)">
                            <AppIcon class="sheet-skill-rank__icon sheet-skill-rank__icon--up" name="arrow" />
                          </button>
                        </template>
                      </div>
                    </div>

                    <div
                      v-if="activeSkillPickerId === group.definition.id"
                      class="sheet-skill-picker"
                    >
                      <button
                        v-for="speciality in availableSheetSpecialities(group.definition)"
                        :key="`${group.definition.id}:picker:${speciality}`"
                        class="sheet-skill-picker__option"
                        type="button"
                        @click="addSheetSpeciality(group.definition, speciality)"
                      >
                        {{ specialityDisplayName(group.definition, speciality) }}
                      </button>
                      <div v-if="customSpecialitySkillIds.has(group.definition.id)" class="sheet-skill-picker__custom">
                        <input
                          v-model="customSpecialityDrafts[group.definition.id]"
                          class="sheet-line-input"
                          placeholder="Custom specialty"
                          @keydown.enter.prevent="addCustomSpecialitySkill(group.definition)"
                        >
                        <button class="sheet-skill-picker__add-custom" type="button" @click="addCustomSpecialitySkill(group.definition)">Add</button>
                      </div>
                    </div>

                    <div v-if="selectedSheetSpecialities(group.definition).length" class="sheet-skill-specialities">
                      <div
                        v-for="speciality in selectedSheetSpecialities(group.definition)"
                        :key="`${group.definition.id}:${speciality.specialityId}`"
                        class="sheet-skill-entry sheet-skill-entry--speciality"
                      >
                        <label class="sheet-skill-toggle">
                          <input
                            :checked="specialitySkillChecked(group.definition, speciality.specialityId)"
                            type="checkbox"
                            @change="toggleSpecialitySkill(group.definition, speciality.specialityName)"
                          >
                        </label>
                        <button
                          class="sheet-skill-roll-button sheet-skill-roll-button--speciality"
                          type="button"
                          @click="openSheetSkillDefinitionRoll(group.definition, speciality.specialityName, specialitySkillDisplayLevel(group.definition, speciality.specialityId))"
                        >
                          <span class="sheet-skill-speciality-label">
                            <span class="sheet-skill-speciality-bullet" aria-hidden="true"></span>
                            {{ speciality.specialityName }}
                          </span>
                        </button>
                        <div class="sheet-skill-rank">
                          <button class="sheet-skill-rank__button" type="button" @click="changeSpecialitySkillLevel(group.definition, speciality.specialityName, -1)">
                            <AppIcon class="sheet-skill-rank__icon sheet-skill-rank__icon--down" name="arrow" />
                          </button>
                          <span class="sheet-skill-rank__value">{{ specialitySkillDisplayLevel(group.definition, speciality.specialityId) ?? '0' }}</span>
                          <button class="sheet-skill-rank__button" type="button" @click="changeSpecialitySkillLevel(group.definition, speciality.specialityName, 1)">
                            <AppIcon class="sheet-skill-rank__icon sheet-skill-rank__icon--up" name="arrow" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
                <div class="sheet-training-box">
                  <div class="sheet-training-title">Training</div>
                  <label class="sheet-line-field sheet-line-field--training">
                    <span>Skill:</span>
                    <input :value="trainingSkill?.name ?? ''" class="sheet-line-input" readonly>
                  </label>
                  <label class="sheet-line-field sheet-line-field--training">
                    <span>Completed Weeks:</span>
                    <input class="sheet-line-input" readonly>
                  </label>
                  <label class="sheet-line-field sheet-line-field--training">
                    <span>Completed Study Periods:</span>
                    <input class="sheet-line-input" readonly>
                  </label>
                </div>
              </div>
            </section>

            <template v-else-if="activeMobileSheetSection === 'loadout'">
              <section class="sheet-panel sheet-panel--vertical">
                <header class="sheet-panel-title sheet-panel-title--side">Augments</header>
                <div class="sheet-table">
                  <div class="sheet-table-body">
                    <div v-for="(augment, index) in draft.augments" :key="augment.id" class="sheet-table-row sheet-table-row--augments">
                      <div class="sheet-augment-grid">
                        <div class="sheet-augment-row sheet-augment-row--top">
                          <input v-model="augment.name" class="sheet-cell-input" placeholder="Name">
                          <input v-model="augment.techLevel" class="sheet-cell-input" placeholder="TL">
                        </div>
                        <div class="sheet-augment-row sheet-augment-row--bottom">
                          <input v-model="augment.type" class="sheet-cell-input" placeholder="Type">
                          <input v-model="augment.traits" class="sheet-cell-input" placeholder="Traits">
                        </div>
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
                      <div class="sheet-armour-grid">
                        <div class="sheet-armour-row sheet-armour-row--top">
                          <input v-model="armour.name" class="sheet-cell-input" placeholder="Name">
                          <input v-model="armour.type" class="sheet-cell-input" placeholder="Type">
                          <input v-model="armour.radiationProtection" class="sheet-cell-input" placeholder="Rad">
                          <input v-model="armour.protection" class="sheet-cell-input" placeholder="Prot">
                          <input v-model="armour.kg" class="sheet-cell-input" placeholder="Kg">
                        </div>
                        <div class="sheet-armour-row sheet-armour-row--bottom">
                          <input v-model="armour.options" class="sheet-cell-input" placeholder="Options">
                          <input v-model="armour.traits" class="sheet-cell-input" placeholder="Traits">
                        </div>
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
                      <div class="sheet-weapon-grid">
                        <div class="sheet-weapon-row sheet-weapon-row--top">
                          <input v-model="weapon.name" class="sheet-cell-input" placeholder="Name">
                          <input v-model="weapon.techLevel" class="sheet-cell-input" placeholder="TL">
                          <input v-model="weapon.range" class="sheet-cell-input" placeholder="Range">
                          <input v-model="weapon.damage" class="sheet-cell-input" placeholder="Damage">
                          <input v-model="weapon.kg" class="sheet-cell-input" placeholder="Kg">
                          <input v-model="weapon.magazine" class="sheet-cell-input" placeholder="Mag">
                        </div>
                        <div class="sheet-weapon-row sheet-weapon-row--bottom">
                          <input v-model="weapon.traits" class="sheet-cell-input" placeholder="Traits">
                          <input v-model="weapon.notes" class="sheet-cell-input" placeholder="Notes">
                        </div>
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
                    <div v-for="({ item, index }) in nonVoucherEquipmentEntries" :key="item.id" class="sheet-table-row sheet-table-row--equipment">
                      <div class="sheet-equipment-grid">
                        <div class="sheet-equipment-row sheet-equipment-row--top">
                          <input v-model="item.name" class="sheet-cell-input" placeholder="Name">
                          <input v-model="item.traits" class="sheet-cell-input" placeholder="Type / traits">
                          <input v-model="item.techLevel" class="sheet-cell-input" placeholder="TL">
                          <input v-model="item.kg" class="sheet-cell-input" placeholder="Kg">
                        </div>
                        <div class="sheet-equipment-row sheet-equipment-row--bottom">
                          <input v-model="item.notes" class="sheet-cell-input" placeholder="Notes">
                        </div>
                      </div>
                      <button aria-label="Remove equipment" class="sheet-remove" title="Remove equipment" type="button" @click="removeEquipment(index)">
                        <AppIcon name="close" />
                      </button>
                    </div>
                    <div class="sheet-loadout-actions">
                      <button class="sheet-add" type="button" @click="addEquipment">Add Equipment</button>
                    </div>
                  </div>
                </div>
              </section>

              <section class="sheet-panel sheet-panel--vertical">
                <header class="sheet-panel-title sheet-panel-title--side">Vouchers</header>
                <div class="sheet-voucher-section sheet-voucher-section--standalone">
                  <div class="sheet-voucher-section__header">
                    <span>Voucher Claims</span>
                    <button class="sheet-voucher-section__action" type="button" @click="addVoucher()">Add Voucher</button>
                  </div>
                  <div v-if="voucherEquipmentEntries.length" class="sheet-voucher-grid">
                    <article
                      v-for="({ item, index }) in voucherEquipmentEntries"
                      :key="item.id"
                      class="sheet-voucher-card"
                      :class="voucherThemeClass(item)"
                    >
                      <div class="sheet-voucher-card__top">
                        <div class="sheet-voucher-card__tl">TL{{ item.techLevel || 'X' }}</div>
                        <div class="sheet-voucher-card__text">
                          <div class="sheet-voucher-card__heading">{{ voucherDisplayHeading(item) }}</div>
                          <div class="sheet-voucher-card__subheading">VOUCHER</div>
                        </div>
                        <button aria-label="Remove voucher" class="sheet-voucher-card__remove" title="Remove voucher" type="button" @click="removeEquipment(index)">
                          <AppIcon name="close" />
                        </button>
                      </div>
                      <div class="sheet-voucher-card__meta">
                        <select :value="voucherSelectedType(item)" class="sheet-voucher-card__field sheet-voucher-card__field--select" @change="setVoucherType(item, ($event.target as HTMLSelectElement).value)">
                          <option value="">Select type</option>
                          <option v-for="option in voucherTypeOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                        </select>
                        <input v-model="item.techLevel" class="sheet-voucher-card__field" placeholder="TL / scope">
                      </div>
                    </article>
                  </div>
                  <p v-else class="sheet-panel-empty">No voucher claims recorded.</p>
                </div>
              </section>
            </template>

            <template v-else-if="activeMobileSheetSection === 'career'">
              <section class="sheet-panel">
                <header class="sheet-panel-title sheet-panel-title--compact sheet-panel-title--actionable">
                  <span>Careers</span>
                  <button aria-label="Add career" class="sheet-panel-action" title="Add career" type="button" @click="addCareer">
                    <AppIcon name="plus" />
                  </button>
                </header>
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
                      <input :value="termRankLabel(term)" class="sheet-cell-input" readonly>
                      <input :value="termNotesLabel(term)" class="sheet-cell-input" placeholder="Notes" readonly>
                      <button aria-label="Remove career" class="sheet-remove" title="Remove career" type="button" @click="removeCareer(index)">
                        <AppIcon name="close" />
                      </button>
                    </div>
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
                    <span class="sheet-line-field__credits-label">Credits: <GalacticCreditsIcon class="sheet-line-field__credits-symbol" /></span>
                    <input :value="formatCreditDisplay(draft.finances.cashOnHand)" class="sheet-line-input" inputmode="numeric" type="text" @input="handleCreditInput">
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
                <header class="sheet-panel-title sheet-panel-title--compact sheet-panel-title--actionable">
                  <span>Wounds</span>
                  <button aria-label="Add wound" class="sheet-panel-action" title="Add wound" type="button" @click="addWound">
                    <AppIcon name="plus" />
                  </button>
                </header>
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
            <button aria-label="Delete Sheet" class="sheet-toolbar-button sheet-toolbar-button--danger" title="Delete Sheet" type="button" @click="requestDeleteSheet">
              <AppIcon name="trash" />
            </button>
            <button aria-label="Save Sheet" class="sheet-toolbar-button sheet-toolbar-button--primary" title="Save Sheet" type="button" @click="saveSheet">
              <AppIcon name="save" />
            </button>
          </div>
          <div
            v-if="sheetDeleteConfirmOpen"
            class="sheet-toolbar-confirm"
            @click.stop
          >
            <p class="sheet-toolbar-confirm__text">Delete traveller?</p>
            <div class="sheet-toolbar-confirm__actions">
              <button class="sheet-toolbar-confirm__button" type="button" @click="cancelDeleteSheet">
                Cancel
              </button>
              <button class="sheet-toolbar-confirm__button sheet-toolbar-confirm__button--danger" type="button" @click="confirmDeleteSheet">
                Delete
              </button>
            </div>
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
                    <div class="sheet-augment-grid">
                      <div class="sheet-augment-row sheet-augment-row--top">
                        <input v-model="augment.name" class="sheet-cell-input" placeholder="Name">
                        <input v-model="augment.techLevel" class="sheet-cell-input" placeholder="TL">
                      </div>
                      <div class="sheet-augment-row sheet-augment-row--bottom">
                        <input v-model="augment.type" class="sheet-cell-input" placeholder="Type">
                        <input v-model="augment.traits" class="sheet-cell-input" placeholder="Traits">
                      </div>
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
                    <div class="sheet-armour-grid">
                      <div class="sheet-armour-row sheet-armour-row--top">
                        <input v-model="armour.name" class="sheet-cell-input" placeholder="Name">
                        <input v-model="armour.type" class="sheet-cell-input" placeholder="Type">
                        <input v-model="armour.radiationProtection" class="sheet-cell-input" placeholder="Rad">
                        <input v-model="armour.protection" class="sheet-cell-input" placeholder="Prot">
                        <input v-model="armour.kg" class="sheet-cell-input" placeholder="Kg">
                      </div>
                      <div class="sheet-armour-row sheet-armour-row--bottom">
                        <input v-model="armour.options" class="sheet-cell-input" placeholder="Options">
                        <input v-model="armour.traits" class="sheet-cell-input" placeholder="Traits">
                      </div>
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
                    <div class="sheet-weapon-grid">
                      <div class="sheet-weapon-row sheet-weapon-row--top">
                        <input v-model="weapon.name" class="sheet-cell-input" placeholder="Name">
                        <input v-model="weapon.techLevel" class="sheet-cell-input" placeholder="TL">
                        <input v-model="weapon.range" class="sheet-cell-input" placeholder="Range">
                        <input v-model="weapon.damage" class="sheet-cell-input" placeholder="Damage">
                        <input v-model="weapon.kg" class="sheet-cell-input" placeholder="Kg">
                        <input v-model="weapon.magazine" class="sheet-cell-input" placeholder="Mag">
                      </div>
                      <div class="sheet-weapon-row sheet-weapon-row--bottom">
                        <input v-model="weapon.traits" class="sheet-cell-input" placeholder="Traits">
                        <input v-model="weapon.notes" class="sheet-cell-input" placeholder="Notes">
                      </div>
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
                  <div v-for="({ item, index }) in nonVoucherEquipmentEntries" :key="item.id" class="sheet-table-row sheet-table-row--equipment">
                    <div class="sheet-equipment-grid">
                      <div class="sheet-equipment-row sheet-equipment-row--top">
                        <input v-model="item.name" class="sheet-cell-input" placeholder="Name">
                        <input v-model="item.traits" class="sheet-cell-input" placeholder="Type / traits">
                        <input v-model="item.techLevel" class="sheet-cell-input" placeholder="TL">
                        <input v-model="item.kg" class="sheet-cell-input" placeholder="Kg">
                      </div>
                      <div class="sheet-equipment-row sheet-equipment-row--bottom">
                        <input v-model="item.notes" class="sheet-cell-input" placeholder="Notes">
                      </div>
                    </div>
                    <button aria-label="Remove equipment" class="sheet-remove" title="Remove equipment" type="button" @click="removeEquipment(index)">
                      <AppIcon name="close" />
                    </button>
                  </div>
                  <div class="sheet-loadout-actions">
                    <button class="sheet-add" type="button" @click="addEquipment">Add Equipment</button>
                  </div>
                </div>
              </div>
            </section>

            <section class="sheet-panel sheet-panel--vertical">
              <header class="sheet-panel-title sheet-panel-title--side">Vouchers</header>
              <div class="sheet-voucher-section sheet-voucher-section--standalone">
                <div class="sheet-voucher-section__header">
                  <span>Voucher Claims</span>
                  <button class="sheet-voucher-section__action" type="button" @click="addVoucher()">Add Voucher</button>
                </div>
                <div v-if="voucherEquipmentEntries.length" class="sheet-voucher-grid">
                  <article
                    v-for="({ item, index }) in voucherEquipmentEntries"
                    :key="item.id"
                    class="sheet-voucher-card"
                    :class="voucherThemeClass(item)"
                  >
                    <div class="sheet-voucher-card__top">
                      <div class="sheet-voucher-card__tl">TL{{ item.techLevel || 'X' }}</div>
                      <div class="sheet-voucher-card__text">
                        <div class="sheet-voucher-card__heading">{{ voucherDisplayHeading(item) }}</div>
                        <div class="sheet-voucher-card__subheading">VOUCHER</div>
                      </div>
                      <button aria-label="Remove voucher" class="sheet-voucher-card__remove" title="Remove voucher" type="button" @click="removeEquipment(index)">
                        <AppIcon name="close" />
                      </button>
                    </div>
                    <div class="sheet-voucher-card__meta">
                      <select :value="voucherSelectedType(item)" class="sheet-voucher-card__field sheet-voucher-card__field--select" @change="setVoucherType(item, ($event.target as HTMLSelectElement).value)">
                        <option value="">Select type</option>
                        <option v-for="option in voucherTypeOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                      </select>
                      <input v-model="item.techLevel" class="sheet-voucher-card__field" placeholder="TL / scope">
                    </div>
                  </article>
                </div>
                <p v-else class="sheet-panel-empty">No voucher claims recorded.</p>
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
                <div
                  class="sheet-dm-block sheet-dm-block--interactive"
                  role="button"
                  tabindex="0"
                  :title="`Roll ${draft.characteristics[id].name || draft.characteristics[id].abbreviation}`"
                  @click="openCharacteristicRoll(id)"
                  @keydown.enter.prevent="openCharacteristicRoll(id)"
                  @keydown.space.prevent="openCharacteristicRoll(id)"
                >
                  <input :value="formatDm(draft.characteristics[id].dm)" class="sheet-dm-input" readonly tabindex="-1">
                  <span>DM</span>
                </div>
              </div>
            </section>

            <section class="sheet-panel sheet-panel--skills">
              <header class="sheet-panel-title sheet-panel-title--side sheet-panel-title--actionable">
                <span>Skills</span>
                <button
                  class="sheet-skill-visibility-toggle"
                  :aria-label="showOnlyTrainedSkills ? 'Show all skills' : 'Show trained skills only'"
                  :title="showOnlyTrainedSkills ? 'Show all skills' : 'Show trained skills only'"
                  type="button"
                  @click="showOnlyTrainedSkills = !showOnlyTrainedSkills"
                >
                  <svg v-if="showOnlyTrainedSkills" viewBox="0 0 24 24" class="sheet-skill-visibility-icon" aria-hidden="true">
                    <path fill="currentColor" d="M12 5c5.6 0 9.57 4.13 10.82 6.13a1.5 1.5 0 0 1 0 1.74C21.57 14.87 17.6 19 12 19S2.43 14.87 1.18 12.87a1.5 1.5 0 0 1 0-1.74C2.43 9.13 6.4 5 12 5Zm0 2c-4.62 0-8.02 3.28-9.2 5 1.18 1.72 4.58 5 9.2 5s8.02-3.28 9.2-5C20.02 10.28 16.62 7 12 7Zm0 2.25A2.75 2.75 0 1 1 9.25 12 2.75 2.75 0 0 1 12 9.25Zm0 2A.75.75 0 1 0 12.75 12 .75.75 0 0 0 12 11.25Z" />
                  </svg>
                  <svg v-else viewBox="0 0 24 24" class="sheet-skill-visibility-icon" aria-hidden="true">
                    <path fill="currentColor" d="M3.28 2.22 21.78 20.72l-1.06 1.06-3.07-3.06A12.3 12.3 0 0 1 12 20C6.4 20 2.43 15.87 1.18 13.87a1.5 1.5 0 0 1 0-1.74 18.2 18.2 0 0 1 5.07-5.19L2.22 3.28Zm8.01 8.01 2.48 2.48a1.75 1.75 0 0 0-2.48-2.48Zm5.09 5.09-1.45-1.45A4.75 4.75 0 0 1 8.13 9.07L7.09 8.03C5.19 9.17 3.7 10.81 2.8 12c1.18 1.72 4.58 6 9.2 6a10.2 10.2 0 0 0 4.38-1.68Zm1.65-1.18-1.45-1.45A9.45 9.45 0 0 0 21.2 12c-.69-1-2.25-2.82-4.62-4.07l-1.07-1.06c3.32 1.25 5.8 3.85 7.31 6.26a1.5 1.5 0 0 1 0 1.74 18.34 18.34 0 0 1-4.79 4.89Z" />
                  </svg>
                </button>
              </header>
              <div class="sheet-skills-grid" :class="{ 'sheet-skills-grid--two-column': skillColumnCount === 2 }">
                <div v-for="(column, columnIndex) in skillGroupColumns" :key="`skills-${columnIndex}`" class="sheet-skill-column">
                  <section v-for="group in column" :key="group.definition.id" class="sheet-skill-group">
                    <div class="sheet-skill-entry sheet-skill-entry--base">
                      <span v-if="sheetSkillMode(group.definition) === 'independent'" class="sheet-skill-toggle sheet-skill-toggle--empty" aria-hidden="true"></span>
                      <label v-else class="sheet-skill-toggle">
                        <input
                          :checked="baseSkillChecked(group.definition)"
                          type="checkbox"
                          @change="toggleBaseSkill(group.definition)"
                        >
                      </label>
                      <button
                        class="sheet-skill-roll-button"
                        type="button"
                        @click="openSheetSkillDefinitionRoll(group.definition, undefined, baseSkillDisplayLevel(group.definition))"
                      >
                        {{ group.definition.name }}
                      </button>
                      <div class="sheet-skill-rank" :class="{ 'sheet-skill-rank--disabled': sheetSkillHasSpecialities(group.definition) || sheetSkillMode(group.definition) === 'independent' }">
                        <template v-if="sheetSkillHasSpecialities(group.definition)">
                          <span class="sheet-skill-rank__value">{{ sheetSkillMode(group.definition) === 'independent' ? '--' : (baseSkillDisplayLevel(group.definition) ?? '0') }}</span>
                          <button
                            :aria-label="`Add ${group.definition.name} specialty`"
                            class="sheet-skill-group__add sheet-skill-rank__addon"
                            :title="`Add ${group.definition.name} specialty`"
                            type="button"
                            @click="toggleSkillPicker(group.definition)"
                          >
                            <AppIcon name="plus" />
                          </button>
                        </template>
                        <template v-else>
                          <button class="sheet-skill-rank__button" type="button" @click="changeBaseSkillLevel(group.definition, -1)">
                            <AppIcon class="sheet-skill-rank__icon sheet-skill-rank__icon--down" name="arrow" />
                          </button>
                          <span class="sheet-skill-rank__value">{{ baseSkillDisplayLevel(group.definition) ?? '0' }}</span>
                          <button class="sheet-skill-rank__button" type="button" @click="changeBaseSkillLevel(group.definition, 1)">
                            <AppIcon class="sheet-skill-rank__icon sheet-skill-rank__icon--up" name="arrow" />
                          </button>
                        </template>
                      </div>
                    </div>

                    <div
                      v-if="activeSkillPickerId === group.definition.id"
                      class="sheet-skill-picker"
                    >
                      <button
                        v-for="speciality in availableSheetSpecialities(group.definition)"
                        :key="`${group.definition.id}:picker:${speciality}`"
                        class="sheet-skill-picker__option"
                        type="button"
                        @click="addSheetSpeciality(group.definition, speciality)"
                      >
                        {{ specialityDisplayName(group.definition, speciality) }}
                      </button>
                      <div v-if="customSpecialitySkillIds.has(group.definition.id)" class="sheet-skill-picker__custom">
                        <input
                          v-model="customSpecialityDrafts[group.definition.id]"
                          class="sheet-line-input"
                          placeholder="Custom specialty"
                          @keydown.enter.prevent="addCustomSpecialitySkill(group.definition)"
                        >
                        <button class="sheet-skill-picker__add-custom" type="button" @click="addCustomSpecialitySkill(group.definition)">Add</button>
                      </div>
                    </div>

                    <div v-if="selectedSheetSpecialities(group.definition).length" class="sheet-skill-specialities">
                      <div
                        v-for="speciality in selectedSheetSpecialities(group.definition)"
                        :key="`${group.definition.id}:${speciality.specialityId}`"
                        class="sheet-skill-entry sheet-skill-entry--speciality"
                      >
                        <label class="sheet-skill-toggle">
                          <input
                            :checked="specialitySkillChecked(group.definition, speciality.specialityId)"
                            type="checkbox"
                            @change="toggleSpecialitySkill(group.definition, speciality.specialityName)"
                          >
                        </label>
                        <button
                          class="sheet-skill-roll-button sheet-skill-roll-button--speciality"
                          type="button"
                          @click="openSheetSkillDefinitionRoll(group.definition, speciality.specialityName, specialitySkillDisplayLevel(group.definition, speciality.specialityId))"
                        >
                          <span class="sheet-skill-speciality-label">
                            <span class="sheet-skill-speciality-bullet" aria-hidden="true"></span>
                            {{ speciality.specialityName }}
                          </span>
                        </button>
                        <div class="sheet-skill-rank">
                          <button class="sheet-skill-rank__button" type="button" @click="changeSpecialitySkillLevel(group.definition, speciality.specialityName, -1)">
                            <AppIcon class="sheet-skill-rank__icon sheet-skill-rank__icon--down" name="arrow" />
                          </button>
                          <span class="sheet-skill-rank__value">{{ specialitySkillDisplayLevel(group.definition, speciality.specialityId) ?? '0' }}</span>
                          <button class="sheet-skill-rank__button" type="button" @click="changeSpecialitySkillLevel(group.definition, speciality.specialityName, 1)">
                            <AppIcon class="sheet-skill-rank__icon sheet-skill-rank__icon--up" name="arrow" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
                <div class="sheet-training-box">
                  <div class="sheet-training-title">Training</div>
                  <label class="sheet-line-field sheet-line-field--training">
                    <span>Skill:</span>
                    <input :value="trainingSkill?.name ?? ''" class="sheet-line-input" readonly>
                  </label>
                  <label class="sheet-line-field sheet-line-field--training">
                    <span>Completed Weeks:</span>
                    <input class="sheet-line-input" readonly>
                  </label>
                  <label class="sheet-line-field sheet-line-field--training">
                    <span>Completed Study Periods:</span>
                    <input class="sheet-line-input" readonly>
                  </label>
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
                  <span class="sheet-line-field__credits-label">Credits: <GalacticCreditsIcon class="sheet-line-field__credits-symbol" /></span>
                  <input :value="formatCreditDisplay(draft.finances.cashOnHand)" class="sheet-line-input" inputmode="numeric" type="text" @input="handleCreditInput">
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
              <header class="sheet-panel-title sheet-panel-title--compact sheet-panel-title--actionable">
                <span>Wounds</span>
                <button aria-label="Add wound" class="sheet-panel-action" title="Add wound" type="button" @click="addWound">
                  <AppIcon name="plus" />
                </button>
              </header>
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
                </div>
              </div>
            </section>

            <section class="sheet-panel">
              <header class="sheet-panel-title sheet-panel-title--compact sheet-panel-title--actionable">
                <span>Careers</span>
                <button aria-label="Add career" class="sheet-panel-action" title="Add career" type="button" @click="addCareer">
                  <AppIcon name="plus" />
                </button>
              </header>
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
                    <input :value="termRankLabel(term)" class="sheet-cell-input" readonly>
                    <input :value="termNotesLabel(term)" class="sheet-cell-input" placeholder="Notes" readonly>
                    <button aria-label="Remove career" class="sheet-remove" title="Remove career" type="button" @click="removeCareer(index)">
                      <AppIcon name="close" />
                    </button>
                  </div>
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

      <div v-if="rollModalOpen" class="sheet-roll-overlay" @click.self="closeRollModal">
        <div class="sheet-roll-modal" role="dialog" aria-modal="true" :aria-labelledby="'sheet-roll-title'">
          <div class="sheet-roll-modal__header">
            <div>
              <div id="sheet-roll-title" class="sheet-roll-modal__title">{{ rollModalTitle }}</div>
              <div class="sheet-roll-modal__subtitle">{{ rollModalSubtitle }}</div>
            </div>
            <button aria-label="Close roll dialog" class="sheet-roll-modal__close" type="button" @click="closeRollModal">
              <AppIcon name="close" />
            </button>
          </div>

          <div class="sheet-roll-dice">
            <div class="sheet-roll-die" :class="{ 'sheet-roll-die--rolling': rollModalRolling }">{{ rollModalDice[0] }}</div>
            <div class="sheet-roll-die" :class="{ 'sheet-roll-die--rolling': rollModalRolling }">{{ rollModalDice[1] }}</div>
          </div>

          <div class="sheet-roll-formula">{{ rollModalFormula }}</div>
          <div class="sheet-roll-total">{{ rollModalTotal }}</div>
          <div class="sheet-roll-status">{{ rollModalRolling ? 'Rolling...' : 'Roll complete' }}</div>

          <div class="sheet-roll-actions">
            <button class="sheet-portrait-confirm-button" type="button" @click="startRollModal(rollModalTitle, rollModalSubtitle, rollModalModifier)">
              Roll Again
            </button>
            <button class="sheet-portrait-confirm-button sheet-portrait-confirm-button--danger" type="button" @click="closeRollModal">
              Close
            </button>
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
  position: relative;
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
  position: relative;
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

.sheet-toolbar-confirm {
  position: absolute;
  top: calc(100% - 6px);
  right: 16px;
  z-index: 12;
  display: grid;
  gap: 8px;
  min-width: 156px;
  padding: 10px;
  border: 1px solid rgba(34, 211, 238, 0.34);
  border-radius: 10px 0 10px 0;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  background:
    linear-gradient(180deg, rgba(8, 18, 32, 0.98), rgba(3, 7, 18, 0.98)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.12), transparent 8rem);
  box-shadow:
    0 0 18px rgba(34, 211, 238, 0.12),
    inset 0 0 18px rgba(34, 211, 238, 0.05);
}

.sheet-toolbar-confirm__text {
  color: #e4e4e7;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.sheet-toolbar-confirm__actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.sheet-toolbar-confirm__button {
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

.sheet-toolbar-confirm__button--danger {
  border-color: rgba(248, 113, 113, 0.42);
  color: #ffe4e6;
  background: rgba(58, 14, 20, 0.9);
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

.sheet-table-row--augments { grid-template-columns: minmax(0, 1fr) auto; }
.sheet-table-row--armour { grid-template-columns: minmax(0, 1fr) auto; }
.sheet-table-row--weapons { grid-template-columns: minmax(0, 1fr) auto; }
.sheet-table-row--equipment { grid-template-columns: minmax(0, 1fr) auto; }
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

.sheet-augment-grid {
  display: grid;
  gap: 6px;
}

.sheet-augment-row {
  display: grid;
  gap: 6px;
}

.sheet-augment-row--top {
  grid-template-columns: minmax(0, 1fr) 82px;
}

.sheet-augment-row--bottom {
  grid-template-columns: 82px minmax(0, 1fr);
}

.sheet-armour-grid {
  display: grid;
  gap: 6px;
}

.sheet-armour-row {
  display: grid;
  gap: 6px;
}

.sheet-armour-row--top {
  grid-template-columns: minmax(0, 1fr) repeat(4, 82px);
}

.sheet-armour-row--bottom {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.sheet-weapon-grid {
  display: grid;
  gap: 6px;
}

.sheet-weapon-row {
  display: grid;
  gap: 6px;
}

.sheet-weapon-row--top {
  grid-template-columns: minmax(0, 1fr) repeat(5, 82px);
}

.sheet-weapon-row--bottom {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.sheet-equipment-grid {
  display: grid;
  gap: 6px;
}

.sheet-equipment-row {
  display: grid;
  gap: 6px;
}

.sheet-equipment-row--top {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 82px 82px;
}

.sheet-equipment-row--bottom {
  grid-template-columns: minmax(0, 1fr);
}

.sheet-cell-input,
.sheet-line-input,
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
.sheet-textarea:focus {
  border-color: rgba(34, 211, 238, 0.72);
  box-shadow:
    inset 0 0 0 1px rgba(34, 211, 238, 0.08),
    0 0 18px rgba(34, 211, 238, 0.14);
}

.sheet-cell-input::placeholder,
.sheet-line-input::placeholder,
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

.sheet-line-field__credits-label {
  display: inline-flex;
  align-items: baseline;
  gap: 0.28rem;
}

.sheet-line-field__credits-symbol {
  width: 1.02rem;
  height: 1.02rem;
  flex: 0 0 auto;
  align-self: center;
  color: #fbbf24;
  transform: translateY(-0.08rem);
  filter:
    drop-shadow(0 0 6px rgb(251 191 36 / 0.22))
    drop-shadow(0 0 14px rgb(234 179 8 / 0.16));
}

.sheet-line-field--training {
  grid-template-columns: 132px minmax(0, 1fr);
  align-items: center;
}

.sheet-line-field--training span {
  font-size: 0.72rem;
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

.sheet-dm-block--interactive {
  cursor: pointer;
  transition: transform 140ms ease, filter 140ms ease;
}

.sheet-dm-block--interactive:hover,
.sheet-dm-block--interactive:focus-visible {
  filter: drop-shadow(0 0 12px rgba(34, 211, 238, 0.22));
  transform: translateY(-1px);
  outline: none;
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
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
}

.sheet-skills-grid--two-column {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.sheet-skill-column {
  display: grid;
  gap: 0.55rem;
  align-content: start;
}

.sheet-skill-group {
  position: relative;
  display: grid;
  gap: 0.3rem;
  padding: 0.4rem 0.45rem;
  border: 1px solid rgba(34, 211, 238, 0.18);
  border-radius: 12px 0 12px 0;
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
  background:
    linear-gradient(180deg, rgba(8, 13, 24, 0.5), rgba(8, 13, 24, 0.18));
}

.sheet-skill-group__add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  justify-self: end;
  width: 1.35rem;
  height: 1.35rem;
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 7px 0 7px 0;
  clip-path: polygon(0 0, calc(100% - 7px) 0, 100% 7px, 100% 100%, 7px 100%, 0 calc(100% - 7px));
  background:
    linear-gradient(180deg, rgba(56, 34, 8, 0.84), rgba(24, 16, 6, 0.88)),
    radial-gradient(circle at 0 0, rgba(251, 191, 36, 0.14), transparent 4rem);
  color: #fbbf24;
  padding: 0;
}

.sheet-skill-entry {
  display: grid;
  grid-template-columns: 1.1rem minmax(0, 1fr) 4.9rem;
  gap: 0.32rem;
  align-items: center;
}

.sheet-skill-entry--base {
  padding-bottom: 0.04rem;
}

.sheet-skill-specialities {
  display: grid;
  gap: 0.28rem;
  margin-left: 0.75rem;
  padding-top: 0.28rem;
  padding-left: 0.9rem;
  border-left: 1px solid rgb(34 211 238 / 0.22);
  box-shadow: inset 8px 0 10px -10px rgb(34 211 238 / 0.18);
}

.sheet-skill-entry--speciality {
  padding-left: 0;
}

.sheet-skill-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.sheet-skill-toggle input {
  width: 0.95rem;
  height: 0.95rem;
  accent-color: #22d3ee;
}

.sheet-skill-toggle--empty {
  width: 0.95rem;
  height: 0.95rem;
}

.sheet-skill-roll-button {
  min-width: 0;
  border: none;
  background: none;
  padding: 0 0 0 0.38rem;
  text-align: left;
  color: #e4e4e7;
  font-size: 0.8rem;
  line-height: 1.1;
  cursor: pointer;
  transition: color 140ms ease, text-shadow 140ms ease;
}

.sheet-skill-roll-button:hover,
.sheet-skill-roll-button:focus-visible {
  color: #cffafe;
  text-shadow: 0 0 12px rgba(34, 211, 238, 0.18);
  outline: none;
}

.sheet-skill-roll-button--speciality {
  padding-left: 0;
}

.sheet-skill-speciality-label {
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;
  min-width: 0;
}

.sheet-skill-speciality-bullet {
  display: inline-flex;
  width: 0.35rem;
  height: 0.35rem;
  flex: 0 0 0.35rem;
  border-radius: 999px;
  background: rgb(103 232 249 / 0.72);
  box-shadow: 0 0 8px rgb(34 211 238 / 0.28);
}

.sheet-skill-rank {
  display: inline-grid;
  grid-template-columns: 1.45rem 1.5rem 1.45rem;
  gap: 0.14rem;
  align-items: center;
  min-width: 4.9rem;
  justify-content: end;
}

.sheet-skill-rank--disabled {
  justify-items: stretch;
}

.sheet-skill-rank__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.45rem;
  height: 1.45rem;
  border: 1px solid rgba(34, 211, 238, 0.28);
  border-radius: 8px 0 8px 0;
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
  background: rgba(8, 18, 32, 0.82);
  color: #67e8f9;
  font-weight: 700;
}

.sheet-skill-rank__icon {
  width: 0.72rem;
  height: 0.72rem;
}

.sheet-skill-rank__icon--up {
  transform: rotate(0deg);
}

.sheet-skill-rank__icon--down {
  transform: rotate(180deg);
}

.sheet-skill-rank__value {
  grid-column: 2;
  min-width: 1.5rem;
  text-align: center;
  color: #e0f2fe;
  font-weight: 700;
  font-size: 0.86rem;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.sheet-skill-group__add :deep(svg) {
  width: 0.72rem;
  height: 0.72rem;
}

.sheet-skill-rank__addon {
  grid-column: 3;
  justify-self: end;
}

.sheet-skill-picker {
  display: grid;
  gap: 0.25rem;
  margin-left: 1.35rem;
  padding: 0.42rem;
  border: 1px solid rgba(34, 211, 238, 0.2);
  border-radius: 10px 0 10px 0;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  background:
    linear-gradient(180deg, rgba(8, 18, 32, 0.95), rgba(3, 7, 18, 0.95)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.08), transparent 6rem);
  box-shadow:
    inset 0 0 0 1px rgba(34, 211, 238, 0.04),
    0 0 16px rgba(34, 211, 238, 0.08);
}

.sheet-skill-picker__option {
  border: 1px solid rgba(34, 211, 238, 0.18);
  border-radius: 8px 0 8px 0;
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
  background: rgba(8, 18, 32, 0.82);
  padding: 0.36rem 0.48rem;
  text-align: left;
  color: #cbd5e1;
  font-size: 0.76rem;
}

.sheet-skill-picker__option:hover,
.sheet-skill-picker__option:focus-visible {
  border-color: rgba(34, 211, 238, 0.52);
  color: #e0f2fe;
  outline: none;
}

.sheet-skill-picker__custom {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.3rem;
  margin-top: 0.08rem;
}

.sheet-skill-picker__add-custom {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 3rem;
  border: 1px solid rgba(34, 211, 238, 0.26);
  border-radius: 8px 0 8px 0;
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
  background: rgba(8, 18, 32, 0.82);
  color: #67e8f9;
  font-weight: 700;
}

.sheet-dm-input {
  pointer-events: none;
}

.sheet-roll-overlay {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background: rgba(2, 6, 23, 0.56);
  backdrop-filter: blur(16px);
  animation: sheet-roll-fade-in 180ms ease;
}

.sheet-roll-modal {
  width: min(100%, 28rem);
  display: grid;
  gap: 1rem;
  padding: 1.15rem;
  border: 1px solid rgba(34, 211, 238, 0.38);
  border-radius: 16px 0 16px 0;
  clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px));
  background:
    linear-gradient(180deg, rgba(8, 18, 32, 0.96), rgba(3, 7, 18, 0.96)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.15), transparent 14rem);
  box-shadow:
    0 0 28px rgba(34, 211, 238, 0.18),
    inset 0 0 22px rgba(34, 211, 238, 0.05);
}

.sheet-roll-modal__header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 1rem;
}

.sheet-roll-modal__title {
  color: #e0f2fe;
  font-size: 1.1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.sheet-roll-modal__subtitle {
  margin-top: 0.2rem;
  color: #94a3b8;
  font-size: 0.82rem;
  text-transform: uppercase;
}

.sheet-roll-modal__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid rgba(34, 211, 238, 0.32);
  border-radius: 10px 0 10px 0;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  background: rgba(8, 18, 32, 0.86);
  color: #67e8f9;
}

.sheet-roll-dice {
  display: flex;
  justify-content: center;
  gap: 0.85rem;
}

.sheet-roll-die {
  display: grid;
  place-items: center;
  width: 4.2rem;
  height: 4.2rem;
  border: 1px solid rgba(34, 211, 238, 0.42);
  border-radius: 14px 0 14px 0;
  clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px));
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(8, 13, 24, 1));
  color: #e0f2fe;
  font-size: 1.5rem;
  font-weight: 800;
  box-shadow: inset 0 0 0 1px rgba(34, 211, 238, 0.09);
}

.sheet-roll-die--rolling {
  animation: sheet-roll-die-pulse 220ms linear infinite;
}

.sheet-roll-formula,
.sheet-roll-status {
  text-align: center;
  color: #94a3b8;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.sheet-roll-total {
  text-align: center;
  color: #fbbf24;
  font-size: 2.4rem;
  font-weight: 800;
  line-height: 1;
  text-shadow: 0 0 18px rgba(251, 191, 36, 0.16);
}

.sheet-roll-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

@keyframes sheet-roll-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes sheet-roll-die-pulse {
  0%,
  100% {
    transform: translateY(0) scale(1);
    box-shadow:
      inset 0 0 0 1px rgba(34, 211, 238, 0.09),
      0 0 12px rgba(34, 211, 238, 0.06);
  }
  50% {
    transform: translateY(-1px) scale(1.04);
    box-shadow:
      inset 0 0 0 1px rgba(34, 211, 238, 0.14),
      0 0 18px rgba(34, 211, 238, 0.14);
  }
}

.sheet-training-box {
  display: grid;
  gap: 6px;
  grid-column: 1 / -1;
  align-self: end;
  padding: 8px 8px 0;
  border: 1px solid rgba(34, 211, 238, 0.18);
  border-radius: 12px 0 12px 0;
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
  background: linear-gradient(180deg, rgba(8, 13, 24, 0.52), rgba(8, 13, 24, 0.18));
}

.sheet-training-title {
  color: #fbbf24;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.76rem;
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

.sheet-loadout-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-top: 0.7rem;
}

.sheet-voucher-section {
  display: grid;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 0.95rem;
  border-top: 1px solid rgba(34, 211, 238, 0.12);
}

.sheet-voucher-section--standalone {
  margin-top: 0;
  padding-top: 0;
  border-top: 0;
}

.sheet-voucher-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  color: #cbd5e1;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.sheet-voucher-section__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 1.9rem;
  padding: 0 0.72rem;
  border: 1px solid rgba(34, 211, 238, 0.26);
  border-radius: 10px 0 10px 0;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  background: rgba(8, 18, 32, 0.82);
  color: #67e8f9;
  font-size: 0.74rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.sheet-voucher-grid {
  display: grid;
  gap: 0.8rem;
}

.sheet-voucher-card {
  display: grid;
  gap: 0.85rem;
  padding: 1rem 1rem 0.95rem;
  border: 1px solid rgba(34, 211, 238, 0.18);
  border-radius: 16px 0 16px 0;
  clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px));
  background:
    linear-gradient(180deg, rgba(8, 18, 32, 0.96), rgba(5, 11, 21, 0.96)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.1), transparent 13rem);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.03),
    0 0 18px rgba(8, 18, 32, 0.24);
}

.sheet-voucher-card--weapon {
  border-color: rgba(52, 211, 153, 0.4);
  background:
    linear-gradient(180deg, rgba(9, 45, 31, 0.96), rgba(5, 21, 14, 0.96)),
    radial-gradient(circle at 0 0, rgba(52, 211, 153, 0.14), transparent 13rem);
  box-shadow: 0 0 22px rgba(52, 211, 153, 0.12);
}

.sheet-voucher-card--armour {
  border-color: rgba(52, 211, 153, 0.4);
  background:
    linear-gradient(180deg, rgba(8, 45, 34, 0.96), rgba(4, 20, 15, 0.96)),
    radial-gradient(circle at 0 0, rgba(52, 211, 153, 0.14), transparent 13rem);
}

.sheet-voucher-card--equipment {
  border-color: rgba(226, 232, 240, 0.34);
  background:
    linear-gradient(180deg, rgba(48, 54, 66, 0.96), rgba(20, 24, 32, 0.96)),
    radial-gradient(circle at 0 0, rgba(226, 232, 240, 0.16), transparent 13rem);
}

.sheet-voucher-card--implant {
  border-color: rgba(226, 232, 240, 0.34);
  background:
    linear-gradient(180deg, rgba(48, 54, 66, 0.96), rgba(20, 24, 32, 0.96)),
    radial-gradient(circle at 0 0, rgba(226, 232, 240, 0.16), transparent 13rem);
}

.sheet-voucher-card--vehicle {
  border-color: rgba(34, 211, 238, 0.38);
  background:
    linear-gradient(180deg, rgba(7, 31, 40, 0.96), rgba(4, 14, 20, 0.96)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.14), transparent 13rem);
}

.sheet-voucher-card--small-craft {
  border-color: rgba(168, 85, 247, 0.38);
  background:
    linear-gradient(180deg, rgba(38, 16, 64, 0.96), rgba(17, 8, 32, 0.96)),
    radial-gradient(circle at 0 0, rgba(168, 85, 247, 0.14), transparent 13rem);
}

.sheet-voucher-card--ship {
  border-color: rgba(251, 146, 60, 0.4);
  background:
    linear-gradient(180deg, rgba(70, 28, 10, 0.96), rgba(28, 12, 6, 0.96)),
    radial-gradient(circle at 0 0, rgba(251, 146, 60, 0.14), transparent 13rem);
}

.sheet-voucher-card--generic {
  border-color: rgba(148, 163, 184, 0.28);
}

.sheet-voucher-card__top {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: stretch;
  gap: 0.75rem;
}

.sheet-voucher-card__tl {
  display: grid;
  place-items: center;
  min-width: 3.6rem;
  padding: 0.3rem 0.55rem;
  border: 1px solid currentColor;
  border-radius: 12px 0 12px 0;
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
  background: rgba(2, 6, 23, 0.3);
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  grid-row: 1 / span 2;
  align-self: stretch;
}

.sheet-voucher-card__text {
  display: grid;
  grid-template-rows: repeat(2, minmax(0, 1fr));
  align-self: stretch;
}

.sheet-voucher-card__heading,
.sheet-voucher-card__subheading {
  display: flex;
  align-items: center;
  min-height: 1.55rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.sheet-voucher-card__heading {
  font-size: 0.98rem;
}

.sheet-voucher-card__subheading {
  font-size: 0.72rem;
  opacity: 0.78;
}

.sheet-voucher-card__field {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px 0 10px 0;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  background: rgba(2, 6, 23, 0.34);
  color: inherit;
}

.sheet-voucher-card__remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 10px 0 10px 0;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  background: rgba(2, 6, 23, 0.42);
  color: #e2e8f0;
}

.sheet-voucher-card__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
}

.sheet-voucher-card__field {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  min-height: 2.1rem;
  padding: 0 0.7rem;
  font-size: 0.82rem;
  font-weight: 700;
  border-color: color-mix(in srgb, currentColor 38%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, currentColor 18%, transparent);
  color: currentColor;
}

.sheet-voucher-card__field::placeholder {
  color: color-mix(in srgb, currentColor 62%, transparent);
}

.sheet-voucher-card__field--select {
  background:
    linear-gradient(180deg, color-mix(in srgb, currentColor 16%, rgba(2, 6, 23, 0.84)), rgba(2, 6, 23, 0.38));
  -webkit-text-fill-color: currentColor;
}

.sheet-voucher-card__field--select option {
  color: #e2e8f0;
  background: #081220;
}

.sheet-skill-visibility-icon {
  width: 1.25rem;
  height: 1.25rem;
  display: block;
}

.sheet-skill-visibility-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: #67e8f9;
}

.sheet-skill-visibility-toggle:hover,
.sheet-skill-visibility-toggle:focus-visible {
  color: #cffafe;
  outline: none;
}

.sheet-voucher-card--weapon,
.sheet-voucher-card--armour {
  color: #bbf7d0;
}

.sheet-voucher-card--equipment,
.sheet-voucher-card--implant {
  color: #f8fafc;
}

.sheet-voucher-card--vehicle {
  color: #a5f3fc;
}

.sheet-voucher-card--small-craft {
  color: #e9d5ff;
}

.sheet-voucher-card--ship {
  color: #fdba74;
}

.sheet-voucher-card--generic {
  color: #e2e8f0;
}

.sheet-panel-empty {
  padding: 0.8rem 0.2rem 0.15rem;
  color: #94a3b8;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
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

  .sheet-meta-grid--equipment,
  .sheet-meta-grid--armour {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .sheet-armour-row--top {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .sheet-weapon-row--top {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .sheet-equipment-row--top {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .sheet-voucher-card__meta {
    grid-template-columns: 1fr;
  }

  .sheet-characteristics-panel {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .sheet-line-field--training {
    grid-template-columns: 108px minmax(0, 1fr);
  }
}
</style>
