<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, watch } from 'vue'
import EventResolutionList from '~/components/character/EventResolutionList.vue'
import { useCharacterCreatorStore } from '~/stores/characterCreator'

type MusterOutRollOption = {
  roll: number
  cash: number
  benefit: string
}

type MusterOutRollPayload = {
  title: string
  resultId: string
  careerName: string
  rollType: 'cash' | 'benefit'
  die: number
  modifier: number
  total: number
  tableRoll: number
  result: string
  options: MusterOutRollOption[]
}

const props = defineProps<{
  open: boolean
  payload: MusterOutRollPayload | null
}>()

const emit = defineEmits<{
  (event: 'close'): void
}>()

const characterCreator = useCharacterCreatorStore()
const { musteringOutRollFastMode, pendingEventResolutions } = storeToRefs(characterCreator)
const { setMusteringOutRollFastMode } = characterCreator

const rolling = ref(false)
const settled = ref(false)
const reelPosition = ref(0)
const rowHeight = 56
const rowGap = 8
const rowPitch = rowHeight + rowGap
const visibleWindowHeight = rowPitch * 5
let animationFrameId: number | null = null
let animationStartTime = 0
let animationDuration = 0
let animationFrom = 0
let animationTo = 0

const sortedOptions = computed(() => {
  if (!props.payload) return []
  return [...props.payload.options].sort((left, right) => left.roll - right.roll)
})

const selectedIndex = computed(() => {
  if (!props.payload) return 0
  return Math.max(0, sortedOptions.value.findIndex((option) => option.roll === props.payload?.tableRoll))
})

const reelCycles = 12
const reelRows = computed(() => {
  if (!sortedOptions.value.length) return []
  return Array.from({ length: reelCycles }).flatMap((_, cycle) =>
    sortedOptions.value.map((option, index) => ({
      option,
      cycle,
      absoluteIndex: cycle * sortedOptions.value.length + index,
    })),
  )
})

const linkedResolutionIds = computed(() => {
  if (!props.payload) return []
  return pendingEventResolutions.value
    .filter((resolution) => !resolution.resolved && resolution.musteringOutResultId === props.payload?.resultId)
    .map((resolution) => resolution.id)
})

const baseCycleIndex = computed(() => Math.max(2, Math.floor(reelCycles * 0.7)))
const targetAbsoluteIndex = computed(() => {
  if (!sortedOptions.value.length) return 0
  return baseCycleIndex.value * sortedOptions.value.length + selectedIndex.value
})

const centeredAbsoluteIndex = computed(() => Math.round(reelPosition.value))

const reelTransform = computed(() => {
  const centerOffset = (visibleWindowHeight / 2) - (rowHeight / 2)
  return `translateY(${centerOffset - (reelPosition.value * rowPitch)}px)`
})

const markerStyle = computed(() => ({
  top: `${(visibleWindowHeight / 2) - (rowPitch / 2)}px`,
  height: `${rowPitch}px`,
}))

const rowPresentation = (absoluteIndex: number) => {
  const signedDistance = absoluteIndex - reelPosition.value
  const distance = Math.min(Math.abs(signedDistance), 3.2)
  const scale = Math.max(0.72, 1 - (distance * 0.11))
  const opacity = Math.max(0.14, 1 - (distance * 0.3))
  const rotateX = Math.max(-28, Math.min(28, signedDistance * 11))
  const translateX = Math.min(18, distance * 5.5)
  const blur = distance < 0.34
    ? 0
    : rolling.value
    ? Math.min(1.75, 0.45 + (distance * 0.42))
    : Math.min(1.15, distance * 0.34)

  return {
    transform: `perspective(900px) rotateX(${rotateX}deg) translateX(${translateX}px) scale(${scale})`,
    opacity,
    filter: `blur(${blur}px)`,
  }
}

const stopRollAnimation = () => {
  if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId)
  animationFrameId = null
  rolling.value = false
}

const currentRollDuration = () => (musteringOutRollFastMode.value ? 900 : 2650)

