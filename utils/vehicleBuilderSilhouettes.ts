import wheeledVehicleSvgRaw from '~/assets/vehicle_builder/ground_vehicles/ground_vehicles_wheeled/SciFi_Car_Silhouette.svg?raw'

type VehicleSilhouetteKind = 'wheeled' | 'walker'

const vehicleBuilderSvgModules = import.meta.glob('../assets/vehicle_builder/**/*.svg', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

const walkerSvgRaw = Object.entries(vehicleBuilderSvgModules).find(([path]) => (
  path.includes('/ground_vehicles_walker_biped/')
))?.[1]

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
  const svgMarkup = kind === 'walker' && walkerSvgRaw ? walkerSvgRaw : wheeledVehicleSvgRaw
  return applySilhouetteStyling(svgMarkup, `vehicle-builder-${kind}`)
}

export const hasWalkerSilhouetteAsset = () => Boolean(walkerSvgRaw)
