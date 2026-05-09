<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, reactive } from 'vue'
import { useCharacterCreatorStore } from '~/stores/characterCreator'

const props = defineProps<{
  sourcePrefix?: string
  resolutionIds?: string[]
}>()

const emit = defineEmits<{
  (event: 'show-roll', payload: {
    title: string
    result: string
    modifier?: number
    total?: number
    dice?: number[]
  }): void
  (event: 'resolved'): void
}>()

const characterCreator = useCharacterCreatorStore()
const {
  resolveEventChoice,
  resolveEventCharacteristicAdjustment,
  resolveEventMedicalCare,
  resolveEventOutcomeChoice,
  resolveManualEventResolution,
  setEventResolutionCheckSkill,
  rollEventResolutionCheck,
  enterManualEventResolutionCheck,
  rollEventResolutionSkillTable,
  enterManualEventResolutionSkillTable,
  rollEventResolutionBenefitWager,
  enterManualEventResolutionBenefitWager,
  declineEventResolutionBenefitWager,
  rollEventResolutionPrisonLawyer,
  enterManualEventResolutionPrisonLawyer,
  rollEventResolutionTable,
  enterManualEventResolutionTable,
  rollEventResolutionAssociateCount,
  enterManualEventResolutionAssociateCount,
  eventResolutionSelectedLabel,
  resolveEventAssociate,
  resolveEventAssociateInjury,
  resolveEventNarrative,
  associateTypeLabel,
  skillOptionLabel,
} = characterCreator
const {
  pendingEventResolutions,
  gmManualCheckRollEntryEnabled,
  gmManualTableRollEntryEnabled,
  gmManualBenefitRollEntryEnabled,
} = storeToRefs(characterCreator)

const visibleEventResolutions = computed(() => {
  if (props.resolutionIds?.length) {
    const allowedIds = new Set(props.resolutionIds)
    return pendingEventResolutions.value.filter((resolution) => allowedIds.has(resolution.id))
  }

  if (!props.sourcePrefix) return pendingEventResolutions.value

  return pendingEventResolutions.value.filter((resolution) => {
    return resolution.source === props.sourcePrefix || resolution.source.startsWith(`${props.sourcePrefix}:`)
  })
})

const manualTableRolls = reactive<Record<string, number | null>>({})
const manualCheckRolls = reactive<Record<string, number | null>>({})
const benefitWagerForms = reactive<Record<string, { skill: string; wagered: number | null; total: number | null }>>({})
const prisonLawyerForms = reactive<Record<string, { advocateLevel: number; total: number | null; reductionDie: number | null }>>({})
const narrativeNotes = reactive<Record<string, string>>({})
const manualCharacteristicAmounts = reactive<Record<string, number | null>>({})
const medicalRestorePoints = reactive<Record<string, number | null>>({})
const associateForms = reactive<Record<string, { type: string; name: string; notes: string }>>({})
const manualAssociateCounts = reactive<Record<string, number | null>>({})
const associateInjuryForms = reactive<Record<string, { targetId: string; name: string; firstRoll: number | null; secondRoll: number | null }>>({})

const eventChoiceButtonLabel = (option: { label: string; buttonLabel?: string }) => {
  if (option.buttonLabel) return option.buttonLabel

  const shortenedLabels: Record<string, string> = {
    'Report the commanding officer': 'Report',
    'Protect the commanding officer': 'Protect',
  }

  return shortenedLabels[option.label] ?? option.label
}

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

const benefitWagerForm = (resolution: { id: string; wagerChecks?: Array<{ skill: string }> }) => {
  if (!benefitWagerForms[resolution.id]) {
    benefitWagerForms[resolution.id] = {
      skill: resolution.wagerChecks?.[0]?.skill ?? '',
      wagered: null,
      total: null,
    }
  }

  return benefitWagerForms[resolution.id]
}

const prisonLawyerForm = (resolution: { id: string }) => {
  if (!prisonLawyerForms[resolution.id]) {
    prisonLawyerForms[resolution.id] = {
      advocateLevel: 1,
      total: null,
      reductionDie: null,
    }
  }

  return prisonLawyerForms[resolution.id]
}

