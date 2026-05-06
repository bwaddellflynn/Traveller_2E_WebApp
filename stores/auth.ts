import { defineStore } from 'pinia'

const AUTH_STORAGE_KEY = 'scoutsuite.auth.v1'
const DUMMY_USERNAME = 'User'
const DUMMY_PASSWORD = 'Welcome01'

export const useAuthStore = defineStore('auth', () => {
  const signedInUser = ref('')
  const hydrated = ref(false)
  const loginError = ref('')

  const isAuthenticated = computed(() => Boolean(signedInUser.value))

  const persist = () => {
    if (!import.meta.client) return
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
      signedInUser: signedInUser.value,
    }))
  }

  const hydrate = () => {
    if (!import.meta.client || hydrated.value) {
      hydrated.value = true
      return
    }

    try {
      const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as { signedInUser?: string }
        signedInUser.value = typeof parsed.signedInUser === 'string' ? parsed.signedInUser : ''
      }
    }
    catch {
      signedInUser.value = ''
    }
    finally {
      hydrated.value = true
    }
  }

  const login = (username: string, password: string) => {
    if (username === DUMMY_USERNAME && password === DUMMY_PASSWORD) {
      signedInUser.value = DUMMY_USERNAME
      loginError.value = ''
      persist()
      return true
    }

    loginError.value = 'Invalid credentials'
    return false
  }

  const logout = () => {
    signedInUser.value = ''
    loginError.value = ''
    persist()
  }

  return {
    signedInUser,
    hydrated,
    loginError,
    isAuthenticated,
    hydrate,
    login,
    logout,
  }
})
