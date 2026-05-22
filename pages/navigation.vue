<script setup lang="ts">
import {
  atmosphereLabels,
  buildTravellerWorldAlerts,
  formatTravellerPopulation,
  groupTravellerTradeCodes,
  normalizeTravellerMapCreditsWorld,
  normalizeTravellerMapSearchResult,
  normalizeTravellerMapWorld,
  parseTravellerMapRows,
  splitTravellerUwp,
  starportLabels,
  travellerHexValue,
  travellerMapJsonp,
  type NavigationWorld,
  type SearchResult,
} from '~/utils/travellerMap'
import worldProfileReferenceData from '~/data/traveller2e/core/world-profile-tables.json'

type WorldProfileReference = {
  id: string
  title: string
  summary: string
  columns: string[]
  rows: string[][]
}

type UwpReferenceRow = {
  id: string
  label: string
  value: string
}

type TravellerMapCoordinates = {
  x: number
  y: number
  sx: number | null
  sy: number | null
  hx: number | null
  hy: number | null
}

type JumpRouteStop = {
  name: string
  sector: string
  hex: string
  coordinates: TravellerMapCoordinates | null
}

type JumpCalculationResult = {
  origin: NavigationWorld
  destination: NavigationWorld
  jumpRating: number
  routeFound: boolean | null
  routeStops: JumpRouteStop[]
}

const NAVIGATION_STATE_KEY = 'scoutsuite.navigation.v1'
const worldProfileReferences = worldProfileReferenceData.tables as WorldProfileReference[]

const searchQuery = ref('')
const searchResults = ref<SearchResult[]>([])
const searchLoading = ref(false)
const searchError = ref('')
const selectedWorld = ref<NavigationWorld | null>(null)
const mapFocusWorld = ref<NavigationWorld | null>(null)
const worldLoading = ref(false)
const worldError = ref('')
const currentLocation = ref<NavigationWorld | null>(null)
const mapStatus = ref('Click a world on the map or search by name.')
const activeWorldReferenceId = ref<string | null>(null)
const jumpRating = ref(2)
const jumpCalculationLoading = ref(false)
const jumpCalculationError = ref('')
const jumpCalculationResult = ref<JumpCalculationResult | null>(null)
const jumpRouteWildernessRefuel = ref(false)
const jumpRouteImperialOnly = ref(false)
const jumpRouteAvoidRedZones = ref(false)
const jumpRouteAllowAnomalies = ref(false)
const jumpRoutePlannerExpanded = ref(false)

const jumpRatingOptions = [1, 2, 3, 4, 5, 6]

let searchTimer: ReturnType<typeof setTimeout> | null = null

const numericPayloadValue = (record: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = Number(record[key])
    if (Number.isFinite(value)) return value
  }
  return null
}

const recordTextValue = (record: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return ''
}

const coordinatesFromRecord = (record: Record<string, unknown>): TravellerMapCoordinates | null => {
  const x = numericPayloadValue(record, ['x', 'X'])
  const y = numericPayloadValue(record, ['y', 'Y'])
  if (x === null || y === null) return null
  return {
    x,
    y,
    sx: numericPayloadValue(record, ['sx', 'Sx', 'SectorX']),
    sy: numericPayloadValue(record, ['sy', 'Sy', 'SectorY']),
    hx: numericPayloadValue(record, ['hx', 'Hx', 'HexX']),
    hy: numericPayloadValue(record, ['hy', 'Hy', 'HexY']),
  }
}

const routePayloadRows = (payload: unknown): Record<string, unknown>[] => {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && !Array.isArray(item)))
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return []
  const record = payload as Record<string, unknown>
  const rowCandidates = [
    record.Route,
    record.route,
    record.Stops,
    record.stops,
    record.Worlds,
    record.worlds,
    record.Path,
    record.path,
  ]
  const rows = rowCandidates.find(Array.isArray)
  if (Array.isArray(rows)) {
    return rows.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && !Array.isArray(item)))
  }
  return parseTravellerMapRows(payload)
}

const normalizeRouteStops = (payload: unknown, fallbackSector: string) => {
  const rows = routePayloadRows(payload)
  const stops = rows.map((row) => {
    const normalized = normalizeTravellerMapWorld(row, fallbackSector)
    const sector = normalized.sector || recordTextValue(row, ['Sector', 'sector']) || fallbackSector
    const hex = normalized.hex || recordTextValue(row, ['Hex', 'hex'])
    const name = normalized.name
      || recordTextValue(row, ['Name', 'name', 'WorldName', 'worldName', 'World', 'world', 'Location', 'location'])
      || [sector, hex].filter(Boolean).join(' ')
    return { name, sector, hex, coordinates: coordinatesFromRecord(row) }
  })
  return stops.filter((stop) => stop.name || stop.hex || stop.coordinates)
}

const travellerMapLocation = (world: NavigationWorld) => `${world.sector} ${world.hex}`

const navigationDebug = (...args: unknown[]) => {
  if (!import.meta.client) return
  console.debug('[ScoutSuite Navigation]', ...args)
}

const selectedMapTarget = computed(() => mapFocusWorld.value ?? currentLocation.value)
const jumpDestination = computed(() => selectedWorld.value)
const jumpCalculatorStatus = computed(() => {
  if (jumpCalculationLoading.value) return 'Plotting jump route...'
  if (jumpCalculationError.value) return jumpCalculationError.value
  if (jumpCalculationResult.value) {
    const result = jumpCalculationResult.value
    const routeJumps = result.routeStops.length > 1 ? result.routeStops.length - 1 : null
    if (result.routeFound) {
      const jumpSummary = routeJumps === null ? 'Origin and destination are the same system.' : `${routeJumps} jump${routeJumps === 1 ? '' : 's'} at Jump-${result.jumpRating}.`
      return `Route plotted by Traveller Map. ${jumpSummary}`
    }
    return `No Traveller Map route found at Jump-${result.jumpRating} under the selected constraints.`
  }
  if (!currentLocation.value) return 'Set a current location to anchor route plotting.'
  if (!jumpDestination.value) return 'Select a destination system from search or the map.'
  if (currentLocation.value.sector === jumpDestination.value.sector && currentLocation.value.hex === jumpDestination.value.hex) {
    return 'Origin and destination are the same system.'
  }
  return 'Ready to plot a Traveller Map route.'
})
const mapUrl = computed(() => {
  const url = new URL('https://travellermap.com/')
  url.searchParams.set('hideui', '1')
  url.searchParams.set('style', 'candy')
  url.searchParams.set('scale', '48')
  url.searchParams.set('options', '9207')

  if (selectedMapTarget.value?.sector && selectedMapTarget.value?.hex) {
    url.searchParams.set('sector', selectedMapTarget.value.sector)
    url.searchParams.set('hex', selectedMapTarget.value.hex)
  }

  if (currentLocation.value?.sector && currentLocation.value?.hex) {
    url.searchParams.set('marker_url', 'res/markers/scout.png')
    url.searchParams.set('marker_sector', currentLocation.value.sector)
    url.searchParams.set('marker_hex', currentLocation.value.hex)
  }

  return url.toString()
})

