<script setup lang="ts">
const reportType = ref('bug')
const email = ref('')
const subject = ref('')
const message = ref('')
const submitted = ref(false)

const submitReport = () => {
  submitted.value = true
}
</script>

<template>
  <main class="min-h-screen">
    <section class="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8 lg:px-10">
      <p class="hud-kicker text-sm font-semibold uppercase tracking-wide">Contact</p>
      <h1 class="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">Contact Us</h1>
      <p class="mt-5 max-w-2xl text-sm leading-6 text-cyan-100/80">
        Send a bug report, data correction, or feature request. This form is a front-end placeholder until a support endpoint is wired in.
      </p>

      <form class="hud-panel mt-8 grid gap-4 rounded-lg border p-5" @submit.prevent="submitReport">
        <label class="grid gap-2">
          <span class="text-sm font-semibold">Report Type</span>
          <select v-model="reportType" class="h-11 rounded-md border border-cyan-400/30 bg-slate-950 px-3 text-sm text-cyan-50 outline-none">
            <option value="bug">Bug report</option>
            <option value="data">Data correction</option>
            <option value="feature">Feature request</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label class="grid gap-2">
          <span class="text-sm font-semibold">Email</span>
          <input v-model="email" class="h-11 rounded-md border border-cyan-400/30 bg-slate-950 px-3 text-sm text-cyan-50 outline-none" placeholder="you@example.com" type="email">
        </label>

        <label class="grid gap-2">
          <span class="text-sm font-semibold">Subject</span>
          <input v-model="subject" class="h-11 rounded-md border border-cyan-400/30 bg-slate-950 px-3 text-sm text-cyan-50 outline-none" placeholder="Short summary" type="text">
        </label>

        <label class="grid gap-2">
          <span class="text-sm font-semibold">Details</span>
          <textarea v-model="message" class="min-h-36 rounded-md border border-cyan-400/30 bg-slate-950 px-3 py-2 text-sm text-cyan-50 outline-none" placeholder="What happened, what did you expect, and where did you see it?"></textarea>
        </label>

        <div class="flex flex-wrap items-center justify-between gap-3">
          <p v-if="submitted" class="text-sm font-semibold text-emerald-300">
            Report staged locally. Backend submission can be wired in later.
          </p>
          <span v-else class="text-sm text-cyan-100/70">
            No message is sent yet.
          </span>
          <button class="hud-link h-10 px-4 text-sm font-semibold" type="submit">
            Stage Report
          </button>
        </div>
      </form>
    </section>
  </main>
</template>
