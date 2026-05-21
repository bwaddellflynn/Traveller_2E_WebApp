<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { TravellerProfile } from '~/types/traveller'
import { useTravellersStore } from '~/stores/travellers'
import { loadBuilderDraftCache } from '~/utils/traveller/draftCache'
import { makeProfileId } from '~/utils/traveller/profile'
import { loadActiveManualTravellerDraftId, MANUAL_TRAVELLER_DRAFT_CACHE_VERSION, manualTravellerDraftCacheKey } from '~/utils/traveller/manualDraft'

const travellers = useTravellersStore()
const { userProfiles, activeProfileId, activeProfile } = storeToRefs(travellers)
const mobileProfilesExpanded = ref(false)
const route = useRoute()
const router = useRouter()
const pendingDeleteProfileId = ref<string | null>(null)
const activeSheetRouteId = computed(() => typeof route.query.id === 'string' ? route.query.id : '')
const activeSheetDraftId = computed(() => typeof route.query.draft === 'string' ? route.query.draft : '')

onMounted(async () => {
  await travellers.loadProfiles()
})

const travellerShipAssignment = (profile: TravellerProfile) => {
  const metadata = profile.metadata as TravellerProfile['metadata'] & {
    assignedShipName?: string
    shipName?: string
    crewShipName?: string
  }

  return metadata.assignedShipName || metadata.crewShipName || metadata.shipName || 'No assigned ship'
}

const openNewManualTraveller = async () => {
  const activeDraftId = loadActiveManualTravellerDraftId()
  await router.push({
    path: '/character/sheet',
    query: { draft: activeDraftId || makeProfileId() },
  })
}

const openTraveller = async (profileId: string) => {
  await travellers.setActiveProfile(profileId)
  await router.push(`/character/sheet?id=${profileId}`)
}

const clearActiveTraveller = async () => {
  await travellers.clearActiveProfile()
}

const formatCredits = (credits: number) => credits.toLocaleString()

const activeSheetDraftProfile = computed(() => {
  if (route.path !== '/character/sheet') return null
  const cacheId = activeSheetRouteId.value || activeSheetDraftId.value
  if (!cacheId) return null
  const cachedDraft = loadBuilderDraftCache<TravellerProfile>(
    manualTravellerDraftCacheKey(cacheId),
    MANUAL_TRAVELLER_DRAFT_CACHE_VERSION,
  )
  if (!cachedDraft) return null

  const savedProfile = activeSheetRouteId.value ? travellers.getProfile(activeSheetRouteId.value) : null
  const profileUpdatedAt = Date.parse(savedProfile?.updatedAt || '')
  const draftUpdatedAt = Date.parse(cachedDraft.updatedAt || '')
  if (savedProfile && Number.isFinite(profileUpdatedAt) && Number.isFinite(draftUpdatedAt) && draftUpdatedAt < profileUpdatedAt) return null

  return cachedDraft.payload
})

const displayedCredits = computed(() => {
  if (
    activeProfile.value
    && activeSheetRouteId.value
    && activeProfile.value.id === activeSheetRouteId.value
    && activeSheetDraftProfile.value
  ) {
    return Number(activeSheetDraftProfile.value.finances.cashOnHand) || 0
  }

  return Number(activeProfile.value?.finances.cashOnHand) || 0
})

const requestDeleteProfile = (profileId: string) => {
  pendingDeleteProfileId.value = profileId
}

const cancelDeleteProfile = () => {
  pendingDeleteProfileId.value = null
}

const confirmDeleteProfile = async (profileId: string) => {
  await travellers.deleteProfile(profileId)
  if (typeof route.query.id === 'string' && route.query.id === profileId) {
    await router.push('/')
  }
  pendingDeleteProfileId.value = null
}
</script>

