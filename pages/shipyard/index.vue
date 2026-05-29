<script setup lang="ts">
import { storeToRefs } from 'pinia'
import aiIconUrl from '~/assets/open-spacecraft-icons/svg/light/AI - Light - 64x64.svg?url'
import airlockIconUrl from '~/assets/open-spacecraft-icons/svg/light/Airlock - Light - 64x64.svg?url'
import cabinIconUrl from '~/assets/open-spacecraft-icons/svg/light/Cabin - Light - 64x64.svg?url'
import cargoIconUrl from '~/assets/open-spacecraft-icons/svg/light/Cargo - Light - 64x64.svg?url'
import commandIconUrl from '~/assets/open-spacecraft-icons/svg/light/Command - Light - 64x64.svg?url'
import fuelIconUrl from '~/assets/open-spacecraft-icons/svg/light/Fuel - Light - 64x64.svg?url'
import jumpDriveIconUrl from '~/assets/open-spacecraft-icons/svg/light/Jumpdrive - Light - 64x64.svg?url'
import reactorCoreIconUrl from '~/assets/open-spacecraft-icons/svg/light/Reactor core - Light - 64x64.svg?url'
import sensorsIconUrl from '~/assets/open-spacecraft-icons/svg/light/Sensors - Light - 64x64.svg?url'
import suppliesIconUrl from '~/assets/open-spacecraft-icons/svg/light/Supplies - Light - 64x64.svg?url'
import terminalIconUrl from '~/assets/open-spacecraft-icons/svg/light/Intercom - Light - 64x64.svg?url'
import weaponSystemIconUrl from '~/assets/open-spacecraft-icons/svg/light/Weapon system - Light - 64x64.svg?url'
import workshopIconUrl from '~/assets/open-spacecraft-icons/svg/light/Workshop - Light - 64x64.svg?url'
import type { CustomShipAccommodationEntry, CustomShipCargoEntry, CustomShipDesign, CustomShipHullEnvelope, CustomShipLayoutCell, CustomShipLayoutDeck, CustomShipLayoutPlacement, CustomShipLayoutVisualRole, TravellerShipCategory, TravellerShipComponent, TravellerShipCrewRole, TravellerShipRecord, TravellerShipSoftware, TravellerShipWeaponSystem } from '~/types/ship'
import { useShipsStore } from '~/stores/ships'
import {
  calculateHullStep,
  formatShipCost,
  shipAdditionalHullRules,
  shipConstructionSummary,
  shipHullArmourRules,
  shipHullConfigurationRules,
  shipHullOptionRules,
  shipSpecialisedHullRules,
} from '~/utils/traveller/shipBuilder'

type ShipSortKey = 'name' | 'tons' | 'techLevel' | 'category' | 'jump' | 'thrust'
type ShipSortIcon = 'sort-asc' | 'sort-desc'
type ShipyardTabId = 'stock' | 'custom' | 'builder'
type ShipBuilderStep = { id: string, label: string, title: string, description: string }
type ShipBuilderStepStatus = {
  step: ShipBuilderStep
  index: number
  isUnlocked: boolean
  isComplete: boolean
  hasErrors: boolean
  hasWarnings: boolean
  title: string
}
type BuilderStepBrushMode = 'brush' | 'special' | 'none'
type BuilderCanvasOverlay = 'tool' | 'components' | 'ledger' | 'validation' | ''
type DeckConfirmAction = 'create' | 'duplicate' | 'delete' | ''
type HullRedesignSnapshot = {
  tons: number
  configuration: string
}
type ShapeToolId = 'select' | 'rectangle' | 'paint' | 'erase' | 'reshape'
type ShapeToolGroup = {
  id: 'select' | 'footprint'
  label: string
  tools: ShapeTool[]
}
type ShapeTool = { id: ShapeToolId, label: string, shortcut: string, title: string, icon: 'sliders' | 'copy' | 'plus' | 'trash' | 'wrench' }
type LayoutDragMode = 'move' | 'resize'
type LayoutDragState = {
  placementId: string
  mode: LayoutDragMode
  startClientX: number
  startClientY: number
  originX: number
  originY: number
  originWidth: number
  originHeight: number
}
type FootprintEditDragState = {
  placementId: string
  mode: Extract<ShapeToolId, 'paint' | 'erase'>
  element: HTMLElement
}
type FootprintRectDragState = {
  placementId: string
  mode: Extract<ShapeToolId, 'rectangle' | 'erase'>
  startCell: CustomShipLayoutCell
  currentCell: CustomShipLayoutCell
}
type HullEnvelopeDragState = {
  mode: Extract<ShapeToolId, 'paint' | 'erase' | 'rectangle'>
  startCell: CustomShipLayoutCell
  currentCell: CustomShipLayoutCell
}
type CanvasPanDragState = {
  startClientX: number
  startClientY: number
  originX: number
  originY: number
}
type FloatingPanelDragState = CanvasPanDragState
type BuilderHistorySnapshot = {
  buildDraft: CustomShipDesign
  activeDeckId: string
  selectedPlacementId: string
  activeBrushComponentId: string
  activeShapeTool: ShapeToolId
}
type PlacementRenderMeta = {
  cells: CustomShipLayoutCell[]
  cellKeys: Set<string>
  overlappingPlacementIds: Set<string>
  hue: number
}
type CargoVisualItem = {
  id: string
  cell: CustomShipLayoutCell
  hash: number
  spanX: number
  spanY: number
  leftCells: number
  topCells: number
  wide: boolean
}
type AccommodationVisualItem = {
  id: string
  kind: 'bed' | 'fresher' | 'galley' | 'desk' | 'capsule' | 'table' | 'seat' | 'locker'
  leftCells: number
  topCells: number
  spanX: number
  spanY: number
  angle: number
  fill: string
  border: string
  backgroundImage?: string
  borderRadius?: string
}

const shipsStore = useShipsStore()
const { customShips, referenceShips } = storeToRefs(shipsStore)
const activeShipyardTab = ref<ShipyardTabId>('stock')
const selectedCategory = ref<TravellerShipCategory | 'all'>('all')
const search = ref('')
const shipSortKey = ref<ShipSortKey>('name')
const shipSortDirection = ref<'asc' | 'desc'>('asc')
const selectedShipId = ref('')
const expandedShipId = ref('')
const categoryMenuOpen = ref(false)
const activeBuildStep = ref(0)
const activeDeckId = ref('main-deck')
const selectedPlacementId = ref('')
const builderCanvasOverlay = ref<BuilderCanvasOverlay>('')
const buildToolMenuOpen = ref(false)
const deckMenuOpen = ref(false)
const deckConfirmAction = ref<DeckConfirmAction>('')
const activeShapeTool = ref<ShapeToolId>('select')
const activeBrushComponentId = ref('')
const canvasZoom = ref(1)
const canvasPanX = ref(360)
const canvasPanY = ref(216)
const canvasPanDrag = ref<CanvasPanDragState | null>(null)
const builderOverlayX = ref(128)
const builderOverlayY = ref(96)
const builderOverlayDrag = ref<FloatingPanelDragState | null>(null)
const deckCanvasRef = ref<HTMLElement | null>(null)
const layoutDrag = ref<LayoutDragState | null>(null)
const footprintEditDrag = ref<FootprintEditDragState | null>(null)
const footprintRectDrag = ref<FootprintRectDragState | null>(null)
const hullEnvelopeDrag = ref<HullEnvelopeDragState | null>(null)
const footprintHoverCell = ref<CustomShipLayoutCell | null>(null)
const canvasPanFrame = ref(0)
const footprintHoverFrame = ref(0)
const pendingCanvasPan = ref<{ x: number, y: number } | null>(null)
const pendingFootprintHover = ref<CustomShipLayoutCell | null>(null)
const undoStack = ref<BuilderHistorySnapshot[]>([])
const redoStack = ref<BuilderHistorySnapshot[]>([])
const reachedBuildStepIds = ref<string[]>(['setup', 'hull'])
const hullRedesignSnapshot = ref<HullRedesignSnapshot | null>(null)
const hullRedesignConfirmOpen = ref(false)

const shipyardTabs: { id: ShipyardTabId, label: string }[] = [
  { id: 'stock', label: 'Stock Ships' },
  { id: 'custom', label: 'Custom Ships' },
  { id: 'builder', label: 'Ship Builder' },
]

const shipBuilderSteps: ShipBuilderStep[] = [
  { id: 'setup', label: 'Setup', title: 'Setup', description: 'Name the spacecraft and define the build brief.' },
  { id: 'hull', label: 'Hull', title: 'Hull', description: 'Choose tonnage, configuration, armour, and hull options.' },
  { id: 'drives', label: 'Drives', title: 'Drives', description: 'Select manoeuvre, reaction, and jump performance.' },
  { id: 'fuel', label: 'Fuel', title: 'Fuel', description: 'Review jump fuel, reaction fuel, and power plant endurance.' },
  { id: 'power-plant', label: 'Power', title: 'Power Plant', description: 'Size the power plant against routine, jump, and combat demand.' },
  { id: 'bridge', label: 'Bridge', title: 'Bridge', description: 'Choose bridge type, smaller bridge, and command bridge options.' },
  { id: 'computer', label: 'Computer', title: 'Computer', description: 'Choose computer, backup, and hardening options.' },
  { id: 'weapons', label: 'Weapons', title: 'Weapons', description: 'Reserve hardpoints and install weapons or screens.' },
  { id: 'sensors', label: 'Sensors', title: 'Sensors', description: 'Install the primary sensor suite.' },
  { id: 'options', label: 'Options', title: 'Options', description: 'Install ship systems and other High Guard options.' },
  { id: 'crew', label: 'Crew', title: 'Crew', description: 'Review commercial or military crew requirements.' },
  { id: 'cargo', label: 'Cargo', title: 'Cargo', description: 'Allocate cargo space and cargo-specific deck footprints.' },
  { id: 'accommodations', label: 'Accomm.', title: 'Accommodations', description: 'Assign staterooms, berths, common areas, and crew quarters.' },
  { id: 'review', label: 'Review', title: 'Review', description: 'Check tonnage, power, cost, and validation notes before saving.' },
]

const shapeTools: ShapeTool[] = [
  { id: 'select', label: 'Move', shortcut: 'V', title: 'Select and move footprint', icon: 'sliders' },
  { id: 'rectangle', label: 'Fill', shortcut: 'R', title: 'Fill rectangle with active brush', icon: 'copy' },
  { id: 'paint', label: 'Paint', shortcut: 'B', title: 'Paint cells into footprint', icon: 'plus' },
  { id: 'erase', label: 'Erase', shortcut: 'E', title: 'Erase cells or drag an erase rectangle', icon: 'trash' },
  { id: 'reshape', label: 'Shape', shortcut: 'A', title: 'Reshape footprint tool', icon: 'wrench' },
]

const shapeToolGroups: ShapeToolGroup[] = [
  {
    id: 'select',
    label: 'Select',
    tools: shapeTools.filter((tool) => tool.id === 'select'),
  },
  {
    id: 'footprint',
    label: 'Footprint',
    tools: shapeTools.filter((tool) => tool.id !== 'select'),
  },
]

const createDefaultLayoutDeck = (): CustomShipLayoutDeck => ({
  id: 'main-deck',
  name: 'Main Deck',
  gridColumns: 24,
  gridRows: 16,
  tonsPerCell: 1,
})

const createLayoutDeck = (deckNumber: number): CustomShipLayoutDeck => ({
  id: `deck-${Date.now()}`,
  name: `Deck ${deckNumber}`,
  gridColumns: activeDeck.value.gridColumns,
  gridRows: activeDeck.value.gridRows,
  tonsPerCell: activeDeck.value.tonsPerCell,
})

const createBlankCustomShipDesign = (): CustomShipDesign => {
  const now = new Date().toISOString()
  const defaultDeck = createDefaultLayoutDeck()
  return {
    id: `custom-ship-${Date.now()}`,
    userId: 'local',
    createdAt: now,
    updatedAt: now,
    name: 'New Custom Spacecraft',
    sourceId: 'custom-player',
    sourceName: 'Custom Ship Builder',
    category: 'other',
    role: 'Custom spacecraft',
    tons: 200,
    techLevel: 12,
    jump: 'Jump 1',
    thrust: 'Thrust 1',
    crew: 'Pending',
    cost: 'Pending',
    traits: [],
    description: 'Draft High Guard spacecraft.',
    buildBrief: {
      role: 'Custom spacecraft',
      designMode: 'new',
      shipyardTechLevel: 12,
      crewMode: 'commercial',
      targetBudgetMCr: '',
      targetTonnage: 200,
      targetJump: 1,
      targetThrust: 1,
      crewTarget: '',
      passengerTarget: '',
      cargoTarget: '',
      notes: '',
    },
    hull: {
      configuration: 'standard',
      armourType: '',
      armourProtection: 0,
      specialisedHullTypes: [],
      additionalHullTypes: [],
      hullOptions: [],
    },
    drives: {
      manoeuvreDriveRating: 1,
      reactionDriveRating: 0,
      jumpDriveRating: 1,
      usesReactionDrive: false,
    },
    fuel: {
      jumpFuelTons: 0,
      reactionFuelTons: 0,
      reactionFuelHours: 0,
      powerPlantFuelTons: 0,
      powerPlantEnduranceWeeks: 4,
    },
    powerPlant: {
      type: 'fusion-tl12',
      tons: 6,
    },
    bridge: {
      type: 'standard',
      smallerBridge: false,
      commandBridge: false,
    },
    computer: {
      model: 'computer-5',
      backupModel: '',
      jumpControlSpecialisation: false,
      hardenedSystems: false,
    },
    sensors: {
      type: 'civilian-grade',
    },
    weaponSystems: [],
    screenSystems: [],
    optionSystems: [],
    crewRoles: [],
    accommodations: [],
    cargoEntries: [{ id: 'main-cargo', label: 'Cargo', tons: 60 }],
    software: [],
    layout: {
      enabled: true,
      decks: [defaultDeck],
      placements: [],
      hullEnvelope: {
        deckId: defaultDeck.id,
        cells: [],
        locked: false,
        preset: 'standard',
        configuration: 'standard',
        hullTons: 0,
        tonsPerCell: defaultDeck.tonsPerCell,
      },
      unplacedComponentIds: [],
    },
  }
}

const createBuilderEntryId = (prefix: string) => `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`
const createWeaponSystem = (): TravellerShipWeaponSystem => ({
  id: createBuilderEntryId('weapon'),
  name: 'Beam Laser',
  mount: 'Turret',
  count: 1,
  hardpointsUsed: 1,
  tons: 1,
  power: 4,
  traits: ['Laser'],
})
const createScreenSystem = (): TravellerShipComponent => ({
  id: createBuilderEntryId('screen'),
  kind: 'screen',
  name: 'Sandcaster Screen',
  tons: 1,
  powerDraw: 1,
  hardpointsUsed: 1,
  placementPolicy: 'exterior',
  traits: ['Screen'],
})
const createOptionSystem = (): TravellerShipComponent => ({
  id: createBuilderEntryId('option'),
  kind: 'option',
  name: 'Workshop',
  tons: 6,
  powerDraw: 0,
  placementPolicy: 'optional-area',
  traits: ['Ship Option'],
})
const createCrewRole = (): TravellerShipCrewRole => ({
  role: 'Crew',
  skill: '',
  count: 1,
  salaryCredits: 0,
  mode: 'either',
})
const accommodationDefaults: Record<CustomShipAccommodationEntry['type'], { label: string, tonsEach: number, powerDraw?: number }> = {
  stateroom: { label: 'Stateroom', tonsEach: 4 },
  'high-stateroom': { label: 'High Stateroom', tonsEach: 6 },
  'luxury-stateroom': { label: 'Luxury Stateroom', tonsEach: 10 },
  'psion-stateroom': { label: 'Psion Stateroom', tonsEach: 4 },
  'low-berth': { label: 'Low Berth', tonsEach: 0.5 },
  'emergency-low-berth': { label: 'Emergency Low Berth', tonsEach: 1, powerDraw: 1 },
  'common-area': { label: 'Common Area', tonsEach: 1 },
  'acceleration-bench': { label: 'Acceleration Bench', tonsEach: 1 },
  'acceleration-seat': { label: 'Acceleration Seat', tonsEach: 0.5 },
  barracks: { label: 'Barracks', tonsEach: 1 },
  brig: { label: 'Brig', tonsEach: 4 },
  'cabin-space': { label: 'Cabin Space', tonsEach: 1.5 },
  other: { label: 'Crew Quarters', tonsEach: 4 },
}
const createAccommodationEntry = (type: CustomShipAccommodationEntry['type'] = 'stateroom'): CustomShipAccommodationEntry => {
  const defaults = accommodationDefaults[type]
  return {
    id: createBuilderEntryId('accommodation'),
    type,
    label: defaults.label,
    count: 1,
    tonsEach: defaults.tonsEach,
    powerDraw: defaults.powerDraw,
  }
}
const createCargoEntry = (): CustomShipCargoEntry => ({
  id: createBuilderEntryId('cargo'),
  label: 'Cargo',
  tons: 0,
})
const accommodationComponentId = (entry: Pick<CustomShipAccommodationEntry, 'id'>) => `accommodation-${entry.id}`
const cargoComponentId = (entry: Pick<CustomShipCargoEntry, 'id'>) => `cargo-${entry.id}`
const updateAccommodationType = (entry: CustomShipAccommodationEntry, type: CustomShipAccommodationEntry['type']) => {
  const defaults = accommodationDefaults[type]
  entry.type = type
  entry.label = defaults.label
  entry.tonsEach = defaults.tonsEach
  entry.powerDraw = defaults.powerDraw
}
const createSoftwareEntry = (): TravellerShipSoftware => ({
  id: createBuilderEntryId('software'),
  name: 'Library',
  bandwidth: 0,
})

const buildDraft = ref<CustomShipDesign>(createBlankCustomShipDesign())
const cloneBuilderState = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const createBuilderHistorySnapshot = (): BuilderHistorySnapshot => ({
  buildDraft: cloneBuilderState(buildDraft.value),
  activeDeckId: activeDeckId.value,
  selectedPlacementId: selectedPlacementId.value,
  activeBrushComponentId: activeBrushComponentId.value,
  activeShapeTool: activeShapeTool.value,
})
const restoreBuilderHistorySnapshot = (snapshot: BuilderHistorySnapshot) => {
  buildDraft.value = cloneBuilderState(snapshot.buildDraft)
  activeDeckId.value = snapshot.activeDeckId
  selectedPlacementId.value = snapshot.selectedPlacementId
  activeBrushComponentId.value = snapshot.activeBrushComponentId
  activeShapeTool.value = snapshot.activeShapeTool
  deckConfirmAction.value = ''
  footprintEditDrag.value = null
  footprintRectDrag.value = null
  layoutDrag.value = null
}
const rememberBuilderHistory = () => {
  undoStack.value.push(createBuilderHistorySnapshot())
  if (undoStack.value.length > 100) undoStack.value.shift()
  redoStack.value = []
}
const undoBuilderAction = () => {
  const snapshot = undoStack.value.pop()
  if (!snapshot) return
  redoStack.value.push(createBuilderHistorySnapshot())
  restoreBuilderHistorySnapshot(snapshot)
}
const redoBuilderAction = () => {
  const snapshot = redoStack.value.pop()
  if (!snapshot) return
  undoStack.value.push(createBuilderHistorySnapshot())
  restoreBuilderHistorySnapshot(snapshot)
}
const placementTonsForDraft = (draft: CustomShipDesign, placement: CustomShipLayoutPlacement) => {
  const deck = draft.layout.decks.find((entry) => entry.id === placement.deckId)
  const tonsPerCell = Math.max(0.25, Number(deck?.tonsPerCell) || 1)
  return placementCellCount(placement) * tonsPerCell
}
const drawnCargoTonsForEntry = (entryId: string, draft: CustomShipDesign = buildDraft.value) => draft.layout.placements
  .filter((placement) => placement.sourceEntryId === entryId || placement.componentId === `cargo-${entryId}`)
  .reduce((total, placement) => total + placementTonsForDraft(draft, placement), 0)
const layoutDerivedBuildDraft = computed<CustomShipDesign>(() => ({
  ...buildDraft.value,
  cargoEntries: buildDraft.value.cargoEntries.map((entry) => ({
    ...entry,
    tons: drawnCargoTonsForEntry(entry.id),
  })),
}))
const activeBuilderStep = computed(() => shipBuilderSteps[activeBuildStep.value] ?? shipBuilderSteps[0])
const hullStepResult = computed(() => calculateHullStep({
  shipTons: buildDraft.value.tons,
  techLevel: buildDraft.value.techLevel ?? buildDraft.value.buildBrief.shipyardTechLevel,
  configurationId: buildDraft.value.hull.configuration,
  armourTypeId: buildDraft.value.hull.armourType,
  armourProtection: buildDraft.value.hull.armourProtection,
  specialisedHullTypeIds: buildDraft.value.hull.specialisedHullTypes,
  additionalHullTypeIds: buildDraft.value.hull.additionalHullTypes,
  hullOptionIds: buildDraft.value.hull.hullOptions,
}))
const builderStepStatuses = computed<ShipBuilderStepStatus[]>(() => {
  const reached = new Set(reachedBuildStepIds.value)
  const hullComplete = hullStepResult.value.isComplete

  return shipBuilderSteps.map((step, index) => {
    const isSetup = step.id === 'setup'
    const isHull = step.id === 'hull'
    const hasReachedStep = reached.has(step.id)
    const previousStep = shipBuilderSteps[index - 1]
    const isNextReachable = Boolean(previousStep && reached.has(previousStep.id))
    const passesHullGate = isSetup || isHull || hasReachedStep || hullComplete
    const isUnlocked = isSetup || isHull || hasReachedStep || (isNextReachable && passesHullGate)
    const isComplete = isSetup || (isHull ? hullComplete : hasReachedStep)
    const hasErrors = isHull && hullStepResult.value.errors.length > 0
    const hasWarnings = isHull && hullStepResult.value.warnings.length > 0
    const lockedReason = isUnlocked ? '' : 'Complete Step 1: Hull before editing this step.'

    return {
      step,
      index,
      isUnlocked,
      isComplete,
      hasErrors,
      hasWarnings,
      title: lockedReason || `${index + 1}. ${step.title}`,
    }
  })
})
const builderStepStatusById = computed(() => new Map(builderStepStatuses.value.map((status) => [status.step.id, status])))
const hasDownstreamHullWork = computed(() => (
  reachedBuildStepIds.value.some((stepId) => !['setup', 'hull'].includes(stepId))
  || buildDraft.value.layout.placements.length > 0
))
const buildSummary = computed(() => shipConstructionSummary(layoutDerivedBuildDraft.value))
const buildComponentById = computed(() => new Map(buildSummary.value.components.map((component) => [component.id, component])))
const activeDeck = computed<CustomShipLayoutDeck>(() => {
  if (!buildDraft.value.layout.decks.length) buildDraft.value.layout.decks.push(createDefaultLayoutDeck())
  return buildDraft.value.layout.decks.find((deck) => deck.id === activeDeckId.value) ?? buildDraft.value.layout.decks[0] ?? createDefaultLayoutDeck()
})
const placeableComponentPolicies = ['required-area', 'derived-area', 'optional-area']
const placeableComponents = computed(() => buildSummary.value.components.filter((component) => (
  (positiveComponentTons(component) > 0 || component.kind === 'cargo')
  && placeableComponentPolicies.includes(component.placementPolicy ?? 'abstract')
)))
const exteriorComponents = computed(() => buildSummary.value.components.filter((component) => positiveComponentTons(component) > 0 && component.placementPolicy === 'exterior'))
const ledgerOnlyComponents = computed(() => buildSummary.value.components.filter((component) => !placeableComponents.value.some((placeable) => placeable.id === component.id) && component.placementPolicy !== 'exterior'))
const activeDeckPlacements = computed(() => buildDraft.value.layout.placements.filter((placement) => placement.deckId === activeDeck.value.id))
const activeDeckPlacedTons = computed(() => activeDeckPlacements.value.reduce((total, placement) => total + placementTons(placement, activeDeck.value), 0))
const selectedLayoutPlacement = computed(() => activeDeckPlacements.value.find((placement) => placement.id === selectedPlacementId.value) ?? null)
const selectedPlacementComponent = computed(() => selectedLayoutPlacement.value ? placementComponent(selectedLayoutPlacement.value) : null)
const selectedPlacementVisualLabel = computed(() => selectedLayoutPlacement.value ? placementVisualLabel(selectedLayoutPlacement.value) : '')
const activeBrushComponent = computed(() => placeableComponents.value.find((component) => component.id === activeBrushComponentId.value) ?? null)
const builderStepSpecialToolLabel = (stepId: string) => {
  const labels: Record<string, string> = {
    hull: 'Hull outline tool pending',
    weapons: 'Exterior hardpoint tool pending',
    computer: 'Distributed system',
    crew: 'Use accommodations',
    setup: 'Build metadata',
    review: 'Validation only',
  }
  return labels[stepId] ?? 'Ledger-only step'
}
const builderStepBrushMode = (stepId: string): BuilderStepBrushMode => {
  if (builderStepBrushComponent(stepId)) return 'brush'
  if (['hull', 'weapons'].includes(stepId)) return 'special'
  return 'none'
}
const builderStepBrushTitle = (step: ShipBuilderStep) => {
  const component = builderStepBrushComponent(step.id)
  if (component) return `Brush: ${component.name}`
  return builderStepSpecialToolLabel(step.id)
}
const builderStepBrushDotClass = (stepId: string) => {
  const mode = builderStepBrushMode(stepId)
  if (mode === 'brush') return ''
  if (mode === 'special') return 'border-dashed bg-amber-300/20 text-amber-200'
  return 'opacity-25'
}
const deckConfirmCopy = computed(() => {
  const copy: Record<Exclude<DeckConfirmAction, ''>, { title: string, body: string, confirm: string }> = {
    create: {
      title: 'Create Deck',
      body: `Create a new deck using ${activeDeck.value.name}'s current scale settings?`,
      confirm: 'Create',
    },
    duplicate: {
      title: 'Duplicate Deck',
      body: `Duplicate ${activeDeck.value.name} and copy its placed footprints?`,
      confirm: 'Duplicate',
    },
    delete: {
      title: 'Delete Deck',
      body: `Delete ${activeDeck.value.name} and remove every footprint on it?`,
      confirm: 'Delete',
    },
  }
  return deckConfirmAction.value ? copy[deckConfirmAction.value] : null
})
const builderStepBrushComponent = (stepId: string) => {
  const componentMatchers: Record<string, (component: TravellerShipComponent) => boolean> = {
    hull: (component) => component.id === 'hull',
    drives: (component) => ['manoeuvre-drive', 'reaction-drive', 'jump-drive'].includes(component.id),
    fuel: (component) => component.id === 'fuel',
    'power-plant': (component) => component.id === 'power-plant',
    bridge: (component) => component.id === 'bridge',
    computer: (component) => component.id === 'computer',
    sensors: (component) => component.id === 'sensors',
    weapons: (component) => component.kind === 'weapon' || component.kind === 'screen',
    options: (component) => component.kind === 'option',
    crew: (component) => component.kind === 'crew',
    accommodations: (component) => component.kind === 'accommodation',
    cargo: (component) => component.kind === 'cargo',
  }
  const matchesStep = componentMatchers[stepId]
  return matchesStep ? placeableComponents.value.find(matchesStep) ?? null : null
}
const layoutValidationNotes = computed(() => {
  const notes: string[] = []
  for (const component of placeableComponents.value) {
    const placedTons = placedTonsForComponent(component.id)
    if (placedTons <= 0) notes.push(`${component.name} has not been placed on the deck grid.`)
    else if (placedTons < positiveComponentTons(component)) notes.push(`${component.name} is undersized on the deck grid.`)
  }
  for (const placement of buildDraft.value.layout.placements) {
    const component = buildComponentById.value.get(placement.componentId)
    if (!component) continue
    const overlapping = overlappingPlacements(placement)
    if (overlapping.length) notes.push(`${component.name} overlaps ${overlapping.map((entry) => placementComponent(entry)?.name ?? entry.componentId).join(', ')}.`)
  }
  return notes
})

