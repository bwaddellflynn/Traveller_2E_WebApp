import coreArmorData from '~/data/traveller2e/armory/core-armor.json'
import cscArmorData from '~/data/traveller2e/armory/central-supply-catalogue-armor.json'
import fieldArmorData from '~/data/traveller2e/armory/field-catalogue-armor.json'
import coreEquipmentData from '~/data/traveller2e/armory/core-equipment.json'
import cscEquipmentData from '~/data/traveller2e/armory/central-supply-catalogue-equipment.json'
import fieldEquipmentData from '~/data/traveller2e/armory/field-catalogue-equipment.json'
import type { TravellerArmorRecord, TravellerEquipmentRecord } from '~/types/armory'

const withSource = <T extends { sourceId: string; sourceName?: string }>(
  records: Record<string, unknown>[],
  sourceId: T['sourceId'],
  sourceName: string,
) => records.map((record) => ({ ...record, sourceId, sourceName }) as T)

const sourcePriority: Record<string, number> = {
  'mgt2e-field-catalogue': 3,
  'mgt2e-csc': 2,
  'mgt2e-core-2022': 1,
}

const normalizeArmorFamilyName = (name: string) => {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/\b(tl|tech level)\s*\d+\b/g, '')
    .replace(/,\s*(basic|improved|advanced)$/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const allReferenceArmorVariants = (): TravellerArmorRecord[] => [
  ...withSource<TravellerArmorRecord>(coreArmorData.armor, coreArmorData.sourceId, coreArmorData.sourceName),
  ...withSource<TravellerArmorRecord>(cscArmorData.armor, cscArmorData.sourceId, cscArmorData.sourceName),
  ...withSource<TravellerArmorRecord>(fieldArmorData.armor, fieldArmorData.sourceId, fieldArmorData.sourceName),
]

export const allReferenceArmor = (): TravellerArmorRecord[] => {
  const variants = allReferenceArmorVariants()
  const highestPriorityByFamily = new Map<string, number>()

  for (const armor of variants) {
    const family = normalizeArmorFamilyName(armor.name)
    const priority = sourcePriority[armor.sourceId] ?? 0
    highestPriorityByFamily.set(family, Math.max(highestPriorityByFamily.get(family) ?? 0, priority))
  }

  return variants.filter((armor) => {
    const family = normalizeArmorFamilyName(armor.name)
    const priority = sourcePriority[armor.sourceId] ?? 0
    return priority === highestPriorityByFamily.get(family)
  })
}

export const allReferenceEquipment = (): TravellerEquipmentRecord[] => [
  ...withSource<TravellerEquipmentRecord>(coreEquipmentData.equipment, coreEquipmentData.sourceId, coreEquipmentData.sourceName),
  ...withSource<TravellerEquipmentRecord>(cscEquipmentData.equipment, cscEquipmentData.sourceId, cscEquipmentData.sourceName),
  ...withSource<TravellerEquipmentRecord>(fieldEquipmentData.equipment, fieldEquipmentData.sourceId, fieldEquipmentData.sourceName),
]