<template>
  <aside :class="['travellers-side-nav hud-scrollbar', mobileProfilesExpanded ? 'is-mobile-expanded' : '']">
    <div class="flex items-center justify-between gap-3 px-4 py-4">
      <div>
        <h2 class="text-xl font-semibold">Travellers</h2>
      </div>
      <button
        class="travellers-mobile-toggle hud-link h-10 w-10"
        :aria-expanded="mobileProfilesExpanded"
        aria-label="Toggle Traveller profiles"
        title="Toggle Traveller profiles"
        type="button"
        @click="mobileProfilesExpanded = !mobileProfilesExpanded"
      >
        <span class="travellers-mobile-toggle__chevron" aria-hidden="true" />
      </button>
    </div>

    <div class="travellers-utility-row px-4 pb-4">
      <div
        v-if="activeProfile"
        class="travellers-credits-chip"
        :title="`${activeProfile.identity.name || 'Traveller'} credits`"
      >
        <span class="travellers-credits-chip__value">{{ formatCredits(displayedCredits) }}</span>
        <GalacticCreditsIcon class="travellers-credits-chip__symbol" />
      </div>
      <button
        v-if="activeProfile"
        aria-label="Leave Current Traveller"
        class="travellers-utility-button travellers-utility-button--leave hud-link h-10 w-10"
        title="Leave Current Traveller"
        type="button"
        @click="clearActiveTraveller"
      >
        <AppIcon class="travellers-utility-button__leave-icon" name="export" />
      </button>
      <button
        aria-label="Create a manually entered Traveller"
        class="travellers-utility-button travellers-utility-button--new hud-link h-10 w-10"
        title="Create a manually entered Traveller"
        type="button"
        @click="openNewManualTraveller"
      >
        <AppIcon name="plus" />
      </button>
    </div>

    <div class="travellers-mobile-collapsible">
      <nav v-if="userProfiles.length" class="grid gap-1 px-2 pb-3">
        <div
          v-for="profile in userProfiles"
          :key="profile.id"
          class="traveller-nav-entry group relative"
        >
          <button
            class="traveller-nav-link"
            :class="{ 'traveller-nav-link--active': activeProfileId === profile.id }"
            type="button"
            @click="openTraveller(profile.id)"
          >
            <span class="block font-semibold">{{ profile.identity.name || 'Unnamed Traveller' }}</span>
            <span class="mt-1 block text-xs">{{ travellerShipAssignment(profile) }}</span>
          </button>
          <button
            aria-label="Delete Traveller"
            class="traveller-nav-delete hud-link h-5 w-5"
            title="Delete Traveller"
            type="button"
            @click.stop="requestDeleteProfile(profile.id)"
          >
            <AppIcon name="close" />
          </button>
          <div
            v-if="pendingDeleteProfileId === profile.id"
            class="traveller-nav-confirm"
          >
            <p class="traveller-nav-confirm__text">Delete traveller?</p>
            <div class="traveller-nav-confirm__actions">
              <button class="traveller-nav-confirm__button" type="button" @click.stop="cancelDeleteProfile">
                Cancel
              </button>
              <button class="traveller-nav-confirm__button traveller-nav-confirm__button--danger" type="button" @click.stop="confirmDeleteProfile(profile.id)">
                Delete
              </button>
            </div>
          </div>
        </div>
      </nav>

      <p v-else class="mx-2 mb-3 rounded-md border border-cyan-400/25 bg-slate-950/50 p-3 text-sm">
        No saved Travellers yet.
      </p>

      <div class="travellers-action-row border-t border-cyan-400/20 px-2 py-3">
        <NuxtLink class="hud-link flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold" to="/character/create">
          <AppIcon name="user" />
          New Traveller
        </NuxtLink>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.travellers-utility-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
}