const splitUwp = computed(() => {
  const uwp = selectedWorld.value?.uwp ?? ''
  return splitTravellerUwp(uwp)
})

const tradeCodes = computed(() => selectedWorld.value?.remarks.split(/\s+/).filter(Boolean) ?? [])
const groupedTradeCodes = computed(() => groupTravellerTradeCodes(tradeCodes.value))
const tradeProfileGroups = computed(() => [
  { label: 'Economy', items: groupedTradeCodes.value.economy },
  { label: 'Environment', items: groupedTradeCodes.value.environment },
  { label: 'Population', items: groupedTradeCodes.value.population },
  { label: 'Technology', items: groupedTradeCodes.value.technology },
  { label: 'Other', items: groupedTradeCodes.value.other },
].filter((entry) => entry.items.length))
const worldAlerts = computed(() => selectedWorld.value ? buildTravellerWorldAlerts(selectedWorld.value, splitUwp.value) : [])
const populationDisplay = computed(() => {
  if (!splitUwp.value) return null
  return formatTravellerPopulation(splitUwp.value.population, selectedWorld.value?.pbg)
})
const activeWorldReference = computed(() => {
  if (!activeWorldReferenceId.value) return null
  return worldProfileReferences.find((entry) => entry.id === activeWorldReferenceId.value) ?? null
})
const systemBadges = computed(() => {
  const badges: Array<{ label: string; tone: 'ok' | 'warn' | 'danger' | 'info' }> = []
  if (!selectedWorld.value) return badges
  if (selectedWorld.value.zone === 'A') badges.push({ label: 'Amber Zone', tone: 'warn' })
  if (selectedWorld.value.zone === 'R') badges.push({ label: 'Red Zone', tone: 'danger' })
  if (selectedWorld.value.bases) badges.push({ label: `Bases ${selectedWorld.value.bases}`, tone: 'info' })
  for (const code of tradeCodes.value.slice(0, 6)) badges.push({ label: code, tone: 'ok' })
  return badges
})

const uwpRows = computed<UwpReferenceRow[]>(() => {
  if (!splitUwp.value) return []
  const parts = splitUwp.value
  const tl = travellerHexValue(parts.techLevel)
  return [
    { id: 'starport', label: 'Starport', value: `${parts.starport} · ${starportLabels[parts.starport] ?? 'Unknown'}` },
    { id: 'size', label: 'Size', value: parts.size === '0' ? 'Asteroid / small body' : `${travellerHexValue(parts.size) ?? parts.size}` },
    { id: 'atmosphere', label: 'Atmosphere', value: `${parts.atmosphere} · ${atmosphereLabels[parts.atmosphere] ?? 'Unknown'}` },
    { id: 'hydrographics', label: 'Hydrographics', value: `${travellerHexValue(parts.hydrographics) ?? parts.hydrographics}` },
    { id: 'population', label: 'Population', value: populationDisplay.value?.long ?? parts.population },
    { id: 'government', label: 'Government', value: `${travellerHexValue(parts.government) ?? parts.government}` },
    { id: 'law-level', label: 'Law Level', value: `${travellerHexValue(parts.law) ?? parts.law}` },
    { id: 'tech-level', label: 'Tech Level', value: tl === null ? parts.techLevel : `TL ${tl}` },
  ]
})

const uwpSummaryCards = computed(() => {
  if (!splitUwp.value) return []
  const parts = splitUwp.value
  const law = travellerHexValue(parts.law)
  const tl = travellerHexValue(parts.techLevel)
  return [
    { key: 'port', label: 'Port', value: parts.starport },
    { key: 'atmo', label: 'Atmo', value: parts.atmosphere },
    { key: 'pop', label: 'Pop', value: populationDisplay.value?.short ?? parts.population, mobileValue: populationDisplay.value?.long ?? parts.population, compact: true },
    { key: 'law', label: 'Law', value: law === null ? parts.law : `${law}` },
    { key: 'tl', label: 'TL', value: tl === null ? parts.techLevel : `${tl}` },
  ]
})

const worldMetaRows = computed(() => {
  if (!selectedWorld.value) return []
  return [
    { label: 'Sector', value: selectedWorld.value.sector },
    { label: 'Hex', value: selectedWorld.value.hex },
    { label: 'Allegiance', value: selectedWorld.value.allegiance || 'Unknown' },
    { label: 'Stellar', value: selectedWorld.value.stellar || 'Unknown' },
    { label: 'PBG', value: selectedWorld.value.pbg || 'Unknown' },
    { label: 'Ix / Ex / Cx', value: [selectedWorld.value.ix, selectedWorld.value.ex, selectedWorld.value.cx].filter(Boolean).join(' · ') || 'Unknown' },
  ]
})

const saveNavigationState = () => {
  if (!import.meta.client) return
  try {
    window.localStorage.setItem(NAVIGATION_STATE_KEY, JSON.stringify({
      selectedWorld: selectedWorld.value,
      mapFocusWorld: mapFocusWorld.value,
      currentLocation: currentLocation.value,
    }))
  } catch {
    // Navigation persistence should never block page use.
  }
}

const restoreNavigationState = () => {
  if (!import.meta.client) return
  try {
    const parsed = JSON.parse(window.localStorage.getItem(NAVIGATION_STATE_KEY) ?? '{}') as Partial<{
      selectedWorld: NavigationWorld
      mapFocusWorld: NavigationWorld
      currentLocation: NavigationWorld
    }>
    selectedWorld.value = parsed.selectedWorld ?? null
    mapFocusWorld.value = parsed.mapFocusWorld ?? parsed.selectedWorld ?? null
    currentLocation.value = parsed.currentLocation ?? null
  } catch {
    selectedWorld.value = null
    mapFocusWorld.value = null
    currentLocation.value = null
  }
}

const fetchWorld = async (sector: string, hex: string, options: { focusMap?: boolean } = {}) => {
  if (!sector || !hex) return
  navigationDebug('fetch world start', { sector, hex })
  worldLoading.value = true
  worldError.value = ''
  try {
    const rows = parseTravellerMapRows(await travellerMapJsonp('/api/jumpworlds', { sector, hex, jump: 0 }, navigationDebug))
    navigationDebug('fetch world rows', rows)
    const world = normalizeTravellerMapWorld(rows[0] ?? {}, sector)
    selectedWorld.value = world.hex ? world : { ...world, sector, hex }
    if (options.focusMap) mapFocusWorld.value = { ...selectedWorld.value }
    navigationDebug('selected world', selectedWorld.value)
    saveNavigationState()
  } catch (error) {
    worldError.value = error instanceof Error ? error.message : 'Could not load system data.'
    navigationDebug('fetch world error', error)
  } finally {
    worldLoading.value = false
  }
}

