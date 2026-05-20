<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useCharacterCreatorStore } from '~/stores/characterCreator'

const props = withDefaults(defineProps<{
  mode?: 'all' | 'stats' | 'skills'
  allowBackgroundSkillCollapse?: boolean
}>(), {
  mode: 'all',
  allowBackgroundSkillCollapse: true,
})

const characterCreator = useCharacterCreatorStore()
const {
  applyAssignedScores,
  assignableRollsFor,
  autoAssignCharacteristics,
  backgroundSkillSelected,
  canSelectBackgroundSkill,
  diceModifier,
  formatDm,
  resolvePendingSkillChoice,
  performCharacteristicRoll,
  rollCharacteristics,
  skillName,
  skillOptionLabel,
  toggleBackgroundSkill,
  toggleBackgroundSkillsCollapsed,
} = characterCreator
const {
  assignedRollIds,
  assignedRollIdSet,
  backgroundSkillLimit,
  backgroundSkillOptions,
  backgroundSkillsCollapsed,
  pendingSkillChoice,
  characteristicRollSequence,
  characteristicAdjustments,
  characteristicRows,
  gmCharacteristicAdjustmentsEnabled,
  selectedBackgroundSkills,
  statRolls,
  values,
} = storeToRefs(characterCreator)

const showCharacteristics = computed(() => props.mode === 'all' || props.mode === 'stats')
const showBackgroundSkills = computed(() => props.mode === 'all' || props.mode === 'skills')
const backgroundSkillsShownCollapsed = computed(() => props.allowBackgroundSkillCollapse && backgroundSkillsCollapsed.value)
const characteristicRollModalOpen = ref(false)
const characteristicRollModalRolling = ref(false)
const characteristicRollAnimationMode = ref<'normal' | 'fast'>('normal')
const characteristicRollPreview = ref<Array<{ id: string, dice: [number, number], total: number }>>([])
const characteristicRollSettledIds = ref<string[]>([])
const characteristicRollTimer = ref<number | null>(null)
const characteristicRollFinishTimer = ref<number | null>(null)
const characteristicRollRowTimers = ref<number[]>([])

const randomDie = () => Math.floor(Math.random() * 6) + 1

const clearCharacteristicRollTimers = () => {
  if (!import.meta.client) return
  if (characteristicRollTimer.value !== null) window.clearInterval(characteristicRollTimer.value)
  if (characteristicRollFinishTimer.value !== null) window.clearTimeout(characteristicRollFinishTimer.value)
  characteristicRollRowTimers.value.forEach((timer) => window.clearTimeout(timer))
  characteristicRollTimer.value = null
  characteristicRollFinishTimer.value = null
  characteristicRollRowTimers.value = []
}

const closeCharacteristicRollModal = () => {
  clearCharacteristicRollTimers()
  characteristicRollModalOpen.value = false
  characteristicRollModalRolling.value = false
  characteristicRollSettledIds.value = []
}

const characteristicFinalDice = (total: number): [number, number] => {
  const firstDie = Math.max(1, Math.min(6, Math.floor(total / 2)))
  const secondDie = Math.max(1, Math.min(6, total - firstDie))
  return [firstDie, secondDie]
}

const buildCharacteristicRollRow = (roll: { id: string, value: number }, index: number) => {
  const dice: [number, number] = [randomDie(), randomDie()]
  return {
    id: roll.id,
    dice,
    total: dice[0] + dice[1],
  }
}

const randomizeUnsettledCharacteristicRows = () => {
  const settled = new Set(characteristicRollSettledIds.value)
  characteristicRollPreview.value = characteristicRollPreview.value.map((row) => {
    if (settled.has(row.id)) return row
    const dice: [number, number] = [randomDie(), randomDie()]
    return {
      ...row,
      dice,
      total: dice[0] + dice[1],
    }
  })
}

