import wheeledVehicleSvgRaw from '~/assets/vehicle_builder/ground_vehicles/ground_vehicles_wheeled/SciFi_Car_Silhouette.svg?raw'
import type { TravellerVehicleBaseFamily } from '~/types/vehicle'

type VehicleSilhouetteKind = '' | TravellerVehicleBaseFamily | 'wheeled' | 'tracked' | 'rail' | 'monowheel' | 'tunneller' | 'hydrofoil' | 'floats' | 'aerodyne' | 'ornithopter' | 'walker-multi' | 'open-frame' | 'open-topped'

const vehicleBuilderSvgModules = import.meta.glob('../assets/vehicle_builder/**/*.svg', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

const svgEntries = Object.entries(vehicleBuilderSvgModules)

const findSvgByPath = (...segments: string[]) => svgEntries.find(([path]) => segments.every((segment) => path.includes(segment)))?.[1]

const vehicleSvgByKind: Partial<Record<VehicleSilhouetteKind, string>> = {
  aeroplane: findSvgByPath('/aeroplane_vehicles/'),
  airship: findSvgByPath('/airship_vehicles/'),
  'grav-vehicle': findSvgByPath('/grav_vehicles/'),
  'ground-vehicle': findSvgByPath('/ground_vehicles_wheeled/'),
  hovercraft: findSvgByPath('/hovercraft_vehicles/'),
  rotorcraft: findSvgByPath('/rotorcraft_vehicles/'),
  structure: findSvgByPath('/structure_vehicles/') ?? findSvgByPath('/stucture_vehicles/'),
  submersible: findSvgByPath('/submersible_vehicles/'),
  walker: findSvgByPath('/ground_vehicles_walker_biped/'),
  watercraft: findSvgByPath('/watercraft_vehicles/'),
  wheeled: findSvgByPath('/ground_vehicles_wheeled/'),
}

const fallbackKindByVisual: Partial<Record<VehicleSilhouetteKind, VehicleSilhouetteKind>> = {
  tracked: 'ground-vehicle',
  rail: 'ground-vehicle',
  monowheel: 'ground-vehicle',
  tunneller: 'ground-vehicle',
  hydrofoil: 'watercraft',
  floats: 'watercraft',
  aerodyne: 'rotorcraft',
  ornithopter: 'rotorcraft',
  'walker-multi': 'walker',
  'open-frame': 'ground-vehicle',
  'open-topped': 'ground-vehicle',
}

const resolvedKind = (kind: VehicleSilhouetteKind): VehicleSilhouetteKind => {
  if (vehicleSvgByKind[kind]) return kind
  const fallback = fallbackKindByVisual[kind]
  if (fallback && vehicleSvgByKind[fallback]) return fallback
  return 'ground-vehicle'
}

const stripSvgChrome = (svgMarkup: string) => (
  svgMarkup
    .replace(/<\?xml[\s\S]*?\?>/i, '')
    .replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<desc>[\s\S]*?<\/desc>/gi, '')
    .replace(/<rect[^>]*width="100%"[^>]*height="100%"[^>]*fill="white"[^>]*\/>/gi, '')
)

const applySilhouetteStyling = (svgMarkup: string, idPrefix: string) => {
  const defsAndStyle = `
<defs>
  <linearGradient id="${idPrefix}-vehicle-fill" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#14324a" stop-opacity="0.96" />
    <stop offset="48%" stop-color="#0c2438" stop-opacity="0.92" />
    <stop offset="100%" stop-color="#071525" stop-opacity="0.96" />
  </linearGradient>
  <linearGradient id="${idPrefix}-vehicle-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#d9fbff" stop-opacity="0.72" />
    <stop offset="58%" stop-color="#67e8f9" stop-opacity="0.48" />
    <stop offset="100%" stop-color="#0891b2" stop-opacity="0.28" />
  </linearGradient>
  <filter id="${idPrefix}-vehicle-glow" x="-24%" y="-24%" width="148%" height="148%" color-interpolation-filters="sRGB">
    <feDropShadow dx="0" dy="0" stdDeviation="2.8" flood-color="#d9fbff" flood-opacity="0.58" />
    <feDropShadow dx="0" dy="0" stdDeviation="7" flood-color="#67e8f9" flood-opacity="0.34" />
    <feDropShadow dx="0" dy="0" stdDeviation="15" flood-color="#0891b2" flood-opacity="0.22" />
  </filter>
</defs>
<style>
  svg {
    background: transparent !important;
  }
  path,
  polygon,
  polyline,
  circle,
  ellipse,
  line,
  rect {
    fill: url(#${idPrefix}-vehicle-fill) !important;
    stroke: url(#${idPrefix}-vehicle-stroke) !important;
    stroke-width: 5.5 !important;
    filter: url(#${idPrefix}-vehicle-glow);
    vector-effect: non-scaling-stroke;
    paint-order: stroke fill;
  }
</style>`

  const cleanedSvgMarkup = stripSvgChrome(svgMarkup)
  const withStyle = cleanedSvgMarkup.includes('<style>')
    ? cleanedSvgMarkup.replace(/<style>[\s\S]*?<\/style>/i, defsAndStyle)
    : cleanedSvgMarkup.replace(/<svg([^>]*)>/i, `<svg$1>${defsAndStyle}`)

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(withStyle)}`
}

export const vehicleSilhouetteSource = (kind: VehicleSilhouetteKind) => {
  const silhouetteKind = resolvedKind(kind)
  const svgMarkup = vehicleSvgByKind[silhouetteKind] ?? wheeledVehicleSvgRaw
  return applySilhouetteStyling(svgMarkup, `vehicle-builder-${silhouetteKind}`)
}

export const vehicleSilhouetteImageClass = (kind: VehicleSilhouetteKind) => {
  const silhouetteKind = resolvedKind(kind)
  if (silhouetteKind === 'walker') return 'max-h-[24rem] w-[42rem]'
  if (silhouetteKind === 'airship') return 'max-h-[20rem] w-[38rem]'
  if (silhouetteKind === 'structure') return 'max-h-[19rem] w-[33rem]'
  if (silhouetteKind === 'watercraft') return 'max-h-[27rem] w-[50rem] -translate-y-1'
  if (silhouetteKind === 'hovercraft') return 'max-h-[20rem] w-[36rem] translate-y-6'
  if (silhouetteKind === 'ground-vehicle') return 'max-h-[19rem] w-[34rem] -translate-y-1'
  return 'max-h-[20rem] w-[36rem]'
}

export const vehicleSilhouetteKindForFeature = (featureName: string, baseFamily: '' | TravellerVehicleBaseFamily): VehicleSilhouetteKind => {
  if (featureName === 'Multi-Legged') return 'walker-multi'
  if (featureName === 'Tracks') return 'tracked'
  if (featureName === 'Rail Rider') return 'rail'
  if (featureName === 'Monowheel') return 'monowheel'
  if (featureName === 'Tunneller') return 'tunneller'
  if (featureName === 'Hydrofoil') return 'hydrofoil'
  if (featureName === 'Floats') return 'floats'
  if (featureName === 'Aerodyne') return 'aerodyne'
  if (featureName === 'Ornithopter') return 'ornithopter'
  if (featureName === 'Open Frame') return 'open-frame'
  if (featureName === 'Open-Topped') return 'open-topped'
  return baseFamily
}

export const hasVehicleSilhouetteAsset = (kind: VehicleSilhouetteKind) => Boolean(vehicleSvgByKind[resolvedKind(kind)])

export const hasWalkerSilhouetteAsset = () => Boolean(vehicleSvgByKind.walker)
