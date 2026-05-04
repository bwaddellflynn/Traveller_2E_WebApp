<script setup lang="ts">
const props = defineProps<{
  name: 'user' | 'briefcase' | 'wrench' | 'car' | 'bot' | 'rocket' | 'ship' | 'dice' | 'arrow' | 'check' | 'lock' | 'plus' | 'sliders' | 'sort-asc' | 'sort-desc'
}>()

const paths = {
  user: [
    'M7 20v-6l2-3h6l2 3v6',
    'M8 11V6l4-3 4 3v5',
    'M9 8h6',
    'M10 15h4',
    'M5 20h14',
  ],
  briefcase: [
    'M4 8h10l2 2h4v8l-2 2H6l-2-2Z',
    'M7 8V6h6v2',
    'M7 13h10',
    'M9 16h6',
    'M18 10v-2',
  ],
  wrench: [
    'M4 19l7-7',
    'M13 4l7 7-4 4-7-7Z',
    'M15 6l3 3',
    'M6 17l1 1',
    'M10 13l2 2',
  ],
  car: [
    'M3 15h2l2-5h10l2 5h2',
    'M5 15v3h14v-3',
    'M8 18v2',
    'M16 18v2',
    'M8 10l2-3h4l2 3',
    'M7 14h10',
  ],
  bot: [
    'M12 6V3',
    'M8 3h8',
    'M6 8h12l2 3v7l-2 3H6l-2-3v-7Z',
    'M8 13h2',
    'M14 13h2',
    'M9 17h6',
  ],
  rocket: [
    'M4 18l5-2 7-10 4-2-2 4-10 7-2 5Z',
    'M10 14l-4-4',
    'M14 10l-4-4',
    'M15 7h.01',
    'M5 21l3-3',
  ],
  ship: [
    'M3 16l9-11 9 11-5 1-4 4-4-4Z',
    'M9 15h6',
    'M12 5v8',
    'M6 18l-2 3',
    'M18 18l2 3',
  ],
  dice: [
    'M12 3l8 5v8l-8 5-8-5V8Z',
    'M12 3v8',
    'M20 8l-8 3-8-3',
    'M12 11v10',
    'M9 8h.01',
    'M15 15h.01',
  ],
  arrow: [
    'M4 12h10',
    'M13 6l7 6-7 6',
    'M4 8h4',
    'M4 16h4',
  ],
  check: [
    'M4 12l4 5L20 6',
    'M5 5h5',
    'M14 19h5',
  ],
  lock: [
    'M7 10V7a5 5 0 0 1 10 0v3',
    'M5 10h14v9l-2 2H7l-2-2Z',
    'M12 14v3',
    'M9 10V7a3 3 0 0 1 6 0v3',
  ],
  plus: [
    'M12 5v14',
    'M5 12h14',
    'M7 7h3',
    'M14 17h3',
  ],
  sliders: [
    'M4 6h8',
    'M16 6h4',
    'M12 4l4 2-4 2Z',
    'M4 12h3',
    'M11 12h9',
    'M7 10l4 2-4 2Z',
    'M4 18h10',
    'M18 18h2',
    'M14 16l4 2-4 2Z',
  ],
  'sort-asc': [
    'M6 18V6',
    'M3 9l3-3 3 3',
    'M12 8h8',
    'M12 12h6',
    'M12 16h3',
  ],
  'sort-desc': [
    'M6 6v12',
    'M3 15l3 3 3-3',
    'M12 8h3',
    'M12 12h6',
    'M12 16h8',
  ],
}
</script>

<template>
  <svg
    aria-hidden="true"
    class="h-5 w-5 drop-shadow-[0_0_6px_currentColor]"
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
