<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const { isAuthenticated } = storeToRefs(authStore)
const isFullscreen = ref(false)

const syncFullscreenState = () => {
  if (!import.meta.client) return
  isFullscreen.value = Boolean(document.fullscreenElement)
}

const toggleFullscreen = async () => {
  if (!import.meta.client) return
  if (typeof document === 'undefined' || !document.documentElement?.requestFullscreen) return

  try {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await document.documentElement.requestFullscreen()
  }
  finally {
    syncFullscreenState()
  }
}

onMounted(() => {
  syncFullscreenState()
  document.addEventListener('fullscreenchange', syncFullscreenState)
})

onBeforeUnmount(() => {
  if (!import.meta.client) return
  document.removeEventListener('fullscreenchange', syncFullscreenState)
})
</script>

<template>
  <button
    v-if="isAuthenticated"
    class="app-fullscreen-toggle hud-link h-12 w-12"
    :aria-label="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
    :title="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
    type="button"
    @click="toggleFullscreen"
  >
    <AppIcon :name="isFullscreen ? 'fullscreen-exit' : 'fullscreen-enter'" />
  </button>
</template>
