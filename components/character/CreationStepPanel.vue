<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCharacterCreatorStore } from '~/stores/characterCreator'

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
  selectedBackgroundSkills,
  statRolls,
  values,
} = storeToRefs(characterCreator)
</script>

<template>
  <div class="grid gap-6">
    <div class="rounded-lg border border-zinc-300 bg-white p-5 shadow-sm">
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

      <div class="mt-5 flex flex-wrap gap-2">
        <span
          v-for="roll in statRolls"
          :key="roll.id"
          :class="[
            'rounded-md border px-3 py-2 text-sm font-semibold',
            assignedRollIdSet.has(roll.id)
              ? 'border-zinc-300 bg-zinc-100 text-zinc-500'
              : 'border-amber-300 bg-amber-50 text-amber-900'
          ]"
        >
          {{ roll.value }}
        </span>
      </div>

      <div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <label
          v-for="item in characteristicRows"
          :key="item.id"
          class="rounded-md border border-zinc-200 bg-stone-50 p-4"
        >
          <span class="flex items-start justify-between gap-3">
            <span>
              <span class="block text-sm font-semibold">{{ item.abbreviation }}</span>
              <span class="block text-xs text-zinc-600">{{ item.name }}</span>
            </span>
            <span class="rounded-md bg-white px-2 py-1 text-sm font-semibold text-zinc-700">DM {{ formatDm(item.dm) }}</span>
          </span>
          <select
            v-model="assignedRollIds[item.id]"
            class="mt-4 h-12 w-full rounded-md border border-zinc-300 bg-white px-3 text-xl font-semibold outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
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
          <label class="mt-3 grid gap-1">
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

    <div class="rounded-lg border border-zinc-300 bg-white p-5 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-semibold">Background Skills</h2>
          <p class="mt-1 text-sm text-zinc-600">Choose {{ backgroundSkillLimit }} based on EDU DM {{ formatDm(diceModifier(values.edu)) }}.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <span class="rounded-md bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900">
            {{ selectedBackgroundSkills.length }} / {{ backgroundSkillLimit }}
          </span>
          <button
            class="h-10 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:border-amber-600"
            type="button"
            @click="toggleBackgroundSkillsCollapsed"
          >
            {{ backgroundSkillsCollapsed ? 'Expand' : 'Minimize' }}
          </button>
        </div>
      </div>

      <div v-if="backgroundSkillsCollapsed" class="mt-5 flex flex-wrap gap-2">
        <span
          v-for="skillId in selectedBackgroundSkills"
          :key="skillId"
          class="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700"
        >
          {{ skillName(skillId) }}
        </span>
        <span v-if="!selectedBackgroundSkills.length" class="text-sm text-zinc-500">No background skills selected.</span>
      </div>

      <div v-else class="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <button
          v-for="skill in backgroundSkillOptions"
          :key="skill.id"
          :class="[
            'flex h-11 items-center justify-between rounded-md border px-3 text-left text-sm font-medium',
            selectedBackgroundSkills.includes(skill.id)
              ? 'border-zinc-950 bg-zinc-950 text-white'
              : canSelectBackgroundSkill(skill.id)
                ? 'border-zinc-300 bg-white text-zinc-700 hover:border-amber-600'
                : 'cursor-not-allowed border-zinc-200 bg-zinc-50 text-zinc-400'
          ]"
          :disabled="!canSelectBackgroundSkill(skill.id)"
          type="button"
          @click="toggleBackgroundSkill(skill.id)"
        >
          <span>{{ skill.name }}</span>
          <AppIcon v-if="selectedBackgroundSkills.includes(skill.id)" name="check" />
        </button>
      </div>
    </div>
  </div>
</template>
