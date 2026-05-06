import coreCraftData from '~/data/traveller2e/craft/core-small-craft.json'
import highGuardCraftData from '~/data/traveller2e/craft/high-guard-small-craft.json'
import smallCraftCatalogueData from '~/data/traveller2e/craft/small-craft-catalogue.json'
import type { TravellerCraftRecord } from '~/types/craft'

const withSource = (
  records: Record<string, unknown>[],
  sourceId: TravellerCraftRecord['sourceId'],
  sourceName: string,
) => records.map((record) => ({
  sourceId,
  sourceName,
  ...record,
}) as TravellerCraftRecord)

export const allReferenceCraft = (): TravellerCraftRecord[] => [
  ...withSource(coreCraftData.craft, coreCraftData.sourceId as TravellerCraftRecord['sourceId'], coreCraftData.sourceName),
  ...withSource(highGuardCraftData.craft, highGuardCraftData.sourceId as TravellerCraftRecord['sourceId'], highGuardCraftData.sourceName),
  ...withSource(smallCraftCatalogueData.craft, smallCraftCatalogueData.sourceId as TravellerCraftRecord['sourceId'], smallCraftCatalogueData.sourceName),
]
