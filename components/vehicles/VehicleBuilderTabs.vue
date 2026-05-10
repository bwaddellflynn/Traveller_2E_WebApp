<script setup lang="ts">
const props = defineProps<{
  steps: Array<{ id: string, label: string, title: string, description: string }>
  activeStep: number
  canAccessStep: (index: number) => boolean
}>()

const emit = defineEmits<{
  (event: 'select-step', index: number): void
}>()
</script>

<template>
  <!-- Step navigation for the vehicle builder. -->
  <div class="mt-5 flex flex-wrap gap-1 border-b border-zinc-300">
    <button
      v-for="(step, index) in props.steps"
      :key="step.id"
      class="-mb-px rounded-t-md border px-3 py-2 text-sm font-semibold"
      :class="[
        props.activeStep === index ? 'border-zinc-300 border-b-white bg-white text-zinc-950' : 'border-transparent text-zinc-600',
        props.canAccessStep(index) ? 'hover:text-zinc-950' : 'cursor-not-allowed opacity-45',
      ]"
      type="button"
      :disabled="!props.canAccessStep(index)"
      @click="emit('select-step', index)"
    >
      {{ index + 1 }}. {{ step.label }}
    </button>
  </div>
</template>
