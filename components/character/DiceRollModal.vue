<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '~/components/AppIcon.vue'

const props = withDefaults(defineProps<{
  open: boolean
  rolling: boolean
  title: string
  subtitle?: string
  modifier?: number
  dice: [number, number]
  diceCount?: 1 | 2
  diceFaces?: Array<number | string>
  total: number
  result?: string
  kicker?: string
  jackpot?: boolean
  canReroll?: boolean
  detailLines?: string[]
}>(), {
  subtitle: '',
  modifier: 0,
  diceCount: 2,
  result: '',
  kicker: 'Roll Result',
  jackpot: false,
  canReroll: false,
  detailLines: () => [],
})

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'reroll'): void
}>()

const formatDm = (value: number) => value >= 0 ? `+${value}` : `${value}`
const displayDice = computed(() => {
  if (props.diceFaces?.length) return props.diceFaces
  return props.diceCount === 1 ? [props.dice[0]] : [props.dice[0], props.dice[1]]
})
</script>

<template>
  <Transition name="dice-roll-fade">
    <div
      v-if="open"
      class="dice-roll-modal fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 px-4 py-8 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      @click.self="emit('close')"
    >
      <div class="dice-roll-modal__panel w-full max-w-md overflow-hidden" :class="{ 'dice-roll-modal__panel--jackpot': jackpot, 'dice-roll-modal__panel--jackpot-settled': jackpot && !rolling }">
        <div class="dice-roll-modal__header">
          <div>
            <p class="dice-roll-modal__kicker">{{ kicker }}</p>
            <h2 class="dice-roll-modal__title">{{ title }}</h2>
            <p v-if="subtitle" class="dice-roll-modal__subtitle">{{ subtitle }}</p>
          </div>
          <div class="dice-roll-modal__header-actions">
            <button
              v-if="!rolling && canReroll"
              class="dice-roll-modal__reroll"
              type="button"
              @click="emit('reroll')"
            >
              <AppIcon name="dice" />
              <span>Reroll</span>
            </button>
            <button
              class="dice-roll-modal__close"
              type="button"
              aria-label="Close roll modal"
              @click="emit('close')"
            >
              <AppIcon name="close" />
              <span class="dice-roll-modal__close-label">Close</span>
            </button>
          </div>
        </div>

        <div class="dice-roll-modal__body">
          <div class="dice-roll-modal__dice-row">
            <template v-for="(face, index) in displayDice" :key="`${title}-die-${index}`">
              <div v-if="index > 0" class="dice-roll-modal__plus">+</div>
              <div class="dice-roll-modal__die" :class="{ 'is-rolling': rolling, 'is-jackpot': jackpot }">
                {{ face }}
              </div>
            </template>
            <span v-if="modifier !== 0" class="dice-roll-modal__modifier dice-roll-modal__modifier--inline">{{ formatDm(modifier) }}</span>
          </div>

          <div class="dice-roll-modal__result-row">
            <span class="dice-roll-modal__total" :class="{ 'is-settled': !rolling }">
              <span class="dice-roll-modal__total-frame" :class="{ 'is-jackpot': jackpot }">{{ total }}</span>
            </span>
          </div>

          <div v-if="result && !rolling" class="dice-roll-modal__outcome">
            <span class="dice-roll-modal__outcome-label">Result</span>
            <span class="dice-roll-modal__outcome-value">{{ result }}</span>
          </div>

          <div v-if="detailLines.length && !rolling" class="dice-roll-modal__details">
            <div v-for="(line, index) in detailLines" :key="`${title}-detail-${index}`" class="dice-roll-modal__detail-line">
              {{ line }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.dice-roll-modal__panel {
  position: relative;
  border: 1px solid rgb(34 211 238 / 0.35);
  background:
    linear-gradient(180deg, rgb(8 20 35 / 0.96), rgb(4 10 20 / 0.98)),
    linear-gradient(135deg, rgb(251 191 36 / 0.12), transparent 58%);
  box-shadow:
    0 0 0 1px rgb(14 116 144 / 0.28),
    0 24px 64px rgb(0 0 0 / 0.45),
    inset 0 1px 0 rgb(255 255 255 / 0.04);
  clip-path: polygon(0 0, calc(100% - 1rem) 0, 100% 1rem, 100% 100%, 1rem 100%, 0 calc(100% - 1rem));
}

.dice-roll-modal__panel::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgb(250 204 21 / 0.08), transparent 28%),
    repeating-linear-gradient(
      180deg,
      rgb(255 255 255 / 0.02) 0,
      rgb(255 255 255 / 0.02) 1px,
      transparent 1px,
      transparent 6px
    );
}

