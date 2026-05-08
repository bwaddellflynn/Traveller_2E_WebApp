<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useCharacterCreatorStore } from '~/stores/characterCreator'

const characterCreator = useCharacterCreatorStore()
const {
  formatDm,
  checkLabel,
  associateTypeLabel,
} = characterCreator
const currentTravellerTab = ref('profile')
const currentTravellerTabs = [
  { id: 'profile', label: 'Stats & Skills' },
  { id: 'direction', label: 'Direction' },
  { id: 'events', label: 'Events' },
  { id: 'benefits', label: 'Benefits' },
  { id: 'history', label: 'Term History' },
  { id: 'debt', label: 'Debt' },
]
const currentTravellerTabIndex = computed(() => Math.max(0, currentTravellerTabs.findIndex((tab) => tab.id === currentTravellerTab.value)))
const isMobileViewport = ref(false)
let mobileViewportQuery: MediaQueryList | null = null
const handleViewportChange = (event: MediaQueryListEvent) => {
  isMobileViewport.value = event.matches
}
onMounted(() => {
  mobileViewportQuery = window.matchMedia('(max-width: 639px)')
  isMobileViewport.value = mobileViewportQuery.matches
  mobileViewportQuery.addEventListener('change', handleViewportChange)
})
onBeforeUnmount(() => {
  if (!mobileViewportQuery) return
  mobileViewportQuery.removeEventListener('change', handleViewportChange)
})

const mobileTravellerCarouselTouchStartX = ref<number | null>(null)
const mobileTravellerCarouselTouchStartAt = ref<number | null>(null)
const mobileTravellerCarouselSwipeDelta = ref(0)
const currentTravellerCarouselTransition = ref<'forward' | 'backward' | 'none'>('none')
const currentTravellerPrevTab = computed(() => {
  const count = currentTravellerTabs.length
  return count ? currentTravellerTabs[(currentTravellerTabIndex.value - 1 + count) % count] : null
})
const currentTravellerActiveTab = computed(() => currentTravellerTabs[currentTravellerTabIndex.value] ?? null)
const currentTravellerNextTab = computed(() => {
  const count = currentTravellerTabs.length
  return count ? currentTravellerTabs[(currentTravellerTabIndex.value + 1) % count] : null
})
const navigateTravellerTab = (direction: 'prev' | 'next') => {
  const count = currentTravellerTabs.length
  if (!count) return
  currentTravellerCarouselTransition.value = direction === 'next' ? 'forward' : 'backward'
  const nextIndex = direction === 'prev'
    ? (currentTravellerTabIndex.value - 1 + count) % count
    : (currentTravellerTabIndex.value + 1) % count
  const target = currentTravellerTabs[nextIndex]
  if (!target) return
  currentTravellerTab.value = target.id
}
const handleTravellerCarouselTouchStart = (event: TouchEvent) => {
  mobileTravellerCarouselTouchStartX.value = event.touches[0]?.clientX ?? null
  mobileTravellerCarouselTouchStartAt.value = performance.now()
}
const handleTravellerCarouselTouchMove = (event: TouchEvent) => {
  if (mobileTravellerCarouselTouchStartX.value === null) return
  const currentX = event.touches[0]?.clientX
  if (typeof currentX !== 'number') return
  mobileTravellerCarouselSwipeDelta.value = currentX - mobileTravellerCarouselTouchStartX.value
}
const handleTravellerCarouselTouchEnd = () => {
  const delta = mobileTravellerCarouselSwipeDelta.value
  const elapsed = mobileTravellerCarouselTouchStartAt.value === null ? 999 : performance.now() - mobileTravellerCarouselTouchStartAt.value
  const threshold = elapsed < 180 ? 18 : 36
  if (delta <= -threshold) navigateTravellerTab('next')
  else if (delta >= threshold) navigateTravellerTab('prev')

  mobileTravellerCarouselTouchStartX.value = null
  mobileTravellerCarouselTouchStartAt.value = null
  mobileTravellerCarouselSwipeDelta.value = 0
}
const folderTabPosition = (index: number, count: number) => count <= 1 ? 0 : index / (count - 1)
const {
  activeCreatorTab,
  characterName,
  characteristicRows,
  currentAge,
  currentTravellerSkills,
  currentTermNumber,
  endOfTermAge,
  selectedTermPath,
  selectedCareer,
  selectedAssignment,
  selectedEducationOption,
  selectedEducationEntry,
  termHistory,
  careerRanks,
  eventOutcomeLog,
  associates,
  narrativeEvents,
  rollModifiers,
  benefitRollAdjustments,
  benefitRollLedger,
  psiScore,
  psiDm,
  learnedPsionicTalents,
  psionicsTrainingCost,
  prisonerParoleThreshold,
  prisonerBenefitRollsLost,
  totalBenefitRollsEarned,
  totalBenefitRollAdjustments,
  totalAvailableBenefitRolls,
  medicalDebt,
  totalDebt,
  medicalCareLog,
  careerConstraints,
} = storeToRefs(characterCreator)
const currentTravellerAgeLabel = computed(() => {
  if (['creation', 'setup-stats', 'setup-skills'].includes(activeCreatorTab.value)) return 'Age 18'
  return `Age ${currentAge.value}-${endOfTermAge.value}`
})
</script>

