<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
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
  canSelectBackgroundSkill,
  diceModifier,
  formatDm,
  rollCharacteristics,
  skillName,
  toggleBackgroundSkill,
  toggleBackgroundSkillsCollapsed,
} = characterCreator
const {
  assignedRollIds,
  assignedRollIdSet,
  backgroundSkillLimit,
  backgroundSkillOptions,
  backgroundSkillsCollapsed,
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
</script>

<template>
  <div class="grid gap-6">
    <div v-if="showCharacteristics" class="hud-panel rounded-lg border p-5 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-semibold">Characteristics</h2>
          <p class="mt-1 text-sm text-zinc-600">Roll six 2D scores, then assign each score to a characteristic.</p>
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
            selectedBackgroundSkills.includes(skill.id)
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
          <AppIcon v-if="selectedBackgroundSkills.includes(skill.id)" name="check" class="shrink-0" />
        </button>
      </div>
    </div>
  </div>
</template>
