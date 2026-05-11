<script setup lang="ts">
const props = defineProps<{
  open: boolean
  title: string
  body: string
}>()

const emit = defineEmits<{
  (event: 'close'): void
}>()
</script>

<template>
  <div v-if="props.open" class="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 px-4 py-6" @click="emit('close')">
    <section class="w-full max-w-lg rounded-lg border border-cyan-300/30 bg-slate-950/95 shadow-[0_0_40px_rgba(34,211,238,0.18)]" @click.stop>
      <header class="flex items-center justify-between gap-3 border-b border-cyan-400/20 px-5 py-4">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Draft Field Context</p>
          <h3 class="mt-1 text-lg font-semibold text-cyan-50">{{ props.title }}</h3>
        </div>
        <button class="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-sm font-semibold text-cyan-50 transition hover:border-cyan-200 hover:bg-cyan-300/15" type="button" @click="emit('close')">
          Close
        </button>
      </header>

      <div class="px-5 py-5">
        <p class="text-sm leading-6 text-zinc-300">
          {{ props.body }}
        </p>
      </div>
    </section>
  </div>
</template>
