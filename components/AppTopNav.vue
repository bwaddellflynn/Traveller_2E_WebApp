<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/stores/auth'

const mobileMenuOpen = ref(false)
const route = useRoute()
const authStore = useAuthStore()
const { isAuthenticated, profileDisplayName } = storeToRefs(authStore)

const logout = () => {
  authStore.logout()
  mobileMenuOpen.value = false
}

watch(() => route.fullPath, () => {
  mobileMenuOpen.value = false
})

onMounted(() => {
  authStore.hydrate()
})
</script>

<template>
  <header class="app-top-nav">
    <NuxtLink class="app-top-nav-brand flex items-center gap-3" to="/">
      <span class="hud-glyph grid h-10 w-10 place-items-center rounded-md">
        <AppIcon name="scout-badge" />
      </span>
      <span>
        <span class="block text-sm font-semibold text-cyan-50">ScoutSuite</span>
        <span class="block text-xs text-cyan-200/70">Toolkit for Mongoose Traveller 2E</span>
      </span>
    </NuxtLink>

    <button
      v-if="isAuthenticated"
      class="app-top-nav-toggle hud-link h-10 w-11"
      :aria-expanded="mobileMenuOpen"
      aria-controls="app-mobile-nav"
      aria-label="Toggle navigation menu"
      type="button"
      @click="mobileMenuOpen = !mobileMenuOpen"
    >
      <span :class="['app-top-nav-toggle__line', mobileMenuOpen ? 'is-open' : '']" />
      <span :class="['app-top-nav-toggle__line', mobileMenuOpen ? 'is-open' : '']" />
      <span :class="['app-top-nav-toggle__line', mobileMenuOpen ? 'is-open' : '']" />
    </button>

    <div id="app-mobile-nav" :class="['app-top-nav-menu', mobileMenuOpen ? 'is-open' : '']">
      <nav v-if="isAuthenticated" class="app-top-nav-tools" aria-label="Toolkit views">
        <NuxtLink class="hud-link px-3 py-2 text-sm font-semibold" to="/">
          Hub
        </NuxtLink>
        <NuxtLink class="hud-link px-3 py-2 text-sm font-semibold" to="/embassy">
          Embassy
        </NuxtLink>
        <NuxtLink class="hud-link px-3 py-2 text-sm font-semibold" to="/character/create">
          Dossiers
        </NuxtLink>
        <NuxtLink class="hud-link px-3 py-2 text-sm font-semibold" to="/weapons">
          Armory
        </NuxtLink>
        <NuxtLink class="hud-link px-3 py-2 text-sm font-semibold" to="/vehicles">
          Garage
        </NuxtLink>
        <NuxtLink class="hud-link px-3 py-2 text-sm font-semibold" to="/robots">
          Factory
        </NuxtLink>
        <NuxtLink class="hud-link px-3 py-2 text-sm font-semibold" to="/shuttlebay">
          Shuttle Bay
        </NuxtLink>
        <NuxtLink class="hud-link px-3 py-2 text-sm font-semibold" to="/shipyard">
          Shipyard
        </NuxtLink>
      </nav>

      <div v-if="!isAuthenticated" class="app-top-nav-auth">
        <button class="hud-link h-10 px-3 text-sm font-semibold" type="button" @click="authStore.openAuthModal()">
          Sign In
        </button>
      </div>

      <div v-else class="app-top-nav-auth">
        <NuxtLink class="hud-link flex h-10 items-center gap-2 px-3 text-sm font-semibold" title="Profile" to="/profile">
          <AppIcon name="user" />
          {{ profileDisplayName }}
        </NuxtLink>
        <button class="hud-link h-10 px-3 text-sm font-semibold" type="button" @click="logout">
          Logout
        </button>
      </div>
    </div>
  </header>
</template>
