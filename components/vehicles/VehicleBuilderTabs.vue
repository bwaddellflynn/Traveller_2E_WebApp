<script setup lang="ts">
const props = defineProps<{
  steps: Array<{ id: string, label: string, title: string, description: string }>
  activeStep: number
  stepHasIssues?: boolean[]
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
        props.activeStep === index
          ? (props.stepHasIssues?.[index]
              ? 'border-amber-500 border-b-white bg-white text-amber-700'
              : 'border-zinc-300 border-b-white bg-white text-zinc-950')
          : (props.stepHasIssues?.[index]
              ? 'border-amber-500/70 bg-amber-500/10 text-amber-200'
              : 'border-transparent text-zinc-600 hover:text-zinc-950'),
      ]"
      type="button"
      @click="emit('select-step', index)"
    >
      {{ index + 1 }}. {{ step.label }}
    </button>
  </div>
</template>