const settleCharacteristicRollRow = (index: number) => {
  const roll = statRolls.value[index]
  if (!roll) return
  characteristicRollPreview.value = characteristicRollPreview.value.map((row, rowIndex) => {
    if (rowIndex !== index) return row
    return {
      ...row,
      dice: characteristicFinalDice(roll.value),
      total: roll.value,
    }
  })
  characteristicRollSettledIds.value = [...characteristicRollSettledIds.value, roll.id]
}

const remainingCharacteristicRowIndexes = () => {
  const settled = new Set(characteristicRollSettledIds.value)
  return statRolls.value
    .map((roll, index) => ({ id: roll.id, index }))
    .filter((entry) => !settled.has(entry.id))
    .map((entry) => entry.index)
}

const finalizeCharacteristicRollModal = () => {
  clearCharacteristicRollTimers()
  characteristicRollPreview.value = statRolls.value.map((roll) => ({
    id: roll.id,
    dice: characteristicFinalDice(roll.value),
    total: roll.value,
  }))
  characteristicRollModalRolling.value = false
}

const scheduleCharacteristicRollResolution = () => {
  if (!import.meta.client) {
    finalizeCharacteristicRollModal()
    return
  }

  clearCharacteristicRollTimers()

  const isFastMode = characteristicRollAnimationMode.value === 'fast'
  const intervalMs = isFastMode ? 45 : 85
  const initialDelay = isFastMode ? 140 : 1100
  const rowDelay = isFastMode ? 75 : 220
  const remainingIndexes = remainingCharacteristicRowIndexes()

  if (!remainingIndexes.length) {
    characteristicRollModalRolling.value = false
    return
  }

  characteristicRollTimer.value = window.setInterval(randomizeUnsettledCharacteristicRows, intervalMs)

  remainingIndexes.forEach((index, order) => {
    const timer = window.setTimeout(() => {
      settleCharacteristicRollRow(index)
    }, initialDelay + order * rowDelay)
    characteristicRollRowTimers.value.push(timer)
  })

  characteristicRollFinishTimer.value = window.setTimeout(() => {
    finalizeCharacteristicRollModal()
  }, initialDelay + remainingIndexes.length * rowDelay + 180)
}

const openCharacteristicRollModal = () => {
  characteristicRollModalOpen.value = true
  characteristicRollModalRolling.value = true
  characteristicRollSettledIds.value = []
  characteristicRollPreview.value = statRolls.value.map((roll, index) => buildCharacteristicRollRow(roll, index))

  if (!import.meta.client) {
    finalizeCharacteristicRollModal()
    return
  }

  scheduleCharacteristicRollResolution()
}

const toggleCharacteristicRollSpeed = () => {
  characteristicRollAnimationMode.value = characteristicRollAnimationMode.value === 'fast' ? 'normal' : 'fast'
}

const rerollCharacteristicBank = () => {
  performCharacteristicRoll()
}

watch(characteristicRollSequence, (value, previous) => {
  if (!value || value === previous) return
  openCharacteristicRollModal()
})

onBeforeUnmount(() => {
  clearCharacteristicRollTimers()
})
</script>

