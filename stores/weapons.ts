import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { CustomWeaponDesign } from '~/types/weapon'
import { allReferenceWeapons, cloneWeapon, createBlankCustomWeapon, makeWeaponId, resolveWeaponFamily, resolveWeaponFamilyIcon } from '~/utils/traveller/weapons'
import { allReferenceArmor, allReferenceEquipment } from '~/utils/traveller/armory'
import { LOCAL_USER_ID } from '~/utils/traveller/profile'

const STORAGE_KEY = 'traveller2e.customWeapons.v1'

type StoredWeaponState = {
  activeUserId: string
  customWeapons: CustomWeaponDesign[]
}

const parseStoredState = (value: string | null): StoredWeaponState | null => {
  if (!value) return null

  try {
    const parsed = JSON.parse(value) as Partial<StoredWeaponState>
    if (!Array.isArray(parsed.customWeapons)) return null
    return {
      activeUserId: parsed.activeUserId || LOCAL_USER_ID,
      customWeapons: parsed.customWeapons,
    }
  } catch {
    return null
  }
}

export const useWeaponsStore = defineStore('weapons', () => {
  const activeUserId = ref(LOCAL_USER_ID)
  const customWeapons = ref<CustomWeaponDesign[]>([])
  const loaded = ref(false)
  const referenceWeapons = computed(() => allReferenceWeapons())
  const referenceArmor = computed(() => allReferenceArmor())
  const referenceEquipment = computed(() => allReferenceEquipment())
  const userWeapons = computed(() => customWeapons.value
    .filter((weapon) => weapon.userId === activeUserId.value)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)))

  const loadWeapons = () => {
    if (loaded.value || !import.meta.client) return
    const stored = parseStoredState(window.localStorage.getItem(STORAGE_KEY))
    if (stored) {
      activeUserId.value = stored.activeUserId
      customWeapons.value = stored.customWeapons
    }
    loaded.value = true
  }

  const persistWeapons = () => {
    if (!import.meta.client || !loaded.value) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      activeUserId: activeUserId.value,
      customWeapons: customWeapons.value,
    }))
  }

  if (import.meta.client) {
    loadWeapons()
    watch([activeUserId, customWeapons], persistWeapons, { deep: true })
  }

  const getCustomWeapon = (id: string) => customWeapons.value.find((weapon) => weapon.id === id) ?? null

  const createCustomWeapon = () => {
    loadWeapons()
    const weapon = createBlankCustomWeapon(activeUserId.value)
    customWeapons.value = [weapon, ...customWeapons.value]
    return weapon
  }

  const saveCustomWeapon = (weapon: CustomWeaponDesign) => {
    loadWeapons()
    const now = new Date().toISOString()
    const normalized = cloneWeapon({
      ...weapon,
      family: weapon.family ?? resolveWeaponFamily(weapon),
      iconName: weapon.iconName ?? resolveWeaponFamilyIcon(weapon.family ?? resolveWeaponFamily(weapon)),
      userId: weapon.userId || activeUserId.value,
      createdAt: weapon.createdAt || now,
      updatedAt: now,
      design: {
        ...weapon.design,
        targetTechLevel: weapon.design?.targetTechLevel ?? weapon.techLevel ?? 8,
        mechanism: weapon.design?.mechanism || 'semi-automatic',
        receiverFeatures: weapon.design?.receiverFeatures ?? [],
        specialAmmunition: weapon.design?.specialAmmunition ?? '',
        capacityModifierPercent: weapon.design?.capacityModifierPercent ?? 0,
        heavyBarrel: weapon.design?.heavyBarrel ?? false,
      },
    })
    const existingIndex = customWeapons.value.findIndex((item) => item.id === normalized.id)
    if (existingIndex === -1) {
      customWeapons.value = [normalized, ...customWeapons.value]
      return normalized
    }
    customWeapons.value = customWeapons.value.map((item, index) => index === existingIndex ? normalized : item)
    return normalized
  }

  const duplicateCustomWeapon = (id: string) => {
    const current = getCustomWeapon(id)
    if (!current) return null
    const now = new Date().toISOString()
    const copy = cloneWeapon(current)
    copy.id = makeWeaponId()
    copy.name = `${copy.name || 'Custom Weapon'} Copy`
    copy.createdAt = now
    copy.updatedAt = now
    customWeapons.value = [copy, ...customWeapons.value]
    return copy
  }

  const deleteCustomWeapon = (id: string) => {
    customWeapons.value = customWeapons.value.filter((weapon) => weapon.id !== id)
  }

  return {
    activeUserId,
    referenceWeapons,
    referenceArmor,
    referenceEquipment,
    customWeapons,
    userWeapons,
    loadWeapons,
    getCustomWeapon,
    createCustomWeapon,
    saveCustomWeapon,
    duplicateCustomWeapon,
    deleteCustomWeapon,
  }
})
