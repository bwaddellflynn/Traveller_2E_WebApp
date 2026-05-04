<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { TravellerProfile } from '~/types/traveller'
import { useTravellersStore } from '~/stores/travellers'

const travellers = useTravellersStore()
const { userProfiles } = storeToRefs(travellers)

onMounted(() => {
  travellers.loadProfiles()
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
  <aside class="travellers-side-nav hud-scrollbar">
    <div class="flex items-center justify-between gap-3 px-4 py-4">
      <div>
        <p class="hud-kicker text-xs font-semibold uppercase tracking-wide">Profiles</p>
        <h2 class="mt-1 text-xl font-semibold">Travellers</h2>
      </div>
      <NuxtLink
        aria-label="Create a manually entered Traveller"
        class="hud-link grid h-10 w-10 place-items-center"
        title="Create a manually entered Traveller"
        to="/character/sheet"
      >
        <AppIcon name="plus" />
      </NuxtLink>
    </div>

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

    <div class="border-t border-cyan-400/20 px-2 py-3">
      <NuxtLink class="hud-link flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold" to="/character/create">
        <AppIcon name="plus" />
        New Traveller
      </NuxtLink>
    </div>
  </aside>
</template>
