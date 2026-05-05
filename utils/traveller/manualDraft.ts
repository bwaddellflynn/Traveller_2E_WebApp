import { loadBuilderDraft, loadDraftPointer } from '~/utils/traveller/draftCache'
import type { TravellerProfile } from '~/types/traveller'

export const MANUAL_TRAVELLER_DRAFT_CACHE_VERSION = 1
export const MANUAL_TRAVELLER_ACTIVE_DRAFT_POINTER_KEY = 'scoutsuite.builder.manualTraveller.active.v1'

export const manualTravellerDraftCacheKey = (key: string) => `scoutsuite.builder.manualTraveller.${key || 'new'}.v1`

export const loadActiveManualTravellerDraftId = () => {
  const draftId = loadDraftPointer(MANUAL_TRAVELLER_ACTIVE_DRAFT_POINTER_KEY)
  if (!draftId) return null

  const cachedDraft = loadBuilderDraft<TravellerProfile>(
    manualTravellerDraftCacheKey(draftId),
    MANUAL_TRAVELLER_DRAFT_CACHE_VERSION,
  )

  return cachedDraft ? draftId : null
}
