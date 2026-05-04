import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { TravellerVehicleRecord } from '~/types/vehicle'
import { allReferenceVehicles } from '~/utils/traveller/vehicles'

export type PlayerBuiltVehiclePlaceholder = {
  id: string
  name: string
  status: 'planned'
  notes: string
}

export const useVehiclesStore = defineStore('vehicles', () => {
  const playerBuiltVehicles = ref<PlayerBuiltVehiclePlaceholder[]>([])
  const referenceVehicles = computed<TravellerVehicleRecord[]>(() => allReferenceVehicles())

  return {
    referenceVehicles,
    playerBuiltVehicles,
  }
})
