<script setup lang="ts">
type NavigationWorld = {
  name: string
  sector: string
  hex: string
  uwp: string
  bases: string
  remarks: string
  zone: string
  pbg: string
  allegiance: string
  stellar: string
  ix: string
  ex: string
  cx: string
  worlds: string
}

type SearchResult = {
  id: string
  name: string
  sector: string
  hex: string
  uwp: string
  remarks: string
}

const NAVIGATION_STATE_KEY = 'scoutsuite.navigation.v1'

const searchQuery = ref('')
const searchResults = ref<SearchResult[]>([])
const searchLoading = ref(false)
const searchError = ref('')
const selectedWorld = ref<NavigationWorld | null>(null)
const worldLoading = ref(false)
const worldError = ref('')
const currentLocation = ref<NavigationWorld | null>(null)
const mapStatus = ref('Click a world on the map or search by name.')

let searchTimer: ReturnType<typeof setTimeout> | null = null

const compact = (value: unknown) => String(value ?? '').trim()
const navigationDebug = (...args: unknown[]) => {
  if (!import.meta.client) return
  console.debug('[ScoutSuite Navigation]', ...args)
}

const unwrapTravellerMapWorld = (raw: Record<string, unknown>): Record<string, unknown> => {
  if (raw.World && typeof raw.World === 'object' && !Array.isArray(raw.World)) return raw.World as Record<string, unknown>
  return raw
}

const normalizeHex = (raw: Record<string, unknown>) => {
  const explicitHex = compact(raw.Hex ?? raw.hex)
  if (explicitHex) return explicitHex
  const hexX = Number(raw.HexX ?? raw.hexX)
  const hexY = Number(raw.HexY ?? raw.hexY)
  if (Number.isFinite(hexX) && Number.isFinite(hexY)) return `${String(hexX).padStart(2, '0')}${String(hexY).padStart(2, '0')}`
  return ''
}

const normalizeWorld = (raw: Record<string, unknown>, fallbackSector = ''): NavigationWorld => {
  const world = unwrapTravellerMapWorld(raw)
  return {
    name: compact(world.Name ?? world.name ?? world.WorldName ?? world.worldName),
    sector: compact(world.Sector ?? world.sector ?? world.SectorName ?? world.sectorName ?? fallbackSector),
    hex: normalizeHex(world),
    uwp: compact(world.UWP ?? world.Uwp ?? world.uwp),
    bases: compact(world.Bases ?? world.bases),
    remarks: compact(world.Remarks ?? world.remarks),
    zone: compact(world.Zone ?? world.zone),
    pbg: compact(world.PBG ?? world.pbg),
    allegiance: compact(world.AllegianceName ?? world.allegianceName ?? world.Allegiance ?? world.allegiance),
    stellar: compact(world.Stellar ?? world.stellar),
    ix: compact(world.Ix ?? world.ix),
    ex: compact(world.Ex ?? world.ex),
    cx: compact(world.Cx ?? world.cx),
    worlds: compact(world.Worlds ?? world.worlds),
  }
}

const normalizeCreditsWorld = (raw: Record<string, unknown>): NavigationWorld => ({
  name: compact(raw.WorldName),
  sector: compact(raw.SectorName),
  hex: compact(raw.WorldHex),
  uwp: compact(raw.WorldUwp),
  bases: '',
  remarks: compact(raw.WorldRemarks),
  zone: '',
  pbg: compact(raw.WorldPbg),
  allegiance: compact(raw.WorldAllegiance),
  stellar: '',
  ix: compact(raw.WorldIx),
  ex: compact(raw.WorldEx),
  cx: compact(raw.WorldCx),
  worlds: '',
})

const normalizeSearchResult = (raw: Record<string, unknown>, index: number): SearchResult => {
  const world = normalizeWorld(raw)
  return {
    id: `${world.sector}-${world.hex}-${world.name}-${index}`,
    name: world.name || compact(raw.label ?? raw.Label ?? 'Unknown World'),
    sector: world.sector,
    hex: world.hex,
    uwp: world.uwp,
    remarks: world.remarks,
  }
}