const fetchWorldAtMapLocation = async (x: number, y: number) => {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return
  worldLoading.value = true
  worldError.value = ''
  mapStatus.value = `Resolving map point ${x}, ${y}...`
  navigationDebug('map click resolve start', { x, y })
  try {
    const credits = await travellerMapJsonp<Record<string, unknown>>('/api/credits', { x, y }, navigationDebug)
    navigationDebug('map click credits', credits)
    const clickedWorld = normalizeTravellerMapCreditsWorld(credits)
    if (!clickedWorld.sector || !clickedWorld.hex || !clickedWorld.name) {
      mapStatus.value = 'No world found at that map point.'
      selectedWorld.value = clickedWorld.sector ? clickedWorld : selectedWorld.value
      return
    }
    mapStatus.value = `Selected ${clickedWorld.name}.`
    selectedWorld.value = clickedWorld
    await fetchWorld(clickedWorld.sector, clickedWorld.hex, { focusMap: false })
  } catch (error) {
    worldError.value = error instanceof Error ? error.message : 'Could not resolve map click.'
    mapStatus.value = 'Map click could not be resolved.'
    navigationDebug('map click resolve error', error)
  } finally {
    worldLoading.value = false
  }
}

const handleTravellerMapMessage = (event: MessageEvent) => {
  if (event.origin !== 'https://travellermap.com') return
  const data = typeof event.data === 'string'
    ? (() => {
        try {
          return JSON.parse(event.data) as Record<string, unknown>
        } catch {
          return null
        }
      })()
    : event.data
  if (!data || typeof data !== 'object' || Array.isArray(data)) return
  const payload = data as Record<string, unknown>
  if (payload.source !== 'travellermap' || (payload.type !== 'click' && payload.type !== 'doubleclick')) return
  const location = payload.location
  if (!location || typeof location !== 'object' || Array.isArray(location)) return
  const mapLocation = location as Record<string, unknown>
  const x = Number(mapLocation.x)
  const y = Number(mapLocation.y)
  navigationDebug('map message', { type: payload.type, x, y })
  void fetchWorldAtMapLocation(x, y)
}

const runSearch = async () => {
  const query = searchQuery.value.trim()
  if (query.length < 2) {
    searchResults.value = []
    searchError.value = ''
    return
  }

  searchLoading.value = true
  searchError.value = ''
  try {
    const rows = parseTravellerMapRows(await travellerMapJsonp('/api/search', { q: query }, navigationDebug))
    navigationDebug('search rows', rows)
    searchResults.value = rows.map(normalizeTravellerMapSearchResult).filter((result) => result.sector && result.hex)
    navigationDebug('search results', searchResults.value)
    if (!searchResults.value.length) searchError.value = 'No matching systems found.'
  } catch (error) {
    searchResults.value = []
    searchError.value = error instanceof Error ? error.message : 'Search failed.'
    navigationDebug('search error', error)
  } finally {
    searchLoading.value = false
  }
}

const selectSearchResult = async (result: SearchResult) => {
  mapStatus.value = `Selected ${result.name} from search.`
  await fetchWorld(result.sector, result.hex, { focusMap: true })
}

const setCurrentLocation = () => {
  if (!selectedWorld.value) return
  currentLocation.value = { ...selectedWorld.value }
  mapFocusWorld.value = { ...selectedWorld.value }
  jumpCalculationResult.value = null
  jumpCalculationError.value = ''
  saveNavigationState()
}

const jumpRouteParams = (origin: NavigationWorld, destination: NavigationWorld) => {
  const params: Record<string, string | number> = {
    start: travellerMapLocation(origin),
    end: travellerMapLocation(destination),
    jump: jumpRating.value,
  }
  if (jumpRouteWildernessRefuel.value) params.wild = 1
  if (jumpRouteImperialOnly.value) params.im = 1
  if (jumpRouteAvoidRedZones.value) params.nored = 1
  if (jumpRouteAllowAnomalies.value) params.anomaly = 1
  return params
}

const plotJumpRoute = async () => {
  if (!currentLocation.value || !jumpDestination.value) return
  jumpCalculationLoading.value = true
  jumpCalculationError.value = ''
  jumpCalculationResult.value = null
  try {
    let routeFound: boolean | null = null
    let routeStops: JumpRouteStop[] = []
    if (currentLocation.value.sector === jumpDestination.value.sector && currentLocation.value.hex === jumpDestination.value.hex) {
      routeFound = true
      routeStops = [{
        name: currentLocation.value.name || 'Current Location',
        sector: currentLocation.value.sector,
        hex: currentLocation.value.hex,
        coordinates: null,
      }]
    } else {
      try {
        const routePayload = await travellerMapJsonp('/api/route', jumpRouteParams(currentLocation.value, jumpDestination.value), navigationDebug)
        routeFound = true
        routeStops = normalizeRouteStops(routePayload, currentLocation.value.sector)
        if (!routeStops.length) {
          routeStops = [
            {
              name: currentLocation.value.name || 'Origin',
              sector: currentLocation.value.sector,
              hex: currentLocation.value.hex,
              coordinates: null,
            },
            {
              name: jumpDestination.value.name || 'Destination',
              sector: jumpDestination.value.sector,
              hex: jumpDestination.value.hex,
              coordinates: null,
            },
          ]
        }
      } catch (error) {
        routeFound = false
        routeStops = []
        navigationDebug('route lookup failed', error)
      }
    }
    navigationDebug('jump route stops', routeStops)

    jumpCalculationResult.value = {
      origin: { ...currentLocation.value },
      destination: { ...jumpDestination.value },
      jumpRating: jumpRating.value,
      routeFound,
      routeStops,
    }
  } catch (error) {
    jumpCalculationError.value = error instanceof Error ? error.message : 'Could not plot jump route.'
    navigationDebug('jump route error', error)
  } finally {
    jumpCalculationLoading.value = false
  }
}

const openWorldReference = (referenceId: string) => {
  activeWorldReferenceId.value = referenceId
}

const closeWorldReference = () => {
  activeWorldReferenceId.value = null
}

watch(searchQuery, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    void runSearch()
  }, 300)
})

watch([selectedWorld, mapFocusWorld, currentLocation], saveNavigationState, { deep: true })
watch([
  selectedWorld,
  jumpRating,
  jumpRouteWildernessRefuel,
  jumpRouteImperialOnly,
  jumpRouteAvoidRedZones,
  jumpRouteAllowAnomalies,
], () => {
  jumpCalculationError.value = ''
  jumpCalculationResult.value = null
})
watch(mapUrl, (url) => navigationDebug('map url', url), { immediate: true })

onMounted(() => {
  restoreNavigationState()
  window.addEventListener('message', handleTravellerMapMessage)
})

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer)
  window.removeEventListener('message', handleTravellerMapMessage)
})
</script>