<template>
  <aside class="current-traveller-card h-fit rounded-lg border border-zinc-300 bg-zinc-950 p-5 text-white shadow-sm lg:sticky lg:top-6">
    <p class="text-sm font-semibold uppercase tracking-wide text-amber-300">Current Traveller</p>
    <div class="mt-2 flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-2xl font-semibold">{{ characterName || 'Unnamed Traveller' }}</h2>
      <span class="rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-zinc-300">
        {{ currentTravellerAgeLabel }}
      </span>
    </div>

    <div v-if="!isMobileViewport" class="hud-folder-tabs mt-5">
      <button
        v-for="(tab, index) in currentTravellerTabs"
        :key="tab.id"
        :class="[
          'hud-folder-tab shrink-0 border text-center text-xs font-semibold',
          currentTravellerTab === tab.id
            ? 'is-active border-cyan-300 text-cyan-50'
            : [
                index < currentTravellerTabIndex ? 'is-before' : 'is-after',
                'border-cyan-400/25 text-cyan-100/90 hover:border-cyan-300',
              ]
        ]"
        :style="{
          '--tab-position': folderTabPosition(index, currentTravellerTabs.length),
          '--tab-width': '8.25rem',
          zIndex: currentTravellerTab === tab.id ? 40 : Math.max(1, 30 - Math.abs(index - currentTravellerTabIndex)),
        }"
        type="button"
        @click="currentTravellerTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>
    <div
      v-else
      class="current-traveller-carousel mt-5"
      @touchstart.passive="handleTravellerCarouselTouchStart"
      @touchmove="handleTravellerCarouselTouchMove"
      @touchend="handleTravellerCarouselTouchEnd"
      @touchcancel="handleTravellerCarouselTouchEnd"
    >
      <div class="current-traveller-carousel__viewport">
        <div class="current-traveller-carousel__track">
          <button
            v-if="currentTravellerPrevTab"
            class="current-traveller-carousel__item is-near"
            type="button"
            @click="navigateTravellerTab('prev')"
          >
            <Transition
              :name="currentTravellerCarouselTransition === 'forward'
                ? 'current-traveller-carousel-surface-forward'
                : currentTravellerCarouselTransition === 'backward'
                  ? 'current-traveller-carousel-surface-backward'
                  : ''"
              mode="out-in"
            >
              <span :key="currentTravellerPrevTab.id" class="current-traveller-carousel__surface">
                <span class="current-traveller-carousel__label">{{ currentTravellerPrevTab.label }}</span>
              </span>
            </Transition>
          </button>
          <button
            v-if="currentTravellerActiveTab"
            class="current-traveller-carousel__item is-current"
            type="button"
          >
            <span class="current-traveller-carousel__marker current-traveller-carousel__marker--left" aria-hidden="true">
              <AppIcon name="arrow" />
            </span>
            <Transition
              :name="currentTravellerCarouselTransition === 'forward'
                ? 'current-traveller-carousel-surface-forward'
                : currentTravellerCarouselTransition === 'backward'
                  ? 'current-traveller-carousel-surface-backward'
                  : ''"
              mode="out-in"
            >
              <span :key="currentTravellerActiveTab.id" class="current-traveller-carousel__surface">
                <span class="current-traveller-carousel__label">{{ currentTravellerActiveTab.label }}</span>
              </span>
            </Transition>
            <span class="current-traveller-carousel__marker current-traveller-carousel__marker--right" aria-hidden="true">
              <AppIcon name="arrow" />
            </span>
          </button>
          <button
            v-if="currentTravellerNextTab"
            class="current-traveller-carousel__item is-near"
            type="button"
            @click="navigateTravellerTab('next')"
          >
            <Transition
              :name="currentTravellerCarouselTransition === 'forward'
                ? 'current-traveller-carousel-surface-forward'
                : currentTravellerCarouselTransition === 'backward'
                  ? 'current-traveller-carousel-surface-backward'
                  : ''"
              mode="out-in"
            >
              <span :key="currentTravellerNextTab.id" class="current-traveller-carousel__surface">
                <span class="current-traveller-carousel__label">{{ currentTravellerNextTab.label }}</span>
              </span>
            </Transition>
          </button>
        </div>
      </div>
    </div>

    <div v-show="currentTravellerTab === 'profile'" class="mt-5 grid grid-cols-3 gap-2">
      <div v-for="item in characteristicRows" :key="item.id" class="rounded-md border border-white/15 p-3">
        <p class="text-xs text-zinc-400">{{ item.abbreviation }}</p>
        <p class="mt-1 text-xl font-semibold">{{ item.value }}</p>
        <p class="text-xs text-zinc-400">DM {{ formatDm(item.dm) }}</p>
      </div>
    </div>

    <div v-if="prisonerParoleThreshold !== null || prisonerBenefitRollsLost" v-show="currentTravellerTab === 'profile'" class="mt-5 border-t border-white/15 pt-5">
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm font-semibold text-zinc-200">Prisoner</p>
        <span v-if="prisonerParoleThreshold !== null" class="rounded-md bg-white/10 px-2 py-1 text-xs text-zinc-300">
          Parole {{ prisonerParoleThreshold }}
        </span>
      </div>
      <p v-if="prisonerBenefitRollsLost" class="mt-2 text-xs text-zinc-400">
        Prisoner benefit rolls lost.
      </p>
    </div>

    <div v-if="careerRanks.length" v-show="currentTravellerTab === 'profile'" class="mt-5 border-t border-white/15 pt-5">
      <p class="text-sm font-semibold text-zinc-200">Career Ranks</p>
      <div class="mt-3 grid gap-2">
        <div
          v-for="rank in careerRanks"
          :key="`${rank.careerId}-${rank.assignmentId ?? 'shared'}`"
          class="rounded-md bg-white/10 px-3 py-2"
        >
          <p class="text-sm font-semibold text-zinc-100">
            {{ rank.careerName }}<span v-if="rank.assignmentName"> · {{ rank.assignmentName }}</span>
          </p>
          <p class="text-xs text-zinc-400">
            Rank {{ rank.rank }} · {{ rank.title ?? 'Untitled rank' }}<span v-if="rank.bonus"> · {{ rank.bonus }}</span>
          </p>
        </div>
      </div>
    </div>

    <div v-if="psiScore !== null || learnedPsionicTalents.length" v-show="currentTravellerTab === 'profile'" class="mt-5 border-t border-white/15 pt-5">
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm font-semibold text-zinc-200">Psionics</p>
        <span v-if="psiScore !== null" class="rounded-md bg-white/10 px-2 py-1 text-xs text-zinc-300">
          PSI {{ psiScore }} · DM {{ formatDm(psiDm) }}
        </span>
      </div>
      <div v-if="learnedPsionicTalents.length" class="mt-3 flex flex-wrap gap-2">
        <span
          v-for="talent in learnedPsionicTalents"
          :key="talent.id"
          class="rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-amber-300"
        >
          {{ talent.name }} 0
        </span>
      </div>
      <p v-if="psionicsTrainingCost" class="mt-2 text-xs text-zinc-400">
        Testing/training cost: {{ psionicsTrainingCost.toLocaleString() }} Cr
      </p>
    </div>

    <div v-if="associates.length" v-show="currentTravellerTab === 'profile'" class="mt-5 border-t border-white/15 pt-5">
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm font-semibold text-zinc-200">Associates</p>
        <span class="rounded-md bg-white/10 px-2 py-1 text-xs text-zinc-300">
          {{ associates.length }}
        </span>
      </div>
      <div class="mt-3 grid gap-2">
        <div
          v-for="associate in associates"
          :key="associate.id"
          class="rounded-md bg-white/10 px-3 py-2"
        >
          <div class="flex flex-wrap items-start justify-between gap-2">
            <p class="text-sm font-semibold text-zinc-100">{{ associate.name }}</p>
            <span class="rounded-md bg-zinc-950 px-2 py-1 text-xs font-semibold text-amber-300">
              {{ associateTypeLabel(associate.type) }}
            </span>
          </div>
          <p v-if="associate.notes" class="mt-1 text-xs text-zinc-400">{{ associate.notes }}</p>
          <p class="mt-1 text-xs text-zinc-500">{{ associate.source }}</p>
        </div>
      </div>
    </div>

    <div v-show="currentTravellerTab === 'profile'" class="mt-5 border-t border-white/15 pt-5">
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm font-semibold text-zinc-200">Skills</p>
        <span class="rounded-md bg-white/10 px-2 py-1 text-xs text-zinc-300">
          {{ currentTravellerSkills.length }}
        </span>
      </div>
      <div v-if="currentTravellerSkills.length" class="mt-3 grid gap-2">
        <div
          v-for="skill in currentTravellerSkills"
          :key="skill.id"
          class="grid grid-cols-[1fr_auto] gap-3 rounded-md bg-white/10 px-3 py-2"
        >
          <div>
            <p class="text-sm font-semibold text-zinc-100">{{ skill.name }}</p>
            <p class="text-xs text-zinc-400">{{ skill.sources.join(', ') }}</p>
          </div>
          <span class="self-center rounded-md bg-zinc-950 px-2 py-1 text-sm font-semibold text-amber-300">
            {{ skill.level }}
          </span>
        </div>
      </div>
      <span v-else class="mt-3 block text-sm text-zinc-400">No skills assigned</span>
    </div>

    <div v-show="currentTravellerTab === 'direction'" class="mt-5 border-t border-white/15 pt-5">
      <p class="text-sm font-semibold text-zinc-200">Term {{ currentTermNumber }} Direction</p>
      <template v-if="selectedTermPath === 'career'">
        <p class="mt-2 text-lg font-semibold">{{ selectedCareer?.name ?? 'No Career Selected' }}</p>
        <p class="text-sm text-zinc-400">{{ selectedAssignment?.name ?? 'No Assignment Selected' }}</p>
      </template>
      <template v-else>
        <p class="mt-2 text-lg font-semibold">{{ selectedEducationOption?.name ?? 'No Education Selected' }}</p>
        <p v-if="selectedEducationEntry" class="text-sm text-zinc-400">Entry {{ checkLabel(selectedEducationEntry) }}</p>
      </template>
    </div>

    <div
      v-if="eventOutcomeLog.length || associates.length || narrativeEvents.length || rollModifiers.length || benefitRollAdjustments.length || careerConstraints.length"
      class="mt-5 border-t border-white/15 pt-5"
      v-show="currentTravellerTab === 'events'"
    >
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm font-semibold text-zinc-200">Event Outcomes</p>
        <span class="rounded-md bg-white/10 px-2 py-1 text-xs text-zinc-300">
          {{ eventOutcomeLog.length }}
        </span>
      </div>
      <div class="mt-3 grid gap-2">
        <div
          v-for="outcome in eventOutcomeLog.slice(0, 5)"
          :key="outcome.id"
          class="rounded-md bg-white/10 px-3 py-2"
        >
          <p class="text-sm font-semibold text-zinc-100">{{ outcome.label }}</p>
          <p class="text-xs text-zinc-400">{{ outcome.source }} · {{ outcome.status }}</p>
        </div>
      </div>
    </div>

    <div v-if="narrativeEvents.length" v-show="currentTravellerTab === 'events'" class="mt-5 border-t border-white/15 pt-5">
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm font-semibold text-zinc-200">Narrative Events</p>
        <span class="rounded-md bg-white/10 px-2 py-1 text-xs text-zinc-300">
          {{ narrativeEvents.length }}
        </span>
      </div>
      <div class="mt-3 grid gap-2">
        <div
          v-for="event in narrativeEvents.slice(-3)"
          :key="event.id"
          class="rounded-md bg-white/10 px-3 py-2"
        >
          <p class="text-sm font-semibold text-zinc-100">{{ event.title }}</p>
          <p v-if="event.notes" class="mt-1 text-xs text-zinc-400">{{ event.notes }}</p>
          <p class="mt-1 text-xs text-zinc-500">{{ event.source }}</p>
        </div>
      </div>
    </div>

    <div v-if="rollModifiers.length" v-show="currentTravellerTab === 'events'" class="mt-5 border-t border-white/15 pt-5">
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm font-semibold text-zinc-200">Roll Modifiers</p>
        <span class="rounded-md bg-white/10 px-2 py-1 text-xs text-zinc-300">
          {{ rollModifiers.filter((modifier) => !modifier.used).length }}
        </span>
      </div>
      <div class="mt-3 grid gap-2">
        <div
          v-for="modifier in rollModifiers"
          :key="modifier.id"
          :class="[
            'rounded-md px-3 py-2',
            modifier.used ? 'bg-white/5 text-zinc-500' : 'bg-white/10 text-zinc-100'
          ]"
        >
          <div class="flex flex-wrap items-start justify-between gap-2">
            <p class="text-sm font-semibold">{{ modifier.label }}</p>
            <span class="rounded-md bg-zinc-950 px-2 py-1 text-xs font-semibold text-amber-300">
              {{ formatDm(modifier.dm) }}
            </span>
          </div>
          <p class="mt-1 text-xs text-zinc-400">
            {{ modifier.scope }} {{ modifier.target }}{{ modifier.used ? ' · used' : '' }}
          </p>
        </div>
      </div>
    </div>

    <div v-if="benefitRollLedger.length || benefitRollAdjustments.length" v-show="currentTravellerTab === 'benefits'" class="mt-5 border-t border-white/15 pt-5">
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm font-semibold text-zinc-200">Benefit Rolls</p>
        <span class="rounded-md bg-white/10 px-2 py-1 text-xs text-zinc-300">
          {{ totalAvailableBenefitRolls }}
        </span>
      </div>
      <div class="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div class="rounded-md bg-white/10 px-2 py-2">
          <p class="text-zinc-400">Earned</p>
          <p class="mt-1 text-sm font-semibold text-zinc-100">{{ totalBenefitRollsEarned }}</p>
        </div>
        <div class="rounded-md bg-white/10 px-2 py-2">
          <p class="text-zinc-400">Adjusted</p>
          <p class="mt-1 text-sm font-semibold text-zinc-100">{{ formatDm(totalBenefitRollAdjustments) }}</p>
        </div>
        <div class="rounded-md bg-white/10 px-2 py-2">
          <p class="text-zinc-400">Available</p>
          <p class="mt-1 text-sm font-semibold text-amber-300">{{ totalAvailableBenefitRolls }}</p>
        </div>
      </div>
      <div class="mt-3 grid gap-2">
        <div
          v-for="entry in benefitRollLedger.slice(-3)"
          :key="entry.id"
          class="rounded-md bg-white/10 px-3 py-2"
        >
          <p class="text-sm font-semibold text-zinc-100">{{ entry.label }}</p>
          <p class="text-xs text-zinc-400">Term {{ entry.termNumber }} · {{ entry.source }}</p>
        </div>
      </div>
    </div>

    <div v-if="totalDebt || medicalCareLog.length" v-show="currentTravellerTab === 'debt'" class="mt-5 border-t border-white/15 pt-5">
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm font-semibold text-zinc-200">Debt</p>
        <span class="rounded-md bg-white/10 px-2 py-1 text-xs text-zinc-300">
          {{ totalDebt.toLocaleString() }} Cr
        </span>
      </div>
      <p v-if="psionicsTrainingCost" class="mt-2 text-xs text-zinc-400">
        Psionics testing/training: {{ psionicsTrainingCost.toLocaleString() }} Cr
      </p>
      <p v-if="medicalDebt" class="mt-1 text-xs text-zinc-400">
        Medical care: {{ medicalDebt.toLocaleString() }} Cr
      </p>
      <div v-if="medicalCareLog.length" class="mt-3 grid gap-2">
        <div
          v-for="entry in medicalCareLog.slice(-3)"
          :key="entry.id"
          class="rounded-md bg-white/10 px-3 py-2"
        >
          <p class="text-sm font-semibold text-zinc-100">
            {{ entry.characteristic.toUpperCase() }} +{{ entry.restored }}
          </p>
          <p class="text-xs text-zinc-400">
            {{ entry.cost.toLocaleString() }} Cr{{ entry.crisis ? ' · crisis care' : '' }}
          </p>
        </div>
      </div>
    </div>

    <div v-show="currentTravellerTab === 'history'" class="mt-5 border-t border-white/15 pt-5">
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm font-semibold text-zinc-200">Term History</p>
        <span class="rounded-md bg-white/10 px-2 py-1 text-xs text-zinc-300">
          {{ termHistory.length }}
        </span>
      </div>
      <div v-if="termHistory.length" class="mt-3 grid gap-2">
        <div
          v-for="term in termHistory"
          :key="term.termNumber"
          class="rounded-md bg-white/10 px-3 py-2"
        >
          <p class="text-sm font-semibold text-zinc-100">Term {{ term.termNumber }} · Age {{ term.startAge }}-{{ term.endAge }}</p>
          <p class="text-xs text-zinc-400">{{ term.summary }}</p>
          <p v-if="term.details.length" class="mt-1 text-xs text-zinc-300">
            {{ term.details.slice(0, 4).join(' · ') }}
          </p>
        </div>
      </div>
      <span v-else class="mt-3 block text-sm text-zinc-400">No completed terms</span>
    </div>
  </aside>
