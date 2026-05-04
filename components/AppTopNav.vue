<template>
  <header class="app-top-nav">
    <NuxtLink class="flex items-center gap-3" to="/">
      <span class="hud-glyph grid h-10 w-10 place-items-center rounded-md">
        <AppIcon name="dice" />
      </span>
      <span>
        <span class="block text-sm font-semibold text-cyan-50">Traveller 2E Toolkit</span>
        <span class="block text-xs text-cyan-200/70">Local rules data workspace</span>
      </span>
    </NuxtLink>

    <nav class="flex flex-wrap items-center gap-2">
      <NuxtLink class="hud-link px-3 py-2 text-sm font-semibold" to="/character/create">
        Creator
      </NuxtLink>
      <NuxtLink class="hud-link px-3 py-2 text-sm font-semibold" to="/weapons">
        Armory
      </NuxtLink>
      <NuxtLink class="hud-link px-3 py-2 text-sm font-semibold" to="/">
        Hub
      </NuxtLink>
    </nav>
  </header>
</template>