<template>
  <main class="min-h-screen">
    <section class="mx-auto grid w-full max-w-[1800px] gap-5 px-4 py-6 sm:px-8 lg:px-10">
      <div class="navigation-page">
        <header class="navigation-page__chrome">
          <div>
            <span class="navigation-page__eyebrow">Traveller Map Link</span>
            <h1 class="navigation-page__title">Navigation</h1>
          </div>
          <div v-if="currentLocation" class="navigation-page__current">
            <span>Current Location</span>
            <strong>{{ currentLocation.name || 'Unknown World' }}</strong>
            <em>{{ currentLocation.sector }} {{ currentLocation.hex }}</em>
          </div>
        </header>

        <div class="navigation-console">
          <aside class="navigation-panel navigation-panel--left">
            <div class="navigation-panel--left-scroll hud-scrollbar">
              <section class="navigation-card navigation-card--search">
              <p class="navigation-card__label">System Search</p>
              <input
                v-model="searchQuery"
                class="navigation-search"
                placeholder="Search world, sector, UWP, remarks..."
                type="search"
              >
              <p v-if="searchLoading" class="navigation-muted">Searching Traveller Map...</p>
              <p v-else-if="searchError" class="navigation-warning">{{ searchError }}</p>
              <div class="navigation-results">
                <button
                  v-for="result in searchResults"
                  :key="result.id"
                  class="navigation-result"
                  type="button"
                  @click="selectSearchResult(result)"
                >
                  <span>{{ result.name }}</span>
                  <strong>{{ result.sector }} {{ result.hex }}</strong>
                  <em>{{ result.uwp || 'No UWP' }}</em>
                </button>
              </div>
              </section>

              <section class="navigation-card navigation-card--jump-planner">
              <button
                class="navigation-planner-toggle"
                type="button"
                :aria-expanded="jumpRoutePlannerExpanded"
                @click="jumpRoutePlannerExpanded = !jumpRoutePlannerExpanded"
              >
                <span class="navigation-card__label">Jump Route Planner</span>
                <strong aria-hidden="true">
                  <AppIcon
                    name="arrow"
                    :class="['navigation-planner-toggle__icon', { 'navigation-planner-toggle__icon--expanded': jumpRoutePlannerExpanded }]"
                  />
                </strong>
              </button>
              <div :class="['navigation-planner-body', { 'navigation-planner-body--expanded': jumpRoutePlannerExpanded }]">
                <div class="navigation-jump-route">
                  <div>
                    <span>Origin</span>
                    <strong>{{ currentLocation?.name || 'No current location' }}</strong>
                    <em>{{ currentLocation ? `${currentLocation.sector} ${currentLocation.hex}` : 'Use crosshairs on a selected world' }}</em>
                  </div>
                  <div>
                    <span>Destination</span>
                    <strong>{{ jumpDestination?.name || 'No destination selected' }}</strong>
                    <em>{{ jumpDestination ? `${jumpDestination.sector} ${jumpDestination.hex}` : 'Search or click a world' }}</em>
                  </div>
                </div>
                <label class="navigation-jump-rating">
                  <span>Jump Drive</span>
                  <select v-model.number="jumpRating" title="Select the ship Jump drive rating used by Traveller Map to plot each route leg.">
                    <option v-for="rating in jumpRatingOptions" :key="rating" :value="rating">
                      Jump-{{ rating }}
                    </option>
                  </select>
                </label>
                <div class="navigation-route-options">
                  <label>
                    <input v-model="jumpRouteWildernessRefuel" type="checkbox">
                    <span>Wilderness refuelling</span>
                  </label>
                  <label>
                    <input v-model="jumpRouteImperialOnly" type="checkbox">
                    <span>Imperial worlds</span>
                  </label>
                  <label>
                    <input v-model="jumpRouteAvoidRedZones" type="checkbox">
                    <span>Avoid red zones</span>
                  </label>
                  <label>
                    <input v-model="jumpRouteAllowAnomalies" type="checkbox">
                    <span>Allow anomalies</span>
                  </label>
                </div>
                <button
                  class="navigation-action"
                  type="button"
                  :disabled="!currentLocation || !jumpDestination || jumpCalculationLoading"
                  title="Plot a Traveller Map route from the current location to the selected destination."
                  @click="plotJumpRoute"
                >
                  {{ jumpCalculationLoading ? 'Plotting...' : 'Plot Route' }}
                </button>
                <div class="navigation-map-status">
                  {{ jumpCalculatorStatus }}
                </div>
                <p class="navigation-muted navigation-route-helper">
                  Traveller Map supplies the route from the selected origin, destination, and Jump drive rating.
                </p>
                <ol
                  v-if="jumpCalculationResult?.routeFound && jumpCalculationResult.routeStops.length"
                  class="navigation-route-stops"
                  aria-label="Traveller Map route stops"
                >
                  <li v-for="(stop, index) in jumpCalculationResult.routeStops" :key="`${stop.sector}-${stop.hex}-${index}`">
                    <span>{{ index + 1 }}</span>
                    <strong>{{ stop.name || 'Unnamed World' }}</strong>
                    <em>{{ stop.sector }} {{ stop.hex }}</em>
                  </li>
                </ol>
              </div>
              </section>
            </div>
          </aside>

          <section class="navigation-map">
            <iframe
              :src="mapUrl"
              class="navigation-map__iframe"
              title="Traveller Map"
              loading="lazy"
              referrerpolicy="strict-origin-when-cross-origin"
            />
          </section>

          <aside class="navigation-panel navigation-panel--right">
            <section class="navigation-card navigation-card--system">
              <div v-if="worldLoading" class="navigation-empty">Loading system profile...</div>
              <div v-else-if="worldError" class="navigation-warning">{{ worldError }}</div>
              <div v-else-if="selectedWorld">
                <div class="navigation-world-heading">
                  <div>
                    <h2 class="navigation-world-name">{{ selectedWorld.name || 'Unknown World' }}</h2>
                    <p class="navigation-world-subtitle">{{ selectedWorld.sector }} · {{ selectedWorld.hex }} · {{ selectedWorld.uwp || 'No UWP' }}</p>
                  </div>
                  <button
                    class="navigation-location-button"
                    type="button"
                    title="Set this world as the party current location and show the marker on the map."
                    aria-label="Set current location"
                    @click="setCurrentLocation"
                  >
                    <span class="navigation-location-button__crosshair" aria-hidden="true" />
                  </button>
                </div>

                <div v-if="uwpSummaryCards.length" class="navigation-uwp-strip">
                  <div
                    v-for="card in uwpSummaryCards"
                    :key="card.label"
                    :class="['navigation-uwp-card', `navigation-uwp-card--${card.key}`]"
                  >
                    <span>{{ card.label }}</span>
                    <strong :class="{ 'navigation-uwp-card__value--compact': card.compact }">
                      <span class="navigation-uwp-card__desktop-value">{{ card.value }}</span>
                      <span class="navigation-uwp-card__mobile-value">{{ card.mobileValue ?? card.value }}</span>
                    </strong>
                  </div>
                </div>

                <section v-if="worldAlerts.length" class="navigation-intel-section">
                  <p class="navigation-intel-heading">GM Intel</p>
                  <div class="navigation-alert-grid">
                    <article v-for="alert in worldAlerts" :key="alert.label" :class="['navigation-alert', `navigation-alert--${alert.tone}`]">
                      <strong>{{ alert.label }}</strong>
                      <span>{{ alert.detail }}</span>
                    </article>
                  </div>
                </section>

                <div v-if="systemBadges.length" class="navigation-badges">
                  <span v-for="badge in systemBadges" :key="`${badge.label}-${badge.tone}`" :class="['navigation-badge', `navigation-badge--${badge.tone}`]">
                    {{ badge.label }}
                  </span>
                </div>

                <section v-if="tradeCodes.length" class="navigation-intel-section">
                  <p class="navigation-intel-heading">Trade Profile</p>
                  <div class="navigation-trade-groups">
                    <div
                      v-for="group in tradeProfileGroups"
                      :key="group.label"
                      class="navigation-trade-group"
                    >
                      <span>{{ group.label }}</span>
                      <strong>{{ group.items.map((item) => item.label).join(', ') }}</strong>
                    </div>
                  </div>
                </section>

                <div class="navigation-stat-table">
                  <button
                    v-for="row in uwpRows"
                    :key="row.id"
                    class="navigation-stat-row navigation-stat-row--button"
                    type="button"
                    @click="openWorldReference(row.id)"
                  >
                    <span>{{ row.label }}</span>
                    <strong>{{ row.value }}</strong>
                  </button>
                </div>

                <div class="navigation-stat-table navigation-stat-table--meta">
                  <div v-for="row in worldMetaRows" :key="row.label" class="navigation-stat-row">
                    <span>{{ row.label }}</span>
                    <strong>{{ row.value }}</strong>
                  </div>
                </div>
              </div>
              <div v-else class="navigation-empty">
                Search for a system or set a current location to begin.
              </div>
            </section>
          </aside>
        </div>
      </div>
    </section>

    <Teleport to="body">
      <div
        v-if="activeWorldReference"
        class="navigation-reference-backdrop"
        role="presentation"
        @click.self="closeWorldReference"
      >
        <section
          class="navigation-reference-modal"
          role="dialog"
          aria-modal="true"
          :aria-label="`${activeWorldReference.title} reference`"
        >
          <header class="navigation-reference-modal__header">
            <div>
              <span>Core World Profile Reference</span>
              <h2>{{ activeWorldReference.title }}</h2>
            </div>
            <button class="navigation-reference-modal__close" type="button" @click="closeWorldReference">
              Close
            </button>
          </header>

          <p class="navigation-reference-modal__summary">{{ activeWorldReference.summary }}</p>

          <div class="navigation-reference-table-wrap hud-scrollbar">
            <table class="navigation-reference-table">
              <thead>
                <tr>
                  <th v-for="column in activeWorldReference.columns" :key="column">
                    {{ column }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, rowIndex) in activeWorldReference.rows" :key="`${activeWorldReference.id}-${rowIndex}`">
                  <td
                    v-for="(cell, cellIndex) in row"
                    :key="`${activeWorldReference.id}-${rowIndex}-${cellIndex}`"
                    :data-label="activeWorldReference.columns[cellIndex]"
                  >
                    {{ cell }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Teleport>
  </main>
</template>

<style scoped>
.navigation-page {
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

.navigation-page::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-top: 1px solid rgba(103, 232, 249, 0.65);
  background:
    linear-gradient(90deg, rgba(34, 211, 238, 0.44), transparent 22%, transparent 78%, rgba(34, 211, 238, 0.38)) top / 100% 2px no-repeat;
}

.navigation-page__chrome,
.navigation-console,
.navigation-card,
.navigation-map {
  position: relative;
  z-index: 1;
}

.navigation-page__chrome {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(34, 211, 238, 0.35);
  background:
    linear-gradient(90deg, rgba(34, 211, 238, 0.22), rgba(34, 211, 238, 0.08) 45%, rgba(245, 158, 11, 0.16)),
    rgba(15, 23, 42, 0.92);
}

.navigation-page__eyebrow,
.navigation-card__label {
  display: block;
  color: #67e8f9;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.navigation-page__title {
  margin-top: 0.2rem;
  color: #e0f2fe;
  font-size: clamp(1.65rem, 2vw, 2.25rem);
  font-weight: 800;
  line-height: 1;
  text-transform: uppercase;
  text-shadow: 0 0 16px rgba(34, 211, 238, 0.28);
}

.navigation-page__current {
  display: grid;
  justify-items: end;
  gap: 0.1rem;
  color: #bfdbfe;
  text-align: right;
}

.navigation-page__current span,
.navigation-page__current em,
.navigation-muted {
  color: #9cc9df;
  font-size: 0.78rem;
  font-style: normal;
}

.navigation-page__current strong {
  color: #f8fafc;
  font-size: 1rem;
}

.navigation-console {
  display: grid;
  grid-template-columns: minmax(17rem, 22rem) minmax(0, 1fr) minmax(19rem, 26rem);
  gap: 1rem;
  padding: 1rem;
  align-items: stretch;
}

.navigation-panel {
  display: grid;
  align-content: start;
  gap: 1rem;
  min-height: 0;
}

.navigation-panel--left {
  height: 72vh;
  max-height: 72vh;
  align-content: stretch;
  overflow: hidden;
}

.navigation-panel--left-scroll {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 0;
  max-height: 100%;
  overflow: auto;
  padding-bottom: 1.25rem;
  padding-right: 0.35rem;
}

.navigation-card,
.navigation-map {
  border: 1px solid rgba(34, 211, 238, 0.28);
  background:
    linear-gradient(180deg, rgba(8, 18, 32, 0.82), rgba(2, 6, 23, 0.88)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.12), transparent 15rem);
  box-shadow:
    inset 0 0 0 1px rgba(34, 211, 238, 0.06),
    0 0 22px rgba(34, 211, 238, 0.08);
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
}