const settleRoll = () => {
  reelPosition.value = targetAbsoluteIndex.value
  settled.value = true
  rolling.value = false
}

const animateReel = (timestamp: number) => {
  if (!props.open || !props.payload) return
  if (!animationStartTime) animationStartTime = timestamp

  const elapsed = timestamp - animationStartTime
  const progress = Math.min(1, elapsed / Math.max(animationDuration, 1))
  const eased = 1 - ((1 - progress) ** 3)
  reelPosition.value = animationFrom + ((animationTo - animationFrom) * eased)

  if (progress >= 1) {
    settleRoll()
    return
  }

  animationFrameId = window.requestAnimationFrame(animateReel)
}

const beginRoll = () => {
  if (!props.open || !props.payload || !sortedOptions.value.length || !import.meta.client) return

  stopRollAnimation()
  settled.value = false
  rolling.value = true
  animationFrom = Math.max(targetAbsoluteIndex.value - (sortedOptions.value.length * (musteringOutRollFastMode.value ? 4 : 7)), 0)
  animationTo = targetAbsoluteIndex.value
  animationDuration = currentRollDuration()
  animationStartTime = 0
  reelPosition.value = animationFrom
  animationFrameId = window.requestAnimationFrame(animateReel)
}

const close = () => {
  stopRollAnimation()
  emit('close')
}

watch(() => props.open, (open) => {
  if (open) {
    beginRoll()
    return
  }

  stopRollAnimation()
  settled.value = false
}, { immediate: true })

watch(() => props.payload, (payload) => {
  if (props.open && payload) beginRoll()
}, { deep: true })

watch(musteringOutRollFastMode, (fast) => {
  if (!rolling.value || !import.meta.client) return

  const currentPosition = reelPosition.value
  const remainingDistance = Math.max(animationTo - currentPosition, 0)
  animationFrom = currentPosition
  animationTo = targetAbsoluteIndex.value
  animationDuration = fast
    ? Math.min(Math.max(remainingDistance * 58, 260), 760)
    : Math.max(remainingDistance * 92, 980)
  animationStartTime = 0
  if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId)
  animationFrameId = window.requestAnimationFrame(animateReel)
}, { flush: 'sync' })

onBeforeUnmount(stopRollAnimation)
</script>