const categories: { id: TravellerShipCategory | 'all', label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'merchant', label: 'Merchant' },
  { id: 'civilian', label: 'Civilian' },
  { id: 'military', label: 'Military' },
  { id: 'courier', label: 'Courier' },
  { id: 'exploration', label: 'Exploration' },
  { id: 'luxury', label: 'Luxury' },
  { id: 'cruiser', label: 'Cruisers' },
  { id: 'other', label: 'Other' },
]

const sortableShipColumns: { key: ShipSortKey, label: string }[] = [
  { key: 'name', label: 'Ship' },
  { key: 'tons', label: 'Tons' },
  { key: 'techLevel', label: 'TL' },
  { key: 'category', label: 'Category' },
  { key: 'jump', label: 'Jump' },
  { key: 'thrust', label: 'Thrust' },
]

const compareValues = (firstValue: unknown, secondValue: unknown, direction: number) => {
  if (firstValue === null || firstValue === undefined) return 1
  if (secondValue === null || secondValue === undefined) return -1
  if (typeof firstValue === 'number' || typeof secondValue === 'number') {
    const left = typeof firstValue === 'number' ? firstValue : Number(firstValue)
    const right = typeof secondValue === 'number' ? secondValue : Number(secondValue)
    return (left - right) * direction
  }
  return String(firstValue ?? '').localeCompare(String(secondValue ?? ''), undefined, { numeric: true, sensitivity: 'base' }) * direction
}

const sortReferenceShips = (ships: TravellerShipRecord[]) => {
  const direction = shipSortDirection.value === 'asc' ? 1 : -1
  const key = shipSortKey.value
  return [...ships].sort((first, second) => compareValues(first[key], second[key], direction))
}

const filteredReferenceShips = computed(() => sortReferenceShips(referenceShips.value.filter((ship) => {
  const matchesCategory = selectedCategory.value === 'all' || ship.category === selectedCategory.value
  const query = search.value.trim().toLowerCase()
  const matchesSearch = !query || [
    ship.name,
    ship.role,
    ship.description,
    ship.traits.join(' '),
    ship.sourceName,
  ].filter(Boolean).join(' ').toLowerCase().includes(query)
  return matchesCategory && matchesSearch
})))

const selectedShip = computed(() => {
  if (selectedShipId.value) return referenceShips.value.find((ship) => ship.id === selectedShipId.value) ?? filteredReferenceShips.value[0] ?? null
  return filteredReferenceShips.value[0] ?? null
})

watch(filteredReferenceShips, (ships) => {
  if (!ships.length) {
    selectedShipId.value = ''
    return
  }
  if (!ships.some((entry) => entry.id === selectedShipId.value)) selectedShipId.value = ships[0]?.id ?? ''
}, { immediate: true })

watch(() => buildDraft.value.techLevel, (techLevel) => {
  buildDraft.value.buildBrief.shipyardTechLevel = Number(techLevel) || 0
})

const setShipSort = (key: ShipSortKey) => {
  if (shipSortKey.value === key) {
    shipSortDirection.value = shipSortDirection.value === 'asc' ? 'desc' : 'asc'
    return
  }
  shipSortKey.value = key
  shipSortDirection.value = 'asc'
}

const toggleExpandedShip = (shipId: string) => {
  expandedShipId.value = expandedShipId.value === shipId ? '' : shipId
  selectedShipId.value = shipId
}

const selectShipCategory = (categoryId: TravellerShipCategory | 'all') => {
  selectedCategory.value = categoryId
  categoryMenuOpen.value = false
}

const shipSortIndicator = (key: ShipSortKey): ShipSortIcon | null => {
  if (shipSortKey.value !== key) return null
  return shipSortDirection.value === 'asc' ? 'sort-asc' : 'sort-desc'
}

const selectBuilderStep = (index: number) => {
  const step = shipBuilderSteps[index]
  if (!step) return
  const status = builderStepStatusById.value.get(step.id)
  if (status && !status.isUnlocked) return
  activeBuildStep.value = index
  if (!reachedBuildStepIds.value.includes(step.id)) reachedBuildStepIds.value = [...reachedBuildStepIds.value, step.id]
  builderCanvasOverlay.value = 'tool'
  const component = builderStepBrushComponent(step.id)
  if (component) selectBrushComponent(component, false)
}
const captureHullRedesignSnapshot = () => {
  hullRedesignSnapshot.value = {
    tons: Number(buildDraft.value.tons) || 0,
    configuration: buildDraft.value.hull.configuration,
  }
}
const checkHullRedesignChange = () => {
  const snapshot = hullRedesignSnapshot.value
  if (!snapshot) return
  const changed = snapshot.tons !== buildDraft.value.tons || snapshot.configuration !== buildDraft.value.hull.configuration
  if (changed && hasDownstreamHullWork.value) hullRedesignConfirmOpen.value = true
  else hullRedesignSnapshot.value = null
}
const confirmHullRedesign = () => {
  hullRedesignConfirmOpen.value = false
  hullRedesignSnapshot.value = null
}
const cancelHullRedesign = () => {
  if (hullRedesignSnapshot.value) {
    buildDraft.value.tons = hullRedesignSnapshot.value.tons
    buildDraft.value.hull.configuration = hullRedesignSnapshot.value.configuration
  }
  hullRedesignConfirmOpen.value = false
  hullRedesignSnapshot.value = null
}
const toggleBuilderOverlay = (overlay: Exclude<BuilderCanvasOverlay, ''>) => {
  builderCanvasOverlay.value = builderCanvasOverlay.value === overlay ? '' : overlay
  buildToolMenuOpen.value = false
}

const builderStepIconUrl = (stepId: string) => {
  const icons: Record<string, string> = {
    setup: terminalIconUrl,
    hull: commandIconUrl,
    drives: jumpDriveIconUrl,
    fuel: fuelIconUrl,
    'power-plant': reactorCoreIconUrl,
    bridge: commandIconUrl,
    computer: aiIconUrl,
    sensors: sensorsIconUrl,
    weapons: weaponSystemIconUrl,
    options: workshopIconUrl,
    crew: cabinIconUrl,
    accommodations: cabinIconUrl,
    cargo: cargoIconUrl,
    review: suppliesIconUrl,
  }
  return icons[stepId] ?? terminalIconUrl
}
const categoryLabel = (category: string) => category.split('-').map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join(' ')
const sourceLabel = (ship: TravellerShipRecord) => `${ship.sourceName ?? ship.sourceId}${ship.sourcePage ? ` p. ${ship.sourcePage}` : ''}`
const componentKindLabel = (kind: string) => categoryLabel(kind)
const componentIconUrl = (component: TravellerShipComponent) => {
  const icons: Record<string, string> = {
    hull: commandIconUrl,
    armour: commandIconUrl,
    'hull-option': workshopIconUrl,
    'm-drive': jumpDriveIconUrl,
    'reaction-drive': jumpDriveIconUrl,
    'j-drive': jumpDriveIconUrl,
    fuel: fuelIconUrl,
    'power-plant': reactorCoreIconUrl,
    bridge: commandIconUrl,
    computer: aiIconUrl,
    sensor: sensorsIconUrl,
    weapon: weaponSystemIconUrl,
    screen: weaponSystemIconUrl,
    option: workshopIconUrl,
    crew: cabinIconUrl,
    accommodation: cabinIconUrl,
    cargo: cargoIconUrl,
    software: terminalIconUrl,
    'carried-craft': airlockIconUrl,
  }
  return icons[component.kind] ?? suppliesIconUrl
}
function sourceEntryIdForComponent(component: TravellerShipComponent) {
  if (component.kind === 'accommodation') return component.id.replace(/^accommodation-/, '')
  if (component.kind === 'cargo') return component.id.replace(/^cargo-/, '')
  return undefined
}
function placementVisualRoleForComponent(component: TravellerShipComponent): CustomShipLayoutVisualRole | undefined {
  const sourceEntryId = sourceEntryIdForComponent(component)
  if (component.kind === 'cargo') return 'cargo'
  if (component.kind !== 'accommodation' || !sourceEntryId) return undefined

  const accommodation = buildDraft.value.accommodations.find((entry) => entry.id === sourceEntryId)
  if (!accommodation) return undefined
  return accommodation.type === 'other' ? 'crew-quarters' : accommodation.type
}
function visualRoleLabel(role: CustomShipLayoutVisualRole | undefined) {
  const labels: Record<CustomShipLayoutVisualRole, string> = {
    stateroom: 'Stateroom',
    'high-stateroom': 'High Stateroom',
    'luxury-stateroom': 'Luxury Stateroom',
    'psion-stateroom': 'Psion Stateroom',
    'low-berth': 'Low Berth',
    'emergency-low-berth': 'Emergency Low Berth',
    'common-area': 'Common Area',
    'acceleration-bench': 'Acceleration Bench',
    'acceleration-seat': 'Acceleration Seat',
    barracks: 'Barracks',
    brig: 'Brig',
    'cabin-space': 'Cabin Space',
    'crew-quarters': 'Crew Quarters',
    cargo: 'Cargo',
  }
  return role ? labels[role] : ''
}
function placementVisualLabel(placement: CustomShipLayoutPlacement) {
  return visualRoleLabel(placementVisualRole(placement))
}
function placementVisualRole(placement: CustomShipLayoutPlacement) {
  const component = placementComponent(placement)
  return placement.visualRole ?? (component ? placementVisualRoleForComponent(component) : undefined)
}
const placementIconUrl = (placement: CustomShipLayoutPlacement) => {
  const component = placementComponent(placement)
  return component ? componentIconUrl(component) : suppliesIconUrl
}
const formatLedgerNumber = (value: number | undefined) => typeof value === 'number' ? value.toLocaleString() : '—'
const positiveComponentTons = (component: TravellerShipComponent) => Math.max(0, component.tons)
const layoutCellTons = (deck: CustomShipLayoutDeck | undefined) => Math.max(0.25, Number(deck?.tonsPerCell) || 1)
const baseCanvasCellSize = 24
const canvasWorkspaceRadius = 120
const canvasWorkspaceCells = (canvasWorkspaceRadius * 2) + 1
const canvasCellSize = computed(() => Math.round(baseCanvasCellSize * canvasZoom.value))
const zoomPercent = computed(() => Math.round(canvasZoom.value * 100))
const componentRequiredCells = (component: TravellerShipComponent) => Math.max(1, Math.ceil(positiveComponentTons(component) / layoutCellTons(activeDeck.value)))
const rectangularFootprintCells = (width: number, height: number): CustomShipLayoutCell[] => Array.from({ length: Math.max(1, height) }, (_row, y) => (
  Array.from({ length: Math.max(1, width) }, (_column, x) => ({ x, y }))
)).flat()
const centeredShapeCells = (width: number, height: number, targetCells: number, preset: string) => {
  const cells: Array<CustomShipLayoutCell & { score: number }> = []
  const centerX = (width - 1) / 2
  const centerY = (height - 1) / 2
  const maxX = Math.max(1, centerX)
  const maxY = Math.max(1, centerY)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const nx = (x - centerX) / maxX
      const ny = (y - centerY) / maxY
      const distance = Math.sqrt((nx * nx) + (ny * ny))
      const diagonal = Math.abs(nx) + Math.abs(ny)
      const seed = Math.sin((x * 12.9898) + (y * 78.233)) * 43758.5453
      const noise = seed - Math.floor(seed)
      let include = true

      if (preset === 'streamlined') include = Math.abs(ny) <= (0.2 + (0.78 * (1 - ((nx + 1) / 2))))
      else if (preset === 'sphere') include = distance <= 1.02
      else if (preset === 'close-structure') include = Math.abs(ny) <= 0.42 || (Math.abs(nx) > 0.46 && Math.abs(ny) <= 0.72)
      else if (preset === 'dispersed-structure') include = distance <= 0.42 || (Math.abs(nx) > 0.5 && Math.abs(ny) <= 0.44) || (Math.abs(ny) > 0.48 && Math.abs(nx) <= 0.32)
      else if (preset === 'planetoid' || preset === 'buffered-planetoid') include = distance <= (0.82 + (noise * 0.18))

      if (include) cells.push({ x: x - Math.floor(width / 2), y: y - Math.floor(height / 2), score: distance + (diagonal * 0.08) + (noise * 0.04) })
    }
  }

  const sourceCells = cells.length >= targetCells ? cells : rectangularFootprintCells(width, height).map((cell) => ({
    x: cell.x - Math.floor(width / 2),
    y: cell.y - Math.floor(height / 2),
    score: Math.hypot(cell.x - centerX, cell.y - centerY),
  }))

  return sourceCells
    .sort((first, second) => first.score - second.score)
    .slice(0, targetCells)
    .map(({ x, y }) => ({ x, y }))
    .sort((first, second) => first.y - second.y || first.x - second.x)
}
const createHullEnvelope = (): CustomShipHullEnvelope => {
  const tonsPerCell = layoutCellTons(activeDeck.value)
  const targetCells = Math.max(1, Math.round(hullStepResult.value.usableTons / tonsPerCell))
  const aspectByConfiguration: Record<string, number> = {
    standard: 1.7,
    streamlined: 2.9,
    sphere: 1,
    'close-structure': 1.55,
    'dispersed-structure': 1.9,
    planetoid: 1.2,
    'buffered-planetoid': 1.2,
  }
  const preset = hullStepResult.value.configuration.id
  const aspect = aspectByConfiguration[preset] ?? 1.6
  const width = Math.min(canvasWorkspaceCells, Math.max(1, Math.ceil(Math.sqrt(targetCells * aspect))))
  const height = Math.min(canvasWorkspaceCells, Math.max(1, Math.ceil(targetCells / width)))

  return {
    deckId: activeDeck.value.id,
    cells: centeredShapeCells(width, height, targetCells, preset),
    locked: false,
    preset,
    configuration: hullStepResult.value.configuration.id,
    hullTons: hullStepResult.value.usableTons,
    tonsPerCell,
  }
}
const ensureHullEnvelope = () => {
  if (!hullStepResult.value.isComplete) return
  const current = buildDraft.value.layout.hullEnvelope
  const needsEnvelope = !current
    || !current.cells.length
    || !current.locked && (
      current.deckId !== activeDeck.value.id
      || current.configuration !== hullStepResult.value.configuration.id
      || current.hullTons !== hullStepResult.value.usableTons
      || current.tonsPerCell !== layoutCellTons(activeDeck.value)
    )
  if (needsEnvelope) buildDraft.value.layout.hullEnvelope = createHullEnvelope()
}
const activeHullEnvelope = computed(() => {
  const envelope = buildDraft.value.layout.hullEnvelope
  if (!envelope || envelope.deckId !== activeDeck.value.id || !hullStepResult.value.isComplete) return null
  return envelope
})
const isHullShapeEditing = computed(() => activeBuilderStep.value.id === 'hull' && activeHullEnvelope.value && ['paint', 'erase', 'rectangle'].includes(activeShapeTool.value))
const hullEnvelopeCellStyle = (cell: CustomShipLayoutCell) => ({
  gridColumn: `${cell.x + canvasWorkspaceRadius + 1}`,
  gridRow: `${cell.y + canvasWorkspaceRadius + 1}`,
})
const hullEnvelopeTonsShown = computed(() => (activeHullEnvelope.value?.cells.length ?? 0) * layoutCellTons(activeDeck.value))
const hullEnvelopeDelta = computed(() => hullEnvelopeTonsShown.value - hullStepResult.value.usableTons)
const hullEnvelopeLabel = computed(() => `${formatLedgerNumber(hullStepResult.value.usableTons)} usable tons / ${formatLedgerNumber(hullEnvelopeTonsShown.value)} tons shown`)
const hullEnvelopeStatusClass = computed(() => {
  const tolerance = Math.max(1, hullStepResult.value.usableTons * 0.02)
  if (Math.abs(hullEnvelopeDelta.value) <= tolerance) return 'border-cyan-100/50 bg-cyan-400/10'
  if (Math.abs(hullEnvelopeDelta.value) <= tolerance * 2) return 'border-amber-200/55 bg-amber-300/10'
  return 'border-rose-200/55 bg-rose-400/10'
})
const hullEnvelopePreviewCells = computed(() => {
  if (hullEnvelopeDrag.value?.mode === 'rectangle') return cellsInRect(hullEnvelopeDrag.value.startCell, hullEnvelopeDrag.value.currentCell)
  if (footprintHoverCell.value && isHullShapeEditing.value) return [footprintHoverCell.value]
  return []
})
const hullEnvelopeCellKeys = computed(() => new Set(activeHullEnvelope.value?.cells.map(cellKey) ?? []))
watch([
  () => hullStepResult.value.isComplete,
  () => hullStepResult.value.usableTons,
  () => hullStepResult.value.configuration.id,
  () => activeDeck.value.id,
  () => activeDeck.value.tonsPerCell,
], ensureHullEnvelope, { immediate: true })
const compactFootprintCells = (count: number) => {
  const cellCount = Math.max(1, count)
  const width = Math.max(1, Math.ceil(Math.sqrt(cellCount)))
  return Array.from({ length: cellCount }, (_entry, index) => ({
    x: index % width,
    y: Math.floor(index / width),
  }))
}
const cellsInRect = (first: CustomShipLayoutCell, second: CustomShipLayoutCell) => {
  const minX = Math.min(first.x, second.x)
  const maxX = Math.max(first.x, second.x)
  const minY = Math.min(first.y, second.y)
  const maxY = Math.max(first.y, second.y)
  const cells: CustomShipLayoutCell[] = []
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) cells.push({ x, y })
  }
  return cells
}
const cellKey = (cell: CustomShipLayoutCell) => `${cell.x}:${cell.y}`
const normaliseFootprintCells = (cells: CustomShipLayoutCell[]) => [...new Map(cells.map((cell) => [`${cell.x}:${cell.y}`, cell])).values()]
  .sort((first, second) => first.y - second.y || first.x - second.x)
const placementFootprintCells = (placement: CustomShipLayoutPlacement) => placement.footprintCells?.length
  ? placement.footprintCells
  : rectangularFootprintCells(placement.width, placement.height)
const placementCellCount = (placement: CustomShipLayoutPlacement) => placementFootprintCells(placement).length
const placementTons = (placement: CustomShipLayoutPlacement, deck: CustomShipLayoutDeck | undefined = activeDeck.value) => placementCellCount(placement) * layoutCellTons(deck)
const selectedPlacementCellCount = computed(() => selectedLayoutPlacement.value ? placementCellCount(selectedLayoutPlacement.value) : 0)
const selectedPlacementTons = computed(() => selectedLayoutPlacement.value ? placementTons(selectedLayoutPlacement.value) : 0)
const placedTonsForComponent = (componentId: string) => buildDraft.value.layout.placements
  .filter((placement) => placement.componentId === componentId)
  .reduce((total, placement) => {
    const deck = buildDraft.value.layout.decks.find((entry) => entry.id === placement.deckId)
    return total + placementTons(placement, deck)
  }, 0)