.dice-roll-modal__panel--jackpot {
  border-color: rgb(251 191 36 / 0.44);
  background:
    linear-gradient(180deg, rgb(26 18 6 / 0.98), rgb(72 27 6 / 0.98)),
    linear-gradient(135deg, rgb(251 191 36 / 0.18), transparent 58%);
  box-shadow:
    0 0 0 1px rgb(217 119 6 / 0.3),
    0 0 28px rgb(245 158 11 / 0.24),
    0 0 64px rgb(251 191 36 / 0.16),
    0 24px 64px rgb(0 0 0 / 0.45),
    inset 0 1px 0 rgb(255 255 255 / 0.05);
}

.dice-roll-modal__panel--jackpot::after {
  content: '';
  position: absolute;
  inset: -18% auto -18% -36%;
  width: 42%;
  pointer-events: none;
  opacity: 0;
  background: linear-gradient(115deg, transparent 0%, rgb(255 248 214 / 0.06) 28%, rgb(255 248 214 / 0.28) 50%, rgb(255 248 214 / 0.06) 72%, transparent 100%);
  transform: skewX(-18deg);
}

.dice-roll-modal__panel--jackpot-settled::after {
  animation: dice-roll-jackpot-sweep 950ms ease-out;
}

.dice-roll-modal__header {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid rgb(34 211 238 / 0.18);
  padding: 1.25rem 1.25rem 1rem;
}

.dice-roll-modal__header-actions {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 0.65rem;
}

.dice-roll-modal__kicker {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgb(251 191 36 / 0.88);
}

.dice-roll-modal__title {
  margin: 0.35rem 0 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: rgb(236 254 255);
}

.dice-roll-modal__subtitle {
  margin: 0.35rem 0 0;
  color: rgb(232 249 252 / 0.84);
  font-size: 0.96rem;
  font-weight: 600;
}

.dice-roll-modal__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  height: 2.25rem;
  padding: 0 0.85rem;
  border: 1px solid rgb(34 211 238 / 0.28);
  background: rgb(8 20 35 / 0.82);
  color: rgb(207 250 254);
  font-size: 0.82rem;
  font-weight: 700;
  clip-path: polygon(0 0, calc(100% - 0.55rem) 0, 100% 0.55rem, 100% 100%, 0.55rem 100%, 0 calc(100% - 0.55rem));
  transition: border-color 160ms ease, color 160ms ease, background-color 160ms ease;
}

.dice-roll-modal__close:hover {
  border-color: rgb(34 211 238 / 0.5);
  color: rgb(255 251 235);
  background: rgb(14 32 52 / 0.96);
}

.dice-roll-modal__close-label {
  white-space: nowrap;
}

.dice-roll-modal__body {
  position: relative;
  display: grid;
  gap: 0.95rem;
  padding: 1.4rem 1.25rem 1.5rem;
}

.dice-roll-modal__dice-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
  flex-wrap: wrap;
}

.dice-roll-modal__die {
  display: grid;
  place-items: center;
  width: 3.3rem;
  height: 3.3rem;
  border: 1px solid rgb(34 211 238 / 0.3);
  background: linear-gradient(180deg, rgb(13 34 58 / 0.98), rgb(7 18 33 / 0.98));
  color: rgb(165 243 252);
  font-size: 1.45rem;
  font-weight: 800;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  box-shadow: inset 0 0 0 1px rgb(34 211 238 / 0.1), 0 0 18px rgb(34 211 238 / 0.14);
  clip-path: polygon(0 0, calc(100% - 0.8rem) 0, 100% 0.8rem, 100% 100%, 0.8rem 100%, 0 calc(100% - 0.8rem));
  will-change: transform, box-shadow, color;
  backface-visibility: hidden;
  transform: translateZ(0);
}

.dice-roll-modal__die.is-rolling {
  animation: dice-roll-pulse 140ms linear infinite;
}

