<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useCharacterCreatorStore } from '~/stores/characterCreator'

const props = withDefaults(defineProps<{
  rollModalOpen?: boolean
}>(), {
  rollModalOpen: false,
})

const emit = defineEmits<{
  (event: 'roll-result', payload: {
    title: string
    result: string
    modifier?: number
    total?: number
    dice?: number[]
  }): void
}>()

const characterCreator = useCharacterCreatorStore()
const {
  formatDm,
  rollSummary,
  enterManualPsiTest,
  rollPsiTest,
  psionicTalents,
  psionicTalentAttemptDm,
  learnPsionicTalentAutomatically,
  rollPsionicTalent,
  enterManualPsionicTalent,
} = characterCreator
const {
  psionicsPermissionSources,
  psionicsTestingAvailable,
  psiTested,
  psiScore,
  psiTestRoll,
  psiTermsServed,
  psiDm,
  gmManualPsionicsRollEntryEnabled,
  psionicsTrainingAvailable,
  psionicsTrainingCost,
  learnedPsionicTalents,
  learnedPsionicTalentIds,
  psionicTalentAttempts,
  psionicTalentChecksAttempted,
} = storeToRefs(characterCreator)

const manualRolls = reactive<Record<string, number | null>>({
  psiTest: null,
})
const psiTestModalOpen = ref(false)
const queuedLearnedTalentId = ref<string | null>(null)
const animatedLearnedTalentId = ref<string | null>(null)
const learnedTalentAnimationTimer = ref<number | null>(null)

const clearLearnedTalentAnimationTimer = () => {
  if (!import.meta.client || learnedTalentAnimationTimer.value === null) return
  window.clearTimeout(learnedTalentAnimationTimer.value)
  learnedTalentAnimationTimer.value = null
}

const playQueuedLearnedTalentAnimation = () => {
  if (!import.meta.client || !queuedLearnedTalentId.value) return
  clearLearnedTalentAnimationTimer()
  const talentId = queuedLearnedTalentId.value
  learnedTalentAnimationTimer.value = window.setTimeout(() => {
    animatedLearnedTalentId.value = talentId
    queuedLearnedTalentId.value = null
    learnedTalentAnimationTimer.value = window.setTimeout(() => {
      animatedLearnedTalentId.value = null
      learnedTalentAnimationTimer.value = null
    }, 900)
  }, 140)
}

const emitPsiTestResult = () => {
  if (!psiTestRoll.value) return
  emit('roll-result', {
    title: psiTestRoll.value.label,
    result: psiScore.value !== null ? `PSI ${psiScore.value}` : 'PSI Test',
    modifier: psiTestRoll.value.dm,
    total: psiTestRoll.value.total,
    dice: psiTestRoll.value.dice,
  })
}

const emitPsionicTalentResult = (talentId: string) => {
  const attempt = [...psionicTalentAttempts.value].reverse().find((entry) => entry.talentId === talentId)
  if (!attempt) return
  if (attempt.success) queuedLearnedTalentId.value = talentId
  emit('roll-result', {
    title: attempt.talentName,
    result: attempt.success ? 'Learned' : 'Not Learned',
    modifier: attempt.attemptDm + attempt.psiDm + attempt.learningDm,
    total: attempt.total,
    dice: attempt.dice,
  })
}

const openPsiTestModal = () => {
  psiTestModalOpen.value = true
}

const closePsiTestModal = () => {
  psiTestModalOpen.value = false
}

const triggerRollPsiTest = () => {
  rollPsiTest()
  closePsiTestModal()
  emitPsiTestResult()
}

const triggerManualPsiTest = () => {
  enterManualPsiTest(manualRolls.psiTest ?? Number.NaN)
  closePsiTestModal()
  emitPsiTestResult()
}

const triggerRollPsionicTalent = (talentId: string) => {
  rollPsionicTalent(talentId)
  emitPsionicTalentResult(talentId)
}

const triggerManualPsionicTalent = (talentId: string) => {
  enterManualPsionicTalent(talentId, manualRolls[talentId] ?? Number.NaN)
  emitPsionicTalentResult(talentId)
}

const triggerLearnPsionicTalentAutomatically = (talentId: string) => {
  learnPsionicTalentAutomatically(talentId)
  queuedLearnedTalentId.value = talentId
  if (!props.rollModalOpen) playQueuedLearnedTalentAnimation()
}

watch(() => props.rollModalOpen, (open, previous) => {
  if (open || !previous || !queuedLearnedTalentId.value) return
  playQueuedLearnedTalentAnimation()
})

onBeforeUnmount(() => {
  clearLearnedTalentAnimationTimer()
})
</script>

