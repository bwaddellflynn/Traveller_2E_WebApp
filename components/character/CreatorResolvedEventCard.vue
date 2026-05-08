<script setup lang="ts">
import CreatorDetailsButton from '~/components/character/CreatorDetailsButton.vue'
import EventResolutionList from '~/components/character/EventResolutionList.vue'

const props = defineProps<{
  summary: string
  eventName: string
  text?: string | null
  sourcePrefix: string
}>()

defineEmits<{
  (event: 'details'): void
  (event: 'show-roll', payload: {
    title: string
    result: string
    modifier?: number
    total?: number
    dice?: number[]
  }): void
}>()
</script>

<template>
  <div class="mt-3 rounded-md bg-stone-50 p-3 text-sm">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="font-semibold">{{ props.summary }} · {{ props.eventName }}</p>
      <CreatorDetailsButton @click="$emit('details')" />
    </div>
    <p v-if="props.text" class="mt-2 line-clamp-2 text-zinc-600">{{ props.text }}</p>
    <EventResolutionList :source-prefix="props.sourcePrefix" @show-roll="$emit('show-roll', $event)" />
  </div>
</template>
