<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useCharacterCreatorStore } from '~/stores/characterCreator'

const characterCreator = useCharacterCreatorStore()
const {
  forcePrisonerCareer,
  grantPsionicsTestingOverride,
  selectTermTab,
  toggleGmOverrideControls,
  toggleGmOverrideOption,
} = characterCreator
const {
  activeCreatorTab,
  gmOverrideMenuOpen,
  gmOverrideOptions,
  setupComplete,
  termTabs,
} = storeToRefs(characterCreator)

const isMobileViewport = ref(false)
const setupTabActive = computed(() => ['creation', 'setup-stats', 'setup-skills'].includes(activeCreatorTab.value))
let mobileViewportQuery: MediaQueryList | null = null
const handleViewportChange = (event: MediaQueryListEvent) => syncViewportMode(event.matches)

const syncViewportMode = (matches: boolean) => {
  isMobileViewport.value = matches
  if (matches && activeCreatorTab.value === 'creation') activeCreatorTab.value = 'setup-stats'
  if (!matches && ['setup-stats', 'setup-skills'].includes(activeCreatorTab.value)) activeCreatorTab.value = 'creation'
}

onMounted(() => {
  mobileViewportQuery = window.matchMedia('(max-width: 639px)')
  syncViewportMode(mobileViewportQuery.matches)
  mobileViewportQuery.addEventListener('change', handleViewportChange)
})

onBeforeUnmount(() => {
  if (!mobileViewportQuery) return
  mobileViewportQuery.removeEventListener('change', handleViewportChange)
})

</script>