.navigation-card {
  padding: 1rem;
}

.navigation-card--search,
.navigation-card--jump-planner {
  flex: 0 0 auto;
  min-height: auto;
}

.navigation-card--jump-planner {
  display: block;
  overflow: visible;
  padding-bottom: 1.15rem;
}

.navigation-planner-toggle {
  display: block;
  width: 100%;
  border: 0;
  background: transparent;
  color: inherit;
  padding: 0;
  text-align: left;
}

.navigation-planner-toggle strong {
  display: none;
}

.navigation-planner-body {
  display: block;
  min-height: max-content;
  overflow: visible;
}

.navigation-search {
  width: 100%;
  height: 2.75rem;
  margin-top: 0.75rem;
  border: 1px solid rgba(34, 211, 238, 0.48);
  background: linear-gradient(135deg, rgba(8, 47, 73, 0.65), rgba(2, 6, 23, 0.94));
  color: #e0f2fe;
  padding: 0 0.85rem;
  outline: none;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
}

.navigation-search:focus {
  border-color: rgba(103, 232, 249, 0.9);
  box-shadow: 0 0 18px rgba(34, 211, 238, 0.18);
}

.navigation-results {
  display: grid;
  margin-top: 0.75rem;
  gap: 0.45rem;
}

.navigation-result,
.navigation-action {
  border: 1px solid rgba(34, 211, 238, 0.38);
  background:
    linear-gradient(135deg, rgba(34, 211, 238, 0.14), rgba(15, 23, 42, 0.92) 42%, rgba(20, 184, 166, 0.12));
  color: #cffafe;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
}

.navigation-result {
  display: grid;
  gap: 0.15rem;
  padding: 0.7rem 0.8rem;
  text-align: left;
}