<template>
  <div v-if="psionicsTestingAvailable || psiTested" class="mt-5 rounded-md border border-violet-300 bg-violet-50 p-4">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-sm font-semibold text-violet-950">Psionics</p>
        <p class="text-sm text-violet-900">
          Test PSI with 2D {{ formatDm(-psiTermsServed) }}. Institute testing costs Cr5,000.
        </p>
      </div>
      <span v-if="psionicsTrainingCost" class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-violet-900">
        Cost {{ psionicsTrainingCost.toLocaleString() }} Cr
      </span>
    </div>

    <div v-if="psionicsPermissionSources.length" class="mt-3 flex flex-wrap gap-2">
      <span
        v-for="source in psionicsPermissionSources"
        :key="source"
        class="rounded-md bg-white px-2 py-1 text-xs text-violet-900"
      >
        {{ source }}
      </span>
    </div>

    <div v-if="!psiTested" class="mt-4 flex flex-wrap items-center gap-2">
      <button
        class="h-10 rounded-md border border-violet-300/35 bg-[linear-gradient(180deg,rgba(44,25,94,0.92),rgba(29,17,63,0.96))] px-4 text-sm font-semibold text-violet-50 shadow-[0_0_18px_rgba(168,85,247,0.14)] hover:border-violet-200/55"
        type="button"
        @click="openPsiTestModal"
      >
        Open PSI Test
      </button>
    </div>

    <div v-if="psiTestRoll" class="mt-4 rounded-md bg-white p-3 text-sm">
      <p class="font-semibold">{{ rollSummary(psiTestRoll) }} · PSI {{ psiScore }}</p>
      <p class="mt-1 text-zinc-600">
        {{ psionicsTrainingAvailable ? 'Training is available. Training costs Cr100,000 and takes four months.' : 'No psionic potential remains.' }}
      </p>
    </div>

    <div v-if="psionicsTrainingAvailable" class="mt-4 grid gap-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-sm font-semibold text-violet-950">
          Talent Training
        </p>
        <span class="rounded-md bg-white px-2 py-1 text-xs text-violet-900">
          PSI DM {{ formatDm(psiDm) }} · {{ psionicTalentChecksAttempted }} checks attempted
        </span>
      </div>

      <div class="grid gap-2">
        <div
          v-for="talent in psionicTalents"
          :key="talent.id"
          :class="[
            'psionics-talent-row rounded-md p-3 text-sm',
            learnedPsionicTalentIds.has(talent.id)
              ? [
                  'psionics-talent-row--learned',
                  animatedLearnedTalentId === talent.id ? 'psionics-talent-row--learned-recent' : '',
                ]
              : 'psionics-talent-row--available',
          ]"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="font-semibold text-cyan-50">{{ talent.name }}</p>
              <p class="text-xs text-cyan-100/70">
                Learning DM {{ formatDm(talent.learningDm) }} · Current check DM {{ formatDm(psionicTalentAttemptDm(talent)) }}
              </p>
            </div>
            <div v-if="!learnedPsionicTalentIds.has(talent.id)" class="flex flex-wrap items-center gap-2">
              <button
                v-if="talent.id === 'telepathy' && !psionicTalentAttempts.length"
                class="h-9 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
                type="button"
                @click="triggerLearnPsionicTalentAutomatically(talent.id)"
              >
                Learn Automatically
              </button>
              <button
                class="h-9 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
                type="button"
                @click="triggerRollPsionicTalent(talent.id)"
              >
                Roll 2D
              </button>
            </div>
            <span
              v-else
              class="inline-flex h-9 items-center rounded-md border border-amber-300 bg-[linear-gradient(180deg,rgba(94,36,8,0.92),rgba(34,12,5,0.96))] px-3 text-sm font-semibold text-amber-100 shadow-[0_0_18px_rgba(251,191,36,0.12)]"
            >
              Learned
            </span>
          </div>

          <div class="mt-3 h-px bg-[linear-gradient(90deg,rgba(34,211,238,0),rgba(34,211,238,0.35),rgba(251,191,36,0.3),rgba(34,211,238,0))]" />

          <div v-if="!learnedPsionicTalentIds.has(talent.id) && gmManualPsionicsRollEntryEnabled" class="mt-3 flex flex-wrap items-center gap-2">
            <input
              v-model.number="manualRolls[talent.id]"
              class="h-9 w-24 rounded-md border border-cyan-300/35 bg-slate-950/70 px-2 text-sm text-cyan-50 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200/30"
              max="12"
              min="2"
              placeholder="2D"
              type="number"
            >
            <button
              class="h-9 rounded-md border border-cyan-300/35 bg-slate-950/70 px-3 text-sm font-semibold text-cyan-100 hover:border-cyan-300"
              type="button"
              @click="triggerManualPsionicTalent(talent.id)"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>

  <Transition name="psi-test-fade">
    <div
      v-if="psiTestModalOpen && !psiTested"
      class="fixed inset-0 z-[57] flex items-center justify-center bg-zinc-950/70 px-4 py-8 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      @click.self="closePsiTestModal"
    >
      <div class="w-full max-w-lg overflow-hidden rounded-lg border border-violet-300/30 bg-zinc-950 text-violet-50 shadow-[0_0_0_1px_rgba(167,139,250,0.08),0_24px_60px_rgba(2,6,23,0.45)]">
        <div class="flex flex-wrap items-start justify-between gap-4 border-b border-violet-300/15 bg-[linear-gradient(135deg,rgba(44,25,94,0.46),rgba(8,21,34,0.98))] px-5 py-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200/75">Psionics Test</p>
            <h2 class="mt-2 text-2xl font-semibold">Test PSI</h2>
            <p class="mt-2 text-sm text-violet-100/75">
              Roll 2D {{ formatDm(-psiTermsServed) }}. Institute testing costs Cr5,000.
            </p>
          </div>
          <button
            class="inline-flex h-10 items-center rounded-md border border-violet-300/25 bg-zinc-950/70 px-3 text-sm font-semibold text-violet-100 hover:border-violet-200/45"
            type="button"
            @click="closePsiTestModal"
          >
            Close
          </button>
        </div>

        <div class="px-5 py-5">
          <div v-if="psionicsPermissionSources.length" class="flex flex-wrap gap-2">
            <span
              v-for="source in psionicsPermissionSources"
              :key="`psi-test-${source}`"
              class="rounded-md border border-violet-300/20 bg-zinc-900 px-2 py-1 text-xs text-violet-100"
            >
              {{ source }}
            </span>
          </div>

          <div class="mt-5 flex flex-wrap items-center gap-2">
            <button
              class="h-10 rounded-md border border-violet-300/35 bg-[linear-gradient(180deg,rgba(44,25,94,0.92),rgba(29,17,63,0.96))] px-4 text-sm font-semibold text-violet-50 shadow-[0_0_18px_rgba(168,85,247,0.14)] hover:border-violet-200/55"
              type="button"
              @click="triggerRollPsiTest"
            >
              Roll PSI 2D
            </button>
            <template v-if="gmManualPsionicsRollEntryEnabled">
              <input
                v-model.number="manualRolls.psiTest"
                class="h-10 w-28 rounded-md border border-violet-300/30 bg-zinc-900 px-3 text-violet-50 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-300/25"
                max="12"
                min="2"
                placeholder="2D total"
                type="number"
              >
              <button
                class="h-10 rounded-md border border-violet-300/30 px-3 text-sm font-semibold text-violet-100 hover:border-violet-200/45"
                type="button"
                @click="triggerManualPsiTest"
              >
                Manual
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.psi-test-fade-enter-active,
.psi-test-fade-leave-active {
  transition: opacity 160ms ease;
}

