export type NavigationWorld = {
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

export type SearchResult = {
  id: string
  name: string
  sector: string
  hex: string
  uwp: string
  remarks: string
}

export type SplitUwp = {
  starport: string
  size: string
  atmosphere: string
  hydrographics: string
  population: string
  government: string
  law: string
  techLevel: string
}

export type TravellerMapJsonpDebug = (message: string, details?: unknown) => void

export const compactTravellerMapValue = (value: unknown) => String(value ?? '').trim()

const unwrapTravellerMapWorld = (raw: Record<string, unknown>): Record<string, unknown> => {
  if (raw.World && typeof raw.World === 'object' && !Array.isArray(raw.World)) return raw.World as Record<string, unknown>
  return raw
}

const normalizeHex = (raw: Record<string, unknown>) => {
  const explicitHex = compactTravellerMapValue(raw.Hex ?? raw.hex)
  if (explicitHex) return explicitHex
  const hexX = Number(raw.HexX ?? raw.hexX)
  const hexY = Number(raw.HexY ?? raw.hexY)
  if (Number.isFinite(hexX) && Number.isFinite(hexY)) return `${String(hexX).padStart(2, '0')}${String(hexY).padStart(2, '0')}`
  return ''
}

export const normalizeTravellerMapWorld = (raw: Record<string, unknown>, fallbackSector = ''): NavigationWorld => {
  const world = unwrapTravellerMapWorld(raw)
  return {
    name: compactTravellerMapValue(world.Name ?? world.name ?? world.WorldName ?? world.worldName),
    sector: compactTravellerMapValue(world.Sector ?? world.sector ?? world.SectorName ?? world.sectorName ?? fallbackSector),
    hex: normalizeHex(world),
    uwp: compactTravellerMapValue(world.UWP ?? world.Uwp ?? world.uwp),
    bases: compactTravellerMapValue(world.Bases ?? world.bases),
    remarks: compactTravellerMapValue(world.Remarks ?? world.remarks),
    zone: compactTravellerMapValue(world.Zone ?? world.zone),
    pbg: compactTravellerMapValue(world.PBG ?? world.pbg),
    allegiance: compactTravellerMapValue(world.AllegianceName ?? world.allegianceName ?? world.Allegiance ?? world.allegiance),
    stellar: compactTravellerMapValue(world.Stellar ?? world.stellar),
    ix: compactTravellerMapValue(world.Ix ?? world.ix),
    ex: compactTravellerMapValue(world.Ex ?? world.ex),
    cx: compactTravellerMapValue(world.Cx ?? world.cx),
    worlds: compactTravellerMapValue(world.Worlds ?? world.worlds),
  }
}

export const normalizeTravellerMapCreditsWorld = (raw: Record<string, unknown>): NavigationWorld => ({
  name: compactTravellerMapValue(raw.WorldName),
  sector: compactTravellerMapValue(raw.SectorName),
  hex: compactTravellerMapValue(raw.WorldHex),
  uwp: compactTravellerMapValue(raw.WorldUwp),
  bases: '',
  remarks: compactTravellerMapValue(raw.WorldRemarks),
  zone: '',
  pbg: compactTravellerMapValue(raw.WorldPbg),
  allegiance: compactTravellerMapValue(raw.WorldAllegiance),
  stellar: '',
  ix: compactTravellerMapValue(raw.WorldIx),
  ex: compactTravellerMapValue(raw.WorldEx),
  cx: compactTravellerMapValue(raw.WorldCx),
  worlds: '',
})

export const normalizeTravellerMapSearchResult = (raw: Record<string, unknown>, index: number): SearchResult => {
  const world = normalizeTravellerMapWorld(raw)
  return {
    id: `${world.sector}-${world.hex}-${world.name}-${index}`,
    name: world.name || compactTravellerMapValue(raw.label ?? raw.Label ?? 'Unknown World'),
    sector: world.sector,
    hex: world.hex,
    uwp: world.uwp,
    remarks: world.remarks,
  }
}

export const parseTravellerMapRows = (payload: unknown): Record<string, unknown>[] => {
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

export const travellerMapJsonp = <T>(
  path: string,
  params: Record<string, string | number>,
  debug?: TravellerMapJsonpDebug,
) => {
  return new Promise<T>((resolve, reject) => {
    if (!import.meta.client) {
      reject(new Error('Traveller Map API is available in the browser.'))
      return
    }

    const callbackName = `scoutsuiteTravellerMap${Date.now()}${Math.random().toString(36).slice(2)}`
    const url = new URL(path, 'https://travellermap.com')
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)))
    url.searchParams.set('jsonp', callbackName)
    debug?.('request', { path, params, url: url.toString() })

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
      debug?.('response', { path, payload })
      resolve(payload)
    }
    script.onerror = () => {
      window.clearTimeout(timeout)
      cleanup()
      debug?.('request failed', { path, params })
      reject(new Error('Traveller Map request failed.'))
    }
    script.src = url.toString()
    document.body.appendChild(script)
  })
}

export const splitTravellerUwp = (uwp: string): SplitUwp | null => {
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
}

const extendedHexDigits = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'