</template>

<style scoped>
.current-traveller-carousel {
  display: flex;
  justify-content: center;
  touch-action: pan-y;
}

.current-traveller-carousel__viewport {
  width: 98%;
  display: flex;
  justify-content: center;
  overflow: hidden;
}

.current-traveller-carousel__track {
  display: flex;
  width: max-content;
  align-items: center;
  gap: 0.375rem;
  will-change: transform;
}

.current-traveller-carousel-surface-forward-enter-active,
.current-traveller-carousel-surface-forward-leave-active,
.current-traveller-carousel-surface-backward-enter-active,
.current-traveller-carousel-surface-backward-leave-active {
  transition:
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 180ms ease;
}

.current-traveller-carousel-surface-forward-leave-active,
.current-traveller-carousel-surface-backward-leave-active {
  position: absolute;
  inset: 0;
}

.current-traveller-carousel-surface-forward-enter-from {
  opacity: 0;
  transform: translateX(0.75rem);
}

.current-traveller-carousel-surface-forward-leave-to {
  opacity: 0;
  transform: translateX(-0.75rem);
}

.current-traveller-carousel-surface-backward-enter-from {
  opacity: 0;
  transform: translateX(-0.75rem);
}

.current-traveller-carousel-surface-backward-leave-to {
  opacity: 0;
  transform: translateX(0.75rem);
}