const componentPlacementStatus = (component: TravellerShipComponent) => {
  const placedTons = placedTonsForComponent(component.id)
  const requiredTons = positiveComponentTons(component)
  if (component.kind === 'cargo') return placedTons > 0 ? 'Placed' : 'Unplaced'
  if (placedTons <= 0) return 'Unplaced'
  if (placedTons < requiredTons) return 'Undersized'
  if (placedTons > requiredTons + layoutCellTons(activeDeck.value)) return 'Oversized'
  return 'Placed'
}
const componentPlacementClass = (component: TravellerShipComponent) => {
  const status = componentPlacementStatus(component)
  if (activeBrushComponentId.value === component.id) return 'border-cyan-100 bg-cyan-100 text-zinc-950'
  if (status === 'Placed') return 'border-emerald-300/35 bg-emerald-300/12 text-emerald-50'
  if (status === 'Undersized' || status === 'Oversized') return 'border-amber-300/35 bg-amber-300/12 text-amber-50'
  return 'border-cyan-400/20 bg-cyan-950/30 text-cyan-50'
}
const componentColorHue = (componentKey: string) => {
  let hash = 0
  for (const character of componentKey) hash = ((hash << 5) - hash) + character.charCodeAt(0)
  return Math.abs(hash) % 360
}
const componentColorKey = (component: TravellerShipComponent | undefined) => {
  if (!component) return 'unknown'
  if (component.kind === 'cargo') return 'cargo'
  if (component.kind === 'accommodation') {
    const sourceEntryId = sourceEntryIdForComponent(component)
    const accommodation = sourceEntryId ? buildDraft.value.accommodations.find((entry) => entry.id === sourceEntryId) : null
    return accommodation?.type ?? 'accommodation'
  }
  return component.kind
}
const placementColorKey = (placement: CustomShipLayoutPlacement) => {
  const role = placementVisualRole(placement)
  if (role) return role === 'crew-quarters' ? 'other' : role
  return componentColorKey(placementComponent(placement))
}
const componentSwatchStyle = (component: TravellerShipComponent | undefined) => {
  const hue = componentColorHue(componentColorKey(component))
  return {
    backgroundColor: `hsla(${hue}, 78%, 52%, 0.7)`,
    borderColor: `hsla(${hue}, 90%, 78%, 0.85)`,
  }
}
const componentInstanceNumber = (component: TravellerShipComponent) => {
  const sameTypeComponents = buildSummary.value.components.filter((entry) => componentColorKey(entry) === componentColorKey(component))
  if (sameTypeComponents.length <= 1) return 0
  return sameTypeComponents.findIndex((entry) => entry.id === component.id) + 1
}
const componentDisplayName = (component: TravellerShipComponent | undefined) => {
  if (!component) return ''
  const instanceNumber = componentInstanceNumber(component)
  return instanceNumber ? `${component.name} ${instanceNumber}` : component.name
}
const placementDisplayName = (placement: CustomShipLayoutPlacement) => componentDisplayName(placementComponent(placement)) || placement.componentId
const placementComponent = (placement: CustomShipLayoutPlacement) => buildComponentById.value.get(placement.componentId)
const activePlacementRenderMeta = computed(() => {
  const metaEntries = new Map<string, PlacementRenderMeta>()
  const absoluteCellOwners = new Map<string, string[]>()

  for (const placement of activeDeckPlacements.value) {
    const cells = placementFootprintCells(placement)
    const cellKeys = new Set(cells.map(cellKey))
    const absoluteCellKeys = new Set(cells.map((cell) => `${placement.x + cell.x}:${placement.y + cell.y}`))
    const meta: PlacementRenderMeta = {
      cells,
      cellKeys,
      overlappingPlacementIds: new Set(),
      hue: componentColorHue(placementColorKey(placement)),
    }

    for (const key of absoluteCellKeys) {
      const owners = absoluteCellOwners.get(key) ?? []
      owners.push(placement.id)
      absoluteCellOwners.set(key, owners)
    }

    metaEntries.set(placement.id, meta)
  }

  for (const owners of absoluteCellOwners.values()) {
    if (owners.length < 2) continue
    for (const owner of owners) {
      const meta = metaEntries.get(owner)
      if (!meta) continue
      for (const otherOwner of owners) {
        if (otherOwner !== owner) meta.overlappingPlacementIds.add(otherOwner)
      }
    }
  }

  return metaEntries
})
const placementRenderMeta = (placement: CustomShipLayoutPlacement) => activePlacementRenderMeta.value.get(placement.id)
const placementRenderCells = (placement: CustomShipLayoutPlacement) => placementRenderMeta(placement)?.cells ?? placementFootprintCells(placement)
const placementStyle = (placement: CustomShipLayoutPlacement) => ({
  gridColumn: `${placement.x + canvasWorkspaceRadius + 1} / span ${placement.width}`,
  gridRow: `${placement.y + canvasWorkspaceRadius + 1} / span ${placement.height}`,
})
const placementFootprintStyle = (placement: CustomShipLayoutPlacement) => ({
  gridTemplateColumns: `repeat(${placement.width}, minmax(0, 1fr))`,
  gridTemplateRows: `repeat(${placement.height}, minmax(0, 1fr))`,
})
const cargoCellHash = (placement: CustomShipLayoutPlacement, cell: CustomShipLayoutCell) => {
  const seed = `${placement.id}:${cell.x}:${cell.y}`
  let hash = 0
  for (const character of seed) hash = ((hash << 5) - hash) + character.charCodeAt(0)
  return Math.abs(hash)
}
const cargoSeedHash = (placement: CustomShipLayoutPlacement, seed: string) => {
  let hash = 0
  for (const character of `${placement.id}:${seed}`) hash = ((hash << 5) - hash) + character.charCodeAt(0)
  return Math.abs(hash)
}
const cargoItemFootprintCells = (item: Pick<CargoVisualItem, 'leftCells' | 'topCells' | 'spanX' | 'spanY'>) => {
  const minX = Math.floor(item.leftCells)
  const maxX = Math.ceil(item.leftCells + item.spanX) - 1
  const minY = Math.floor(item.topCells)
  const maxY = Math.ceil(item.topCells + item.spanY) - 1
  const cells: CustomShipLayoutCell[] = []
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) cells.push({ x, y })
  }
  return cells
}
const cargoItemFits = (item: Pick<CargoVisualItem, 'leftCells' | 'topCells' | 'spanX' | 'spanY'>, occupiedCells: Set<string>) => (
  item.leftCells >= 0
  && item.topCells >= 0
  && cargoItemFootprintCells(item).every((cell) => occupiedCells.has(cellKey(cell)))
)
const createCargoVisualItem = (placement: CustomShipLayoutPlacement, cell: CustomShipLayoutCell, occupiedCells: Set<string>) => {
  const hash = cargoCellHash(placement, cell)
  const wide = hash % 5 !== 0
  const large = hash % 7 < 3
  const spanX = wide
    ? (large ? 1.72 + ((hash % 4) * 0.18) : 0.78 + ((hash % 3) * 0.12))
    : (large ? 0.92 + ((hash % 3) * 0.12) : 0.58 + ((hash % 3) * 0.1))
  const spanY = wide
    ? (large ? 0.74 + ((Math.floor(hash / 11) % 3) * 0.1) : 0.52 + ((Math.floor(hash / 11) % 3) * 0.08))
    : (large ? 1.16 + ((Math.floor(hash / 13) % 3) * 0.12) : 0.64 + ((Math.floor(hash / 13) % 3) * 0.09))
  const item: CargoVisualItem = {
    id: `${placement.id}-cargo-${cell.x}:${cell.y}`,
    cell,
    hash,
    spanX,
    spanY,
    leftCells: cell.x + 0.08 + ((Math.floor(hash / 17) % 5) * 0.04),
    topCells: cell.y + 0.1 + ((Math.floor(hash / 19) % 5) * 0.035),
    wide,
  }
  return cargoItemFits(item, occupiedCells) ? item : null
}
const cargoHotspotCells = (placement: CustomShipLayoutPlacement, cells: CustomShipLayoutCell[]) => {
  if (cells.length <= 12) return cells.slice(0, 1)
  const clusterCount = Math.min(8, Math.max(2, Math.ceil(Math.sqrt(cells.length) / 4)))
  const columns = Math.ceil(Math.sqrt(clusterCount))
  const rows = Math.ceil(clusterCount / columns)
  const zones: CustomShipLayoutCell[][] = Array.from({ length: rows * columns }, () => [])

  for (const cell of cells) {
    const column = Math.min(columns - 1, Math.floor((cell.x / Math.max(1, placement.width)) * columns))
    const row = Math.min(rows - 1, Math.floor((cell.y / Math.max(1, placement.height)) * rows))
    zones[(row * columns) + column]?.push(cell)
  }

  return zones
    .map((zoneCells, zoneIndex) => {
      if (!zoneCells.length) return null
      return [...zoneCells].sort((first, second) => (
        cargoSeedHash(placement, `hotspot-${zoneIndex}:${first.x}:${first.y}`)
        - cargoSeedHash(placement, `hotspot-${zoneIndex}:${second.x}:${second.y}`)
      ))[0]
    })
    .filter((cell): cell is CustomShipLayoutCell => Boolean(cell))
}
const cargoHotspotScore = (placement: CustomShipLayoutPlacement, item: CargoVisualItem, hotspots: CustomShipLayoutCell[]) => {
  if (!hotspots.length) return item.hash
  const centerX = item.leftCells + (item.spanX / 2)
  const centerY = item.topCells + (item.spanY / 2)
  const nearestDistance = Math.min(...hotspots.map((hotspot) => {
    const dx = centerX - (hotspot.x + 0.5)
    const dy = centerY - (hotspot.y + 0.5)
    return Math.sqrt((dx * dx) + (dy * dy))
  }))
  const noise = (cargoSeedHash(placement, `item-noise:${item.cell.x}:${item.cell.y}`) % 100) / 100
  return nearestDistance + noise
}
const cargoVisualItems = (placement: CustomShipLayoutPlacement): CargoVisualItem[] => {
  if (placementVisualRole(placement) !== 'cargo') return []
  const cells = placementRenderCells(placement)
  const occupiedCells = new Set(cells.map(cellKey))
  const hotspots = cargoHotspotCells(placement, cells)
  const maxItems = Math.min(72, Math.max(3, Math.ceil(cells.length * 0.17)))
  return cells
    .map((cell) => createCargoVisualItem(placement, cell, occupiedCells))
    .filter((item): item is CargoVisualItem => Boolean(item))
    .sort((first, second) => cargoHotspotScore(placement, first, hotspots) - cargoHotspotScore(placement, second, hotspots))
    .slice(0, maxItems)
}
const cargoCrateStyle = (placement: CustomShipLayoutPlacement, item: CargoVisualItem) => {
  const hash = item.hash
  const palette = [
    { fill: 'rgba(117, 124, 93, 0.82)', border: 'rgba(205, 211, 177, 0.68)', line: 'rgba(35, 40, 32, 0.48)' },
    { fill: 'rgba(128, 105, 66, 0.82)', border: 'rgba(220, 194, 135, 0.68)', line: 'rgba(42, 33, 22, 0.5)' },
    { fill: 'rgba(82, 97, 104, 0.86)', border: 'rgba(180, 205, 210, 0.68)', line: 'rgba(22, 33, 38, 0.52)' },
  ][hash % 3]
  const angle = ((hash % 11) - 5) * 1.7
  const slats = item.wide
    ? `linear-gradient(90deg, transparent 28%, ${palette.line} 29%, ${palette.line} 34%, transparent 35%, transparent 64%, ${palette.line} 65%, ${palette.line} 70%, transparent 71%)`
    : `linear-gradient(180deg, transparent 28%, ${palette.line} 29%, ${palette.line} 34%, transparent 35%, transparent 64%, ${palette.line} 65%, ${palette.line} 70%, transparent 71%)`
  const cornerBrace = hash % 2 === 0
    ? `linear-gradient(135deg, transparent 43%, ${palette.line} 44%, ${palette.line} 50%, transparent 51%)`
    : `linear-gradient(45deg, transparent 43%, ${palette.line} 44%, ${palette.line} 50%, transparent 51%)`
  return {
    left: `${(item.leftCells / placement.width) * 100}%`,
    top: `${(item.topCells / placement.height) * 100}%`,
    width: `${(item.spanX / placement.width) * 100}%`,
    height: `${(item.spanY / placement.height) * 100}%`,
    backgroundColor: palette.fill,
    backgroundImage: `${slats}, ${cornerBrace}`,
    borderColor: palette.border,
    boxShadow: 'inset 0 0 0 1px rgba(2, 6, 23, 0.4), 0 1px 2px rgba(0, 0, 0, 0.35)',
    transform: `rotate(${angle}deg)`,
  }
}
const accommodationVisualRoles = new Set<CustomShipLayoutVisualRole>(['stateroom', 'high-stateroom', 'luxury-stateroom', 'psion-stateroom', 'crew-quarters', 'low-berth', 'emergency-low-berth', 'common-area', 'acceleration-bench', 'acceleration-seat', 'barracks', 'brig', 'cabin-space'])
const placementHasAccommodationVisual = (placement: CustomShipLayoutPlacement) => {
  const role = placementVisualRole(placement)
  return Boolean(role && accommodationVisualRoles.has(role))
}
const accommodationCellHash = (placement: CustomShipLayoutPlacement, cell: CustomShipLayoutCell, salt = '') => {
  let hash = 0
  for (const character of `${placement.id}:${cell.x}:${cell.y}:${salt}`) hash = ((hash << 5) - hash) + character.charCodeAt(0)
  return Math.abs(hash)
}
const accommodationItem = (
  placement: CustomShipLayoutPlacement,
  cell: CustomShipLayoutCell,
  kind: AccommodationVisualItem['kind'],
  salt: string,
  left: number,
  top: number,
  spanX: number,
  spanY: number,
): AccommodationVisualItem => {
  const hash = accommodationCellHash(placement, cell, salt)
  const palette: Record<AccommodationVisualItem['kind'], { fill: string, border: string }> = {
    bed: { fill: 'rgba(225, 140, 78, 0.86)', border: 'rgba(255, 219, 180, 0.72)' },
    fresher: { fill: 'rgba(150, 178, 188, 0.82)', border: 'rgba(220, 240, 244, 0.72)' },
    galley: { fill: 'rgba(176, 153, 98, 0.82)', border: 'rgba(238, 220, 166, 0.7)' },
    desk: { fill: 'rgba(100, 121, 142, 0.84)', border: 'rgba(190, 214, 232, 0.68)' },
    capsule: { fill: 'rgba(114, 164, 174, 0.86)', border: 'rgba(211, 250, 255, 0.72)' },
    table: { fill: 'rgba(165, 136, 82, 0.82)', border: 'rgba(236, 210, 151, 0.7)' },
    seat: { fill: 'rgba(207, 119, 70, 0.84)', border: 'rgba(255, 207, 169, 0.7)' },
    locker: { fill: 'rgba(100, 112, 122, 0.82)', border: 'rgba(196, 207, 216, 0.66)' },
  }
  const line = 'rgba(7, 14, 24, 0.42)'
  const backgroundImage = kind === 'bed'
    ? `linear-gradient(90deg, transparent 68%, ${line} 69%, ${line} 73%, transparent 74%)`
    : kind === 'capsule'
      ? `linear-gradient(90deg, transparent 44%, ${line} 45%, ${line} 55%, transparent 56%)`
      : kind === 'table'
        ? `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.22) 0 18%, transparent 19%)`
        : undefined
  return {
    id: `${placement.id}-${kind}-${cell.x}:${cell.y}:${salt}`,
    kind,
    leftCells: cell.x + left,
    topCells: cell.y + top,
    spanX,
    spanY,
    angle: ((hash % 7) - 3) * 0.9,
    fill: palette[kind].fill,
    border: palette[kind].border,
    backgroundImage,
    borderRadius: kind === 'capsule' ? '999px' : kind === 'table' ? '999px' : '2px',
  }
}
const accommodationVisualItems = (placement: CustomShipLayoutPlacement): AccommodationVisualItem[] => {
  const role = placementVisualRole(placement)
  if (!role || !accommodationVisualRoles.has(role)) return []
  const cells = placementRenderCells(placement)
  const items: AccommodationVisualItem[] = []

  for (const cell of cells) {
    const hash = accommodationCellHash(placement, cell)
    const mirror = hash % 2 === 0
    if (role === 'stateroom' || role === 'high-stateroom' || role === 'luxury-stateroom' || role === 'psion-stateroom' || role === 'crew-quarters') {
      const bedLeft = mirror ? 0.12 : 0.42
      const premium = role === 'high-stateroom' || role === 'luxury-stateroom' || role === 'psion-stateroom'
      items.push(accommodationItem(placement, cell, 'bed', 'bed', bedLeft, premium ? 0.12 : 0.16, premium ? 0.5 : 0.46, premium ? 0.3 : 0.26))
      if (premium || hash % 3 === 0) items.push(accommodationItem(placement, cell, 'fresher', 'fresher', mirror ? 0.66 : 0.1, 0.58, 0.24, 0.25))
      if (role === 'luxury-stateroom' || role === 'high-stateroom') items.push(accommodationItem(placement, cell, 'seat', 'lounge', mirror ? 0.62 : 0.18, 0.42, 0.2, 0.18))
      else if (role === 'psion-stateroom') items.push(accommodationItem(placement, cell, 'table', 'psion', 0.38, 0.42, 0.24, 0.24))
      else if (hash % 3 === 1) items.push(accommodationItem(placement, cell, 'desk', 'desk', mirror ? 0.64 : 0.12, 0.58, 0.26, 0.18))
      else items.push(accommodationItem(placement, cell, 'galley', 'galley', mirror ? 0.65 : 0.11, 0.56, 0.22, 0.28))
      continue
    }
    if (role === 'low-berth') {
      items.push(accommodationItem(placement, cell, 'capsule', 'low-a', 0.16, 0.22, 0.68, 0.2))
      items.push(accommodationItem(placement, cell, 'locker', 'low-b', 0.22, 0.58, 0.56, 0.16))
      continue
    }
    if (role === 'emergency-low-berth') {
      items.push(accommodationItem(placement, cell, 'capsule', 'em-a', 0.12, 0.16, 0.32, 0.18))
      items.push(accommodationItem(placement, cell, 'capsule', 'em-b', 0.56, 0.16, 0.32, 0.18))
      items.push(accommodationItem(placement, cell, 'capsule', 'em-c', 0.12, 0.58, 0.32, 0.18))
      items.push(accommodationItem(placement, cell, 'capsule', 'em-d', 0.56, 0.58, 0.32, 0.18))
      continue
    }
    if (role === 'common-area' && hash % 5 < 3) {
      items.push(accommodationItem(placement, cell, 'table', 'table', 0.34, 0.28, 0.32, 0.32))
      items.push(accommodationItem(placement, cell, 'seat', 'seat-a', 0.18, 0.34, 0.14, 0.2))
      items.push(accommodationItem(placement, cell, 'seat', 'seat-b', 0.68, 0.34, 0.14, 0.2))
      continue
    }
    if (role === 'acceleration-bench') {
      items.push(accommodationItem(placement, cell, 'seat', 'bench-a', 0.14, 0.18, 0.72, 0.2))
      items.push(accommodationItem(placement, cell, 'seat', 'bench-b', 0.14, 0.58, 0.72, 0.2))
      continue
    }
    if (role === 'acceleration-seat') {
      items.push(accommodationItem(placement, cell, 'seat', 'seat', 0.32, 0.24, 0.36, 0.46))
      continue
    }
    if (role === 'barracks') {
      items.push(accommodationItem(placement, cell, 'bed', 'bunk-a', 0.12, 0.16, 0.32, 0.22))
      items.push(accommodationItem(placement, cell, 'bed', 'bunk-b', 0.56, 0.16, 0.32, 0.22))
      items.push(accommodationItem(placement, cell, 'locker', 'locker', 0.18, 0.62, 0.64, 0.16))
      continue
    }
    if (role === 'brig') {
      items.push(accommodationItem(placement, cell, 'bed', 'slab-a', 0.12, 0.18, 0.28, 0.18))
      items.push(accommodationItem(placement, cell, 'bed', 'slab-b', 0.6, 0.18, 0.28, 0.18))
      items.push(accommodationItem(placement, cell, 'fresher', 'curtain', 0.38, 0.6, 0.24, 0.2))
      continue
    }
    if (role === 'cabin-space' && hash % 4 < 2) {
      items.push(accommodationItem(placement, cell, 'seat', 'cabin-seat', 0.22, 0.28, 0.2, 0.22))
      items.push(accommodationItem(placement, cell, 'locker', 'cabin-locker', 0.58, 0.28, 0.22, 0.3))
    }
  }
  return items.slice(0, 120)
}
const accommodationVisualItemStyle = (placement: CustomShipLayoutPlacement, item: AccommodationVisualItem) => ({
  left: `${(item.leftCells / placement.width) * 100}%`,
  top: `${(item.topCells / placement.height) * 100}%`,
  width: `${(item.spanX / placement.width) * 100}%`,
  height: `${(item.spanY / placement.height) * 100}%`,
  backgroundColor: item.fill,
  backgroundImage: item.backgroundImage,
  borderColor: item.border,
  borderRadius: item.borderRadius,
  boxShadow: 'inset 0 0 0 1px rgba(2, 6, 23, 0.34), 0 1px 2px rgba(0, 0, 0, 0.28)',
  transform: `rotate(${item.angle}deg)`,
})
const placementCellStyle = (placement: CustomShipLayoutPlacement, cell: CustomShipLayoutCell) => {
  const meta = placementRenderMeta(placement)
  const occupiedCells = meta?.cellKeys ?? new Set(placementFootprintCells(placement).map(cellKey))
  const hasNorth = occupiedCells.has(`${cell.x}:${cell.y - 1}`)
  const hasEast = occupiedCells.has(`${cell.x + 1}:${cell.y}`)
  const hasSouth = occupiedCells.has(`${cell.x}:${cell.y + 1}`)
  const hasWest = occupiedCells.has(`${cell.x - 1}:${cell.y}`)
  const hue = meta?.hue ?? componentColorHue(placementColorKey(placement))
  const selected = selectedPlacementId.value === placement.id
  const overlapping = (meta?.overlappingPlacementIds.size ?? 0) > 0
  const baseStyle = {
    gridColumn: `${cell.x + 1}`,
    gridRow: `${cell.y + 1}`,
    borderTopWidth: hasNorth ? '0' : '1px',
    borderRightWidth: hasEast ? '0' : '1px',
    borderBottomWidth: hasSouth ? '0' : '1px',
    borderLeftWidth: hasWest ? '0' : '1px',
    position: 'relative',
    backgroundColor: overlapping ? 'rgba(244, 63, 94, 0.28)' : `hsla(${hue}, 78%, ${selected ? 58 : 50}%, ${selected ? 0.36 : 0.27})`,
    borderColor: overlapping ? 'rgba(253, 164, 175, 0.88)' : `hsla(${hue}, 90%, ${selected ? 82 : 74}%, ${selected ? 0.9 : 0.55})`,
    boxShadow: selected ? `0 0 12px hsla(${hue}, 90%, 72%, 0.22)` : '0 1px 4px rgba(0,0,0,0.22)',
  }
  return baseStyle
}
const footprintPreviewCells = computed(() => {
  if (isHullShapeEditing.value) return []
  if (footprintRectDrag.value) return cellsInRect(footprintRectDrag.value.startCell, footprintRectDrag.value.currentCell)
  if (footprintHoverCell.value && ['paint', 'erase', 'rectangle'].includes(activeShapeTool.value)) return [footprintHoverCell.value]
  return []
})
const footprintPreviewStyle = computed(() => ({
  gridTemplateColumns: `repeat(${canvasWorkspaceCells}, ${canvasCellSize.value}px)`,
  gridTemplateRows: `repeat(${canvasWorkspaceCells}, ${canvasCellSize.value}px)`,
  width: `${canvasWorkspaceCells * canvasCellSize.value}px`,
  height: `${canvasWorkspaceCells * canvasCellSize.value}px`,
}))
const footprintPreviewCellStyle = (cell: CustomShipLayoutCell) => ({
  gridColumn: `${cell.x + canvasWorkspaceRadius + 1}`,
  gridRow: `${cell.y + canvasWorkspaceRadius + 1}`,
})
const footprintPreviewCellClass = computed(() => (activeShapeTool.value === 'erase' || footprintRectDrag.value?.mode === 'erase')
  ? 'border-rose-200/80 bg-rose-400/28'
  : 'border-cyan-100/80 bg-cyan-300/24')
const placementClass = () => 'pointer-events-none'
const placementCellClass = (placement: CustomShipLayoutPlacement) => {
  if (selectedPlacementId.value === placement.id) return 'pointer-events-auto'
  if ((placementRenderMeta(placement)?.overlappingPlacementIds.size ?? 0) > 0) return 'pointer-events-auto'
  return 'pointer-events-auto hover:brightness-125'
}
const shapeToolClass = (toolId: ShapeToolId) => activeShapeTool.value === toolId
  ? 'border-cyan-100 bg-cyan-100 text-zinc-950'
  : 'border-cyan-300/25 text-cyan-100/70 hover:border-amber-300/60'