export const travellerHexValue = (value: string) => {
  const normalized = value.toUpperCase()
  if (normalized === '?') return null
  const parsed = extendedHexDigits.indexOf(normalized)
  return parsed >= 0 ? parsed : null
}

const populationMagnitudes = [
  { exponent: 12, short: 'T', long: 'Trillion' },
  { exponent: 9, short: 'B', long: 'Billion' },
  { exponent: 6, short: 'M', long: 'Million' },
  { exponent: 3, short: 'K', long: 'Thousand' },
]

const formatPopulationNumber = (populationDigit: number, exponent: number) => {
  if (populationDigit <= 0) return { short: '0', long: 'None' }
  const value = populationDigit * 10 ** exponent
  const magnitude = populationMagnitudes.find((item) => value >= 10 ** item.exponent)
  if (!magnitude) return { short: `${value}`, long: `${value}` }
  const scaled = value / 10 ** magnitude.exponent
  const formatted = Number.isInteger(scaled) ? `${scaled}` : scaled.toFixed(1).replace(/\.0$/, '')
  return {
    short: `${formatted}${magnitude.short}`,
    long: `${formatted} ${magnitude.long}`,
  }
}

export const formatTravellerPopulation = (populationCode: string, pbg = '') => {
  const exponent = travellerHexValue(populationCode)
  if (exponent === null) return { short: populationCode, long: populationCode, detail: 'Unknown population' }

  const multiplierRaw = pbg.trim().charAt(0)
  const parsedMultiplier = Number.parseInt(multiplierRaw, 10)
  const multiplier = Number.isFinite(parsedMultiplier) && parsedMultiplier > 0 ? parsedMultiplier : 1
  const formatted = formatPopulationNumber(multiplier, exponent)
  return {
    short: formatted.short,
    long: formatted.long,
    detail: `${populationCode} · ${formatted.long}`,
  }
}

export const starportLabels: Record<string, string> = {
  A: 'Excellent',
  B: 'Good',
  C: 'Routine',
  D: 'Poor',
  E: 'Frontier',
  X: 'None',
  '?': 'Unknown',
}

export const atmosphereLabels: Record<string, string> = {
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

export const tradeCodeLabels: Record<string, string> = {
  Ag: 'Agricultural',
  An: 'Ancient Site',
  As: 'Asteroid',
  Ba: 'Barren',
  De: 'Desert',
  Fl: 'Fluid Oceans',
  Ga: 'Garden',
  Hi: 'High Population',
  Ht: 'High Technology',
  Ic: 'Ice-Capped',
  In: 'Industrial',
  Lo: 'Low Population',
  Lt: 'Low Technology',
  Na: 'Non-Agricultural',
  Ni: 'Non-Industrial',
  Po: 'Poor',
  Ri: 'Rich',
  Va: 'Vacuum',
  Wa: 'Water World',
}

export const groupTravellerTradeCodes = (codes: string[]) => {
  const readable = codes.map((code) => ({ code, label: tradeCodeLabels[code] ?? code }))
  return {
    economy: readable.filter((item) => ['Ag', 'In', 'Ni', 'Na', 'Po', 'Ri'].includes(item.code)),
    environment: readable.filter((item) => ['As', 'De', 'Fl', 'Ga', 'Ic', 'Va', 'Wa'].includes(item.code)),
    population: readable.filter((item) => ['Ba', 'Hi', 'Lo'].includes(item.code)),
    technology: readable.filter((item) => ['Ht', 'Lt'].includes(item.code)),
    other: readable.filter((item) => !['Ag', 'In', 'Ni', 'Na', 'Po', 'Ri', 'As', 'De', 'Fl', 'Ga', 'Ic', 'Va', 'Wa', 'Ba', 'Hi', 'Lo', 'Ht', 'Lt'].includes(item.code)),
  }
}

export const buildTravellerWorldAlerts = (world: NavigationWorld, split: SplitUwp | null) => {
  const alerts: Array<{ label: string; detail: string; tone: 'danger' | 'warn' | 'info' }> = []
  if (world.zone === 'R') alerts.push({ label: 'Red Zone', detail: 'Travel is heavily restricted or interdicted.', tone: 'danger' })
  if (world.zone === 'A') alerts.push({ label: 'Amber Zone', detail: 'Caution advised. Check local restrictions before arrival.', tone: 'warn' })
  if (!split) return alerts

  const atmosphere = travellerHexValue(split.atmosphere)
  const law = travellerHexValue(split.law)
  const techLevel = travellerHexValue(split.techLevel)
  const population = travellerHexValue(split.population)

  if (atmosphere !== null && (atmosphere <= 3 || atmosphere >= 10)) alerts.push({ label: 'Hostile Atmosphere', detail: 'Vacc suits, sealed habitats, or specialist equipment may be required.', tone: 'warn' })
  if (law !== null && law >= 9) alerts.push({ label: 'High Law', detail: 'Weapons, armour, and restricted goods are likely controlled.', tone: 'warn' })
  if (techLevel !== null && techLevel <= 5) alerts.push({ label: 'Low Tech', detail: 'Repairs, refined fuel, and advanced services may be limited.', tone: 'info' })
  if (population !== null && population <= 2) alerts.push({ label: 'Sparse Population', detail: 'Local infrastructure and emergency services may be minimal.', tone: 'info' })

  return alerts
}
