import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { CustomVehicleDesign, TravellerVehicleRecord } from '~/types/vehicle'
import { LOCAL_USER_ID } from '~/utils/traveller/profile'
import { allReferenceVehicles, cloneVehicle, createBlankCustomVehicle, normalizeCustomVehicleDesign } from '~/utils/traveller/vehicles'

const STORAGE_KEY = 'traveller2e.customVehicles.v1'

type StoredVehicleState = {
  activeUserId: string
  customVehicles: CustomVehicleDesign[]
}

const parseStoredState = (value: string | null): StoredVehicleState | null => {
  if (!value) return null

  try {
    const parsed = JSON.parse(value) as Partial<StoredVehicleState>
    if (!Array.isArray(parsed.customVehicles)) return null
    return {
      activeUserId: parsed.activeUserId || LOCAL_USER_ID,
      customVehicles: parsed.customVehicles as CustomVehicleDesign[],
    }
  }
  catch {
    return null
  }
}

export const useVehiclesStore = defineStore('vehicles', () => {
  const activeUserId = ref(LOCAL_USER_ID)
  const customVehicles = ref<CustomVehicleDesign[]>([])
  const loaded = ref(false)
  const referenceVehicles = computed<TravellerVehicleRecord[]>(() => allReferenceVehicles())
  const playerBuiltVehicles = computed(() => customVehicles.value
    .filter((vehicle) => vehicle.userId === activeUserId.value)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)))

  const loadVehicles = () => {
    if (loaded.value || !import.meta.client) return
    const stored = parseStoredState(window.localStorage.getItem(STORAGE_KEY))
    if (stored) {
      activeUserId.value = stored.activeUserId
      customVehicles.value = stored.customVehicles.map((vehicle) => normalizeCustomVehicleDesign(vehicle))
    }
    loaded.value = true
  }

  const persistVehicles = () => {
    if (!import.meta.client || !loaded.value) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      activeUserId: activeUserId.value,
      customVehicles: customVehicles.value,
    }))
  }

  if (import.meta.client) {
    loadVehicles()
    watch([activeUserId, customVehicles], persistVehicles, { deep: true })
  }

  const getCustomVehicle = (id: string) => customVehicles.value.find((vehicle) => vehicle.id === id) ?? null

  const createCustomVehicle = () => {
    loadVehicles()
    const vehicle = createBlankCustomVehicle(activeUserId.value)
    customVehicles.value = [vehicle, ...customVehicles.value]
    return vehicle
  }

  const saveCustomVehicle = (vehicle: CustomVehicleDesign) => {
    loadVehicles()
    const now = new Date().toISOString()
    const normalized = normalizeCustomVehicleDesign(cloneVehicle({
      ...vehicle,
      userId: vehicle.userId || activeUserId.value,
      sourceId: 'custom-player',
      sourceName: 'Custom Build',
      createdAt: vehicle.createdAt || now,
      updatedAt: now,
    }))
    const existingIndex = customVehicles.value.findIndex((item) => item.id === normalized.id)
    if (existingIndex === -1) {
      customVehicles.value = [normalized, ...customVehicles.value]
      return normalized
    }
    customVehicles.value = customVehicles.value.map((item, index) => index === existingIndex ? normalized : item)
    return normalized
  }

  const duplicateCustomVehicle = (id: string) => {
    const current = getCustomVehicle(id)
    if (!current) return null
    const copy = createBlankCustomVehicle(activeUserId.value)
    const now = new Date().toISOString()
    const duplicated = normalizeCustomVehicleDesign(cloneVehicle({
      ...current,
      id: copy.id,
      userId: activeUserId.value,
      name: `${current.name || 'Custom Vehicle'} Copy`,
      createdAt: now,
      updatedAt: now,
      sourceId: 'custom-player',
      sourceName: 'Custom Build',
    }))
    customVehicles.value = [duplicated, ...customVehicles.value]
    return duplicated
  }

  const deleteCustomVehicle = (id: string) => {
    customVehicles.value = customVehicles.value.filter((vehicle) => vehicle.id !== id)
  }

  return {
    activeUserId,
    referenceVehicles,
    playerBuiltVehicles,
    loadVehicles,
    getCustomVehicle,
    createCustomVehicle,
    saveCustomVehicle,
    duplicateCustomVehicle,
    deleteCustomVehicle,
  }
})
