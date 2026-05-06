<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/stores/auth'

const username = ref('')
const password = ref('')
const mobileMenuOpen = ref(false)
const route = useRoute()
const authStore = useAuthStore()
const { isAuthenticated, loginError, signedInUser } = storeToRefs(authStore)

const login = () => {
  if (authStore.login(username.value, password.value)) {
    password.value = ''
    mobileMenuOpen.value = false
  }
}

const logout = () => {
  authStore.logout()
  username.value = ''
  password.value = ''
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
        <span class="app-top-nav-disabled hud-link inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold" aria-disabled="true">
          Factory
          <AppIcon name="warning" />
        </span>
        <span class="app-top-nav-disabled hud-link inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold" aria-disabled="true">
          Shuttle Bay
          <AppIcon name="warning" />
        </span>
        <span class="app-top-nav-disabled hud-link inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold" aria-disabled="true">
          Shipyard
          <AppIcon name="warning" />
        </span>
      </nav>

      <form v-if="!isAuthenticated" class="app-top-nav-auth" @submit.prevent="login">
        <div class="app-top-nav-field">
          <input
            id="dummy-email"
            v-model="username"
            autocapitalize="none"
            autocomplete="off"
            class="h-11 w-32 rounded-md border border-cyan-400/30 px-3 text-sm outline-none placeholder:text-cyan-100/35"
            name="scoutsuite-dummy-email"
            placeholder="Email"
            spellcheck="false"
            type="text"
          >
        </div>
        <div class="app-top-nav-field">
          <input
            id="dummy-password"
            v-model="password"
            autocomplete="new-password"
            class="h-11 w-36 rounded-md border border-cyan-400/30 px-3 text-sm outline-none placeholder:text-cyan-100/35"
            name="scoutsuite-dummy-password"
            placeholder="Password"
            type="password"
          >
        </div>
        <button class="hud-link h-10 px-3 text-sm font-semibold" type="submit">
          Login
        </button>
        <span v-if="loginError" class="text-xs font-semibold text-amber-700">{{ loginError }}</span>
      </form>

      <div v-else class="app-top-nav-auth">
        <button class="hud-link flex h-10 items-center gap-2 px-3 text-sm font-semibold" title="Profile controls" type="button">
          <AppIcon name="user" />
          {{ signedInUser }}
        </button>
        <button class="hud-link h-10 px-3 text-sm font-semibold" type="button" @click="logout">
          Logout
        </button>
      </div>
    </div>
  </header>
</template>
