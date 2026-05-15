<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const { profile, profileDisplayName, signedInUser } = storeToRefs(authStore)

const draft = reactive({
  displayName: '',
  handle: '',
  email: '',
  pronouns: '',
  role: '',
  organization: '',
  timezone: '',
  locale: '',
  bio: '',
  defaultView: '/',
  autoResumeDrafts: true,
  compactTables: false,
  productUpdates: false,
  playtestInvites: false,
})
const saveMessage = ref('')

const defaultViewOptions = [
  { value: '/', label: 'Hub' },
  { value: '/character/create', label: 'Character Creator' },
  { value: '/embassy', label: 'Species' },
  { value: '/weapons', label: 'Equipment' },
  { value: '/vehicles', label: 'Vehicles' },
]

const localeOptions = [
  { value: 'en-CA', label: 'English (Canada)' },
  { value: 'en-US', label: 'English (United States)' },
  { value: 'en-GB', label: 'English (United Kingdom)' },
]

const timezoneOptions = [
  'America/Winnipeg',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Australia/Sydney',
  'UTC',
]

watch(profile, (value) => {
  draft.displayName = value.displayName
  draft.handle = value.handle
  draft.email = value.email
  draft.pronouns = value.pronouns
  draft.role = value.role
  draft.organization = value.organization
  draft.timezone = value.timezone
  draft.locale = value.locale
  draft.bio = value.bio
  draft.defaultView = value.defaultView
  draft.autoResumeDrafts = value.autoResumeDrafts
  draft.compactTables = value.compactTables
  draft.productUpdates = value.productUpdates
  draft.playtestInvites = value.playtestInvites
}, { immediate: true, deep: true })

const saveProfile = () => {
  authStore.saveProfile(draft)
  saveMessage.value = 'Profile updated'
  window.setTimeout(() => {
    saveMessage.value = ''
  }, 1800)
}
</script>

<template>
  <main class="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
    <section class="hud-panel rounded-lg border p-5 sm:p-6">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/70">Profile</p>
          <h1 class="mt-2 text-2xl font-semibold text-cyan-50">User Profile</h1>
          <p class="mt-2 max-w-3xl text-sm leading-6 text-cyan-100/70">
            Configure the account identity, public profile details, workspace preferences, and future-facing account features
            for this local hobby toolkit.
          </p>
        </div>
        <div class="profile-summary-tile">
          <p class="profile-summary-tile__eyebrow">Account</p>
          <p class="profile-summary-tile__name">{{ profileDisplayName }}</p>
          <p class="profile-summary-tile__subtle">Login: {{ signedInUser || 'User' }}</p>
        </div>
      </div>

      <div class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_21rem]">
        <div class="grid gap-6">
          <section class="profile-section">
            <div class="profile-section__header">
              <h2 class="profile-section__title">Account Identity</h2>
              <p class="profile-section__copy">The core profile fields that identify the user across a character-building app.</p>
            </div>
            <div class="profile-grid">
              <label class="profile-field">
                <span class="profile-field__label">Display Name</span>
                <input v-model="draft.displayName" class="profile-field__input" type="text">
              </label>

              <label class="profile-field">
                <span class="profile-field__label">Handle</span>
                <input v-model="draft.handle" class="profile-field__input" type="text">
              </label>

              <label class="profile-field">
                <span class="profile-field__label">Email</span>
                <input v-model="draft.email" class="profile-field__input" type="email">
              </label>

              <label class="profile-field">
                <span class="profile-field__label">Pronouns</span>
                <input v-model="draft.pronouns" class="profile-field__input" type="text">
              </label>

              <label class="profile-field">
                <span class="profile-field__label">Role</span>
                <input v-model="draft.role" class="profile-field__input" type="text">
              </label>

              <label class="profile-field">
                <span class="profile-field__label">Organization / Group</span>
                <input v-model="draft.organization" class="profile-field__input" type="text">
              </label>
            </div>
          </section>

          <section class="profile-section">
            <div class="profile-section__header">
              <h2 class="profile-section__title">Public Profile</h2>
              <p class="profile-section__copy">Profile details that would commonly appear beside a user’s creations, comments, or shared content.</p>
            </div>
            <div class="grid gap-4">
              <label class="profile-field">
                <span class="profile-field__label">Bio</span>
                <textarea v-model="draft.bio" class="profile-field__input profile-field__input--textarea" rows="4" />
              </label>
            </div>
          </section>

          <section class="profile-section">
            <div class="profile-section__header">
              <h2 class="profile-section__title">Preferences</h2>
              <p class="profile-section__copy">Default app behavior that should follow the user across similar character-building tools.</p>
            </div>
            <div class="profile-grid">
              <label class="profile-field">
                <span class="profile-field__label">Timezone</span>
                <select v-model="draft.timezone" class="profile-field__input">
                  <option v-for="option in timezoneOptions" :key="option" :value="option">
                    {{ option }}
                  </option>
                </select>
              </label>

              <label class="profile-field">
                <span class="profile-field__label">Locale</span>
                <select v-model="draft.locale" class="profile-field__input">
                  <option v-for="option in localeOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </label>

              <label class="profile-field">
                <span class="profile-field__label">Default Landing View</span>
                <select v-model="draft.defaultView" class="profile-field__input">
                  <option v-for="option in defaultViewOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </label>

              <div class="profile-toggle-card">
                <label class="profile-checkbox">
                  <input v-model="draft.autoResumeDrafts" type="checkbox">
                  <span>Resume in-progress drafts automatically</span>
                </label>
                <label class="profile-checkbox">
                  <input v-model="draft.compactTables" type="checkbox">
                  <span>Prefer compact reference tables</span>
                </label>
                <label class="profile-checkbox">
                  <input v-model="draft.productUpdates" type="checkbox">
                  <span>Receive product update notices</span>
                </label>
                <label class="profile-checkbox">
                  <input v-model="draft.playtestInvites" type="checkbox">
                  <span>Receive playtest and beta invites</span>
                </label>
              </div>
            </div>
          </section>
        </div>

        <aside class="grid gap-4">
          <section class="profile-aside-card">
            <p class="profile-aside-card__eyebrow">Summary</p>
            <p class="profile-aside-card__headline">{{ profileDisplayName }}</p>
            <dl class="profile-meta-list">
              <div>
                <dt>Email</dt>
                <dd>{{ draft.email || 'Not set' }}</dd>
              </div>
              <div>
                <dt>Handle</dt>
                <dd>{{ draft.handle || 'Not set' }}</dd>
              </div>
              <div>
                <dt>Timezone</dt>
                <dd>{{ draft.timezone || 'Not set' }}</dd>
              </div>
              <div>
                <dt>Default View</dt>
                <dd>{{ defaultViewOptions.find((option) => option.value === draft.defaultView)?.label || 'Hub' }}</dd>
              </div>
            </dl>
          </section>

          <section class="profile-aside-card">
            <p class="profile-aside-card__eyebrow">Planned Features</p>
            <ul class="profile-future-list">
              <li>Avatar and portrait management</li>
              <li>Cloud sync and backup</li>
              <li>Shared campaigns and groups</li>
              <li>Connected providers and OAuth logins</li>
              <li>Notification channels and digest settings</li>
            </ul>
          </section>

          <section class="profile-aside-card">
            <p class="profile-aside-card__eyebrow">Security & Access</p>
            <dl class="profile-meta-list">
              <div>
                <dt>Authentication</dt>
                <dd>Dummy local login</dd>
              </div>
              <div>
                <dt>Password Reset</dt>
                <dd>Planned</dd>
              </div>
              <div>
                <dt>Two-Factor Auth</dt>
                <dd>Planned</dd>
              </div>
              <div>
                <dt>Connected Accounts</dt>
                <dd>Planned</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>

      <div class="mt-6 flex flex-wrap items-center justify-end gap-3">
        <span v-if="saveMessage" class="text-sm font-semibold text-cyan-200">{{ saveMessage }}</span>
        <button class="hud-link h-11 px-4 text-sm font-semibold" type="button" @click="saveProfile">
          Save Profile
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.profile-section,
.profile-aside-card,
.profile-summary-tile,
.profile-toggle-card {
  border: 1px solid rgba(34, 211, 238, 0.22);
  border-radius: 10px 0 10px 0;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  background:
    linear-gradient(180deg, rgba(8, 18, 32, 0.88), rgba(3, 7, 18, 0.94)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.08), transparent 8rem);
}

