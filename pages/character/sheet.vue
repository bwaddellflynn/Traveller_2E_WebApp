<script setup lang="ts">
// The sheet page owns state orchestration and persistence.
// Large desktop page layouts are split into subcomponents to keep the file maintainable.
import DiceRollModal from '~/components/character/DiceRollModal.vue'
import SheetDesktopHeader from '~/components/character/sheet/SheetDesktopHeader.vue'
import SheetHistoryPage from '~/components/character/sheet/SheetHistoryPage.vue'
import SheetInventoryPage from '~/components/character/sheet/SheetInventoryPage.vue'
import SheetLogPage from '~/components/character/sheet/SheetLogPage.vue'
import SheetTrainingPanel from '~/components/character/sheet/SheetTrainingPanel.vue'
import SheetTravellerPage from '~/components/character/sheet/SheetTravellerPage.vue'
import GalacticCreditsIcon from '~/components/GalacticCreditsIcon.vue'
import skillsData from '~/data/traveller2e/core/skills.json'
import speciesData from '~/data/traveller2e/core/species.json'
import type { TravellerAssociate, TravellerCharacteristicId, TravellerProfile, TravellerRollRecord, TravellerSkill, TravellerSkillTrainingActive } from '~/types/traveller'
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
let sheetAutosaveTimer: number | null = null
const activeSheetRouteId = computed(() => typeof route.query.id === 'string' ? route.query.id : '')
const activeSheetDraftId = computed(() => typeof route.query.draft === 'string' ? route.query.draft : '')
const activeManualSheetDraftCacheKey = computed(() => {
  return manualTravellerDraftCacheKey(activeSheetRouteId.value || activeSheetDraftId.value)
})
const isUnsavedManualDraftRoute = computed(() => !activeSheetRouteId.value && Boolean(activeSheetDraftId.value))

const characteristicIds: TravellerCharacteristicId[] = ['str', 'dex', 'end', 'int', 'edu', 'soc', 'psi']
const psionicSkillIds = new Set((skillsData.skills as Array<{ id: string; psionic?: boolean }>)
  .filter((skill) => skill.psionic)
  .map((skill) => skill.id))
const sheetHasPsionics = computed(() => {
  return (draft.value.characteristics.psi?.value ?? 0) > 0
    || draft.value.skills.some((skill) => psionicSkillIds.has(parseTravellerSkill(skill.id || skill.name).baseId))
})
const visibleCharacteristicIds = computed(() => characteristicIds.filter((id) => id !== 'psi' || sheetHasPsionics.value))
const speciesOptions = computed(() => {
  const profiles = (speciesData as { raceProfiles?: Array<{ name: string; playable?: boolean; selectableAsSpecies?: boolean }> }).raceProfiles ?? []
  return profiles
    .filter((species) => species.playable !== false && species.selectableAsSpecies !== false)
    .map((species) => species.name)
    .sort((left, right) => left.localeCompare(right))
})
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
  { id: 'profile', label: 'Traveller' },
  { id: 'skills', label: 'Skills' },
  { id: 'loadout', label: 'Inventory' },
  { id: 'career', label: 'History' },
  { id: 'log', label: 'Log' },
  { id: 'network', label: 'Network' },
] as const
type MobileSheetSectionId = typeof mobileSheetSections[number]['id']
const activeMobileSheetSection = ref<MobileSheetSectionId>('profile')
const activeMobileSheetSectionLabel = computed(() => mobileSheetSections.find((section) => section.id === activeMobileSheetSection.value)?.label ?? 'Profile')
const sheetPages = [
  { id: 'traveller', label: 'Traveller' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'history', label: 'History' },
  { id: 'log', label: 'Ship\'s Log' },
] as const
type SheetPageId = typeof sheetPages[number]['id']
const activeSheetPage = ref<SheetPageId>('traveller')
const activeSheetPageLabel = computed(() => sheetPages.find((page) => page.id === activeSheetPage.value)?.label ?? 'Traveller')
const showOnlyTrainedSkills = ref(false)
const selectSkillRollCharacteristic = ref(false)
const selectedTrainingSkillId = ref('')
const selectedTrainingSpeciality = ref('')
const customTrainingSpeciality = ref('')
const selectedTrainingTargetLevel = ref(0)
const selectedTrainingCharacteristic = ref<'edu' | 'str' | 'dex' | 'end'>('edu')
const trainingRollSummary = ref('')
const isVoucherEquipment = (item: TravellerProfile['equipment'][number]) => /voucher$/i.test(item.name) || /voucher/i.test(item.notes ?? '')
const voucherEquipmentEntries = computed(() => draft.value.equipment
  .map((item, index) => ({ item, index }))
  .filter(({ item }) => isVoucherEquipment(item)))
const nonVoucherEquipmentEntries = computed(() => draft.value.equipment
  .map((item, index) => ({ item, index }))
  .filter(({ item }) => !isVoucherEquipment(item)))
