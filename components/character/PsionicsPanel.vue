<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { reactive } from 'vue'
import { useCharacterCreatorStore } from '~/stores/characterCreator'

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
  emit('roll-result', {
    title: attempt.talentName,
    result: attempt.success ? 'Learned' : 'Not Learned',
    modifier: attempt.attemptDm + attempt.psiDm + attempt.learningDm,
    total: attempt.total,
    dice: attempt.dice,
  })
}

const triggerRollPsiTest = () => {
  rollPsiTest()
  emitPsiTestResult()
}

const triggerManualPsiTest = () => {
  enterManualPsiTest(manualRolls.psiTest ?? Number.NaN)
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
        class="h-10 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
        type="button"
        @click="triggerRollPsiTest"
      >
        Roll PSI
      </button>
      <template v-if="gmManualPsionicsRollEntryEnabled">
        <input
          v-model.number="manualRolls.psiTest"
          class="h-10 w-28 rounded-md border border-violet-300 px-3 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200"
          max="12"
          min="2"
          placeholder="2D total"
          type="number"
        >
        <button
          class="h-10 rounded-md border border-violet-300 px-3 text-sm font-semibold text-violet-900 hover:border-violet-700"
          type="button"
          @click="triggerManualPsiTest"
        >
          Manual
        </button>
      </template>
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
          class="rounded-md bg-white p-3 text-sm"
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="font-semibold text-zinc-950">{{ talent.name }}</p>
              <p class="text-xs text-zinc-600">
                Learning DM {{ formatDm(talent.learningDm) }} · Current check DM {{ formatDm(psionicTalentAttemptDm(talent)) }}
              </p>
            </div>
            <span
              v-if="learnedPsionicTalentIds.has(talent.id)"
              class="rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800"
            >
              Learned
            </span>
          </div>

          <div v-if="!learnedPsionicTalentIds.has(talent.id)" class="mt-3 flex flex-wrap items-center gap-2">
            <button
              v-if="talent.id === 'telepathy' && !psionicTalentAttempts.length"
              class="h-9 rounded-md border border-violet-300 bg-white px-3 text-sm font-semibold text-violet-900 hover:border-violet-700"
              type="button"
              @click="learnPsionicTalentAutomatically(talent.id)"
            >
              Learn Automatically
            </button>
            <button
              class="h-9 rounded-md border border-violet-300 bg-white px-3 text-sm font-semibold text-violet-900 hover:border-violet-700"
              type="button"
              @click="triggerRollPsionicTalent(talent.id)"
            >
              Roll 2D
            </button>
            <template v-if="gmManualPsionicsRollEntryEnabled">
              <input
                v-model.number="manualRolls[talent.id]"
                class="h-9 w-24 rounded-md border border-violet-300 bg-white px-2 text-sm text-violet-950"
                max="12"
                min="2"
                placeholder="2D"
                type="number"
              >
              <button
                class="h-9 rounded-md border border-violet-300 bg-white px-3 text-sm font-semibold text-violet-900 hover:border-violet-700"
                type="button"
                @click="triggerManualPsionicTalent(talent.id)"
              >
                Apply
              </button>
            </template>
          </div>
        </div>
      </div>

      <div v-if="learnedPsionicTalents.length" class="flex flex-wrap gap-2">
        <span
          v-for="talent in learnedPsionicTalents"
          :key="talent.id"
          class="rounded-md bg-violet-100 px-3 py-2 text-sm font-semibold text-violet-950"
        >
          {{ talent.name }} 0
        </span>
      </div>
    </div>
  </div>
</template>
