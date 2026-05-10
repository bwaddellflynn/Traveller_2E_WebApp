<script setup lang="ts">
import AppIcon from '~/components/AppIcon.vue'

const props = defineProps<{
  title: string
  items: string[]
  suggestions?: string[]
  addLabel: string
}>()

const emit = defineEmits<{
  (event: 'add', value: string): void
  (event: 'remove', index: number): void
}>()

const draft = ref('')

const addItem = () => {
  const value = draft.value.trim()
  if (!value) return
  emit('add', value)
  draft.value = ''
}
</script>

<template>
  <div class="grid gap-2 rounded-md border border-cyan-400/20 bg-slate-950/30 p-3">
    <div class="flex items-center justify-between gap-3">
      <p class="text-sm font-semibold text-cyan-50">{{ props.title }}</p>
      <span class="text-xs text-cyan-100/60">{{ props.items.length }} entries</span>
    </div>

    <div class="flex flex-wrap gap-2">
      <span
        v-for="(item, index) in props.items"
        :key="`${props.title}-${item}-${index}`"
        class="inline-flex items-center gap-2 rounded-md border border-cyan-300/25 bg-cyan-300/10 px-2 py-1 text-xs text-cyan-100"
      >
        {{ item }}
        <button class="inline-flex text-cyan-100/70 hover:text-red-200" type="button" @click="emit('remove', index)">
          <AppIcon class="h-3.5 w-3.5" name="close" />
        </button>
      </span>
    </div>

    <div class="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
      <input
        v-model="draft"
        :list="`${props.title}-suggestions`"
        class="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
        :placeholder="props.addLabel"
        @keydown.enter.prevent="addItem"
      >
      <button class="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 hover:border-amber-600" type="button" @click="addItem">
        Add
      </button>
    </div>

    <datalist v-if="props.suggestions?.length" :id="`${props.title}-suggestions`">
      <option v-for="option in props.suggestions" :key="option" :value="option" />
    </datalist>
  </div>
</template>
