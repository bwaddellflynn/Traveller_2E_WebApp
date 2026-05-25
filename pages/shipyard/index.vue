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
import type { CustomShipDesign, CustomShipLayoutDeck, CustomShipLayoutPlacement, TravellerShipCategory, TravellerShipComponent, TravellerShipRecord } from '~/types/ship'
import { useShipsStore } from '~/stores/ships'
import { shipConstructionSummary } from '~/utils/traveller/shipBuilder'

type ShipSortKey = 'name' | 'tons' | 'techLevel' | 'category' | 'jump' | 'thrust'
type ShipSortIcon = 'sort-asc' | 'sort-desc'
type ShipyardTabId = 'stock' | 'custom' | 'builder'
type ShipBuilderStep = { id: string, label: string, title: string, description: string }
type BuilderCanvasOverlay = 'tool' | 'components' | 'ledger' | 'validation' | ''
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
type CanvasPanDragState = {
  startClientX: number
  startClientY: number
  originX: number
  originY: number
}
type FloatingPanelDragState = CanvasPanDragState

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
const deckMenuOpen = ref(false)
const canvasZoom = ref(1)
const canvasPanX = ref(0)
const canvasPanY = ref(0)
const canvasPanDrag = ref<CanvasPanDragState | null>(null)
const builderToolbarX = ref(16)
const builderToolbarY = ref(68)
const builderToolbarDrag = ref<FloatingPanelDragState | null>(null)
const deckCanvasRef = ref<HTMLElement | null>(null)
const layoutDrag = ref<LayoutDragState | null>(null)

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
  { id: 'sensors', label: 'Sensors', title: 'Sensors', description: 'Install the primary sensor suite.' },
  { id: 'weapons', label: 'Weapons', title: 'Weapons', description: 'Reserve hardpoints and install weapons or screens.' },
  { id: 'options', label: 'Options', title: 'Options', description: 'Install ship systems and other High Guard options.' },
  { id: 'crew', label: 'Crew', title: 'Crew', description: 'Review commercial or military crew requirements.' },
  { id: 'accommodations-cargo', label: 'Cargo', title: 'Accommodations & Cargo', description: 'Assign staterooms, berths, common areas, and cargo.' },
  { id: 'review', label: 'Review', title: 'Review', description: 'Check tonnage, power, cost, and validation notes before saving.' },
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
      unplacedComponentIds: [],
    },
  }
}