const parseResponseRows = (payload: unknown): Record<string, unknown>[] => {
  if (Array.isArray(payload)) return payload.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && !Array.isArray(item)))
  if (!payload || typeof payload !== 'object') return []
  const value = payload as Record<string, unknown>
  const results = value.Results && typeof value.Results === 'object' && !Array.isArray(value.Results)
    ? value.Results as Record<string, unknown>
    : null
  const candidateArrays = [
    value.Worlds,
    value.worlds,
    value.Items,
    value.items,
    value.Results,
    value.results,
    results?.Items,
    results?.items,
    results?.Results,
    results?.results,
  ]
  const rows = candidateArrays.find((item) => Array.isArray(item))
  if (Array.isArray(rows)) return rows.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && !Array.isArray(item)))
  return [value]
}

const travellerMapJsonp = <T>(path: string, params: Record<string, string | number>) => {
  return new Promise<T>((resolve, reject) => {
    if (!import.meta.client) {
      reject(new Error('Traveller Map API is available in the browser.'))
      return
    }

    const callbackName = `scoutsuiteTravellerMap${Date.now()}${Math.random().toString(36).slice(2)}`
    const url = new URL(path, 'https://travellermap.com')
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)))
    url.searchParams.set('jsonp', callbackName)
    navigationDebug('request', { path, params, url: url.toString() })

    const script = document.createElement('script')
    const cleanup = () => {
      delete (window as Window & Record<string, unknown>)[callbackName]
      script.remove()
    }
    const timeout = window.setTimeout(() => {
      cleanup()
      reject(new Error('Traveller Map request timed out.'))
    }, 12000)

    ;(window as Window & Record<string, unknown>)[callbackName] = (payload: T) => {
      window.clearTimeout(timeout)
      cleanup()
      navigationDebug('response', { path, payload })
      resolve(payload)
    }
    script.onerror = () => {
      window.clearTimeout(timeout)
      cleanup()
      navigationDebug('request failed', { path, params })
      reject(new Error('Traveller Map request failed.'))
    }
    script.src = url.toString()
    document.body.appendChild(script)
  })
}

const selectedMapTarget = computed(() => selectedWorld.value ?? currentLocation.value)
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
    url.searchParams.set('yah', '1')
    url.searchParams.set('yah_sector', currentLocation.value.sector)
    url.searchParams.set('yah_hex', currentLocation.value.hex)
  }

  return url.toString()
})

const splitUwp = computed(() => {
  const uwp = selectedWorld.value?.uwp ?? ''
  const match = uwp.match(/^([A-X?])([0-9A-F?])([0-9A-F?])([0-9A-F?])([0-9A-F?])([0-9A-F?])([0-9A-F?])-?([0-9A-H?])$/i)
  if (!match) return null
  return {
    starport: match[1].toUpperCase(),
    size: match[2].toUpperCase(),
    atmosphere: match[3].toUpperCase(),
    hydrographics: match[4].toUpperCase(),
    population: match[5].toUpperCase(),
    government: match[6].toUpperCase(),
    law: match[7].toUpperCase(),
    techLevel: match[8].toUpperCase(),
  }
})

const hexValue = (value: string) => value === '?' ? null : Number.parseInt(value, 16)
const starportLabels: Record<string, string> = {
  A: 'Excellent',
  B: 'Good',
  C: 'Routine',
  D: 'Poor',
  E: 'Frontier',
  X: 'None',
  '?': 'Unknown',
}
const atmosphereLabels: Record<string, string> = {
  0: 'Vacuum',
  1: 'Trace',
  2: 'Very Thin, Tainted',
  3: 'Very Thin',
  4: 'Thin, Tainted',
  5: 'Thin',
  6: 'Standard',
  7: 'Standard, Tainted',
  8: 'Dense',
  9: 'Dense, Tainted',
  A: 'Exotic',
  B: 'Corrosive',
  C: 'Insidious',
  D: 'Dense, High',
  E: 'Thin, Low',
  F: 'Unusual',
}
const tradeCodes = computed(() => selectedWorld.value?.remarks.split(/\s+/).filter(Boolean) ?? [])
const systemBadges = computed(() => {
  const badges: Array<{ label: string; tone: 'ok' | 'warn' | 'danger' | 'info' }> = []
  if (!selectedWorld.value) return badges
  if (selectedWorld.value.zone === 'A') badges.push({ label: 'Amber Zone', tone: 'warn' })
  if (selectedWorld.value.zone === 'R') badges.push({ label: 'Red Zone', tone: 'danger' })
  if (selectedWorld.value.bases) badges.push({ label: `Bases ${selectedWorld.value.bases}`, tone: 'info' })
  for (const code of tradeCodes.value.slice(0, 6)) badges.push({ label: code, tone: 'ok' })
  return badges
})

