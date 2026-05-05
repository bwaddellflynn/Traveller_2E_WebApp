import type { TravellerProfile } from '~/types/traveller'
import { LOCAL_USER_ID, cloneTravellerProfile, normalizeTravellerProfile } from '~/utils/traveller/profile'

const STORAGE_KEY = 'traveller2e.profiles.v1'

export type StoredTravellerState = {
  activeUserId: string
  profiles: TravellerProfile[]
}

export type TravellerRepository = {
  loadState(): Promise<StoredTravellerState>
  saveState(state: StoredTravellerState): Promise<void>
}

const parseStoredState = (value: string | null): StoredTravellerState | null => {
  if (!value) return null

  try {
    const parsed = JSON.parse(value) as Partial<StoredTravellerState>
    const profiles = Array.isArray(parsed.profiles)
      ? parsed.profiles.map((profile) => normalizeTravellerProfile(profile, 'manual', parsed.activeUserId || LOCAL_USER_ID))
      : []

    return {
      activeUserId: parsed.activeUserId || LOCAL_USER_ID,
      profiles,
    }
  } catch {
    return null
  }
}

export const createLocalStorageTravellerRepository = (): TravellerRepository => ({
  async loadState() {
    if (!import.meta.client) {
      return {
        activeUserId: LOCAL_USER_ID,
        profiles: [],
      }
    }

    return parseStoredState(window.localStorage.getItem(STORAGE_KEY)) ?? {
      activeUserId: LOCAL_USER_ID,
      profiles: [],
    }
  },

  async saveState(state) {
    if (!import.meta.client) return

    const payload: StoredTravellerState = {
      activeUserId: state.activeUserId || LOCAL_USER_ID,
      profiles: state.profiles.map((profile) => cloneTravellerProfile(normalizeTravellerProfile(profile, profile.source, state.activeUserId))),
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  },
})

export const travellerRepository = createLocalStorageTravellerRepository()
