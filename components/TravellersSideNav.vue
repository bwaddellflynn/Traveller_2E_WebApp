<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { TravellerProfile } from '~/types/traveller'
import { useTravellersStore } from '~/stores/travellers'

const travellers = useTravellersStore()
const { userProfiles } = storeToRefs(travellers)
const mobileProfilesExpanded = ref(false)

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
</script>

<template>
  <aside :class="['travellers-side-nav hud-scrollbar', mobileProfilesExpanded ? 'is-mobile-expanded' : '']">
    <div class="flex items-center justify-between gap-3 px-4 py-4">
      <div>
        <h2 class="text-xl font-semibold">Travellers</h2>
      </div>
      <div class="flex items-center gap-2">
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
        <NuxtLink
          aria-label="Create a manually entered Traveller"
          class="travellers-manual-create-link hud-link h-10 w-10"
          title="Create a manually entered Traveller"
          to="/character/sheet"
        >
          <AppIcon name="plus" />
        </NuxtLink>
      </div>
    </div>

    <div class="travellers-mobile-collapsible">
      <nav v-if="userProfiles.length" class="grid gap-1 px-2 pb-3">
        <NuxtLink
          v-for="profile in userProfiles"
          :key="profile.id"
          class="traveller-nav-link"
          :to="`/character/sheet?id=${profile.id}`"
        >
          <span class="block font-semibold">{{ profile.identity.name || 'Unnamed Traveller' }}</span>
          <span class="mt-1 block text-xs">{{ travellerShipAssignment(profile) }}</span>
        </NuxtLink>
      </nav>

      <p v-else class="mx-2 mb-3 rounded-md border border-cyan-400/25 bg-slate-950/50 p-3 text-sm">
        No saved Travellers yet.
      </p>

      <div class="travellers-action-row border-t border-cyan-400/20 px-2 py-3">
        <NuxtLink class="hud-link flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold" to="/character/create">
          <AppIcon name="user" />
          New Traveller
        </NuxtLink>
        <NuxtLink
          aria-label="Create a manually entered Traveller"
          class="travellers-mobile-manual-create-link hud-link h-10 w-10"
          title="Create a manually entered Traveller"
          to="/character/sheet"
        >
          <AppIcon name="plus" />
        </NuxtLink>
      </div>
    </div>
  </aside>
</template>