<template>
  <div class="grid gap-6">
    <div v-if="showCharacteristics" class="hud-panel rounded-lg border p-5 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-semibold">Stats</h2>
          <p class="mt-1 text-sm text-zinc-600">Roll six 2D scores, then assign each score to a stat.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            class="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-800 hover:border-amber-600"
            type="button"
            @click="autoAssignCharacteristics"
          >
            <AppIcon name="arrow" />
            Auto-assign
          </button>
          <button
            class="inline-flex h-10 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
            type="button"
            @click="rollCharacteristics"
          >
            <AppIcon name="dice" />
            Roll
          </button>
        </div>
      </div>

      <div class="character-stat-roll-grid mt-5">
        <span
          v-for="roll in statRolls"
          :key="roll.id"
          :class="[
            'grid min-w-0 place-items-center rounded-md border px-1 py-2 text-center text-xs font-semibold sm:px-2 sm:text-sm',
            assignedRollIdSet.has(roll.id)
              ? 'border-cyan-400/25 bg-slate-900/80 text-cyan-200/60'
              : 'border-cyan-300/70 bg-cyan-400/10 text-cyan-100'
          ]"
        >
          {{ roll.value }}
        </span>
      </div>

      <div class="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-3">
        <label
          v-for="item in characteristicRows"
          :key="item.id"
          class="rounded-md border border-zinc-200 bg-stone-50 p-3 sm:p-4"
        >
          <span class="flex items-start justify-between gap-2 sm:gap-3">
            <span>
              <span class="block text-sm font-semibold">{{ item.abbreviation }}</span>
              <span class="hidden text-xs text-zinc-600 sm:block">{{ item.name }}</span>
            </span>
            <span class="rounded-md border border-cyan-400/30 bg-slate-950/70 px-2 py-1 text-xs font-semibold text-cyan-100 sm:text-sm">
              <span class="sm:hidden">{{ formatDm(item.dm) }}</span>
              <span class="hidden sm:inline">DM {{ formatDm(item.dm) }}</span>
            </span>
          </span>
          <select
            v-model="assignedRollIds[item.id]"
            class="mt-4 h-11 w-full rounded-md border border-zinc-300 bg-white px-2 text-lg font-semibold outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200 sm:h-12 sm:px-3 sm:text-xl"
          >
            <option value="">-</option>
            <option
              v-for="roll in assignableRollsFor(item.id)"
              :key="roll.id"
              :value="roll.id"
            >
              {{ roll.value }}
            </option>
          </select>
          <label v-if="gmCharacteristicAdjustmentsEnabled" class="mt-3 grid gap-1">
            <span class="text-xs font-medium text-zinc-600">Adjustment / override</span>
            <input
              v-model.number="characteristicAdjustments[item.id]"
              class="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
              type="number"
              @input="applyAssignedScores"
            >
          </label>
        </label>
      </div>
    </div>

    <div v-if="showBackgroundSkills" class="hud-panel rounded-lg border p-5 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-semibold">Background Skills</h2>
          <p class="mt-1 text-sm text-zinc-600">Choose {{ backgroundSkillLimit }} based on EDU DM {{ formatDm(diceModifier(values.edu)) }}.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <span class="hidden rounded-md border border-cyan-300/60 bg-cyan-400/10 px-3 py-2 font-mono text-sm font-semibold text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.18)] sm:inline-flex">
            {{ selectedBackgroundSkills.length }} / {{ backgroundSkillLimit }}
          </span>
          <button
            v-if="allowBackgroundSkillCollapse"
            class="hud-link h-10 rounded-md px-3 text-sm font-semibold"
            type="button"
            @click="toggleBackgroundSkillsCollapsed"
          >
            {{ backgroundSkillsCollapsed ? 'Expand' : 'Minimize' }}
          </button>
        </div>
      </div>

      <div v-if="backgroundSkillsShownCollapsed" class="mt-5 flex flex-wrap gap-2">
        <span
          v-for="skillId in selectedBackgroundSkills"
          :key="skillId"
          class="rounded-md border border-cyan-400/25 bg-slate-950/70 px-2 py-1 text-xs font-medium text-cyan-100"
        >
          {{ skillName(skillId) }}
        </span>
        <span v-if="!selectedBackgroundSkills.length" class="text-sm text-zinc-500">No background skills selected.</span>
      </div>

      <div v-else class="background-skill-grid mt-5">
        <div class="background-skill-option rounded-md border border-cyan-400/25 bg-amber-400/15 px-2 py-2 text-left text-xs font-semibold text-amber-200 shadow-[0_0_18px_rgba(251,191,36,0.16)] sm:hidden">
          <span class="block font-mono text-sm">{{ selectedBackgroundSkills.length }} / {{ backgroundSkillLimit }}</span>
        </div>
        <button
          v-for="skill in backgroundSkillOptions"
          :key="skill.id"
          :class="[
            'background-skill-option flex min-w-0 items-center justify-between rounded-md border px-2 py-2 text-left text-xs font-medium sm:px-3 sm:text-sm',
            backgroundSkillSelected(skill.id)
              ? 'border-cyan-300 bg-cyan-400/20 text-cyan-50 shadow-[0_0_18px_rgba(34,211,238,0.2)]'
              : canSelectBackgroundSkill(skill.id)
                ? 'border-cyan-400/25 bg-slate-950/55 text-cyan-100 hover:border-cyan-300'
                : 'cursor-not-allowed border-cyan-950/60 bg-slate-950/35 text-cyan-100/35'
          ]"
          :disabled="!canSelectBackgroundSkill(skill.id)"
          type="button"
          @click="toggleBackgroundSkill(skill.id)"
        >
          <span class="min-w-0 leading-tight">{{ skill.name }}</span>
          <AppIcon v-if="backgroundSkillSelected(skill.id)" name="check" class="shrink-0" />
        </button>
      </div>

      <div v-if="pendingSkillChoice?.mode === 'background'" class="mt-5 rounded-md border border-amber-300 bg-amber-50 p-4">
        <p class="text-sm font-semibold text-amber-950">Background Skill Specialty</p>
        <p class="mt-1 text-sm text-amber-900">{{ pendingSkillChoice.label }}</p>
        <div class="mt-3 flex flex-wrap gap-2">
          <button
            v-for="choice in pendingSkillChoice.options"
            :key="choice"
            class="h-9 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
            type="button"
            @click="resolvePendingSkillChoice(choice)"
          >
            {{ skillOptionLabel(choice) }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div
      v-if="characteristicRollModalOpen"
      class="fixed inset-0 z-[200] flex items-center justify-center bg-zinc-950/72 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-8"
      role="dialog"
      aria-modal="true"
      @click.self="closeCharacteristicRollModal"
    >
      <div class="characteristic-roll-modal w-full max-w-2xl overflow-hidden" @click.stop>
        <div class="characteristic-roll-modal__header">
          <div>
            <p class="characteristic-roll-modal__kicker">Characteristic Bank</p>
            <h2 class="characteristic-roll-modal__title">Stat Rolls</h2>
          </div>
          <div class="characteristic-roll-modal__actions">
            <button
              class="characteristic-roll-modal__speed"
              type="button"
              :class="{ 'is-fast': characteristicRollAnimationMode === 'fast' }"
              :title="characteristicRollAnimationMode === 'fast' ? 'Animation Speed: Fast' : 'Animation Speed: Normal'"
              :aria-label="characteristicRollAnimationMode === 'fast' ? 'Animation Speed: Fast' : 'Animation Speed: Normal'"
              :aria-pressed="characteristicRollAnimationMode === 'fast'"
              @click.stop="toggleCharacteristicRollSpeed"
            >
              <span v-if="characteristicRollAnimationMode === 'normal'" class="characteristic-roll-modal__speed-play" aria-hidden="true" />
              <span v-else class="characteristic-roll-modal__speed-fast" aria-hidden="true">
                <span />
                <span />
              </span>
            </button>
            <button
              class="characteristic-roll-modal__reroll"
              type="button"
              @click.stop="rerollCharacteristicBank"
            >
              <span class="characteristic-roll-modal__reroll-icon" aria-hidden="true">
                <AppIcon class="h-4 w-4" name="restart" />
              </span>
              Reroll
            </button>
            <button
              class="characteristic-roll-modal__close"
              type="button"
              @click.stop="closeCharacteristicRollModal"
            >
              Close
            </button>
          </div>
        </div>

        <div class="characteristic-roll-modal__body">
          <div
            v-for="row in characteristicRollPreview"
            :key="row.id"
            class="characteristic-roll-modal__row"
            :class="{
              'is-critical': characteristicRollSettledIds.includes(row.id) && row.total === 12,
            }"
          >
            <div class="characteristic-roll-modal__dice">
              <div
                class="characteristic-roll-modal__die"
                :class="{
                  'is-rolling': characteristicRollModalRolling,
                  'is-critical': characteristicRollSettledIds.includes(row.id) && row.total === 12,
                }"
              >
                {{ row.dice[0] }}
              </div>
              <div class="characteristic-roll-modal__plus">+</div>
              <div
                class="characteristic-roll-modal__die"
                :class="{
                  'is-rolling': characteristicRollModalRolling,
                  'is-critical': characteristicRollSettledIds.includes(row.id) && row.total === 12,
                }"
              >
                {{ row.dice[1] }}
              </div>
            </div>
            <div
              class="characteristic-roll-modal__total"
              :class="{
                'is-settled': characteristicRollSettledIds.includes(row.id),
                'is-critical': characteristicRollSettledIds.includes(row.id) && row.total === 12,
              }"
            >
              <span class="characteristic-roll-modal__total-frame">
                {{ row.total }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.characteristic-roll-modal {
  position: relative;
  border: 1px solid rgb(34 211 238 / 0.34);
  background:
    linear-gradient(180deg, rgb(8 20 35 / 0.96), rgb(5 12 22 / 0.98)),
    linear-gradient(135deg, rgb(251 191 36 / 0.1), transparent 56%);
  box-shadow:
    0 0 0 1px rgb(14 116 144 / 0.24),
    0 24px 64px rgb(0 0 0 / 0.5),
    inset 0 1px 0 rgb(255 255 255 / 0.04);
  clip-path: polygon(0 0, calc(100% - 1rem) 0, 100% 1rem, 100% 100%, 1rem 100%, 0 calc(100% - 1rem));
}

.characteristic-roll-modal::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgb(250 204 21 / 0.06), transparent 28%),
    repeating-linear-gradient(
      180deg,
      rgb(255 255 255 / 0.018) 0,
      rgb(255 255 255 / 0.018) 1px,
      transparent 1px,
      transparent 6px
    );
}