const associateInjuryForm = (
  resolution: { id: string; injuryTargetOptions?: Array<{ id: string; type: string; name: string }> },
) => {
  if (!associateInjuryForms[resolution.id]) {
    associateInjuryForms[resolution.id] = {
      targetId: resolution.injuryTargetOptions?.[0]?.id ?? 'family',
      name: '',
      firstRoll: null,
      secondRoll: null,
    }
  }

  return associateInjuryForms[resolution.id]
}

const triggerEventResolutionCheckRoll = (resolution: {
  id: string
  kind: string
  check?: { label: string; target: number; dm: number }
  resolved?: boolean
}) => {
  if (resolution.kind !== 'check' || !resolution.check || resolution.resolved) return

  const firstDie = Math.ceil(Math.random() * 6)
  const secondDie = Math.ceil(Math.random() * 6)
  const diceTotal = firstDie + secondDie
  const finalTotal = diceTotal + resolution.check.dm
  const succeeded = finalTotal >= resolution.check.target

  emit('show-roll', {
    title: resolution.check.label,
    result: succeeded ? 'Success' : 'Failure',
    modifier: resolution.check.dm,
    total: finalTotal,
    dice: [firstDie, secondDie],
  })

  rollEventResolutionCheck(resolution.id, diceTotal)
}

const triggerEventResolutionTableRoll = (resolution: {
  id: string
  kind: string
  label: string
  diceCount?: 1 | 2
  resolved?: boolean
}) => {
  if (resolution.kind !== 'table_roll' || resolution.resolved) return

  const firstDie = Math.ceil(Math.random() * 6)
  const secondDie = resolution.diceCount === 2 ? Math.ceil(Math.random() * 6) : 0
  const total = firstDie + secondDie

  emit('show-roll', {
    title: resolution.label,
    result: `Rolled ${total}`,
    total,
    dice: resolution.diceCount === 2 ? [firstDie, secondDie] : [firstDie],
  })

  rollEventResolutionTable(resolution.id, total)
}

const triggerEventResolutionSkillTableRoll = (resolution: {
  id: string
  kind: string
  label: string
  resolved?: boolean
}) => {
  if (resolution.kind !== 'skill_table_roll' || resolution.resolved) return

  const die = Math.ceil(Math.random() * 6)

  emit('show-roll', {
    title: resolution.label,
    result: `Rolled ${die}`,
    total: die,
    dice: [die],
  })

  rollEventResolutionSkillTable(resolution.id, die)
}

const triggerEventResolutionAssociateCountRoll = (resolution: {
  id: string
  kind: string
  label: string
  associateCountRoll?: string
  resolved?: boolean
}) => {
  if (resolution.kind !== 'associate' || !resolution.associateCountRoll || resolution.resolved) return

  const die = Math.ceil(Math.random() * 6)
  const count = Math.ceil(die / 2)

  emit('show-roll', {
    title: resolution.label,
    result: `${count} ${count === 1 ? 'associate' : 'associates'}`,
    total: count,
    dice: [die],
  })

  rollEventResolutionAssociateCount(resolution.id, die)
}

const triggerEventResolutionBenefitWagerRoll = (resolution: {
  id: string
  kind: string
  resolved?: boolean
  wagerChecks?: Array<{ skill: string; label: string; dm: number; target: number }>
}) => {
  if (resolution.kind !== 'benefit_wager' || resolution.resolved) return

  const skill = benefitWagerForm(resolution).skill
  const wagered = benefitWagerForm(resolution).wagered ?? Number.NaN
  const check = resolution.wagerChecks?.find((item) => item.skill === skill) ?? resolution.wagerChecks?.[0]
  if (!check || Number.isNaN(wagered) || wagered < 1) return

  const firstDie = Math.ceil(Math.random() * 6)
  const secondDie = Math.ceil(Math.random() * 6)
  const diceTotal = firstDie + secondDie
  const finalTotal = diceTotal + check.dm
  const succeeded = finalTotal >= check.target

  emit('show-roll', {
    title: check.label,
    result: succeeded ? 'Success' : 'Failure',
    modifier: check.dm,
    total: finalTotal,
    dice: [firstDie, secondDie],
  })

  rollEventResolutionBenefitWager(resolution.id, skill, wagered, diceTotal)
}

