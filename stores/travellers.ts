import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { TravellerProfile } from '~/types/traveller'
import { cloneTravellerProfile, createBlankTravellerProfile, LOCAL_USER_ID, makeProfileId, normalizeTravellerProfile } from '~/utils/traveller/profile'
import { travellerRepository } from '~/utils/traveller/repository'

export const useTravellersStore = defineStore('travellers', () => {
  const activeUserId = ref(LOCAL_USER_ID)
  const profiles = ref<TravellerProfile[]>([])
  const loaded = ref(false)
  let loadPromise: Promise<void> | null = null

  const loadProfiles = async () => {
    if (loaded.value) return
    if (loadPromise) return loadPromise

    loadPromise = travellerRepository.loadState().then((state) => {
      activeUserId.value = state.activeUserId || LOCAL_USER_ID
      profiles.value = state.profiles.map((profile) => normalizeTravellerProfile(profile, profile.source, state.activeUserId))
      loaded.value = true
    }).finally(() => {
      loadPromise = null
    })

    return loadPromise
  }

  const persistProfiles = async () => {
    if (!loaded.value) return

    await travellerRepository.saveState({
      activeUserId: activeUserId.value,
      profiles: profiles.value,
    })
  }

  const userProfiles = computed(() => profiles.value
    .filter((profile) => profile.userId === activeUserId.value)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)))

  const getProfile = (id: string) => profiles.value.find((profile) => profile.id === id) ?? null

  const createManualProfile = async () => {
    await loadProfiles()
    const profile = createBlankTravellerProfile('manual', activeUserId.value)
    profiles.value = [profile, ...profiles.value]
    await persistProfiles()
    return profile
  }

  const saveProfile = async (profile: TravellerProfile) => {
    await loadProfiles()
    const now = new Date().toISOString()
    const normalized = normalizeTravellerProfile({
      ...cloneTravellerProfile(profile),
      userId: profile.userId || activeUserId.value,
      updatedAt: now,
      createdAt: profile.createdAt || now,
    }, profile.source, activeUserId.value)
    const existingIndex = profiles.value.findIndex((item) => item.id === normalized.id)

    if (existingIndex === -1) {
      profiles.value = [normalized, ...profiles.value]
      await persistProfiles()
      return normalized
    }

    profiles.value = profiles.value.map((item, index) => index === existingIndex ? normalized : item)
    await persistProfiles()
    return normalized
  }

  const saveCreatorProfile = async (profile: TravellerProfile) => {
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

  const updateProfile = async (id: string, updater: (profile: TravellerProfile) => TravellerProfile) => {
    await loadProfiles()
    const current = getProfile(id)
    if (!current) return null

    return saveProfile(updater(cloneTravellerProfile(current)))
  }

  const deleteProfile = async (id: string) => {
    await loadProfiles()
    profiles.value = profiles.value.filter((profile) => profile.id !== id)
    await persistProfiles()
  }

  const duplicateProfile = async (id: string) => {
    await loadProfiles()
    const current = getProfile(id)
    if (!current) return null

    const now = new Date().toISOString()
    const copy = cloneTravellerProfile(current)
    copy.id = makeProfileId()
    copy.identity.name = `${copy.identity.name || 'Unnamed Traveller'} Copy`
    copy.createdAt = now
    copy.updatedAt = now
    copy.userId = activeUserId.value
    profiles.value = [normalizeTravellerProfile(copy, copy.source, activeUserId.value), ...profiles.value]
    await persistProfiles()
    return copy
  }

  if (import.meta.client) {
    void loadProfiles()
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
