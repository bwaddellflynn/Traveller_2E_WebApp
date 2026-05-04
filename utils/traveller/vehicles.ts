import coreVehiclesData from '~/data/traveller2e/vehicles/core-vehicles.json'
import fieldCatalogueVehiclesData from '~/data/traveller2e/vehicles/field-catalogue-vehicles.json'
import vehicleHandbookData from '~/data/traveller2e/vehicles/vehicle-handbook-vehicles.json'
import type { TravellerVehicleRecord } from '~/types/vehicle'

const withSource = (
  records: Record<string, unknown>[],
  sourceId: TravellerVehicleRecord['sourceId'],
  sourceName: string,
) => records.map((record) => ({
  sourceId,
  sourceName,
  ...record,
}) as TravellerVehicleRecord)

const sourcePriority: Record<string, number> = {
  'mgt2e-vehicle-handbook': 4,
  'mgt2e-field-catalogue': 3,
  'mgt2e-mercenary-vehicle-recognition-cards': 3,
  'mgt2e-csc': 2,
  'mgt2e-core-2022': 1,
}

const normalizeVehicleFamilyName = (name: string) => {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/\b(tl|tech level)\s*\d+\b/g, '')
    .replace(/^the\s+/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export const allReferenceVehicleVariants = (): TravellerVehicleRecord[] => [
  ...withSource(
    coreVehiclesData.vehicles,
    coreVehiclesData.sourceId as TravellerVehicleRecord['sourceId'],
    coreVehiclesData.sourceName,
  ),
  ...withSource(
    fieldCatalogueVehiclesData.vehicles,
    fieldCatalogueVehiclesData.sourceId as TravellerVehicleRecord['sourceId'],
    fieldCatalogueVehiclesData.sourceName,
  ),
  ...withSource(
    vehicleHandbookData.vehicles,
    vehicleHandbookData.sourceId as TravellerVehicleRecord['sourceId'],
    vehicleHandbookData.sourceName,
  ),
]

export const allReferenceVehicles = (): TravellerVehicleRecord[] => {
  const variants = allReferenceVehicleVariants()
  const highestPriorityByFamily = new Map<string, number>()

  for (const vehicle of variants) {
    const family = normalizeVehicleFamilyName(vehicle.name)
    const priority = sourcePriority[vehicle.sourceId] ?? 0
    highestPriorityByFamily.set(family, Math.max(highestPriorityByFamily.get(family) ?? 0, priority))
  }

  return variants.filter((vehicle) => {
    const family = normalizeVehicleFamilyName(vehicle.name)
    const priority = sourcePriority[vehicle.sourceId] ?? 0
    return priority === highestPriorityByFamily.get(family)
  })
}