.navigation-result:hover,
.navigation-action:hover:not(:disabled) {
  border-color: rgba(103, 232, 249, 0.92);
  box-shadow: inset 0 0 18px rgba(34, 211, 238, 0.13), 0 0 18px rgba(34, 211, 238, 0.18);
}

.navigation-result span {
  color: #f8fafc;
  font-weight: 800;
}

.navigation-result strong,
.navigation-result em {
  color: #9cc9df;
  font-size: 0.78rem;
  font-style: normal;
}

.navigation-action {
  min-height: 2.7rem;
  width: 100%;
  margin-top: 0.8rem;
  font-weight: 800;
}

.navigation-action:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.navigation-jump-route {
  display: grid;
  gap: 0.55rem;
  margin-top: 0.85rem;
}

.navigation-jump-route div {
  display: grid;
  gap: 0.15rem;
  border: 1px solid rgba(34, 211, 238, 0.22);
  background: rgba(2, 6, 23, 0.42);
  padding: 0.65rem 0.75rem;
}

.navigation-jump-route span {
  color: #67e8f9;
  font-size: 0.66rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.navigation-jump-route strong {
  min-width: 0;
  color: #f8fafc;
  font-size: 0.92rem;
  font-weight: 900;
  overflow-wrap: anywhere;
}

.navigation-jump-route em {
  color: #9cc9df;
  font-size: 0.76rem;
  font-style: normal;
  line-height: 1.35;
}

.navigation-jump-rating {
  display: grid;
  gap: 0.4rem;
  margin-top: 0.75rem;
}

.navigation-jump-rating span {
  color: #bae6fd;
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.navigation-jump-rating select {
  width: 100%;
  min-height: 2.55rem;
  border: 1px solid rgba(34, 211, 238, 0.42);
  background:
    linear-gradient(135deg, rgba(8, 47, 73, 0.76), rgba(2, 6, 23, 0.94));
  color: #e0f2fe;
  font-weight: 850;
  outline: none;
  padding: 0 0.75rem;
  clip-path: polygon(0 0, calc(100% - 9px) 0, 100% 9px, 100% 100%, 9px 100%, 0 calc(100% - 9px));
}

.navigation-jump-rating select:focus {
  border-color: rgba(103, 232, 249, 0.9);
  box-shadow: 0 0 18px rgba(34, 211, 238, 0.16);
}

.navigation-route-options {
  display: grid;
  gap: 0.45rem;
  margin-top: 0.75rem;
}

.navigation-route-options label {
  display: grid;
  grid-template-columns: 1rem minmax(0, 1fr);
  align-items: center;
  gap: 0.5rem;
  color: #bfdbfe;
  font-size: 0.78rem;
  font-weight: 750;
}

.navigation-route-options input {
  width: 1rem;
  aspect-ratio: 1;
  accent-color: #22d3ee;
}

.navigation-map-status {
  margin-top: 0.85rem;
  border: 1px solid rgba(34, 211, 238, 0.24);
  background:
    linear-gradient(90deg, rgba(14, 116, 144, 0.18), rgba(2, 6, 23, 0.72)),
    repeating-linear-gradient(90deg, rgba(103, 232, 249, 0.06) 0 1px, transparent 1px 12px);
  color: #bae6fd;
  font-size: 0.78rem;
  line-height: 1.4;
  min-height: 2.35rem;
  overflow-wrap: anywhere;
  padding: 0.65rem 0.75rem;
}

.navigation-route-helper {
  margin-top: 0.55rem;
}

.navigation-route-stops {
  display: grid;
  gap: 0.35rem;
  margin-top: 0.75rem;
  padding: 0;
  list-style: none;
}

.navigation-route-stops li {
  display: grid;
  grid-template-columns: 1.6rem minmax(0, 1fr);
  column-gap: 0.5rem;
  row-gap: 0.1rem;
  align-items: center;
  border: 1px solid rgba(34, 211, 238, 0.18);
  background: rgba(2, 6, 23, 0.42);
  padding: 0.5rem 0.6rem;
}

.navigation-route-stops span {
  grid-row: span 2;
  display: grid;
  place-items: center;
  width: 1.45rem;
  aspect-ratio: 1;
  border: 1px solid rgba(250, 204, 21, 0.45);
  color: #fef08a;
  font-size: 0.72rem;
  font-weight: 950;
}

.navigation-route-stops strong,
.navigation-route-stops em {
  min-width: 0;
  overflow-wrap: anywhere;
}

.navigation-route-stops strong {
  color: #e0f2fe;
  font-size: 0.8rem;
  font-weight: 900;
}

.navigation-route-stops em {
  color: #9cc9df;
  font-size: 0.72rem;
  font-style: normal;
}

.navigation-map {
  height: 72vh;
  min-height: 72vh;
  padding: 0.75rem;
}

.navigation-map__iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 1px solid rgba(34, 211, 238, 0.24);
  background: rgba(5, 10, 19, 0.96);
  clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px));
}

.navigation-card--system {
  max-height: 72vh;
  min-height: 0;
  overflow: auto;
  padding-right: 0.85rem;
}

.navigation-world-heading {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 2.75rem;
  align-items: start;
  gap: 0.85rem;
  margin-top: 0.75rem;
}

.navigation-world-name {
  color: #f8fafc;
  font-size: 1.75rem;
  font-weight: 900;
  line-height: 1.05;
  text-transform: uppercase;
  text-shadow: 0 0 16px rgba(34, 211, 238, 0.3);
}

.navigation-world-subtitle {
  margin-top: 0.35rem;
  color: #bfdbfe;
}

.navigation-location-button {
  position: relative;
  display: grid;
  place-items: center;
  width: 2.75rem;
  aspect-ratio: 1;
  border: 1px solid rgba(34, 211, 238, 0.5);
  background:
    radial-gradient(circle at 50% 50%, rgba(103, 232, 249, 0.2), transparent 58%),
    linear-gradient(135deg, rgba(8, 47, 73, 0.86), rgba(2, 6, 23, 0.94));
  box-shadow:
    inset 0 0 18px rgba(34, 211, 238, 0.1),
    0 0 18px rgba(34, 211, 238, 0.1);
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
}

.navigation-location-button:hover,
.navigation-location-button:focus-visible {
  border-color: rgba(103, 232, 249, 0.95);
  box-shadow:
    inset 0 0 20px rgba(34, 211, 238, 0.16),
    0 0 22px rgba(34, 211, 238, 0.22);
}

.navigation-location-button__crosshair {
  position: relative;
  width: 1.35rem;
  aspect-ratio: 1;
  border: 2px solid #a5f3fc;
  border-radius: 50%;
  filter: drop-shadow(0 0 8px rgba(103, 232, 249, 0.8));
}

.navigation-location-button__crosshair::before,
.navigation-location-button__crosshair::after {
  content: '';
  position: absolute;
  background: #a5f3fc;
  box-shadow: 0 0 8px rgba(103, 232, 249, 0.8);
}

.navigation-location-button__crosshair::before {
  left: 50%;
  top: -0.35rem;
  bottom: -0.35rem;
  width: 2px;
  transform: translateX(-50%);
}