.characteristic-roll-modal__header {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid rgb(34 211 238 / 0.18);
  padding: 1.25rem 1.25rem 1rem;
}

.characteristic-roll-modal__actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.characteristic-roll-modal__kicker {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgb(251 191 36 / 0.88);
}

.characteristic-roll-modal__title {
  margin: 0.35rem 0 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: rgb(236 254 255);
}

.characteristic-roll-modal__close {
  height: 2.25rem;
  padding: 0 0.85rem;
  border: 1px solid rgb(34 211 238 / 0.28);
  background: rgb(8 20 35 / 0.82);
  color: rgb(207 250 254);
  font-size: 0.82rem;
  font-weight: 700;
  clip-path: polygon(0 0, calc(100% - 0.55rem) 0, 100% 0.55rem, 100% 100%, 0.55rem 100%, 0 calc(100% - 0.55rem));
}

.characteristic-roll-modal__reroll {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  height: 2.25rem;
  padding: 0 0.85rem;
  border: 1px solid rgb(251 191 36 / 0.24);
  background: linear-gradient(180deg, rgb(94 36 8 / 0.94), rgb(70 23 8 / 0.96));
  color: rgb(255 251 235);
  font-size: 0.82rem;
  font-weight: 700;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.03), 0 0 16px rgb(245 158 11 / 0.14);
  clip-path: polygon(0 0, calc(100% - 0.55rem) 0, 100% 0.55rem, 100% 100%, 0.55rem 100%, 0 calc(100% - 0.55rem));
}