.travellers-credits-chip {
  display: inline-flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 0.4rem;
  min-height: 2.5rem;
  padding: 0 0.95rem;
  white-space: nowrap;
  border: 1px solid rgba(250, 204, 21, 0.46);
  background:
    linear-gradient(180deg, rgba(135, 58, 11, 0.92), rgba(88, 28, 8, 0.96));
  color: rgb(250 204 21);
  font-size: 0.96rem;
  font-weight: 700;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.06),
    0 0 16px rgba(250, 204, 21, 0.18),
    0 0 28px rgba(234, 179, 8, 0.12);
  clip-path: polygon(0 0, calc(100% - 0.55rem) 0, 100% 0.55rem, 100% 100%, 0.55rem 100%, 0 calc(100% - 0.55rem));
}

.travellers-credits-chip__value {
  color: rgb(250 204 21);
  font-size: 1.12rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  line-height: 1;
  text-align: center;
  text-shadow:
    0 0 6px rgb(250 204 21 / 0.24),
    0 0 14px rgb(234 179 8 / 0.18);
}

.travellers-utility-button :deep(svg) {
  width: 1.55rem;
  height: 1.55rem;
  display: block;
}

.travellers-credits-chip__symbol {
  color: rgb(250 204 21);
  width: 1.36rem;
  height: 1.36rem;
  flex: 0 0 auto;
  align-self: center;
  transform: translateY(0.11rem);
  filter:
    drop-shadow(0 0 6px rgb(250 204 21 / 0.24))
    drop-shadow(0 0 14px rgb(234 179 8 / 0.18));
}

.travellers-utility-button {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  min-width: 2.5rem;
  min-height: 2.5rem;
}

.travellers-utility-button--leave {
  border-color: rgba(34, 211, 238, 0.24);
}

.travellers-utility-button--new {
  margin-left: auto;
}

.travellers-utility-button__leave-icon {
  transform: rotate(90deg);
}

.traveller-nav-entry {
  position: relative;
}

.traveller-nav-delete {
  position: absolute;
  top: 0.4rem;
  right: 0.4rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  color: rgba(248, 113, 113, 0.92);
  border-color: rgba(248, 113, 113, 0.36);
  background: rgba(38, 10, 14, 0.78);
  transition: opacity 160ms ease, transform 160ms ease, background-color 160ms ease;
  transform: translateY(-2px);
  padding: 0;
  min-width: 1.25rem;
  min-height: 1.25rem;
  border-radius: 0.2rem;
}

.traveller-nav-delete :deep(svg) {
  width: 0.6rem;
  height: 0.6rem;
  display: block;
}

.traveller-nav-entry:hover .traveller-nav-delete,
.traveller-nav-entry:focus-within .traveller-nav-delete {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

.traveller-nav-confirm {
  position: absolute;
  top: 0.65rem;
  right: 2.9rem;
  z-index: 25;
  min-width: 10.5rem;
  border: 1px solid rgba(34, 211, 238, 0.28);
  background:
    linear-gradient(180deg, rgba(11, 17, 32, 0.98), rgba(8, 12, 24, 0.98));
  box-shadow: 0 12px 28px rgba(2, 8, 23, 0.5);
  padding: 0.65rem 0.75rem;
  clip-path: polygon(0.75rem 0, 100% 0, 100% calc(100% - 0.75rem), calc(100% - 0.75rem) 100%, 0 100%, 0 0.75rem);
}

.traveller-nav-confirm__text {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 600;
  color: rgba(236, 254, 255, 0.96);
}

.traveller-nav-confirm__actions {
  margin-top: 0.55rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.45rem;
}

.traveller-nav-confirm__button {
  min-height: 1.9rem;
  border: 1px solid rgba(34, 211, 238, 0.26);
  background: rgba(15, 23, 42, 0.82);
  padding: 0.2rem 0.65rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: rgba(236, 254, 255, 0.9);
}

.traveller-nav-confirm__button--danger {
  border-color: rgba(248, 113, 113, 0.34);
  background: rgba(69, 10, 10, 0.85);
  color: rgba(254, 226, 226, 0.98);
}
</style>