const deckGridStyle = () => ({
  gridTemplateColumns: `repeat(${canvasWorkspaceCells}, ${canvasCellSize.value}px)`,
  gridTemplateRows: `repeat(${canvasWorkspaceCells}, ${canvasCellSize.value}px)`,
  width: `${canvasWorkspaceCells * canvasCellSize.value}px`,
  height: `${canvasWorkspaceCells * canvasCellSize.value}px`,
})
const canvasGraphPaperStyle = computed(() => {
  const cell = canvasCellSize.value
  const majorCell = cell * 5
  const x = canvasPanX.value
  const y = canvasPanY.value
  return {
    backgroundColor: 'rgba(2, 6, 23, 0.92)',
    backgroundImage: [
      'radial-gradient(circle at 50% 42%, rgba(34,211,238,0.09), transparent 54%)',
      'linear-gradient(rgba(103,232,249,0.10) 1px, transparent 1px)',
      'linear-gradient(90deg, rgba(103,232,249,0.10) 1px, transparent 1px)',
      'linear-gradient(rgba(103,232,249,0.20) 1px, transparent 1px)',
      'linear-gradient(90deg, rgba(103,232,249,0.20) 1px, transparent 1px)',
      'linear-gradient(180deg, rgba(2,6,23,0.20), rgba(2,6,23,0.78))',
    ].join(', '),
    backgroundSize: `100% 100%, ${cell}px ${cell}px, ${cell}px ${cell}px, ${majorCell}px ${majorCell}px, ${majorCell}px ${majorCell}px, 100% 100%`,
    backgroundPosition: `0 0, ${x}px ${y}px, ${x}px ${y}px, ${x}px ${y}px, ${x}px ${y}px, 0 0`,
  }
})
const canvasWorldStyle = computed(() => ({
  transform: `translate(${canvasPanX.value - (canvasWorkspaceRadius * canvasCellSize.value)}px, ${canvasPanY.value - (canvasWorkspaceRadius * canvasCellSize.value)}px)`,
}))
const canvasXAxisStyle = computed(() => ({ top: `${canvasPanY.value}px` }))
const canvasYAxisStyle = computed(() => ({ left: `${canvasPanX.value}px` }))
const canvasOriginStyle = computed(() => ({
  left: `${canvasPanX.value}px`,
  top: `${canvasPanY.value}px`,
}))
const builderOverlayStyle = computed(() => ({
  left: `${builderOverlayX.value}px`,
  top: `${builderOverlayY.value}px`,
}))
const placementOccupiedCellKeys = (placement: Pick<CustomShipLayoutPlacement, 'x' | 'y' | 'width' | 'height' | 'footprintCells'>) => new Set(
  placementFootprintCells(placement as CustomShipLayoutPlacement).map((cell) => `${placement.x + cell.x}:${placement.y + cell.y}`),
)
const placementsOverlap = (
  first: Pick<CustomShipLayoutPlacement, 'x' | 'y' | 'width' | 'height' | 'footprintCells'>,
  second: Pick<CustomShipLayoutPlacement, 'x' | 'y' | 'width' | 'height' | 'footprintCells'>,
) => {
  const firstCells = placementOccupiedCellKeys(first)
  const secondCells = placementOccupiedCellKeys(second)
  const [smallerSet, largerSet] = firstCells.size <= secondCells.size ? [firstCells, secondCells] : [secondCells, firstCells]
  return [...smallerSet].some((key) => largerSet.has(key))
}
const placementWouldOverlap = (
  placement: CustomShipLayoutPlacement,
  candidate: Pick<CustomShipLayoutPlacement, 'x' | 'y' | 'width' | 'height' | 'footprintCells' | 'deckId'>,
) => buildDraft.value.layout.placements.some((entry) => (
  entry.id !== placement.id
  && entry.deckId === candidate.deckId
  && placementsOverlap(candidate, entry)
))
const overlappingPlacements = (placement: CustomShipLayoutPlacement) => {
  const cachedOverlapIds = activePlacementRenderMeta.value.get(placement.id)?.overlappingPlacementIds
  if (cachedOverlapIds && placement.deckId === activeDeck.value.id) {
    return activeDeckPlacements.value.filter((entry) => cachedOverlapIds.has(entry.id))
  }

  return buildDraft.value.layout.placements.filter((entry) => (
    entry.id !== placement.id
    && entry.deckId === placement.deckId
    && placementsOverlap(placement, entry)
  ))
}
const placementHasOverlap = (placement: CustomShipLayoutPlacement) => overlappingPlacements(placement).length > 0
const setRectangularFootprint = (placement: CustomShipLayoutPlacement) => {
  placement.footprintCells = rectangularFootprintCells(placement.width, placement.height)
}
const absoluteFootprintCells = (placement: CustomShipLayoutPlacement) => placementFootprintCells(placement).map((cell) => ({
  x: placement.x + cell.x,
  y: placement.y + cell.y,
}))
const createAbsoluteFootprintCandidate = (placement: CustomShipLayoutPlacement, cells: CustomShipLayoutCell[]) => {
  const uniqueCells = normaliseFootprintCells(cells)
  if (!uniqueCells.length) return null
  const minX = Math.min(...uniqueCells.map((cell) => cell.x))
  const minY = Math.min(...uniqueCells.map((cell) => cell.y))
  const maxX = Math.max(...uniqueCells.map((cell) => cell.x))
  const maxY = Math.max(...uniqueCells.map((cell) => cell.y))
  const width = Math.max(1, maxX - minX + 1)
  const height = Math.max(1, maxY - minY + 1)
  const x = Math.max(-canvasWorkspaceRadius, Math.min(canvasWorkspaceRadius - width + 1, minX))
  const y = Math.max(-canvasWorkspaceRadius, Math.min(canvasWorkspaceRadius - height + 1, minY))
  return {
    ...placement,
    x,
    y,
    width,
    height,
    footprintCells: uniqueCells.map((cell) => ({
      x: cell.x - minX,
      y: cell.y - minY,
    })),
  }
}
const applyPlacementCandidate = (placement: CustomShipLayoutPlacement, candidate: CustomShipLayoutPlacement, allowOverlap = false) => {
  if (!allowOverlap && placementWouldOverlap(placement, candidate)) return false
  placement.x = candidate.x
  placement.y = candidate.y
  placement.width = candidate.width
  placement.height = candidate.height
  placement.deckId = candidate.deckId
  placement.footprintCells = candidate.footprintCells
  placement.visualRole = candidate.visualRole
  placement.sourceEntryId = candidate.sourceEntryId
  clampPlacement(placement)
  return true
}
const setAbsoluteFootprintCells = (placement: CustomShipLayoutPlacement, cells: CustomShipLayoutCell[], allowOverlap = false) => {
  const candidate = createAbsoluteFootprintCandidate(placement, cells)
  if (!candidate) return false
  return applyPlacementCandidate(placement, candidate, allowOverlap)
}
const fillRectForPlacement = (placement: CustomShipLayoutPlacement, startCell: CustomShipLayoutCell, endCell: CustomShipLayoutCell) => {
  return setAbsoluteFootprintCells(placement, [
    ...absoluteFootprintCells(placement),
    ...cellsInRect(startCell, endCell),
  ])
}
const eraseRectForPlacement = (placement: CustomShipLayoutPlacement, startCell: CustomShipLayoutCell, endCell: CustomShipLayoutCell) => {
  const eraseKeys = new Set(cellsInRect(startCell, endCell).map(cellKey))
  const remainingCells = absoluteFootprintCells(placement).filter((cell) => !eraseKeys.has(cellKey(cell)))
  if (remainingCells.length) return setAbsoluteFootprintCells(placement, remainingCells)
  return false
}
const pointerCellForDeck = (event: PointerEvent) => {
  const grid = deckCanvasRef.value
  if (!grid) return null
  const rect = grid.getBoundingClientRect()
  const x = Math.floor((event.clientX - rect.left) / canvasCellSize.value) - canvasWorkspaceRadius
  const y = Math.floor((event.clientY - rect.top) / canvasCellSize.value) - canvasWorkspaceRadius
  if (x < -canvasWorkspaceRadius || y < -canvasWorkspaceRadius || x > canvasWorkspaceRadius || y > canvasWorkspaceRadius) return null
  return { x, y }
}
const applyFootprintEdit = (placement: CustomShipLayoutPlacement, cell: CustomShipLayoutCell | null, mode: Extract<ShapeToolId, 'paint' | 'erase'>) => {
  if (!cell) return
  const cells = absoluteFootprintCells(placement)
  const targetCellKey = cellKey(cell)
  const currentCellKeys = new Set(cells.map(cellKey))
  if (mode === 'paint') {
    if (currentCellKeys.has(targetCellKey)) return
    setAbsoluteFootprintCells(placement, [...cells, cell])
    return
  }
  if (!currentCellKeys.has(targetCellKey)) return
  const remainingCells = cells.filter((entry) => cellKey(entry) !== targetCellKey)
  if (remainingCells.length) setAbsoluteFootprintCells(placement, remainingCells)
}
const findOpenPlacement = (_deck: CustomShipLayoutDeck, width: number, height: number, componentId: string) => {
  for (let y = 0; y <= canvasWorkspaceRadius - height + 1; y += 1) {
    for (let x = 0; x <= canvasWorkspaceRadius - width + 1; x += 1) {
      const candidate = { x, y, width, height }
      if (!activeDeckPlacements.value.some((placement) => placement.componentId !== componentId && placementsOverlap(candidate, placement))) return { x, y }
    }
  }
  return { x: 0, y: 0 }
}
const placementIdBase = (componentId: string) => `placement-${componentId}`
const uniquePlacementId = (componentId: string) => {
  const baseId = placementIdBase(componentId)
  if (!buildDraft.value.layout.placements.some((placement) => placement.id === baseId)) return baseId
  let index = 2
  while (buildDraft.value.layout.placements.some((placement) => placement.id === `${baseId}-${index}`)) index += 1
  return `${baseId}-${index}`
}
const placeComponent = (component: TravellerShipComponent) => {
  const deck = activeDeck.value
  const cells = componentRequiredCells(component)
  const width = Math.min(canvasWorkspaceRadius, Math.max(1, Math.ceil(Math.sqrt(cells))))
  const height = Math.min(canvasWorkspaceRadius, Math.max(1, Math.ceil(cells / width)))
  const position = findOpenPlacement(deck, width, height, component.id)
  rememberBuilderHistory()
  buildDraft.value.layout.placements = buildDraft.value.layout.placements.filter((placement) => placement.componentId !== component.id)
  buildDraft.value.layout.placements.push({
    id: placementIdBase(component.id),
    componentId: component.id,
    deckId: deck.id,
    x: position.x,
    y: position.y,
    width,
    height,
    rotation: 0,
    footprintCells: rectangularFootprintCells(width, height),
    visualRole: placementVisualRoleForComponent(component),
    sourceEntryId: sourceEntryIdForComponent(component),
  })
  selectedPlacementId.value = placementIdBase(component.id)
}
const selectBrushComponent = (component: TravellerShipComponent, switchToPaint = true) => {
  activeBrushComponentId.value = component.id
  if (switchToPaint) activeShapeTool.value = 'paint'
  const existingPlacement = activeDeckPlacements.value.find((placement) => placement.componentId === component.id)
  selectedPlacementId.value = existingPlacement?.id ?? ''
}
const selectAccommodationBrush = (entry: CustomShipAccommodationEntry) => {
  const component = buildComponentById.value.get(accommodationComponentId(entry))
  if (component) selectBrushComponent(component)
}
const addAccommodationEntry = (type: CustomShipAccommodationEntry['type']) => {
  const entry = createAccommodationEntry(type)
  rememberBuilderHistory()
  buildDraft.value.accommodations.push(entry)
  nextTick(() => selectAccommodationBrush(entry))
}
const removeAccommodationEntry = (entry: CustomShipAccommodationEntry) => {
  const componentId = accommodationComponentId(entry)
  rememberBuilderHistory()
  buildDraft.value.accommodations = buildDraft.value.accommodations.filter((item) => item.id !== entry.id)
  buildDraft.value.layout.placements = buildDraft.value.layout.placements.filter((placement) => placement.componentId !== componentId && placement.sourceEntryId !== entry.id)
  if (!buildDraft.value.layout.placements.some((placement) => placement.id === selectedPlacementId.value)) selectedPlacementId.value = ''
  if (activeBrushComponentId.value === componentId) activeBrushComponentId.value = ''
}
const selectCargoBrush = (entry: CustomShipCargoEntry) => {
  const component = buildComponentById.value.get(cargoComponentId(entry))
  if (component) selectBrushComponent(component)
}
const addCargoEntry = () => {
  const entry = createCargoEntry()
  rememberBuilderHistory()
  buildDraft.value.cargoEntries.push(entry)
  nextTick(() => selectCargoBrush(entry))
}
const removeCargoEntry = (entry: CustomShipCargoEntry) => {
  const componentId = cargoComponentId(entry)
  rememberBuilderHistory()
  buildDraft.value.cargoEntries = buildDraft.value.cargoEntries.filter((item) => item.id !== entry.id)
  buildDraft.value.layout.placements = buildDraft.value.layout.placements.filter((placement) => placement.componentId !== componentId && placement.sourceEntryId !== entry.id)
  if (!buildDraft.value.layout.placements.some((placement) => placement.id === selectedPlacementId.value)) selectedPlacementId.value = ''
  if (activeBrushComponentId.value === componentId) activeBrushComponentId.value = ''
}
const duplicatePlacementSource = (placement: CustomShipLayoutPlacement) => {
  const component = placementComponent(placement)
  const sourceEntryId = placement.sourceEntryId ?? component?.id.replace(/^(accommodation|cargo)-/, '')
  if (component?.kind === 'cargo' && sourceEntryId) {
    const source = buildDraft.value.cargoEntries.find((entry) => entry.id === sourceEntryId)
    if (!source) return { componentId: placement.componentId, sourceEntryId: placement.sourceEntryId, visualRole: placement.visualRole }
    const entry: CustomShipCargoEntry = {
      ...source,
      id: createBuilderEntryId('cargo'),
      notes: source.notes ? [...source.notes] : undefined,
    }
    buildDraft.value.cargoEntries.push(entry)
    return { componentId: cargoComponentId(entry), sourceEntryId: entry.id, visualRole: 'cargo' as CustomShipLayoutVisualRole }
  }
  if (component?.kind === 'accommodation' && sourceEntryId) {
    const source = buildDraft.value.accommodations.find((entry) => entry.id === sourceEntryId)
    if (!source) return { componentId: placement.componentId, sourceEntryId: placement.sourceEntryId, visualRole: placement.visualRole }
    const entry: CustomShipAccommodationEntry = {
      ...source,
      id: createBuilderEntryId('accommodation'),
      notes: source.notes ? [...source.notes] : undefined,
      cost: source.cost ? { ...source.cost } : undefined,
    }
    buildDraft.value.accommodations.push(entry)
    return {
      componentId: accommodationComponentId(entry),
      sourceEntryId: entry.id,
      visualRole: entry.type === 'other' ? 'crew-quarters' as CustomShipLayoutVisualRole : entry.type as CustomShipLayoutVisualRole,
    }
  }
  return { componentId: placement.componentId, sourceEntryId: placement.sourceEntryId, visualRole: placement.visualRole }
}
const createBrushPlacement = (component: TravellerShipComponent, cell: CustomShipLayoutCell) => {
  const placement: CustomShipLayoutPlacement = {
    id: uniquePlacementId(component.id),
    componentId: component.id,
    deckId: activeDeck.value.id,
    x: cell.x,
    y: cell.y,
    width: 1,
    height: 1,
    rotation: 0,
    footprintCells: [{ x: 0, y: 0 }],
    visualRole: placementVisualRoleForComponent(component),
    sourceEntryId: sourceEntryIdForComponent(component),
  }
  if (placementWouldOverlap(placement, placement)) return null
  buildDraft.value.layout.placements.push(placement)
  selectedPlacementId.value = placement.id
  return placement
}
const brushPlacementForCell = (cell: CustomShipLayoutCell | null) => {
  if (!cell || !activeBrushComponent.value) return selectedLayoutPlacement.value
  const existingPlacement = activeDeckPlacements.value.find((placement) => placement.componentId === activeBrushComponent.value?.id)
  if (existingPlacement) {
    selectedPlacementId.value = existingPlacement.id
    return existingPlacement
  }
  return createBrushPlacement(activeBrushComponent.value, cell)
}
const autoFitBrushFootprint = () => {
  const component = activeBrushComponent.value
  if (!component) return
  rememberBuilderHistory()
  const requiredCells = componentRequiredCells(component)
  const footprintCells = compactFootprintCells(requiredCells)
  const width = Math.max(...footprintCells.map((cell) => cell.x)) + 1
  const height = Math.max(...footprintCells.map((cell) => cell.y)) + 1
  const existingPlacement = activeDeckPlacements.value.find((placement) => placement.componentId === component.id)
  const position = existingPlacement ? { x: existingPlacement.x, y: existingPlacement.y } : findOpenPlacement(activeDeck.value, width, height, component.id)
  const placement = existingPlacement ?? createBrushPlacement(component, position)
  if (!placement) return
  const applied = applyPlacementCandidate(placement, {
    ...placement,
    x: position.x,
    y: position.y,
    width,
    height,
    footprintCells,
  })
  if (applied) selectedPlacementId.value = placement.id
}
const rotateSelectedFootprint = () => {
  const placement = selectedLayoutPlacement.value
  if (!placement) return
  rememberBuilderHistory()
  const cells = placementFootprintCells(placement)
  const rotatedCells = cells.map((cell) => ({
    x: placement.height - 1 - cell.y,
    y: cell.x,
  }))
  const origin = { x: placement.x, y: placement.y }
  placement.width = placement.height
  placement.height = Math.max(1, Math.max(...rotatedCells.map((cell) => cell.y)) + 1)
  setAbsoluteFootprintCells(placement, rotatedCells.map((cell) => ({ x: origin.x + cell.x, y: origin.y + cell.y })))
}
const flipSelectedFootprint = (axis: 'horizontal' | 'vertical') => {
  const placement = selectedLayoutPlacement.value
  if (!placement) return
  rememberBuilderHistory()
  const cells = placementFootprintCells(placement).map((cell) => ({
    x: axis === 'horizontal' ? placement.width - 1 - cell.x : cell.x,
    y: axis === 'vertical' ? placement.height - 1 - cell.y : cell.y,
  }))
  setAbsoluteFootprintCells(placement, cells.map((cell) => ({ x: placement.x + cell.x, y: placement.y + cell.y })))
}
const duplicateSelectedFootprint = () => {
  const placement = selectedLayoutPlacement.value
  if (!placement) return
  rememberBuilderHistory()
  const sourceCells = absoluteFootprintCells(placement)
  const offsets = [
    { x: 2, y: 0 },
    { x: 0, y: 2 },
    { x: 2, y: 2 },
    { x: -2, y: 0 },
    { x: 0, y: -2 },
  ]
  for (let distance = 1; distance <= 24; distance += 1) {
    for (const offset of offsets) {
      const duplicate: CustomShipLayoutPlacement = {
        ...placement,
        id: uniquePlacementId(placement.componentId),
        x: placement.x + (offset.x * distance),
        y: placement.y + (offset.y * distance),
        footprintCells: placementFootprintCells(placement).map((cell) => ({ ...cell })),
      }
      const candidate = createAbsoluteFootprintCandidate(duplicate, sourceCells.map((cell) => ({
        x: cell.x + (offset.x * distance),
        y: cell.y + (offset.y * distance),
      })))
      if (!candidate || placementWouldOverlap(duplicate, candidate)) continue
      const source = duplicatePlacementSource(placement)
      candidate.id = uniquePlacementId(source.componentId)
      candidate.componentId = source.componentId
      candidate.sourceEntryId = source.sourceEntryId
      candidate.visualRole = source.visualRole
      buildDraft.value.layout.placements.push(candidate)
      selectedPlacementId.value = candidate.id
      activeBrushComponentId.value = source.componentId
      return
    }
  }
}
const moveSelectedFootprintToNextDeck = () => {
  const placement = selectedLayoutPlacement.value
  if (!placement || buildDraft.value.layout.decks.length < 2) return
  rememberBuilderHistory()
  const currentDeckIndex = buildDraft.value.layout.decks.findIndex((deck) => deck.id === placement.deckId)
  const orderedDecks = [
    ...buildDraft.value.layout.decks.slice(currentDeckIndex + 1),
    ...buildDraft.value.layout.decks.slice(0, currentDeckIndex),
  ].filter((deck) => deck.id !== placement.deckId)
  for (const deck of orderedDecks) {
    const candidate: CustomShipLayoutPlacement = {
      ...placement,
      deckId: deck.id,
      footprintCells: placementFootprintCells(placement).map((cell) => ({ ...cell })),
    }
    if (placementWouldOverlap(placement, candidate)) continue
    applyPlacementCandidate(placement, candidate)
    activeDeckId.value = deck.id
    selectedPlacementId.value = placement.id
    return
  }
}
const removePlacement = (componentId: string) => {
  rememberBuilderHistory()
  buildDraft.value.layout.placements = buildDraft.value.layout.placements.filter((placement) => placement.componentId !== componentId)
  if (!buildDraft.value.layout.placements.some((placement) => placement.id === selectedPlacementId.value)) selectedPlacementId.value = ''
  if (activeBrushComponentId.value === componentId) activeBrushComponentId.value = ''
}
const setHullEnvelopeCells = (cells: CustomShipLayoutCell[]) => {
  ensureHullEnvelope()
  if (!buildDraft.value.layout.hullEnvelope) return
  const uniqueCells = normaliseFootprintCells(cells)
  if (!uniqueCells.length) return
  buildDraft.value.layout.hullEnvelope = {
    ...buildDraft.value.layout.hullEnvelope,
    locked: true,
    preset: 'custom',
    cells: uniqueCells,
    hullTons: hullStepResult.value.usableTons,
    tonsPerCell: layoutCellTons(activeDeck.value),
  }
}
const paintHullEnvelopeCell = (cell: CustomShipLayoutCell | null, mode: Extract<ShapeToolId, 'paint' | 'erase'>) => {
  if (!cell || !activeHullEnvelope.value) return
  const existing = activeHullEnvelope.value.cells
  if (mode === 'paint') {
    if (hullEnvelopeCellKeys.value.has(cellKey(cell))) return
    setHullEnvelopeCells([...existing, cell])
    return
  }
  const remaining = existing.filter((entry) => cellKey(entry) !== cellKey(cell))
  setHullEnvelopeCells(remaining)
}
const applyHullEnvelopeRect = (startCell: CustomShipLayoutCell, endCell: CustomShipLayoutCell, mode: Extract<ShapeToolId, 'rectangle' | 'erase'>) => {
  if (!activeHullEnvelope.value) return
  const rectCells = cellsInRect(startCell, endCell)
  if (mode === 'rectangle') {
    setHullEnvelopeCells([...activeHullEnvelope.value.cells, ...rectCells])
    return
  }
  const eraseKeys = new Set(rectCells.map(cellKey))
  setHullEnvelopeCells(activeHullEnvelope.value.cells.filter((cell) => !eraseKeys.has(cellKey(cell))))
}
const resetHullEnvelope = () => {
  if (!hullStepResult.value.isComplete) return
  rememberBuilderHistory()
  buildDraft.value.layout.hullEnvelope = createHullEnvelope()
}
const clampPlacement = (placement: CustomShipLayoutPlacement) => {
  placement.width = Math.max(1, Math.min(canvasWorkspaceCells, Number(placement.width) || 1))
  placement.height = Math.max(1, Math.min(canvasWorkspaceCells, Number(placement.height) || 1))
  placement.x = Math.max(-canvasWorkspaceRadius, Math.min(canvasWorkspaceRadius - placement.width + 1, Number(placement.x) || 0))
  placement.y = Math.max(-canvasWorkspaceRadius, Math.min(canvasWorkspaceRadius - placement.height + 1, Number(placement.y) || 0))
  placement.footprintCells = placementFootprintCells(placement).filter((cell) => cell.x >= 0 && cell.y >= 0 && cell.x < placement.width && cell.y < placement.height)
  if (!placement.footprintCells.length) setRectangularFootprint(placement)
}
const adjustPlacement = (placement: CustomShipLayoutPlacement, delta: Partial<Pick<CustomShipLayoutPlacement, 'x' | 'y' | 'width' | 'height'>>) => {
  if (delta.x) placement.x += delta.x
  if (delta.y) placement.y += delta.y
  if (delta.width) placement.width += delta.width
  if (delta.height) placement.height += delta.height
  clampPlacement(placement)
}
const selectPlacement = (placement: CustomShipLayoutPlacement) => {
  selectedPlacementId.value = placement.id
}
const clearSelectedPlacement = () => {
  selectedPlacementId.value = ''
}
const removeSelectedPlacement = () => {
  const placement = selectedLayoutPlacement.value
  if (!placement) return
  rememberBuilderHistory()
  buildDraft.value.layout.placements = buildDraft.value.layout.placements.filter((entry) => entry.id !== placement.id)
  selectedPlacementId.value = ''
}
const nudgeSelectedPlacement = (deltaX: number, deltaY: number) => {
  const placement = selectedLayoutPlacement.value
  if (!placement) return
  rememberBuilderHistory()
  placement.x += deltaX
  placement.y += deltaY
  clampPlacement(placement)
}
const openDeckConfirm = (action: Exclude<DeckConfirmAction, ''>) => {
  if (action === 'delete' && buildDraft.value.layout.decks.length <= 1) return
  deckConfirmAction.value = action
  deckMenuOpen.value = false
}
const closeDeckConfirm = () => {
  deckConfirmAction.value = ''
}
const createDeck = () => {
  rememberBuilderHistory()
  const deck = createLayoutDeck(buildDraft.value.layout.decks.length + 1)
  buildDraft.value.layout.decks.push(deck)
  activeDeckId.value = deck.id
  selectedPlacementId.value = ''
}
const duplicateActiveDeck = () => {
  rememberBuilderHistory()
  const sourceDeck = activeDeck.value
  const deckIndex = buildDraft.value.layout.decks.length + 1
  const deckId = `deck-${Date.now()}`
  const copiedDeck: CustomShipLayoutDeck = {
    ...sourceDeck,
    id: deckId,
    name: `${sourceDeck.name} Copy`,
  }
  const copiedPlacements = activeDeckPlacements.value.map((placement, index) => ({
    ...placement,
    id: `placement-${placement.componentId}-${deckId}-${index}`,
    deckId,
  }))
  if (!copiedDeck.name.trim()) copiedDeck.name = `Deck ${deckIndex}`
  buildDraft.value.layout.decks.push(copiedDeck)
  buildDraft.value.layout.placements.push(...copiedPlacements)
  activeDeckId.value = deckId
  selectedPlacementId.value = ''
}
const confirmDeckAction = () => {
  const action = deckConfirmAction.value
  if (action === 'create') createDeck()
  if (action === 'duplicate') duplicateActiveDeck()
  if (action === 'delete') removeActiveDeck()
  closeDeckConfirm()
}
const selectDeck = (deckId: string) => {
  activeDeckId.value = deckId
  selectedPlacementId.value = ''
  deckMenuOpen.value = false
}
const removeActiveDeck = () => {
  if (buildDraft.value.layout.decks.length <= 1) return
  rememberBuilderHistory()
  const deckId = activeDeck.value.id
  const nextDeck = buildDraft.value.layout.decks.find((deck) => deck.id !== deckId)
  buildDraft.value.layout.decks = buildDraft.value.layout.decks.filter((deck) => deck.id !== deckId)
  buildDraft.value.layout.placements = buildDraft.value.layout.placements.filter((placement) => placement.deckId !== deckId)
  activeDeckId.value = nextDeck?.id ?? buildDraft.value.layout.decks[0]?.id ?? 'main-deck'
  selectedPlacementId.value = ''
}
const layoutCellPixelSize = () => ({
  width: canvasCellSize.value,
  height: canvasCellSize.value,
})
const zoomedSize = (base: number, minimum: number) => `${Math.max(minimum, base * canvasZoom.value)}px`
const placementSurfaceStyle = (placement: CustomShipLayoutPlacement) => ({
  ...placementStyle(placement),
  padding: `${zoomedSize(4, 2)} ${zoomedSize(8, 3)}`,
  fontSize: zoomedSize(12, 6),
  lineHeight: '1.18',
})
const placementIconStyle = computed(() => ({
  width: zoomedSize(20, 8),
  height: zoomedSize(20, 8),
}))
const placementTonsStyle = computed(() => ({
  fontSize: zoomedSize(10.88, 5),
}))
const placementResizeHandleStyle = computed(() => ({
  width: zoomedSize(16, 7),
  height: zoomedSize(16, 7),
}))
const setCanvasZoom = (zoom: number) => {
  canvasZoom.value = Math.max(0.5, Math.min(2.5, Number(zoom.toFixed(2))))
}
const adjustCanvasZoom = (delta: number) => {
  setCanvasZoom(canvasZoom.value + delta)
}
const resetCanvasView = () => {
  canvasZoom.value = 1
  canvasPanX.value = 360
  canvasPanY.value = 216
}
const startCanvasPan = (event: PointerEvent) => {
  if (event.button !== 2 || layoutDrag.value || footprintEditDrag.value) return
  event.preventDefault()
  canvasPanDrag.value = {
    startClientX: event.clientX,
    startClientY: event.clientY,
    originX: canvasPanX.value,
    originY: canvasPanY.value,
  }
  window.addEventListener('pointermove', updateCanvasPan)
  window.addEventListener('pointerup', stopCanvasPan, { once: true })
}
const updateCanvasPan = (event: PointerEvent) => {
  if (!canvasPanDrag.value) return
  pendingCanvasPan.value = {
    x: canvasPanDrag.value.originX + event.clientX - canvasPanDrag.value.startClientX,
    y: canvasPanDrag.value.originY + event.clientY - canvasPanDrag.value.startClientY,
  }
  if (canvasPanFrame.value || typeof window === 'undefined') return
  canvasPanFrame.value = window.requestAnimationFrame(() => {
    if (pendingCanvasPan.value) {
      canvasPanX.value = pendingCanvasPan.value.x
      canvasPanY.value = pendingCanvasPan.value.y
    }
    pendingCanvasPan.value = null
    canvasPanFrame.value = 0
  })
}
const stopCanvasPan = () => {
  window.removeEventListener('pointermove', updateCanvasPan)
  if (canvasPanFrame.value) {
    window.cancelAnimationFrame(canvasPanFrame.value)
    canvasPanFrame.value = 0
  }
  if (pendingCanvasPan.value) {
    canvasPanX.value = pendingCanvasPan.value.x
    canvasPanY.value = pendingCanvasPan.value.y
    pendingCanvasPan.value = null
  }
  snapCanvasToGrid()
  canvasPanDrag.value = null
}
const handleCanvasWheel = (event: WheelEvent) => {
  event.preventDefault()
  adjustCanvasZoom(event.deltaY > 0 ? -0.05 : 0.05)
}
const snapCanvasToGrid = () => {
  const cell = canvasCellSize.value
  canvasPanX.value = Math.round(canvasPanX.value / cell) * cell
  canvasPanY.value = Math.round(canvasPanY.value / cell) * cell
}
const startBuilderOverlayDrag = (event: PointerEvent) => {
  if (event.button !== 0) return
  event.preventDefault()
  builderOverlayDrag.value = {
    startClientX: event.clientX,
    startClientY: event.clientY,
    originX: builderOverlayX.value,
    originY: builderOverlayY.value,
  }
  window.addEventListener('pointermove', updateBuilderOverlayDrag)
  window.addEventListener('pointerup', stopBuilderOverlayDrag, { once: true })
}
const updateBuilderOverlayDrag = (event: PointerEvent) => {
  if (!builderOverlayDrag.value) return
  builderOverlayX.value = Math.max(0, builderOverlayDrag.value.originX + event.clientX - builderOverlayDrag.value.startClientX)
  builderOverlayY.value = Math.max(0, builderOverlayDrag.value.originY + event.clientY - builderOverlayDrag.value.startClientY)
}
const stopBuilderOverlayDrag = () => {
  window.removeEventListener('pointermove', updateBuilderOverlayDrag)
  builderOverlayDrag.value = null
}
const startHullEnvelopeDrag = (event: PointerEvent, mode: Extract<ShapeToolId, 'paint' | 'erase' | 'rectangle'>) => {
  if (event.button !== 0 || !isHullShapeEditing.value) return
  const cell = pointerCellForDeck(event)
  if (!cell) return
  event.preventDefault()
  rememberBuilderHistory()
  ensureHullEnvelope()
  if (mode === 'paint' || mode === 'erase') paintHullEnvelopeCell(cell, mode)
  hullEnvelopeDrag.value = { mode, startCell: cell, currentCell: cell }
  window.addEventListener('pointermove', updateHullEnvelopeDrag)
  window.addEventListener('pointerup', stopHullEnvelopeDrag, { once: true })
}
const updateHullEnvelopeDrag = (event: PointerEvent) => {
  if (!hullEnvelopeDrag.value) return
  const cell = pointerCellForDeck(event)
  if (!cell) return
  hullEnvelopeDrag.value.currentCell = cell
  if (hullEnvelopeDrag.value.mode === 'paint' || hullEnvelopeDrag.value.mode === 'erase') paintHullEnvelopeCell(cell, hullEnvelopeDrag.value.mode)
}
const stopHullEnvelopeDrag = () => {
  const drag = hullEnvelopeDrag.value
  window.removeEventListener('pointermove', updateHullEnvelopeDrag)
  hullEnvelopeDrag.value = null
  if (!drag || drag.mode !== 'rectangle') return
  applyHullEnvelopeRect(drag.startCell, drag.currentCell, 'rectangle')
}
const startPlacementFootprintEdit = (event: PointerEvent, placement: CustomShipLayoutPlacement, mode: Extract<ShapeToolId, 'paint' | 'erase'>) => {
  if (event.button !== 0) return
  const target = event.currentTarget
  if (!(target instanceof HTMLElement)) return
  event.preventDefault()
  rememberBuilderHistory()
  selectedPlacementId.value = placement.id
  footprintEditDrag.value = { placementId: placement.id, mode, element: target }
  applyFootprintEdit(placement, pointerCellForDeck(event), mode)
  window.addEventListener('pointermove', updatePlacementFootprintEdit)
  window.addEventListener('pointerup', stopPlacementFootprintEdit, { once: true })
}
const updatePlacementFootprintEdit = (event: PointerEvent) => {
  if (!footprintEditDrag.value) return
  const placement = buildDraft.value.layout.placements.find((entry) => entry.id === footprintEditDrag.value?.placementId)
  if (!placement) return
  applyFootprintEdit(placement, pointerCellForDeck(event), footprintEditDrag.value.mode)
}
const stopPlacementFootprintEdit = () => {
  window.removeEventListener('pointermove', updatePlacementFootprintEdit)
  footprintEditDrag.value = null
}
const startFootprintRectDrag = (event: PointerEvent, mode: Extract<ShapeToolId, 'rectangle' | 'erase'>) => {
  if (event.button !== 0) return
  const startCell = pointerCellForDeck(event)
  if (!startCell) return
  if (mode === 'rectangle' && !activeBrushComponent.value && !selectedLayoutPlacement.value) return
  if (mode === 'erase' && !selectedLayoutPlacement.value) return
  rememberBuilderHistory()
  const placement = mode === 'rectangle' ? brushPlacementForCell(startCell) : selectedLayoutPlacement.value
  if (!placement) return
  event.preventDefault()
  selectedPlacementId.value = placement.id
  footprintRectDrag.value = { placementId: placement.id, mode, startCell, currentCell: startCell }
  window.addEventListener('pointermove', updateFootprintRectDrag)
  window.addEventListener('pointerup', stopFootprintRectDrag, { once: true })
}
const updateFootprintRectDrag = (event: PointerEvent) => {
  if (!footprintRectDrag.value) return
  const currentCell = pointerCellForDeck(event)
  if (currentCell) footprintRectDrag.value.currentCell = currentCell
}
const stopFootprintRectDrag = () => {
  const drag = footprintRectDrag.value
  window.removeEventListener('pointermove', updateFootprintRectDrag)
  footprintRectDrag.value = null
  if (!drag) return
  const placement = buildDraft.value.layout.placements.find((entry) => entry.id === drag.placementId)
  if (!placement) return
  if (drag.mode === 'rectangle') fillRectForPlacement(placement, drag.startCell, drag.currentCell)
  else eraseRectForPlacement(placement, drag.startCell, drag.currentCell)
}
const updateFootprintHover = (event: PointerEvent) => {
  if (!footprintRectDrag.value && !hullEnvelopeDrag.value && !['paint', 'erase', 'rectangle'].includes(activeShapeTool.value)) {
    if (footprintHoverCell.value) clearFootprintHover()
    return
  }
  pendingFootprintHover.value = pointerCellForDeck(event)
  if (footprintHoverFrame.value || typeof window === 'undefined') return
  footprintHoverFrame.value = window.requestAnimationFrame(() => {
    footprintHoverCell.value = pendingFootprintHover.value
    pendingFootprintHover.value = null
    footprintHoverFrame.value = 0
  })
}
const clearFootprintHover = () => {
  if (footprintHoverFrame.value && typeof window !== 'undefined') {
    window.cancelAnimationFrame(footprintHoverFrame.value)
    footprintHoverFrame.value = 0
  }
  pendingFootprintHover.value = null
  footprintHoverCell.value = null
}
const handleDeckPointerDown = (event: PointerEvent) => {
  if (event.button === 2) {
    startCanvasPan(event)
    return
  }
  const mode = activeShapeTool.value
  if (isHullShapeEditing.value && ['paint', 'erase', 'rectangle'].includes(mode)) {
    startHullEnvelopeDrag(event, mode)
    return
  }
  if (event.button === 0 && mode === 'select') {
    clearSelectedPlacement()
    return
  }
  if (mode === 'rectangle') {
    startFootprintRectDrag(event, 'rectangle')
    return
  }
  if (mode === 'erase') {
    startFootprintRectDrag(event, 'erase')
    return
  }
  if (event.button !== 0 || mode !== 'paint') return
  const cell = pointerCellForDeck(event)
  rememberBuilderHistory()
  const placement = brushPlacementForCell(cell)
  if (!placement) return
  event.preventDefault()
  footprintEditDrag.value = { placementId: placement.id, mode, element: deckCanvasRef.value ?? event.currentTarget as HTMLElement }
  applyFootprintEdit(placement, cell, mode)
  window.addEventListener('pointermove', updatePlacementFootprintEdit)
  window.addEventListener('pointerup', stopPlacementFootprintEdit, { once: true })
}
const handlePlacementPointerDown = (event: PointerEvent, placement: CustomShipLayoutPlacement) => {
  event.stopPropagation()
  if (event.button === 2) {
    startCanvasPan(event)
    return
  }
  if (isHullShapeEditing.value && ['paint', 'erase', 'rectangle'].includes(activeShapeTool.value)) {
    startHullEnvelopeDrag(event, activeShapeTool.value)
    return
  }
  if (activeShapeTool.value === 'rectangle') {
    startFootprintRectDrag(event, 'rectangle')
    return
  }
  if (activeShapeTool.value === 'paint') {
    const brushPlacement = brushPlacementForCell(pointerCellForDeck(event))
    if (brushPlacement) startPlacementFootprintEdit(event, brushPlacement, 'paint')
    return
  }
  if (activeShapeTool.value === 'erase') {
    startFootprintRectDrag(event, 'erase')
    return
  }
  if (activeShapeTool.value === 'rectangle') {
    if (event.button !== 0) return
    event.preventDefault()
    selectedPlacementId.value = placement.id
    setRectangularFootprint(placement)
    return
  }
  startPlacementDrag(event, placement, 'move')
}
const startPlacementDrag = (event: PointerEvent, placement: CustomShipLayoutPlacement, mode: LayoutDragMode) => {
  if (event.button !== 0) return
  if (mode === 'move' && activeShapeTool.value !== 'select') return
  event.preventDefault()
  rememberBuilderHistory()
  selectedPlacementId.value = placement.id
  layoutDrag.value = {
    placementId: placement.id,
    mode,
    startClientX: event.clientX,
    startClientY: event.clientY,
    originX: placement.x,
    originY: placement.y,
    originWidth: placement.width,
    originHeight: placement.height,
  }
  window.addEventListener('pointermove', updatePlacementDrag)
  window.addEventListener('pointerup', stopPlacementDrag, { once: true })
}
const updatePlacementDrag = (event: PointerEvent) => {
  if (!layoutDrag.value) return
  const placement = buildDraft.value.layout.placements.find((entry) => entry.id === layoutDrag.value?.placementId)
  if (!placement) return
  const cellSize = layoutCellPixelSize()
  const deltaX = Math.round((event.clientX - layoutDrag.value.startClientX) / cellSize.width)
  const deltaY = Math.round((event.clientY - layoutDrag.value.startClientY) / cellSize.height)
  if (layoutDrag.value.mode === 'move') {
    placement.x = layoutDrag.value.originX + deltaX
    placement.y = layoutDrag.value.originY + deltaY
    clampPlacement(placement)
  } else {
    const width = Math.max(1, Math.min(canvasWorkspaceCells, layoutDrag.value.originWidth + deltaX))
    const height = Math.max(1, Math.min(canvasWorkspaceCells, layoutDrag.value.originHeight + deltaY))
    const candidate = {
      ...placement,
      x: layoutDrag.value.originX,
      y: layoutDrag.value.originY,
      width,
      height,
      footprintCells: rectangularFootprintCells(width, height),
    }
    applyPlacementCandidate(placement, candidate)
  }
}
const stopPlacementDrag = () => {
  window.removeEventListener('pointermove', updatePlacementDrag)
  layoutDrag.value = null
}
const isEditableKeyboardTarget = (target: EventTarget | null) => target instanceof HTMLInputElement
  || target instanceof HTMLTextAreaElement
  || target instanceof HTMLSelectElement
  || (target instanceof HTMLElement && target.isContentEditable)