<template>
  <div class="flex items-start gap-2 border-b border-zinc-200 p-3">
    <div class="creator-tab-strip no-scrollbar min-w-0 flex-1 overflow-x-auto">
      <div class="flex min-w-max items-center gap-2 pr-1">
        <button
          :class="[
            'hidden h-10 shrink-0 items-center justify-center rounded-md px-3 text-center text-sm font-semibold sm:inline-flex',
            setupTabActive
              ? 'bg-zinc-950 text-white'
              : 'text-zinc-700 hover:bg-stone-100 hover:text-zinc-950'
          ]"
          type="button"
          @click="activeCreatorTab = 'creation'"
        >
          Setup
        </button>
        <button
          :class="[
            'inline-flex h-10 shrink-0 items-center justify-center rounded-md px-3 text-center text-sm font-semibold sm:hidden',
            activeCreatorTab === 'setup-stats'
              ? 'bg-zinc-950 text-white'
              : 'text-zinc-700 hover:bg-stone-100 hover:text-zinc-950'
          ]"
          type="button"
          @click="activeCreatorTab = 'setup-stats'"
        >
          Stats
        </button>
        <button
          :class="[
            'inline-flex h-10 shrink-0 items-center justify-center rounded-md px-3 text-center text-sm font-semibold sm:hidden',
            activeCreatorTab === 'setup-skills'
              ? 'bg-zinc-950 text-white'
              : 'text-zinc-700 hover:bg-stone-100 hover:text-zinc-950'
          ]"
          type="button"
          @click="activeCreatorTab = 'setup-skills'"
        >
          Skills
        </button>
        <button
          v-for="termNumber in termTabs"
          :key="termNumber"
          :class="[
            'h-10 shrink-0 rounded-md px-3 text-sm font-semibold',
            activeCreatorTab === `term-${termNumber}`
              ? 'bg-zinc-950 text-white'
              : termNumber === 1 && !setupComplete
                ? 'cursor-not-allowed text-zinc-300'
                : 'text-zinc-700 hover:bg-stone-100 hover:text-zinc-950'
          ]"
          :disabled="termNumber === 1 && !setupComplete"
          type="button"
          @click="selectTermTab(termNumber)"
        >
          Term {{ termNumber }}
        </button>
      </div>
    </div>
    <div class="relative ml-auto">
      <button
        :class="[
          'inline-flex h-10 w-10 items-center justify-center rounded-md border text-amber-700 hover:border-amber-600 hover:bg-amber-50 hover:text-amber-900',
          gmOverrideMenuOpen ? 'border-amber-600 bg-amber-50' : 'border-zinc-300'
        ]"
        :aria-expanded="gmOverrideMenuOpen"
        title="Game Master override options"
        type="button"
        @click="toggleGmOverrideControls"
      >
        <AppIcon name="sliders" />
      </button>

      <div
        v-if="gmOverrideMenuOpen"
        class="absolute right-0 z-20 mt-2 w-72 rounded-md border border-amber-200 bg-white p-3 text-sm shadow-lg"
      >
        <p class="font-semibold text-zinc-900">Game Master overrides</p>
        <div class="mt-3 grid gap-2">
          <label class="flex items-start gap-2 rounded-md px-2 py-1 hover:bg-amber-50">
            <input
              class="mt-1 accent-amber-700"
              type="checkbox"
              :checked="gmOverrideOptions.manualCheckRollEntry"
              @change="toggleGmOverrideOption('manualCheckRollEntry')"
            >
            <span>
              <span class="block font-medium text-zinc-800">Manual check rolls</span>
              <span class="block text-xs text-zinc-500">Qualification, survival, advancement, graduation, and event checks.</span>
            </span>
          </label>
          <label class="flex items-start gap-2 rounded-md px-2 py-1 hover:bg-amber-50">
            <input
              class="mt-1 accent-amber-700"
              type="checkbox"
              :checked="gmOverrideOptions.manualTableRollEntry"
              @change="toggleGmOverrideOption('manualTableRollEntry')"
            >
            <span>
              <span class="block font-medium text-zinc-800">Manual table rolls</span>
              <span class="block text-xs text-zinc-500">Events, mishaps, skill tables, and prisoner parole threshold.</span>
            </span>
          </label>
          <label class="flex items-start gap-2 rounded-md px-2 py-1 hover:bg-amber-50">
            <input
              class="mt-1 accent-amber-700"
              type="checkbox"
              :checked="gmOverrideOptions.manualAgingRollEntry"
              @change="toggleGmOverrideOption('manualAgingRollEntry')"
            >
            <span>
              <span class="block font-medium text-zinc-800">Manual aging rolls</span>
              <span class="block text-xs text-zinc-500">Enter aging roll totals.</span>
            </span>
          </label>
          <label class="flex items-start gap-2 rounded-md px-2 py-1 hover:bg-amber-50">
            <input
              class="mt-1 accent-amber-700"
              type="checkbox"
              :checked="gmOverrideOptions.manualBenefitRollEntry"
              @change="toggleGmOverrideOption('manualBenefitRollEntry')"
            >
            <span>
              <span class="block font-medium text-zinc-800">Manual benefit rolls</span>
              <span class="block text-xs text-zinc-500">Mustering-out and benefit wager totals.</span>
            </span>
          </label>
          <label class="flex items-start gap-2 rounded-md px-2 py-1 hover:bg-amber-50">
            <input
              class="mt-1 accent-amber-700"
              type="checkbox"
              :checked="gmOverrideOptions.manualPsionicsRollEntry"
              @change="toggleGmOverrideOption('manualPsionicsRollEntry')"
            >
            <span>
              <span class="block font-medium text-zinc-800">Manual psionics rolls</span>
              <span class="block text-xs text-zinc-500">PSI testing and talent learning totals.</span>
            </span>
          </label>
          <label class="flex items-start gap-2 rounded-md px-2 py-1 hover:bg-amber-50">
            <input
              class="mt-1 accent-amber-700"
              type="checkbox"
              :checked="gmOverrideOptions.outcomeOverrides"
              @change="toggleGmOverrideOption('outcomeOverrides')"
            >
            <span>
              <span class="block font-medium text-zinc-800">Outcome overrides</span>
              <span class="block text-xs text-zinc-500">Flip success/failure after a roll.</span>
            </span>
          </label>
          <label class="flex items-start gap-2 rounded-md px-2 py-1 hover:bg-amber-50">
            <input
              class="mt-1 accent-amber-700"
              type="checkbox"
              :checked="gmOverrideOptions.characteristicAdjustments"
              @change="toggleGmOverrideOption('characteristicAdjustments')"
            >
            <span>
              <span class="block font-medium text-zinc-800">Characteristic adjustments</span>
              <span class="block text-xs text-zinc-500">Adjust setup characteristic values directly.</span>
            </span>
          </label>
        </div>
        <div class="mt-3 border-t border-amber-100 pt-3">
          <p class="text-xs font-semibold uppercase tracking-wide text-zinc-500">Apply override</p>
          <div class="mt-2 grid gap-2">
            <button
              class="h-9 rounded-md border border-amber-300 bg-white px-3 text-left text-sm font-semibold text-amber-900 hover:border-amber-600 hover:bg-amber-50"
              type="button"
              @click="forcePrisonerCareer"
            >
              Send to Prisoner career
            </button>
            <button
              class="h-9 rounded-md border border-amber-300 bg-white px-3 text-left text-sm font-semibold text-amber-900 hover:border-amber-600 hover:bg-amber-50"
              type="button"
              @click="grantPsionicsTestingOverride"
            >
              Enable psionics testing
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
