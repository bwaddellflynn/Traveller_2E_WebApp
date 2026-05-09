<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import EventResolutionList from '~/components/character/EventResolutionList.vue'
import TasLogoIcon from '~/components/TasLogoIcon.vue'
import { useCharacterCreatorStore } from '~/stores/characterCreator'

const props = defineProps<{
  saveMessage?: string
  showSaveAction?: boolean
}>()

const emit = defineEmits<{
  (event: 'show-roll', payload: {
    title: string
    result: string
    modifier?: number
    total?: number
    dice?: number[]
  }): void
  (event: 'show-mustering-roll', payload: {
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
  }): void
  (event: 'save-open'): void
}>()

const characterCreator = useCharacterCreatorStore()
const {
  rollMusteringOutBenefit,
  enterManualMusteringOutBenefit,
  formatDm,
  toggleMusteringRollModifier,
} = characterCreator
const {
  selectedMusteringCareerId,
  selectedMusteringRollType,
  selectedMusteringRollModifierIds,
  selectedMusteringCareer,
  startingCredits,
  shipShares,
  remainingBenefitRolls,
  flexibleBenefitRollsAvailable,
  cashRollsUsed,
  cashRollLimit,
  canRollMusteringOut,
  musteringCareerOptions,
  selectedMusteringCareerBenefits,
  selectedMusteringCareerSpecificRollsRemaining,
  activeMusteringRollModifiers,
  appliedMusteringRollModifiers,
  selectedMusteringRollDmTotal,
  annualPensionByCareer,
  annualPensionLabel,
  musteringOutResults,
  pendingEventResolutions,
  pendingSkillChoice,
  gmManualBenefitRollEntryEnabled,
  manualRollTotals,
} = storeToRefs(characterCreator)

const unresolvedMusteringOutResolutions = computed(() => pendingEventResolutions.value.some((resolution) => {
  return !resolution.resolved && (resolution.source === 'Mustering Out' || resolution.source.startsWith('Mustering Out:'))
}))

const unresolvedMusteringOutSkillChoice = computed(() => {
  return Boolean(pendingSkillChoice.value && pendingSkillChoice.value.source.startsWith('Mustering Out'))
})

const saveDisabled = computed(() => unresolvedMusteringOutResolutions.value || unresolvedMusteringOutSkillChoice.value)

const emitMusteringResultRoll = () => {
  const result = musteringOutResults.value[musteringOutResults.value.length - 1]
  if (!result) return

  emit('show-mustering-roll', {
    title: 'Mustering Out',
    resultId: result.id,
    careerName: result.careerName,
    rollType: result.rollType,
    die: result.dice[0] ?? 1,
    modifier: result.dm,
    total: result.total,
    tableRoll: result.tableRoll,
    result: result.cash !== undefined ? `${result.cash.toLocaleString()} Cr` : (result.benefit ?? 'Benefit'),
    options: selectedMusteringCareerBenefits.value.map((row) => ({
      roll: row.roll,
      cash: row.cash,
      benefit: row.benefit,
    })),
  })
}

const triggerRollMusteringOutBenefit = () => {
  rollMusteringOutBenefit()
  emitMusteringResultRoll()
}

const triggerManualMusteringOutBenefit = () => {
  enterManualMusteringOutBenefit(manualRollTotals.value.musteringOut ?? Number.NaN)
  emitMusteringResultRoll()
}
</script>

