<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const { hydrated, isAuthenticated, loginError, authModalOpen } = storeToRefs(authStore)
const showLoginBurst = ref(false)
const mobileAuthMode = ref<'signin' | 'signup'>('signin')
const username = ref('')
const password = ref('')
const signupDisplayName = ref('')
const signupEmail = ref('')
const signupPassword = ref('')
const signupPasswordConfirm = ref('')
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

const login = () => {
  if (authStore.login(username.value, password.value)) {
    password.value = ''
    authStore.closeAuthModal()
  }
}

onMounted(() => {
  authStore.hydrate()
})

watch(isAuthenticated, (value, previous) => {
  if (!hydrated.value) return
  if (value && !previous) triggerLoginBurst()
  if (value) authStore.closeAuthModal()
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
        <button
          class="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-md border border-cyan-400/28 bg-cyan-400/8 text-cyan-200 transition hover:border-cyan-300/45 hover:bg-cyan-300/10"
          aria-label="Open sign in"
          type="button"
          @click="authStore.openAuthModal()"
        >
          <AppIcon name="lock" />
        </button>
        <h1 class="text-2xl font-semibold text-cyan-50">Sign In Required</h1>
        <p class="mt-3 text-sm leading-6 text-cyan-100/72">
          ScoutSuite is currently login-protected. Tap the lock to open sign in.
        </p>
      </section>
    </main>
    <div
      v-if="hydrated && !isAuthenticated && authModalOpen"
      class="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/72 px-4 pt-20 pb-6 backdrop-blur-sm lg:pt-28"
      @click.self="authStore.closeAuthModal()"
    >
      <section class="hud-panel grid w-full max-w-sm grid-rows-[auto_auto_minmax(0,1fr)] rounded-lg border p-5 max-h-[calc(100vh-6.5rem)]">
        <div class="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold text-cyan-50">Account Access</h2>
            <p class="mt-1 text-xs text-cyan-100/65">Use the slider to switch between sign in and sign up.</p>
          </div>
          <button class="hud-link inline-flex h-10 w-10 items-center justify-center" aria-label="Close sign in" type="button" @click="authStore.closeAuthModal()">
            <AppIcon name="close" />
          </button>
        </div>

        <div class="auth-mode-slider relative mb-4 grid grid-cols-2 p-1">
          <span
            class="auth-mode-slider__thumb absolute left-1 top-1 bottom-1 w-[calc(50%-0.25rem)] transition-transform duration-200"
            :class="mobileAuthMode === 'signin' ? 'translate-x-0' : 'translate-x-full'"
            aria-hidden="true"
          />
          <button
            class="auth-mode-slider__option auth-mode-option relative z-10 h-11 px-3 text-sm font-semibold transition"
            :class="{ 'is-active': mobileAuthMode === 'signin' }"
            type="button"
            @click="mobileAuthMode = 'signin'"
          >
            Sign In
          </button>
          <button
            class="auth-mode-slider__option auth-mode-option relative z-10 h-11 px-3 text-sm font-semibold transition"
            :class="{ 'is-active': mobileAuthMode === 'signup' }"
            type="button"
            @click="mobileAuthMode = 'signup'"
          >
            Sign Up
          </button>
        </div>

        <div class="min-h-0 overflow-y-auto pr-1">
          <form v-if="mobileAuthMode === 'signin'" class="grid gap-3" @submit.prevent="login">
            <div class="auth-field h-11">
              <input
                id="dummy-email-mobile"
                v-model="username"
                autocapitalize="none"
                autocomplete="off"
                class="auth-field__input"
                name="scoutsuite-dummy-email-mobile"
                placeholder="Email"
                spellcheck="false"
                type="text"
              >
            </div>
            <div class="auth-field h-11">
              <input
                id="dummy-password-mobile"
                v-model="password"
                autocomplete="new-password"
                class="auth-field__input"
                name="scoutsuite-dummy-password-mobile"
                placeholder="Password"
                type="password"
              >
            </div>
            <button class="auth-submit-green h-11 rounded-md px-3 text-sm font-semibold transition" type="submit">
              Sign In
            </button>
            <span v-if="loginError" class="text-xs font-semibold text-amber-300">{{ loginError }}</span>
          </form>

          <form v-else class="grid gap-3">
            <div class="rounded-md border border-amber-400/28 bg-amber-400/8 px-3 py-2 text-xs font-semibold text-amber-200">
              Sign ups are currently unavailable.
            </div>
            <div class="auth-field auth-field--disabled h-11">
              <input
                id="signup-display-name-mobile"
                v-model="signupDisplayName"
                class="auth-field__input auth-field__input--disabled"
                disabled
                name="scoutsuite-signup-display-name-mobile"
                placeholder="Display Name"
                type="text"
              >
            </div>
            <div class="auth-field auth-field--disabled h-11">
              <input
                id="signup-email-mobile"
                v-model="signupEmail"
                autocapitalize="none"
                class="auth-field__input auth-field__input--disabled"
                disabled
                name="scoutsuite-signup-email-mobile"
                placeholder="Email"
                spellcheck="false"
                type="text"
              >
            </div>
            <div class="auth-field auth-field--disabled h-11">
              <input
                id="signup-password-mobile"
                v-model="signupPassword"
                class="auth-field__input auth-field__input--disabled"
                disabled
                name="scoutsuite-signup-password-mobile"
                placeholder="Password"
                type="password"
              >
            </div>
            <div class="auth-field auth-field--disabled h-11">
              <input
                id="signup-password-confirm-mobile"
                v-model="signupPasswordConfirm"
                class="auth-field__input auth-field__input--disabled"
                disabled
                name="scoutsuite-signup-password-confirm-mobile"
                placeholder="Confirm Password"
                type="password"
              >
            </div>
            <button class="hud-link app-top-nav-disabled h-11 px-3 text-sm font-semibold" disabled type="button">
              Create Account
            </button>
          </form>
        </div>
      </section>
    </div>
    <div v-if="showLoginBurst" class="crt-login-burst" aria-hidden="true">
      <div class="crt-login-burst__line" />
      <div class="crt-login-burst__glow" />
      <div class="crt-login-burst__scanlines" />
    </div>
  </div>
</template>

<style scoped>
.auth-mode-slider {
  overflow: hidden;
  border: 1px solid rgba(34, 211, 238, 0.3);
  border-radius: 10px 0 10px 0;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  background:
    linear-gradient(180deg, rgba(8, 18, 32, 0.9), rgba(3, 7, 18, 0.94)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.08), transparent 8rem);
}

.auth-mode-slider__thumb {
  border: 1px solid rgba(34, 211, 238, 0.34);
  border-radius: 8px 0 8px 0;
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
  background:
    linear-gradient(180deg, rgba(34, 211, 238, 0.18), rgba(34, 211, 238, 0.08)),
    rgba(8, 18, 32, 0.98);
  box-shadow: inset 0 0 18px rgba(34, 211, 238, 0.14);
}

.auth-mode-option {
  border: 0;
  background: transparent;
  box-shadow: none;
  clip-path: none;
}

.auth-mode-option:hover:not(:disabled) {
  border: 0;
  background: transparent;
  box-shadow: none;
}

.auth-mode-slider__option {
  color: rgba(224, 251, 255, 0.72);
}

.auth-mode-slider__option.is-active {
  color: #f8fafc;
}

.auth-field {
  display: flex;
  align-items: center;
  overflow: hidden;
  border: 1px solid rgba(34, 211, 238, 0.32);
  border-radius: 10px 0 10px 0;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  background:
    linear-gradient(180deg, rgba(8, 18, 32, 0.92), rgba(3, 7, 18, 0.94)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.1), transparent 8rem);
}