<template>
  <Transition name="muster-roll-fade">
    <div
      v-if="open && payload"
      class="fixed inset-0 z-[95] flex items-center justify-center bg-[rgba(2,6,23,0.86)] px-4 py-8"
      role="dialog"
      aria-modal="true"
      @click.self="close"
    >
      <div class="muster-roll-modal w-full max-w-3xl overflow-hidden rounded-xl border border-amber-300/35">
        <div class="muster-roll-modal__header border-b border-amber-300/15 px-5 py-4">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="text-sm font-semibold text-amber-100/82">{{ payload.careerName }} · {{ payload.rollType === 'cash' ? 'Cash' : 'Benefit' }}</p>
            </div>
            <div class="flex items-center gap-2">
              <button
                :class="[
                  'inline-flex h-10 w-10 items-center justify-center rounded-md border transition',
                  musteringOutRollFastMode
                    ? 'border-cyan-200/65 bg-cyan-400/16 text-cyan-50 shadow-[0_0_18px_rgba(34,211,238,0.14)]'
                    : 'border-amber-200/60 bg-amber-500/14 text-amber-50 shadow-[0_0_16px_rgba(251,191,36,0.12)]',
                ]"
                :aria-label="musteringOutRollFastMode ? 'Switch to normal roll speed' : 'Switch to fast roll speed'"
                :title="musteringOutRollFastMode ? 'Fast roll speed' : 'Normal roll speed'"
                type="button"
                @click="setMusteringOutRollFastMode(!musteringOutRollFastMode)"
              >
                <svg v-if="!musteringOutRollFastMode" viewBox="0 0 24 24" class="h-4 w-4 fill-current" aria-hidden="true">
                  <path d="M7 5.2v13.6L18 12 7 5.2Z" />
                </svg>
                <svg v-else viewBox="0 0 24 24" class="h-4 w-4 fill-current" aria-hidden="true">
                  <path d="M3 5.2v13.6L14 12 3 5.2Z" />
                  <path d="M10 5.2v13.6L21 12 10 5.2Z" />
                </svg>
              </button>
              <button
                class="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300/35 bg-zinc-950/50 px-3 text-sm font-semibold text-zinc-100 transition hover:border-cyan-200/60 hover:text-cyan-50"
                type="button"
                @click="close"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        <div class="muster-roll-modal__body flex justify-center px-5 py-5">
          <div class="muster-roll-machine w-full max-w-2xl">
            <div :class="['muster-roll-machine__frame', rolling ? 'is-rolling' : '', settled ? 'is-settled' : '']" :style="{ height: `${visibleWindowHeight}px` }">
              <div class="muster-roll-machine__viewport" :style="{ height: `${visibleWindowHeight}px` }">
                <div
                  class="muster-roll-machine__track"
                  :style="{ transform: reelTransform }"
                >
                  <div
                    v-for="row in reelRows"
                    :key="`${row.option.roll}-${row.cycle}-${row.absoluteIndex}`"
                    :class="[
                      'muster-roll-machine__row',
                      row.absoluteIndex === centeredAbsoluteIndex ? 'is-center' : '',
                      settled && row.absoluteIndex === targetAbsoluteIndex ? 'is-jackpot' : '',
                    ]"
                    :style="rowPresentation(row.absoluteIndex)"
                  >
                    <span class="muster-roll-machine__row-roll">{{ row.option.roll }}</span>
                    <span class="muster-roll-machine__row-label">{{ row.option.benefit }}</span>
                  </div>
                </div>
              </div>
              <div class="muster-roll-machine__scanline" />
              <div class="muster-roll-machine__marker" :style="markerStyle" />
            </div>
          </div>
        </div>

        <div
          v-if="settled && linkedResolutionIds.length"
          class="border-t border-amber-300/15 bg-[linear-gradient(180deg,rgba(120,53,15,0.16),rgba(69,26,3,0.2))] px-5 py-5"
        >
          <div class="mt-4">
            <EventResolutionList :resolution-ids="linkedResolutionIds" @resolved="close" />
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.muster-roll-modal {
  background:
    linear-gradient(180deg, rgba(62, 24, 8, 0.98), rgba(24, 11, 6, 0.99));
  box-shadow:
    0 0 0 1px rgba(251, 191, 36, 0.08),
    0 28px 72px rgba(18, 7, 3, 0.58);
}

.muster-roll-machine__frame {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(34, 211, 238, 0.18);
  background:
    radial-gradient(circle at top, rgba(34, 211, 238, 0.12), transparent 26%),
    linear-gradient(180deg, rgba(4, 12, 24, 1), rgba(2, 8, 18, 1));
  box-shadow:
    inset 0 0 0 1px rgba(34, 211, 238, 0.1),
    inset 0 18px 30px rgba(255, 255, 255, 0.025),
    0 0 34px rgba(2, 132, 199, 0.12);
}

.muster-roll-machine__viewport {
  position: relative;
  overflow: hidden;
  padding: 0 1rem;
  background:
    linear-gradient(180deg, rgba(5, 16, 30, 0.72), rgba(3, 10, 20, 0.26) 18%, rgba(3, 10, 20, 0.26) 82%, rgba(5, 16, 30, 0.72));
}

.muster-roll-machine__track {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  will-change: transform;
}

.muster-roll-machine__row {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 3.4rem minmax(0, 1fr);
  align-items: center;
  gap: 0.9rem;
  height: 3.5rem;
  min-height: 3.5rem;
  padding: 0.55rem 0.8rem;
  border: 1px solid rgba(34, 211, 238, 0.2);
  background: rgba(7, 20, 34, 0.94);
  color: rgba(224, 242, 254, 0.74);
  transform: scale(0.92);
  opacity: 0.28;
  transition:
    transform 150ms cubic-bezier(0.2, 0.8, 0.22, 1),
    opacity 150ms cubic-bezier(0.2, 0.8, 0.22, 1),
    border-color 150ms ease,
    box-shadow 150ms ease,
    color 150ms ease,
    background-color 150ms ease,
    filter 150ms ease;
  filter: blur(1.05px);
}