const triggerEventResolutionPrisonLawyerRoll = (resolution: {
  id: string
  kind: string
  resolved?: boolean
}) => {
  if (resolution.kind !== 'prison_lawyer' || resolution.resolved) return

  const advocateLevel = prisonLawyerForm(resolution).advocateLevel
  const firstDie = Math.ceil(Math.random() * 6)
  const secondDie = Math.ceil(Math.random() * 6)
  const reductionDie = Math.ceil(Math.random() * 6)
  const diceTotal = firstDie + secondDie

  emit('show-roll', {
    title: `Advocate ${advocateLevel}`,
    result: `Sentence -${reductionDie} term${reductionDie === 1 ? '' : 's'}`,
    total: diceTotal,
    dice: [firstDie, secondDie],
  })

  rollEventResolutionPrisonLawyer(resolution.id, advocateLevel, diceTotal, reductionDie)
}

const handleResolveSkillChoice = (resolutionId: string, choice: string) => {
  resolveEventChoice(resolutionId, choice)
  emit('resolved')
}

const handleResolveOutcomeChoice = (resolutionId: string, optionId: string) => {
  resolveEventOutcomeChoice(resolutionId, optionId)
  emit('resolved')
}

const resolutionHeading = (resolution: {
  source: string
  kind: string
  resolved?: boolean
}) => {
  if (resolution.resolved) return 'Resolved'

  const isMusteringOut = resolution.source === 'Mustering Out' || resolution.source.startsWith('Mustering Out:')
  if (!isMusteringOut) return 'Resolution needed'

  if (resolution.kind === 'choice' || resolution.kind === 'skill_choice') return 'Choose benefit'
  if (resolution.kind === 'associate') return 'Add benefit'
  if (resolution.kind === 'characteristic_adjustment') return 'Apply benefit'
  return 'Resolve benefit'
}
</script>

