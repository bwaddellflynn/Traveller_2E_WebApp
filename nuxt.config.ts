export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  
  // Add modules
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],

  // Include Tailwind CSS
  css: ['@/assets/css/tailwind.css']
})
