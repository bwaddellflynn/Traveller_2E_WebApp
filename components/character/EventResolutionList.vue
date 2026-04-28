<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { reactive } from 'vue'
import { useCharacterCreatorStore } from '~/stores/characterCreator'

const characterCreator = useCharacterCreatorStore()
const {
  resolveEventChoice,
  resolveEventCharacteristicAdjustment,
  resolveEventMedicalCare,
  resolveEventOutcomeChoice,
  resolveManualEventResolution,
  rollEventResolutionCheck,
  enterManualEventResolutionCheck,
  rollEventResolutionTable,
  enterManualEventResolutionTable,
  eventResolutionSelectedLabel,
  resolveEventAssociate,
  associateTypeLabel,
  skillOptionLabel,
} = characterCreator
const {
  pendingEventResolutions,
} = storeToRefs(characterCreator)

const manualTableRolls = reactive<Record<string, number | null>>({})
const manualCheckRolls = reactive<Record<string, number | null>>({})
const manualCharacteristicAmounts = reactive<Record<string, number | null>>({})
const medicalRestorePoints = reactive<Record<string, number | null>>({})
const associateForms = reactive<Record<string, { type: string; name: string; notes: string }>>({})

const associateForm = (resolution: { id: string; associateTypes?: string[] }) => {
  if (!associateForms[resolution.id]) {
    associateForms[resolution.id] = {
      type: resolution.associateTypes?.[0] ?? 'associate',
      name: '',
      notes: '',
    }
  }

  return associateForms[resolution.id]
}
</script>

