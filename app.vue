<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const { hydrated, isAuthenticated } = storeToRefs(authStore)
const showLoginBurst = ref(false)
let loginBurstTimer: ReturnType<typeof setTimeout> | null = null

const triggerLoginBurst = () => {
  if (!import.meta.client) return
  showLoginBurst.value = true
  if (loginBurstTimer) clearTimeout(loginBurstTimer)
  loginBurstTimer = window.setTimeout(() => {
    showLoginBurst.value = false
    loginBurstTimer = null
  }, 1050)
}

onMounted(() => {
  authStore.hydrate()
})

watch(isAuthenticated, (value, previous) => {
  if (!hydrated.value) return
  if (value && !previous) triggerLoginBurst()
})

onBeforeUnmount(() => {
  if (loginBurstTimer) clearTimeout(loginBurstTimer)
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
    <div v-if="showLoginBurst" class="crt-login-burst" aria-hidden="true">
      <div class="crt-login-burst__line" />
      <div class="crt-login-burst__glow" />
      <div class="crt-login-burst__scanlines" />
    </div>
  </div>
</template>

<style scoped>
.crt-login-burst {
  position: fixed;
  inset: 0;
  z-index: 80;
  pointer-events: none;
  overflow: hidden;
  background:
    radial-gradient(circle at center, rgba(125, 211, 252, 0.08), rgba(2, 6, 23, 0.92) 58%, rgba(2, 6, 23, 0.98));
  animation: crt-login-fade 1050ms ease-out forwards;
}

.crt-login-burst__line {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 2px;
  transform: translateY(-50%);
  background:
    linear-gradient(90deg, transparent, rgba(186, 230, 253, 0.96) 18%, rgba(34, 211, 238, 0.98) 50%, rgba(186, 230, 253, 0.96) 82%, transparent);
  box-shadow:
    0 0 18px rgba(125, 211, 252, 0.9),
    0 0 48px rgba(34, 211, 238, 0.5);
  animation: crt-login-line 1050ms cubic-bezier(0.18, 0.84, 0.18, 1) forwards;
}

.crt-login-burst__glow {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at center, rgba(186, 230, 253, 0.16), rgba(34, 211, 238, 0.08) 22%, transparent 58%);
  mix-blend-mode: screen;
  animation: crt-login-glow 1050ms ease-out forwards;
}

.crt-login-burst__scanlines {
  position: absolute;
  inset: 0;
  opacity: 0.2;
  background-image: linear-gradient(
    to bottom,
    rgba(186, 230, 253, 0.18) 0,
    rgba(186, 230, 253, 0.18) 1px,
    transparent 1px,
    transparent 4px
  );
  background-size: 100% 4px;
  animation: crt-login-scanlines 1050ms ease-out forwards;
}

@keyframes crt-login-line {
  0% {
    top: 50%;
    height: 2px;
    opacity: 0;
    transform: translateY(-50%) scaleX(0.22);
  }

  12% {
    opacity: 1;
    transform: translateY(-50%) scaleX(1);
  }

  38% {
    height: 2px;
    opacity: 1;
  }

  58% {
    top: 0;
    height: 100%;
    transform: scaleX(1);
    opacity: 0.92;
  }

  100% {
    top: 0;
    height: 100%;
    opacity: 0;
  }
}

@keyframes crt-login-glow {
  0% {
    opacity: 0;
    transform: scaleY(0.08);
  }

  24% {
    opacity: 0.7;
  }

  60% {
    opacity: 1;
    transform: scaleY(1);
  }

  100% {
    opacity: 0;
    transform: scaleY(1.02);
  }
}

@keyframes crt-login-scanlines {
  0% {
    opacity: 0;
  }

  35% {
    opacity: 0.28;
  }

  100% {
    opacity: 0;
  }
}

@keyframes crt-login-fade {
  0% {
    opacity: 0;
  }

  10% {
    opacity: 1;
  }

  75% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}
</style>