const uwpRows = computed(() => {
  if (!splitUwp.value) return []
  const parts = splitUwp.value
  const tl = hexValue(parts.techLevel)
  const pop = hexValue(parts.population)
  return [
    { label: 'Starport', value: `${parts.starport} · ${starportLabels[parts.starport] ?? 'Unknown'}` },
    { label: 'Size', value: parts.size === '0' ? 'Asteroid / small body' : `${hexValue(parts.size) ?? parts.size}` },
    { label: 'Atmosphere', value: `${parts.atmosphere} · ${atmosphereLabels[parts.atmosphere] ?? 'Unknown'}` },
    { label: 'Hydrographics', value: `${hexValue(parts.hydrographics) ?? parts.hydrographics}` },
    { label: 'Population', value: pop === null ? parts.population : `${parts.population} · 10^${pop}` },
    { label: 'Government', value: `${hexValue(parts.government) ?? parts.government}` },
    { label: 'Law Level', value: `${hexValue(parts.law) ?? parts.law}` },
    { label: 'Tech Level', value: tl === null ? parts.techLevel : `${parts.techLevel} · TL ${tl}` },
  ]
})

const uwpSummaryCards = computed(() => {
  if (!splitUwp.value) return []
  const parts = splitUwp.value
  return [
    { label: 'Port', value: parts.starport },
    { label: 'Atmo', value: parts.atmosphere },
    { label: 'Pop', value: parts.population },
    { label: 'Law', value: parts.law },
    { label: 'TL', value: parts.techLevel },
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
      currentLocation: NavigationWorld
    }>
    selectedWorld.value = parsed.selectedWorld ?? null
    currentLocation.value = parsed.currentLocation ?? null
  } catch {
    selectedWorld.value = null
    currentLocation.value = null
  }
}

const fetchWorld = async (sector: string, hex: string) => {
  if (!sector || !hex) return
  navigationDebug('fetch world start', { sector, hex })
  worldLoading.value = true
  worldError.value = ''
  try {
    const rows = parseResponseRows(await travellerMapJsonp('/api/jumpworlds', { sector, hex, jump: 0 }))
    navigationDebug('fetch world rows', rows)
    const world = normalizeWorld(rows[0] ?? {}, sector)
    selectedWorld.value = world.hex ? world : { ...world, sector, hex }
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
    const credits = await travellerMapJsonp<Record<string, unknown>>('/api/credits', { x, y })
    navigationDebug('map click credits', credits)
    const clickedWorld = normalizeCreditsWorld(credits)
    if (!clickedWorld.sector || !clickedWorld.hex || !clickedWorld.name) {
      mapStatus.value = 'No world found at that map point.'
      selectedWorld.value = clickedWorld.sector ? clickedWorld : selectedWorld.value
      return
    }
    mapStatus.value = `Selected ${clickedWorld.name}.`
    selectedWorld.value = clickedWorld
    await fetchWorld(clickedWorld.sector, clickedWorld.hex)
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
    const rows = parseResponseRows(await travellerMapJsonp('/api/search', { q: query }))
    navigationDebug('search rows', rows)
    searchResults.value = rows.map(normalizeSearchResult).filter((result) => result.sector && result.hex)
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
  await fetchWorld(result.sector, result.hex)
}

const setCurrentLocation = () => {
  if (!selectedWorld.value) return
  currentLocation.value = { ...selectedWorld.value }
  saveNavigationState()
}

watch(searchQuery, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    void runSearch()
  }, 300)
})