<template>
  <div v-if="pendingEventResolutions.length" class="mt-3 grid gap-3">
    <div
      v-for="resolution in pendingEventResolutions"
      :key="resolution.id"
      :class="[
        'rounded-md p-3 text-sm',
        resolution.resolved ? 'bg-emerald-50 text-emerald-950' : 'bg-amber-50 text-amber-950'
      ]"
    >
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="font-semibold">{{ resolution.resolved ? 'Resolved' : 'Resolution needed' }}</p>
          <p class="mt-1">{{ resolution.label }}</p>
          <p v-if="resolution.kind === 'check' && resolution.check && !resolution.resolved" class="mt-1 text-xs">
            {{ resolution.check.label }} · DM {{ resolution.check.dm >= 0 ? `+${resolution.check.dm}` : resolution.check.dm }} · Target {{ resolution.check.target }}+
          </p>
          <p v-if="resolution.selected" class="mt-1 text-xs">Selected: {{ eventResolutionSelectedLabel(resolution) }}</p>
          <p v-if="resolution.details" class="mt-2 leading-6 text-zinc-700">{{ resolution.details }}</p>
        </div>
      </div>

      <div v-if="resolution.kind === 'skill_choice' && !resolution.resolved" class="mt-3 flex flex-wrap gap-2">
        <button
          v-for="choice in resolution.options"
          :key="choice"
          class="h-9 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
          type="button"
          @click="resolveEventChoice(resolution.id, choice)"
        >
          {{ skillOptionLabel(choice) }}
        </button>
      </div>

      <div v-if="resolution.kind === 'characteristic_adjustment' && !resolution.resolved" class="mt-3 grid gap-2">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="characteristic in resolution.characteristicOptions"
            :key="characteristic"
            class="h-9 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold uppercase text-amber-900 hover:border-amber-600"
            type="button"
            @click="resolveEventCharacteristicAdjustment(resolution.id, characteristic)"
          >
            {{ characteristic }}
            <span v-if="typeof resolution.characteristicAmount === 'number'">
              {{ resolution.characteristicAmount >= 0 ? `+${resolution.characteristicAmount}` : resolution.characteristicAmount }}
            </span>
            <span v-else>
              {{ resolution.characteristicAmount }}
            </span>
          </button>
        </div>
        <div v-if="typeof resolution.characteristicAmount === 'string'" class="flex flex-wrap items-center gap-2">
          <input
            v-model.number="manualCharacteristicAmounts[resolution.id]"
            class="h-9 w-24 rounded-md border border-amber-300 bg-white px-2 text-sm text-amber-950"
            max="6"
            min="1"
            placeholder="1D"
            type="number"
          >
          <button
            v-for="characteristic in resolution.characteristicOptions"
            :key="`${resolution.id}-${characteristic}-manual`"
            class="h-9 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold uppercase text-amber-900 hover:border-amber-600"
            type="button"
            @click="resolveEventCharacteristicAdjustment(resolution.id, characteristic, manualCharacteristicAmounts[resolution.id] ?? Number.NaN)"
          >
            Apply to {{ characteristic }}
          </button>
        </div>
      </div>

      <button
        v-if="resolution.kind === 'manual' && !resolution.resolved"
        class="mt-3 h-9 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
        type="button"
        @click="resolveManualEventResolution(resolution.id)"
      >
        Mark resolved
      </button>

      <div v-if="resolution.kind === 'medical_care' && !resolution.resolved" class="mt-3 grid gap-2">
        <p class="text-xs">
          Cost: {{ resolution.medicalCostPerPoint?.toLocaleString() }} Cr per point.
          <span v-if="resolution.medicalCrisis" class="font-semibold">At least 1 point must be restored.</span>
        </p>
        <div class="flex flex-wrap items-center gap-2">
          <input
            v-model.number="medicalRestorePoints[resolution.id]"
            class="h-9 w-28 rounded-md border border-amber-300 bg-white px-2 text-sm text-amber-950"
            :max="resolution.medicalMaxRestore"
            :min="resolution.medicalCrisis ? 1 : 0"
            placeholder="Points"
            type="number"
          >
          <button
            class="h-9 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
            type="button"
            @click="resolveEventMedicalCare(resolution.id, medicalRestorePoints[resolution.id] ?? (resolution.medicalCrisis ? 1 : 0))"
          >
            Apply Care
          </button>
          <button
            v-if="!resolution.medicalCrisis"
            class="h-9 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
            type="button"
            @click="resolveEventMedicalCare(resolution.id, 0)"
          >
            Decline
          </button>
        </div>
      </div>

      <div v-if="resolution.kind === 'choice' && !resolution.resolved" class="mt-3 flex flex-wrap gap-2">
        <button
          v-for="option in resolution.choiceOptions"
          :key="option.id"
          class="h-9 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
          type="button"
          @click="resolveEventOutcomeChoice(resolution.id, option.id)"
        >
          {{ option.label }}
        </button>
      </div>

      <div v-if="resolution.kind === 'associate' && !resolution.resolved" class="mt-3 grid gap-2">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="type in resolution.associateTypes"
            :key="type"
            :class="[
              'h-9 rounded-md border px-3 text-sm font-semibold',
              associateForm(resolution).type === type
                ? 'border-amber-700 bg-amber-700 text-white'
                : 'border-amber-300 bg-white text-amber-900 hover:border-amber-600'
            ]"
            type="button"
            @click="associateForm(resolution).type = type"
          >
            {{ associateTypeLabel(type) }}
          </button>
        </div>
        <div class="grid gap-2 sm:grid-cols-2">
          <input
            v-model="associateForm(resolution).name"
            class="h-9 rounded-md border border-amber-300 bg-white px-2 text-sm text-amber-950"
            placeholder="Name or short label"
            type="text"
          >
          <input
            v-model="associateForm(resolution).notes"
            class="h-9 rounded-md border border-amber-300 bg-white px-2 text-sm text-amber-950"
            :placeholder="resolution.associateCount && resolution.associateCount !== 1 ? `Notes / count ${resolution.associateCount}` : 'Notes'"
            type="text"
          >
        </div>
        <button
          class="h-9 w-fit rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
          type="button"
          @click="resolveEventAssociate(resolution.id, associateForm(resolution).type, associateForm(resolution).name, associateForm(resolution).notes)"
        >
          Add {{ associateTypeLabel(associateForm(resolution).type) }}
        </button>
      </div>

      <div v-if="resolution.kind === 'check' && !resolution.resolved" class="mt-3 flex flex-wrap items-center gap-2">
        <button
          class="h-9 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
          type="button"
          @click="rollEventResolutionCheck(resolution.id)"
        >
          Roll 2D
        </button>
        <input
          v-model.number="manualCheckRolls[resolution.id]"
          class="h-9 w-20 rounded-md border border-amber-300 bg-white px-2 text-sm text-amber-950"
          max="12"
          min="2"
          type="number"
        >
        <button
          class="h-9 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
          type="button"
          @click="enterManualEventResolutionCheck(resolution.id, manualCheckRolls[resolution.id] ?? Number.NaN)"
        >
          Apply
        </button>
      </div>

      <div v-if="resolution.kind === 'table_roll' && !resolution.resolved" class="mt-3 flex flex-wrap items-center gap-2">
        <button
          class="h-9 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
          type="button"
          @click="rollEventResolutionTable(resolution.id)"
        >
          Roll {{ resolution.diceCount }}D
        </button>
        <input
          v-model.number="manualTableRolls[resolution.id]"
          class="h-9 w-20 rounded-md border border-amber-300 bg-white px-2 text-sm text-amber-950"
          :max="resolution.diceCount === 2 ? 12 : 6"
          :min="resolution.diceCount === 2 ? 2 : 1"
          type="number"
        >
        <button
          class="h-9 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
          type="button"
          @click="enterManualEventResolutionTable(resolution.id, manualTableRolls[resolution.id] ?? Number.NaN)"
        >
          Apply
        </button>
      </div>
    </div>
  </div>
</template>