.characteristic-roll-modal__reroll-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  line-height: 1;
  overflow: visible;
  flex-shrink: 0;
}

.characteristic-roll-modal__reroll:hover {
  border-color: rgb(251 191 36 / 0.44);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.04), 0 0 20px rgb(245 158 11 / 0.22);
}

.characteristic-roll-modal__speed {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid rgb(251 191 36 / 0.24);
  background: linear-gradient(180deg, rgb(94 36 8 / 0.94), rgb(70 23 8 / 0.96));
  color: rgb(253 224 71);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.03), 0 0 16px rgb(245 158 11 / 0.14);
  clip-path: polygon(0 0, calc(100% - 0.55rem) 0, 100% 0.55rem, 100% 100%, 0.55rem 100%, 0 calc(100% - 0.55rem));
  transition: border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
}

.characteristic-roll-modal__speed:hover {
  border-color: rgb(251 191 36 / 0.44);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.04), 0 0 20px rgb(245 158 11 / 0.22);
}

.characteristic-roll-modal__speed.is-fast {
  border-color: rgb(251 191 36 / 0.48);
  background: linear-gradient(180deg, rgb(124 48 10 / 0.98), rgb(90 31 8 / 0.98));
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / 0.04),
    0 0 18px rgb(245 158 11 / 0.2);
}