<template>
  <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4">
    <p v-if="saveMessage" class="rounded-md border border-emerald-300/30 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-100">
      {{ saveMessage }}
    </p>

    <div class="mt-5 grid gap-4 md:grid-cols-3">
      <label class="grid gap-2">
        <span class="text-sm font-medium text-cyan-100/85">Career</span>
        <select
          v-model="selectedMusteringCareerId"
          class="h-11 rounded-md border border-cyan-400/20 bg-zinc-900 px-3 text-cyan-50 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
        >
          <option v-for="career in musteringCareerOptions" :key="career.id" :value="career.id">
            {{ career.name }} ({{ career.rolls }} career{{ flexibleBenefitRollsAvailable ? ` + ${flexibleBenefitRollsAvailable} flexible` : '' }})
          </option>
        </select>
      </label>
      <label class="grid gap-2">
        <span class="text-sm font-medium text-cyan-100/85">Roll Type</span>
        <select
          v-model="selectedMusteringRollType"
          class="h-11 rounded-md border border-cyan-400/20 bg-zinc-900 px-3 text-cyan-50 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
        >
          <option value="benefit">Benefit</option>
          <option :disabled="cashRollsUsed >= cashRollLimit" value="cash">Cash</option>
        </select>
      </label>
      <div class="grid gap-2">
        <span class="text-sm font-medium text-cyan-100/85">Roll</span>
        <div class="flex flex-wrap gap-2">
          <button
            class="h-11 rounded-md border border-cyan-300/25 bg-cyan-400/10 px-4 text-sm font-semibold text-cyan-50 hover:border-cyan-300 hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:border-zinc-700 disabled:bg-zinc-900 disabled:text-zinc-500"
            :disabled="!canRollMusteringOut"
            type="button"
            @click="triggerRollMusteringOutBenefit"
          >
            Roll 1D
          </button>
          <template v-if="gmManualBenefitRollEntryEnabled">
            <input v-model.number="manualRollTotals.musteringOut" class="h-11 w-24 rounded-md border border-cyan-400/20 bg-zinc-900 px-3 text-cyan-50 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30" max="6" min="1" placeholder="1D" type="number">
            <button
              class="h-11 rounded-md border border-cyan-400/20 px-3 text-sm font-semibold text-cyan-100 hover:border-cyan-300 disabled:cursor-not-allowed disabled:text-zinc-500"
              :disabled="!canRollMusteringOut"
              type="button"
              @click="triggerManualMusteringOutBenefit"
            >
              Manual
            </button>
          </template>
        </div>
      </div>
    </div>

    <div class="mt-4 flex flex-wrap gap-2 text-xs">
      <span class="rounded-md border border-cyan-400/20 bg-zinc-900 px-3 py-2 text-cyan-100/85">
        {{ selectedMusteringCareerSpecificRollsRemaining }} career-specific rolls
      </span>
      <span class="rounded-md border border-cyan-400/20 bg-zinc-900 px-3 py-2 text-cyan-100/85">
        {{ flexibleBenefitRollsAvailable }} flexible rolls
      </span>
      <span
        v-if="selectedMusteringRollDmTotal"
        class="rounded-md border border-amber-300/30 bg-amber-500/10 px-3 py-2 font-semibold text-amber-100"
      >
        Current roll DM {{ formatDm(selectedMusteringRollDmTotal) }}
      </span>
      <span
        v-if="selectedMusteringCareer?.rankBenefitDm"
        class="rounded-md border border-amber-300/30 bg-amber-500/10 px-3 py-2 font-semibold text-amber-100"
      >
        Rank DM {{ formatDm(selectedMusteringCareer.rankBenefitDm) }} for {{ selectedMusteringCareer.name }}
      </span>
    </div>

    <div v-if="activeMusteringRollModifiers.length" class="mt-4 rounded-lg border border-amber-300/25 bg-amber-500/10 p-4">
      <p class="text-sm font-semibold text-amber-100">Active Mustering Roll Modifiers</p>
      <p class="mt-1 text-xs text-amber-100/75">Arm a modifier to apply and consume it on this roll. Unarmed bonuses stay available.</p>
      <div class="mt-3 grid gap-2">
        <div
          v-for="modifier in activeMusteringRollModifiers"
          :key="modifier.id"
          class="flex flex-col gap-3 rounded-md border border-amber-300/20 bg-zinc-950/45 px-3 py-3 text-sm text-amber-50 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <div>{{ modifier.label }} · DM {{ formatDm(modifier.dm) }}</div>
            <span class="text-amber-100/70">({{ modifier.scope === 'one' || modifier.scope === 'next' ? 'consumed on use' : 'persistent' }})</span>
          </div>
          <button
            :class="[
              'inline-flex h-9 items-center justify-center rounded-md border px-3 text-xs font-semibold uppercase tracking-[0.16em] transition',
              selectedMusteringRollModifierIds.includes(modifier.id)
                ? 'border-amber-200/70 bg-amber-400/15 text-amber-50 shadow-[0_0_18px_rgba(251,191,36,0.14)]'
                : 'border-cyan-400/25 bg-zinc-900/70 text-cyan-100/80 hover:border-cyan-300/50 hover:bg-cyan-400/10',
            ]"
            type="button"
            @click="toggleMusteringRollModifier(modifier.id)"
          >
            {{ selectedMusteringRollModifierIds.includes(modifier.id) ? 'Armed' : 'Arm' }}
          </button>
        </div>
      </div>
      <p v-if="appliedMusteringRollModifiers.length" class="mt-3 text-xs font-semibold text-amber-100/85">
        Armed this roll: {{ appliedMusteringRollModifiers.map((modifier) => `${modifier.label} ${formatDm(modifier.dm)}`).join(' · ') }}
      </p>
    </div>

    <div v-if="unresolvedMusteringOutResolutions" class="mt-5 rounded-lg border border-amber-300/25 bg-amber-500/10 p-4">
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-sm font-semibold text-amber-100">Pending Mustering-Out Rewards</p>
          <p class="mt-1 text-xs text-amber-100/75">Resolve the current reward before rolling or saving again.</p>
        </div>
      </div>
      <div class="mt-4">
        <EventResolutionList source-prefix="Mustering Out" @show-roll="emit('show-roll', $event)" />
      </div>
    </div>

    <div v-if="selectedMusteringCareerBenefits.length" class="mt-5 overflow-hidden rounded-lg border border-cyan-400/20">
      <table class="w-full text-left text-sm">
        <thead class="bg-zinc-900 text-xs uppercase tracking-[0.18em] text-cyan-200/65">
          <tr>
            <th class="px-3 py-3">Roll</th>
            <th class="px-3 py-3">Cash</th>
            <th class="px-3 py-3">Benefit</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in selectedMusteringCareerBenefits" :key="row.roll" class="border-t border-cyan-400/10 bg-zinc-950/55">
            <td class="px-3 py-2 font-semibold text-cyan-50">{{ row.roll }}</td>
            <td class="px-3 py-2 text-cyan-100/80">{{ row.cash.toLocaleString() }} Cr</td>
            <td class="px-3 py-2 text-cyan-100/80">{{ row.benefit }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-5 grid gap-4 lg:grid-cols-3">
      <div class="rounded-lg border border-cyan-400/15 bg-zinc-900/75 p-4">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/65">Credits</p>
        <p class="mt-2 text-2xl font-semibold text-cyan-50">{{ startingCredits.toLocaleString() }} Cr</p>
      </div>
      <div class="rounded-lg border border-cyan-400/15 bg-zinc-900/75 p-4">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/65">Annual Pension</p>
        <p class="mt-2 text-2xl font-semibold text-cyan-50">{{ annualPensionLabel || 'None' }}</p>
      </div>
      <div class="rounded-lg border border-cyan-400/15 bg-zinc-900/75 p-4">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/65">Ship Shares</p>
        <p class="mt-2 text-2xl font-semibold text-cyan-50">{{ shipShares }}</p>
      </div>
    </div>

    <div class="mt-5 overflow-hidden rounded-lg border border-cyan-400/20 bg-zinc-950/65">
      <div class="flex items-center justify-between gap-3 border-b border-cyan-400/10 bg-zinc-900/80 px-4 py-3">
        <div>
          <p class="text-sm font-semibold text-cyan-50">Benefits Ledger</p>
          <p class="mt-1 text-xs text-cyan-100/65">Resolved mustering-out results in roll order.</p>
        </div>
        <span class="rounded-md border border-cyan-400/20 bg-zinc-950 px-2 py-1 text-xs font-semibold text-cyan-100/80">
          {{ musteringOutResults.length }} entries
        </span>
      </div>
      <div v-if="musteringOutResults.length" class="divide-y divide-cyan-400/10">
        <div
          v-for="result in musteringOutResults"
          :key="result.id"
          class="grid gap-2 px-4 py-3 text-sm lg:grid-cols-[minmax(0,1.4fr)_9rem_8rem_8rem_minmax(0,1fr)] lg:items-center"
        >
          <div class="min-w-0">
            <p class="font-semibold text-cyan-50">{{ result.careerName }}</p>
            <p class="mt-1 text-xs uppercase tracking-[0.14em] text-cyan-200/60">{{ result.spentPool === 'career' ? 'Career Roll' : 'Flexible Roll' }}</p>
          </div>
          <div class="font-mono text-cyan-100/80">
            {{ result.dice.join(' + ') }} {{ formatDm(result.dm) }}
          </div>
          <div class="font-semibold text-amber-100">
            {{ result.total }}
          </div>
          <div class="uppercase tracking-[0.14em] text-cyan-200/60">
            {{ result.rollType }}
          </div>
          <div class="text-cyan-100/85 lg:text-right">
            {{
              result.cash !== undefined
                ? `${result.cash.toLocaleString()} Cr`
                : (result.resolvedSelections?.length ? result.resolvedSelections.join(' · ') : result.benefit)
            }}
          </div>
        </div>
      </div>
      <p v-else class="px-4 py-4 text-sm text-cyan-100/65">No mustering-out rolls resolved.</p>
    </div>

    <div v-if="annualPensionByCareer.length" class="mt-5 rounded-lg border border-cyan-400/15 bg-zinc-900/75 p-4">
      <p class="text-sm font-semibold text-cyan-50">Pensions</p>
      <div class="mt-3 grid gap-2">
        <div v-for="pension in annualPensionByCareer" :key="pension.careerId" class="rounded-md border border-cyan-400/10 bg-zinc-950/55 px-3 py-2 text-sm text-cyan-100/85">
          {{ pension.careerName }} · {{ pension.terms }} terms · {{ pension.credits.toLocaleString() }} Cr/year
        </div>
      </div>
    </div>

    <div v-if="showSaveAction !== false" class="mt-6 border-t border-cyan-400/15 pt-5">
      <p class="text-sm text-cyan-100/70">
        Mustering out is complete when you are satisfied with the ledger above. This saves the traveller and opens the character sheet.
      </p>
      <button
        :class="[
          'muster-out-save-cta mt-4 flex w-full items-center justify-center rounded-lg border border-cyan-300/65 bg-[linear-gradient(180deg,rgba(124,48,10,0.98),rgba(90,31,8,0.98))] px-6 py-5 text-lg font-semibold text-amber-50 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_10px_22px_rgba(120,53,15,0.18)] transition-[transform,box-shadow,filter] duration-150 lg:mx-auto lg:w-1/2',
          saveDisabled ? 'cursor-not-allowed opacity-55 saturate-75' : 'hover:-translate-y-0.5',
        ]"
        :disabled="saveDisabled"
        type="button"
        @click="emit('save-open')"
      >
        <span class="muster-out-save-cta__icon -ml-4 mr-7 inline-flex h-10 w-10 items-center justify-center">
          <TasLogoIcon class="muster-out-save-cta__logo" />
        </span>
        Save Traveller and Open Character Sheet
      </button>
    </div>
  </div>
