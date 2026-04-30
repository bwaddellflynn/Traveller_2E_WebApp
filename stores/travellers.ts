import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { TravellerProfile } from '~/types/traveller'
import { cloneTravellerProfile, createBlankTravellerProfile, LOCAL_USER_ID, makeProfileId } from '~/utils/traveller/profile'

const STORAGE_KEY = 'traveller2e.profiles.v1'

type StoredTravellerState = {
  activeUserId: string
  profiles: TravellerProfile[]
}

const parseStoredState = (value: string | null): StoredTravellerState | null => {
  if (!value) return null

  try {
    const parsed = JSON.parse(value) as Partial<StoredTravellerState>
    if (!Array.isArray(parsed.profiles)) return null

    return {
      activeUserId: parsed.activeUserId || LOCAL_USER_ID,
      profiles: parsed.profiles,
    }
  } catch {
    return null
  }
}

export const useTravellersStore = defineStore('travellers', () => {
  const activeUserId = ref(LOCAL_USER_ID)
  const profiles = ref<TravellerProfile[]>([])
  const loaded = ref(false)

  const loadProfiles = () => {
    if (loaded.value || !import.meta.client) return

    const stored = parseStoredState(window.localStorage.getItem(STORAGE_KEY))
    if (stored) {
      activeUserId.value = stored.activeUserId
      profiles.value = stored.profiles
    }

    loaded.value = true
  }

  const persistProfiles = () => {
    if (!import.meta.client || !loaded.value) return

    const payload: StoredTravellerState = {
      activeUserId: activeUserId.value,
      profiles: profiles.value,
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }

  if (import.meta.client) {
    loadProfiles()
    watch([activeUserId, profiles], persistProfiles, { deep: true })
  }

  const userProfiles = computed(() => profiles.value
    .filter((profile) => profile.userId === activeUserId.value)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)))

  const getProfile = (id: string) => profiles.value.find((profile) => profile.id === id) ?? null

  const createManualProfile = () => {
    loadProfiles()
    const profile = createBlankTravellerProfile('manual', activeUserId.value)
    profiles.value = [profile, ...profiles.value]
    return profile
  }

  const saveProfile = (profile: TravellerProfile) => {
    loadProfiles()
    const now = new Date().toISOString()
    const normalized = cloneTravellerProfile({
      ...profile,
      userId: profile.userId || activeUserId.value,
      updatedAt: now,
      createdAt: profile.createdAt || now,
    })
    const existingIndex = profiles.value.findIndex((item) => item.id === normalized.id)

    if (existingIndex === -1) {
      profiles.value = [normalized, ...profiles.value]
      return normalized
    }

    profiles.value = profiles.value.map((item, index) => index === existingIndex ? normalized : item)
    return normalized
  }

  const saveCreatorProfile = (profile: TravellerProfile) => {
    return saveProfile({
      ...profile,
      userId: activeUserId.value,
      source: 'lifepath',
      metadata: {
        ...profile.metadata,
        creatorComplete: true,
      },
    })
  }

  const updateProfile = (id: string, updater: (profile: TravellerProfile) => TravellerProfile) => {
    loadProfiles()
    const current = getProfile(id)
    if (!current) return null

    return saveProfile(updater(cloneTravellerProfile(current)))
  }

  const deleteProfile = (id: string) => {
    loadProfiles()
    profiles.value = profiles.value.filter((profile) => profile.id !== id)
  }

  const duplicateProfile = (id: string) => {
    loadProfiles()
    const current = getProfile(id)
    if (!current) return null

    const now = new Date().toISOString()
    const copy = cloneTravellerProfile(current)
    copy.id = makeProfileId()
    copy.identity.name = `${copy.identity.name || 'Unnamed Traveller'} Copy`
    copy.createdAt = now
    copy.updatedAt = now
    copy.userId = activeUserId.value
    profiles.value = [copy, ...profiles.value]
    return copy
  }

  return {
    activeUserId,
    profiles,
    userProfiles,
    loadProfiles,
    getProfile,
    createManualProfile,
    saveProfile,
    saveCreatorProfile,
    updateProfile,
    deleteProfile,
    duplicateProfile,
  }
})
