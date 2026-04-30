<script setup lang="ts">
const props = defineProps<{
  name: 'user' | 'briefcase' | 'wrench' | 'car' | 'bot' | 'rocket' | 'ship' | 'dice' | 'arrow' | 'check' | 'lock' | 'sliders' | 'sort-asc' | 'sort-desc'
}>()

const paths = {
  user: [
    'M20 21a8 8 0 0 0-16 0',
    'M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10',
  ],
  briefcase: [
    'M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1',
    'M4 7h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z',
    'M4 12h16',
  ],
  wrench: [
    'M14.7 6.3a4 4 0 0 0 4.8 5.2L11 20a2.1 2.1 0 0 1-3-3l8.5-8.5a4 4 0 0 0-5.2-4.8',
  ],
  car: [
    'M5 17h14',
    'M6 17V9l2-4h8l2 4v8',
    'M8 17v2',
    'M16 17v2',
    'M7 11h10',
  ],
  bot: [
    'M12 8V4',
    'M8 4h8',
    'M6 10h12v9H6z',
    'M9 14h.01',
    'M15 14h.01',
  ],
  rocket: [
    'M5 19c2-1 3-2 4-4',
    'M9 15 5 11l4-1 5-5c2-2 4-3 6-3 0 2-1 4-3 6l-5 5-1 4Z',
    'M14 6h.01',
  ],
  ship: [
    'M4 17h16l-2 4H6z',
    'M7 17V9h7l3 8',
    'M9 9V4h4v5',
  ],
  dice: [
    'M5 5h14v14H5z',
    'M8 8h.01',
    'M12 12h.01',
    'M16 16h.01',
  ],
  arrow: [
    'M5 12h14',
    'M13 6l6 6-6 6',
  ],
  check: [
    'M5 13l4 4L19 7',
  ],
  lock: [
    'M7 11h10v9H7z',
    'M9 11V8a3 3 0 0 1 6 0v3',
  ],
  sliders: [
    'M4 6h10',
    'M18 6h2',
    'M14 6a2 2 0 1 0 4 0 2 2 0 0 0-4 0',
    'M4 12h2',
    'M10 12h10',
    'M6 12a2 2 0 1 0 4 0 2 2 0 0 0-4 0',
    'M4 18h12',
    'M20 18h0',
    'M16 18a2 2 0 1 0 4 0 2 2 0 0 0-4 0',
  ],
  'sort-asc': [
    'M6 17V7',
    'M3 10l3-3 3 3',
    'M11 8h10',
    'M11 12h7',
    'M11 16h4',
  ],
  'sort-desc': [
    'M6 7v10',
    'M3 14l3 3 3-3',
    'M11 8h4',
    'M11 12h7',
    'M11 16h10',
  ],
}
</script>

<template>
  <svg
    aria-hidden="true"
    class="h-5 w-5"
    fill="none"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    stroke-width="2"
    viewBox="0 0 24 24"
  >
    <path v-for="path in paths[props.name]" :key="path" :d="path" />
  </svg>
</template>