.current-traveller-carousel__item {
  position: relative;
  display: inline-flex;
  width: 5.6rem;
  flex: 0 0 5.6rem;
  height: 2.45rem;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  padding: 0;
  color: rgb(224 247 255 / 0.94);
  font-size: 0.72rem;
  font-weight: 700;
  text-align: center;
  transition:
    opacity 260ms ease,
    filter 260ms ease;
}

.current-traveller-carousel__surface {
  position: relative;
  display: inline-flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
}

.current-traveller-carousel__surface::before {
  content: '';
  position: absolute;
  inset: 1px;
  background: linear-gradient(180deg, rgb(8 21 34 / 0.86), rgb(5 14 25 / 0.92));
  z-index: 0;
}

.current-traveller-carousel__item.is-current {
  clip-path: polygon(0 0, calc(100% - 0.5rem) 0, 100% 0.5rem, 100% 100%, 0.5rem 100%, 0 calc(100% - 0.5rem));
  border-color: rgb(103 232 249 / 0.54);
  box-shadow:
    inset 0 0 0 1px rgb(103 232 249 / 0.16),
    0 0 18px rgb(34 211 238 / 0.12);
  transform: scale(1.18);
  z-index: 2;
  overflow: visible;
}

.current-traveller-carousel__marker {
  position: absolute;
  top: 50%;
  color: rgb(165 243 252 / 0.96);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.035rem;
  height: 1.035rem;
  pointer-events: none;
  z-index: 4;
  filter:
    drop-shadow(0 0 4px rgb(103 232 249 / 0.52))
    drop-shadow(0 0 10px rgb(34 211 238 / 0.42));
}

