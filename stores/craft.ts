import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { TravellerCraftRecord } from '~/types/craft'
import { allReferenceCraft } from '~/utils/traveller/craft'

export type PlayerBuiltCraftPlaceholder = {
  id: string
  name: string
  status: 'planned'
  notes: string
}

export const useCraftStore = defineStore('craft', () => {
  const playerBuiltCraft = ref<PlayerBuiltCraftPlaceholder[]>([])
  const referenceCraft = computed<TravellerCraftRecord[]>(() => allReferenceCraft())

  return {
    playerBuiltCraft,
    referenceCraft,
  }
})
