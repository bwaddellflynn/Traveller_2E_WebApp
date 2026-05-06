import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { TravellerRobotRecord } from '~/types/robot'
import { allReferenceRobots } from '~/utils/traveller/robots'

export type PlayerBuiltRobotPlaceholder = {
  id: string
  name: string
  status: 'planned'
  notes: string
}

export const useRobotsStore = defineStore('robots', () => {
  const playerBuiltRobots = ref<PlayerBuiltRobotPlaceholder[]>([])
  const referenceRobots = computed<TravellerRobotRecord[]>(() => allReferenceRobots())

  return {
    playerBuiltRobots,
    referenceRobots,
  }
})