</template>

<style scoped>
.muster-out-save-cta {
  position: relative;
  overflow: hidden;
}

.muster-out-save-cta::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, transparent 0%, rgb(255 255 255 / 0.08) 42%, rgb(255 255 255 / 0.28) 50%, rgb(253 224 71 / 0.16) 58%, transparent 100%);
  transform: translateX(-120%);
  opacity: 0;
  pointer-events: none;
}

.muster-out-save-cta:hover {
  animation: muster-out-cta-glow 1.1s ease-in-out infinite;
}

.muster-out-save-cta:hover::after {
  animation: muster-out-cta-sweep 1.4s ease-out infinite;
}

.muster-out-save-cta__icon {
  flex: 0 0 auto;
}

.muster-out-save-cta__logo {
  width: 2.95rem;
  height: 2.95rem;
  flex: 0 0 auto;
  transition: transform 260ms ease;
  transform-origin: center;
  transform-style: preserve-3d;
  will-change: transform;
}

.muster-out-save-cta:hover .muster-out-save-cta__logo {
  animation: muster-out-cta-icon-roll 950ms linear infinite;
}

@keyframes muster-out-cta-glow {
  0%,
  100% {
    box-shadow:
      0 0 0 1px rgb(255 255 255 / 0.08),
      0 0 22px rgb(251 191 36 / 0.22),
      0 10px 22px rgb(120 53 15 / 0.18);
    filter: brightness(1);
  }
  50% {
    box-shadow:
      0 0 0 1px rgb(255 255 255 / 0.14),
      0 0 34px rgb(251 191 36 / 0.34),
      0 0 52px rgb(249 115 22 / 0.2),
      0 14px 28px rgb(120 53 15 / 0.24);
    filter: brightness(1.08);
  }
}

@keyframes muster-out-cta-sweep {
  0% {
    transform: translateX(-120%);
    opacity: 0;
  }
  18% {
    opacity: 1;
  }
  55% {
    opacity: 1;
  }
  100% {
    transform: translateX(120%);
    opacity: 0;
  }
}

@keyframes muster-out-cta-icon-roll {
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
</style>