.navigation-location-button__crosshair::after {
  top: 50%;
  left: -0.35rem;
  right: -0.35rem;
  height: 2px;
  transform: translateY(-50%);
}

.navigation-uwp-strip {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.45rem;
  margin-top: 1rem;
}

.navigation-uwp-card {
  min-width: 0;
  border: 1px solid rgba(103, 232, 249, 0.32);
  background:
    radial-gradient(circle at 50% 0, rgba(34, 211, 238, 0.22), transparent 70%),
    linear-gradient(180deg, rgba(8, 47, 73, 0.6), rgba(2, 6, 23, 0.82));
  box-shadow:
    inset 0 0 18px rgba(34, 211, 238, 0.08),
    0 0 18px rgba(34, 211, 238, 0.08);
  padding: 0.55rem 0.45rem;
  text-align: center;
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
}

.navigation-uwp-card span {
  display: block;
  color: #67e8f9;
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.navigation-uwp-card strong span {
  color: inherit;
  font: inherit;
  letter-spacing: 0;
  text-transform: none;
}

.navigation-uwp-card strong {
  display: block;
  margin-top: 0.2rem;
  color: #fef08a;
  font-size: 1.25rem;
  font-weight: 950;
  line-height: 1;
  text-shadow: 0 0 14px rgba(250, 204, 21, 0.3);
}

.navigation-uwp-card strong .navigation-uwp-card__mobile-value {
  display: none;
}

.navigation-uwp-card__value--compact {
  font-size: clamp(0.82rem, 1.1vw, 1.05rem);
  white-space: nowrap;
}

.navigation-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.85rem;
}

.navigation-badge {
  border: 1px solid rgba(34, 211, 238, 0.28);
  padding: 0.18rem 0.45rem;
  color: #dff9ff;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
}

.navigation-badge--warn {
  border-color: rgba(251, 191, 36, 0.56);
  color: #fde68a;
}

.navigation-badge--danger {
  border-color: rgba(248, 113, 113, 0.58);
  color: #fecaca;
}

.navigation-badge--info {
  color: #bae6fd;
}

.navigation-intel-section {
  margin-top: 1rem;
}

.navigation-intel-heading {
  color: #67e8f9;
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.navigation-alert-grid {
  display: grid;
  gap: 0.5rem;
  margin-top: 0.55rem;
}

.navigation-alert {
  display: grid;
  gap: 0.2rem;
  border: 1px solid rgba(34, 211, 238, 0.28);
  background: rgba(8, 47, 73, 0.18);
  padding: 0.65rem 0.75rem;
  clip-path: polygon(0 0, calc(100% - 9px) 0, 100% 9px, 100% 100%, 9px 100%, 0 calc(100% - 9px));
}

.navigation-alert strong {
  color: #f8fafc;
  font-size: 0.84rem;
  font-weight: 900;
  text-transform: uppercase;
}

.navigation-alert span {
  color: #bfdbfe;
  font-size: 0.78rem;
  line-height: 1.38;
}

.navigation-alert--warn {
  border-color: rgba(251, 191, 36, 0.45);
  background: rgba(120, 53, 15, 0.18);
}

.navigation-alert--danger {
  border-color: rgba(248, 113, 113, 0.48);
  background: rgba(127, 29, 29, 0.22);
}

.navigation-alert--info {
  border-color: rgba(56, 189, 248, 0.34);
}

.navigation-trade-groups {
  display: grid;
  gap: 0.45rem;
  margin-top: 0.55rem;
}

.navigation-trade-group {
  display: grid;
  grid-template-columns: minmax(6rem, 0.72fr) minmax(0, 1.28fr);
  border: 1px solid rgba(34, 211, 238, 0.18);
  background: rgba(2, 6, 23, 0.46);
}

.navigation-trade-group span {
  background: rgba(14, 116, 144, 0.32);
  color: #dff9ff;
  padding: 0.38rem 0.5rem;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
}

.navigation-trade-group strong {
  min-width: 0;
  color: #dbeafe;
  padding: 0.38rem 0.5rem;
  font-size: 0.78rem;
  font-weight: 650;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.navigation-stat-table {
  display: grid;
  margin-top: 1rem;
  border: 1px solid rgba(34, 211, 238, 0.2);
}

.navigation-stat-table--meta {
  margin-top: 0.8rem;
}

.navigation-stat-row {
  display: grid;
  grid-template-columns: minmax(6.5rem, 0.8fr) minmax(0, 1.2fr);
  border-bottom: 1px solid rgba(34, 211, 238, 0.18);
}

.navigation-stat-row--button {
  width: 100%;
  border-top: 0;
  border-right: 0;
  border-left: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  padding: 0;
  text-align: left;
}

.navigation-stat-row:last-child {
  border-bottom: 0;
}

.navigation-stat-row span {
  min-width: 0;
  background: rgba(14, 116, 144, 0.38);
  color: #dff9ff;
  padding: 0.42rem 0.55rem;
  font-size: 0.78rem;
  font-weight: 900;
  line-height: 1.25;
  overflow-wrap: anywhere;
  text-transform: uppercase;
}

.navigation-stat-row strong {
  min-width: 0;
  color: #e0f2fe;
  padding: 0.42rem 0.55rem;
  font-size: 0.86rem;
  font-weight: 650;
  overflow-wrap: anywhere;
}

.navigation-stat-row--button:hover span,
.navigation-stat-row--button:focus-visible span {
  background: rgba(8, 145, 178, 0.55);
}

.navigation-stat-row--button:hover strong,
.navigation-stat-row--button:focus-visible strong {
  color: #fef08a;
  background: rgba(34, 211, 238, 0.08);
}

.navigation-stat-row--button:focus-visible {
  outline: 2px solid rgba(103, 232, 249, 0.82);
  outline-offset: -2px;
}

.navigation-empty,
.navigation-warning {
  margin-top: 0.75rem;
  border: 1px solid rgba(251, 191, 36, 0.3);
  background: rgba(120, 53, 15, 0.18);
  color: #fde68a;
  padding: 0.75rem;
}

.navigation-empty {
  border-color: rgba(34, 211, 238, 0.22);
  background: rgba(8, 47, 73, 0.18);
  color: #bfdbfe;
}

.navigation-reference-backdrop {
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: grid;
  place-items: center;
  padding: clamp(1rem, 3vw, 2rem);
  background:
    radial-gradient(circle at 50% 0, rgba(34, 211, 238, 0.16), transparent 34rem),
    rgba(2, 6, 23, 0.78);
  backdrop-filter: blur(10px);
}

.navigation-reference-modal {
  width: min(64rem, 100%);
  max-height: min(78vh, 52rem);
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  border: 1px solid rgba(34, 211, 238, 0.48);
  background:
    linear-gradient(180deg, rgba(8, 18, 32, 0.98), rgba(2, 6, 23, 0.98)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.16), transparent 26rem);
  box-shadow:
    0 0 42px rgba(34, 211, 238, 0.18),
    inset 0 0 0 1px rgba(34, 211, 238, 0.1);
  clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 18px 100%, 0 calc(100% - 18px));
  overflow: hidden;
}