.psi-test-fade-enter-from,
.psi-test-fade-leave-to {
  opacity: 0;
}

.psionics-talent-row {
  position: relative;
  overflow: hidden;
}

.psionics-talent-row--available {
  border: 1px solid rgb(34 211 238 / 0.2);
  background: linear-gradient(180deg, rgba(12, 28, 46, 0.94), rgba(7, 18, 33, 0.98));
  box-shadow: inset 0 0 0 1px rgba(34, 211, 238, 0.05);
}

.psionics-talent-row--learned {
  border: 1px solid rgb(251 191 36 / 0.34);
  background:
    linear-gradient(180deg, rgba(94, 36, 8, 0.28), rgba(34, 12, 5, 0.42)),
    linear-gradient(180deg, rgba(12, 28, 46, 0.94), rgba(7, 18, 33, 0.98));
  box-shadow:
    inset 0 0 0 1px rgba(251, 191, 36, 0.08),
    0 0 18px rgba(245, 158, 11, 0.12);
}

.psionics-talent-row--learned-recent::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(251, 191, 36, 0.08) 26%,
    rgba(255, 251, 235, 0.34) 50%,
    rgba(251, 191, 36, 0.08) 74%,
    transparent 100%
  );
  transform: translateX(-115%);
  animation: psionics-learned-sweep 760ms ease-out;
}

@keyframes psionics-learned-sweep {
  0% {
    opacity: 0;
    transform: translateX(-115%);
  }
  18% {
    opacity: 1;
  }
  82% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateX(115%);
  }
}
</style>
