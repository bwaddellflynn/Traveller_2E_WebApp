<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/stores/auth'
import { useTravellersStore } from '~/stores/travellers'

const mobileMenuOpen = ref(false)
const route = useRoute()
const authStore = useAuthStore()
const travellersStore = useTravellersStore()
const { isAuthenticated, isSysAdmin, profileDisplayName } = storeToRefs(authStore)
const { activeProfile } = storeToRefs(travellersStore)

const formatCredits = (credits: number) => credits >= 1000000
  ? `MCr${(credits / 1000000).toLocaleString()}`
  : `Cr${credits.toLocaleString()}`

const logout = () => {
  authStore.logout()
  mobileMenuOpen.value = false
}

watch(() => route.fullPath, () => {
  mobileMenuOpen.value = false
})

onMounted(() => {
  authStore.hydrate()
  void travellersStore.loadProfiles()
})
</script>

<template>
  <header class="app-top-nav">
    <NuxtLink class="app-top-nav-brand flex items-center gap-3" to="/">
      <span class="app-top-nav-brand__glyph hud-glyph grid h-10 w-10 place-items-center rounded-md">
        <TasLogoIcon class="app-top-nav-brand__logo h-8 w-8" />
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
        <NuxtLink v-if="isSysAdmin" class="app-top-nav-test-link h-10 px-3 text-sm font-semibold" to="/test">
          <AppIcon name="warning" />
          Test
        </NuxtLink>
      </nav>

      <div v-if="!isAuthenticated" class="app-top-nav-auth">
        <button class="hud-link h-10 px-3 text-sm font-semibold" type="button" @click="authStore.openAuthModal()">
          Sign In
        </button>
      </div>

      <div v-else class="app-top-nav-auth">
        <div v-if="activeProfile" class="app-top-nav-active-traveller">
          <NuxtLink class="hud-link app-top-nav-active-traveller__link flex h-10 items-center gap-2 px-3 text-sm font-semibold" :to="`/character/sheet?id=${activeProfile.id}`" title="Open selected Traveller">
            <AppIcon name="credits" />
            <span class="truncate">{{ activeProfile.identity.name || 'Traveller' }}</span>
            <span class="app-top-nav-active-traveller__credits">{{ formatCredits(activeProfile.finances.cashOnHand) }}</span>
          </NuxtLink>
          <button class="hud-link app-top-nav-active-traveller__clear h-10 w-10" type="button" title="Clear selected Traveller" aria-label="Clear selected Traveller" @click="travellersStore.clearActiveProfile()">
            <AppIcon name="close" />
          </button>
        </div>
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

<style scoped>
.app-top-nav-test-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 1px solid rgba(251, 191, 36, 0.42);
  background:
    linear-gradient(180deg, rgba(120, 53, 15, 0.9), rgba(69, 26, 3, 0.94));
  color: rgb(254 243 199);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.05),
    0 0 16px rgba(251, 191, 36, 0.12);
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    filter 160ms ease,
    border-color 160ms ease;
}

.app-top-nav-test-link:hover {
  transform: translateY(-1px);
  border-color: rgba(253, 186, 116, 0.7);
  filter: brightness(1.06);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.07),
    0 0 22px rgba(251, 191, 36, 0.18);
}

.app-top-nav-test-link :deep(svg) {
  width: 0.95rem;
  height: 0.95rem;
}

.app-top-nav-brand {
  position: relative;
}

.app-top-nav-brand__logo {
  transition: transform 260ms ease;
  transform-origin: center;
  transform-style: preserve-3d;
  will-change: transform, filter;
}

.app-top-nav-brand__glyph {
  position: relative;
  overflow: hidden;
}

.app-top-nav-brand__glyph::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, transparent 0%, rgb(207 250 254 / 0.08) 42%, rgb(255 255 255 / 0.26) 50%, rgb(103 232 249 / 0.12) 58%, transparent 100%);
  transform: translateX(-125%);
  opacity: 0;
  pointer-events: none;
  pointer-events: none;
}

.app-top-nav-brand:hover .app-top-nav-brand__glyph::after {
  opacity: 1;
  animation: app-top-nav-brand-sweep 1.2s ease-out;
}

.app-top-nav-brand:hover .app-top-nav-brand__logo {
  animation:
    app-top-nav-brand-roll 950ms linear infinite,
    app-top-nav-brand-glow 1.1s ease-in-out infinite;
}

@keyframes app-top-nav-brand-roll {
  0% {
    transform: perspective(900px) rotateY(0deg) scale(1);
  }
  50% {
    transform: perspective(900px) rotateY(180deg) scale(1.04);
  }
  100% {
    transform: perspective(900px) rotateY(360deg) scale(1);
  }
}

@keyframes app-top-nav-brand-glow {
  0%,
  100% {
    filter:
      drop-shadow(0 0 6px rgb(103 232 249 / 0.28))
      drop-shadow(0 0 14px rgb(34 211 238 / 0.24));
  }
  50% {
    filter:
      drop-shadow(0 0 12px rgb(165 243 252 / 0.4))
      drop-shadow(0 0 22px rgb(34 211 238 / 0.34))
      drop-shadow(0 0 38px rgb(59 130 246 / 0.14));
  }
}

@keyframes app-top-nav-brand-sweep {
  0% {
    transform: translateX(-125%);
  }
  100% {
    transform: translateX(125%);
  }
}
</style>