.muster-roll-machine__frame.is-rolling .muster-roll-machine__row {
  box-shadow:
    0 0 0 1px rgba(34, 211, 238, 0.06),
    0 0 18px rgba(8, 145, 178, 0.14);
}

.muster-roll-machine__row-roll {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 2.35rem;
  border: 1px solid rgba(34, 211, 238, 0.22);
  background: rgba(10, 29, 47, 0.96);
  font-size: 1.15rem;
  font-weight: 700;
  color: rgba(236, 254, 255, 0.96);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.025);
}

.muster-roll-machine__row-label {
  min-width: 0;
  font-size: 1rem;
  font-weight: 600;
  text-shadow: 0 0 10px rgba(8, 145, 178, 0.1);
}

.muster-roll-machine__row.is-center {
  transform: scale(1);
  opacity: 1;
  border-color: rgba(251, 191, 36, 0.38);
  background: linear-gradient(180deg, rgba(58, 25, 10, 0.96), rgba(34, 17, 10, 0.98));
  color: rgba(255, 247, 237, 0.98);
  box-shadow:
    0 0 0 1px rgba(251, 191, 36, 0.08),
    0 0 26px rgba(245, 158, 11, 0.14);
  filter: blur(0);
}

.muster-roll-machine__row.is-jackpot {
  animation: muster-roll-jackpot 1.15s ease-in-out infinite;
}

.muster-roll-machine__frame.is-rolling .muster-roll-machine__row.is-center {
  box-shadow:
    0 0 0 1px rgba(34, 211, 238, 0.08),
    0 0 26px rgba(34, 211, 238, 0.18),
    0 0 44px rgba(8, 145, 178, 0.12);
  filter: blur(0.7px);
}

.muster-roll-machine__scanline {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 10%, rgba(255,255,255,0) 90%, rgba(255,255,255,0.03) 100%),
    linear-gradient(90deg, rgba(8, 145, 178, 0.08), transparent 22%, transparent 78%, rgba(8, 145, 178, 0.08));
}

.muster-roll-machine__marker {
  position: absolute;
  left: 0.75rem;
  right: 0.75rem;
  border-top: 1px solid rgba(251, 191, 36, 0.34);
  border-bottom: 1px solid rgba(251, 191, 36, 0.34);
  box-shadow:
    0 0 18px rgba(251, 191, 36, 0.12),
    inset 0 0 22px rgba(251, 191, 36, 0.06);
  pointer-events: none;
}

.muster-roll-fade-enter-active,
.muster-roll-fade-leave-active {
  transition: opacity 180ms ease;
}

.muster-roll-fade-enter-from,
.muster-roll-fade-leave-to {
  opacity: 0;
}

@keyframes muster-roll-jackpot {
  0%,
  100% {
    text-shadow:
      0 0 8px rgba(255, 247, 237, 0.16),
      0 0 18px rgba(251, 191, 36, 0.22);
    box-shadow:
      0 0 0 1px rgba(251, 191, 36, 0.08),
      0 0 24px rgba(245, 158, 11, 0.16);
    filter: brightness(1);
  }
  50% {
    text-shadow:
      0 0 10px rgba(255, 251, 235, 0.24),
      0 0 26px rgba(251, 191, 36, 0.34),
      0 0 38px rgba(249, 115, 22, 0.16);
    box-shadow:
      0 0 0 1px rgba(253, 224, 71, 0.12),
      0 0 34px rgba(251, 191, 36, 0.24),
      0 0 52px rgba(249, 115, 22, 0.12);
    filter: brightness(1.08);
  }
}
</style>