<template>
  <div v-if="visibleEventResolutions.length" class="mt-3 grid gap-3">
    <div
      v-for="resolution in visibleEventResolutions"
      :key="resolution.id"
      :class="[
        'rounded-md p-3 text-sm',
        resolution.resolved ? 'bg-emerald-50 text-emerald-950' : 'bg-amber-50 text-amber-950'
      ]"
    >
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="font-semibold">{{ resolutionHeading(resolution) }}</p>
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
          @click="handleResolveSkillChoice(resolution.id, choice)"
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

      <div v-if="resolution.kind === 'narrative' && !resolution.resolved" class="mt-3 grid gap-2">
        <textarea
          v-model="narrativeNotes[resolution.id]"
          class="min-h-20 rounded-md border border-amber-300 bg-white px-3 py-2 text-sm text-amber-950 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
          placeholder="Short note"
        />
        <button
          class="h-9 w-fit rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
          type="button"
          @click="resolveEventNarrative(resolution.id, narrativeNotes[resolution.id] ?? '')"
        >
          Record
        </button>
      </div>

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
            @click="resolveEventMedicalCare(resolution.id, medicalRestorePoints[resolution.id] ?? resolution.medicalMaxRestore ?? (resolution.medicalCrisis ? 1 : 0))"
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
          :title="option.label"
          type="button"
          @click="handleResolveOutcomeChoice(resolution.id, option.id)"
        >
          {{ eventChoiceButtonLabel(option) }}
        </button>
      </div>

      <div v-if="resolution.kind === 'associate' && !resolution.resolved" class="mt-3 grid gap-2">
        <div v-if="resolution.associateCountRoll === 'D3'" class="flex flex-wrap items-center gap-2">
        <button
          class="h-9 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
          type="button"
          @click="triggerEventResolutionAssociateCountRoll(resolution)"
        >
          Roll D3
        </button>
          <template v-if="gmManualTableRollEntryEnabled">
            <input
              v-model.number="manualAssociateCounts[resolution.id]"
              class="h-9 w-20 rounded-md border border-amber-300 bg-white px-2 text-sm text-amber-950"
              max="3"
              min="1"
              placeholder="D3"
              type="number"
            >
            <button
              class="h-9 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
              type="button"
              @click="enterManualEventResolutionAssociateCount(resolution.id, manualAssociateCounts[resolution.id] ?? Number.NaN)"
            >
              Apply
            </button>
          </template>
        </div>
        <template v-else>
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
        </template>
      </div>

      <div v-if="resolution.kind === 'associate_injury' && !resolution.resolved" class="mt-3 grid gap-2">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="target in resolution.injuryTargetOptions"
            :key="target.id"
            :class="[
              'h-9 rounded-md border px-3 text-sm font-semibold',
              associateInjuryForm(resolution).targetId === target.id
                ? 'border-amber-700 bg-amber-700 text-white'
                : 'border-amber-300 bg-white text-amber-900 hover:border-amber-600'
            ]"
            type="button"
            @click="associateInjuryForm(resolution).targetId = target.id"
          >
            {{ target.name }}
          </button>
        </div>
        <input
          v-if="associateInjuryForm(resolution).targetId === 'family'"
          v-model="associateInjuryForm(resolution).name"
          class="h-9 rounded-md border border-amber-300 bg-white px-2 text-sm text-amber-950"
          placeholder="Family member name"
          type="text"
        >
        <div v-if="gmManualTableRollEntryEnabled" class="flex flex-wrap items-center gap-2">
          <input
            v-model.number="associateInjuryForm(resolution).firstRoll"
            class="h-9 w-20 rounded-md border border-amber-300 bg-white px-2 text-sm text-amber-950"
            max="6"
            min="1"
            placeholder="1D"
            type="number"
          >
          <input
            v-model.number="associateInjuryForm(resolution).secondRoll"
            class="h-9 w-20 rounded-md border border-amber-300 bg-white px-2 text-sm text-amber-950"
            max="6"
            min="1"
            placeholder="1D"
            type="number"
          >
        </div>
        <button
          class="h-9 w-fit rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
          type="button"
          @click="resolveEventAssociateInjury(
            resolution.id,
            associateInjuryForm(resolution).targetId,
            associateInjuryForm(resolution).name,
            associateInjuryForm(resolution).firstRoll ?? undefined,
            associateInjuryForm(resolution).secondRoll ?? undefined,
          )"
        >
          Roll Injury Twice
        </button>
      </div>

      <div v-if="resolution.kind === 'check' && !resolution.resolved" class="mt-3 flex flex-wrap items-center gap-2">
        <div v-if="resolution.checkSkillOptions?.length" class="flex w-full flex-wrap gap-2">
          <button
            v-for="skillId in resolution.checkSkillOptions"
            :key="`${resolution.id}-${skillId}`"
            :class="[
              'h-9 rounded-md border px-3 text-sm font-semibold',
              resolution.checkSkillId === skillId
                ? 'border-amber-700 bg-amber-700 text-white'
                : 'border-amber-300 bg-white text-amber-900 hover:border-amber-600'
            ]"
            type="button"
            @click="setEventResolutionCheckSkill(resolution.id, skillId)"
          >
            {{ skillOptionLabel(skillId) }}
          </button>
        </div>
        <button
          class="h-9 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
          type="button"
          @click="triggerEventResolutionCheckRoll(resolution)"
        >
          Roll 2D
        </button>
        <template v-if="gmManualCheckRollEntryEnabled">
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
        </template>
      </div>

      <div v-if="resolution.kind === 'table_roll' && !resolution.resolved" class="mt-3 flex flex-wrap items-center gap-2">
        <button
          class="h-9 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
          type="button"
          @click="triggerEventResolutionTableRoll(resolution)"
        >
          Roll {{ resolution.diceCount }}D
        </button>
        <template v-if="gmManualTableRollEntryEnabled">
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
        </template>
      </div>

      <div v-if="resolution.kind === 'skill_table_roll' && !resolution.resolved" class="mt-3 flex flex-wrap items-center gap-2">
        <button
          class="h-9 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
          type="button"
          @click="triggerEventResolutionSkillTableRoll(resolution)"
        >
          Roll 1D
        </button>
        <template v-if="gmManualTableRollEntryEnabled">
          <input
            v-model.number="manualTableRolls[resolution.id]"
            class="h-9 w-20 rounded-md border border-amber-300 bg-white px-2 text-sm text-amber-950"
            max="6"
            min="1"
            type="number"
          >
          <button
            class="h-9 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
            type="button"
            @click="enterManualEventResolutionSkillTable(resolution.id, manualTableRolls[resolution.id] ?? Number.NaN)"
          >
            Apply
          </button>
        </template>
      </div>

      <div v-if="resolution.kind === 'benefit_wager' && !resolution.resolved" class="mt-3 grid gap-3">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="check in resolution.wagerChecks"
            :key="check.skill"
            :class="[
              'h-9 rounded-md border px-3 text-sm font-semibold',
              benefitWagerForm(resolution).skill === check.skill
                ? 'border-amber-700 bg-amber-700 text-white'
                : 'border-amber-300 bg-white text-amber-900 hover:border-amber-600'
            ]"
            type="button"
            @click="benefitWagerForm(resolution).skill = check.skill"
          >
            {{ check.label }} · DM {{ check.dm >= 0 ? `+${check.dm}` : check.dm }}
          </button>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <input
            v-model.number="benefitWagerForm(resolution).wagered"
            class="h-9 w-28 rounded-md border border-amber-300 bg-white px-2 text-sm text-amber-950"
            min="1"
            placeholder="Wager"
            type="number"
          >
          <button
            class="h-9 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
            type="button"
            @click="triggerEventResolutionBenefitWagerRoll(resolution)"
          >
            Roll 2D
          </button>
          <template v-if="gmManualBenefitRollEntryEnabled">
            <input
              v-model.number="benefitWagerForm(resolution).total"
              class="h-9 w-20 rounded-md border border-amber-300 bg-white px-2 text-sm text-amber-950"
              max="12"
              min="2"
              placeholder="2D"
              type="number"
            >
            <button
              class="h-9 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
              type="button"
              @click="enterManualEventResolutionBenefitWager(resolution.id, benefitWagerForm(resolution).skill, benefitWagerForm(resolution).wagered ?? Number.NaN, benefitWagerForm(resolution).total ?? Number.NaN)"
            >
              Apply
            </button>
          </template>
          <button
            class="h-9 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
            type="button"
            @click="declineEventResolutionBenefitWager(resolution.id)"
          >
            Decline
          </button>
        </div>
      </div>

      <div v-if="resolution.kind === 'prison_lawyer' && !resolution.resolved" class="mt-3 grid gap-3">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="level in resolution.lawyerLevels"
            :key="level"
            :class="[
              'h-9 rounded-md border px-3 text-sm font-semibold',
              prisonLawyerForm(resolution).advocateLevel === level
                ? 'border-amber-700 bg-amber-700 text-white'
                : 'border-amber-300 bg-white text-amber-900 hover:border-amber-600'
            ]"
            type="button"
            @click="prisonLawyerForm(resolution).advocateLevel = level"
          >
            Advocate {{ level }} · {{ (1000 * level * level).toLocaleString() }} Cr
          </button>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button
            class="h-9 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
            type="button"
            @click="triggerEventResolutionPrisonLawyerRoll(resolution)"
          >
            Roll Lawyer
          </button>
          <template v-if="gmManualCheckRollEntryEnabled">
            <input
              v-model.number="prisonLawyerForm(resolution).total"
              class="h-9 w-20 rounded-md border border-amber-300 bg-white px-2 text-sm text-amber-950"
              max="12"
              min="2"
              placeholder="2D"
              type="number"
            >
            <input
              v-model.number="prisonLawyerForm(resolution).reductionDie"
              class="h-9 w-20 rounded-md border border-amber-300 bg-white px-2 text-sm text-amber-950"
              max="6"
              min="1"
              placeholder="-1D"
              type="number"
            >
            <button
              class="h-9 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:border-amber-600"
              type="button"
              @click="enterManualEventResolutionPrisonLawyer(resolution.id, prisonLawyerForm(resolution).advocateLevel, prisonLawyerForm(resolution).total ?? Number.NaN, prisonLawyerForm(resolution).reductionDie ?? Number.NaN)"
            >
              Apply
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