const handleBuilderKeydown = (event: KeyboardEvent) => {
  if (activeShipyardTab.value !== 'builder' || isEditableKeyboardTarget(event.target)) return
  const key = event.key.toLowerCase()
  if ((event.ctrlKey || event.metaKey) && key === 'z') {
    event.preventDefault()
    if (event.shiftKey) redoBuilderAction()
    else undoBuilderAction()
    return
  }
  if ((event.ctrlKey || event.metaKey) && key === 'y') {
    event.preventDefault()
    redoBuilderAction()
    return
  }
  if (deckConfirmAction.value) {
    if (event.key === 'Escape') {
      event.preventDefault()
      closeDeckConfirm()
    }
    return
  }
  if (event.key === 'Delete' || event.key === 'Backspace') {
    if (!selectedLayoutPlacement.value) return
    event.preventDefault()
    removeSelectedPlacement()
    return
  }
  const nudges: Record<string, [number, number]> = {
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
  }
  const nudge = nudges[event.key]
  if (!nudge || !selectedLayoutPlacement.value) return
  event.preventDefault()
  nudgeSelectedPlacement(event.shiftKey ? nudge[0] * 5 : nudge[0], event.shiftKey ? nudge[1] * 5 : nudge[1])
}
onMounted(() => {
  if (typeof window !== 'undefined') window.addEventListener('keydown', handleBuilderKeydown)
})
onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleBuilderKeydown)
    window.removeEventListener('pointermove', updatePlacementDrag)
    window.removeEventListener('pointermove', updatePlacementFootprintEdit)
    window.removeEventListener('pointermove', updateFootprintRectDrag)
    window.removeEventListener('pointermove', updateCanvasPan)
    window.removeEventListener('pointermove', updateBuilderOverlayDrag)
    if (canvasPanFrame.value) window.cancelAnimationFrame(canvasPanFrame.value)
    if (footprintHoverFrame.value) window.cancelAnimationFrame(footprintHoverFrame.value)
  }
})
</script>

