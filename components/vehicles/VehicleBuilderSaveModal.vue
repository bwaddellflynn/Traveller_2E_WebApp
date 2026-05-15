<script setup lang="ts">
const props = defineProps<{
  open: boolean
  issues: string[]
  vehicleName: string
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'update:vehicleName', value: string): void
  (event: 'select-issue', issue: string): void
  (event: 'save'): void
}>()
</script>

<template>
  <div v-if="props.open" class="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/75 px-4 py-6" @click="emit('close')">
    <section class="w-full max-w-2xl overflow-hidden rounded-lg border border-cyan-300/30 bg-slate-950/95 shadow-[0_0_44px_rgba(34,211,238,0.22)]" role="dialog" aria-modal="true" @click.stop>
      <header class="grid min-h-[5.75rem] gap-3 border-b border-cyan-400/25 bg-cyan-950/55 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.22em] text-cyan-100/70">Vehicle Builder</p>
          <h3 class="mt-2 text-2xl font-black uppercase leading-none tracking-wide text-cyan-50">
            {{ props.issues.length ? 'Resolve Build Issues' : 'Save Vehicle' }}
          </h3>
        </div>
        <button class="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-sm font-semibold text-cyan-50 transition hover:border-cyan-200" type="button" @click="emit('close')">
          Close
        </button>
      </header>

      <div class="grid gap-4 px-5 py-5">
        <template v-if="props.issues.length">
          <p class="text-sm leading-6 text-zinc-300">
            These items need attention before the vehicle can be saved. Select an item to jump to the matching build step.
          </p>

          <div class="max-h-[26rem] overflow-auto rounded-md border border-cyan-400/20">
            <button
              v-for="issue in props.issues"
              :key="issue"
              class="grid w-full grid-cols-[auto_minmax(0,1fr)] items-start gap-3 border-b border-cyan-400/10 px-4 py-3 text-left text-sm text-zinc-200 transition last:border-b-0 hover:bg-cyan-300/10 hover:text-cyan-50"
              type="button"
              @click="emit('select-issue', issue)"
            >
              <span class="mt-1 h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_14px_rgba(252,211,77,0.65)]" />
              <span class="min-w-0 leading-5">{{ issue }}</span>
            </button>
          </div>
        </template>

        <template v-else>
          <p class="text-sm leading-6 text-zinc-300">
            The build checks are clear. Name the vehicle before saving it to Custom Vehicles.
          </p>

          <label class="grid gap-2 text-[11px] font-black uppercase tracking-wide text-cyan-100/70">
            <span>Vehicle Name</span>
            <input
              :value="props.vehicleName"
              class="h-11 rounded-md border border-cyan-400/25 bg-slate-950/70 px-3 text-sm font-normal normal-case tracking-normal text-cyan-50 outline-none transition focus:border-cyan-200"
              placeholder="Scout Recon Rover"
              @input="emit('update:vehicleName', ($event.target as HTMLInputElement).value)"
              @keydown.enter.prevent="emit('save')"
            >
          </label>

          <div class="flex flex-wrap justify-end gap-2 border-t border-cyan-400/20 pt-4">
            <button class="rounded-md border border-cyan-300/20 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200" type="button" @click="emit('close')">
              Cancel
            </button>
            <button
              class="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-50 transition hover:border-cyan-200 disabled:cursor-not-allowed disabled:opacity-45"
              :disabled="!props.vehicleName.trim()"
              type="button"
              @click="emit('save')"
            >
              Save Vehicle
            </button>
          </div>
        </template>
      </div>
    </section>
  </div>
</template>