.characteristic-roll-modal__speed-play {
  width: 0;
  height: 0;
  border-top: 0.42rem solid transparent;
  border-bottom: 0.42rem solid transparent;
  border-left: 0.65rem solid currentColor;
  margin-left: 0.12rem;
}

.characteristic-roll-modal__speed-fast {
  display: inline-flex;
  gap: 0.22rem;
  align-items: center;
}

.characteristic-roll-modal__speed-fast > span {
  display: block;
  width: 0;
  height: 0;
  border-top: 0.38rem solid transparent;
  border-bottom: 0.38rem solid transparent;
  border-left: 0.56rem solid currentColor;
}

.characteristic-roll-modal__body {
  position: relative;
  display: grid;
  gap: 0.7rem;
  padding: 1.25rem;
  max-height: min(76vh, 42rem);
  overflow-y: auto;
}

.characteristic-roll-modal__row {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 4rem;
  align-items: center;
  gap: 0.9rem;
  border: 1px solid rgb(34 211 238 / 0.12);
  background: rgb(8 20 35 / 0.62);
  padding: 0.8rem 0.9rem;
  clip-path: polygon(0 0, calc(100% - 0.65rem) 0, 100% 0.65rem, 100% 100%, 0.65rem 100%, 0 calc(100% - 0.65rem));
}

.characteristic-roll-modal__row::after {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0;
  pointer-events: none;
  background: linear-gradient(90deg, transparent 0%, rgb(103 232 249 / 0.08) 28%, rgb(251 191 36 / 0.34) 50%, rgb(103 232 249 / 0.08) 72%, transparent 100%);
  transform: translateX(-115%);
}

.characteristic-roll-modal__row.is-critical::after {
  animation: characteristic-roll-critical-sweep 760ms ease-out;
}

.characteristic-roll-modal__row.is-critical::before {
  content: '';
  position: absolute;
  top: 50%;
  right: 3.85rem;
  width: 4.5rem;
  height: 2.6rem;
  opacity: 0;
  pointer-events: none;
  background:
    radial-gradient(circle, rgb(255 251 235 / 0.95) 0 0.08rem, transparent 0.09rem) 16% 34% / 0.9rem 0.9rem no-repeat,
    radial-gradient(circle, rgb(252 211 77 / 0.95) 0 0.08rem, transparent 0.09rem) 44% 72% / 1rem 1rem no-repeat,
    radial-gradient(circle, rgb(251 191 36 / 0.95) 0 0.08rem, transparent 0.09rem) 71% 22% / 0.95rem 0.95rem no-repeat,
    radial-gradient(circle, rgb(255 251 235 / 0.9) 0 0.07rem, transparent 0.08rem) 86% 62% / 0.9rem 0.9rem no-repeat;
  filter: drop-shadow(0 0 4px rgb(252 211 77 / 0.46)) drop-shadow(0 0 10px rgb(245 158 11 / 0.28));
  transform: translateY(-50%) scale(0.72);
}