.profile-section {
  padding: 1rem;
}

.profile-section__header {
  margin-bottom: 1rem;
}

.profile-section__title {
  color: #ecfeff;
  font-size: 1rem;
  font-weight: 700;
}

.profile-section__copy {
  margin-top: 0.35rem;
  color: rgba(207, 250, 254, 0.68);
  font-size: 0.9rem;
  line-height: 1.5;
}

.profile-grid {
  display: grid;
  gap: 1rem;
}

.profile-field {
  display: grid;
  gap: 0.45rem;
}

.profile-field__label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(103, 232, 249, 0.78);
}

.profile-field__input {
  min-height: 2.9rem;
  width: 100%;
  border: 1px solid rgba(34, 211, 238, 0.28);
  border-radius: 10px 0 10px 0;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  background:
    linear-gradient(180deg, rgba(8, 18, 32, 0.92), rgba(3, 7, 18, 0.95)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.08), transparent 8rem);
  padding: 0 0.9rem;
  color: #f4f4f5;
  outline: none;
}

.profile-field__input--textarea {
  min-height: 7.5rem;
  padding-top: 0.8rem;
  padding-bottom: 0.8rem;
  resize: vertical;
}

.profile-field__input:focus {
  border-color: rgba(251, 191, 36, 0.62);
  box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.14);
}

.profile-toggle-card {
  display: grid;
  gap: 0.8rem;
  padding: 1rem;
}

.profile-checkbox {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  color: rgba(236, 254, 255, 0.88);
  font-size: 0.9rem;
}

.profile-checkbox input {
  accent-color: rgb(34 211 238);
}

.profile-summary-tile,
.profile-aside-card {
  padding: 1rem;
}

.profile-summary-tile__eyebrow,
.profile-aside-card__eyebrow {
  color: rgba(103, 232, 249, 0.72);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.profile-summary-tile__name,
.profile-aside-card__headline {
  margin-top: 0.5rem;
  color: #ecfeff;
  font-size: 1.1rem;
  font-weight: 700;
}

.profile-summary-tile__subtle {
  margin-top: 0.35rem;
  color: rgba(207, 250, 254, 0.66);
  font-size: 0.88rem;
}

.profile-meta-list {
  margin-top: 1rem;
  display: grid;
  gap: 0.8rem;
  color: rgba(207, 250, 254, 0.76);
  font-size: 0.9rem;
}

.profile-meta-list dt {
  color: rgba(103, 232, 249, 0.82);
  font-weight: 700;
}

.profile-meta-list dd {
  margin-top: 0.2rem;
}

.profile-future-list {
  margin-top: 1rem;
  display: grid;
  gap: 0.55rem;
  color: rgba(207, 250, 254, 0.78);
  font-size: 0.9rem;
}

@media (min-width: 768px) {
  .profile-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
