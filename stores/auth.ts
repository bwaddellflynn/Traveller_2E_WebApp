import { defineStore } from 'pinia'

const AUTH_STORAGE_KEY = 'scoutsuite.auth.v1'
const DUMMY_USERNAME = 'User'
const DUMMY_PASSWORD = 'Welcome01'

type AuthProfile = {
  displayName: string
  handle: string
  email: string
  pronouns: string
  role: string
  organization: string
  timezone: string
  locale: string
  bio: string
  defaultView: string
  autoResumeDrafts: boolean
  compactTables: boolean
  productUpdates: boolean
  playtestInvites: boolean
}

export const useAuthStore = defineStore('auth', () => {
  const signedInUser = ref('')
  const hydrated = ref(false)
  const loginError = ref('')
  const authModalOpen = ref(false)
  const profile = reactive<AuthProfile>({
    displayName: '',
    handle: '',
    email: '',
    pronouns: '',
    role: 'Administrator',
    organization: 'ScoutSuite Local Access',
    timezone: 'America/Winnipeg',
    locale: 'en-CA',
    bio: '',
    defaultView: '/',
    autoResumeDrafts: true,
    compactTables: false,
    productUpdates: false,
    playtestInvites: false,
  })

  const isAuthenticated = computed(() => Boolean(signedInUser.value))
  const profileDisplayName = computed(() => profile.displayName || signedInUser.value || 'User')

  const persist = () => {
    if (!import.meta.client) return
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
      signedInUser: signedInUser.value,
      profile: {
        displayName: profile.displayName,
        handle: profile.handle,
        email: profile.email,
        pronouns: profile.pronouns,
        role: profile.role,
        organization: profile.organization,
        timezone: profile.timezone,
        locale: profile.locale,
        bio: profile.bio,
        defaultView: profile.defaultView,
        autoResumeDrafts: profile.autoResumeDrafts,
        compactTables: profile.compactTables,
        productUpdates: profile.productUpdates,
        playtestInvites: profile.playtestInvites,
      },
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
        const parsed = JSON.parse(raw) as { signedInUser?: string, profile?: Partial<AuthProfile> }
        signedInUser.value = typeof parsed.signedInUser === 'string' ? parsed.signedInUser : ''
        profile.displayName = typeof parsed.profile?.displayName === 'string' ? parsed.profile.displayName : signedInUser.value
        profile.handle = typeof parsed.profile?.handle === 'string' ? parsed.profile.handle : ''
        profile.email = typeof parsed.profile?.email === 'string' ? parsed.profile.email : ''
        profile.pronouns = typeof parsed.profile?.pronouns === 'string' ? parsed.profile.pronouns : ''
        profile.role = typeof parsed.profile?.role === 'string' ? parsed.profile.role : 'Administrator'
        profile.organization = typeof parsed.profile?.organization === 'string' ? parsed.profile.organization : 'ScoutSuite Local Access'
        profile.timezone = typeof parsed.profile?.timezone === 'string'
          ? parsed.profile.timezone
          : Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
        profile.locale = typeof parsed.profile?.locale === 'string' ? parsed.profile.locale : 'en-CA'
        profile.bio = typeof parsed.profile?.bio === 'string' ? parsed.profile.bio : ''
        profile.defaultView = typeof parsed.profile?.defaultView === 'string' ? parsed.profile.defaultView : '/'
        profile.autoResumeDrafts = typeof parsed.profile?.autoResumeDrafts === 'boolean' ? parsed.profile.autoResumeDrafts : true
        profile.compactTables = typeof parsed.profile?.compactTables === 'boolean' ? parsed.profile.compactTables : false
        profile.productUpdates = typeof parsed.profile?.productUpdates === 'boolean' ? parsed.profile.productUpdates : false
        profile.playtestInvites = typeof parsed.profile?.playtestInvites === 'boolean' ? parsed.profile.playtestInvites : false
      }
    }
    catch {
      signedInUser.value = ''
      profile.displayName = ''
      profile.handle = ''
      profile.email = ''
      profile.pronouns = ''
      profile.role = 'Administrator'
      profile.organization = 'ScoutSuite Local Access'
      profile.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      profile.locale = 'en-CA'
      profile.bio = ''
      profile.defaultView = '/'
      profile.autoResumeDrafts = true
      profile.compactTables = false
      profile.productUpdates = false
      profile.playtestInvites = false
    }
    finally {
      hydrated.value = true
    }
  }

  const login = (username: string, password: string) => {
    if (username === DUMMY_USERNAME && password === DUMMY_PASSWORD) {
      signedInUser.value = DUMMY_USERNAME
      if (!profile.displayName) profile.displayName = DUMMY_USERNAME
      if (!profile.handle) profile.handle = 'user'
      if (!profile.role) profile.role = 'Administrator'
      if (!profile.organization) profile.organization = 'ScoutSuite Local Access'
      if (!profile.timezone) profile.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      if (!profile.locale) profile.locale = 'en-CA'
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

  const openAuthModal = () => {
    authModalOpen.value = true
  }

  const closeAuthModal = () => {
    authModalOpen.value = false
  }

  const saveProfile = (updates: Partial<AuthProfile>) => {
    profile.displayName = updates.displayName?.trim() || profile.displayName || signedInUser.value || 'User'
    profile.handle = updates.handle?.trim() || profile.handle || 'user'
    profile.email = updates.email?.trim() ?? profile.email
    profile.pronouns = updates.pronouns?.trim() ?? profile.pronouns
    profile.role = updates.role?.trim() || profile.role || 'Administrator'
    profile.organization = updates.organization?.trim() || profile.organization || 'ScoutSuite Local Access'
    profile.timezone = updates.timezone?.trim() || profile.timezone || 'UTC'
    profile.locale = updates.locale?.trim() || profile.locale || 'en-CA'
    profile.bio = updates.bio?.trim() ?? profile.bio
    profile.defaultView = updates.defaultView?.trim() || profile.defaultView || '/'
    profile.autoResumeDrafts = typeof updates.autoResumeDrafts === 'boolean' ? updates.autoResumeDrafts : profile.autoResumeDrafts
    profile.compactTables = typeof updates.compactTables === 'boolean' ? updates.compactTables : profile.compactTables
    profile.productUpdates = typeof updates.productUpdates === 'boolean' ? updates.productUpdates : profile.productUpdates
    profile.playtestInvites = typeof updates.playtestInvites === 'boolean' ? updates.playtestInvites : profile.playtestInvites
    persist()
  }

  return {
    signedInUser,
    hydrated,
    loginError,
    authModalOpen,
    profile,
    profileDisplayName,
    isAuthenticated,
    hydrate,
    login,
    logout,
    openAuthModal,
    closeAuthModal,
    saveProfile,
  }
})