const ownedWeaponOptions = computed(() => draft.value.weapons.map((weapon) => ({
  value: weapon.id,
  label: weapon.name?.trim() || 'Unnamed Weapon',
})))
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
const weaponSkillOptions = [
  { value: 'gun-combat', label: 'Gun Combat' },
  { value: 'melee', label: 'Melee' },
  { value: 'heavy-weapons', label: 'Heavy Weapons' },
  { value: 'gunner', label: 'Gunner' },
  { value: 'explosives', label: 'Explosives' },
] as const
type WeaponCombatOption = {
  value: string
  skill: string
  speciality: string
  label: string
}
type SkillDefinition = {
  id: string
  name: string
  specialities?: string[]
  defaultCharacteristics?: TravellerCharacteristicId[]
  specialityCharacteristics?: Partial<Record<string, TravellerCharacteristicId[]>>
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
  matchesFilter: boolean
  view: {
    baseChecked: boolean
    baseLevel: number | null
    hasTrained: boolean
    selectedSpecialities: Array<{ specialityId: string, specialityName: string, isCustom?: boolean }>
    availableSpecialities: string[]
  }
}
const sheetSkillDefinitions = computed(() => {
  const definitions = skillsData.skills as SkillDefinition[]
  const nonPsionic = definitions
    .filter((skill) => !skill.psionic)
    .slice()
    .sort((left, right) => skillNameCollator.compare(left.name, right.name))
  if (!sheetHasPsionics.value) return nonPsionic
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

const loadSheetFromRoute = () => {
  const id = activeSheetRouteId.value
  const draftId = activeSheetDraftId.value
  const existing = id ? travellers.getProfile(id) : null
  const cachedDraft = loadBuilderDraft<TravellerProfile>(
    manualTravellerDraftCacheKey(id || draftId),
    MANUAL_TRAVELLER_DRAFT_CACHE_VERSION,
  )

  if (cachedDraft) {
    draft.value = normalizeTravellerProfile(cachedDraft, cachedDraft.source)
    return
  }

  if (existing) {
    draft.value = normalizeTravellerProfile(existing, existing.source)
    draft.value.metadata.lastOpenedAt = new Date().toISOString()
    void travellers.setActiveProfile(id)
    return
  }

  draft.value = createBlankTravellerProfile('manual')
}

watch(
  () => draft.value.weapons,
  (weapons) => {
    weapons.forEach((weapon) => normalizeWeaponSpeciality(weapon))
  },
  { deep: true, immediate: true },
)

const formatSheetSpeciality = (definition: SkillDefinition | undefined, value: string) => {
  const baseId = definition?.id ?? ''
  return baseId ? formatTravellerSkillSpeciality(baseId, value) : titleCaseTravellerSkill(value)
}

const normalizeSheetSkill = (skill: TravellerSkill): NormalizedSheetSkill => {
  // Normalize stored sheet skills into a stable base/specialty shape so the UI,
  // roll logic, and edit controls can operate on one canonical representation.
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
  return [...selectedDefined, ...selectedCustom]
}
const availableSheetSpecialities = (definition: SkillDefinition) => (definition.specialities ?? [])
  .filter((speciality) => !specialitySkillChecked(definition, speciality))

const buildSheetSkillLabel = (definition: SkillDefinition, specialityName?: string) => specialityName
  ? `${definition.name} (${specialityName})`
  : definition.name

const ensureSheetSkill = (definition: SkillDefinition, level: number, specialityName?: string) => {
  const specialityId = specialityName ? slugifyTravellerSkill(specialityName) : undefined
  const existingIndex = findSheetSkillIndex(definition.id, specialityId)
  if (existingIndex >= 0) {
    const existing = draft.value.skills[existingIndex]
    draft.value.skills[existingIndex] = buildTravellerSkill(definition.id, level, specialityName, {
      sources: existing.sources ?? ['Manual Sheet'],
      notes: existing.notes ?? '',
    })
    return
  }

  draft.value.skills.push(buildTravellerSkill(definition.id, level, specialityName, {
    sources: ['Manual Sheet'],
    notes: '',
  }))
}

const removeSheetSkill = (baseId: string, specialityId?: string) => {
  const index = findSheetSkillIndex(baseId, specialityId)
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
  const existing = specialitySkillEntry(definition, speciality)
  if (existing) {
    removeSheetSkill(definition.id, specialitySlug(speciality))
    return
  }

  const nextLevel = sheetSkillMode(definition) === 'shared-zero' ? 1 : 0
  ensureSheetSkill(definition, nextLevel, specialityDisplayName(definition, speciality))
}

const changeSpecialitySkillLevel = (definition: SkillDefinition, speciality: string, delta: number) => {
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

const activeTraining = computed(() => draft.value.training.active)
const trainingHistory = computed(() => draft.value.training.history)
const trainingSkillOptions = computed(() => sheetSkillDefinitions.value
  .filter((definition) => definition.id !== 'jack-of-all-trades')
  .map((definition) => ({
    id: definition.id,
    name: definition.name,
    specialities: definition.specialities ?? [],
    specialityMode: definition.specialityMode,
  })))
const selectedTrainingDefinition = computed(() => sheetSkillDefinitionsById.value[selectedTrainingSkillId.value])
const resolvedTrainingSpeciality = computed(() => {
  if (selectedTrainingSpeciality.value === '__custom__') return customTrainingSpeciality.value.trim()
  return selectedTrainingSpeciality.value.trim()
})
const selectedTrainingCurrentLevel = computed(() => {
  const definition = selectedTrainingDefinition.value
  if (!definition) return null
  const speciality = resolvedTrainingSpeciality.value
  if (speciality) return specialitySkillEntry(definition, speciality)?.record.level ?? null
  return baseSkillDisplayLevel(definition)
})
const selectedTrainingTargetOptions = computed(() => {
  const current = selectedTrainingCurrentLevel.value
  const definition = selectedTrainingDefinition.value
  const specialityMinimum = definition && resolvedTrainingSpeciality.value && sheetSkillMode(definition) === 'shared-zero' ? 1 : 0
  const minimum = Math.max(specialityMinimum, current === null ? 0 : current + 1)
  return Array.from({ length: Math.max(0, 6 - minimum) }, (_, index) => minimum + index).filter((level) => level >= 0 && level <= 5)
})
const selectedTrainingRequiredStudyPeriods = computed(() => Math.max(1, selectedTrainingTargetLevel.value))
const positiveSkillLevelTotal = computed(() => draft.value.skills.reduce((total, skill) => total + Math.max(0, skill.level), 0))
const skillLevelCap = computed(() => 3 * ((draft.value.characteristics.int?.value ?? 0) + (draft.value.characteristics.edu?.value ?? 0)))
const selectedTrainingValidation = computed(() => {
  const definition = selectedTrainingDefinition.value
  if (!definition) return 'Select a skill to train.'
  if (definition.id === 'jack-of-all-trades') return 'Jack-of-all-Trades cannot be learned or improved through training.'

  const hasSpecialities = sheetSkillHasSpecialities(definition)
  const speciality = resolvedTrainingSpeciality.value
  if (hasSpecialities && selectedTrainingTargetLevel.value > 0 && !speciality) return 'Choose a speciality before training this skill above level 0.'
  if (selectedTrainingSpeciality.value === '__custom__' && !speciality) return 'Enter a custom speciality.'

  const current = selectedTrainingCurrentLevel.value
  if (!selectedTrainingTargetOptions.value.length) return 'This skill is already at the sheet training maximum.'
  if (current !== null && selectedTrainingTargetLevel.value <= current) return 'Target level must be higher than the current level.'
  if (selectedTrainingTargetLevel.value > 0 && positiveSkillLevelTotal.value >= skillLevelCap.value) return 'This Traveller is at the skill level cap; new training can only add level 0 skills.'
  return ''
})
const trainingCanStart = computed(() => !activeTraining.value && !selectedTrainingValidation.value)
const trainingCanRoll = computed(() => Boolean(activeTraining.value && activeTraining.value.completedWeeks >= 8))
const activeTrainingProgressLabel = computed(() => {
  const training = activeTraining.value
  if (!training) return ''
  const weeksNeeded = Math.max(0, 8 - training.completedWeeks)
  if (weeksNeeded > 0) return `${weeksNeeded} more completed week${weeksNeeded === 1 ? '' : 's'} needed for the next Study Period.`
  return `Ready for an Average ${training.characteristic.toUpperCase()} 8+ Study Period check.`
})

watch(
  selectedTrainingSkillId,
  () => {
    selectedTrainingSpeciality.value = ''
    customTrainingSpeciality.value = ''
    selectedTrainingCharacteristic.value = selectedTrainingSkillId.value === 'athletics' ? 'str' : 'edu'
    selectedTrainingTargetLevel.value = selectedTrainingTargetOptions.value[0] ?? 0
  },
)

watch(
  [selectedTrainingSpeciality, customTrainingSpeciality],
  () => {
    selectedTrainingTargetLevel.value = selectedTrainingTargetOptions.value[0] ?? 0
  },
)

watch(
  selectedTrainingTargetOptions,
  (options) => {
    if (!options.includes(selectedTrainingTargetLevel.value)) selectedTrainingTargetLevel.value = options[0] ?? 0
  },
  { immediate: true },
)

const makeTrainingId = () => `training-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const startSkillTraining = () => {
  const definition = selectedTrainingDefinition.value
  if (!definition || selectedTrainingValidation.value) return
  const speciality = resolvedTrainingSpeciality.value
  const formattedSpeciality = speciality ? formatSheetSpeciality(definition, speciality) : ''
  trainingRollSummary.value = ''
  draft.value.training.active = {
    id: makeTrainingId(),
    skillId: definition.id,
    skillName: definition.name,
    speciality: formattedSpeciality,
    targetLevel: selectedTrainingTargetLevel.value,
    characteristic: selectedTrainingCharacteristic.value,
    completedWeeks: 0,
    successfulStudyPeriods: 0,
    failedStudyPeriods: 0,
    requiredStudyPeriods: selectedTrainingRequiredStudyPeriods.value,
    startedAt: new Date().toISOString(),
    notes: '',
  }
}

const cancelSkillTraining = () => {
  const training = activeTraining.value
  if (!training) return
  draft.value.training.history.unshift({
    id: makeTrainingId(),
    skillId: training.skillId,
    skillName: training.skillName,
    speciality: training.speciality,
    targetLevel: training.targetLevel,
    outcome: 'cancelled',
    successfulStudyPeriods: training.successfulStudyPeriods,
    failedStudyPeriods: training.failedStudyPeriods,
    completedWeeks: training.completedWeeks,
    completedAt: new Date().toISOString(),
    notes: 'Training cancelled before completion.',
  })
  draft.value.training.active = null
  trainingRollSummary.value = ''
}

const addTrainingWeeks = (amount: number) => {
  const training = activeTraining.value
  if (!training) return
  training.completedWeeks = Math.max(0, training.completedWeeks + amount)
}

const applyCompletedTraining = (training: TravellerSkillTrainingActive) => {
  const definition = sheetSkillDefinitionsById.value[training.skillId]
  if (!definition) return
  const speciality = training.speciality?.trim() || undefined
  const existingIndex = findSheetSkillIndex(definition.id, speciality ? slugifyTravellerSkill(speciality) : undefined)
  const existing = existingIndex >= 0 ? draft.value.skills[existingIndex] : null
  const sources = Array.from(new Set([...(existing?.sources ?? []), 'Training']))
  const updated = buildTravellerSkill(definition.id, training.targetLevel, speciality, {
    sources,
    notes: existing?.notes ?? '',
  })
  if (existingIndex >= 0) draft.value.skills[existingIndex] = updated
  else draft.value.skills.push(updated)
}

const rollSkillTrainingStudyPeriod = () => {
  const training = activeTraining.value
  if (!training || training.completedWeeks < 8) return
  const dice = [randomDie(), randomDie()]
  const dm = draft.value.characteristics[training.characteristic]?.dm ?? diceModifier(draft.value.characteristics[training.characteristic]?.value ?? 0)
  const total = dice[0] + dice[1] + dm
  const roll: TravellerRollRecord = {
    label: `${training.skillName} Study Period`,
    dice,
    dm,
    total,
    target: 8,
    effect: total - 8,
    success: total >= 8,
    source: 'rolled',
    notes: `Training ${training.skillName}${training.speciality ? ` (${training.speciality})` : ''} ${training.targetLevel}`,
  }
  training.completedWeeks = Math.max(0, training.completedWeeks - 8)
  training.lastRoll = roll

  if (roll.success) {
    training.successfulStudyPeriods += 1
    trainingRollSummary.value = `${dice.join(' + ')} ${formatDm(dm)} = ${total}. Study Period successful.`
  } else {
    training.failedStudyPeriods += 1
    trainingRollSummary.value = `${dice.join(' + ')} ${formatDm(dm)} = ${total}. No useful progress gained.`
  }

  if (training.successfulStudyPeriods >= training.requiredStudyPeriods) {
    applyCompletedTraining(training)
    draft.value.training.history.unshift({
      id: makeTrainingId(),
      skillId: training.skillId,
      skillName: training.skillName,
      speciality: training.speciality,
      targetLevel: training.targetLevel,
      outcome: 'completed',
      successfulStudyPeriods: training.successfulStudyPeriods,
      failedStudyPeriods: training.failedStudyPeriods,
      completedWeeks: training.completedWeeks,
      completedAt: new Date().toISOString(),
      notes: trainingRollSummary.value,
    })
    trainingRollSummary.value = `${trainingRollSummary.value} Training complete.`
    draft.value.training.active = null
  }
}

const addCustomSpecialitySkill = (definition: SkillDefinition) => {
  const raw = customSpecialityDrafts[definition.id]?.trim()
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
  const initialLevel = sheetSkillMode(definition) === 'shared-zero' ? 1 : 0
  ensureSheetSkill(definition, initialLevel, specialityDisplayName(definition, speciality))
  activeSkillPickerId.value = null
}

const toggleSkillPicker = (definition: SkillDefinition) => {
  activeSkillPickerId.value = activeSkillPickerId.value === definition.id ? null : definition.id
}

const weaponSkillDefinition = (skillId?: string) => skillId
  ? sheetSkillDefinitionsById.value[skillId] ?? null
  : null

const weaponSkillSpecialityOptions = (skillId?: string) => {
  const definition = weaponSkillDefinition(skillId)
  return definition?.specialities ?? []
}

const attackSpecialityOptions = (skillId?: string) => weaponSkillSpecialityOptions(skillId)

const weaponCombatOptions = computed<WeaponCombatOption[]>(() => weaponSkillOptions.flatMap((option) => {
  const root: WeaponCombatOption = {
    value: option.value,
    skill: option.value,
    speciality: '',
    label: option.label,
  }
  const specialities = weaponSkillSpecialityOptions(option.value).map((speciality) => ({
    value: buildTravellerSkill(option.value, 0, speciality).id,
    skill: option.value,
    speciality,
    label: `${option.label} (${speciality})`,
  }))
  return [root, ...specialities]
}))

const weaponCombatSelectionValue = (weapon: TravellerProfile['weapons'][number]) => {
  if (!weapon.skill) return 'gun-combat'
  return weapon.speciality
    ? buildTravellerSkill(weapon.skill, 0, weapon.speciality).id
    : weapon.skill
}

const updateWeaponCombatProfile = (weapon: TravellerProfile['weapons'][number], nextValue: string) => {
  const option = weaponCombatOptions.value.find((entry) => entry.value === nextValue)
  if (!option) {
    weapon.skill = 'gun-combat'
    weapon.speciality = ''
    return
  }
  weapon.skill = option.skill
  weapon.speciality = option.speciality
}

const normalizeWeaponSpeciality = (weapon: TravellerProfile['weapons'][number]) => {
  if (!weapon.skill) {
    weapon.skill = 'gun-combat'
  }
  const validSpecialities = weaponSkillSpecialityOptions(weapon.skill)
  if (!validSpecialities.length) {
    weapon.speciality = ''
    return
  }
  if (!weapon.speciality) return
  if (validSpecialities.includes(weapon.speciality)) return
  weapon.speciality = ''
}

const attackCombatSelectionValue = (attack: TravellerProfile['attacks'][number]) => {
  if (!attack.skill) return 'gun-combat'
  return attack.speciality
    ? buildTravellerSkill(attack.skill, 0, attack.speciality).id
    : attack.skill
}

const updateAttackCombatProfile = (attack: TravellerProfile['attacks'][number], nextValue: string) => {
  const option = weaponCombatOptions.value.find((entry) => entry.value === nextValue)
  if (!option) {
    attack.skill = 'gun-combat'
    attack.speciality = ''
    return
  }
  attack.skill = option.skill
  attack.speciality = option.speciality
}

const syncAttackFromWeapon = (attack: TravellerProfile['attacks'][number]) => {
  const weapon = draft.value.weapons.find((entry) => entry.id === attack.weaponId)
  if (!weapon) return
  attack.label = weapon.name || attack.label || 'Attack'
  attack.damage = weapon.damage || ''
  attack.skill = weapon.skill || attack.skill || 'gun-combat'
  attack.speciality = weapon.speciality || ''
}

const setAttackWeapon = (attack: TravellerProfile['attacks'][number], weaponId: string) => {
  attack.weaponId = weaponId
  syncAttackFromWeapon(attack)
}

const setAttackSkillRoot = (attack: TravellerProfile['attacks'][number], skillId: string) => {
  attack.skill = skillId
  const validSpecialities = attackSpecialityOptions(skillId)
  if (!validSpecialities.includes(attack.speciality || '')) attack.speciality = ''
}

const attackWeaponTraits = (attack: TravellerProfile['attacks'][number]) => {
  const weapon = draft.value.weapons.find((entry) => entry.id === attack.weaponId)
  return weapon?.traits ?? ''
}

const addAttack = () => {
  const firstWeapon = draft.value.weapons[0]
  const attack: TravellerProfile['attacks'][number] = {
    id: `manual-attack-${Date.now()}`,
    weaponId: firstWeapon?.id ?? '',
    label: firstWeapon?.name || '',
    skill: firstWeapon?.skill || 'gun-combat',
    speciality: firstWeapon?.speciality || '',
    damage: firstWeapon?.damage || '',
    notes: '',
  }
  draft.value.attacks.push(attack)
}

const removeAttack = (index: number) => {
  draft.value.attacks.splice(index, 1)
}

const sheetCharacteristicDm = (id: TravellerCharacteristicId) => Number(draft.value.characteristics[id]?.dm ?? 0)

const sheetDefaultSkillCharacteristics = (label: string): TravellerCharacteristicId[] => {
  const skill = parseTravellerSkill(label)
  const definition = sheetSkillDefinitionsById.value[skill.baseId]
    ?? sheetSkillDefinitions.value.find((item) => item.name.toLowerCase() === skill.baseName.toLowerCase())
  const specialityCharacteristic = skill.specialityId
    ? definition?.specialityCharacteristics?.[skill.specialityId]
    : undefined
  if (specialityCharacteristic?.length) return specialityCharacteristic
  if (definition?.defaultCharacteristics?.length) return definition.defaultCharacteristics

  const defaults: Record<string, TravellerCharacteristicId[]> = {
    athletics: ['str', 'dex', 'end'],
    carouse: ['soc'],
    deception: ['int'],
    diplomat: ['soc'],
    'gun-combat': ['dex'],
    gambler: ['int'],
    investigate: ['int'],
    leadership: ['soc'],
    melee: ['str', 'dex'],
    persuade: ['soc'],
    recon: ['int'],
    stealth: ['dex'],
    streetwise: ['soc'],
    survival: ['end'],
    tactics: ['int'],
  }
  return defaults[skill.baseId] ?? []
}

const sheetSkillCharacteristicLabel = (label: string) => sheetDefaultSkillCharacteristics(label)
  .map((id) => id.toUpperCase())
  .join(' or ')

const sheetSkillLevelFromLabel = (label: string) => {
  const parsed = parseTravellerSkill(label)
  if (parsed.specialityId) return findSheetSkillRecord(parsed.baseId, parsed.specialityId)?.record.level ?? -3
  return findSheetSkillRecord(parsed.baseId)?.record.level ?? -3
}

const sheetSkillCheckModifier = (label: string, characteristic?: string, explicitLevel?: number | null) => {
  // Sheet skill checks follow the same rules model as character creation:
  // skill level plus the best applicable characteristic DM.
  const explicitCharacteristic = characteristic as TravellerCharacteristicId | undefined
  const characteristicIds = explicitCharacteristic ? [explicitCharacteristic] : sheetDefaultSkillCharacteristics(label)
  const characteristicDm = characteristicIds.length
    ? Math.max(...characteristicIds.map((id) => sheetCharacteristicDm(id)))
    : 0
  const skillLevel = explicitLevel ?? sheetSkillLevelFromLabel(label)
  return skillLevel + characteristicDm
}

const sheetSkillRollCharacteristicOptions = computed(() => visibleCharacteristicIds.value.map((id) => ({
  id,
  label: id.toUpperCase(),
  dm: sheetCharacteristicDm(id),
})))

const preferredSheetSkillCharacteristic = (label: string): TravellerCharacteristicId => {
  const suggested = sheetDefaultSkillCharacteristics(label)
  if (suggested.length) {
    return suggested
      .slice()
      .sort((left, right) => sheetCharacteristicDm(right) - sheetCharacteristicDm(left))[0]
  }
  return 'edu'
}

const selectedSkillRollCharacteristicOption = computed(() => {
  return sheetSkillRollCharacteristicOptions.value.find((option) => option.id === skillRollCharacteristicSelection.value)
    ?? sheetSkillRollCharacteristicOptions.value[0]
})

const sheetSkillRollLabel = (definition: SkillDefinition, specialityName?: string) => {
  const built = buildTravellerSkill(definition.id, 0, specialityName)
  const characteristic = sheetSkillCharacteristicLabel(built.id)
  return characteristic ? `Skill Check · ${characteristic}` : 'Skill Check'
}

const openSheetSkillDefinitionRoll = (definition: SkillDefinition, specialityName?: string, explicitLevel?: number | null) => {
  if (selectSkillRollCharacteristic.value) {
    const skillId = buildTravellerSkill(definition.id, 0, specialityName).id
    pendingSkillRoll.value = { definition, specialityName, explicitLevel }
    skillRollCharacteristicSelection.value = preferredSheetSkillCharacteristic(skillId)
    skillRollCharacteristicModalOpen.value = true
    return
  }

  rollSheetSkillDefinition(definition, specialityName, explicitLevel)
}

const rollSheetSkillDefinition = (definition: SkillDefinition, specialityName?: string, explicitLevel?: number | null, characteristic?: TravellerCharacteristicId) => {
  const label = buildSheetSkillLabel(definition, specialityName)
  const skillId = buildTravellerSkill(definition.id, 0, specialityName).id
  const subtitle = characteristic
    ? `Skill Check · ${characteristic.toUpperCase()} ${formatDm(sheetCharacteristicDm(characteristic))}`
    : sheetSkillRollLabel(definition, specialityName)
  startRollModal(
    label,
    subtitle,
    sheetSkillCheckModifier(skillId, characteristic, explicitLevel),
    () => rollSheetSkillDefinition(definition, specialityName, explicitLevel, characteristic),
  )
}

const closeSkillRollCharacteristicModal = () => {
  skillRollCharacteristicModalOpen.value = false
  pendingSkillRoll.value = null
}

const confirmSkillRollCharacteristic = () => {
  const pending = pendingSkillRoll.value
  const selected = selectedSkillRollCharacteristicOption.value?.id
  if (!pending || !selected) return
  closeSkillRollCharacteristicModal()
  rollSheetSkillDefinition(pending.definition, pending.specialityName, pending.explicitLevel, selected)
}

const sheetSkillViewById = computed(() => {
  // Build a stable render model for each skill so the sheet toggle does not
  // repeatedly recompute checkbox, level, and specialty state during template evaluation.
  return Object.fromEntries(sheetSkillDefinitions.value.map((definition) => {
    const selectedSpecialities = selectedSheetSpecialities(definition)
    const view = {
      baseChecked: baseSkillChecked(definition),
      baseLevel: baseSkillDisplayLevel(definition),
      hasTrained: hasTrainedSheetSkill(definition),
      selectedSpecialities,
      availableSpecialities: availableSheetSpecialities(definition),
    }
    return [definition.id, view]
  }))
})

const skillGroups = computed<SheetSkillGroup[]>(() => sheetSkillDefinitions.value.map((definition) => ({
  definition,
  estimatedRows: 1 + sheetSkillViewById.value[definition.id].selectedSpecialities.length,
  matchesFilter: !showOnlyTrainedSkills.value || sheetSkillViewById.value[definition.id]?.hasTrained,
  view: sheetSkillViewById.value[definition.id],
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
const rollModalDiceFaces = ref<Array<number | string>>([1, 1])
const rollModalTotal = ref(0)
const rollModalDetailLines = ref<string[]>([])
const rollModalTimer = ref<number | null>(null)
const rollModalFinishTimer = ref<number | null>(null)
const rollModalRerollAction = ref<null | (() => void)>(null)
const skillRollSettingsOpen = ref(false)
const skillRollCharacteristicModalOpen = ref(false)
const skillRollCharacteristicSelection = ref<TravellerCharacteristicId>('edu')
const pendingSkillRoll = ref<null | {
  definition: SkillDefinition
  specialityName?: string
  explicitLevel?: number | null
}>(null)
const rollModalRawTotal = computed(() => rollModalDice.value[0] + rollModalDice.value[1])
const rollModalJackpot = computed(() => !rollModalRolling.value && rollModalDiceFaces.value.length === 2 && rollModalRawTotal.value === 12)
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
const rollModalTickMs = 90
const rollModalDurationMs = 1100
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
  rollModalDetailLines.value = []
}

const rerollRollModal = () => {
  const action = rollModalRerollAction.value
  if (!action) return
  action()
}

const startRollModal = (title: string, subtitle: string, modifier: number, rerollAction?: () => void) => {
  // Generic 2D check roller for characteristics, skills, and attack checks.
  clearRollModalTimers()
  rollModalTitle.value = title
  rollModalSubtitle.value = subtitle
  rollModalModifier.value = modifier
  rollModalRerollAction.value = rerollAction ?? null
  rollModalDetailLines.value = []
  rollModalOpen.value = true
  rollModalRolling.value = true

  const updateRoll = () => {
    const nextDice: [number, number] = [randomDie(), randomDie()]
    rollModalDice.value = nextDice
    rollModalDiceFaces.value = [nextDice[0], nextDice[1]]
    rollModalTotal.value = nextDice[0] + nextDice[1] + rollModalModifier.value
  }

  updateRoll()
  if (!import.meta.client) {
    rollModalRolling.value = false
    return
  }

  rollModalTimer.value = window.setInterval(updateRoll, rollModalTickMs)
  rollModalFinishTimer.value = window.setTimeout(() => {
    clearRollModalTimers()
    updateRoll()
    rollModalRolling.value = false
  }, rollModalDurationMs)
}

const startResolvedRollModal = (title: string, subtitle: string, finalFaces: Array<number | string>, total: number, rerollAction?: () => void, detailLines: string[] = []) => {
  // Resolved rollers reuse the shared animation but land on a precomputed result,
  // which is required for parsed damage expressions and other non-2D rolls.
  clearRollModalTimers()
  rollModalTitle.value = title
  rollModalSubtitle.value = subtitle
  rollModalModifier.value = 0
  rollModalRerollAction.value = rerollAction ?? null
  rollModalDetailLines.value = []
  rollModalOpen.value = true
  rollModalRolling.value = true

  const faceCount = Math.max(1, finalFaces.length)
  const updateRoll = () => {
    const nextFaces = Array.from({ length: faceCount }, () => randomDie())
    rollModalDiceFaces.value = nextFaces
    rollModalDice.value = [Number(nextFaces[0]) || 0, Number(nextFaces[1]) || 0]
    rollModalTotal.value = nextFaces.reduce((sum, face) => sum + (Number(face) || 0), 0)
  }

  updateRoll()
  if (!import.meta.client) {
    rollModalDiceFaces.value = finalFaces
    rollModalDice.value = [Number(finalFaces[0]) || 0, Number(finalFaces[1]) || 0]
    rollModalTotal.value = total
    rollModalDetailLines.value = detailLines
    rollModalRolling.value = false
    return
  }

  rollModalTimer.value = window.setInterval(updateRoll, rollModalTickMs)
  rollModalFinishTimer.value = window.setTimeout(() => {
    clearRollModalTimers()
    rollModalDiceFaces.value = finalFaces
    rollModalDice.value = [Number(finalFaces[0]) || 0, Number(finalFaces[1]) || 0]
    rollModalTotal.value = total
    rollModalDetailLines.value = detailLines
    rollModalRolling.value = false
  }, rollModalDurationMs)
}

const evaluateDamageExpression = (expression: string) => {
  // Damage expressions accept Traveller-style dice notation plus simple math so
  // ground/vehicle/ship scaling can be represented directly in the sheet.
  const normalized = sanitizeWeaponDamageInput(expression)
  if (!normalized) return null

  const diceFaces: number[] = []
  const replaced = normalized.replace(/(\d*)D/g, (_, rawCount: string) => {
    const count = Math.max(1, Number(rawCount || '1'))
    let subtotal = 0
    for (let index = 0; index < count; index += 1) {
      const die = randomDie()
      diceFaces.push(die)
      subtotal += die
    }
    return String(subtotal)
  })

  if (!/^[0-9+\-/*().\s]+$/.test(replaced)) return null

  try {
    const total = Function(`"use strict"; return (${replaced})`)()
    if (typeof total !== 'number' || !Number.isFinite(total)) return null
    return {
      normalized,
      substituted: replaced,
      total: Math.trunc(total),
      diceFaces,
    }
  }
  catch {
    return null
  }
}

const openWeaponDamageRoll = (weapon: TravellerProfile['weapons'][number]) => {
  const evaluation = evaluateDamageExpression(weapon.damage || '')
  if (!evaluation) return

  const detailLines: string[] = []
  const additiveOnly = /^[\d\s+\-]+$/.test(evaluation.substituted)
  if (evaluation.diceFaces.length > 1) {
    detailLines.push(`Dice: ${evaluation.diceFaces.join(' + ')}`)
  }
  if (evaluation.substituted !== evaluation.normalized) {
    if (additiveOnly) detailLines.push(`Roll ${evaluation.substituted.replace(/\s+/g, '')}`)
    else detailLines.push(`${evaluation.normalized} -> ${evaluation.substituted.replace(/\s+/g, '')}`)
  }

  startResolvedRollModal(
    weapon.name || 'Weapon Damage',
    `Damage Roll · ${evaluation.normalized}`,
    evaluation.diceFaces.length ? evaluation.diceFaces : [evaluation.total],
    evaluation.total,
    () => openWeaponDamageRoll(weapon),
    detailLines,
  )
}

const openAttackSkillRoll = (attack: TravellerProfile['attacks'][number]) => {
  const definition = weaponSkillDefinition(attack.skill)
  const baseLabel = definition?.name ?? 'Attack'
  const subtitle = attack.speciality
    ? `Attack Check · ${baseLabel} (${attack.speciality})`
    : `Attack Check · ${baseLabel}`
  const modifier = sheetSkillCheckModifier(
    attack.speciality
      ? buildTravellerSkill(attack.skill || 'gun-combat', 0, attack.speciality).name
      : buildTravellerSkill(attack.skill || 'gun-combat', 0).name,
    null,
  )
  startRollModal(
    attack.label || baseLabel,
    subtitle,
    modifier,
    () => openAttackSkillRoll(attack),
  )
}

const openAttackDamageRoll = (attack: TravellerProfile['attacks'][number]) => {
  const evaluation = evaluateDamageExpression(attack.damage || '')
  if (!evaluation) return

  const detailLines: string[] = []
  const additiveOnly = /^[\d\s+\-]+$/.test(evaluation.substituted)
  if (evaluation.diceFaces.length > 1) {
    detailLines.push(`Dice: ${evaluation.diceFaces.join(' + ')}`)
  }
  if (evaluation.substituted !== evaluation.normalized) {
    if (additiveOnly) detailLines.push(`Roll ${evaluation.substituted.replace(/\s+/g, '')}`)
    else detailLines.push(`${evaluation.normalized} -> ${evaluation.substituted.replace(/\s+/g, '')}`)
  }

  startResolvedRollModal(
    attack.label || 'Attack Damage',
    `Damage Roll · ${evaluation.normalized}`,
    evaluation.diceFaces.length ? evaluation.diceFaces : [evaluation.total],
    evaluation.total,
    () => openAttackDamageRoll(attack),
    detailLines,
  )
}

const openCharacteristicRoll = (id: TravellerCharacteristicId) => {
  const characteristic = draft.value.characteristics[id]
  startRollModal(
    characteristic.name || characteristic.abbreviation,
    'Characteristic Check',
    Number(characteristic.dm) || 0,
    () => openCharacteristicRoll(id),
  )
}

const sanitizeWeaponDamageInput = (value: string) => value
  .toUpperCase()
  .replace(/[^0-9D+\-/*().\s]/g, '')
  .replace(/\s+/g, ' ')
  .trim()

const handleWeaponDamageInput = (weapon: TravellerProfile['weapons'][number], event: Event) => {
  const target = event.target as HTMLInputElement
  const sanitized = sanitizeWeaponDamageInput(target.value)
  weapon.damage = sanitized
  if (target.value !== sanitized) target.value = sanitized
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

const addVoucher = (type: keyof typeof voucherTypeThemes | Event | string = 'generic') => {
  // Manual voucher creation can be triggered from template event handlers.
  // Guard the input so an event object or unexpected string cannot break label generation.
  const normalizedType = typeof type === 'string' && type in voucherTypeLabelMap
    ? type as keyof typeof voucherTypeThemes
    : 'generic'
  const label = voucherTypeLabelMap[normalizedType] ?? voucherTypeLabelMap.generic
  draft.value.equipment.push({
    id: `manual-voucher-${Date.now()}`,
    name: label,
    techLevel: '10',
    kg: '',
    traits: normalizedType === 'generic' ? '' : label.replace(/\s+Voucher$/i, ''),
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
    skill: 'gun-combat',
    speciality: '',
    techLevel: '',
    range: '',
    damage: '',
    kg: '',
    magazine: '',
    traits: '',
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
  if (sheetAutosaveTimer) window.clearTimeout(sheetAutosaveTimer)
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
  draft,
  (profile) => {
    if (!import.meta.client || !manualSheetDraftRestored.value || manualSheetDraftCachePaused.value) return
    if (!activeSheetRouteId.value || isUnsavedManualDraftRoute.value) return
    if (sheetAutosaveTimer) window.clearTimeout(sheetAutosaveTimer)
    sheetAutosaveTimer = window.setTimeout(async () => {
      sheetAutosaveTimer = null
      await travellers.saveProfile(profile)
      saveMessage.value = `Autosaved ${profile.identity.name || 'Traveller'}`
    }, 900)
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
      <template v-if="isMobileSheetViewport">
        <div class="sheet-page">
          <div class="sheet-chrome sheet-chrome--with-actions">
            <span class="sheet-chrome__title">{{ activeMobileSheetSectionLabel }}</span>
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
                      <span class="sheet-personal-split__spacer" aria-hidden="true"></span>
                      <select v-model="draft.identity.species" class="sheet-line-input">
                        <option disabled value="">Species</option>
                        <option v-for="species in speciesOptions" :key="species" :value="species">
                          {{ species }}
                        </option>
                      </select>
                    </label>
                  </div>
                  <label class="sheet-line-field sheet-line-field--personal">
                    <span>World:</span>
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

              <section class="sheet-characteristics-panel sheet-characteristics-panel--mobile">
                <div
                  v-for="id in visibleCharacteristicIds"
                  :key="`profile-${id}`"
                  class="sheet-characteristic"
                  :class="{ 'sheet-characteristic--psi': id === 'psi' }"
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

              <section class="sheet-panel">
                <header class="sheet-panel-title sheet-panel-title--compact sheet-panel-title--actionable">
                  <span>Attacks</span>
                  <button aria-label="Add attack" class="sheet-panel-action" title="Add attack" type="button" @click="addAttack">
                    <AppIcon name="plus" />
                  </button>
                </header>
                <div class="sheet-table">
                  <div class="sheet-table-body">
                    <div v-for="(attack, index) in draft.attacks" :key="attack.id" class="sheet-table-row sheet-table-row--attacks">
                      <div class="sheet-attack-grid">
                        <div class="sheet-entry-actions sheet-entry-actions--single">
                          <button aria-label="Remove attack" class="sheet-entry-action sheet-entry-action--danger" title="Remove attack" type="button" @click="removeAttack(index)">
                            <AppIcon name="close" />
                          </button>
                        </div>
                        <div class="sheet-attack-row sheet-attack-row--top">
                          <label class="sheet-field-with-label">
                            <span>Weapon</span>
                            <select :value="attack.weaponId" class="sheet-cell-input" @change="setAttackWeapon(attack, ($event.target as HTMLSelectElement).value)">
                              <option value="">Select weapon</option>
                              <option v-for="option in ownedWeaponOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                            </select>
                          </label>
                          <label class="sheet-field-with-label"><span>Traits</span><input :value="attackWeaponTraits(attack)" class="sheet-cell-input" placeholder="Traits" readonly></label>
                        </div>
                        <div class="sheet-attack-row sheet-attack-row--bottom">
                          <label class="sheet-field-with-label"><span>Damage</span><input :value="attack.damage" class="sheet-cell-input" placeholder="Damage" @input="attack.damage = sanitizeWeaponDamageInput(($event.target as HTMLInputElement).value)"></label>
                          <label class="sheet-field-with-label">
                            <span>Attack</span>
                            <select :value="attack.skill || 'gun-combat'" class="sheet-cell-input" @change="setAttackSkillRoot(attack, ($event.target as HTMLSelectElement).value)">
                              <option v-for="option in weaponSkillOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                            </select>
                          </label>
                          <label class="sheet-field-with-label">
                            <span>Specialty</span>
                            <select :value="attack.speciality || ''" class="sheet-cell-input" @change="attack.speciality = ($event.target as HTMLSelectElement).value">
                              <option value="">&#8212;</option>
                              <option v-for="speciality in attackSpecialityOptions(attack.skill)" :key="`${attack.id}-${speciality}`" :value="speciality">{{ speciality }}</option>
                            </select>
                          </label>
                          <button class="sheet-attack-roll" type="button" @click="openAttackSkillRoll(attack)">Attack</button>
                          <button class="sheet-attack-roll sheet-attack-roll--damage" type="button" @click="openAttackDamageRoll(attack)">Damage</button>
                        </div>
                      </div>
                    </div>
                    <p v-if="!draft.attacks.length" class="sheet-panel-empty">Add attacks from owned weapons here.</p>
                  </div>
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
                    <div v-for="(wound, index) in draft.wounds" :key="`mobile-wound-${wound.id}`" class="sheet-table-row sheet-table-row--wounds">
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

            <section v-else-if="activeMobileSheetSection === 'skills'" class="sheet-panel sheet-panel--skills">
              <header class="sheet-panel-title sheet-panel-title--side sheet-panel-title--actionable">
                <span>Skills</span>
                <div class="sheet-skill-header-actions">
                  <button
                    class="sheet-skill-visibility-toggle"
                    :aria-label="showOnlyTrainedSkills ? 'Show all skills' : 'Show trained skills only'"
                    :title="showOnlyTrainedSkills ? 'Show all skills' : 'Show trained skills only'"
                    type="button"
                    @click="showOnlyTrainedSkills = !showOnlyTrainedSkills"
                  >
                    <svg v-if="!showOnlyTrainedSkills" viewBox="0 0 24 24" class="sheet-skill-visibility-icon" aria-hidden="true">
                      <path fill="currentColor" d="M12 5c5.6 0 9.57 4.13 10.82 6.13a1.5 1.5 0 0 1 0 1.74C21.57 14.87 17.6 19 12 19S2.43 14.87 1.18 12.87a1.5 1.5 0 0 1 0-1.74C2.43 9.13 6.4 5 12 5Zm0 2c-4.62 0-8.02 3.28-9.2 5 1.18 1.72 4.58 5 9.2 5s8.02-3.28 9.2-5C20.02 10.28 16.62 7 12 7Zm0 2.25A2.75 2.75 0 1 1 9.25 12 2.75 2.75 0 0 1 12 9.25Zm0 2A.75.75 0 1 0 12.75 12 .75.75 0 0 0 12 11.25Z" />
                    </svg>
                    <svg v-else viewBox="0 0 24 24" class="sheet-skill-visibility-icon" aria-hidden="true">
                      <path fill="currentColor" d="M3.28 2.22 21.78 20.72l-1.06 1.06-3.07-3.06A12.3 12.3 0 0 1 12 20C6.4 20 2.43 15.87 1.18 13.87a1.5 1.5 0 0 1 0-1.74 18.2 18.2 0 0 1 5.07-5.19L2.22 3.28Zm8.01 8.01 2.48 2.48a1.75 1.75 0 0 0-2.48-2.48Zm5.09 5.09-1.45-1.45A4.75 4.75 0 0 1 8.13 9.07L7.09 8.03C5.19 9.17 3.7 10.81 2.8 12c1.18 1.72 4.58 6 9.2 6a10.2 10.2 0 0 0 4.38-1.68Zm1.65-1.18-1.45-1.45A9.45 9.45 0 0 0 21.2 12c-.69-1-2.25-2.82-4.62-4.07l-1.07-1.06c3.32 1.25 5.8 3.85 7.31 6.26a1.5 1.5 0 0 1 0 1.74 18.34 18.34 0 0 1-4.79 4.89Z" />
                    </svg>
                  </button>
                  <button
                    class="sheet-skill-visibility-toggle sheet-skill-settings-button"
                    aria-label="Skill roll settings"
                    title="Skill roll settings"
                    type="button"
                    @click="skillRollSettingsOpen = true"
                  >
                    <span aria-hidden="true">!</span>
                  </button>
                </div>
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
                        <span class="sheet-skill-toggle__frame" aria-hidden="true"></span>
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
                            @click.stop.prevent="toggleSkillPicker(group.definition)"
                          >
                            <AppIcon name="plus" />
                          </button>
                        </template>
                        <template v-else>
                          <button class="sheet-skill-rank__button" type="button" @click.stop.prevent="changeBaseSkillLevel(group.definition, -1)">
                            <AppIcon class="sheet-skill-rank__icon sheet-skill-rank__icon--down" name="arrow" />
                          </button>
                          <span class="sheet-skill-rank__value">{{ baseSkillDisplayLevel(group.definition) ?? '0' }}</span>
                          <button class="sheet-skill-rank__button" type="button" @click.stop.prevent="changeBaseSkillLevel(group.definition, 1)">
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
                          <span class="sheet-skill-toggle__frame" aria-hidden="true"></span>
                        </label>
                        <button
                          class="sheet-skill-roll-button sheet-skill-roll-button--speciality"
                          type="button"
                          @click="openSheetSkillDefinitionRoll(group.definition, speciality.specialityName, specialitySkillDisplayLevel(group.definition, speciality.specialityId))"
                        >
                          <span class="sheet-skill-speciality-label">{{ speciality.specialityName }}</span>
                        </button>
                        <div class="sheet-skill-rank">
                          <button class="sheet-skill-rank__button" type="button" @click.stop.prevent="changeSpecialitySkillLevel(group.definition, speciality.specialityName, -1)">
                            <AppIcon class="sheet-skill-rank__icon sheet-skill-rank__icon--down" name="arrow" />
                          </button>
                          <span class="sheet-skill-rank__value">{{ specialitySkillDisplayLevel(group.definition, speciality.specialityId) ?? '0' }}</span>
                          <button class="sheet-skill-rank__button" type="button" @click.stop.prevent="changeSpecialitySkillLevel(group.definition, speciality.specialityName, 1)">
                            <AppIcon class="sheet-skill-rank__icon sheet-skill-rank__icon--up" name="arrow" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
                <SheetTrainingPanel
                  v-model:selected-skill-id="selectedTrainingSkillId"
                  v-model:selected-speciality="selectedTrainingSpeciality"
                  v-model:custom-speciality="customTrainingSpeciality"
                  v-model:target-level="selectedTrainingTargetLevel"
                  v-model:characteristic="selectedTrainingCharacteristic"
                  :active-training="activeTraining"
                  :history="trainingHistory"
                  :skill-options="trainingSkillOptions"
                  :current-level="selectedTrainingCurrentLevel"
                  :target-level-options="selectedTrainingTargetOptions"
                  :required-study-periods="selectedTrainingRequiredStudyPeriods"
                  :validation="selectedTrainingValidation"
                  :can-start="trainingCanStart"
                  :can-roll="trainingCanRoll"
                  :progress-label="activeTrainingProgressLabel"
                  :roll-summary="trainingRollSummary"
                  @start="startSkillTraining"
                  @cancel="cancelSkillTraining"
                  @add-week="addTrainingWeeks"
                  @roll="rollSkillTrainingStudyPeriod"
                />
              </div>
            </section>

            <template v-else-if="activeMobileSheetSection === 'loadout'">
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
                        <div class="sheet-entry-actions sheet-entry-actions--single">
                          <button aria-label="Remove armour" class="sheet-entry-action sheet-entry-action--danger" title="Remove armour" type="button" @click="removeArmour(index)">
                            <AppIcon name="close" />
                          </button>
                        </div>
                        <div class="sheet-armour-row sheet-armour-row--top">
                          <label class="sheet-field-with-label"><span>Name</span><input v-model="armour.name" class="sheet-cell-input" placeholder="Name"></label>
                          <label class="sheet-field-with-label"><span>Type</span><input v-model="armour.type" class="sheet-cell-input" placeholder="Type"></label>
                          <label class="sheet-field-with-label"><span>Rad</span><input v-model="armour.radiationProtection" class="sheet-cell-input" placeholder="Rad"></label>
                          <label class="sheet-field-with-label"><span>Prot</span><input v-model="armour.protection" class="sheet-cell-input" placeholder="Prot"></label>
                          <label class="sheet-field-with-label"><span>Kg</span><input v-model="armour.kg" class="sheet-cell-input" placeholder="Kg"></label>
                        </div>
                        <div class="sheet-armour-row sheet-armour-row--bottom">
                          <label class="sheet-field-with-label"><span>Options</span><input v-model="armour.options" class="sheet-cell-input" placeholder="Options"></label>
                          <label class="sheet-field-with-label"><span>Traits</span><input v-model="armour.traits" class="sheet-cell-input" placeholder="Traits"></label>
                        </div>
                      </div>
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
                        <div class="sheet-entry-actions sheet-entry-actions--single">
                          <button aria-label="Remove weapon" class="sheet-entry-action sheet-entry-action--danger" title="Remove weapon" type="button" @click="removeWeapon(index)">
                            <AppIcon name="close" />
                          </button>
                        </div>
                        <div class="sheet-weapon-row sheet-weapon-row--top">
                          <label class="sheet-field-with-label"><span>Name</span><input v-model="weapon.name" class="sheet-cell-input" placeholder="Name"></label>
                          <label class="sheet-field-with-label"><span>Traits</span><input v-model="weapon.traits" class="sheet-cell-input" placeholder="Traits"></label>
                        </div>
                        <div class="sheet-weapon-row sheet-weapon-row--bottom">
                          <label class="sheet-field-with-label"><span>TL</span><input v-model="weapon.techLevel" class="sheet-cell-input" placeholder="TL"></label>
                          <label class="sheet-field-with-label"><span>Range</span><input v-model="weapon.range" class="sheet-cell-input" placeholder="Range"></label>
                          <label class="sheet-field-with-label"><span>Damage</span><input :value="weapon.damage" class="sheet-cell-input" placeholder="Damage" @input="handleWeaponDamageInput(weapon, $event)"></label>
                          <label class="sheet-field-with-label"><span>Kg</span><input v-model="weapon.kg" class="sheet-cell-input" placeholder="Kg"></label>
                          <label class="sheet-field-with-label"><span>Mag</span><input v-model="weapon.magazine" class="sheet-cell-input" placeholder="Mag"></label>
                          <label class="sheet-field-with-label"><span>Skill</span><input :value="weapon.speciality ? `${weapon.skill || ''} (${weapon.speciality})` : (weapon.skill || '')" class="sheet-cell-input" placeholder="Combat skill" readonly></label>
                        </div>
                      </div>
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
                        <div class="sheet-entry-actions sheet-entry-actions--single">
                          <button aria-label="Remove equipment" class="sheet-entry-action sheet-entry-action--danger" title="Remove equipment" type="button" @click="removeEquipment(index)">
                            <AppIcon name="close" />
                          </button>
                        </div>
                        <div class="sheet-equipment-row sheet-equipment-row--top">
                          <label class="sheet-field-with-label"><span>Name</span><input v-model="item.name" class="sheet-cell-input" placeholder="Name"></label>
                          <label class="sheet-field-with-label"><span>Type / Traits</span><input v-model="item.traits" class="sheet-cell-input" placeholder="Type / traits"></label>
                          <label class="sheet-field-with-label"><span>TL</span><input v-model="item.techLevel" class="sheet-cell-input" placeholder="TL"></label>
                          <label class="sheet-field-with-label"><span>Kg</span><input v-model="item.kg" class="sheet-cell-input" placeholder="Kg"></label>
                        </div>
                        <div class="sheet-equipment-row sheet-equipment-row--bottom">
                          <label class="sheet-field-with-label"><span>Notes</span><input v-model="item.notes" class="sheet-cell-input" placeholder="Notes"></label>
                        </div>
                      </div>
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
                    <button class="sheet-add" type="button" @click="addVoucher()">Add Voucher</button>
                  </div>
                  <div v-if="voucherEquipmentEntries.length" class="sheet-voucher-grid">
                    <article
                      v-for="({ item, index }) in voucherEquipmentEntries"
                      :key="item.id"
                      class="sheet-voucher-card"
                      :class="voucherThemeClass(item)"
                    >
                      <div class="sheet-voucher-card__top">
                        <div class="sheet-voucher-card__brand" :title="item.techLevel ? `TL ${item.techLevel}` : 'Voucher mark'">
                          <GalacticCreditsIcon class="sheet-voucher-card__brand-icon" />
                        </div>
                        <div class="sheet-voucher-card__text">
                          <div class="sheet-voucher-card__heading">{{ voucherDisplayHeading(item) }}</div>
                          <div class="sheet-voucher-card__subheading">VOUCHER</div>
                        </div>
                        <button aria-label="Remove voucher" class="sheet-voucher-card__remove" title="Remove voucher" type="button" @click="removeEquipment(index)">
                          <AppIcon name="close" />
                        </button>
                      </div>
                      <div class="sheet-voucher-card__meta">
                        <div class="sheet-voucher-card__field-shell sheet-voucher-card__field-shell--select">
                          <select :value="voucherSelectedType(item)" class="sheet-voucher-card__field sheet-voucher-card__field--select" @change="setVoucherType(item, ($event.target as HTMLSelectElement).value)">
                            <option value="">Select type</option>
                            <option v-for="option in voucherTypeOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                          </select>
                        </div>
                        <div class="sheet-voucher-card__field-shell">
                          <input v-model="item.techLevel" class="sheet-voucher-card__field" min="0" placeholder="TL" type="number">
                        </div>
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

            <template v-else-if="activeMobileSheetSection === 'log'">
              <SheetLogPage :draft="draft" />
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

          </div>
        </div>
      </template>

      <template v-else>
        <div class="sheet-page">
          <SheetDesktopHeader
            :pages="sheetPages"
            :active-page="activeSheetPage"
            :delete-confirm-open="sheetDeleteConfirmOpen"
            @select-page="activeSheetPage = $event"
            @import-json="openImportPicker"
            @export-json="exportJson"
            @export-pdf="exportPdfFields"
            @duplicate="duplicateSheet"
            @request-delete="requestDeleteSheet"
            @cancel-delete="cancelDeleteSheet"
            @confirm-delete="confirmDeleteSheet"
            @save="saveSheet"
          />
          <input ref="importInput" accept="application/json" class="hidden" type="file" @change="importJson">
          <input ref="portraitInput" accept="image/*" class="hidden" type="file" @change="importPortrait">

          <SheetTravellerPage
            v-if="activeSheetPage === 'traveller'"
            :draft="draft"
            :characteristic-ids="visibleCharacteristicIds"
            :is-portrait-drag-active="isPortraitDragActive"
            :portrait-clear-confirm-open="portraitClearConfirmOpen"
            :show-only-trained-skills="showOnlyTrainedSkills"
            :skill-column-count="skillColumnCount"
            :skill-group-columns="skillGroupColumns"
            :species-options="speciesOptions"
            :active-training="activeTraining"
            :training-history="trainingHistory"
            :training-skill-options="trainingSkillOptions"
            :selected-training-skill-id="selectedTrainingSkillId"
            :selected-training-speciality="selectedTrainingSpeciality"
            :custom-training-speciality="customTrainingSpeciality"
            :selected-training-target-level="selectedTrainingTargetLevel"
            :selected-training-characteristic="selectedTrainingCharacteristic"
            :selected-training-current-level="selectedTrainingCurrentLevel"
            :selected-training-target-options="selectedTrainingTargetOptions"
            :selected-training-required-study-periods="selectedTrainingRequiredStudyPeriods"
            :selected-training-validation="selectedTrainingValidation"
            :training-can-start="trainingCanStart"
            :training-can-roll="trainingCanRoll"
            :active-training-progress-label="activeTrainingProgressLabel"
            :training-roll-summary="trainingRollSummary"
            :weapon-skill-options="weaponSkillOptions"
            :owned-weapon-options="ownedWeaponOptions"
            :active-skill-picker-id="activeSkillPickerId"
            :custom-speciality-drafts="customSpecialityDrafts"
            :custom-speciality-skill-ids="customSpecialitySkillIds"
            :set-portrait-drag-active="(value: boolean) => { isPortraitDragActive = value }"
            :open-portrait-picker="openPortraitPicker"
            :handle-portrait-drop="handlePortraitDrop"
            :request-clear-portrait="requestClearPortrait"
            :cancel-clear-portrait="cancelClearPortrait"
            :confirm-clear-portrait="confirmClearPortrait"
            :handle-characteristic-input="handleCharacteristicInput"
            :adjust-characteristic-value="adjustCharacteristicValue"
            :open-characteristic-roll="openCharacteristicRoll"
            :format-dm="formatDm"
            :add-attack="addAttack"
            :remove-attack="removeAttack"
            :set-attack-weapon="setAttackWeapon"
            :attack-weapon-traits="attackWeaponTraits"
            :sanitize-weapon-damage-input="sanitizeWeaponDamageInput"
            :set-attack-skill-root="setAttackSkillRoot"
            :attack-speciality-options="attackSpecialityOptions"
            :open-attack-skill-roll="openAttackSkillRoll"
            :open-attack-damage-roll="openAttackDamageRoll"
            :add-wound="addWound"
            :remove-wound="removeWound"
            :sheet-skill-mode="sheetSkillMode"
            :base-skill-checked="baseSkillChecked"
            :toggle-base-skill="toggleBaseSkill"
            :open-sheet-skill-definition-roll="openSheetSkillDefinitionRoll"
            :base-skill-display-level="baseSkillDisplayLevel"
            :traveller-skill-has-specialities="sheetSkillHasSpecialities"
            :toggle-skill-picker="toggleSkillPicker"
            :available-sheet-specialities="availableSheetSpecialities"
            :add-sheet-speciality="addSheetSpeciality"
            :add-custom-speciality-skill="addCustomSpecialitySkill"
            :speciality-display-name="specialityDisplayName"
            :selected-sheet-specialities="selectedSheetSpecialities"
            :speciality-skill-checked="specialitySkillChecked"
            :toggle-speciality-skill="toggleSpecialitySkill"
            :speciality-skill-display-level="specialitySkillDisplayLevel"
            :change-speciality-skill-level="changeSpecialitySkillLevel"
            :change-base-skill-level="changeBaseSkillLevel"
            @update:showOnlyTrainedSkills="showOnlyTrainedSkills = $event"
            @open-skill-roll-settings="skillRollSettingsOpen = true"
            @update:selected-training-skill-id="selectedTrainingSkillId = $event"
            @update:selected-training-speciality="selectedTrainingSpeciality = $event"
            @update:custom-training-speciality="customTrainingSpeciality = $event"
            @update:selected-training-target-level="selectedTrainingTargetLevel = $event"
            @update:selected-training-characteristic="selectedTrainingCharacteristic = $event"
            @start-skill-training="startSkillTraining"
            @cancel-skill-training="cancelSkillTraining"
            @add-training-weeks="addTrainingWeeks"
            @roll-skill-training-study-period="rollSkillTrainingStudyPeriod"
          />

          <SheetInventoryPage
            v-else-if="activeSheetPage === 'inventory'"
            :draft="draft"
            :non-voucher-equipment-entries="nonVoucherEquipmentEntries"
            :voucher-equipment-entries="voucherEquipmentEntries"
            :voucher-type-options="voucherTypeOptions"
            :format-credit-display="formatCreditDisplay"
            :handle-credit-input="handleCreditInput"
            :add-augment="addAugment"
            :remove-augment="removeAugment"
            :add-equipment="addEquipment"
            :remove-equipment="removeEquipment"
            :add-voucher="addVoucher"
            :voucher-theme-class="voucherThemeClass"
            :voucher-display-heading="voucherDisplayHeading"
            :voucher-selected-type="voucherSelectedType"
            :set-voucher-type="setVoucherType"
            :add-armour="addArmour"
            :remove-armour="removeArmour"
            :add-weapon="addWeapon"
            :remove-weapon="removeWeapon"
            :handle-weapon-damage-input="handleWeaponDamageInput"
          />

          <SheetHistoryPage
            v-else-if="activeSheetPage === 'history'"
            :draft="draft"
            :associate-action-labels="associateActionLabels"
            :history-background-lines="historyBackgroundLines"
            :add-career="addCareer"
            :remove-career="removeCareer"
            :term-rank-label="termRankLabel"
            :term-notes-label="termNotesLabel"
            :add-associate="addAssociate"
            :remove-associate="removeAssociate"
            @update:historyBackgroundLines="historyBackgroundLines = $event"
          />

          <SheetLogPage
            v-else
            :draft="draft"
          />
        </div>
      </template>

      <Transition name="dice-roll-fade">
        <div
          v-if="skillRollSettingsOpen"
          class="skill-stat-modal fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 px-4 py-8 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          @click.self="skillRollSettingsOpen = false"
        >
          <div class="skill-stat-modal__panel w-full max-w-md">
            <header class="skill-stat-modal__header">
              <p class="skill-stat-modal__kicker">Skill Rolls</p>
              <h2 class="skill-stat-modal__title">Stat Handling</h2>
              <p class="skill-stat-modal__subtitle">
                Best uses the highest suggested stat DM for a skill. Select asks which stat applies before rolling.
              </p>
            </header>

            <div class="skill-stat-modal__body">
              <div
                class="skill-roll-mode-toggle"
                :class="{ 'is-select': selectSkillRollCharacteristic }"
                role="group"
                aria-label="Skill roll stat mode"
              >
                <span class="skill-roll-mode-toggle__thumb" aria-hidden="true"></span>
                <button
                  class="skill-roll-mode-toggle__option"
                  :class="{ 'is-active': !selectSkillRollCharacteristic }"
                  type="button"
                  @click="selectSkillRollCharacteristic = false"
                >
                  Best
                </button>
                <button
                  class="skill-roll-mode-toggle__option"
                  :class="{ 'is-active': selectSkillRollCharacteristic }"
                  type="button"
                  @click="selectSkillRollCharacteristic = true"
                >
                  Select
                </button>
              </div>
            </div>

            <footer class="skill-stat-modal__actions">
              <button class="sheet-action-button" type="button" @click="skillRollSettingsOpen = false">Done</button>
            </footer>
          </div>
        </div>
      </Transition>

      <Transition name="dice-roll-fade">
        <div
          v-if="skillRollCharacteristicModalOpen && pendingSkillRoll"
          class="skill-stat-modal fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 px-4 py-8 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          @click.self="closeSkillRollCharacteristicModal"
        >
          <div class="skill-stat-modal__panel w-full max-w-md">
            <header class="skill-stat-modal__header">
              <p class="skill-stat-modal__kicker">Skill Check</p>
              <h2 class="skill-stat-modal__title">
                {{ buildSheetSkillLabel(pendingSkillRoll.definition, pendingSkillRoll.specialityName) }}
              </h2>
              <p class="skill-stat-modal__subtitle">Choose the stat that applies to this situation.</p>
            </header>

            <div class="skill-stat-modal__body">
              <label class="skill-stat-modal__field">
                <span>Stat</span>
                <select v-model="skillRollCharacteristicSelection" class="sheet-line-input">
                  <option
                    v-for="option in sheetSkillRollCharacteristicOptions"
                    :key="option.id"
                    :value="option.id"
                  >
                    {{ option.label }} {{ formatDm(option.dm) }}
                  </option>
                </select>
              </label>

              <div class="skill-stat-modal__summary">
                <span>Selected DM</span>
                <strong>{{ formatDm(selectedSkillRollCharacteristicOption?.dm ?? 0) }}</strong>
              </div>
            </div>

            <footer class="skill-stat-modal__actions">
              <button class="sheet-action-button sheet-action-button--secondary" type="button" @click="closeSkillRollCharacteristicModal">Cancel</button>
              <button class="sheet-action-button" type="button" @click="confirmSkillRollCharacteristic">Roll 2D</button>
            </footer>
          </div>
        </div>
      </Transition>

      <DiceRollModal
        :open="rollModalOpen"
        :rolling="rollModalRolling"
        :title="rollModalTitle"
        :subtitle="rollModalSubtitle"
        :modifier="rollModalModifier"
        :dice="rollModalDice"
        :dice-faces="rollModalDiceFaces"
        :total="rollModalTotal"
        :jackpot="rollModalJackpot"
        :can-reroll="!rollModalRolling && !!rollModalRerollAction"
        :detail-lines="rollModalDetailLines"
        @close="closeRollModal"
        @reroll="rerollRollModal"
      />
    </section>
  </main>
</template>

<style>
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

.sheet-chrome__main {
  display: grid;
  gap: 0.55rem;
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

.sheet-page-tabs {
  display: flex;
  gap: 0.65rem;
  padding: 12px 16px 0;
}

.sheet-page-tabs--chrome {
  padding: 0;
  flex-wrap: wrap;
}

.sheet-page-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.5rem;
  min-width: 8rem;
  padding: 0 1rem;
  border: 1px solid rgba(34, 211, 238, 0.28);
  border-radius: 12px 0 12px 0;
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
  background:
    linear-gradient(180deg, rgba(8, 18, 32, 0.86), rgba(3, 7, 18, 0.88)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.12), transparent 7rem);
  color: #94a3b8;
  font-size: 0.88rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  transition: border-color 140ms ease, color 140ms ease, box-shadow 140ms ease, background 140ms ease;
}

.sheet-page-tab:hover,
.sheet-page-tab:focus-visible,
.sheet-page-tab.is-active {
  border-color: rgba(34, 211, 238, 0.62);
  color: #e0f2fe;
  box-shadow: 0 0 16px rgba(34, 211, 238, 0.14);
  outline: none;
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

.sheet-page-grid--inventory,
.sheet-page-grid--history,
.sheet-page-grid--log {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

.sheet-page-grid--log {
  grid-template-columns: minmax(220px, 1fr) minmax(0, 3fr);
}

.sheet-page-left,
.sheet-page-right {
  display: grid;
  gap: 16px;
  align-content: start;
  min-width: 0;
}

.sheet-panel {
  position: relative;
  min-width: 0;
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
.sheet-table-row--attacks { grid-template-columns: minmax(0, 1fr); }
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
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto auto;
  gap: 6px;
  padding: 0.78rem 1.8rem 0.78rem 0.85rem;
  border: 1px solid rgba(34, 211, 238, 0.18);
  border-radius: 12px 0 12px 0;
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
  background:
    linear-gradient(180deg, rgba(8, 18, 32, 0.7), rgba(4, 9, 20, 0.7));
}

.sheet-armour-row {
  display: grid;
  gap: 6px;
}

.sheet-armour-row--top {
  grid-column: 1;
  grid-template-columns: minmax(0, 1fr) repeat(4, 82px);
}

.sheet-armour-row--bottom {
  grid-column: 1;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.sheet-weapon-grid {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto auto;
  gap: 6px;
  padding: 0.78rem 1.8rem 0.78rem 0.85rem;
  border: 1px solid rgba(34, 211, 238, 0.2);
  border-radius: 12px 0 12px 0;
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
  background:
    linear-gradient(180deg, rgba(8, 18, 32, 0.76), rgba(4, 9, 20, 0.76));
  box-shadow:
    inset 0 0 0 1px rgba(34, 211, 238, 0.04),
    0 0 16px rgba(34, 211, 238, 0.05);
}

.sheet-weapon-row {
  display: grid;
  gap: 6px;
}

.sheet-weapon-row--top {
  grid-column: 1;
  grid-template-columns: minmax(0, 1.8fr) minmax(0, 1.25fr);
}

.sheet-weapon-row--bottom {
  grid-column: 1;
  grid-template-columns: 72px 88px minmax(0, 1.2fr) 72px 72px minmax(0, 1.25fr);
}

.sheet-attack-grid {
  position: relative;
  display: grid;
  gap: 0.45rem;
  padding: 0.78rem 1.8rem 0.78rem 0.85rem;
  border: 1px solid rgba(34, 211, 238, 0.2);
  border-radius: 12px 0 12px 0;
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
  background:
    linear-gradient(180deg, rgba(8, 18, 32, 0.76), rgba(4, 9, 20, 0.76));
  box-shadow:
    inset 0 0 0 1px rgba(34, 211, 238, 0.04),
    0 0 16px rgba(34, 211, 238, 0.05);
}

.sheet-attack-row {
  display: grid;
  gap: 0.4rem;
}

.sheet-attack-row--top {
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
}

.sheet-attack-row--bottom {
  grid-template-columns: 108px minmax(0, 0.66fr) minmax(0, 0.64fr) 84px 84px;
}

.sheet-attack-roll {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.32rem;
  padding: 0 0.55rem;
  align-self: end;
  border: 2px solid rgba(34, 211, 238, 0.44);
  border-radius: 10px 0 10px 0;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  background:
    linear-gradient(180deg, rgba(8, 18, 32, 0.9), rgba(4, 10, 22, 0.92)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.14), transparent 6rem);
  color: #cffafe;
  font-size: 0.76rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  box-shadow: 0 0 0 rgba(34, 211, 238, 0);
  transition: border-color 140ms ease, box-shadow 140ms ease, color 140ms ease;
}

.sheet-attack-roll:hover,
.sheet-attack-roll:focus-visible {
  border-color: rgba(34, 211, 238, 0.66);
  color: #f0f9ff;
  box-shadow: 0 0 16px rgba(34, 211, 238, 0.14);
  outline: none;
}

.sheet-attack-roll--damage {
  border-color: rgba(251, 191, 36, 0.56);
  background:
    linear-gradient(180deg, rgba(64, 36, 13, 0.9), rgba(46, 24, 8, 0.96)),
    radial-gradient(circle at 0 0, rgba(251, 191, 36, 0.16), transparent 5rem);
  color: rgb(255 241 184);
}

.sheet-attack-roll--damage:hover,
.sheet-attack-roll--damage:focus-visible {
  border-color: rgba(251, 191, 36, 0.72);
  box-shadow: 0 0 16px rgba(245, 158, 11, 0.18);
}

.sheet-equipment-grid {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto auto;
  gap: 6px;
  padding: 0.78rem 1.8rem 0.78rem 0.85rem;
  border: 1px solid rgba(34, 211, 238, 0.18);
  border-radius: 12px 0 12px 0;
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
  background:
    linear-gradient(180deg, rgba(8, 18, 32, 0.7), rgba(4, 9, 20, 0.7));
}

.sheet-equipment-row {
  display: grid;
  gap: 6px;
}

.sheet-equipment-row--top {
  grid-column: 1;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 82px 82px;
}

.sheet-equipment-row--bottom {
  grid-column: 1;
  grid-template-columns: minmax(0, 1fr);
}

.sheet-entry-actions {
  position: absolute;
  top: 0.3rem;
  right: 0.32rem;
  display: inline-grid;
  align-content: start;
  justify-items: stretch;
  gap: 0;
  z-index: 2;
}

.sheet-entry-actions--single {
  grid-template-rows: 1fr;
}

.sheet-entry-action {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.08rem;
  height: 1.08rem;
  padding: 0;
  border: 1px solid rgba(34, 211, 238, 0.18);
  border-radius: 6px 0 6px 0;
  clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
  background:
    linear-gradient(180deg, rgba(10, 18, 32, 0.92), rgba(3, 8, 18, 0.94)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.12), transparent 4rem);
  color: rgba(148, 163, 184, 0.7);
  box-shadow:
    inset 0 0 0 1px rgba(34, 211, 238, 0.05),
    0 0 0 rgba(34, 211, 238, 0);
  transition: border-color 140ms ease, background 140ms ease, color 140ms ease, box-shadow 140ms ease;
}

.sheet-entry-action:hover,
.sheet-entry-action:focus-visible,
.sheet-entry-action--enabled {
  border-color: rgba(34, 211, 238, 0.65);
  background:
    linear-gradient(180deg, rgba(12, 24, 40, 0.96), rgba(4, 10, 22, 0.96)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.16), transparent 4rem);
  color: #cffafe;
  box-shadow:
    inset 0 0 0 1px rgba(34, 211, 238, 0.08),
    0 0 16px rgba(34, 211, 238, 0.14);
  outline: none;
}

.sheet-entry-action--danger {
  border-color: rgba(248, 113, 113, 0.38);
  background:
    linear-gradient(180deg, rgba(56, 12, 18, 0.92), rgba(22, 8, 10, 0.94)),
    radial-gradient(circle at 0 0, rgba(248, 113, 113, 0.12), transparent 4rem);
  color: #fecaca;
}

.sheet-entry-action--danger:hover,
.sheet-entry-action--danger:focus-visible {
  border-color: rgba(248, 113, 113, 0.72);
  background:
    linear-gradient(180deg, rgba(72, 16, 22, 0.94), rgba(30, 10, 14, 0.96)),
    radial-gradient(circle at 0 0, rgba(248, 113, 113, 0.18), transparent 4rem);
  color: #fff1f2;
  box-shadow:
    inset 0 0 0 1px rgba(248, 113, 113, 0.08),
    0 0 18px rgba(248, 113, 113, 0.18);
}

.sheet-entry-action :deep(svg) {
  width: 0.42rem;
  height: 0.42rem;
}

.sheet-inline-field {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 2.2rem;
  gap: 0.35rem;
  align-items: center;
}

.sheet-inline-field__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.28rem;
  height: 2.28rem;
  padding: 0;
  border: 1px solid rgba(251, 191, 36, 0.32);
  border-radius: 10px 0 10px 0;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  background:
    linear-gradient(180deg, rgba(64, 36, 13, 0.9), rgba(46, 24, 8, 0.96)),
    radial-gradient(circle at 0 0, rgba(251, 191, 36, 0.16), transparent 4rem);
  color: rgb(253 186 55 / 0.92);
  box-shadow:
    inset 0 0 0 1px rgba(251, 191, 36, 0.07),
    0 0 0 rgba(245, 158, 11, 0);
  transition: border-color 140ms ease, background 140ms ease, color 140ms ease, box-shadow 140ms ease;
}

.sheet-inline-field__action:hover,
.sheet-inline-field__action:focus-visible,
.sheet-inline-field__action--enabled {
  border-color: rgba(251, 191, 36, 0.58);
  background:
    linear-gradient(180deg, rgba(84, 46, 14, 0.96), rgba(58, 28, 8, 0.98)),
    radial-gradient(circle at 0 0, rgba(251, 191, 36, 0.22), transparent 4rem);
  color: rgb(255 248 214);
  box-shadow:
    inset 0 0 0 1px rgba(251, 191, 36, 0.1),
    0 0 16px rgba(245, 158, 11, 0.16);
  outline: none;
}

.sheet-inline-field__action :deep(svg) {
  width: 1.12rem;
  height: 1.12rem;
}

.sheet-cell-input,
.sheet-line-input,
.sheet-textarea {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  max-width: 100%;
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

.sheet-cell-input,
.sheet-line-input {
  overflow: hidden;
  text-overflow: ellipsis;
}

.sheet-cell-input--button {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  text-align: left;
  cursor: default;
}

.sheet-cell-input--interactive {
  cursor: pointer;
  color: #67e8f9;
  border-color: rgba(34, 211, 238, 0.34);
  box-shadow:
    inset 0 0 0 1px rgba(34, 211, 238, 0.08),
    0 0 14px rgba(34, 211, 238, 0.08);
}

.sheet-cell-input--interactive:hover,
.sheet-cell-input--interactive:focus-visible {
  color: #cffafe;
  border-color: rgba(34, 211, 238, 0.7);
  box-shadow:
    inset 0 0 0 1px rgba(34, 211, 238, 0.12),
    0 0 18px rgba(34, 211, 238, 0.14);
  outline: none;
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

.sheet-remove:disabled,
.sheet-add:disabled {
  cursor: not-allowed;
  opacity: 0.45;
  box-shadow: none;
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

.sheet-add--compact {
  min-height: 2rem;
  padding: 5px 8px;
  font-size: 0.76rem;
}

.sheet-add--primary {
  border-color: rgba(251, 191, 36, 0.5);
  background:
    linear-gradient(180deg, rgba(120, 65, 12, 0.72), rgba(48, 24, 8, 0.78)),
    radial-gradient(circle at 0 0, rgba(251, 191, 36, 0.18), transparent 4rem);
  color: #fef3c7;
}

.sheet-identity-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(220px, 0.65fr);
  gap: 14px;
}

.sheet-personal-grid {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.sheet-personal-split {
  display: grid;
  grid-template-columns: 64px minmax(4.25rem, 0.48fr) 0 minmax(0, 1fr);
  column-gap: 6px;
  row-gap: 8px;
  align-items: center;
  min-width: 0;
}

.sheet-line-field {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 6px;
  color: #a1a1aa;
  min-width: 0;
}

.sheet-line-field--personal {
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 6px;
}

.sheet-personal-split .sheet-line-field--personal {
  display: contents;
}

.sheet-personal-split .sheet-line-field--personal > span {
  align-self: center;
}

.sheet-personal-split__spacer {
  display: block;
  width: 0;
  min-width: 0;
  overflow: hidden;
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
  grid-template-columns: 76px minmax(0, 1fr);
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
  place-items: center;
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
  justify-content: center;
  gap: 10px;
  color: #67e8f9;
}

.sheet-portrait-icon {
  opacity: 0.82;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.sheet-portrait-icon--primary {
  color: #fbbf24;
}

.sheet-portrait-icon--large {
  width: 7.6rem;
  height: 7.6rem;
}

.sheet-portrait-icon--large svg {
  width: 7.6rem;
  height: 7.6rem;
  stroke-width: 1.4;
}

.sheet-textarea--tall {
  min-height: 186px;
  resize: vertical;
}

.sheet-characteristics-panel {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
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

.sheet-characteristic--psi {
  grid-column: 1 / -1;
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
  border: 1px solid rgba(34, 211, 238, 0.3);
  border-radius: 7px 0 7px 0;
  clip-path: polygon(0 0, calc(100% - 7px) 0, 100% 7px, 100% 100%, 7px 100%, 0 calc(100% - 7px));
  background:
    linear-gradient(180deg, rgba(8, 18, 32, 0.84), rgba(4, 10, 22, 0.88)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.14), transparent 4rem);
  color: #67e8f9;
  padding: 0;
}

.sheet-skill-entry {
  display: grid;
  grid-template-columns: 1.1rem minmax(0, 1fr) 4.9rem;
  gap: 0.72rem;
  align-items: center;
}

.sheet-skill-entry--base {
  padding-bottom: 0.04rem;
}

.sheet-skill-specialities {
  display: grid;
  gap: 0.28rem;
  margin-left: 0.95rem;
  padding-top: 0.28rem;
  padding-left: 1.15rem;
  border-left: 1px solid rgb(34 211 238 / 0.22);
  box-shadow: inset 8px 0 10px -10px rgb(34 211 238 / 0.18);
}

.sheet-skill-entry--speciality {
  padding-left: 0;
}

.sheet-skill-toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 0.98rem;
  height: 0.98rem;
}

.sheet-skill-toggle input {
  position: absolute;
  inset: 0;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}

.sheet-skill-toggle__frame {
  position: relative;
  display: inline-flex;
  width: 0.98rem;
  height: 0.98rem;
  border: 1px solid rgba(34, 211, 238, 0.34);
  border-radius: 6px 0 6px 0;
  clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
  background:
    linear-gradient(180deg, rgba(8, 18, 32, 0.9), rgba(4, 10, 22, 0.92)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.12), transparent 3rem);
  box-shadow:
    inset 0 0 0 1px rgba(34, 211, 238, 0.05),
    0 0 0 rgba(34, 211, 238, 0);
  transition: border-color 140ms ease, background 140ms ease, box-shadow 140ms ease, transform 140ms ease;
}

.sheet-skill-toggle__frame::after {
  content: '✓';
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  opacity: 0;
  color: rgba(8, 20, 31, 0.98);
  font-size: 0.76rem;
  font-weight: 900;
  line-height: 1;
  transition: opacity 140ms ease;
}

.sheet-skill-toggle input:hover + .sheet-skill-toggle__frame,
.sheet-skill-toggle input:focus-visible + .sheet-skill-toggle__frame {
  border-color: rgba(34, 211, 238, 0.62);
  background:
    linear-gradient(180deg, rgba(10, 24, 40, 0.96), rgba(6, 14, 28, 0.96)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.2), transparent 3rem);
  box-shadow:
    inset 0 0 0 1px rgba(34, 211, 238, 0.08),
    0 0 14px rgba(34, 211, 238, 0.12);
  transform: translateY(-1px);
  outline: none;
}

.sheet-skill-toggle input:checked + .sheet-skill-toggle__frame {
  border-color: rgba(34, 211, 238, 0.72);
  background:
    linear-gradient(180deg, rgba(10, 24, 40, 0.98), rgba(6, 14, 28, 0.98)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.22), transparent 3rem);
  box-shadow:
    inset 0 0 0 1px rgba(34, 211, 238, 0.12),
    0 0 16px rgba(34, 211, 238, 0.22);
}

.sheet-skill-toggle input:checked + .sheet-skill-toggle__frame::after {
  opacity: 1;
  color: rgb(126 241 255 / 0.98);
  text-shadow:
    0 0 8px rgba(34, 211, 238, 0.24),
    0 0 14px rgba(34, 211, 238, 0.16);
}

.sheet-skill-toggle--empty {
  width: 0.95rem;
  height: 0.95rem;
}

.sheet-skill-roll-button {
  min-width: 0;
  border: none;
  background: none;
  padding: 0 0 0 0.68rem;
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
  padding-left: 0.55rem;
}

.sheet-skill-speciality-label {
  display: inline-flex;
  align-items: center;
  min-width: 0;
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
  cursor: pointer;
  transition: border-color 140ms ease, color 140ms ease, box-shadow 140ms ease, background 140ms ease;
}

.sheet-skill-rank__button:hover,
.sheet-skill-rank__button:focus-visible {
  border-color: rgba(34, 211, 238, 0.64);
  color: #cffafe;
  box-shadow: 0 0 14px rgba(34, 211, 238, 0.14);
  outline: none;
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
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background: rgba(2, 6, 23, 0.68);
  backdrop-filter: blur(18px);
  animation: sheet-roll-fade-in 180ms ease;
}

.sheet-roll-modal {
  position: relative;
  width: min(100%, 32rem);
  display: grid;
  gap: 1.05rem;
  padding: 1.2rem;
  border: 1px solid rgba(34, 211, 238, 0.42);
  border-radius: 16px 0 16px 0;
  clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px));
  background:
    linear-gradient(180deg, rgba(10, 18, 32, 0.98), rgba(4, 9, 20, 0.98)),
    linear-gradient(90deg, rgba(34, 211, 238, 0.04) 1px, transparent 1px),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.16), transparent 14rem);
  background-size: auto, 28px 28px, auto;
  box-shadow:
    0 0 30px rgba(34, 211, 238, 0.2),
    inset 0 0 24px rgba(34, 211, 238, 0.05);
}

.sheet-roll-modal::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: 16px 0 16px 0;
  clip-path: inherit;
  background:
    linear-gradient(180deg, rgba(34, 211, 238, 0.08), transparent 28%),
    radial-gradient(circle at 50% 0, rgba(34, 211, 238, 0.12), transparent 45%);
}

.sheet-roll-modal--jackpot {
  border-color: rgba(251, 191, 36, 0.56);
  background:
    linear-gradient(180deg, rgba(53, 24, 8, 0.98), rgba(24, 11, 5, 0.98)),
    linear-gradient(90deg, rgba(251, 191, 36, 0.05) 1px, transparent 1px),
    radial-gradient(circle at 0 0, rgba(251, 191, 36, 0.22), transparent 14rem);
  background-size: auto, 28px 28px, auto;
  box-shadow:
    0 0 38px rgba(251, 191, 36, 0.24),
    inset 0 0 30px rgba(251, 191, 36, 0.08);
}

.sheet-roll-modal__header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 1rem;
}

.sheet-roll-modal__title {
  color: #f8fafc;
  font-size: 1.12rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  text-shadow: 0 0 16px rgba(34, 211, 238, 0.12);
}

.sheet-roll-modal__subtitle {
  margin-top: 0.2rem;
  color: #fbbf24;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
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
  gap: 0.9rem;
}

.sheet-roll-die {
  display: grid;
  place-items: center;
  width: 4.45rem;
  height: 4.45rem;
  border: 1px solid rgba(34, 211, 238, 0.46);
  border-radius: 14px 0 14px 0;
  clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px));
  background:
    linear-gradient(180deg, rgba(11, 24, 44, 0.98), rgba(6, 13, 24, 1));
  color: #e0f2fe;
  font-size: 1.6rem;
  font-weight: 800;
  box-shadow:
    inset 0 0 0 1px rgba(34, 211, 238, 0.1),
    0 0 18px rgba(34, 211, 238, 0.08);
}

.sheet-roll-die--rolling {
  animation: sheet-roll-die-pulse 220ms linear infinite;
}

.sheet-roll-die--jackpot {
  border-color: rgba(251, 191, 36, 0.7);
  color: #fde68a;
  background:
    linear-gradient(180deg, rgba(73, 34, 8, 0.98), rgba(34, 16, 4, 1));
  box-shadow:
    inset 0 0 0 1px rgba(251, 191, 36, 0.12),
    0 0 22px rgba(251, 191, 36, 0.22);
}

.sheet-roll-formula,
.sheet-roll-status {
  text-align: center;
  color: #cbd5e1;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.sheet-roll-total {
  text-align: center;
  color: #fbbf24;
  font-size: 2.55rem;
  font-weight: 800;
  line-height: 1;
  text-shadow: 0 0 20px rgba(251, 191, 36, 0.2);
}

.sheet-roll-total--jackpot {
  color: #fde68a;
  text-shadow:
    0 0 10px rgba(253, 230, 138, 0.24),
    0 0 24px rgba(251, 191, 36, 0.28),
    0 0 40px rgba(251, 191, 36, 0.18);
}

.sheet-roll-status--jackpot {
  color: #fde68a;
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
  gap: 8px;
  grid-column: 1 / -1;
  align-self: end;
  min-width: 0;
  padding: 8px;
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

.sheet-training-form {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.sheet-training-form__split {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  min-width: 0;
}

.sheet-training-active {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.sheet-training-active strong {
  display: block;
  margin-top: 2px;
  color: #e0f2fe;
  font-size: 0.9rem;
}

.sheet-training-label {
  color: #bae6fd;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.sheet-training-progress {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.sheet-training-progress > div {
  min-width: 0;
  padding: 7px;
  border: 1px solid rgba(34, 211, 238, 0.16);
  border-radius: 8px 0 8px 0;
  background: rgba(3, 10, 22, 0.52);
}

.sheet-training-progress span {
  display: block;
  color: #bae6fd;
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.sheet-training-progress strong {
  display: block;
  margin-top: 3px;
  color: #e0f2fe;
  font-size: 1rem;
}

.sheet-training-note {
  margin: 0;
  color: #cbd5e1;
  font-size: 0.76rem;
  line-height: 1.35;
}

.sheet-training-note--warning {
  color: #fcd34d;
}

.sheet-training-note--roll {
  color: #bae6fd;
}

.sheet-training-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.sheet-training-history {
  display: grid;
  gap: 3px;
  margin-top: 2px;
  padding-top: 7px;
  border-top: 1px solid rgba(34, 211, 238, 0.14);
}

.sheet-training-history p {
  margin: 0;
  color: #94a3b8;
  font-size: 0.72rem;
}

.sheet-log-calendar,
.sheet-log-editor {
  min-width: 0;
}

.sheet-log-calendar__controls {
  display: grid;
  grid-template-columns: minmax(3.35rem, 0.68fr) minmax(0, 1.14fr) minmax(3.35rem, 0.68fr);
  gap: 6px;
  align-items: center;
  margin-top: 2px;
  overflow: hidden;
}

.sheet-log-calendar__controls .sheet-line-input {
  text-align: center;
  font-weight: 900;
}

.sheet-log-calendar__controls.is-shifting-left .sheet-line-input {
  animation: sheet-log-month-shift-left 240ms ease;
}

.sheet-log-calendar__controls.is-shifting-right .sheet-line-input {
  animation: sheet-log-month-shift-right 240ms ease;
}

.sheet-log-month-adjacent {
  min-height: 1.82rem;
  border: 1px solid rgba(34, 211, 238, 0.14);
  border-radius: 10px 0 10px 0;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  background: rgba(3, 10, 22, 0.28);
  color: rgba(186, 230, 253, 0.52);
  font-size: 0.64rem;
  font-weight: 800;
  overflow: hidden;
  padding: 0.22rem 0.34rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sheet-log-month-adjacent:hover,
.sheet-log-month-adjacent:focus-visible {
  border-color: rgba(34, 211, 238, 0.42);
  color: #bae6fd;
  outline: none;
}

.sheet-log-calendar__controls.is-shifting-left .sheet-log-month-adjacent--prev,
.sheet-log-calendar__controls.is-shifting-right .sheet-log-month-adjacent--next {
  animation: sheet-log-adjacent-fade 240ms ease;
}

.sheet-log-year-display {
  display: inline-grid;
  grid-template-columns: auto minmax(4.15rem, 4.75rem);
  gap: 6px;
  align-items: center;
  min-width: 0;
}

.sheet-log-year-display small {
  color: #bae6fd;
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.sheet-log-year-input {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  border: 1px solid rgba(34, 211, 238, 0.24);
  border-radius: 8px 0 8px 0;
  background: rgba(3, 10, 22, 0.56);
  color: #fbbf24;
  font-size: 0.82rem;
  font-weight: 900;
  padding: 0.22rem 0.42rem;
  text-align: center;
}

.sheet-log-calendar__days,
.sheet-log-calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 3px;
}

.sheet-log-calendar__days {
  margin-top: 7px;
  color: #bae6fd;
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-align: center;
  text-transform: uppercase;
}

.sheet-log-calendar__day {
  display: grid;
  place-items: center;
  min-height: 2.28rem;
  border: 1px solid rgba(34, 211, 238, 0.18);
  border-radius: 8px 0 8px 0;
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
  background: rgba(3, 10, 22, 0.54);
  color: #dbeafe;
  font-size: 0.78rem;
  font-weight: 800;
}

.sheet-log-calendar__day small {
  min-width: 1rem;
  border-radius: 999px;
  background: rgba(251, 191, 36, 0.18);
  color: #fde68a;
  font-size: 0.56rem;
  line-height: 1rem;
}

.sheet-log-calendar__day:not(:disabled):hover,
.sheet-log-calendar__day.is-selected {
  border-color: rgba(34, 211, 238, 0.72);
  background:
    linear-gradient(180deg, rgba(8, 64, 85, 0.74), rgba(8, 18, 32, 0.8)),
    radial-gradient(circle at 50% 0, rgba(34, 211, 238, 0.18), transparent 4rem);
  box-shadow: 0 0 18px rgba(34, 211, 238, 0.14);
}

.sheet-log-calendar__day.is-empty {
  opacity: 0.18;
}

.sheet-log-calendar__day.has-entries {
  border-color: rgba(251, 191, 36, 0.42);
}

.sheet-log-index {
  min-height: 0;
}

.sheet-log-entry-list {
  display: grid;
  gap: 8px;
  min-width: 0;
  max-height: min(34rem, 52vh);
  overflow-y: auto;
  padding-right: 4px;
}

.sheet-log-filters {
  display: grid;
  gap: 8px;
  margin-bottom: 10px;
  min-width: 0;
}

.sheet-log-entry-list__item {
  display: grid;
  gap: 3px;
  min-width: 0;
  border: 1px solid rgba(34, 211, 238, 0.18);
  border-radius: 10px 0 10px 0;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  background: rgba(3, 10, 22, 0.62);
  padding: 9px 10px;
  text-align: left;
}

.sheet-log-entry-list__item strong {
  overflow: hidden;
  color: #e0f2fe;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sheet-log-entry-list__item span,
.sheet-log-empty {
  color: #94a3b8;
  font-size: 0.78rem;
}

.sheet-log-entry-list__item:hover,
.sheet-log-entry-list__item.is-selected {
  border-color: rgba(34, 211, 238, 0.6);
}

.sheet-log-editor {
  align-content: start;
}

.sheet-log-editor__date {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: baseline;
  margin-bottom: 10px;
  color: #bae6fd;
}

.sheet-log-editor__actions {
  display: inline-flex;
  gap: 6px;
  margin-left: auto;
}

.sheet-log-confirm {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
  border: 1px solid rgba(251, 191, 36, 0.28);
  border-radius: 10px 0 10px 0;
  background: rgba(69, 36, 9, 0.42);
  padding: 8px;
  color: #fde68a;
  font-size: 0.8rem;
  font-weight: 800;
}

.sheet-log-editor__date span {
  color: #fbbf24;
  font-size: 0.78rem;
  font-weight: 800;
}

.sheet-log-editor__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 8px;
}

.sheet-log-editor__grid .sheet-line-field:nth-child(-n+2) {
  grid-column: span 3;
}

.sheet-textarea--log {
  min-height: 18rem;
  resize: vertical;
}

.sheet-log-training-link {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(4.5rem, 0.25fr) auto;
  gap: 8px;
  align-items: center;
  margin: 8px 0;
  border: 1px solid rgba(34, 211, 238, 0.18);
  border-radius: 10px 0 10px 0;
  background: rgba(3, 10, 22, 0.52);
  padding: 8px;
}

.sheet-log-training-link span {
  color: #bae6fd;
  font-size: 0.78rem;
  font-weight: 800;
}

.sheet-log-empty--editor {
  display: grid;
  min-height: 20rem;
  place-items: center;
  border: 1px dashed rgba(34, 211, 238, 0.2);
  border-radius: 12px 0 12px 0;
}

@keyframes sheet-log-month-shift-left {
  0% {
    opacity: 0.62;
    transform: translateX(18px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes sheet-log-month-shift-right {
  0% {
    opacity: 0.62;
    transform: translateX(-18px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes sheet-log-adjacent-fade {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0.45;
  }
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
}

.sheet-voucher-card {
  --voucher-accent: rgba(34, 211, 238, 0.42);
  --voucher-accent-strong: rgba(34, 211, 238, 0.62);
  --voucher-accent-glow: rgba(34, 211, 238, 0.18);
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
  --voucher-accent: rgba(52, 211, 153, 0.46);
  --voucher-accent-strong: rgba(110, 231, 183, 0.72);
  --voucher-accent-glow: rgba(52, 211, 153, 0.22);
  border-color: rgba(52, 211, 153, 0.4);
  background:
    linear-gradient(180deg, rgba(9, 45, 31, 0.96), rgba(5, 21, 14, 0.96)),
    radial-gradient(circle at 0 0, rgba(52, 211, 153, 0.14), transparent 13rem);
  box-shadow: 0 0 22px rgba(52, 211, 153, 0.12);
}

.sheet-voucher-card--armour {
  --voucher-accent: rgba(52, 211, 153, 0.46);
  --voucher-accent-strong: rgba(110, 231, 183, 0.72);
  --voucher-accent-glow: rgba(52, 211, 153, 0.22);
  border-color: rgba(52, 211, 153, 0.4);
  background:
    linear-gradient(180deg, rgba(8, 45, 34, 0.96), rgba(4, 20, 15, 0.96)),
    radial-gradient(circle at 0 0, rgba(52, 211, 153, 0.14), transparent 13rem);
}

.sheet-voucher-card--equipment {
  --voucher-accent: rgba(226, 232, 240, 0.42);
  --voucher-accent-strong: rgba(248, 250, 252, 0.72);
  --voucher-accent-glow: rgba(226, 232, 240, 0.16);
  border-color: rgba(226, 232, 240, 0.34);
  background:
    linear-gradient(180deg, rgba(48, 54, 66, 0.96), rgba(20, 24, 32, 0.96)),
    radial-gradient(circle at 0 0, rgba(226, 232, 240, 0.16), transparent 13rem);
}

.sheet-voucher-card--implant {
  --voucher-accent: rgba(226, 232, 240, 0.42);
  --voucher-accent-strong: rgba(248, 250, 252, 0.72);
  --voucher-accent-glow: rgba(226, 232, 240, 0.16);
  border-color: rgba(226, 232, 240, 0.34);
  background:
    linear-gradient(180deg, rgba(48, 54, 66, 0.96), rgba(20, 24, 32, 0.96)),
    radial-gradient(circle at 0 0, rgba(226, 232, 240, 0.16), transparent 13rem);
}

.sheet-voucher-card--vehicle {
  --voucher-accent: rgba(168, 85, 247, 0.46);
  --voucher-accent-strong: rgba(216, 180, 254, 0.76);
  --voucher-accent-glow: rgba(168, 85, 247, 0.22);
  border-color: rgba(168, 85, 247, 0.38);
  background:
    linear-gradient(180deg, rgba(38, 16, 64, 0.96), rgba(17, 8, 32, 0.96)),
    radial-gradient(circle at 0 0, rgba(168, 85, 247, 0.14), transparent 13rem);
}

.sheet-voucher-card--small-craft {
  --voucher-accent: rgba(251, 146, 60, 0.48);
  --voucher-accent-strong: rgba(253, 186, 116, 0.76);
  --voucher-accent-glow: rgba(251, 146, 60, 0.22);
  border-color: rgba(251, 146, 60, 0.4);
  background:
    linear-gradient(180deg, rgba(70, 28, 10, 0.96), rgba(28, 12, 6, 0.96)),
    radial-gradient(circle at 0 0, rgba(251, 146, 60, 0.14), transparent 13rem);
}

.sheet-voucher-card--ship {
  --voucher-accent: rgba(244, 114, 182, 0.48);
  --voucher-accent-strong: rgba(251, 207, 232, 0.76);
  --voucher-accent-glow: rgba(244, 114, 182, 0.22);
  border-color: rgba(244, 114, 182, 0.42);
  background:
    linear-gradient(180deg, rgba(66, 18, 42, 0.96), rgba(28, 8, 20, 0.96)),
    radial-gradient(circle at 0 0, rgba(244, 114, 182, 0.16), transparent 13rem);
}

.sheet-voucher-card--generic {
  --voucher-accent: rgba(148, 163, 184, 0.34);
  --voucher-accent-strong: rgba(226, 232, 240, 0.62);
  --voucher-accent-glow: rgba(148, 163, 184, 0.16);
  border-color: rgba(148, 163, 184, 0.28);
}

.sheet-voucher-card__top {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: stretch;
  gap: 0.75rem;
}

.sheet-voucher-card__brand {
  position: relative;
  display: grid;
  place-items: center;
  min-width: 3.6rem;
  padding: 0.3rem 0.55rem;
  border: 1px solid currentColor;
  border-radius: 12px 0 12px 0;
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
  background: rgba(2, 6, 23, 0.3);
  grid-row: 1 / span 2;
  align-self: stretch;
  overflow: hidden;
}

.sheet-voucher-card__brand-icon {
  width: 2.3rem;
  height: 2.3rem;
  color: currentColor;
  transition: transform 260ms ease;
  transform-origin: center;
  transform-style: preserve-3d;
  will-change: transform, filter;
  filter:
    drop-shadow(0 0 5px color-mix(in srgb, currentColor 28%, transparent))
    drop-shadow(0 0 12px color-mix(in srgb, currentColor 16%, transparent));
}

.sheet-voucher-card__brand:hover .sheet-voucher-card__brand-icon,
.sheet-voucher-card__brand:focus-within .sheet-voucher-card__brand-icon {
  animation:
    sheet-voucher-brand-roll 950ms linear infinite,
    sheet-voucher-brand-glow 1.1s ease-in-out infinite;
}

.sheet-voucher-card__brand::after {
  content: '';
  position: absolute;
  inset: 1px;
  clip-path: polygon(0 0, calc(100% - 11px) 0, 100% 11px, 100% 100%, 11px 100%, 0 calc(100% - 11px));
  background: linear-gradient(110deg, transparent 0%, rgb(207 250 254 / 0.08) 42%, rgb(255 255 255 / 0.26) 50%, rgb(103 232 249 / 0.12) 58%, transparent 100%);
  transform: translateX(-125%);
  opacity: 0;
  pointer-events: none;
}

.sheet-voucher-card__brand:hover::after,
.sheet-voucher-card__brand:focus-within::after {
  opacity: 1;
  animation: sheet-voucher-brand-sweep 1.2s ease-out;
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
  font-family: "Orbitron", "Rajdhani", "Eurostile", "Bank Gothic", "Inter", sans-serif;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.sheet-voucher-card__heading {
  font-size: 1.04rem;
}

.sheet-voucher-card__subheading {
  font-size: 0.7rem;
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
  width: 1.12rem;
  height: 1.12rem;
  border: 1px solid rgba(248, 113, 113, 0.42);
  border-radius: 6px 0 6px 0;
  clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
  background:
    linear-gradient(180deg, rgba(56, 12, 18, 0.92), rgba(22, 8, 10, 0.94)),
    radial-gradient(circle at 0 0, rgba(248, 113, 113, 0.14), transparent 4rem);
  color: #fecaca;
  box-shadow:
    inset 0 0 0 1px rgba(248, 113, 113, 0.05),
    0 0 8px rgba(248, 113, 113, 0.1);
}

.sheet-voucher-card__remove:hover,
.sheet-voucher-card__remove:focus-visible {
  border-color: rgba(248, 113, 113, 0.72);
  background:
    linear-gradient(180deg, rgba(72, 16, 22, 0.94), rgba(30, 10, 14, 0.96)),
    radial-gradient(circle at 0 0, rgba(248, 113, 113, 0.2), transparent 4rem);
  color: #fff1f2;
  box-shadow:
    inset 0 0 0 1px rgba(248, 113, 113, 0.08),
    0 0 14px rgba(248, 113, 113, 0.18);
  outline: none;
}

.sheet-voucher-card__remove :deep(svg) {
  width: 0.46rem;
  height: 0.46rem;
}

.sheet-voucher-card__meta {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 1fr);
  gap: 0.65rem;
}

.sheet-voucher-card__field-shell {
  position: relative;
  display: grid;
  align-items: stretch;
  min-width: 0;
  color: currentColor;
  border: 1px solid color-mix(in srgb, var(--voucher-accent-strong) 88%, white 12%);
  border-radius: 10px 0 10px 0;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--voucher-accent) 42%, rgba(2, 6, 23, 0.96)), color-mix(in srgb, var(--voucher-accent) 18%, rgba(2, 6, 23, 0.9))),
    radial-gradient(circle at 0 0, color-mix(in srgb, var(--voucher-accent-strong) 44%, transparent), transparent 4rem);
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--voucher-accent-strong) 24%, transparent),
    0 0 0 1px color-mix(in srgb, var(--voucher-accent) 18%, transparent),
    0 0 14px color-mix(in srgb, var(--voucher-accent-glow) 52%, transparent);
  transition: border-color 140ms ease, box-shadow 140ms ease, background 140ms ease;
}

.sheet-voucher-card__field-shell:hover,
.sheet-voucher-card__field-shell:focus-within {
  border-color: color-mix(in srgb, var(--voucher-accent-strong) 94%, white 6%);
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--voucher-accent-strong) 38%, transparent),
    0 0 18px color-mix(in srgb, var(--voucher-accent-glow) 80%, transparent);
}

.sheet-voucher-card__field-shell--select::after {
  content: '';
  position: absolute;
  right: 0.72rem;
  top: 50%;
  width: 0.5rem;
  height: 0.32rem;
  background: currentColor;
  clip-path: polygon(0 0, 100% 0, 50% 100%);
  transform: translateY(-50%);
  opacity: 0.88;
  pointer-events: none;
}

.sheet-voucher-card__field {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  width: 100%;
  min-height: 1.9rem;
  padding: 0 0.58rem;
  font-size: 0.74rem;
  font-family: "Rajdhani", "Orbitron", "Eurostile", "Bank Gothic", "Inter", sans-serif;
  font-weight: 700;
  border: 0;
  border-radius: 0;
  clip-path: none;
  box-shadow: none;
  background: transparent;
  color: currentColor;
}

.sheet-voucher-card__field::placeholder {
  color: color-mix(in srgb, currentColor 62%, transparent);
}

.sheet-voucher-card__field--select {
  -webkit-text-fill-color: currentColor;
  padding-right: 1.6rem;
}

.sheet-voucher-card__field--select option {
  color: #e2e8f0;
  background: #081220;
}

.sheet-voucher-card__field:hover,
.sheet-voucher-card__field:focus-visible {
  outline: none;
}

.sheet-skill-visibility-icon {
  width: 1.25rem;
  height: 1.25rem;
  display: block;
}

.sheet-skill-header-actions {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 0.45rem;
}

.sheet-panel-title--side .sheet-skill-header-actions {
  flex-direction: row;
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

.sheet-skill-settings-button {
  font-size: 1.35rem;
  font-weight: 900;
  line-height: 1;
}

.sheet-skill-settings-button > span {
  display: block;
  transform: rotate(90deg);
}

.skill-stat-modal__panel {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(34, 211, 238, 0.38);
  border-radius: 14px 0 14px 0;
  clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 18px 100%, 0 calc(100% - 18px));
  background:
    linear-gradient(180deg, rgba(8, 20, 35, 0.98), rgba(4, 10, 20, 0.99)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.12), transparent 12rem);
  box-shadow:
    0 0 0 1px rgba(14, 116, 144, 0.28),
    0 24px 64px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.skill-stat-modal__header,
.skill-stat-modal__body,
.skill-stat-modal__actions {
  position: relative;
}

.skill-stat-modal__header {
  border-bottom: 1px solid rgba(34, 211, 238, 0.18);
  padding: 1.25rem 1.25rem 1rem;
}

.skill-stat-modal__kicker {
  margin: 0;
  color: #67e8f9;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.skill-stat-modal__title {
  margin: 0.35rem 0 0;
  color: #ecfeff;
  font-size: 1.35rem;
  font-weight: 800;
}

.skill-stat-modal__subtitle {
  margin: 0.4rem 0 0;
  color: rgba(224, 242, 254, 0.78);
  font-size: 0.95rem;
}

.skill-stat-modal__body {
  display: grid;
  gap: 1rem;
  padding: 1.25rem;
}

.skill-stat-modal__field {
  display: grid;
  gap: 0.4rem;
  color: #bfdbfe;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.skill-stat-modal__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border: 1px solid rgba(34, 211, 238, 0.2);
  border-radius: 10px 0 10px 0;
  padding: 0.75rem 0.85rem;
  color: rgba(224, 242, 254, 0.78);
}

.skill-stat-modal__summary strong {
  color: #facc15;
  font-size: 1.1rem;
}

.skill-roll-mode-toggle {
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.25rem;
  border: 1px solid rgba(34, 211, 238, 0.42);
  padding: 0.25rem;
  background:
    linear-gradient(135deg, rgba(8, 47, 73, 0.88), rgba(2, 6, 23, 0.92) 56%, rgba(20, 184, 166, 0.12));
  box-shadow:
    inset 0 0 20px rgba(34, 211, 238, 0.1),
    0 0 16px rgba(34, 211, 238, 0.1);
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
}

.skill-roll-mode-toggle__thumb {
  position: absolute;
  z-index: 0;
  top: 0.25rem;
  bottom: 0.25rem;
  left: 0.25rem;
  width: calc((100% - 0.75rem) / 2);
  border: 1px solid rgba(103, 232, 249, 0.82);
  background:
    linear-gradient(135deg, rgba(34, 211, 238, 0.48), rgba(8, 47, 73, 0.96) 55%, rgba(20, 184, 166, 0.34));
  box-shadow:
    inset 0 0 20px rgba(34, 211, 238, 0.22),
    0 0 18px rgba(34, 211, 238, 0.28);
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  transition: transform 180ms ease;
}

.skill-roll-mode-toggle.is-select .skill-roll-mode-toggle__thumb {
  transform: translateX(calc(100% + 0.25rem));
}

.skill-roll-mode-toggle__option {
  position: relative;
  z-index: 1;
  min-height: 2.4rem;
  border: 1px solid transparent;
  background: transparent;
  color: rgba(224, 242, 254, 0.72);
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.skill-roll-mode-toggle__option:hover,
.skill-roll-mode-toggle__option:focus-visible,
.skill-roll-mode-toggle__option.is-active {
  color: #ecfeff;
  outline: none;
  text-shadow: 0 0 12px rgba(103, 232, 249, 0.62);
}

.skill-stat-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  border-top: 1px solid rgba(34, 211, 238, 0.18);
  padding: 1rem 1.25rem 1.25rem;
}

.sheet-action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.4rem;
  border: 1px solid rgba(34, 211, 238, 0.48);
  border-radius: 10px 0 10px 0;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  background:
    linear-gradient(180deg, rgba(14, 116, 144, 0.72), rgba(8, 47, 73, 0.92)),
    radial-gradient(circle at 0 0, rgba(103, 232, 249, 0.18), transparent 8rem);
  padding: 0.45rem 1rem;
  color: #ecfeff;
  font-weight: 800;
}

.sheet-action-button--secondary {
  border-color: rgba(148, 163, 184, 0.28);
  background: rgba(8, 18, 32, 0.82);
  color: #cbd5e1;
}

.sheet-action-button:hover,
.sheet-action-button:focus-visible {
  outline: none;
  border-color: rgba(34, 211, 238, 0.78);
  box-shadow: 0 0 16px rgba(34, 211, 238, 0.18);
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
  color: #e9d5ff;
}

.sheet-voucher-card--small-craft {
  color: #fdba74;
}

.sheet-voucher-card--ship {
  color: #fbcfe8;
}

.sheet-voucher-card--generic {
  color: #e2e8f0;
}

@keyframes sheet-voucher-brand-sweep {
  0% {
    transform: translateX(-125%);
  }
  100% {
    transform: translateX(125%);
  }
}

@keyframes sheet-voucher-brand-roll {
  0% {
    transform: perspective(900px) rotateY(0deg) scale(1);
  }
  50% {
    transform: perspective(900px) rotateY(180deg) scale(1.04);
  }
  100% {
    transform: perspective(900px) rotateY(360deg) scale(1);
  }
}

@keyframes sheet-voucher-brand-glow {
  0%,
  100% {
    filter:
      drop-shadow(0 0 5px color-mix(in srgb, currentColor 28%, transparent))
      drop-shadow(0 0 12px color-mix(in srgb, currentColor 16%, transparent));
  }
  50% {
    filter:
      drop-shadow(0 0 10px color-mix(in srgb, currentColor 38%, transparent))
      drop-shadow(0 0 20px color-mix(in srgb, currentColor 26%, transparent))
      drop-shadow(0 0 34px color-mix(in srgb, currentColor 14%, transparent));
  }
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
  .sheet-page-grid--inventory,
  .sheet-page-grid--history,
  .sheet-page-grid--log,
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

  .sheet-page-grid--inventory,
  .sheet-page-grid--history,
  .sheet-page-grid--log {
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

  .sheet-panel-title--side .sheet-skill-header-actions {
    flex-direction: column;
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

  .sheet-weapon-row--bottom {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .sheet-attack-row--top,
  .sheet-attack-row--bottom,
  .sheet-equipment-row--top {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .sheet-field-with-label {
    display: grid;
    gap: 0.22rem;
    min-width: 0;
  }

  .sheet-field-with-label > span {
    padding-left: 0.12rem;
    color: #94a3b8;
    font-size: 0.62rem;
    font-weight: 700;
    line-height: 1;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .sheet-voucher-card__meta {
    grid-template-columns: 1fr;
  }

  .sheet-characteristics-panel {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .sheet-line-field--training {
    grid-template-columns: 76px minmax(0, 1fr);
  }

  .sheet-training-form__split {
    grid-template-columns: minmax(0, 1fr);
  }

  .sheet-log-calendar__controls,
  .sheet-log-editor__grid,
  .sheet-log-training-link {
    grid-template-columns: minmax(0, 1fr);
  }

  .sheet-log-calendar__day {
    min-height: 2.4rem;
  }
}
</style>
