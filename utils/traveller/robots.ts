import robotHandbookData from '~/data/traveller2e/robots/robot-handbook-robots.json'
import type { TravellerRobotRecord } from '~/types/robot'

const withSource = (
  records: Record<string, unknown>[],
  sourceId: TravellerRobotRecord['sourceId'],
  sourceName: string,
) => records.map((record) => ({
  sourceId,
  sourceName,
  ...record,
}) as TravellerRobotRecord)

export const allReferenceRobots = (): TravellerRobotRecord[] => [
  ...withSource(
    robotHandbookData.robots,
    robotHandbookData.sourceId as TravellerRobotRecord['sourceId'],
    robotHandbookData.sourceName,
  ),
]