const buildDraft = ref<CustomShipDesign>(createBlankCustomShipDesign())
const activeBuilderStep = computed(() => shipBuilderSteps[activeBuildStep.value] ?? shipBuilderSteps[0])
const buildSummary = computed(() => shipConstructionSummary(buildDraft.value))
const activeDeck = computed<CustomShipLayoutDeck>(() => {
  if (!buildDraft.value.layout.decks.length) buildDraft.value.layout.decks.push(createDefaultLayoutDeck())
  return buildDraft.value.layout.decks.find((deck) => deck.id === activeDeckId.value) ?? buildDraft.value.layout.decks[0] ?? createDefaultLayoutDeck()
})
const placeableComponentPolicies = ['required-area', 'derived-area', 'optional-area']
const placeableComponents = computed(() => buildSummary.value.components.filter((component) => (
  positiveComponentTons(component) > 0
  && placeableComponentPolicies.includes(component.placementPolicy ?? 'abstract')
)))
const exteriorComponents = computed(() => buildSummary.value.components.filter((component) => positiveComponentTons(component) > 0 && component.placementPolicy === 'exterior'))
const ledgerOnlyComponents = computed(() => buildSummary.value.components.filter((component) => !placeableComponents.value.some((placeable) => placeable.id === component.id) && component.placementPolicy !== 'exterior'))
const activeDeckPlacements = computed(() => buildDraft.value.layout.placements.filter((placement) => placement.deckId === activeDeck.value.id))
const activeDeckPlacedTons = computed(() => activeDeckPlacements.value.reduce((total, placement) => total + (placement.width * placement.height * layoutCellTons(activeDeck.value)), 0))
const selectedPlacement = computed(() => activeDeckPlacements.value.find((placement) => placement.id === selectedPlacementId.value) ?? null)
const selectedPlacementComponent = computed(() => selectedPlacement.value ? placementComponent(selectedPlacement.value) : null)
const layoutValidationNotes = computed(() => {
  const notes: string[] = []
  for (const component of placeableComponents.value) {
    const placedTons = placedTonsForComponent(component.id)
    if (placedTons <= 0) notes.push(`${component.name} has not been placed on the deck grid.`)
    else if (placedTons < positiveComponentTons(component)) notes.push(`${component.name} is undersized on the deck grid.`)
  }
  for (const placement of buildDraft.value.layout.placements) {
    const component = buildSummary.value.components.find((entry) => entry.id === placement.componentId)
    const deck = buildDraft.value.layout.decks.find((entry) => entry.id === placement.deckId)
    if (!component || !deck) continue
    if (placement.x < 1 || placement.y < 1 || placement.x + placement.width - 1 > deck.gridColumns || placement.y + placement.height - 1 > deck.gridRows) {
      notes.push(`${component.name} extends beyond ${deck.name}.`)
    }
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
  activeBuildStep.value = index
  builderCanvasOverlay.value = 'tool'
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
    'accommodations-cargo': cargoIconUrl,
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
const placementIconUrl = (placement: CustomShipLayoutPlacement) => {
  const component = placementComponent(placement)
  return component ? componentIconUrl(component) : suppliesIconUrl
}
const formatLedgerNumber = (value: number | undefined) => typeof value === 'number' ? value.toLocaleString() : '—'
const positiveComponentTons = (component: TravellerShipComponent) => Math.max(0, component.tons)
const layoutCellTons = (deck: CustomShipLayoutDeck | undefined) => Math.max(0.25, Number(deck?.tonsPerCell) || 1)
const baseCanvasCellSize = 32
const canvasCellSize = computed(() => Math.round(baseCanvasCellSize * canvasZoom.value))
const zoomPercent = computed(() => Math.round(canvasZoom.value * 100))
const componentRequiredCells = (component: TravellerShipComponent) => Math.max(1, Math.ceil(positiveComponentTons(component) / layoutCellTons(activeDeck.value)))
const placedTonsForComponent = (componentId: string) => buildDraft.value.layout.placements
  .filter((placement) => placement.componentId === componentId)
  .reduce((total, placement) => {
    const deck = buildDraft.value.layout.decks.find((entry) => entry.id === placement.deckId)
    return total + (placement.width * placement.height * layoutCellTons(deck))
  }, 0)
const componentPlacementStatus = (component: TravellerShipComponent) => {
  const placedTons = placedTonsForComponent(component.id)
  const requiredTons = positiveComponentTons(component)
  if (placedTons <= 0) return 'Unplaced'
  if (placedTons < requiredTons) return 'Undersized'
  if (placedTons > requiredTons + layoutCellTons(activeDeck.value)) return 'Oversized'
  return 'Placed'
}
const componentPlacementClass = (component: TravellerShipComponent) => {
  const status = componentPlacementStatus(component)
  if (status === 'Placed') return 'border-emerald-300/35 bg-emerald-300/12 text-emerald-50'
  if (status === 'Undersized' || status === 'Oversized') return 'border-amber-300/35 bg-amber-300/12 text-amber-50'
  return 'border-cyan-400/20 bg-cyan-950/30 text-cyan-50'
}
const placementComponent = (placement: CustomShipLayoutPlacement) => buildSummary.value.components.find((component) => component.id === placement.componentId)
const placementStyle = (placement: CustomShipLayoutPlacement) => ({
  gridColumn: `${placement.x} / span ${placement.width}`,
  gridRow: `${placement.y} / span ${placement.height}`,
})
const placementClass = (placement: CustomShipLayoutPlacement) => {
  if (selectedPlacementId.value === placement.id) return 'cursor-grabbing border-cyan-100 bg-cyan-300/35 ring-2 ring-cyan-100/70'
  if (placementHasOverlap(placement)) return 'border-rose-300/80 bg-rose-400/30'
  return 'cursor-grab border-amber-200/70 bg-amber-300/25 hover:bg-amber-300/35'
}
const deckGridStyle = (deck: CustomShipLayoutDeck | undefined) => ({
  gridTemplateColumns: `repeat(${deck?.gridColumns ?? 1}, ${canvasCellSize.value}px)`,
  gridTemplateRows: `repeat(${deck?.gridRows ?? 1}, ${canvasCellSize.value}px)`,
  width: `${(deck?.gridColumns ?? 1) * canvasCellSize.value}px`,
  height: `${(deck?.gridRows ?? 1) * canvasCellSize.value}px`,
})
const canvasWorldStyle = computed(() => ({
  transform: `translate(${canvasPanX.value}px, ${canvasPanY.value}px)`,
}))
const builderToolbarStyle = computed(() => ({
  transform: `translate(${builderToolbarX.value}px, ${builderToolbarY.value}px)`,
}))
const placementsOverlap = (first: Pick<CustomShipLayoutPlacement, 'x' | 'y' | 'width' | 'height'>, second: Pick<CustomShipLayoutPlacement, 'x' | 'y' | 'width' | 'height'>) => (
  first.x < second.x + second.width
  && first.x + first.width > second.x
  && first.y < second.y + second.height
  && first.y + first.height > second.y
)
const overlappingPlacements = (placement: CustomShipLayoutPlacement) => buildDraft.value.layout.placements.filter((entry) => (
  entry.id !== placement.id
  && entry.deckId === placement.deckId
  && placementsOverlap(placement, entry)
))
const placementHasOverlap = (placement: CustomShipLayoutPlacement) => overlappingPlacements(placement).length > 0
const findOpenPlacement = (deck: CustomShipLayoutDeck, width: number, height: number, componentId: string) => {
  for (let y = 1; y <= Math.max(1, deck.gridRows - height + 1); y += 1) {
    for (let x = 1; x <= Math.max(1, deck.gridColumns - width + 1); x += 1) {
      const candidate = { x, y, width, height }
      if (!activeDeckPlacements.value.some((placement) => placement.componentId !== componentId && placementsOverlap(candidate, placement))) return { x, y }
    }
  }
  return { x: 1, y: 1 }
}
const placeComponent = (component: TravellerShipComponent) => {
  const deck = activeDeck.value
  const cells = componentRequiredCells(component)
  const width = Math.min(deck.gridColumns, Math.max(1, Math.ceil(Math.sqrt(cells))))
  const height = Math.min(deck.gridRows, Math.max(1, Math.ceil(cells / width)))
  const position = findOpenPlacement(deck, width, height, component.id)
  buildDraft.value.layout.placements = buildDraft.value.layout.placements.filter((placement) => placement.componentId !== component.id)
  buildDraft.value.layout.placements.push({
    id: `placement-${component.id}`,
    componentId: component.id,
    deckId: deck.id,
    x: position.x,
    y: position.y,
    width,
    height,
    rotation: 0,
  })
  selectedPlacementId.value = `placement-${component.id}`
}
const removePlacement = (componentId: string) => {
  buildDraft.value.layout.placements = buildDraft.value.layout.placements.filter((placement) => placement.componentId !== componentId)
  if (!buildDraft.value.layout.placements.some((placement) => placement.id === selectedPlacementId.value)) selectedPlacementId.value = ''
}
const clampPlacement = (placement: CustomShipLayoutPlacement) => {
  const deck = buildDraft.value.layout.decks.find((entry) => entry.id === placement.deckId) ?? activeDeck.value
  placement.width = Math.max(1, Math.min(deck.gridColumns, Number(placement.width) || 1))
  placement.height = Math.max(1, Math.min(deck.gridRows, Number(placement.height) || 1))
  placement.x = Math.max(1, Math.min(deck.gridColumns - placement.width + 1, Number(placement.x) || 1))
  placement.y = Math.max(1, Math.min(deck.gridRows - placement.height + 1, Number(placement.y) || 1))
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
const addDeck = () => {
  const deck = createLayoutDeck(buildDraft.value.layout.decks.length + 1)
  buildDraft.value.layout.decks.push(deck)
  activeDeckId.value = deck.id
  selectedPlacementId.value = ''
}
const duplicateActiveDeck = () => {
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
const selectDeck = (deckId: string) => {
  activeDeckId.value = deckId
  selectedPlacementId.value = ''
  deckMenuOpen.value = false
}
const moveSelectedPlacementToDeck = (deckId: string) => {
  const placement = selectedPlacement.value
  const targetDeck = buildDraft.value.layout.decks.find((deck) => deck.id === deckId)
  if (!placement || !targetDeck || placement.deckId === deckId) return
  placement.deckId = deckId
  clampPlacement(placement)
  activeDeckId.value = deckId
  selectedPlacementId.value = placement.id
}
const selectedPlacementDeckTarget = computed({
  get: () => selectedPlacement.value?.deckId ?? activeDeck.value.id,
  set: (deckId: string) => moveSelectedPlacementToDeck(deckId),
})
const removeActiveDeck = () => {
  if (buildDraft.value.layout.decks.length <= 1) return
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
const setCanvasZoom = (zoom: number) => {
  canvasZoom.value = Math.max(0.5, Math.min(2.5, Number(zoom.toFixed(2))))
}
const adjustCanvasZoom = (delta: number) => {
  setCanvasZoom(canvasZoom.value + delta)
}
const resetCanvasView = () => {
  canvasZoom.value = 1
  canvasPanX.value = 0
  canvasPanY.value = 0
}
const startCanvasPan = (event: PointerEvent) => {
  if (event.button !== 0 || layoutDrag.value) return
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
  canvasPanX.value = canvasPanDrag.value.originX + event.clientX - canvasPanDrag.value.startClientX
  canvasPanY.value = canvasPanDrag.value.originY + event.clientY - canvasPanDrag.value.startClientY
}
const stopCanvasPan = () => {
  window.removeEventListener('pointermove', updateCanvasPan)
  canvasPanDrag.value = null
}
const handleCanvasWheel = (event: WheelEvent) => {
  if (!event.ctrlKey && !event.metaKey) return
  event.preventDefault()
  adjustCanvasZoom(event.deltaY > 0 ? -0.1 : 0.1)
}
const startBuilderToolbarDrag = (event: PointerEvent) => {
  event.preventDefault()
  builderToolbarDrag.value = {
    startClientX: event.clientX,
    startClientY: event.clientY,
    originX: builderToolbarX.value,
    originY: builderToolbarY.value,
  }
  window.addEventListener('pointermove', updateBuilderToolbarDrag)
  window.addEventListener('pointerup', stopBuilderToolbarDrag, { once: true })
}
const updateBuilderToolbarDrag = (event: PointerEvent) => {
  if (!builderToolbarDrag.value) return
  builderToolbarX.value = Math.max(0, builderToolbarDrag.value.originX + event.clientX - builderToolbarDrag.value.startClientX)
  builderToolbarY.value = Math.max(0, builderToolbarDrag.value.originY + event.clientY - builderToolbarDrag.value.startClientY)
}
const stopBuilderToolbarDrag = () => {
  window.removeEventListener('pointermove', updateBuilderToolbarDrag)
  builderToolbarDrag.value = null
}
const startPlacementDrag = (event: PointerEvent, placement: CustomShipLayoutPlacement, mode: LayoutDragMode) => {
  event.preventDefault()
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
  } else {
    placement.width = layoutDrag.value.originWidth + deltaX
    placement.height = layoutDrag.value.originHeight + deltaY
  }
  clampPlacement(placement)
}
const stopPlacementDrag = () => {
  window.removeEventListener('pointermove', updatePlacementDrag)
  layoutDrag.value = null
}
onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('pointermove', updatePlacementDrag)
    window.removeEventListener('pointermove', updateCanvasPan)
    window.removeEventListener('pointermove', updateBuilderToolbarDrag)
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
          <nav class="absolute left-0 top-0 z-40 rounded-md border border-cyan-400/30 bg-slate-950 p-1.5 shadow-xl shadow-black/35" :style="builderToolbarStyle">
            <div class="mb-1 h-3 cursor-grab rounded border border-cyan-400/20 bg-cyan-300/10 active:cursor-grabbing" title="Move toolbar" @pointerdown="startBuilderToolbarDrag" />
            <div class="grid grid-cols-2 gap-1.5">
              <button
                v-for="(step, index) in shipBuilderSteps"
                :key="step.id"
                class="flex h-8 w-8 items-center justify-center rounded-md border"
                :class="activeBuildStep === index ? 'border-cyan-100 bg-cyan-100 text-zinc-950' : 'border-cyan-300/25 text-cyan-100/75 hover:border-amber-300/60'"
                :title="`${index + 1}. ${step.title}`"
                type="button"
                @click="selectBuilderStep(index)"
              >
                <img :alt="step.title" class="h-5 w-5 object-contain" :src="builderStepIconUrl(step.id)">
                <span class="sr-only">{{ index + 1 }}. {{ step.title }}</span>
              </button>
              <button
                class="flex h-8 w-8 items-center justify-center rounded-md border"
                :class="builderCanvasOverlay === 'components' ? 'border-cyan-100 bg-cyan-100 text-zinc-950' : 'border-cyan-300/25 text-cyan-100/75 hover:border-amber-300/60'"
                title="Component Tray"
                type="button"
                @click="builderCanvasOverlay = builderCanvasOverlay === 'components' ? '' : 'components'"
              >
                <img alt="Component Tray" class="h-5 w-5 object-contain" :src="cargoIconUrl">
                <span class="sr-only">Component Tray</span>
              </button>
              <button
                class="flex h-8 w-8 items-center justify-center rounded-md border"
                :class="builderCanvasOverlay === 'ledger' ? 'border-cyan-100 bg-cyan-100 text-zinc-950' : 'border-cyan-300/25 text-cyan-100/75 hover:border-amber-300/60'"
                title="Ship Ledger"
                type="button"
                @click="builderCanvasOverlay = builderCanvasOverlay === 'ledger' ? '' : 'ledger'"
              >
                <AppIcon class="h-4 w-4" name="sliders" />
                <span class="sr-only">Ship Ledger</span>
              </button>
              <button
                class="relative flex h-8 w-8 items-center justify-center rounded-md border"
                :class="builderCanvasOverlay === 'validation' ? 'border-amber-200 bg-amber-300 text-zinc-950' : 'border-amber-300/35 text-amber-100 hover:border-amber-200'"
                title="Validation"
                type="button"
                @click="builderCanvasOverlay = builderCanvasOverlay === 'validation' ? '' : 'validation'"
              >
                <AppIcon class="h-4 w-4" name="warning" />
                <span v-if="layoutValidationNotes.length" class="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-300 px-1 text-[0.62rem] font-bold text-zinc-950">{{ layoutValidationNotes.length }}</span>
                <span class="sr-only">Validation</span>
              </button>
            </div>
          </nav>

          <section
            v-if="builderCanvasOverlay && builderCanvasOverlay !== 'ledger'"
            class="hud-scrollbar absolute left-[4.25rem] top-0 z-30 max-h-[calc(100vh-7rem)] overflow-auto rounded-md border border-cyan-400/30 bg-slate-950 p-3 shadow-2xl shadow-black/45"
            :class="builderCanvasOverlay === 'tool' ? 'w-[min(42rem,calc(100%-5rem))]' : 'w-[min(22rem,calc(100%-5rem))]'"
          >
            <div class="rounded-md border border-cyan-400/20 bg-cyan-950/30 p-3">
              <div class="flex items-center gap-3">
                <img :alt="builderCanvasOverlay === 'tool' ? activeBuilderStep.title : 'Component Tray'" class="h-9 w-9 shrink-0 object-contain" :src="builderCanvasOverlay === 'tool' ? builderStepIconUrl(activeBuilderStep.id) : cargoIconUrl">
                <div class="min-w-0">
                  <p class="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/70">{{ builderCanvasOverlay === 'tool' ? 'Selected Tool' : 'Component Tray' }}</p>
                  <h2 class="truncate text-base font-semibold text-white">{{ builderCanvasOverlay === 'tool' ? activeBuilderStep.title : 'Placeable Systems' }}</h2>
                </div>
                <button class="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-cyan-300/35 text-cyan-50 hover:border-amber-300/60" type="button" @click="builderCanvasOverlay = ''">
                  <AppIcon class="h-4 w-4" name="close" />
                  <span class="sr-only">Close overlay</span>
                </button>
              </div>
              <p v-if="builderCanvasOverlay === 'tool'" class="mt-2 text-sm text-cyan-100/70">{{ activeBuilderStep.description }}</p>
            </div>

            <div v-if="builderCanvasOverlay === 'tool'" class="mt-4">
              <section class="rounded-md border border-cyan-400/20 bg-cyan-950/30 p-3">
                <p class="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/70">Deck Options</p>
                <div class="mt-3 grid gap-3 md:grid-cols-4">
                  <label class="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100/70 md:col-span-1">
                    Deck Name
                    <input v-model="activeDeck.name" class="h-9 rounded-md border border-zinc-300 px-2 text-sm normal-case tracking-normal text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
                  </label>
                  <label class="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100/70">
                    Columns
                    <input v-model.number="activeDeck.gridColumns" class="h-9 rounded-md border border-zinc-300 px-2 text-sm normal-case tracking-normal text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" min="8" max="60" type="number">
                  </label>
                  <label class="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100/70">
                    Rows
                    <input v-model.number="activeDeck.gridRows" class="h-9 rounded-md border border-zinc-300 px-2 text-sm normal-case tracking-normal text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" min="8" max="60" type="number">
                  </label>
                  <label class="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100/70">
                    Tons/Cell
                    <input v-model.number="activeDeck.tonsPerCell" class="h-9 rounded-md border border-zinc-300 px-2 text-sm normal-case tracking-normal text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" min="0.25" step="0.25" type="number">
                  </label>
                </div>
              </section>

            <div v-if="activeBuilderStep.id === 'setup'" class="mt-5 grid gap-4 md:grid-cols-2">
              <label class="grid gap-1 text-sm font-semibold text-cyan-50">
                Ship Name
                <input v-model="buildDraft.name" class="h-10 rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
              </label>
              <label class="grid gap-1 text-sm font-semibold text-cyan-50">
                Role
                <input v-model="buildDraft.buildBrief.role" class="h-10 rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
              </label>
              <label class="grid gap-1 text-sm font-semibold text-cyan-50">
                Shipyard TL
                <input v-model.number="buildDraft.buildBrief.shipyardTechLevel" class="h-10 rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" min="6" type="number">
              </label>
              <label class="grid gap-1 text-sm font-semibold text-cyan-50">
                Design Mode
                <select v-model="buildDraft.buildBrief.designMode" class="h-10 rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
                  <option value="new">New Design</option>
                  <option value="standard">Standard Design</option>
                </select>
              </label>
              <label class="grid gap-1 text-sm font-semibold text-cyan-50">
                Crew Mode
                <select v-model="buildDraft.buildBrief.crewMode" class="h-10 rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
                  <option value="commercial">Commercial</option>
                  <option value="military">Military</option>
                </select>
              </label>
              <label class="grid gap-1 text-sm font-semibold text-cyan-50">
                Budget Target
                <input v-model="buildDraft.buildBrief.targetBudgetMCr" class="h-10 rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" placeholder="MCr">
              </label>
            </div>

            <div v-else-if="activeBuilderStep.id === 'hull'" class="mt-5 grid gap-4 md:grid-cols-2">
              <label class="grid gap-1 text-sm font-semibold text-cyan-50">
                Tonnage
                <input v-model.number="buildDraft.tons" class="h-10 rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" min="100" step="100" type="number">
              </label>
              <label class="grid gap-1 text-sm font-semibold text-cyan-50">
                Configuration
                <select v-model="buildDraft.hull.configuration" class="h-10 rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
                  <option value="standard">Standard</option>
                  <option value="streamlined">Streamlined</option>
                  <option value="sphere">Sphere</option>
                  <option value="close-structure">Close Structure</option>
                  <option value="dispersed-structure">Dispersed Structure</option>
                  <option value="planetoid">Planetoid</option>
                  <option value="buffered-planetoid">Buffered Planetoid</option>
                </select>
              </label>
              <label class="grid gap-1 text-sm font-semibold text-cyan-50">
                Armour Type
                <select v-model="buildDraft.hull.armourType" class="h-10 rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
                  <option value="">None</option>
                  <option value="titanium-steel">Titanium Steel</option>
                  <option value="crystaliron">Crystaliron</option>
                  <option value="bonded-superdense">Bonded Superdense</option>
                  <option value="molecular-bonded">Molecular Bonded</option>
                </select>
              </label>
              <label class="grid gap-1 text-sm font-semibold text-cyan-50">
                Armour Protection
                <input v-model.number="buildDraft.hull.armourProtection" class="h-10 rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" min="0" type="number">
              </label>
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

            <div v-else class="mt-5 rounded-md border border-cyan-400/20 bg-cyan-950/30 px-4 py-5">
              <p class="text-sm font-semibold text-cyan-50">{{ activeBuilderStep.title }} controls are ready for the next implementation pass.</p>
              <p class="mt-1 text-sm text-cyan-100/70">This shell keeps the workflow stable while we add detailed editors step by step.</p>
            </div>
            </div>

            <section v-if="builderCanvasOverlay === 'components'" class="mt-3 rounded-md border border-cyan-400/20 bg-cyan-950/30 p-3">
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
                        <img :alt="component.name" class="mt-0.5 h-6 w-6 shrink-0 object-contain" :src="componentIconUrl(component)">
                        <div class="min-w-0">
                        <p class="truncate text-sm font-semibold leading-tight">{{ component.name }}</p>
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
                      <button class="rounded-md border border-cyan-300/40 px-2 py-1 text-xs font-semibold text-cyan-50 hover:border-amber-300/60" type="button" @click="placeComponent(component)">
                        Place
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
                      title="Select deck"
                      type="button"
                      @click="deckMenuOpen = !deckMenuOpen"
                    >
                      <AppIcon class="h-4 w-4" name="sliders" />
                      <span class="sr-only">Select Deck</span>
                    </button>
                    <div v-if="deckMenuOpen" class="absolute left-0 top-11 z-40 grid min-w-48 gap-1 rounded-md border border-cyan-400/30 bg-slate-950 p-2 shadow-xl shadow-black/45">
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
                  <button class="flex h-9 w-9 items-center justify-center rounded-md border border-cyan-300/35 text-cyan-50 hover:border-amber-300/60" title="Add deck" type="button" @click="addDeck">
                    <AppIcon class="h-4 w-4" name="plus" />
                    <span class="sr-only">Add Deck</span>
                  </button>
                  <button class="flex h-9 w-9 items-center justify-center rounded-md border border-cyan-300/35 text-cyan-50 hover:border-amber-300/60" title="Duplicate deck" type="button" @click="duplicateActiveDeck">
                    <AppIcon class="h-4 w-4" name="copy" />
                    <span class="sr-only">Duplicate Deck</span>
                  </button>
                  <button
                    class="flex h-9 w-9 items-center justify-center rounded-md border border-cyan-300/25 text-cyan-100/70 hover:border-rose-300/60"
                    :disabled="buildDraft.layout.decks.length <= 1"
                    title="Delete deck"
                    type="button"
                    @click="removeActiveDeck"
                  >
                    <AppIcon class="h-4 w-4" name="trash" />
                    <span class="sr-only">Delete Deck</span>
                  </button>
                </div>
                </div>

                <div class="absolute right-6 top-16 z-20 flex items-center gap-2 rounded-md border border-cyan-400/30 bg-slate-950 p-2 shadow-xl shadow-black/35">
                  <button class="flex h-9 w-9 items-center justify-center rounded-md border border-cyan-300/35 text-cyan-50 hover:border-amber-300/60" title="Zoom out" type="button" @click="adjustCanvasZoom(-0.1)">
                    <span class="text-lg leading-none">-</span>
                    <span class="sr-only">Zoom Out</span>
                  </button>
                  <button class="flex h-9 w-12 items-center justify-center rounded-md border border-cyan-300/25 text-xs font-semibold text-cyan-100/80 hover:border-amber-300/60" title="Reset view" type="button" @click="resetCanvasView">
                    {{ zoomPercent }}%
                  </button>
                  <button class="flex h-9 w-9 items-center justify-center rounded-md border border-cyan-300/35 text-cyan-50 hover:border-amber-300/60" title="Zoom in" type="button" @click="adjustCanvasZoom(0.1)">
                    <AppIcon class="h-4 w-4" name="plus" />
                    <span class="sr-only">Zoom In</span>
                  </button>
                </div>

                <div class="mt-4 min-h-[calc(100vh-14rem)] cursor-grab overflow-hidden rounded-md border border-cyan-400/20 bg-slate-950/80 p-3 active:cursor-grabbing" @pointerdown.self="startCanvasPan" @wheel="handleCanvasWheel">
                  <div class="relative h-full min-h-[calc(100vh-16rem)] w-full" @pointerdown.self="startCanvasPan">
                    <div class="absolute left-0 top-0 transition-transform duration-75 ease-out" :style="canvasWorldStyle">
                      <div class="relative mb-1 ml-8 flex h-6" :style="{ width: `${activeDeck.gridColumns * canvasCellSize}px` }">
                        <span
                          v-for="column in activeDeck.gridColumns"
                          :key="`x-axis-${column}`"
                          class="flex shrink-0 items-center justify-center border-l border-cyan-400/10 text-[0.62rem] text-cyan-100/45"
                          :style="{ width: `${canvasCellSize}px` }"
                        >{{ column }}</span>
                      </div>
                      <div class="flex">
                        <div class="mr-1 grid w-7 shrink-0" :style="{ gridTemplateRows: `repeat(${activeDeck.gridRows}, ${canvasCellSize}px)` }">
                          <span
                            v-for="row in activeDeck.gridRows"
                            :key="`y-axis-${row}`"
                            class="flex items-center justify-end border-t border-cyan-400/10 pr-1 text-[0.62rem] text-cyan-100/45"
                          >{{ row }}</span>
                        </div>
                        <div ref="deckCanvasRef" class="relative grid gap-px" :style="deckGridStyle(activeDeck)" @pointerdown.self="startCanvasPan">
                          <div
                            v-for="cell in activeDeck.gridColumns * activeDeck.gridRows"
                            :key="cell"
                            class="border border-cyan-400/10 bg-cyan-300/[0.025]"
                            @pointerdown="startCanvasPan"
                          />
                          <div
                            v-for="placement in activeDeckPlacements"
                            :key="placement.id"
                            class="relative z-10 touch-none overflow-hidden rounded border px-2 py-1 text-left text-xs font-semibold text-amber-50 shadow-sm shadow-black/30"
                            :class="placementClass(placement)"
                            :style="placementStyle(placement)"
                            role="button"
                            tabindex="0"
                            @click="selectPlacement(placement)"
                            @pointerdown="startPlacementDrag($event, placement, 'move')"
                          >
                            <span class="flex min-w-0 items-center gap-1.5">
                              <img :alt="placementComponent(placement)?.name ?? placement.componentId" class="h-5 w-5 shrink-0 object-contain" :src="placementIconUrl(placement)">
                              <span class="block truncate">{{ placementComponent(placement)?.name ?? placement.componentId }}</span>
                            </span>
                            <span class="block text-[0.68rem] font-medium text-amber-50/70">{{ placement.width * placement.height * activeDeck.tonsPerCell }} tons</span>
                            <span
                              class="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize border-l border-t border-cyan-100/60 bg-cyan-100/25"
                              @click.stop
                              @pointerdown.stop="startPlacementDrag($event, placement, 'resize')"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="selectedPlacement" class="mt-4 rounded-md border border-cyan-400/20 bg-white/5 px-3 py-3">
                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p class="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/70">Selected Component</p>
                      <h4 class="mt-1 text-base font-semibold text-white">{{ selectedPlacementComponent?.name ?? selectedPlacement.componentId }}</h4>
                    </div>
                    <p class="rounded-md border border-cyan-400/20 px-2 py-1 text-xs font-semibold text-cyan-100/70">
                      {{ selectedPlacement.width * selectedPlacement.height * activeDeck.tonsPerCell }} tons
                    </p>
                  </div>

                  <div class="mt-3 grid gap-3 sm:grid-cols-4">
                    <label v-if="buildDraft.layout.decks.length > 1" class="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100/70 sm:col-span-4">
                      Move To Deck
                      <select v-model="selectedPlacementDeckTarget" class="h-9 rounded-md border border-zinc-300 px-2 text-sm normal-case tracking-normal text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200">
                        <option v-for="deck in buildDraft.layout.decks" :key="deck.id" :value="deck.id">{{ deck.name }}</option>
                      </select>
                    </label>
                    <label class="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100/70">
                      X
                      <input v-model.number="selectedPlacement.x" class="h-9 rounded-md border border-zinc-300 px-2 text-sm normal-case tracking-normal text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" min="1" type="number" @change="clampPlacement(selectedPlacement)">
                    </label>
                    <label class="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100/70">
                      Y
                      <input v-model.number="selectedPlacement.y" class="h-9 rounded-md border border-zinc-300 px-2 text-sm normal-case tracking-normal text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" min="1" type="number" @change="clampPlacement(selectedPlacement)">
                    </label>
                    <label class="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100/70">
                      Width
                      <input v-model.number="selectedPlacement.width" class="h-9 rounded-md border border-zinc-300 px-2 text-sm normal-case tracking-normal text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" min="1" type="number" @change="clampPlacement(selectedPlacement)">
                    </label>
                    <label class="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100/70">
                      Height
                      <input v-model.number="selectedPlacement.height" class="h-9 rounded-md border border-zinc-300 px-2 text-sm normal-case tracking-normal text-zinc-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200" min="1" type="number" @change="clampPlacement(selectedPlacement)">
                    </label>
                  </div>

                  <div class="mt-3 grid gap-2 sm:grid-cols-[auto_auto_auto]">
                    <div class="grid grid-cols-3 gap-1">
                      <span />
                      <button class="rounded-md border border-cyan-300/35 px-2 py-1 text-xs font-semibold text-cyan-50 hover:border-amber-300/60" type="button" @click="adjustPlacement(selectedPlacement, { y: -1 })">Up</button>
                      <span />
                      <button class="rounded-md border border-cyan-300/35 px-2 py-1 text-xs font-semibold text-cyan-50 hover:border-amber-300/60" type="button" @click="adjustPlacement(selectedPlacement, { x: -1 })">Left</button>
                      <button class="rounded-md border border-cyan-300/35 px-2 py-1 text-xs font-semibold text-cyan-50 hover:border-amber-300/60" type="button" @click="adjustPlacement(selectedPlacement, { y: 1 })">Down</button>
                      <button class="rounded-md border border-cyan-300/35 px-2 py-1 text-xs font-semibold text-cyan-50 hover:border-amber-300/60" type="button" @click="adjustPlacement(selectedPlacement, { x: 1 })">Right</button>
                    </div>
                    <div class="flex flex-wrap gap-1">
                      <button class="rounded-md border border-cyan-300/35 px-2 py-1 text-xs font-semibold text-cyan-50 hover:border-amber-300/60" type="button" @click="adjustPlacement(selectedPlacement, { width: 1 })">W+</button>
                      <button class="rounded-md border border-cyan-300/35 px-2 py-1 text-xs font-semibold text-cyan-50 hover:border-amber-300/60" type="button" @click="adjustPlacement(selectedPlacement, { width: -1 })">W-</button>
                      <button class="rounded-md border border-cyan-300/35 px-2 py-1 text-xs font-semibold text-cyan-50 hover:border-amber-300/60" type="button" @click="adjustPlacement(selectedPlacement, { height: 1 })">H+</button>
                      <button class="rounded-md border border-cyan-300/35 px-2 py-1 text-xs font-semibold text-cyan-50 hover:border-amber-300/60" type="button" @click="adjustPlacement(selectedPlacement, { height: -1 })">H-</button>
                    </div>
                    <button class="rounded-md border border-cyan-300/25 px-2 py-1 text-xs font-semibold text-cyan-100/70 hover:border-amber-300/60" type="button" @click="selectedPlacementId = ''">
                      Deselect
                    </button>
                  </div>

                  <p v-if="placementHasOverlap(selectedPlacement)" class="mt-3 rounded-md border border-rose-300/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-50">
                    This component overlaps another placed component.
                  </p>
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
