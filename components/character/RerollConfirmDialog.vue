<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCharacterCreatorStore } from '~/stores/characterCreator'

const characterCreator = useCharacterCreatorStore()
const {
  cancelCharacteristicReroll,
  confirmCharacteristicReroll,
} = characterCreator
const {
  showRerollConfirm,
} = storeToRefs(characterCreator)
</script>

<template>
  <div
    v-if="showRerollConfirm"
    class="fixed inset-0 z-50 grid place-items-center bg-zinc-950/60 px-4"
    role="presentation"
    @click.self="cancelCharacteristicReroll"
  >
    <section
      aria-labelledby="reroll-title"
      aria-modal="true"
      class="w-full max-w-md rounded-lg border border-zinc-300 bg-white p-5 shadow-xl"
      role="dialog"
    >
      <div class="flex items-start gap-3">
        <span class="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-amber-100 text-amber-900">
          <AppIcon name="dice" />
        </span>
        <div>
          <h2 id="reroll-title" class="text-lg font-semibold text-zinc-950">Roll characteristics again?</h2>
          <p class="mt-2 text-sm leading-6 text-zinc-600">
            This will replace the current stat bank, clear characteristic assignments, and reset selected background skills.
          </p>
        </div>
      </div>

      <div class="mt-5 flex justify-end gap-3">
        <button
          class="h-10 rounded-md border border-zinc-300 px-4 text-sm font-semibold text-zinc-700 hover:border-zinc-500"
          type="button"
          @click="cancelCharacteristicReroll"
        >
          Cancel
        </button>
        <button
          class="inline-flex h-10 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
          type="button"
          @click="confirmCharacteristicReroll"
        >
          <AppIcon name="dice" />
          Roll again
        </button>
      </div>
    </section>
  </div>
</template>