<template>
  <main class="min-h-screen text-cyan-50">
    <div class="mx-auto w-full max-w-[96rem] px-5 pt-6 sm:px-8 lg:px-10">
      <div class="hud-tabs flex flex-wrap gap-2 border-b border-cyan-400/30">
        <button
          v-for="tab in shipyardTabs"
          :key="tab.id"
          class="-mb-px rounded-t-md border px-4 py-2 text-sm font-semibold"
          :class="activeShipyardTab === tab.id ? 'border-zinc-300 border-b-white bg-white text-zinc-950' : 'border-transparent text-zinc-500 hover:text-zinc-950'"
          type="button"
          @click="activeShipyardTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <section v-if="activeShipyardTab === 'stock'" class="mx-auto grid w-full max-w-[96rem] gap-5 px-5 py-6 sm:px-8 xl:grid-cols-[minmax(0,1fr)_25rem] lg:px-10">
      <div class="grid gap-5">
        <section class="hud-panel rounded-lg border p-5 shadow-sm">
          <div class="list-reference-header flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/70">Stock Ships</p>
              <h1 class="mt-1 text-2xl font-semibold text-white">Shipyard Reference</h1>
              <p class="mt-1 text-sm text-cyan-100/70">Phase 4 stock spacecraft catalogue. Small craft are held for Phase 5.</p>
            </div>
            <div class="list-search-actions">
              <input v-model="search" class="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="Search ships">
              <button class="list-category-toggle hud-link h-10 w-11" :aria-expanded="categoryMenuOpen" aria-label="Toggle ship categories" type="button" @click.stop.prevent="categoryMenuOpen = !categoryMenuOpen">
                <span :class="['list-category-toggle__line', categoryMenuOpen ? 'is-open' : '']" />
                <span :class="['list-category-toggle__line', categoryMenuOpen ? 'is-open' : '']" />
                <span :class="['list-category-toggle__line', categoryMenuOpen ? 'is-open' : '']" />
              </button>
            </div>
          </div>

          <div :class="['list-category-panel mt-4', categoryMenuOpen ? 'is-open' : '']">
            <button
              v-for="category in categories"
              :key="category.id"
              class="rounded-md border px-3 py-2 text-sm font-semibold"
              :class="selectedCategory === category.id ? 'border-zinc-950 bg-zinc-950 text-white' : 'border-zinc-300 text-zinc-700 hover:border-amber-600'"
              type="button"
              @click="selectShipCategory(category.id)"
            >
              {{ category.label }}
            </button>
          </div>

          <div class="hud-table-shell hud-scrollbar mt-4 max-h-[46rem] overflow-auto rounded-md border">
            <table class="mobile-collapsible-table w-full min-w-[62rem] text-left text-sm">
              <thead class="sticky top-0 z-10 bg-stone-100 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th v-for="column in sortableShipColumns" :key="column.key" class="px-3 py-2">
                    <button class="flex items-center gap-1 font-semibold uppercase tracking-wide hover:text-zinc-950" type="button" @click="setShipSort(column.key)">
                      <span>{{ column.label }}</span>
                      <span class="inline-flex h-4 w-4 items-center text-amber-700">
                        <AppIcon v-if="shipSortIndicator(column.key)" class="h-4 w-4" :name="shipSortIndicator(column.key) ?? 'sort-asc'" />
                      </span>
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                <template v-for="ship in filteredReferenceShips" :key="ship.id">
                  <tr class="cursor-pointer border-t border-zinc-200 align-top" :class="selectedShip?.id === ship.id ? 'bg-cyan-50/80' : 'hover:bg-stone-50'" @click="selectedShipId = ship.id">
                    <td class="px-3 py-2 font-semibold text-zinc-950">
                      <button class="mobile-row-toggle block w-full text-left font-semibold" type="button" @click.stop="toggleExpandedShip(ship.id)">
                        {{ ship.name }}
                      </button>
                      <span class="mt-1 block text-xs font-medium text-zinc-500">{{ sourceLabel(ship) }}</span>
                    </td>
                    <td class="px-3 py-2">{{ ship.tons }}</td>
                    <td class="px-3 py-2">{{ ship.techLevel ? `TL${ship.techLevel}` : '—' }}</td>
                    <td class="px-3 py-2">{{ categoryLabel(ship.category) }}</td>
                    <td class="px-3 py-2">{{ ship.jump }}</td>
                    <td class="px-3 py-2">{{ ship.thrust }}</td>
                  </tr>
                  <tr v-if="expandedShipId === ship.id" class="mobile-detail-row border-t border-cyan-400/20">
                    <td :colspan="sortableShipColumns.length" class="px-3 py-3">
                      <div class="mobile-row-detail-grid">
                        <div><span>Tons</span><strong>{{ ship.tons }}</strong></div>
                        <div><span>Jump</span><strong>{{ ship.jump }}</strong></div>
                        <div><span>Thrust</span><strong>{{ ship.thrust }}</strong></div>
                        <div><span>Tech Level</span><strong>{{ ship.techLevel ? `TL${ship.techLevel}` : '—' }}</strong></div>
                        <div><span>Crew</span><strong>{{ ship.crew }}</strong></div>
                        <div><span>Cost</span><strong>{{ ship.cost }}</strong></div>
                        <div class="sm:col-span-2"><span>Role</span><strong>{{ ship.role }}</strong></div>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <aside v-if="selectedShip" class="hud-panel hud-scrollbar rounded-lg border p-5 shadow-sm xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-auto">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/70">{{ categoryLabel(selectedShip.category) }}</p>
        <h2 class="mt-2 text-2xl font-semibold">{{ selectedShip.name }}</h2>
        <p class="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/60">{{ sourceLabel(selectedShip) }}</p>
        <p class="mt-2 text-sm text-cyan-100/72">{{ selectedShip.description }}</p>
        <dl class="mt-5 grid gap-3 text-sm text-cyan-100/78">
          <div class="flex items-center justify-between gap-4"><dt>Tonnage</dt><dd>{{ selectedShip.tons }} tons</dd></div>
          <div class="flex items-center justify-between gap-4"><dt>Tech Level</dt><dd>{{ selectedShip.techLevel ? `TL${selectedShip.techLevel}` : '—' }}</dd></div>
          <div class="flex items-center justify-between gap-4"><dt>Role</dt><dd>{{ selectedShip.role }}</dd></div>
          <div class="flex items-center justify-between gap-4"><dt>Jump</dt><dd>{{ selectedShip.jump }}</dd></div>
          <div class="flex items-center justify-between gap-4"><dt>Thrust</dt><dd>{{ selectedShip.thrust }}</dd></div>
          <div class="flex items-center justify-between gap-4"><dt>Crew</dt><dd>{{ selectedShip.crew }}</dd></div>
          <div class="flex items-center justify-between gap-4"><dt>Cost</dt><dd>{{ selectedShip.cost }}</dd></div>
        </dl>
        <div v-if="selectedShip.traits.length" class="mt-5 rounded-md border border-cyan-400/20 bg-white/5 px-4 py-3">
          <h3 class="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-200/78">Traits</h3>
          <p class="mt-2 text-sm text-cyan-100/78">{{ selectedShip.traits.join(', ') }}</p>
        </div>
        <div v-if="selectedShip.components?.length || selectedShip.derived || selectedShip.costs" class="mt-5 rounded-md border border-cyan-400/20 bg-white/5 px-4 py-3">
          <h3 class="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-200/78">Datasheet</h3>
          <dl class="mt-3 grid gap-2 text-sm text-cyan-100/78">
            <div v-if="selectedShip.derived?.hullPoints" class="flex items-center justify-between gap-4"><dt>Hull Points</dt><dd>{{ selectedShip.derived.hullPoints }}</dd></div>
            <div v-if="selectedShip.derived" class="flex items-center justify-between gap-4"><dt>Tons Used</dt><dd>{{ selectedShip.derived.tonsUsed }}</dd></div>
            <div v-if="selectedShip.derived?.power" class="flex items-center justify-between gap-4"><dt>Power</dt><dd>{{ selectedShip.derived.power.output }} generated</dd></div>
            <div v-if="selectedShip.costs?.monthlyMaintenanceCredits" class="flex items-center justify-between gap-4"><dt>Maintenance</dt><dd>Cr{{ selectedShip.costs.monthlyMaintenanceCredits.toLocaleString() }}/month</dd></div>
            <div v-if="selectedShip.components?.length" class="flex items-center justify-between gap-4"><dt>Components</dt><dd>{{ selectedShip.components.length }}</dd></div>
          </dl>
        </div>
        <div v-if="selectedShip.derived?.power" class="mt-5 rounded-md border border-cyan-400/20 bg-white/5 px-4 py-3">
          <h3 class="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-200/78">Power</h3>
          <dl class="mt-3 grid gap-2 text-sm text-cyan-100/78">
            <div class="flex items-center justify-between gap-4"><dt>Output</dt><dd>{{ selectedShip.derived.power.output }}</dd></div>
            <div class="flex items-center justify-between gap-4"><dt>Routine</dt><dd>{{ selectedShip.derived.power.totalRoutine }} / {{ selectedShip.derived.power.surplusRoutine }} spare</dd></div>
            <div class="flex items-center justify-between gap-4"><dt>Jump</dt><dd>{{ selectedShip.derived.power.totalJump }} / {{ selectedShip.derived.power.surplusJump }} spare</dd></div>
            <div class="flex items-center justify-between gap-4"><dt>Combat</dt><dd>{{ selectedShip.derived.power.totalCombat }} / {{ selectedShip.derived.power.surplusCombat }} spare</dd></div>
          </dl>
        </div>
        <div v-if="selectedShip.components?.length" class="mt-5 rounded-md border border-cyan-400/20 bg-white/5 px-4 py-3">
          <h3 class="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-200/78">Components</h3>
          <div class="mt-3 grid gap-2">
            <div v-for="component in selectedShip.components" :key="component.id" class="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-t border-cyan-400/10 pt-2 first:border-t-0 first:pt-0">
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold text-cyan-50">{{ component.name }}</p>
                <p class="text-xs text-cyan-100/50">{{ componentKindLabel(component.kind) }}</p>
              </div>
              <div class="text-right text-sm text-cyan-100/78">
                <p>{{ component.tons }} tons</p>
                <p class="text-xs text-cyan-100/50">{{ component.cost?.label ?? '—' }}</p>
              </div>
            </div>
          </div>
        </div>
        <div v-if="selectedShip.validationIssues?.length" class="mt-5 rounded-md border border-amber-300/30 bg-amber-300/10 px-4 py-3">
          <h3 class="text-sm font-semibold uppercase tracking-[0.16em] text-amber-200">Validation</h3>
          <ul class="mt-2 grid gap-1 text-sm text-amber-50/82">
            <li v-for="issue in selectedShip.validationIssues" :key="issue">{{ issue }}</li>
          </ul>
        </div>
        <div v-if="selectedShip.notes" class="mt-5 rounded-md border border-cyan-400/20 bg-white/5 px-4 py-3">
          <h3 class="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-200/78">Notes</h3>
          <p class="mt-2 text-sm text-cyan-100/78">{{ selectedShip.notes }}</p>
        </div>
      </aside>
    </section>

    <section v-else-if="activeShipyardTab === 'custom'" class="mx-auto grid w-full max-w-[96rem] gap-5 px-5 py-6 sm:px-8 xl:grid-cols-[minmax(0,1fr)_25rem] lg:px-10">
      <section class="hud-panel rounded-lg border p-5 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/70">Custom Ships</p>
            <h1 class="mt-1 text-2xl font-semibold text-white">Saved Spacecraft</h1>
            <p class="mt-1 text-sm text-cyan-100/70">Player-built spacecraft will appear here once the builder save flow is connected.</p>
          </div>
          <button class="rounded-md border border-cyan-300/40 px-4 py-2 text-sm font-semibold text-cyan-50 hover:border-amber-300/60" type="button" @click="activeShipyardTab = 'builder'">
            New Ship
          </button>
        </div>

        <div v-if="customShips.length" class="mt-5 grid gap-3">
          <article v-for="ship in customShips" :key="ship.id" class="rounded-md border border-cyan-400/20 bg-white/5 px-4 py-3">
            <h2 class="text-lg font-semibold text-white">{{ ship.name }}</h2>
            <p class="mt-1 text-sm text-cyan-100/72">{{ ship.notes }}</p>
          </article>
        </div>

        <div v-else class="mt-5 rounded-md border border-cyan-400/20 bg-white/5 px-4 py-6">
          <p class="text-sm font-semibold text-cyan-50">No custom spacecraft saved yet.</p>
          <p class="mt-1 text-sm text-cyan-100/70">The next builder pass will create the draft state and save path for this view.</p>
        </div>
      </section>

      <aside class="hud-panel rounded-lg border p-5 shadow-sm">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/70">Phase 4</p>
        <h2 class="mt-2 text-2xl font-semibold">Custom Registry</h2>
        <p class="mt-2 text-sm text-cyan-100/72">This view is reserved for saved High Guard spacecraft. Small craft will remain separate for Phase 5.</p>
      </aside>
    </section>

    <section v-else-if="activeShipyardTab === 'builder'" class="mx-auto w-full max-w-[112rem] px-4 py-5 sm:px-6 lg:px-8">
      <section class="hud-panel rounded-lg border p-4 shadow-sm">
        <div
          class="relative"
        >
          <div
            v-if="deckConfirmCopy"
            class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4"
            role="dialog"
            aria-modal="true"
          >
            <section class="w-[min(24rem,calc(100vw-2rem))] rounded-md border border-cyan-400/40 bg-slate-950 p-4 shadow-2xl shadow-black/70">
              <div class="flex items-start gap-3">
                <span class="relative mt-1 h-8 w-10 shrink-0 text-cyan-100" aria-hidden="true">
                  <span class="absolute left-1 top-0 h-3 w-8 skew-x-[-24deg] bg-current opacity-95" />
                  <span class="absolute left-1 top-2.5 h-3 w-8 skew-x-[-24deg] bg-current opacity-75" />
                  <span class="absolute left-1 top-5 h-3 w-8 skew-x-[-24deg] bg-current opacity-55" />
                </span>
                <div class="min-w-0">
                  <h2 class="text-base font-semibold text-white">{{ deckConfirmCopy.title }}</h2>
                  <p class="mt-1 text-sm text-cyan-100/70">{{ deckConfirmCopy.body }}</p>
                </div>
              </div>
              <div class="mt-4 flex justify-end gap-2">
                <button class="rounded-md border border-cyan-300/30 px-3 py-2 text-sm font-semibold text-cyan-100 hover:border-cyan-100" type="button" @click="closeDeckConfirm">Cancel</button>
                <button
                  class="rounded-md border px-3 py-2 text-sm font-semibold"
                  :class="deckConfirmAction === 'delete' ? 'border-rose-300/50 bg-rose-400/15 text-rose-50 hover:border-rose-200' : 'border-cyan-100 bg-cyan-100 text-zinc-950 hover:border-amber-200 hover:bg-amber-200'"
                  type="button"
                  @click="confirmDeckAction"
                >
                  {{ deckConfirmCopy.confirm }}
                </button>
              </div>
            </section>
          </div>

          <div
            v-if="hullRedesignConfirmOpen"
            class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4"
            role="dialog"
            aria-modal="true"
          >
            <section class="w-[min(28rem,calc(100vw-2rem))] rounded-md border border-amber-300/45 bg-slate-950 p-4 shadow-2xl shadow-black/70">
              <div class="flex items-start gap-3">
                <AppIcon class="mt-1 h-8 w-8 shrink-0 text-amber-200" name="warning" />
                <div class="min-w-0">
                  <h2 class="text-base font-semibold text-white">Confirm Hull Redesign</h2>
                  <p class="mt-1 text-sm text-cyan-100/70">Changing hull tonnage or configuration can invalidate drives, fuel, bridge sizing, cargo, staterooms, and deck placements.</p>
                </div>
              </div>
              <div class="mt-4 flex justify-end gap-2">
                <button class="rounded-md border border-cyan-300/30 px-3 py-2 text-sm font-semibold text-cyan-100 hover:border-cyan-100" type="button" @click="cancelHullRedesign">Cancel</button>
                <button class="rounded-md border border-amber-200 bg-amber-300 px-3 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-200" type="button" @click="confirmHullRedesign">Keep Change</button>
              </div>
            </section>
          </div>

          <section
            v-if="builderCanvasOverlay && builderCanvasOverlay !== 'ledger'"
            class="hud-scrollbar absolute z-30 max-h-[calc(100vh-8rem)] overflow-auto rounded-md border border-cyan-400/40 bg-slate-950/95 p-3 shadow-2xl shadow-black/60 backdrop-blur-sm [&_input]:w-full [&_select]:w-full"
            :class="builderCanvasOverlay === 'tool' ? 'w-[min(42rem,calc(100%-2rem))]' : 'w-[min(24rem,calc(100%-2rem))]'"
            :style="builderOverlayStyle"
          >
            <div class="rounded-md border border-cyan-400/25 bg-cyan-950/85 p-3">
              <div class="flex cursor-grab items-center gap-3 active:cursor-grabbing" title="Drag panel" @pointerdown="startBuilderOverlayDrag">
                <img :alt="builderCanvasOverlay === 'tool' ? activeBuilderStep.title : 'Component Tray'" class="h-9 w-9 shrink-0 object-contain" :src="builderCanvasOverlay === 'tool' ? builderStepIconUrl(activeBuilderStep.id) : cargoIconUrl">
                <div class="min-w-0">
                  <p class="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/70">{{ builderCanvasOverlay === 'tool' ? 'Selected Tool' : 'Component Tray' }}</p>
                  <h2 class="truncate text-base font-semibold text-white">{{ builderCanvasOverlay === 'tool' ? activeBuilderStep.title : 'Placeable Systems' }}</h2>
                </div>
                <button class="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-cyan-300/35 text-cyan-50 hover:border-amber-300/60" type="button" @pointerdown.stop @click="builderCanvasOverlay = ''">
                  <AppIcon class="h-4 w-4" name="close" />
                  <span class="sr-only">Close overlay</span>
                </button>
              </div>
              <p v-if="builderCanvasOverlay === 'tool'" class="mt-2 text-sm text-cyan-100/70">{{ activeBuilderStep.description }}</p>
            </div>

            <div v-if="builderCanvasOverlay === 'tool'" class="mt-4">
            <div v-if="activeBuilderStep.id === 'setup'" class="mt-5 grid gap-4 md:grid-cols-3">
              <label class="grid gap-1 text-sm font-semibold text-cyan-50 md:col-span-2">
                Ship Name
                <input v-model="buildDraft.name" class="h-9 rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
              </label>
              <label class="grid gap-1 text-sm font-semibold text-cyan-50">
                Shipyard TL
                <input v-model.number="buildDraft.techLevel" class="h-9 rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" min="6" type="number">
              </label>
              <label class="grid gap-1 text-sm font-semibold text-cyan-50 md:col-span-2">
                Role
                <input v-model="buildDraft.buildBrief.role" class="h-9 rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
              </label>
              <label class="grid gap-1 text-sm font-semibold text-cyan-50">
                Budget Target
                <input v-model="buildDraft.buildBrief.targetBudgetMCr" class="h-9 rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="MCr">
              </label>
              <label class="grid gap-1 text-sm font-semibold text-cyan-50">
                Design Mode
                <select v-model="buildDraft.buildBrief.designMode" class="h-9 rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
                  <option value="new">New Design</option>
                  <option value="standard">Standard Design</option>
                </select>
              </label>
              <label class="grid gap-1 text-sm font-semibold text-cyan-50">
                Crew Mode
                <select v-model="buildDraft.buildBrief.crewMode" class="h-9 rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
                  <option value="commercial">Commercial</option>
                  <option value="military">Military</option>
                </select>
              </label>
              <label class="grid gap-1 text-sm font-semibold text-cyan-50">
                Target Tonnage
                <input v-model.number="buildDraft.buildBrief.targetTonnage" class="h-9 rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" min="100" step="100" type="number">
              </label>
              <label class="grid gap-1 text-sm font-semibold text-cyan-50">
                Target Jump
                <input v-model.number="buildDraft.buildBrief.targetJump" class="h-9 rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" max="9" min="0" type="number">
              </label>
              <label class="grid gap-1 text-sm font-semibold text-cyan-50">
                Target Thrust
                <input v-model.number="buildDraft.buildBrief.targetThrust" class="h-9 rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" max="16" min="0" type="number">
              </label>
              <label class="grid gap-1 text-sm font-semibold text-cyan-50">
                Passenger Target
                <input v-model="buildDraft.buildBrief.passengerTarget" class="h-9 rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
              </label>
              <label class="grid gap-1 text-sm font-semibold text-cyan-50">
                Cargo Target
                <input v-model="buildDraft.buildBrief.cargoTarget" class="h-9 rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
              </label>
              <label class="grid gap-1 text-sm font-semibold text-cyan-50 md:col-span-3">
                Notes
                <textarea v-model="buildDraft.buildBrief.notes" class="min-h-20 rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" />
              </label>
            </div>

            <div v-else-if="activeBuilderStep.id === 'hull'" class="mt-5 grid gap-4">
              <div class="grid gap-3 md:grid-cols-3">
                <label class="grid gap-1 text-sm font-semibold text-cyan-50">
                  Tonnage
                  <input v-model.number="buildDraft.tons" class="h-9 rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" min="100" step="100" type="number" @change="checkHullRedesignChange" @focus="captureHullRedesignSnapshot">
                </label>
                <label class="grid gap-1 text-sm font-semibold text-cyan-50">
                  Tech Level
                  <input v-model.number="buildDraft.techLevel" class="h-9 rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" min="6" type="number">
                </label>
                <label class="grid gap-1 text-sm font-semibold text-cyan-50">
                  Configuration
                  <select v-model="buildDraft.hull.configuration" class="h-9 rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" @change="checkHullRedesignChange" @focus="captureHullRedesignSnapshot">
                    <option v-for="rule in shipHullConfigurationRules" :key="rule.id" :value="rule.id">{{ rule.label }}</option>
                  </select>
                </label>
              </div>

              <div class="grid gap-3 md:grid-cols-3">
                <section class="rounded-md border border-cyan-400/20 bg-slate-950/60 p-3">
                  <p class="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200/70">Specialised Hull</p>
                  <label v-for="rule in shipSpecialisedHullRules" :key="rule.id" class="mt-2 flex items-start gap-2 text-xs font-semibold text-cyan-50">
                    <input v-model="buildDraft.hull.specialisedHullTypes" class="mt-0.5 h-4 w-4" type="checkbox" :value="rule.id">
                    <span><span class="block">{{ rule.label }}</span><span class="block font-normal text-cyan-100/55">{{ rule.notes }}</span></span>
                  </label>
                </section>
                <section class="rounded-md border border-cyan-400/20 bg-slate-950/60 p-3">
                  <p class="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200/70">Additional Hull</p>
                  <label v-for="rule in shipAdditionalHullRules" :key="rule.id" class="mt-2 flex items-start gap-2 text-xs font-semibold text-cyan-50">
                    <input v-model="buildDraft.hull.additionalHullTypes" class="mt-0.5 h-4 w-4" type="checkbox" :value="rule.id">
                    <span><span class="block">{{ rule.label }}</span><span class="block font-normal text-cyan-100/55">{{ rule.notes }}</span></span>
                  </label>
                </section>
                <section class="rounded-md border border-cyan-400/20 bg-slate-950/60 p-3">
                  <p class="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200/70">Hull Options</p>
                  <label v-for="rule in shipHullOptionRules" :key="rule.id" class="mt-2 flex items-start gap-2 text-xs font-semibold text-cyan-50">
                    <input v-model="buildDraft.hull.hullOptions" class="mt-0.5 h-4 w-4" type="checkbox" :value="rule.id">
                    <span><span class="block">{{ rule.label }}</span><span class="block font-normal text-cyan-100/55">{{ rule.notes }}</span></span>
                  </label>
                </section>
              </div>

              <div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_8rem]">
                <label class="grid gap-1 text-sm font-semibold text-cyan-50">
                  Armour Type
                  <select v-model="buildDraft.hull.armourType" class="h-9 rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
                    <option value="">None</option>
                    <option v-for="rule in shipHullArmourRules" :key="rule.id" :value="rule.id">{{ rule.label }}</option>
                  </select>
                </label>
                <label class="grid gap-1 text-sm font-semibold text-cyan-50">
                  Protection
                  <input v-model.number="buildDraft.hull.armourProtection" class="h-9 rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" min="0" type="number">
                </label>
              </div>

              <div class="grid gap-2 rounded-md border border-cyan-400/25 bg-cyan-950/70 p-3 md:grid-cols-4">
                <div><p class="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-cyan-200/70">Hull Cost</p><p class="mt-1 text-sm font-semibold text-white">{{ formatShipCost(hullStepResult.hullCostCredits) }}</p></div>
                <div><p class="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-cyan-200/70">Hull Points</p><p class="mt-1 text-sm font-semibold text-white">{{ hullStepResult.hullPoints }}</p></div>
                <div><p class="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-cyan-200/70">Usable Tons</p><p class="mt-1 text-sm font-semibold text-white">{{ formatLedgerNumber(hullStepResult.usableTons) }}</p></div>
                <div><p class="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-cyan-200/70">Armour</p><p class="mt-1 text-sm font-semibold text-white">{{ hullStepResult.armour ? `${formatLedgerNumber(hullStepResult.armour.tons)} tons` : 'None' }}</p></div>
              </div>

              <div class="grid gap-2 rounded-md border border-cyan-400/20 bg-slate-950/65 p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200/70">Hull Shape</p>
                  <p class="mt-1 text-sm text-cyan-100/70">{{ hullEnvelopeLabel }} · {{ activeHullEnvelope?.preset === 'custom' ? 'Custom shape' : 'Generated preset' }}</p>
                </div>
                <button
                  class="rounded-md border border-cyan-300/35 px-3 py-2 text-xs font-semibold text-cyan-50 hover:border-amber-300/60"
                  type="button"
                  @click="resetHullEnvelope"
                >
                  Regenerate
                </button>
              </div>

              <div v-if="hullStepResult.issues.length" class="grid gap-2">
                <p
                  v-for="issue in hullStepResult.issues"
                  :key="issue.code"
                  class="rounded-md border px-3 py-2 text-sm"
                  :class="issue.severity === 'error' ? 'border-rose-300/35 bg-rose-500/12 text-rose-50' : 'border-amber-300/35 bg-amber-400/12 text-amber-50'"
                >
                  {{ issue.message }}
                </p>
              </div>
            </div>

            <div v-else-if="activeBuilderStep.id === 'drives'" class="mt-5 grid gap-4 md:grid-cols-3">
              <label class="grid gap-1 text-sm font-semibold text-cyan-50">
                Manoeuvre
                <input v-model.number="buildDraft.drives.manoeuvreDriveRating" class="h-10 rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" max="11" min="0" type="number">
              </label>
              <label class="grid gap-1 text-sm font-semibold text-cyan-50">
                Jump
                <input v-model.number="buildDraft.drives.jumpDriveRating" class="h-10 rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" max="9" min="0" type="number">
              </label>
              <label class="grid gap-1 text-sm font-semibold text-cyan-50">
                Reaction
                <input v-model.number="buildDraft.drives.reactionDriveRating" class="h-10 rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" max="16" min="0" type="number">
              </label>
              <label class="flex items-center gap-2 text-sm font-semibold text-cyan-50 md:col-span-3">
                <input v-model="buildDraft.drives.usesReactionDrive" class="h-4 w-4" type="checkbox">
                Use reaction drive instead of manoeuvre drive for thrust accounting
              </label>
            </div>

            <div v-else-if="activeBuilderStep.id === 'fuel'" class="mt-5 grid gap-4 md:grid-cols-2">
              <label class="grid gap-1 text-sm font-semibold text-cyan-50">
                Power Plant Endurance Weeks
                <input v-model.number="buildDraft.fuel.powerPlantEnduranceWeeks" class="h-10 rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" min="1" type="number">
              </label>
              <label class="grid gap-1 text-sm font-semibold text-cyan-50">
                Reaction Fuel Hours
                <input v-model.number="buildDraft.fuel.reactionFuelHours" class="h-10 rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" min="0" type="number">
              </label>
            </div>

            <div v-else-if="activeBuilderStep.id === 'power-plant'" class="mt-5 grid gap-4 md:grid-cols-2">
              <label class="grid gap-1 text-sm font-semibold text-cyan-50">
                Power Plant
                <select v-model="buildDraft.powerPlant.type" class="h-10 rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
                  <option value="fission-tl6">Fission TL6</option>
                  <option value="chemical-tl7">Chemical TL7</option>
                  <option value="fusion-tl8">Fusion TL8</option>
                  <option value="fusion-tl12">Fusion TL12</option>
                  <option value="fusion-tl15">Fusion TL15</option>
                  <option value="antimatter-tl20">Antimatter TL20</option>
                </select>
              </label>
              <label class="grid gap-1 text-sm font-semibold text-cyan-50">
                Plant Tons
                <input v-model.number="buildDraft.powerPlant.tons" class="h-10 rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" min="0" type="number">
              </label>
            </div>

            <div v-else-if="activeBuilderStep.id === 'bridge'" class="mt-5 grid gap-3">
              <label class="flex items-center gap-2 text-sm font-semibold text-cyan-50">
                <input v-model="buildDraft.bridge.smallerBridge" class="h-4 w-4" type="checkbox">
                Smaller bridge
              </label>
              <label class="flex items-center gap-2 text-sm font-semibold text-cyan-50">
                <input v-model="buildDraft.bridge.commandBridge" class="h-4 w-4" type="checkbox">
                Command bridge
              </label>
            </div>

            <div v-else-if="activeBuilderStep.id === 'computer'" class="mt-5 grid gap-4 md:grid-cols-2">
              <label class="grid gap-1 text-sm font-semibold text-cyan-50">
                Computer
                <select v-model="buildDraft.computer.model" class="h-10 rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
                  <option value="computer-5">Computer/5</option>
                  <option value="computer-10">Computer/10</option>
                  <option value="computer-15">Computer/15</option>
                  <option value="computer-20">Computer/20</option>
                  <option value="computer-25">Computer/25</option>
                  <option value="computer-30">Computer/30</option>
                  <option value="computer-35">Computer/35</option>
                  <option value="core-40">Core/40</option>
                  <option value="core-60">Core/60</option>
                  <option value="core-100">Core/100</option>
                </select>
              </label>
              <label class="grid gap-1 text-sm font-semibold text-cyan-50">
                Backup
                <select v-model="buildDraft.computer.backupModel" class="h-10 rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
                  <option value="">None</option>
                  <option value="computer-5">Computer/5</option>
                  <option value="computer-10">Computer/10</option>
                  <option value="computer-20">Computer/20</option>
                  <option value="computer-35">Computer/35</option>
                </select>
              </label>
              <label class="flex items-center gap-2 text-sm font-semibold text-cyan-50">
                <input v-model="buildDraft.computer.jumpControlSpecialisation" class="h-4 w-4" type="checkbox">
                Jump control specialisation
              </label>
              <label class="flex items-center gap-2 text-sm font-semibold text-cyan-50">
                <input v-model="buildDraft.computer.hardenedSystems" class="h-4 w-4" type="checkbox">
                Hardened systems
              </label>
              <section class="rounded-md border border-cyan-400/20 bg-cyan-950/75 p-3 md:col-span-2">
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <h3 class="text-sm font-semibold text-white">Software</h3>
                    <p class="mt-1 text-xs text-cyan-100/60">{{ formatLedgerNumber(buildSummary.derived.bandwidth?.used) }} / {{ formatLedgerNumber(buildSummary.derived.bandwidth?.available) }} bandwidth</p>
                  </div>
                  <button class="rounded-md border border-cyan-300/30 px-2 py-1 text-xs font-semibold text-cyan-100 hover:border-amber-300/60" type="button" @click="buildDraft.software.push(createSoftwareEntry())">Add Software</button>
                </div>
                <div class="mt-3 grid gap-2">
                  <article v-for="software in buildDraft.software" :key="software.id" class="grid gap-2 rounded-md border border-cyan-400/20 bg-slate-950/70 p-2 md:grid-cols-[minmax(0,1fr)_5rem_auto]">
                    <input v-model="software.name" class="h-8 rounded-md border border-cyan-300/25 bg-slate-900 px-2 text-xs text-cyan-50 outline-none focus:border-amber-300/60" placeholder="Software">
                    <input v-model.number="software.bandwidth" class="h-8 rounded-md border border-cyan-300/25 bg-slate-900 px-2 text-xs text-cyan-50 outline-none focus:border-amber-300/60" min="0" title="Bandwidth" type="number">
                    <button class="flex h-8 w-8 items-center justify-center rounded-md border border-rose-300/30 text-rose-100 hover:border-rose-200" title="Remove software" type="button" @click="buildDraft.software = buildDraft.software.filter((entry) => entry.id !== software.id)">
                      <AppIcon class="h-4 w-4" name="trash" />
                    </button>
                  </article>
                  <p v-if="!buildDraft.software.length" class="rounded-md border border-cyan-400/20 bg-slate-950/50 px-3 py-2 text-sm text-cyan-100/65">No software selected.</p>
                </div>
              </section>
            </div>

            <div v-else-if="activeBuilderStep.id === 'sensors'" class="mt-5 grid gap-4 md:grid-cols-2">
              <label class="grid gap-1 text-sm font-semibold text-cyan-50">
                Sensor Suite
                <select v-model="buildDraft.sensors.type" class="h-10 rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
                  <option value="basic">Basic</option>
                  <option value="civilian-grade">Civilian Grade</option>
                  <option value="military-grade">Military Grade</option>
                  <option value="improved">Improved</option>
                  <option value="advanced">Advanced</option>
                </select>
              </label>
            </div>

            <div v-else-if="activeBuilderStep.id === 'weapons'" class="mt-5 grid gap-4">
              <div class="grid gap-3 md:grid-cols-3">
                <div class="rounded-md border border-cyan-400/20 bg-cyan-950/75 p-3">
                  <p class="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/70">Hardpoints</p>
                  <p class="mt-1 text-lg font-semibold text-white">{{ formatLedgerNumber(buildSummary.derived.hardpoints?.used) }} / {{ formatLedgerNumber(buildSummary.derived.hardpoints?.available) }}</p>
                  <p class="text-xs text-cyan-100/60">{{ formatLedgerNumber(buildSummary.derived.hardpoints?.remaining) }} remaining</p>
                </div>
                <div class="rounded-md border border-cyan-400/20 bg-cyan-950/75 p-3">
                  <p class="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/70">Weapon Power</p>
                  <p class="mt-1 text-lg font-semibold text-white">{{ formatLedgerNumber(buildSummary.derived.power?.weapons) }}</p>
                  <p class="text-xs text-cyan-100/60">Combat draw</p>
                </div>
                <div class="rounded-md border border-cyan-400/20 bg-cyan-950/75 p-3">
                  <p class="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/70">Screens</p>
                  <p class="mt-1 text-lg font-semibold text-white">{{ buildDraft.screenSystems.length }}</p>
                  <p class="text-xs text-cyan-100/60">{{ formatLedgerNumber(buildSummary.derived.power?.screens) }} Power</p>
                </div>
              </div>

              <section class="rounded-md border border-cyan-400/20 bg-cyan-950/75 p-3">
                <div class="flex items-center justify-between gap-3">
                  <h3 class="text-sm font-semibold text-white">Weapons</h3>
                  <button class="rounded-md border border-cyan-300/30 px-2 py-1 text-xs font-semibold text-cyan-100 hover:border-amber-300/60" type="button" @click="buildDraft.weaponSystems.push(createWeaponSystem())">Add Weapon</button>
                </div>
                <div class="mt-3 grid gap-2">
                  <article v-for="weapon in buildDraft.weaponSystems" :key="weapon.id" class="grid gap-2 rounded-md border border-cyan-400/20 bg-slate-950/70 p-2 md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)_repeat(4,minmax(4rem,0.55fr))_auto]">
                    <input v-model="weapon.name" class="h-8 rounded-md border border-cyan-300/25 bg-slate-900 px-2 text-xs text-cyan-50 outline-none focus:border-amber-300/60" placeholder="Weapon">
                    <input v-model="weapon.mount" class="h-8 rounded-md border border-cyan-300/25 bg-slate-900 px-2 text-xs text-cyan-50 outline-none focus:border-amber-300/60" placeholder="Mount">
                    <input v-model.number="weapon.count" class="h-8 rounded-md border border-cyan-300/25 bg-slate-900 px-2 text-xs text-cyan-50 outline-none focus:border-amber-300/60" min="1" title="Count" type="number">
                    <input v-model.number="weapon.hardpointsUsed" class="h-8 rounded-md border border-cyan-300/25 bg-slate-900 px-2 text-xs text-cyan-50 outline-none focus:border-amber-300/60" min="0" title="Hardpoints" type="number">
                    <input v-model.number="weapon.tons" class="h-8 rounded-md border border-cyan-300/25 bg-slate-900 px-2 text-xs text-cyan-50 outline-none focus:border-amber-300/60" min="0" step="0.25" title="Tons" type="number">
                    <input v-model.number="weapon.power" class="h-8 rounded-md border border-cyan-300/25 bg-slate-900 px-2 text-xs text-cyan-50 outline-none focus:border-amber-300/60" min="0" title="Power" type="number">
                    <button class="flex h-8 w-8 items-center justify-center rounded-md border border-rose-300/30 text-rose-100 hover:border-rose-200" title="Remove weapon" type="button" @click="buildDraft.weaponSystems = buildDraft.weaponSystems.filter((entry) => entry.id !== weapon.id)">
                      <AppIcon class="h-4 w-4" name="trash" />
                    </button>
                  </article>
                  <p v-if="!buildDraft.weaponSystems.length" class="rounded-md border border-cyan-400/20 bg-slate-950/50 px-3 py-2 text-sm text-cyan-100/65">No weapons installed.</p>
                </div>
              </section>

              <section class="rounded-md border border-cyan-400/20 bg-cyan-950/75 p-3">
                <div class="flex items-center justify-between gap-3">
                  <h3 class="text-sm font-semibold text-white">Screens</h3>
                  <button class="rounded-md border border-cyan-300/30 px-2 py-1 text-xs font-semibold text-cyan-100 hover:border-amber-300/60" type="button" @click="buildDraft.screenSystems.push(createScreenSystem())">Add Screen</button>
                </div>
                <div class="mt-3 grid gap-2">
                  <article v-for="screen in buildDraft.screenSystems" :key="screen.id" class="grid gap-2 rounded-md border border-cyan-400/20 bg-slate-950/70 p-2 md:grid-cols-[minmax(0,1fr)_repeat(3,minmax(4rem,0.5fr))_auto]">
                    <input v-model="screen.name" class="h-8 rounded-md border border-cyan-300/25 bg-slate-900 px-2 text-xs text-cyan-50 outline-none focus:border-amber-300/60" placeholder="Screen">
                    <input v-model.number="screen.hardpointsUsed" class="h-8 rounded-md border border-cyan-300/25 bg-slate-900 px-2 text-xs text-cyan-50 outline-none focus:border-amber-300/60" min="0" title="Hardpoints" type="number">
                    <input v-model.number="screen.tons" class="h-8 rounded-md border border-cyan-300/25 bg-slate-900 px-2 text-xs text-cyan-50 outline-none focus:border-amber-300/60" min="0" step="0.25" title="Tons" type="number">
                    <input v-model.number="screen.powerDraw" class="h-8 rounded-md border border-cyan-300/25 bg-slate-900 px-2 text-xs text-cyan-50 outline-none focus:border-amber-300/60" min="0" title="Power" type="number">
                    <button class="flex h-8 w-8 items-center justify-center rounded-md border border-rose-300/30 text-rose-100 hover:border-rose-200" title="Remove screen" type="button" @click="buildDraft.screenSystems = buildDraft.screenSystems.filter((entry) => entry.id !== screen.id)">
                      <AppIcon class="h-4 w-4" name="trash" />
                    </button>
                  </article>
                </div>
              </section>
            </div>

            <div v-else-if="activeBuilderStep.id === 'options'" class="mt-5 grid gap-4">
              <section class="rounded-md border border-cyan-400/20 bg-cyan-950/75 p-3">
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <h3 class="text-sm font-semibold text-white">Ship Options</h3>
                    <p class="mt-1 text-xs text-cyan-100/60">{{ formatLedgerNumber(buildSummary.derived.power?.options) }} Power, {{ buildDraft.optionSystems.length }} systems</p>
                  </div>
                  <button class="rounded-md border border-cyan-300/30 px-2 py-1 text-xs font-semibold text-cyan-100 hover:border-amber-300/60" type="button" @click="buildDraft.optionSystems.push(createOptionSystem())">Add Option</button>
                </div>
                <div class="mt-3 grid gap-2">
                  <article v-for="option in buildDraft.optionSystems" :key="option.id" class="grid gap-2 rounded-md border border-cyan-400/20 bg-slate-950/70 p-2 md:grid-cols-[minmax(0,1fr)_repeat(2,minmax(4rem,0.5fr))_auto]">
                    <input v-model="option.name" class="h-8 rounded-md border border-cyan-300/25 bg-slate-900 px-2 text-xs text-cyan-50 outline-none focus:border-amber-300/60" placeholder="Option">
                    <input v-model.number="option.tons" class="h-8 rounded-md border border-cyan-300/25 bg-slate-900 px-2 text-xs text-cyan-50 outline-none focus:border-amber-300/60" min="0" step="0.25" title="Tons" type="number">
                    <input v-model.number="option.powerDraw" class="h-8 rounded-md border border-cyan-300/25 bg-slate-900 px-2 text-xs text-cyan-50 outline-none focus:border-amber-300/60" min="0" title="Power" type="number">
                    <button class="flex h-8 w-8 items-center justify-center rounded-md border border-rose-300/30 text-rose-100 hover:border-rose-200" title="Remove option" type="button" @click="buildDraft.optionSystems = buildDraft.optionSystems.filter((entry) => entry.id !== option.id)">
                      <AppIcon class="h-4 w-4" name="trash" />
                    </button>
                  </article>
                </div>
              </section>
            </div>

            <div v-else-if="activeBuilderStep.id === 'crew'" class="mt-5 grid gap-4">
              <div class="grid gap-3 md:grid-cols-3">
                <div class="rounded-md border border-cyan-400/20 bg-cyan-950/75 p-3">
                  <p class="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/70">Estimated Crew</p>
                  <p class="mt-1 text-lg font-semibold text-white">{{ formatLedgerNumber(buildSummary.derived.crewCount) }}</p>
                </div>
                <label class="grid gap-1 rounded-md border border-cyan-400/20 bg-cyan-950/75 p-3 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100/70">
                  Crew Mode
                  <select v-model="buildDraft.buildBrief.crewMode" class="h-8 rounded-md border border-cyan-300/25 bg-slate-900 px-2 text-xs normal-case tracking-normal text-cyan-50 outline-none focus:border-amber-300/60">
                    <option value="commercial">Commercial</option>
                    <option value="military">Military</option>
                  </select>
                </label>
                <label class="grid gap-1 rounded-md border border-cyan-400/20 bg-cyan-950/75 p-3 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100/70">
                  Crew Target
                  <input v-model="buildDraft.buildBrief.crewTarget" class="h-8 rounded-md border border-cyan-300/25 bg-slate-900 px-2 text-xs normal-case tracking-normal text-cyan-50 outline-none focus:border-amber-300/60" placeholder="Optional note">
                </label>
              </div>

              <section class="rounded-md border border-cyan-400/20 bg-cyan-950/75 p-3">
                <div class="flex items-center justify-between gap-3">
                  <h3 class="text-sm font-semibold text-white">Crew Overrides</h3>
                  <button class="rounded-md border border-cyan-300/30 px-2 py-1 text-xs font-semibold text-cyan-100 hover:border-amber-300/60" type="button" @click="buildDraft.crewRoles.push(createCrewRole())">Add Role</button>
                </div>
                <div class="mt-3 grid gap-2">
                  <article v-for="(role, index) in buildDraft.crewRoles" :key="index" class="grid gap-2 rounded-md border border-cyan-400/20 bg-slate-950/70 p-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_5rem_auto]">
                    <input v-model="role.role" class="h-8 rounded-md border border-cyan-300/25 bg-slate-900 px-2 text-xs text-cyan-50 outline-none focus:border-amber-300/60" placeholder="Role">
                    <input v-model="role.skill" class="h-8 rounded-md border border-cyan-300/25 bg-slate-900 px-2 text-xs text-cyan-50 outline-none focus:border-amber-300/60" placeholder="Skill">
                    <input v-model.number="role.count" class="h-8 rounded-md border border-cyan-300/25 bg-slate-900 px-2 text-xs text-cyan-50 outline-none focus:border-amber-300/60" min="0" title="Count" type="number">
                    <button class="flex h-8 w-8 items-center justify-center rounded-md border border-rose-300/30 text-rose-100 hover:border-rose-200" title="Remove role" type="button" @click="buildDraft.crewRoles = buildDraft.crewRoles.filter((entry) => entry !== role)">
                      <AppIcon class="h-4 w-4" name="trash" />
                    </button>
                  </article>
                  <div v-if="!buildDraft.crewRoles.length" class="grid gap-1 rounded-md border border-cyan-400/20 bg-slate-950/50 px-3 py-2 text-sm text-cyan-100/70">
                    <p v-for="role in buildSummary.crewRoles" :key="role.role" class="flex justify-between gap-3"><span>{{ role.role }}</span><strong>{{ role.count }}</strong></p>
                  </div>
                </div>
              </section>
            </div>

            <div v-else-if="activeBuilderStep.id === 'accommodations'" class="mt-5 grid gap-4">
              <section class="rounded-md border border-cyan-400/20 bg-cyan-950/75 p-3">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 class="text-sm font-semibold text-white">Accommodations</h3>
                    <p class="mt-1 text-xs text-cyan-100/60">{{ buildDraft.accommodations.length }} entries</p>
                  </div>
                  <div class="flex flex-wrap gap-1.5">
                    <button class="rounded-md border border-cyan-300/30 px-2 py-1 text-xs font-semibold text-cyan-100 hover:border-amber-300/60" type="button" @click="addAccommodationEntry('stateroom')">Stateroom</button>
                    <button class="rounded-md border border-cyan-300/30 px-2 py-1 text-xs font-semibold text-cyan-100 hover:border-amber-300/60" type="button" @click="addAccommodationEntry('high-stateroom')">High</button>
                    <button class="rounded-md border border-cyan-300/30 px-2 py-1 text-xs font-semibold text-cyan-100 hover:border-amber-300/60" type="button" @click="addAccommodationEntry('luxury-stateroom')">Luxury</button>
                    <button class="rounded-md border border-cyan-300/30 px-2 py-1 text-xs font-semibold text-cyan-100 hover:border-amber-300/60" type="button" @click="addAccommodationEntry('low-berth')">Low Berth</button>
                    <button class="rounded-md border border-cyan-300/30 px-2 py-1 text-xs font-semibold text-cyan-100 hover:border-amber-300/60" type="button" @click="addAccommodationEntry('emergency-low-berth')">Emergency</button>
                    <button class="rounded-md border border-cyan-300/30 px-2 py-1 text-xs font-semibold text-cyan-100 hover:border-amber-300/60" type="button" @click="addAccommodationEntry('common-area')">Common</button>
                    <button class="rounded-md border border-cyan-300/30 px-2 py-1 text-xs font-semibold text-cyan-100 hover:border-amber-300/60" type="button" @click="addAccommodationEntry('acceleration-seat')">Seat</button>
                  </div>
                </div>
                <div class="mt-3 grid gap-2">
                  <article v-for="entry in buildDraft.accommodations" :key="entry.id" class="grid gap-2 rounded-md border border-cyan-400/20 bg-slate-950/70 p-2 md:grid-cols-[minmax(8rem,0.8fr)_minmax(0,1fr)_4rem_5rem_auto_auto]">
                    <select v-model="entry.type" class="h-8 rounded-md border border-cyan-300/25 bg-slate-900 px-2 text-xs text-cyan-50 outline-none focus:border-amber-300/60" @change="updateAccommodationType(entry, entry.type)" @focus="rememberBuilderHistory">
                      <option value="stateroom">Stateroom</option>
                      <option value="high-stateroom">High Stateroom</option>
                      <option value="luxury-stateroom">Luxury Stateroom</option>
                      <option value="psion-stateroom">Psion Stateroom</option>
                      <option value="low-berth">Low Berth</option>
                      <option value="emergency-low-berth">Emergency Low Berth</option>
                      <option value="common-area">Common Area</option>
                      <option value="acceleration-bench">Acceleration Bench</option>
                      <option value="acceleration-seat">Acceleration Seat</option>
                      <option value="barracks">Barracks</option>
                      <option value="brig">Brig</option>
                      <option value="cabin-space">Cabin Space</option>
                      <option value="other">Other Quarters</option>
                    </select>
                    <input v-model="entry.label" class="h-8 rounded-md border border-cyan-300/25 bg-slate-900 px-2 text-xs text-cyan-50 outline-none focus:border-amber-300/60" placeholder="Label" @focus="rememberBuilderHistory">
                    <input v-model.number="entry.count" class="h-8 rounded-md border border-cyan-300/25 bg-slate-900 px-2 text-xs text-cyan-50 outline-none focus:border-amber-300/60" min="0" placeholder="Qty" title="Quantity" type="number" @focus="rememberBuilderHistory">
                    <input v-model.number="entry.tonsEach" class="h-8 rounded-md border border-cyan-300/25 bg-slate-900 px-2 text-xs text-cyan-50 outline-none focus:border-amber-300/60" min="0" placeholder="Tons" step="0.25" title="Tons each" type="number" @focus="rememberBuilderHistory">
                    <button
                      class="h-8 rounded-md border px-2 text-xs font-semibold"
                      :class="activeBrushComponentId === accommodationComponentId(entry) ? 'border-cyan-100 bg-cyan-100 text-zinc-950' : 'border-cyan-300/30 text-cyan-100 hover:border-amber-300/60'"
                      type="button"
                      @click="selectAccommodationBrush(entry)"
                    >
                      Brush
                    </button>
                    <button class="flex h-8 w-8 items-center justify-center rounded-md border border-rose-300/30 text-rose-100 hover:border-rose-200" title="Remove accommodation" type="button" @click="removeAccommodationEntry(entry)">
                      <AppIcon class="h-4 w-4" name="trash" />
                    </button>
                  </article>
                </div>
              </section>
            </div>

            <div v-else-if="activeBuilderStep.id === 'cargo'" class="mt-5 grid gap-4">
              <section class="rounded-md border border-cyan-400/20 bg-cyan-950/75 p-3">
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <h3 class="text-sm font-semibold text-white">Cargo</h3>
                    <p class="mt-1 text-xs text-cyan-100/60">{{ formatLedgerNumber(buildSummary.derived.cargoTons) }} tons drawn on deck plans</p>
                  </div>
                  <button class="rounded-md border border-cyan-300/30 px-2 py-1 text-xs font-semibold text-cyan-100 hover:border-amber-300/60" type="button" @click="addCargoEntry">Add</button>
                </div>
                <div class="mt-3 grid gap-2">
                  <article v-for="entry in buildDraft.cargoEntries" :key="entry.id" class="grid gap-2 rounded-md border border-cyan-400/20 bg-slate-950/70 p-2 md:grid-cols-[minmax(0,1fr)_6rem_auto_auto]">
                    <input v-model="entry.label" class="h-8 rounded-md border border-cyan-300/25 bg-slate-900 px-2 text-xs text-cyan-50 outline-none focus:border-amber-300/60" placeholder="Label" @focus="rememberBuilderHistory">
                    <div class="flex h-8 items-center justify-end rounded-md border border-cyan-300/20 bg-slate-900 px-2 text-xs font-semibold text-cyan-50" :title="`${drawnCargoTonsForEntry(entry.id)} tons drawn`">
                      {{ formatLedgerNumber(drawnCargoTonsForEntry(entry.id)) }} t
                    </div>
                    <button
                      class="h-8 rounded-md border px-2 text-xs font-semibold"
                      :class="activeBrushComponentId === cargoComponentId(entry) ? 'border-cyan-100 bg-cyan-100 text-zinc-950' : 'border-cyan-300/30 text-cyan-100 hover:border-amber-300/60'"
                      type="button"
                      @click="selectCargoBrush(entry)"
                    >
                      Brush
                    </button>
                    <button class="flex h-8 w-8 items-center justify-center rounded-md border border-rose-300/30 text-rose-100 hover:border-rose-200" title="Remove cargo" type="button" @click="removeCargoEntry(entry)">
                      <AppIcon class="h-4 w-4" name="trash" />
                    </button>
                  </article>
                </div>
              </section>
            </div>

            <div v-else-if="activeBuilderStep.id === 'review'" class="mt-5 grid gap-4">
              <div class="grid gap-3 md:grid-cols-4">
                <div class="rounded-md border border-cyan-400/20 bg-cyan-950/75 p-3"><p class="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/70">Tons</p><p class="mt-1 text-lg font-semibold text-white">{{ formatLedgerNumber(buildSummary.derived.tonsUsed) }} / {{ buildDraft.tons }}</p></div>
                <div class="rounded-md border border-cyan-400/20 bg-cyan-950/75 p-3"><p class="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/70">Power</p><p class="mt-1 text-lg font-semibold text-white">{{ formatLedgerNumber(buildSummary.derived.power?.totalCombat) }} / {{ formatLedgerNumber(buildSummary.derived.power?.output) }}</p></div>
                <div class="rounded-md border border-cyan-400/20 bg-cyan-950/75 p-3"><p class="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/70">Hardpoints</p><p class="mt-1 text-lg font-semibold text-white">{{ formatLedgerNumber(buildSummary.derived.hardpoints?.used) }} / {{ formatLedgerNumber(buildSummary.derived.hardpoints?.available) }}</p></div>
                <div class="rounded-md border border-cyan-400/20 bg-cyan-950/75 p-3"><p class="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/70">Issues</p><p class="mt-1 text-lg font-semibold text-white">{{ buildSummary.validationNotes.length }}</p></div>
              </div>
              <section class="rounded-md border border-cyan-400/20 bg-cyan-950/75 p-3">
                <h3 class="text-sm font-semibold text-white">Validation</h3>
                <ul v-if="buildSummary.validationNotes.length" class="mt-3 grid gap-2 text-sm text-amber-50/85">
                  <li v-for="issue in buildSummary.validationNotes" :key="issue" class="rounded-md border border-amber-300/25 bg-amber-300/10 px-3 py-2">{{ issue }}</li>
                </ul>
                <p v-else class="mt-3 rounded-md border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-sm text-emerald-50">No rules validation issues.</p>
              </section>
            </div>
            </div>

            <section v-if="builderCanvasOverlay === 'components'" class="mt-3 rounded-md border border-cyan-400/20 bg-cyan-950/75 p-3">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/70">Component Tray</p>
                    <h3 class="mt-1 text-base font-semibold text-white">Placeable Systems</h3>
                  </div>
                  <span class="rounded-md border border-cyan-400/20 px-2 py-1 text-xs font-semibold text-cyan-100/70">{{ placeableComponents.length }}</span>
                </div>

                <div class="mt-3 grid max-h-[calc(100vh-22rem)] gap-1.5 overflow-auto pr-1">
	                  <article
	                    v-for="component in placeableComponents"
	                    :key="component.id"
	                    class="rounded-md border px-2.5 py-2"
	                    :class="componentPlacementClass(component)"
	                  >
	                    <div class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
	                      <div class="flex min-w-0 items-start gap-2">
	                        <span class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded border" :style="componentSwatchStyle(component)">
	                          <img :alt="component.name" class="h-5 w-5 object-contain" :src="componentIconUrl(component)">
	                        </span>
	                        <div class="min-w-0">
	                        <p class="truncate text-sm font-semibold leading-tight">{{ componentDisplayName(component) }}</p>
	                        <p class="mt-0.5 truncate text-xs opacity-70">{{ componentKindLabel(component.kind) }}</p>
                        </div>
                      </div>
                      <span class="shrink-0 rounded border border-current/25 px-1.5 py-0.5 text-[0.68rem] font-semibold">{{ componentPlacementStatus(component) }}</span>
                    </div>
                    <div class="mt-2 flex items-center justify-between gap-2 text-xs opacity-80">
	                      <span>{{ placedTonsForComponent(component.id) }} / {{ component.tons }} tons</span>
	                      <span>{{ componentRequiredCells(component) }} cells</span>
	                    </div>
	                    <div class="mt-2 flex gap-1.5">
	                      <button class="rounded-md border border-cyan-300/40 px-2 py-1 text-xs font-semibold text-cyan-50 hover:border-amber-300/60" type="button" @click="selectBrushComponent(component)">
	                        Brush
	                      </button>
                      <button v-if="placedTonsForComponent(component.id) > 0" class="rounded-md border border-cyan-300/25 px-2 py-1 text-xs font-semibold text-cyan-100/70 hover:border-amber-300/60" type="button" @click="removePlacement(component.id)">
                        Clear
                      </button>
                    </div>
                  </article>
                </div>

                <div class="mt-3 rounded-md border border-cyan-400/20 bg-white/5 px-3 py-2">
                  <p class="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/70">Ledger Only</p>
                  <p class="mt-1 text-xs text-cyan-100/66">{{ ledgerOnlyComponents.length }} abstract or distributed systems, {{ exteriorComponents.length }} exterior systems.</p>
                </div>
            </section>
          </section>

          <section class="relative min-h-[calc(100vh-7rem)] rounded-md border border-cyan-400/20 bg-cyan-950/30 p-4">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 class="text-lg font-semibold text-white">{{ activeDeck.name }}</h3>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <p class="rounded-md border border-cyan-400/20 px-2 py-1 text-xs font-semibold text-cyan-100/70">{{ activeDeck.tonsPerCell }} ton/cell</p>
                    <p class="rounded-md border border-cyan-400/20 px-2 py-1 text-xs font-semibold text-cyan-100/70">{{ activeDeckPlacedTons }} tons placed</p>
                    <p class="rounded-md border border-cyan-400/20 px-2 py-1 text-xs font-semibold text-cyan-100/70">{{ zoomPercent }}%</p>
                  </div>
                </div>

                <div class="absolute left-6 top-16 z-20 rounded-md border border-cyan-400/30 bg-slate-950 p-2 shadow-xl shadow-black/35">
                <div class="flex flex-wrap items-center gap-2">
                  <div class="relative">
                    <button
                      class="flex h-9 w-9 items-center justify-center rounded-md border border-cyan-300/35 text-cyan-50 hover:border-amber-300/60"
                      :title="`Builder tools: ${activeBuilderStep.title}`"
                      type="button"
                      @click="buildToolMenuOpen = !buildToolMenuOpen"
                    >
                      <img :alt="activeBuilderStep.title" class="h-5 w-5 object-contain" :src="builderStepIconUrl(activeBuilderStep.id)">
                      <span class="sr-only">Builder Tools</span>
                    </button>
                    <div v-if="buildToolMenuOpen" class="hud-scrollbar absolute left-0 top-11 z-40 grid max-h-[min(36rem,calc(100vh-10rem))] w-[min(15rem,calc(100vw-3rem))] gap-2 overflow-auto rounded-md border border-cyan-400/35 bg-slate-950/95 p-2 shadow-xl shadow-black/60">
                      <div class="grid gap-1.5">
                        <button
                          v-for="status in builderStepStatuses"
                          :key="status.step.id"
                          class="grid grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-2 rounded-md border px-2 py-1.5 text-left text-xs font-semibold"
                          :class="!status.isUnlocked ? 'cursor-not-allowed border-slate-500/25 text-slate-400/55 opacity-60' : activeBuildStep === status.index ? 'border-cyan-100 bg-cyan-100 text-zinc-950' : activeBrushComponentId && builderStepBrushComponent(status.step.id)?.id === activeBrushComponentId ? 'border-amber-300/60 bg-amber-300/12 text-amber-50' : status.hasErrors ? 'border-rose-300/50 text-rose-100 hover:border-rose-200' : status.hasWarnings ? 'border-amber-300/45 text-amber-100 hover:border-amber-200' : 'border-cyan-300/25 text-cyan-100/75 hover:border-amber-300/60'"
                          :disabled="!status.isUnlocked"
                          :title="status.title"
                          type="button"
                          @click="selectBuilderStep(status.index)"
                        >
                          <img :alt="status.step.title" class="h-5 w-5 shrink-0 object-contain" :src="builderStepIconUrl(status.step.id)">
	                          <span
	                            class="h-3 w-3 rounded-full border border-current/25"
	                            :class="builderStepBrushDotClass(status.step.id)"
	                            :style="builderStepBrushComponent(status.step.id) ? componentSwatchStyle(builderStepBrushComponent(status.step.id) ?? undefined) : undefined"
	                            :title="builderStepBrushTitle(status.step)"
	                          />
                          <span class="truncate">{{ status.step.title }}</span>
                        </button>
                      </div>
                      <div class="grid gap-1.5 border-t border-cyan-400/20 pt-2">
                        <button
                          class="flex h-8 items-center justify-start gap-2 rounded-md border px-2 text-xs font-semibold"
                          :class="builderCanvasOverlay === 'components' ? 'border-cyan-100 bg-cyan-100 text-zinc-950' : 'border-cyan-300/25 text-cyan-100/75 hover:border-amber-300/60'"
                          title="Component Tray"
                          type="button"
                          @click="toggleBuilderOverlay('components')"
                        >
                          <img alt="Component Tray" class="h-5 w-5 object-contain" :src="cargoIconUrl">
                          <span>Brushes</span>
                        </button>
                        <button
                          class="flex h-8 items-center justify-start gap-2 rounded-md border px-2 text-xs font-semibold"
                          :class="builderCanvasOverlay === 'ledger' ? 'border-cyan-100 bg-cyan-100 text-zinc-950' : 'border-cyan-300/25 text-cyan-100/75 hover:border-amber-300/60'"
                          title="Ship Ledger"
                          type="button"
                          @click="toggleBuilderOverlay('ledger')"
                        >
                          <AppIcon class="h-4 w-4" name="sliders" />
                          <span>Ledger</span>
                        </button>
                        <button
                          class="relative flex h-8 items-center justify-start gap-2 rounded-md border px-2 text-xs font-semibold"
                          :class="builderCanvasOverlay === 'validation' ? 'border-amber-200 bg-amber-300 text-zinc-950' : 'border-amber-300/35 text-amber-100 hover:border-amber-200'"
                          title="Validation"
                          type="button"
                          @click="toggleBuilderOverlay('validation')"
                        >
                          <AppIcon class="h-4 w-4" name="warning" />
                          <span>Validation</span>
                          <span v-if="layoutValidationNotes.length" class="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-300 px-1 text-[0.62rem] font-bold text-zinc-950">{{ layoutValidationNotes.length }}</span>
                        </button>
                      </div>
	                      <p class="truncate border-t border-cyan-400/20 pt-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-cyan-100/60">
	                        Brush: {{ activeBrushComponent?.name ?? 'None' }}
	                      </p>
	                      <p class="text-[0.62rem] leading-snug text-cyan-100/55">
	                        Solid dots paint deck footprints; dashed dots are special tools; dim dots are ledger-only.
	                      </p>
	                    </div>
                  </div>
                  <button
                    class="flex h-9 w-9 items-center justify-center rounded-md border border-cyan-300/35 text-cyan-50 hover:border-amber-300/60 disabled:cursor-not-allowed disabled:opacity-35"
                    :disabled="!undoStack.length"
                    title="Undo (Ctrl+Z)"
                    type="button"
                    @click="undoBuilderAction"
                  >
                    <AppIcon class="h-4 w-4 rotate-180" name="arrow" />
                    <span class="sr-only">Undo</span>
                  </button>
                  <button
                    class="flex h-9 w-9 items-center justify-center rounded-md border border-cyan-300/35 text-cyan-50 hover:border-amber-300/60 disabled:cursor-not-allowed disabled:opacity-35"
                    :disabled="!redoStack.length"
                    title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
                    type="button"
                    @click="redoBuilderAction"
                  >
                    <AppIcon class="h-4 w-4" name="arrow" />
                    <span class="sr-only">Redo</span>
                  </button>
                  <div class="relative">
	                    <button
	                      class="flex h-9 w-9 items-center justify-center rounded-md border border-cyan-300/35 text-cyan-50 hover:border-amber-300/60"
	                      title="Select deck"
	                      type="button"
	                      @click="deckMenuOpen = !deckMenuOpen"
	                    >
	                      <span class="relative h-5 w-6 text-cyan-50" aria-hidden="true">
	                        <span class="absolute left-0.5 top-0 h-2 w-5 skew-x-[-24deg] bg-current" />
	                        <span class="absolute left-0.5 top-[0.42rem] h-2 w-5 skew-x-[-24deg] bg-current opacity-80" />
	                        <span class="absolute left-0.5 top-[0.84rem] h-2 w-5 skew-x-[-24deg] bg-current opacity-60" />
	                      </span>
	                      <span class="sr-only">Select Deck</span>
	                    </button>
                    <div v-if="deckMenuOpen" class="absolute left-0 top-11 z-40 grid w-[min(16rem,calc(100vw-3rem))] gap-2 rounded-md border border-cyan-400/35 bg-slate-950/95 p-2 shadow-xl shadow-black/60">
                      <label class="grid gap-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-cyan-100/70">
                        Deck Name
                        <input v-model="activeDeck.name" class="h-8 rounded-md border border-cyan-300/25 bg-slate-900 px-2 text-xs normal-case tracking-normal text-cyan-50 outline-none focus:border-amber-300/60" @focus="rememberBuilderHistory">
                      </label>
                      <label class="grid gap-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-cyan-100/70">
                        Tons/Cell
                        <input v-model.number="activeDeck.tonsPerCell" class="h-8 rounded-md border border-cyan-300/25 bg-slate-900 px-2 text-xs normal-case tracking-normal text-cyan-50 outline-none focus:border-amber-300/60" min="0.25" step="0.25" type="number" @focus="rememberBuilderHistory">
                      </label>
                      <button
                        v-for="deck in buildDraft.layout.decks"
                        :key="deck.id"
                        class="rounded-md border px-3 py-2 text-left text-sm font-semibold"
                        :class="activeDeck.id === deck.id ? 'border-cyan-100 bg-cyan-100 text-zinc-950' : 'border-cyan-300/30 text-cyan-100/75 hover:border-amber-300/60'"
                        type="button"
                        @click="selectDeck(deck.id)"
                      >
                        {{ deck.name }}
                      </button>
                    </div>
                  </div>
	                  <button class="flex h-9 w-9 items-center justify-center rounded-md border border-cyan-300/35 text-cyan-50 hover:border-amber-300/60" title="Add deck" type="button" @click="openDeckConfirm('create')">
	                    <AppIcon class="h-4 w-4" name="plus" />
	                    <span class="sr-only">Add Deck</span>
	                  </button>
	                  <button class="flex h-9 w-9 items-center justify-center rounded-md border border-cyan-300/35 text-cyan-50 hover:border-amber-300/60" title="Duplicate deck" type="button" @click="openDeckConfirm('duplicate')">
	                    <AppIcon class="h-4 w-4" name="copy" />
	                    <span class="sr-only">Duplicate Deck</span>
	                  </button>
                  <button
                    class="flex h-9 w-9 items-center justify-center rounded-md border border-cyan-300/25 text-cyan-100/70 hover:border-rose-300/60"
	                    :disabled="buildDraft.layout.decks.length <= 1"
	                    title="Delete deck"
	                    type="button"
	                    @click="openDeckConfirm('delete')"
	                  >
                    <AppIcon class="h-4 w-4" name="trash" />
                    <span class="sr-only">Delete Deck</span>
                  </button>
                </div>
                </div>

                <div class="absolute right-6 top-16 z-20 grid w-36 gap-2 rounded-md border border-cyan-400/30 bg-slate-950 p-2 shadow-xl shadow-black/35">
                  <div class="grid gap-2 border-b border-cyan-400/20 pb-2">
                    <div v-for="group in shapeToolGroups" :key="group.id" class="grid gap-1">
                      <p class="text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-cyan-100/48">{{ group.label }}</p>
                      <div class="grid gap-1">
                        <button
                          v-for="tool in group.tools"
                          :key="tool.id"
                          class="group relative flex h-8 items-center justify-start gap-2 rounded-md border px-2 text-xs font-semibold"
                          :class="shapeToolClass(tool.id)"
                          :title="tool.title"
                          type="button"
                          @click="activeShapeTool = tool.id"
                        >
                          <AppIcon class="h-4 w-4" :name="tool.icon" />
                          <span class="pointer-events-none absolute bottom-0.5 right-1 text-[0.5rem] font-bold opacity-55">{{ tool.shortcut }}</span>
                          <span class="truncate">{{ tool.label }}</span>
                        </button>
                      </div>
                    </div>
                    <p class="truncate border-t border-cyan-400/15 pt-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-cyan-100/62">
                      {{ shapeTools.find((tool) => tool.id === activeShapeTool)?.label }} Mode
                    </p>
                    <p class="truncate text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-cyan-100/62">
                      Brush: {{ activeBrushComponent?.name ?? 'None' }}
                    </p>
                    <div class="grid gap-1 rounded-md border border-cyan-400/20 bg-white/5 p-2 text-[0.68rem] text-cyan-100/70">
                      <p class="truncate text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-cyan-100/55">Selection</p>
                      <template v-if="selectedLayoutPlacement">
                        <p class="truncate font-semibold text-cyan-50">{{ componentDisplayName(selectedPlacementComponent ?? undefined) || selectedLayoutPlacement.componentId }}</p>
                        <p v-if="selectedPlacementVisualLabel" class="truncate text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-cyan-100/55">{{ selectedPlacementVisualLabel }}</p>
                        <dl class="grid grid-cols-2 gap-x-2 gap-y-1">
                          <div class="flex justify-between gap-1"><dt>X</dt><dd class="font-semibold text-white">{{ selectedLayoutPlacement.x }}</dd></div>
                          <div class="flex justify-between gap-1"><dt>Y</dt><dd class="font-semibold text-white">{{ selectedLayoutPlacement.y }}</dd></div>
                          <div class="flex justify-between gap-1"><dt>Cells</dt><dd class="font-semibold text-white">{{ selectedPlacementCellCount }}</dd></div>
                          <div class="flex justify-between gap-1"><dt>Tons</dt><dd class="font-semibold text-white">{{ selectedPlacementTons }}</dd></div>
                        </dl>
                      </template>
                      <p v-else class="text-cyan-100/55">None</p>
                    </div>
                    <div class="grid gap-1 border-t border-cyan-400/15 pt-2">
                      <button
                        class="flex h-8 items-center justify-start gap-2 rounded-md border border-cyan-300/25 px-2 text-xs font-semibold text-cyan-100/75 hover:border-amber-300/60 disabled:cursor-not-allowed disabled:opacity-35"
                        :disabled="!activeBrushComponent"
                        title="Auto-fit required tons"
                        type="button"
                        @click="autoFitBrushFootprint"
                      >
                        <AppIcon class="h-4 w-4" name="plus" />
                        <span>Auto-Fit</span>
                      </button>
                      <button
                        class="flex h-8 items-center justify-start gap-2 rounded-md border border-cyan-300/25 px-2 text-xs font-semibold text-cyan-100/75 hover:border-amber-300/60 disabled:cursor-not-allowed disabled:opacity-35"
                        :disabled="!selectedLayoutPlacement"
                        title="Rotate selected footprint"
                        type="button"
                        @click="rotateSelectedFootprint"
                      >
                        <AppIcon class="h-4 w-4" name="restart" />
                        <span>Rotate</span>
                      </button>
                      <button
                        class="flex h-8 items-center justify-start gap-2 rounded-md border border-cyan-300/25 px-2 text-xs font-semibold text-cyan-100/75 hover:border-amber-300/60 disabled:cursor-not-allowed disabled:opacity-35"
                        :disabled="!selectedLayoutPlacement"
                        title="Flip selected footprint horizontally"
                        type="button"
                        @click="flipSelectedFootprint('horizontal')"
                      >
                        <AppIcon class="h-4 w-4" name="arrow" />
                        <span>Flip H</span>
                      </button>
                      <button
                        class="flex h-8 items-center justify-start gap-2 rounded-md border border-cyan-300/25 px-2 text-xs font-semibold text-cyan-100/75 hover:border-amber-300/60 disabled:cursor-not-allowed disabled:opacity-35"
                        :disabled="!selectedLayoutPlacement"
                        title="Flip selected footprint vertically"
                        type="button"
                        @click="flipSelectedFootprint('vertical')"
                      >
                        <AppIcon class="h-4 w-4 rotate-90" name="arrow" />
                        <span>Flip V</span>
                      </button>
                      <button
                        class="flex h-8 items-center justify-start gap-2 rounded-md border border-cyan-300/25 px-2 text-xs font-semibold text-cyan-100/75 hover:border-amber-300/60 disabled:cursor-not-allowed disabled:opacity-35"
                        :disabled="!selectedLayoutPlacement"
                        title="Duplicate selected footprint"
                        type="button"
                        @click="duplicateSelectedFootprint"
                      >
                        <AppIcon class="h-4 w-4" name="copy" />
                        <span>Duplicate</span>
                      </button>
                      <button
                        class="flex h-8 items-center justify-start gap-2 rounded-md border border-cyan-300/25 px-2 text-xs font-semibold text-cyan-100/75 hover:border-amber-300/60 disabled:cursor-not-allowed disabled:opacity-35"
                        :disabled="!selectedLayoutPlacement || buildDraft.layout.decks.length < 2"
                        title="Move selected footprint to the next available deck"
                        type="button"
                        @click="moveSelectedFootprintToNextDeck"
                      >
                        <AppIcon class="h-4 w-4" name="sliders" />
                        <span>Move Deck</span>
                      </button>
                      <button
                        class="flex h-8 items-center justify-start gap-2 rounded-md border border-rose-300/30 px-2 text-xs font-semibold text-rose-100 hover:border-rose-200 disabled:cursor-not-allowed disabled:opacity-35"
                        :disabled="!selectedLayoutPlacement"
                        title="Delete selected footprint"
                        type="button"
                        @click="removeSelectedPlacement"
                      >
                        <AppIcon class="h-4 w-4" name="trash" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                  <div class="grid gap-1">
                    <button class="flex h-8 w-full items-center justify-center rounded-md border border-cyan-300/35 text-cyan-50 hover:border-amber-300/60" title="Zoom out" type="button" @click="adjustCanvasZoom(-0.1)">
                      <span class="text-lg leading-none">-</span>
                      <span class="sr-only">Zoom Out</span>
                    </button>
                    <button class="flex h-8 w-full items-center justify-center rounded-md border border-cyan-300/25 text-xs font-semibold text-cyan-100/80 hover:border-amber-300/60" title="Reset view" type="button" @click="resetCanvasView">
                      {{ zoomPercent }}%
                    </button>
                    <button class="flex h-8 w-full items-center justify-center rounded-md border border-cyan-300/35 text-cyan-50 hover:border-amber-300/60" title="Zoom in" type="button" @click="adjustCanvasZoom(0.1)">
                      <AppIcon class="h-4 w-4" name="plus" />
                      <span class="sr-only">Zoom In</span>
                    </button>
                  </div>
                  <label class="grid gap-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-cyan-100/70">
                    Zoom
                    <input
                      v-model.number="canvasZoom"
                      class="h-2 w-full accent-cyan-300"
                      max="2.5"
                      min="0.5"
                      step="0.05"
                      type="range"
                    >
                  </label>
                </div>

                <div class="mt-4 min-h-[calc(100vh-14rem)] cursor-default overflow-hidden rounded-md border border-cyan-400/20 active:cursor-grabbing" :style="canvasGraphPaperStyle" @contextmenu.prevent @pointerdown.self="startCanvasPan" @wheel="handleCanvasWheel">
                  <div class="relative h-full min-h-[calc(100vh-16rem)] w-full" @contextmenu.prevent @pointerdown.self="startCanvasPan">
                    <div class="pointer-events-none absolute inset-x-0 z-0 border-t border-amber-200/55 shadow-[0_0_12px_rgba(251,191,36,0.22)]" :style="canvasXAxisStyle">
                      <span class="absolute left-2 top-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-amber-100/80">-X</span>
                      <span class="absolute right-2 top-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-amber-100/80">+X</span>
                    </div>
                    <div class="pointer-events-none absolute inset-y-0 z-0 border-l border-amber-200/55 shadow-[0_0_12px_rgba(251,191,36,0.22)]" :style="canvasYAxisStyle">
                      <span class="absolute left-1 top-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-amber-100/80">-Y</span>
                      <span class="absolute bottom-2 left-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-amber-100/80">+Y</span>
                    </div>
                    <div class="pointer-events-none absolute z-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-100 bg-amber-300/30 shadow-[0_0_16px_rgba(251,191,36,0.35)]" :style="canvasOriginStyle">
                      <span class="absolute left-4 top-1/2 -translate-y-1/2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-amber-100">0,0</span>
                    </div>
                    <div class="absolute left-0 top-0" :style="canvasWorldStyle">
                      <div class="relative">
	                        <div ref="deckCanvasRef" class="relative grid" :style="deckGridStyle()" @pointerdown="handleDeckPointerDown" @pointerleave="clearFootprintHover" @pointermove="updateFootprintHover">
                            <div v-if="activeHullEnvelope" class="pointer-events-none absolute inset-0 z-[1] grid" :style="deckGridStyle()">
                              <span
                                v-for="cell in activeHullEnvelope.cells"
                                :key="`hull-${cell.x}:${cell.y}`"
                                class="border shadow-[inset_0_0_12px_rgba(34,211,238,0.08)]"
                                :class="hullEnvelopeStatusClass"
                                :style="hullEnvelopeCellStyle(cell)"
                              />
                              <span class="absolute left-[calc(50%+0.75rem)] top-[calc(50%+0.75rem)] rounded border border-cyan-300/35 bg-slate-950/80 px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-cyan-100/75">
                                Hull Shape
                              </span>
                              <span class="absolute bottom-[calc(50%+0.75rem)] left-[calc(50%+0.75rem)] rounded border border-cyan-300/25 bg-slate-950/80 px-2 py-1 text-[0.62rem] font-semibold text-cyan-100/70">
                                {{ hullEnvelopeLabel }}
                              </span>
                            </div>
                            <div v-if="hullEnvelopePreviewCells.length" class="pointer-events-none absolute inset-0 z-[19] grid" :style="deckGridStyle()">
                              <span
                                v-for="cell in hullEnvelopePreviewCells"
                                :key="`hull-preview-${cell.x}:${cell.y}`"
                                class="border border-dashed"
                                :class="activeShapeTool === 'erase' ? 'border-rose-200/80 bg-rose-400/30' : 'border-cyan-50/90 bg-cyan-200/28'"
                                :style="hullEnvelopeCellStyle(cell)"
                              />
                            </div>
	                          <div class="pointer-events-none absolute inset-0 z-20 grid" :style="footprintPreviewStyle">
	                            <span
	                              v-for="cell in footprintPreviewCells"
	                              :key="`preview-${cell.x}:${cell.y}`"
	                              class="border border-dashed"
	                              :class="footprintPreviewCellClass"
	                              :style="footprintPreviewCellStyle(cell)"
	                            />
	                          </div>
	                          <div
                            v-for="placement in activeDeckPlacements"
                            :key="placement.id"
                            class="relative z-10 touch-none overflow-hidden rounded text-left font-semibold text-amber-50"
                            :class="placementClass(placement)"
                            :style="placementSurfaceStyle(placement)"
                            role="button"
                            tabindex="0"
                          >
                            <div class="absolute inset-0 grid" :style="placementFootprintStyle(placement)">
                              <span
                                v-for="cell in placementRenderCells(placement)"
                                :key="`${cell.x}:${cell.y}`"
                                class="border shadow-sm"
                                :class="placementCellClass(placement)"
                                :style="placementCellStyle(placement, cell)"
                                @pointerdown="handlePlacementPointerDown($event, placement)"
                              />
                            </div>
                            <div v-if="placementVisualRole(placement) === 'cargo'" class="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
                              <span
                                v-for="item in cargoVisualItems(placement)"
                                :key="item.id"
                                class="absolute rounded-[2px] border"
                                :style="cargoCrateStyle(placement, item)"
                              />
                            </div>
                            <div v-else-if="placementHasAccommodationVisual(placement)" class="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
                              <span
                                v-for="item in accommodationVisualItems(placement)"
                                :key="item.id"
                                class="absolute border"
                                :style="accommodationVisualItemStyle(placement, item)"
                              />
                            </div>
                            <div class="pointer-events-none relative z-10 flex h-full flex-col justify-center">
                              <span class="flex min-w-0 items-center justify-center gap-1.5">
                                <img :alt="placementDisplayName(placement)" class="shrink-0 object-contain" :src="placementIconUrl(placement)" :style="placementIconStyle">
                                <span class="block truncate">{{ placementDisplayName(placement) }}</span>
                              </span>
                              <span class="block text-center font-medium text-amber-50/70" :style="placementTonsStyle">{{ placementTons(placement) }} tons</span>
                            </div>
                            <span
                              v-if="selectedPlacementId === placement.id"
                              class="pointer-events-auto absolute bottom-0 right-0 z-20 cursor-nwse-resize border-l border-t border-cyan-100/60 bg-cyan-100/35"
                              :style="placementResizeHandleStyle"
                              @click.stop
                              @pointerdown.stop="startPlacementDrag($event, placement, 'resize')"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

          </section>

          <aside
            v-if="builderCanvasOverlay === 'validation'"
            class="hud-scrollbar absolute left-[4.25rem] top-0 z-30 max-h-[calc(100vh-7rem)] w-[min(28rem,calc(100%-5rem))] overflow-auto rounded-md border border-amber-300/40 bg-slate-950 p-3 shadow-2xl shadow-black/45"
          >
            <div class="flex items-start justify-between gap-3 rounded-md border border-amber-300/30 bg-amber-300/10 p-3">
              <div class="flex min-w-0 items-start gap-3">
                <AppIcon class="h-6 w-6 shrink-0 text-amber-200" name="warning" />
                <div class="min-w-0">
                  <p class="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">Validation</p>
                  <h2 class="mt-1 text-base font-semibold text-white">{{ layoutValidationNotes.length }} layout {{ layoutValidationNotes.length === 1 ? 'note' : 'notes' }}</h2>
                </div>
              </div>
              <button class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-amber-300/35 text-amber-100 hover:border-amber-200" type="button" @click="builderCanvasOverlay = ''">
                <AppIcon class="h-4 w-4" name="close" />
                <span class="sr-only">Close validation</span>
              </button>
            </div>

            <ul v-if="layoutValidationNotes.length" class="mt-3 grid gap-2 text-sm text-amber-50/85">
              <li v-for="note in layoutValidationNotes" :key="note" class="rounded-md border border-amber-300/25 bg-amber-300/10 px-3 py-2">{{ note }}</li>
            </ul>
            <p v-else class="mt-3 rounded-md border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-sm text-emerald-50">No layout validation notes.</p>
          </aside>

          <aside
            v-if="builderCanvasOverlay === 'ledger'"
            class="hud-scrollbar absolute right-0 top-0 z-30 max-h-[calc(100vh-7rem)] w-[min(22rem,calc(100%-5rem))] overflow-auto rounded-md border border-cyan-400/30 bg-slate-950 p-3 shadow-2xl shadow-black/45"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/70">Ship Ledger</p>
                <h2 class="mt-1 text-xl font-semibold text-white">{{ buildDraft.name }}</h2>
                <p class="mt-1 text-sm text-cyan-100/60">{{ buildDraft.buildBrief.role || 'Custom spacecraft' }}</p>
              </div>
              <button
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-cyan-300/35 text-cyan-50 hover:border-amber-300/60"
                type="button"
                @click="builderCanvasOverlay = ''"
              >
                <AppIcon class="h-4 w-4" name="close" />
                <span class="sr-only">Close ship ledger</span>
              </button>
            </div>

            <div class="mt-3 rounded-md border border-cyan-400/20 bg-cyan-950/30 px-3 py-2">
              <dl class="grid gap-2 text-sm text-cyan-100/78">
                <div class="flex items-center justify-between gap-4">
                  <dt class="text-xs uppercase tracking-[0.14em] text-cyan-200/60">Tonnage</dt>
                  <dd class="text-right font-semibold text-white">{{ formatLedgerNumber(buildSummary.derived.tonsUsed) }} / {{ formatLedgerNumber(buildDraft.tons) }}</dd>
                </div>
                <div class="flex items-center justify-between gap-4">
                  <dt class="text-xs uppercase tracking-[0.14em] text-cyan-200/60">Cost</dt>
                  <dd class="text-right font-semibold text-white">{{ buildSummary.costs.total?.label ?? '—' }}</dd>
                </div>
                <div class="flex items-center justify-between gap-4">
                  <dt class="text-xs uppercase tracking-[0.14em] text-cyan-200/60">Hull</dt>
                  <dd class="text-right font-semibold text-white">{{ formatLedgerNumber(buildSummary.derived.hullPoints) }}</dd>
                </div>
                <div class="flex items-center justify-between gap-4">
                  <dt class="text-xs uppercase tracking-[0.14em] text-cyan-200/60">Crew</dt>
                  <dd class="text-right font-semibold text-white">{{ formatLedgerNumber(buildSummary.derived.crewCount) }}</dd>
                </div>
              </dl>
              <p class="mt-2 text-xs text-cyan-100/58">{{ formatLedgerNumber(buildSummary.derived.tonsRemaining) }} tons remaining · {{ buildDraft.buildBrief.crewMode }}</p>
            </div>

            <div class="mt-3 rounded-md border border-cyan-400/20 bg-cyan-950/30 px-3 py-2">
              <h3 class="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/78">Power</h3>
              <dl class="mt-2 grid gap-1.5 text-sm text-cyan-100/78">
                <div class="flex items-center justify-between gap-4"><dt>Generated</dt><dd>{{ formatLedgerNumber(buildSummary.derived.power?.output) }}</dd></div>
                <div class="flex items-center justify-between gap-4"><dt>Routine</dt><dd>{{ formatLedgerNumber(buildSummary.derived.power?.totalRoutine) }} / {{ formatLedgerNumber(buildSummary.derived.power?.surplusRoutine) }} spare</dd></div>
                <div class="flex items-center justify-between gap-4"><dt>Jump</dt><dd>{{ formatLedgerNumber(buildSummary.derived.power?.totalJump) }} / {{ formatLedgerNumber(buildSummary.derived.power?.surplusJump) }} spare</dd></div>
                <div class="flex items-center justify-between gap-4"><dt>Combat</dt><dd>{{ formatLedgerNumber(buildSummary.derived.power?.totalCombat) }} / {{ formatLedgerNumber(buildSummary.derived.power?.surplusCombat) }} spare</dd></div>
              </dl>
            </div>

            <div class="mt-3 rounded-md border border-cyan-400/20 bg-cyan-950/30 px-3 py-2">
              <h3 class="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/78">Capacity</h3>
              <dl class="mt-2 grid gap-1.5 text-sm text-cyan-100/78">
                <div class="flex items-center justify-between gap-4"><dt>Hardpoints</dt><dd>{{ formatLedgerNumber(buildSummary.derived.hardpoints?.used) }} / {{ formatLedgerNumber(buildSummary.derived.hardpoints?.available) }}</dd></div>
                <div class="flex items-center justify-between gap-4"><dt>Bandwidth</dt><dd>{{ formatLedgerNumber(buildSummary.derived.bandwidth?.used) }} / {{ formatLedgerNumber(buildSummary.derived.bandwidth?.available) }}</dd></div>
                <div class="flex items-center justify-between gap-4"><dt>Cargo</dt><dd>{{ formatLedgerNumber(buildSummary.derived.cargoTons) }} tons</dd></div>
              </dl>
            </div>

            <div class="mt-3 rounded-md border border-cyan-400/20 bg-cyan-950/30 px-3 py-2">
              <h3 class="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/78">Fuel</h3>
              <dl class="mt-2 grid gap-1.5 text-sm text-cyan-100/78">
                <div class="flex items-center justify-between gap-4"><dt>Total</dt><dd>{{ formatLedgerNumber(buildSummary.derived.fuel?.totalFuelTons) }} tons</dd></div>
                <div class="flex items-center justify-between gap-4"><dt>Jump</dt><dd>{{ formatLedgerNumber(buildSummary.derived.fuel?.jumpFuelTons) }} tons</dd></div>
                <div class="flex items-center justify-between gap-4"><dt>Reaction</dt><dd>{{ formatLedgerNumber(buildSummary.derived.fuel?.reactionFuelTons) }} tons</dd></div>
                <div class="flex items-center justify-between gap-4"><dt>Plant</dt><dd>{{ formatLedgerNumber(buildSummary.derived.fuel?.powerPlantFuelTons) }} tons</dd></div>
              </dl>
            </div>

            <div class="mt-3 rounded-md border border-cyan-400/20 bg-cyan-950/30 px-3 py-2">
              <h3 class="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/78">Running Costs</h3>
              <dl class="mt-2 grid gap-1.5 text-sm text-cyan-100/78">
                <div class="flex items-center justify-between gap-4"><dt>Maintenance</dt><dd>Cr{{ buildSummary.costs.monthlyMaintenanceCredits?.toLocaleString() ?? '—' }}/month</dd></div>
                <div v-if="buildSummary.costs.standardDesignDiscountCredits" class="flex items-center justify-between gap-4"><dt>Standard Discount</dt><dd>Cr{{ buildSummary.costs.standardDesignDiscountCredits.toLocaleString() }}</dd></div>
              </dl>
            </div>

            <div v-if="buildSummary.validationNotes.length" class="mt-3 rounded-md border border-amber-300/30 bg-amber-300/10 px-3 py-2">
              <p class="text-sm font-semibold text-amber-100">Validation</p>
              <ul class="mt-2 grid gap-1 text-sm text-amber-50/82">
                <li v-for="note in buildSummary.validationNotes" :key="note">{{ note }}</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </section>
  </main>
</template>
