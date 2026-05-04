<template>
  <div class="traveller-hud min-h-screen text-cyan-50">
    <NuxtRouteAnnouncer />
    <AppTopNav />
    <div class="app-shell">
      <TravellersSideNav />
      <div class="app-shell-content">
        <NuxtPage />
        <AppFooter />
      </div>
    </div>
  </div>
</template>
