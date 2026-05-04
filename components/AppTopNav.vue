<script setup lang="ts">
const dummyUsername = 'User'
const dummyPassword = 'Welcome01'

const username = ref('')
const password = ref('')
const loginError = ref('')
const signedInUser = ref('')
const mobileMenuOpen = ref(false)
const route = useRoute()

const login = () => {
  if (username.value === dummyUsername && password.value === dummyPassword) {
    signedInUser.value = dummyUsername
    loginError.value = ''
    password.value = ''
    mobileMenuOpen.value = false
    return
  }

  loginError.value = 'Invalid credentials'
}

const logout = () => {
  signedInUser.value = ''
  username.value = ''
  password.value = ''
  loginError.value = ''
  mobileMenuOpen.value = false
}

watch(() => route.fullPath, () => {
  mobileMenuOpen.value = false
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
      <nav class="app-top-nav-tools" aria-label="Toolkit views">
        <NuxtLink class="hud-link px-3 py-2 text-sm font-semibold" to="/">
          Hub
        </NuxtLink>
        <NuxtLink class="hud-link px-3 py-2 text-sm font-semibold" to="/character/create">
          Creator
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

      <form v-if="!signedInUser" class="app-top-nav-auth" @submit.prevent="login">
        <label class="app-top-nav-field" for="dummy-email">
          <span>Email</span>
          <input
            id="dummy-email"
            v-model="username"
            autocomplete="username"
            class="h-11 w-32 rounded-md border border-cyan-400/30 px-3 pb-1 pt-4 text-sm outline-none"
            type="text"
          >
        </label>
        <label class="app-top-nav-field" for="dummy-password">
          <span>Password</span>
          <input
            id="dummy-password"
            v-model="password"
            autocomplete="current-password"
            class="h-11 w-36 rounded-md border border-cyan-400/30 px-3 pb-1 pt-4 text-sm outline-none"
            type="password"
          >
        </label>
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