.dice-roll-modal__die.is-jackpot {
  border-color: rgb(251 191 36 / 0.42);
  box-shadow:
    inset 0 0 0 1px rgb(251 191 36 / 0.12),
    0 0 26px rgb(245 158 11 / 0.2),
    0 0 44px rgb(251 191 36 / 0.16);
}

.dice-roll-modal__plus {
  color: rgb(103 232 249 / 0.85);
  font-size: 1.4rem;
  font-weight: 700;
}

.dice-roll-modal__result-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.dice-roll-modal__details {
  display: grid;
  gap: 0.35rem;
  margin-top: -0.1rem;
  padding: 0.8rem 0.95rem 0.1rem;
  border: 1px solid rgb(34 211 238 / 0.16);
  background:
    linear-gradient(180deg, rgb(7 16 28 / 0.8), rgb(4 10 20 / 0.8));
  clip-path: polygon(0 0, calc(100% - 0.75rem) 0, 100% 0.75rem, 100% 100%, 0.75rem 100%, 0 calc(100% - 0.75rem));
}

.dice-roll-modal__detail-line {
  color: rgb(226 232 240 / 0.92);
  font-size: 0.86rem;
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.dice-roll-modal__modifier {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgb(251 191 36 / 0.24);
  background: rgb(251 191 36 / 0.1);
  color: rgb(253 186 55);
  padding: 0.35rem 0.7rem;
  font-size: 0.82rem;
  font-weight: 700;
  white-space: nowrap;
  clip-path: polygon(0 0, calc(100% - 0.45rem) 0, 100% 0.45rem, 100% 100%, 0.45rem 100%, 0 calc(100% - 0.45rem));
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / 0.04),
    0 0 14px rgb(245 158 11 / 0.12);
}

.dice-roll-modal__modifier--inline {
  min-width: 2.8rem;
  margin-left: 0.1rem;
  font-size: 0.96rem;
  letter-spacing: 0.02em;
}

.dice-roll-modal__total {
  display: inline-flex;
  transform: scale(1);
}

.dice-roll-modal__total-frame {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 4.6rem;
  height: 4rem;
  border: 1px solid rgb(251 191 36 / 0.28);
  background: linear-gradient(180deg, rgb(118 43 8 / 0.92), rgb(78 27 8 / 0.96));
  color: rgb(255 248 214);
  font-size: 2.35rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  -webkit-text-stroke: 0.7px rgb(92 33 7 / 0.98);
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / 0.04),
    0 0 14px rgb(245 158 11 / 0.14);
  text-shadow:
    0 1px 0 rgb(92 33 7 / 0.95),
    0 0 1px rgb(255 251 235 / 0.92),
    0 0 6px rgb(252 211 77 / 0.44),
    0 0 14px rgb(245 158 11 / 0.28);
  clip-path: polygon(0 0, calc(100% - 0.6rem) 0, 100% 0.6rem, 100% 100%, 0.6rem 100%, 0 calc(100% - 0.6rem));
  font-variant-numeric: tabular-nums;
}

.dice-roll-modal__total-frame.is-jackpot {
  border-color: rgb(251 191 36 / 0.48);
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / 0.06),
    0 0 22px rgb(245 158 11 / 0.24),
    0 0 56px rgb(251 191 36 / 0.18);
  text-shadow:
    0 1px 0 rgb(92 33 7 / 0.95),
    0 0 2px rgb(255 251 235 / 0.96),
    0 0 10px rgb(252 211 77 / 0.6),
    0 0 22px rgb(245 158 11 / 0.42),
    0 0 38px rgb(251 191 36 / 0.24);
}

.dice-roll-modal__total.is-settled {
  animation: dice-roll-total-settle 320ms ease-out;
  filter:
    drop-shadow(0 0 8px rgb(252 211 77 / 0.32))
    drop-shadow(0 0 18px rgb(245 158 11 / 0.26));
}

.dice-roll-modal__outcome {
  display: grid;
  gap: 0.35rem;
  justify-items: center;
  margin-top: -0.2rem;
  padding: 0.85rem 1rem;
  border: 1px solid rgb(34 211 238 / 0.2);
  background:
    linear-gradient(180deg, rgb(8 47 73 / 0.42), rgb(4 10 20 / 0.72)),
    radial-gradient(circle at 50% 0, rgb(34 211 238 / 0.12), transparent 6rem);
  box-shadow:
    inset 0 0 0 1px rgb(34 211 238 / 0.05),
    0 0 20px rgb(34 211 238 / 0.08);
  clip-path: polygon(0 0, calc(100% - 0.75rem) 0, 100% 0.75rem, 100% 100%, 0.75rem 100%, 0 calc(100% - 0.75rem));
  animation: dice-roll-outcome-settle 220ms ease-out;
}