.auth-field:focus-within {
  border-color: rgba(34, 211, 238, 0.56);
  box-shadow: 0 0 0 2px rgba(34, 211, 238, 0.12);
}

.auth-field--disabled {
  border-color: rgba(34, 211, 238, 0.18);
  background:
    linear-gradient(180deg, rgba(8, 18, 32, 0.78), rgba(3, 7, 18, 0.84)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.05), transparent 8rem);
}

.auth-field__input {
  width: 100%;
  min-width: 0;
  height: 100%;
  border: 0;
  background: transparent;
  padding: 0 0.9rem;
  color: #f4f4f5;
  outline: none;
}

.auth-field__input::placeholder {
  color: rgba(228, 228, 231, 0.46);
}

.auth-field__input--disabled {
  color: rgba(224, 251, 255, 0.56);
}

.auth-field__input--disabled::placeholder {
  color: rgba(224, 251, 255, 0.28);
}

.auth-submit-green {
  border: 1px solid rgba(74, 222, 128, 0.45);
  background: linear-gradient(180deg, rgba(34, 197, 94, 0.24), rgba(20, 83, 45, 0.88));
  color: #ecfdf5;
  box-shadow: inset 0 0 14px rgba(74, 222, 128, 0.12), 0 0 16px rgba(34, 197, 94, 0.16);
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
}

.auth-submit-green:hover:not(:disabled) {
  border-color: rgba(134, 239, 172, 0.72);
  background: linear-gradient(180deg, rgba(34, 197, 94, 0.34), rgba(21, 128, 61, 0.94));
  color: #ffffff;
  box-shadow: inset 0 0 18px rgba(134, 239, 172, 0.16), 0 0 18px rgba(34, 197, 94, 0.22);
}

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
