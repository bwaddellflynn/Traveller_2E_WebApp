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
  skipCharacteristicRerollConfirm,
} = storeToRefs(characterCreator)
</script>

<template>
  <div
    v-if="showRerollConfirm"
    class="fixed inset-0 z-50 grid place-items-center bg-zinc-950/65 px-4 py-8 backdrop-blur-sm"
    role="presentation"
    @click.self="cancelCharacteristicReroll"
  >
    <section
      aria-labelledby="reroll-title"
      aria-modal="true"
      class="reroll-dialog w-full max-w-md"
      role="dialog"
    >
      <div class="reroll-dialog__header">
        <span class="reroll-dialog__icon-wrap" aria-hidden="true">
          <span class="reroll-dialog__icon-glow">
            <AppIcon class="h-6 w-6" name="dice" />
          </span>
        </span>
        <div>
          <p class="reroll-dialog__kicker">Characteristic Bank</p>
          <h2 id="reroll-title" class="reroll-dialog__title">Roll characteristics again?</h2>
          <p class="mt-2 text-sm leading-6 text-cyan-100/78">
            This will replace the current stat bank, clear characteristic assignments, and reset selected background skills.
          </p>
        </div>
      </div>

      <label class="reroll-dialog__toggle mt-5 flex items-start gap-3 p-3 text-sm text-cyan-50/88">
        <input
          v-model="skipCharacteristicRerollConfirm"
          class="mt-1 h-4 w-4 rounded border-amber-300 bg-zinc-950 text-amber-400 focus:ring-amber-400"
          type="checkbox"
        >
        <span>
          <span class="font-semibold text-cyan-50">Do not ask me again</span>
          <span class="block text-cyan-100/70">Future characteristic rerolls will replace the stat bank immediately.</span>
        </span>
      </label>

      <div class="mt-5 flex justify-end gap-3">
        <button
          class="reroll-dialog__button reroll-dialog__button--secondary"
          type="button"
          @click="cancelCharacteristicReroll"
        >
          Cancel
        </button>
        <button
          class="reroll-dialog__button reroll-dialog__button--primary inline-flex items-center gap-2"
          type="button"
          @click="confirmCharacteristicReroll"
        >
          <AppIcon class="h-4 w-4" name="dice" />
          Roll again
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.reroll-dialog {
  position: relative;
  overflow: hidden;
  border: 1px solid rgb(34 211 238 / 0.32);
  background:
    linear-gradient(180deg, rgb(8 20 35 / 0.96), rgb(5 12 22 / 0.98)),
    linear-gradient(135deg, rgb(251 191 36 / 0.1), transparent 58%);
  box-shadow:
    0 0 0 1px rgb(14 116 144 / 0.24),
    0 24px 64px rgb(0 0 0 / 0.5),
    inset 0 1px 0 rgb(255 255 255 / 0.04);
  padding: 1.25rem;
  clip-path: polygon(0 0, calc(100% - 0.95rem) 0, 100% 0.95rem, 100% 100%, 0.95rem 100%, 0 calc(100% - 0.95rem));
}

.reroll-dialog::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgb(250 204 21 / 0.06), transparent 30%),
    repeating-linear-gradient(
      180deg,
      rgb(255 255 255 / 0.018) 0,
      rgb(255 255 255 / 0.018) 1px,
      transparent 1px,
      transparent 6px
    );
}

.reroll-dialog__header {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
}

.reroll-dialog__icon-wrap {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 3rem;
  height: 3rem;
  border: 1px solid rgb(251 191 36 / 0.22);
  background: linear-gradient(180deg, rgb(110 42 7 / 0.82), rgb(70 23 8 / 0.92));
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / 0.03),
    0 0 24px rgb(251 191 36 / 0.14);
  clip-path: polygon(0 0, calc(100% - 0.7rem) 0, 100% 0.7rem, 100% 100%, 0.7rem 100%, 0 calc(100% - 0.7rem));
}

.reroll-dialog__icon-glow {
  color: rgb(254 240 138);
  filter: drop-shadow(0 0 8px rgb(251 191 36 / 0.5));
}

.reroll-dialog__kicker {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgb(251 191 36 / 0.88);
}

.reroll-dialog__title {
  margin: 0.35rem 0 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: rgb(236 254 255);
}

.reroll-dialog__toggle {
  position: relative;
  border: 1px solid rgb(251 191 36 / 0.18);
  background: rgb(251 191 36 / 0.08);
  clip-path: polygon(0 0, calc(100% - 0.65rem) 0, 100% 0.65rem, 100% 100%, 0.65rem 100%, 0 calc(100% - 0.65rem));
}

.reroll-dialog__button {
  height: 2.5rem;
  padding: 0 1rem;
  font-size: 0.9rem;
  font-weight: 700;
  transition: border-color 160ms ease, background-color 160ms ease, color 160ms ease;
}

.reroll-dialog__button--secondary {
  border: 1px solid rgb(34 211 238 / 0.24);
  background: rgb(8 20 35 / 0.82);
  color: rgb(207 250 254);
  clip-path: polygon(0 0, calc(100% - 0.55rem) 0, 100% 0.55rem, 100% 100%, 0.55rem 100%, 0 calc(100% - 0.55rem));
}

.reroll-dialog__button--secondary:hover {
  border-color: rgb(34 211 238 / 0.5);
  background: rgb(12 29 46 / 0.96);
}

.reroll-dialog__button--primary {
  border: 1px solid rgb(251 191 36 / 0.22);
  background: linear-gradient(180deg, rgb(142 52 8 / 0.96), rgb(92 33 7 / 0.98));
  color: rgb(255 251 235);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.04), 0 0 18px rgb(251 191 36 / 0.12);
  clip-path: polygon(0 0, calc(100% - 0.55rem) 0, 100% 0.55rem, 100% 100%, 0.55rem 100%, 0 calc(100% - 0.55rem));
}

.reroll-dialog__button--primary:hover {
  border-color: rgb(251 191 36 / 0.42);
  background: linear-gradient(180deg, rgb(162 63 12 / 0.98), rgb(108 39 8 / 1));
}
</style>
