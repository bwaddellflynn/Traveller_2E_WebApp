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
  gmCharacteristicAdjustmentsEnabled,
  selectedBackgroundSkills,
  statRolls,
  values,
} = storeToRefs(characterCreator)
</script>

<template>
  <div class="grid gap-6">
    <div class="hud-panel rounded-lg border p-5 shadow-sm">
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
              ? 'border-cyan-400/25 bg-slate-900/80 text-cyan-200/60'
              : 'border-cyan-300/70 bg-cyan-400/10 text-cyan-100'
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
            <span class="rounded-md border border-cyan-400/30 bg-slate-950/70 px-2 py-1 text-sm font-semibold text-cyan-100">DM {{ formatDm(item.dm) }}</span>
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

    <div class="hud-panel rounded-lg border p-5 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-semibold">Background Skills</h2>
          <p class="mt-1 text-sm text-zinc-600">Choose {{ backgroundSkillLimit }} based on EDU DM {{ formatDm(diceModifier(values.edu)) }}.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <span class="rounded-md border border-cyan-300/60 bg-cyan-400/10 px-3 py-2 font-mono text-sm font-semibold text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.18)]">
            {{ selectedBackgroundSkills.length }} / {{ backgroundSkillLimit }}
          </span>
          <button
            class="hud-link h-10 rounded-md px-3 text-sm font-semibold"
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
          class="rounded-md border border-cyan-400/25 bg-slate-950/70 px-2 py-1 text-xs font-medium text-cyan-100"
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
              ? 'border-cyan-300 bg-cyan-400/20 text-cyan-50 shadow-[0_0_18px_rgba(34,211,238,0.2)]'
              : canSelectBackgroundSkill(skill.id)
                ? 'border-cyan-400/25 bg-slate-950/55 text-cyan-100 hover:border-cyan-300'
                : 'cursor-not-allowed border-cyan-950/60 bg-slate-950/35 text-cyan-100/35'
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