.current-traveller-carousel__marker--left {
  left: -0.92rem;
  transform: translate(0, -50%);
}

.current-traveller-carousel__marker--left :deep(svg) {
  transform: rotate(180deg);
}

.current-traveller-carousel__marker--right {
  right: -0.92rem;
  transform: translate(0, -50%);
}

.current-traveller-carousel__marker :deep(svg) {
  width: 100%;
  height: 100%;
}

.current-traveller-carousel__item.is-current .current-traveller-carousel__surface::before {
  clip-path: polygon(0 0, calc(100% - 0.42rem) 0, 100% 0.42rem, 100% 100%, 0.42rem 100%, 0 calc(100% - 0.42rem));
  background:
    linear-gradient(135deg, rgb(66 214 255 / 0.34), rgb(26 122 162 / 0.28) 48%, rgb(14 66 93 / 0.88)),
    linear-gradient(180deg, rgb(11 59 81 / 0.94), rgb(8 30 48 / 0.98));
}

.current-traveller-carousel__item.is-near {
  clip-path: polygon(0 0, calc(100% - 0.42rem) 0, 100% 0.42rem, 100% 100%, 0.42rem 100%, 0 calc(100% - 0.42rem));
  opacity: 0.52;
  transform: scale(0.74);
}

.current-traveller-carousel__item.is-near .current-traveller-carousel__surface::before {
  clip-path: polygon(0 0, calc(100% - 0.34rem) 0, 100% 0.34rem, 100% 100%, 0.34rem 100%, 0 calc(100% - 0.34rem));
}

.current-traveller-carousel__item.is-far {
  clip-path: polygon(0 0, calc(100% - 0.42rem) 0, 100% 0.42rem, 100% 100%, 0.42rem 100%, 0 calc(100% - 0.42rem));
  opacity: 0;
  transform: scale(0.62);
  filter: saturate(0.8);
  pointer-events: none;
}

.current-traveller-carousel__item.is-far::before {
  clip-path: polygon(0 0, calc(100% - 0.34rem) 0, 100% 0.34rem, 100% 100%, 0.34rem 100%, 0 calc(100% - 0.34rem));
}

.current-traveller-carousel__label {
  position: relative;
  z-index: 1;
  overflow: hidden;
  max-width: 100%;
  padding: 0 0.35rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
