import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { TravellerShipRecord } from '~/types/ship'
import { allReferenceShips } from '~/utils/traveller/ships'

export type CustomShipPlaceholder = {
  id: string
  name: string
  status: 'planned'
  notes: string
}

export const useShipsStore = defineStore('ships', () => {
  const customShips = ref<CustomShipPlaceholder[]>([])
  const referenceShips = computed<TravellerShipRecord[]>(() => allReferenceShips())

  return {
    customShips,
    referenceShips,
  }
})
