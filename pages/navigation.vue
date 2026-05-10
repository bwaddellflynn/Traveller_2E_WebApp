<script setup lang="ts">
const mapUrl = 'https://travellermap.com/?forceui=1'
</script>

<template>
  <main class="min-h-screen">
    <section class="mx-auto grid w-full max-w-[1700px] gap-5 px-4 py-6 sm:px-8 lg:px-10">
      <div class="navigation-page">
        <div class="navigation-page__chrome">
          <span class="navigation-page__title">Navigation</span>
        </div>

        <div class="navigation-page__frame">
          <iframe
            :src="mapUrl"
            class="navigation-page__iframe"
            title="Traveller Map"
            loading="lazy"
            referrerpolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.navigation-page {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(34, 211, 238, 0.42);
  border-radius: 16px 0 16px 0;
  clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 18px 100%, 0 calc(100% - 18px));
  background:
    linear-gradient(180deg, rgba(8, 18, 32, 0.96), rgba(3, 7, 18, 0.96)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.16), transparent 24rem);
  box-shadow:
    0 0 26px rgba(34, 211, 238, 0.13),
    inset 0 0 36px rgba(34, 211, 238, 0.07),
    0 0 0 1px rgba(34, 211, 238, 0.08) inset,
    0 0 0 10px rgba(7, 12, 21, 0.55) inset,
    0 20px 50px rgba(0, 0, 0, 0.35);
}

.navigation-page::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-top: 1px solid rgba(103, 232, 249, 0.65);
  background:
    linear-gradient(90deg, rgba(34, 211, 238, 0.44), transparent 22%, transparent 78%, rgba(34, 211, 238, 0.38)) top / 100% 2px no-repeat;
}

.navigation-page__chrome {
  padding: 14px 20px;
  background:
    linear-gradient(90deg, rgba(34, 211, 238, 0.22), rgba(34, 211, 238, 0.08) 45%, rgba(245, 158, 11, 0.16)),
    rgba(15, 23, 42, 0.92);
  border-bottom: 1px solid rgba(34, 211, 238, 0.35);
  color: #e0f2fe;
  font-size: 1.35rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  text-shadow: 0 0 16px rgba(34, 211, 238, 0.28);
}

.navigation-page__frame {
  flex: 1 1 auto;
  padding: 16px;
}

.navigation-page__iframe {
  display: block;
  width: 100%;
  height: min(72vh, calc(100vh - 12.5rem));
  border: 1px solid rgba(34, 211, 238, 0.28);
  border-radius: 12px 0 12px 0;
  clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px));
  background: rgba(5, 10, 19, 0.96);
  box-shadow:
    inset 0 0 0 1px rgba(34, 211, 238, 0.08),
    0 0 20px rgba(34, 211, 238, 0.08);
}

@media (max-width: 760px) {
  .navigation-page__chrome {
    font-size: 1rem;
  }

  .navigation-page__frame {
    padding: 12px;
  }

  .navigation-page__iframe {
    height: min(68vh, calc(100vh - 11rem));
  }
}
</style>