.dice-roll-modal__outcome-label {
  color: rgb(186 230 253 / 0.74);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.dice-roll-modal__outcome-value {
  color: rgb(236 254 255);
  font-size: 1.08rem;
  font-weight: 900;
  line-height: 1.2;
  text-align: center;
  text-shadow:
    0 0 1px rgb(255 255 255 / 0.78),
    0 0 12px rgb(34 211 238 / 0.28);
}

.dice-roll-modal__reroll {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  width: auto;
  min-width: 0;
  height: 2.25rem;
  padding: 0 0.85rem;
  border: 1px solid rgb(34 211 238 / 0.34);
  background:
    linear-gradient(180deg, rgb(10 28 48 / 0.94), rgb(7 18 33 / 0.98)),
    radial-gradient(circle at 0 0, rgb(34 211 238 / 0.18), transparent 4rem);
  color: rgb(207 250 254);
  font-size: 0.82rem;
  font-weight: 700;
  white-space: nowrap;
  clip-path: polygon(0 0, calc(100% - 0.55rem) 0, 100% 0.55rem, 100% 100%, 0.55rem 100%, 0 calc(100% - 0.55rem));
  box-shadow:
    inset 0 0 0 1px rgb(34 211 238 / 0.08),
    0 0 16px rgb(34 211 238 / 0.14);
  transition: border-color 160ms ease, color 160ms ease, filter 160ms ease, transform 160ms ease;
}

.dice-roll-modal__reroll:hover,
.dice-roll-modal__reroll:focus-visible {
  outline: none;
  border-color: rgb(34 211 238 / 0.58);
  color: rgb(255 251 235);
  filter: brightness(1.08);
  transform: translateY(-1px);
}

.dice-roll-modal__reroll :deep(svg) {
  width: 0.86rem;
  height: 0.86rem;
}

.dice-roll-fade-enter-active,
.dice-roll-fade-leave-active {
  transition: opacity 180ms ease;
}

.dice-roll-fade-enter-from,
.dice-roll-fade-leave-to {
  opacity: 0;
}

@keyframes dice-roll-pulse {
  0%,
  100% {
    transform: translateY(0);
    color: rgb(165 243 252);
    box-shadow: inset 0 0 0 1px rgb(34 211 238 / 0.1), 0 0 18px rgb(34 211 238 / 0.14);
  }
  50% {
    transform: translateY(-1px);
    color: rgb(207 250 254);
    box-shadow: inset 0 0 0 1px rgb(34 211 238 / 0.18), 0 0 28px rgb(34 211 238 / 0.24);
  }
}

@keyframes dice-roll-total-settle {
  0% {
    transform: scale(1.52);
    filter:
      drop-shadow(0 0 12px rgb(252 211 77 / 0.4))
      drop-shadow(0 0 24px rgb(245 158 11 / 0.34));
  }
  100% {
    transform: scale(1);
    filter:
      drop-shadow(0 0 8px rgb(252 211 77 / 0.32))
      drop-shadow(0 0 18px rgb(245 158 11 / 0.26));
  }
}

@keyframes dice-roll-outcome-settle {
  0% {
    opacity: 0;
    transform: translateY(0.35rem);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes dice-roll-jackpot-sweep {
  0% {
    opacity: 0;
    transform: translateX(-12%) skewX(-18deg);
  }
  18% {
    opacity: 0.95;
  }
  100% {
    opacity: 0;
    transform: translateX(310%) skewX(-18deg);
  }
}

@media (max-width: 639px) {
  .dice-roll-modal__header {
    flex-direction: column;
    gap: 0.8rem;
  }

  .dice-roll-modal__close {
    width: 100%;
  }

  .dice-roll-modal__close-label {
    display: inline;
  }

  .dice-roll-modal__die {
    width: 3rem;
    height: 3rem;
    font-size: 1.25rem;
  }

  .dice-roll-modal__total-frame {
    width: 4.1rem;
    height: 3.6rem;
    font-size: 2rem;
  }
}
</style>