.characteristic-roll-modal__row.is-critical .characteristic-roll-modal__dice::after {
  content: '';
  position: absolute;
  inset: -0.15rem -0.4rem;
  border-radius: 999px;
  pointer-events: none;
  background: radial-gradient(circle, rgb(252 211 77 / 0.18) 0%, rgb(245 158 11 / 0.08) 45%, transparent 74%);
  opacity: 0.9;
  filter: blur(10px);
}

.characteristic-roll-modal__dice {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.7rem;
}

.characteristic-roll-modal__die {
  display: grid;
  place-items: center;
  width: 3rem;
  height: 3rem;
  border: 1px solid rgb(34 211 238 / 0.26);
  background: linear-gradient(180deg, rgb(13 34 58 / 0.98), rgb(7 18 33 / 0.98));
  color: rgb(165 243 252);
  font-size: 1.25rem;
  font-weight: 800;
  box-shadow: inset 0 0 0 1px rgb(34 211 238 / 0.1), 0 0 18px rgb(34 211 238 / 0.12);
  clip-path: polygon(0 0, calc(100% - 0.6rem) 0, 100% 0.6rem, 100% 100%, 0.6rem 100%, 0 calc(100% - 0.6rem));
}

.characteristic-roll-modal__die.is-rolling {
  animation: characteristic-roll-pulse 140ms linear infinite;
}

.characteristic-roll-modal__die.is-critical {
  border-color: rgb(251 191 36 / 0.42);
  color: rgb(254 240 138);
  box-shadow:
    inset 0 0 0 1px rgb(251 191 36 / 0.16),
    0 0 20px rgb(252 211 77 / 0.26),
    0 0 34px rgb(245 158 11 / 0.2);
}

.characteristic-roll-modal__plus {
  color: rgb(103 232 249 / 0.85);
  font-size: 1.05rem;
  font-weight: 700;
}

.characteristic-roll-modal__total {
  position: relative;
  text-align: right;
  transform: scale(1);
  transition: transform 180ms ease, filter 180ms ease;
}

.characteristic-roll-modal__total-frame {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.1rem;
  padding: 0;
  border: 1px solid rgb(251 191 36 / 0.28);
  background: linear-gradient(180deg, rgb(118 43 8 / 0.92), rgb(78 27 8 / 0.96));
  color: rgb(255 248 214);
  font-size: 1.7rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  -webkit-text-stroke: 0.85px rgb(92 33 7 / 0.98);
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / 0.04),
    0 0 14px rgb(245 158 11 / 0.14);
  text-shadow:
    0 1px 0 rgb(92 33 7 / 0.95),
    0 0 1px rgb(255 251 235 / 0.92),
    0 0 6px rgb(252 211 77 / 0.44),
    0 0 14px rgb(245 158 11 / 0.28);
  clip-path: polygon(0 0, calc(100% - 0.6rem) 0, 100% 0.6rem, 100% 100%, 0.6rem 100%, 0 calc(100% - 0.6rem));
  overflow: hidden;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.characteristic-roll-modal__total.is-settled {
  animation: characteristic-roll-total-settle 360ms ease-out;
  filter:
    drop-shadow(0 0 8px rgb(252 211 77 / 0.32))
    drop-shadow(0 0 18px rgb(245 158 11 / 0.26));
}

.characteristic-roll-modal__total.is-critical.is-settled {
  animation: characteristic-roll-total-critical-settle 480ms ease-out;
  filter:
    drop-shadow(0 0 16px rgb(255 244 180 / 0.52))
    drop-shadow(0 0 28px rgb(252 211 77 / 0.48))
    drop-shadow(0 0 44px rgb(245 158 11 / 0.34));
}

.characteristic-roll-modal__total.is-critical .characteristic-roll-modal__total-frame {
  border-color: rgb(251 191 36 / 0.44);
  background: linear-gradient(180deg, rgb(134 50 10 / 0.96), rgb(92 31 8 / 0.98));
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / 0.05),
    0 0 20px rgb(252 211 77 / 0.24),
    0 0 38px rgb(245 158 11 / 0.2);
}

