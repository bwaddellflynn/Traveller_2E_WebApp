<script setup lang="ts">
const props = defineProps<{
  name: 'user' | 'portrait' | 'briefcase' | 'wrench' | 'car' | 'bot' | 'rocket' | 'ship' | 'scout-badge' | 'dice' | 'arrow' | 'check' | 'lock' | 'plus' | 'sliders' | 'sort-asc' | 'sort-desc' | 'warning' | 'close' | 'restart' | 'import' | 'export' | 'copy' | 'trash' | 'save' | 'fullscreen-enter' | 'fullscreen-exit' | 'weapon-melee' | 'weapon-sidearm' | 'weapon-longarm' | 'weapon-shotgun' | 'weapon-support' | 'weapon-heavy' | 'weapon-launcher' | 'weapon-grenade' | 'weapon-charge' | 'weapon-energy-sidearm' | 'weapon-energy-longarm'
}>()

const paths = {
  user: [
    'M7 20v-6l2-3h6l2 3v6',
    'M8 11V6l4-3 4 3v5',
    'M9 8h6',
    'M10 15h4',
    'M5 20h14',
  ],
  portrait: [
    'M6 5h8l4 4v10l-2 2H6l-2-2V7Z',
    'M14 5v4h4',
    'M9.5 11.5a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0',
    'M8.5 18c.7-2 2.3-3 3.5-3s2.8 1 3.5 3',
    'M7 8h2',
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
  'scout-badge': [
    'M12 3l7 4v7c0 3-3 6-7 7s-7-4-7-7V7Z',
    'M12 6l4 7-4-2-4 2Z',
    'M12 6v9',
    'M8 17h8',
    'M9 8l-3 2',
    'M15 8l3 2',
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
  warning: [
    'M12 4l9 16H3Z',
    'M12 9v5',
    'M12 17h.01',
  ],
  close: [
    'M6 6l12 12',
    'M18 6L6 18',
  ],
  restart: [
    'M20 11a8 8 0 1 0 2 5',
    'M20 4v7h-7',
  ],
  import: [
    'M12 3v12',
    'M7 10l5 5 5-5',
    'M5 19h14',
    'M4 16v4h16v-4',
  ],
  export: [
    'M12 21V9',
    'M7 14l5-5 5 5',
    'M5 5h14',
    'M4 4v4h16V4',
  ],
  copy: [
    'M9 9h10v11H9z',
    'M5 5h10v2',
    'M5 5v11h2',
  ],
  trash: [
    'M5 7h14',
    'M9 7V5h6v2',
    'M7 7l1 12h8l1-12',
    'M10 11v5',
    'M14 11v5',
  ],
  save: [
    'M5 4h12l2 2v14H5z',
    'M8 4v5h7',
    'M8 20v-6h8v6',
    'M15 4v5',
  ],
  'fullscreen-enter': [
    'M4 9V4h5',
    'M20 9V4h-5',
    'M4 15v5h5',
    'M20 15v5h-5',
    'M9 4L4 9',
    'M15 4l5 5',
    'M9 20l-5-5',
    'M15 20l5-5',
  ],
  'fullscreen-exit': [
    'M9 4v5H4',
    'M15 4v5h5',
    'M9 20v-5H4',
    'M15 20v-5h5',
    'M4 4l5 5',
    'M20 4l-5 5',
    'M4 20l5-5',
    'M20 20l-5-5',
  ],
  'weapon-melee': [
    'M5 20l7-14 3 3-7 14H5Z',
    'M12 6l5-5 2 2-5 5',
    'M8 18l-2 4',
  ],
  'weapon-sidearm': [
    'M2 11h12l2-2h4l2 2v3l-2 2h-3l-1 2h-3l-2-3H9l-2 5H4l1-6H2Z',
    'M12 9h7',
    'M15 16l1 3',
    'M10 16l-1 4',
  ],
  'weapon-longarm': [
    'M2 12h14l4-2 2 1-2 2h-4l-3 2H8l-2 4H3l1-4H2Z',
    'M8 12V8h6',
    'M12 17l2 4',
  ],
  'weapon-shotgun': [
    'M2 12h14l3-1 3 1-3 2h-4l-2 2H8l-2 4H3l1-4H2Z',
    'M7 11h8',
    'M13 17l1 4',
  ],
  'weapon-support': [
    'M1.5 11h15l4-2 2 2-2 2h-4l-2 2H10',
    'M7 11V7h10',
    'M9 15l-2 7',
    'M16 15l2 7',
    'M19 11v7',
  ],
  'weapon-heavy': [
    'M2 11h14l4-2 2 2-2 2h-4l-2 2H10',
    'M7 11V6h10',
    'M9 16l-3 6',
    'M17 16l3 6',
    'M19 13h4',
  ],
  'weapon-launcher': [
    'M2 11h12l6-2 2 2-2 2h-5l-3 4H8l-2 3H3l1-3H2Z',
    'M6 11V7h8',
    'M18 8h4',
  ],
  'weapon-grenade': [
    'M8 8h8l2 2v6l-6 6-6-6v-6Z',
    'M10 8V4h4v4',
    'M14 4l3-2',
  ],
  'weapon-charge': [
    'M4 8h16v10H4Z',
    'M8 8V4h8v4',
    'M12 11v6',
    'M9 13h6',
  ],
  'weapon-energy-sidearm': [
    'M2 11h12l2-2h4l2 2v3l-2 2h-3l-1 2h-3l-2-3H9l-2 5H4l1-6H2Z',
    'M12 9h7',
    'M18 8h4',
    'M18 12h4',
    'M15 16l1 3',
  ],
  'weapon-energy-longarm': [
    'M2 12h14l4-2 2 1-2 2h-4l-3 2H8l-2 4H3l1-4H2Z',
    'M8 12V8h6',
    'M17 8h4',
    'M17 12h4',
    'M12 17l2 4',
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
