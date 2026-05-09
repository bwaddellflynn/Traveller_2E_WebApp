<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { nextTick, onMounted } from 'vue'
import MusterOutPanel from '~/components/character/MusterOutPanel.vue'
import MusterOutRollModal from '~/components/character/MusterOutRollModal.vue'
import { useAuthStore } from '~/stores/auth'
import { useCharacterCreatorStore } from '~/stores/characterCreator'

definePageMeta({
  layout: 'default',
})

const authStore = useAuthStore()
const characterCreator = useCharacterCreatorStore()
const router = useRouter()
const { isSysAdmin } = storeToRefs(authStore)

const testSurfaceMessage = ref('')
const rollModalOpen = ref(false)
const rollModalPayload = ref<{
  title: string
  resultId: string
  careerName: string
  rollType: 'cash' | 'benefit'
  die: number
  modifier: number
  total: number
  tableRoll: number
  result: string
  options: Array<{ roll: number; cash: number; benefit: string }>
} | null>(null)

const closeRollModal = () => {
  rollModalOpen.value = false
}

const loadTestMusterOutState = () => {
  characterCreator.hydrateMusterOutTestState()
  testSurfaceMessage.value = ''
  closeRollModal()
}

const handleMusterOutRoll = async (payload: {
  title: string
  resultId: string
  careerName: string
  rollType: 'cash' | 'benefit'
  die: number
  modifier: number
  total: number
  tableRoll: number
  result: string
  options: Array<{ roll: number; cash: number; benefit: string }>
}) => {
  rollModalOpen.value = false
  rollModalPayload.value = null
  await nextTick()
  rollModalPayload.value = payload
  rollModalOpen.value = true
}

const handleTestSave = () => {
  testSurfaceMessage.value = 'Save is disabled on the test surface. Use this page to exercise Muster Out mechanics only.'
}

onMounted(() => {
  authStore.hydrate()
  if (!isSysAdmin.value) {
    void router.replace('/')
    return
  }

  loadTestMusterOutState()
})
</script>

<template>
  <section class="min-h-[calc(100vh-8rem)] bg-[linear-gradient(180deg,rgba(120,53,15,0.18),rgba(69,26,3,0.28))] px-4 py-8 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-7xl">
      <div class="rounded-lg border border-amber-300/35 bg-[linear-gradient(180deg,rgba(69,26,3,0.92),rgba(41,17,5,0.96))] p-6 text-amber-50 shadow-[0_0_0_1px_rgba(251,191,36,0.08),0_24px_60px_rgba(41,17,5,0.45)]">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div class="flex items-start gap-4">
            <span class="grid h-12 w-12 place-items-center rounded-md border border-amber-300/40 bg-amber-500/12 text-amber-200 shadow-[0_0_18px_rgba(251,191,36,0.16)]">
              <AppIcon name="warning" />
            </span>
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/75">Test Surface</p>
              <h1 class="mt-2 text-3xl font-semibold text-amber-50">Muster Out Harness</h1>
              <p class="mt-3 max-w-3xl text-sm leading-6 text-amber-100/80">
                This page seeds the shared creator store with synthetic Muster Out data so the extracted component can be exercised in isolation.
              </p>
            </div>
          </div>
          <button
            class="inline-flex h-11 items-center justify-center rounded-md border border-amber-300/45 bg-[linear-gradient(180deg,rgba(180,83,9,0.3),rgba(120,53,15,0.42))] px-4 text-sm font-semibold text-amber-50 shadow-[0_0_0_1px_rgba(251,191,36,0.08),0_12px_28px_rgba(69,26,3,0.28)] transition hover:-translate-y-0.5 hover:border-amber-200/70 hover:bg-[linear-gradient(180deg,rgba(217,119,6,0.42),rgba(146,64,14,0.52))] hover:shadow-[0_0_0_1px_rgba(253,224,71,0.14),0_16px_34px_rgba(120,53,15,0.36)]"
            type="button"
            @click="loadTestMusterOutState"
          >
            Reset Test Muster Out
          </button>
        </div>
      </div>

      <div class="mt-6 overflow-hidden rounded-lg border border-amber-300/25 bg-[linear-gradient(180deg,rgba(12,22,38,0.96),rgba(8,15,29,0.98))] shadow-[0_0_0_1px_rgba(34,211,238,0.08),0_22px_52px_rgba(3,7,18,0.46)]">
        <MusterOutPanel
          :save-message="testSurfaceMessage"
          @show-mustering-roll="handleMusterOutRoll"
          @save-open="handleTestSave"
        />
      </div>
    </div>

    <MusterOutRollModal
      :open="rollModalOpen"
      :payload="rollModalPayload"
      @close="closeRollModal"
    />
  </section>
</template>