.navigation-reference-modal__header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid rgba(34, 211, 238, 0.26);
  background: rgba(14, 116, 144, 0.22);
  padding: 1rem 1.1rem;
}

.navigation-reference-modal__header span {
  display: block;
  color: #67e8f9;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.navigation-reference-modal__header h2 {
  margin-top: 0.2rem;
  color: #f8fafc;
  font-size: clamp(1.45rem, 2.4vw, 2.25rem);
  font-weight: 950;
  line-height: 1;
  text-transform: uppercase;
  text-shadow: 0 0 16px rgba(34, 211, 238, 0.28);
}

.navigation-reference-modal__close {
  flex: 0 0 auto;
  min-height: 2.5rem;
  border: 1px solid rgba(34, 211, 238, 0.42);
  background: linear-gradient(135deg, rgba(8, 47, 73, 0.82), rgba(2, 6, 23, 0.92));
  color: #cffafe;
  font-weight: 900;
  padding: 0 0.9rem;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
}

.navigation-reference-modal__close:hover,
.navigation-reference-modal__close:focus-visible {
  border-color: rgba(103, 232, 249, 0.9);
  box-shadow: 0 0 18px rgba(34, 211, 238, 0.18);
}

.navigation-reference-modal__summary {
  border-bottom: 1px solid rgba(34, 211, 238, 0.18);
  color: #bfdbfe;
  line-height: 1.5;
  padding: 0.85rem 1.1rem;
}

.navigation-reference-table-wrap {
  min-height: 0;
  overflow: auto;
  padding: 1rem 1.1rem 1.1rem;
}

.navigation-reference-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid rgba(34, 211, 238, 0.24);
  color: #dbeafe;
  font-size: 0.9rem;
}

.navigation-reference-table th,
.navigation-reference-table td {
  border-bottom: 1px solid rgba(34, 211, 238, 0.18);
  border-right: 1px solid rgba(34, 211, 238, 0.14);
  padding: 0.55rem 0.65rem;
  text-align: left;
  vertical-align: top;
}

.navigation-reference-table th:last-child,
.navigation-reference-table td:last-child {
  border-right: 0;
}

.navigation-reference-table th {
  background: rgba(14, 116, 144, 0.48);
  color: #e0f2fe;
  font-size: 0.74rem;
  font-weight: 950;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.navigation-reference-table td:first-child {
  color: #fef08a;
  font-weight: 900;
  white-space: nowrap;
}

.navigation-reference-table tr:last-child td {
  border-bottom: 0;
}

@media (max-width: 1280px) {
  .navigation-console {
    grid-template-columns: minmax(0, 1fr);
  }

  .navigation-panel {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .navigation-panel--right {
    grid-template-columns: minmax(0, 1fr);
  }

  .navigation-map,
  .navigation-card--system {
    height: auto;
    max-height: none;
  }

  .navigation-panel--left {
    height: auto;
    max-height: none;
    overflow: visible;
  }

  .navigation-panel--left-scroll {
    max-height: none;
    overflow: visible;
    padding-bottom: 0;
    padding-right: 0;
  }

  .navigation-card--system {
    overflow: visible;
    padding-right: 1rem;
  }
}

@media (max-width: 760px) {
  .navigation-page__chrome,
  .navigation-panel {
    grid-template-columns: minmax(0, 1fr);
  }

  .navigation-page__chrome {
    display: grid;
  }

  .navigation-page__current {
    justify-items: start;
    text-align: left;
  }

  .navigation-console {
    padding: 0.75rem;
  }

  .navigation-map,
  .navigation-map__iframe {
    height: auto;
    min-height: 60vh;
  }

  .navigation-planner-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding-left: 0.45rem;
  }

  .navigation-planner-toggle strong {
    display: grid;
    place-items: center;
    width: 1.55rem;
    aspect-ratio: 1;
    border: 1px solid rgba(34, 211, 238, 0.35);
    background: rgba(8, 47, 73, 0.35);
    color: #bae6fd;
    font-size: 1rem;
    font-weight: 900;
    line-height: 1;
    clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
  }

  .navigation-planner-toggle__icon {
    width: 0.8rem;
    height: 0.8rem;
    transform: rotate(90deg);
    transition: transform 160ms ease;
  }

  .navigation-planner-toggle__icon--expanded {
    transform: rotate(-90deg);
  }

  .navigation-planner-body {
    display: none;
  }

  .navigation-planner-body--expanded {
    display: block;
  }

  .navigation-uwp-strip {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .navigation-uwp-card--tl {
    order: 1;
  }

  .navigation-uwp-card--pop {
    order: 2;
    grid-column: span 2;
  }

  .navigation-uwp-card--port {
    order: 3;
  }

  .navigation-uwp-card--law {
    order: 4;
  }

  .navigation-uwp-card--atmo {
    order: 5;
  }

  .navigation-uwp-card strong .navigation-uwp-card__desktop-value {
    display: none;
  }

  .navigation-uwp-card strong .navigation-uwp-card__mobile-value {
    display: block;
  }

  .navigation-uwp-card--pop .navigation-uwp-card__value--compact {
    font-size: clamp(0.9rem, 4.2vw, 1.1rem);
  }

  .navigation-stat-row {
    grid-template-columns: minmax(6.4rem, 0.43fr) minmax(0, 0.57fr);
  }

  .navigation-stat-row span {
    font-size: 0.6rem;
    overflow-wrap: normal;
    padding-left: 0.45rem;
    padding-right: 0.3rem;
  }

  .navigation-reference-modal {
    width: 100%;
    max-height: 86vh;
  }

  .navigation-reference-backdrop {
    align-items: start;
    padding: 0.7rem;
  }

  .navigation-reference-modal__header {
    align-items: start;
    padding: 0.85rem;
  }

  .navigation-reference-modal__header h2 {
    font-size: 1.55rem;
  }

  .navigation-reference-modal__summary {
    padding: 0.8rem 0.85rem;
  }

  .navigation-reference-table-wrap {
    padding: 0.85rem;
  }

  .navigation-reference-table {
    min-width: 0;
    border: 0;
    display: grid;
    gap: 0.7rem;
  }

  .navigation-reference-table thead {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
  }

  .navigation-reference-table tbody {
    display: grid;
    gap: 0.7rem;
  }

  .navigation-reference-table tr {
    display: grid;
    border: 1px solid rgba(34, 211, 238, 0.26);
    background: rgba(2, 6, 23, 0.46);
    clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  }

  .navigation-reference-table td {
    display: grid;
    grid-template-columns: minmax(5.5rem, 0.42fr) minmax(0, 1fr);
    gap: 0.65rem;
    align-items: start;
    border-right: 0;
    padding: 0.6rem 0.7rem;
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .navigation-reference-table td::before {
    content: attr(data-label);
    color: #67e8f9;
    font-size: 0.68rem;
    font-weight: 950;
    letter-spacing: 0.08em;
    line-height: 1.35;
    text-transform: uppercase;
  }

  .navigation-reference-table td:first-child {
    background: rgba(14, 116, 144, 0.28);
    white-space: normal;
  }

  .navigation-reference-table td:first-child::before {
    color: #bae6fd;
  }
}
</style>
