import coreShipsData from '~/data/traveller2e/ships/core-ships.json'
import elementCruisersData from '~/data/traveller2e/ships/element-class-cruisers.json'
import highGuardShipsData from '~/data/traveller2e/ships/high-guard-ships.json'
import type { TravellerShipRecord } from '~/types/ship'

const withSource = (
  records: Record<string, unknown>[],
  sourceId: TravellerShipRecord['sourceId'],
  sourceName: string,
) => records.map((record) => ({
  sourceId,
  sourceName,
  ...record,
}) as TravellerShipRecord)

export const allReferenceShips = (): TravellerShipRecord[] => [
  ...withSource(coreShipsData.ships, coreShipsData.sourceId as TravellerShipRecord['sourceId'], coreShipsData.sourceName),
  ...withSource(highGuardShipsData.ships, highGuardShipsData.sourceId as TravellerShipRecord['sourceId'], highGuardShipsData.sourceName),
  ...withSource(elementCruisersData.ships, elementCruisersData.sourceId as TravellerShipRecord['sourceId'], elementCruisersData.sourceName),
]
