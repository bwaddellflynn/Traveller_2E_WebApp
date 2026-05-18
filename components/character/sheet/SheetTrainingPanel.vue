<script setup lang="ts">
import type { TravellerSkillTrainingActive, TravellerSkillTrainingHistory } from '~/types/traveller'

type TrainingSkillOption = {
  id: string
  name: string
  specialities?: string[]
  specialityMode?: 'shared-zero' | 'independent'
}

defineProps<{
  activeTraining: TravellerSkillTrainingActive | null
  history: TravellerSkillTrainingHistory[]
  skillOptions: TrainingSkillOption[]
  selectedSkillId: string
  selectedSpeciality: string
  customSpeciality: string
  targetLevel: number
  characteristic: 'edu' | 'str' | 'dex' | 'end'
  currentLevel: number | null
  targetLevelOptions: number[]
  requiredStudyPeriods: number
  validation: string
  canStart: boolean
  canRoll: boolean
  progressLabel: string
  rollSummary: string
}>()

const emit = defineEmits<{
  (event: 'update:selectedSkillId', value: string): void
  (event: 'update:selectedSpeciality', value: string): void
  (event: 'update:customSpeciality', value: string): void
  (event: 'update:targetLevel', value: number): void
  (event: 'update:characteristic', value: 'edu' | 'str' | 'dex' | 'end'): void
  (event: 'start'): void
  (event: 'cancel'): void
  (event: 'addWeek', amount: number): void
  (event: 'roll'): void
}>()

const characteristicOptions = [
  { value: 'edu', label: 'EDU' },
  { value: 'str', label: 'STR' },
  { value: 'dex', label: 'DEX' },
  { value: 'end', label: 'END' },
] as const

const eventValue = (event: Event) => (event.target as HTMLInputElement | HTMLSelectElement | null)?.value ?? ''
const updateSelectedSkill = (event: Event) => emit('update:selectedSkillId', eventValue(event))
const updateSelectedSpeciality = (event: Event) => emit('update:selectedSpeciality', eventValue(event))
const updateCustomSpeciality = (event: Event) => emit('update:customSpeciality', eventValue(event))
const updateTargetLevel = (event: Event) => emit('update:targetLevel', Number(eventValue(event)))
const updateCharacteristic = (event: Event) => {
  const value = eventValue(event)
  if (value === 'edu' || value === 'str' || value === 'dex' || value === 'end') emit('update:characteristic', value)
}
</script>

<template>
  <div class="sheet-training-box">
    <div class="sheet-training-title">Training</div>

    <template v-if="activeTraining">
      <div class="sheet-training-active">
        <div>
          <span class="sheet-training-label">Current Training</span>
          <strong>{{ activeTraining.skillName }}<template v-if="activeTraining.speciality"> ({{ activeTraining.speciality }})</template> {{ activeTraining.targetLevel }}</strong>
        </div>
        <button class="sheet-add sheet-add--compact" type="button" @click="$emit('cancel')">
          Cancel
        </button>
      </div>

      <div class="sheet-training-progress">
        <div>
          <span>Completed Weeks</span>
          <strong>{{ activeTraining.completedWeeks }}</strong>
        </div>
        <div>
          <span>Study Periods</span>
          <strong>{{ activeTraining.successfulStudyPeriods }} / {{ activeTraining.requiredStudyPeriods }}</strong>
        </div>
        <div>
          <span>Failures</span>
          <strong>{{ activeTraining.failedStudyPeriods }}</strong>
        </div>
      </div>

      <p class="sheet-training-note">{{ progressLabel }}</p>

      <div class="sheet-training-actions">
        <button class="sheet-add sheet-add--compact" type="button" @click="$emit('addWeek', 1)">
          +1 Week
        </button>
        <button class="sheet-add sheet-add--compact" type="button" @click="$emit('addWeek', 8)">
          +8 Weeks
        </button>
        <button class="sheet-add sheet-add--compact" type="button" :disabled="activeTraining.completedWeeks <= 0" @click="$emit('addWeek', -1)">
          -1 Week
        </button>
        <button class="sheet-add sheet-add--compact sheet-add--primary" type="button" :disabled="!canRoll" @click="$emit('roll')">
          Roll Study Period
        </button>
      </div>

      <p v-if="rollSummary" class="sheet-training-note sheet-training-note--roll">{{ rollSummary }}</p>
    </template>

    <template v-else>
      <div class="sheet-training-form">
        <label class="sheet-line-field sheet-line-field--training">
          <span>Skill:</span>
          <select class="sheet-line-input" :value="selectedSkillId" @change="updateSelectedSkill">
            <option value="">Select skill</option>
            <option v-for="skill in skillOptions" :key="skill.id" :value="skill.id">
              {{ skill.name }}
            </option>
          </select>
        </label>

        <label class="sheet-line-field sheet-line-field--training">
          <span>Speciality:</span>
          <select class="sheet-line-input" :value="selectedSpeciality" @change="updateSelectedSpeciality">
            <option value="">General / none</option>
            <option
              v-for="skill in skillOptions.find((item) => item.id === selectedSkillId)?.specialities ?? []"
              :key="skill"
              :value="skill"
            >
              {{ skill }}
            </option>
            <option value="__custom__">Custom...</option>
          </select>
        </label>

        <label v-if="selectedSpeciality === '__custom__'" class="sheet-line-field sheet-line-field--training">
          <span>Custom:</span>
          <input class="sheet-line-input" :value="customSpeciality" @input="updateCustomSpeciality">
        </label>

        <div class="sheet-training-form__split">
          <label class="sheet-line-field sheet-line-field--training">
            <span>Target:</span>
            <select class="sheet-line-input" :value="targetLevel" @change="updateTargetLevel">
              <option v-for="level in targetLevelOptions" :key="level" :value="level">
                Level {{ level }}
              </option>
            </select>
          </label>

          <label class="sheet-line-field sheet-line-field--training">
            <span>Check:</span>
            <select class="sheet-line-input" :value="characteristic" @change="updateCharacteristic">
              <option v-for="option in characteristicOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
        </div>
      </div>

      <p class="sheet-training-note">
        Current: {{ currentLevel ?? 'untrained' }}. Required: {{ requiredStudyPeriods }} successful Study Period{{ requiredStudyPeriods === 1 ? '' : 's' }}.
      </p>
      <p v-if="validation" class="sheet-training-note sheet-training-note--warning">{{ validation }}</p>
      <button class="sheet-add sheet-add--compact sheet-add--primary" type="button" :disabled="!canStart" @click="$emit('start')">
        Start Training
      </button>
    </template>

    <div v-if="history.length" class="sheet-training-history">
      <span class="sheet-training-label">Recent Training</span>
      <p v-for="entry in history.slice(0, 2)" :key="entry.id">
        {{ entry.skillName }}<template v-if="entry.speciality"> ({{ entry.speciality }})</template> {{ entry.targetLevel }} - {{ entry.outcome }}
      </p>
    </div>
  </div>
</template>
