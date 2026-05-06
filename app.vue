<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const { hydrated, isAuthenticated } = storeToRefs(authStore)

onMounted(() => {
  authStore.hydrate()
})
</script>

<template>
  <div class="traveller-hud min-h-screen text-cyan-50">
    <NuxtRouteAnnouncer />
    <AppTopNav />
    <AppFullscreenToggle v-if="hydrated && isAuthenticated" />
    <div v-if="hydrated && isAuthenticated" class="app-shell">
      <TravellersSideNav />
      <div class="app-shell-content">
        <NuxtPage />
        <AppFooter />
      </div>
    </div>
    <main v-else-if="hydrated" class="mx-auto flex min-h-[calc(100vh-4.5rem)] w-full max-w-3xl items-center justify-center px-6 py-12">
      <section class="hud-panel max-w-xl rounded-lg border p-8 text-center">
        <div class="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-md border border-cyan-400/28 bg-cyan-400/8 text-cyan-200">
          <AppIcon name="lock" />
        </div>
        <h1 class="text-2xl font-semibold text-cyan-50">Sign In Required</h1>
        <p class="mt-3 text-sm leading-6 text-cyan-100/72">
          ScoutSuite is currently login-protected. Sign in from the top bar to access the toolkit.
        </p>
      </section>
    </main>
  </div>
</template>