@keyframes characteristic-roll-pulse {
  0%,
  100% {
    transform: translateY(0);
    color: rgb(165 243 252);
    box-shadow: inset 0 0 0 1px rgb(34 211 238 / 0.1), 0 0 18px rgb(34 211 238 / 0.12);
  }
  50% {
    transform: translateY(-1px);
    color: rgb(207 250 254);
    box-shadow: inset 0 0 0 1px rgb(34 211 238 / 0.18), 0 0 26px rgb(34 211 238 / 0.22);
  }
}

@keyframes characteristic-roll-total-settle {
  0% {
    transform: scale(1.56);
    filter:
      drop-shadow(0 0 12px rgb(252 211 77 / 0.4))
      drop-shadow(0 0 24px rgb(245 158 11 / 0.34));
  }
  100% {
    transform: scale(1);
    filter:
      drop-shadow(0 0 8px rgb(252 211 77 / 0.32))
      drop-shadow(0 0 18px rgb(245 158 11 / 0.26));
  }
}

@keyframes characteristic-roll-total-critical-settle {
  0% {
    transform: scale(1.72);
    filter:
      drop-shadow(0 0 18px rgb(255 244 180 / 0.62))
      drop-shadow(0 0 32px rgb(252 211 77 / 0.56))
      drop-shadow(0 0 52px rgb(245 158 11 / 0.4));
  }
  35% {
    transform: scale(1.2);
    filter:
      drop-shadow(0 0 18px rgb(255 244 180 / 0.58))
      drop-shadow(0 0 34px rgb(252 211 77 / 0.54))
      drop-shadow(0 0 54px rgb(245 158 11 / 0.42));
  }
  100% {
    transform: scale(1);
    filter:
      drop-shadow(0 0 16px rgb(255 244 180 / 0.52))
      drop-shadow(0 0 28px rgb(252 211 77 / 0.48))
      drop-shadow(0 0 44px rgb(245 158 11 / 0.34));
  }
}

@keyframes characteristic-roll-critical-sweep {
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

@keyframes characteristic-roll-critical-sparks {
  0% {
    opacity: 0;
    transform: translateY(-50%) scale(0.7);
  }
  20% {
    opacity: 1;
    transform: translateY(-50%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-50%) scale(1.22);
  }
}

.characteristic-roll-modal__row.is-critical::before {
  animation: characteristic-roll-critical-sparks 900ms ease-out;
}

@media (max-width: 640px) {
  .characteristic-roll-modal {
    max-width: 100%;
  }

  .characteristic-roll-modal__header {
    padding: 1rem 1rem 0.9rem;
  }

  .characteristic-roll-modal__actions {
    gap: 0.45rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .characteristic-roll-modal__title {
    font-size: 1.1rem;
  }

  .characteristic-roll-modal__body {
    gap: 0.55rem;
    padding: 0.95rem;
    max-height: min(78vh, 36rem);
  }

  .characteristic-roll-modal__row {
    grid-template-columns: minmax(0, 1fr) 4.25rem;
    align-items: center;
    gap: 0.65rem;
    padding: 0.72rem 0.75rem;
  }

  .characteristic-roll-modal__dice {
    justify-content: flex-start;
    gap: 0.5rem;
  }

  .characteristic-roll-modal__die {
    width: 2.35rem;
    height: 2.35rem;
    font-size: 1rem;
  }

  .characteristic-roll-modal__plus {
    font-size: 0.95rem;
  }

  .characteristic-roll-modal__total {
    text-align: right;
  }

  .characteristic-roll-modal__total-frame {
    width: 3.1rem;
    height: 2.8rem;
    font-size: 1.45rem;
    -webkit-text-stroke: 0;
    text-shadow:
      0 0 1px rgb(255 251 235 / 0.9),
      0 0 5px rgb(252 211 77 / 0.34),
      0 0 10px rgb(245 158 11 / 0.22);
  }
}
</style>