watch([selectedWorld, currentLocation], saveNavigationState, { deep: true })
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
            <section class="navigation-card">
              <p class="navigation-card__label">System Search</p>
              <input
                v-model="searchQuery"
                class="navigation-search"
                placeholder="Search world, sector, UWP, remarks..."
                type="search"
              >
              <p v-if="searchLoading" class="navigation-muted">Searching Traveller Map...</p>
              <p v-else-if="searchError" class="navigation-warning">{{ searchError }}</p>
              <div class="navigation-results hud-scrollbar">
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

            <section class="navigation-card">
              <p class="navigation-card__label">Location Control</p>
              <button class="navigation-action" type="button" :disabled="!selectedWorld" @click="setCurrentLocation">
                Set Current Location
              </button>
              <p class="navigation-muted">
                The current location is saved locally and sent to Traveller Map as the party marker.
              </p>
              <div class="navigation-map-status">
                {{ mapStatus }}
              </div>
            </section>
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
              <p class="navigation-card__label">Selected System</p>
              <div v-if="worldLoading" class="navigation-empty">Loading system profile...</div>
              <div v-else-if="worldError" class="navigation-warning">{{ worldError }}</div>
              <div v-else-if="selectedWorld">
                <h2 class="navigation-world-name">{{ selectedWorld.name || 'Unknown World' }}</h2>
                <p class="navigation-world-subtitle">{{ selectedWorld.sector }} · {{ selectedWorld.hex }} · {{ selectedWorld.uwp || 'No UWP' }}</p>

                <div v-if="uwpSummaryCards.length" class="navigation-uwp-strip">
                  <div v-for="card in uwpSummaryCards" :key="card.label" class="navigation-uwp-card">
                    <span>{{ card.label }}</span>
                    <strong>{{ card.value }}</strong>
                  </div>
                </div>

                <div v-if="systemBadges.length" class="navigation-badges">
                  <span v-for="badge in systemBadges" :key="`${badge.label}-${badge.tone}`" :class="['navigation-badge', `navigation-badge--${badge.tone}`]">
                    {{ badge.label }}
                  </span>
                </div>

                <div class="navigation-stat-table">
                  <div v-for="row in uwpRows" :key="row.label" class="navigation-stat-row">
                    <span>{{ row.label }}</span>
                    <strong>{{ row.value }}</strong>
                  </div>
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
}

.navigation-panel {
  display: grid;
  align-content: start;
  gap: 1rem;
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
  max-height: 24rem;
  margin-top: 0.75rem;
  overflow: auto;
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

.navigation-map-status {
  margin-top: 0.85rem;
  border: 1px solid rgba(34, 211, 238, 0.24);
  background:
    linear-gradient(90deg, rgba(14, 116, 144, 0.18), rgba(2, 6, 23, 0.72)),
    repeating-linear-gradient(90deg, rgba(103, 232, 249, 0.06) 0 1px, transparent 1px 12px);
  color: #bae6fd;
  font-size: 0.78rem;
  line-height: 1.4;
  padding: 0.65rem 0.75rem;
}

.navigation-map {
  min-height: 72vh;
  padding: 0.75rem;
}

.navigation-map__iframe {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 70vh;
  border: 1px solid rgba(34, 211, 238, 0.24);
  background: rgba(5, 10, 19, 0.96);
  clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px));
}

.navigation-world-name {
  margin-top: 0.75rem;
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

.navigation-uwp-card strong {
  display: block;
  margin-top: 0.2rem;
  color: #fef08a;
  font-size: 1.25rem;
  font-weight: 950;
  line-height: 1;
  text-shadow: 0 0 14px rgba(250, 204, 21, 0.3);
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

.navigation-stat-row:last-child {
  border-bottom: 0;
}

.navigation-stat-row span {
  background: rgba(14, 116, 144, 0.38);
  color: #dff9ff;
  padding: 0.42rem 0.55rem;
  font-size: 0.78rem;
  font-weight: 900;
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
    min-height: 60vh;
  }

  .navigation-uwp-strip {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
