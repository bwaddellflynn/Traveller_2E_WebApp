<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useCharacterCreatorStore } from '~/stores/characterCreator'

const characterCreator = useCharacterCreatorStore()
const {
  activeCreatorTab,
  characterName,
  characterGender,
  characterHomeworld,
  characterSpecies,
  currentAge,
  creatorGenderOptions,
  creatorGenderVisible,
  creatorSpeciesCatalog,
  creatorDisplayTitle,
  creatorSelectedSpeciesSummary,
  endOfTermAge,
} = storeToRefs(characterCreator)

const characterCreatorAgeLabel = computed(() => {
  if (['creation', 'setup-stats', 'setup-skills'].includes(activeCreatorTab.value)) return 'Age 18'
  return `Age ${currentAge.value}-${endOfTermAge.value}`
})
</script>

<template>
  <header class="mx-auto w-full max-w-7xl px-5 pt-6 sm:px-8 lg:px-10">
    <div class="hud-panel rounded-lg border p-5">
      <div class="creator-header-grid">
        <label class="creator-header-grid__name">
          <div class="hud-field h-11">
            <input
              v-model="characterName"
              class="hud-field__input"
              placeholder="Unnamed Traveller"
            >
          </div>
        </label>

        <div class="hud-readout min-h-11 creator-header-grid__title">
          <span class="hud-readout__value">{{ `Title: ${creatorDisplayTitle || 'No title yet'}` }}</span>
        </div>

        <div class="hud-readout min-h-11 creator-header-grid__age">
          <span class="hud-readout__value">{{ characterCreatorAgeLabel }}</span>
        </div>

        <label class="creator-header-grid__homeworld">
          <div class="hud-field h-11">
            <input
              v-model="characterHomeworld"
              class="hud-field__input"
              placeholder="Homeworld"
            >
          </div>
        </label>

        <label class="creator-header-grid__species">
          <div class="hud-field h-11">
            <span class="hud-field__prefix">Species</span>
            <select v-model="characterSpecies" class="hud-field__input hud-field__input--select">
              <option disabled value="">
                Select species
              </option>
              <option
                v-for="species in creatorSpeciesCatalog"
                :key="species.id"
                :value="species.name"
              >
                {{ species.name }}
              </option>
            </select>
          </div>
        </label>

        <div v-if="creatorGenderVisible" class="creator-header-grid__gender hud-toggle-strip" role="radiogroup" aria-label="Gender">
          <span class="hud-toggle-strip__label">Gender</span>
          <div class="hud-toggle-strip__controls">
            <button
              v-for="option in creatorGenderOptions"
              :key="option.id"
              type="button"
              class="hud-toggle-strip__button"
              :class="{ 'hud-toggle-strip__button--active': characterGender === option.label }"
              :aria-pressed="characterGender === option.label"
              @click="characterGender = option.label"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <div class="hud-readout min-h-11 creator-header-grid__species-summary" :class="{ 'creator-header-grid__species-summary--wide': !creatorGenderVisible }">
          <span class="hud-readout__value">{{ creatorSelectedSpeciesSummary }}</span>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.hud-field {
  display: flex;
  align-items: center;
  overflow: hidden;
  border: 1px solid rgba(34, 211, 238, 0.32);
  border-radius: 10px 0 10px 0;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  background:
    linear-gradient(180deg, rgba(8, 18, 32, 0.92), rgba(3, 7, 18, 0.94)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.1), transparent 8rem);
}

.hud-field:focus-within {
  border-color: rgba(251, 191, 36, 0.62);
  box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.14);
}

.hud-field__input {
  width: 100%;
  min-width: 0;
  height: 100%;
  border: 0;
  background: transparent;
  padding: 0 0.9rem;
  color: #f4f4f5;
  outline: none;
}

.hud-field__input::placeholder {
  color: rgba(228, 228, 231, 0.46);
}

.hud-field__input--select {
  appearance: none;
  color: #f4f4f5;
  cursor: pointer;
  padding-right: 2.4rem;
}

.hud-field__prefix {
  margin-left: 0.85rem;
  flex: 0 0 auto;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(103, 232, 249, 0.82);
}

.hud-readout {
  display: flex;
  align-items: center;
  min-height: 2.75rem;
  padding: 0 0.9rem;
  border: 1px solid rgba(34, 211, 238, 0.24);
  border-radius: 10px 0 10px 0;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  background:
    linear-gradient(180deg, rgba(8, 18, 32, 0.86), rgba(3, 7, 18, 0.9)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.08), transparent 8rem);
}

.hud-readout__value {
  min-width: 0;
  color: #f4f4f5;
  font-size: 0.92rem;
  font-weight: 600;
  line-height: 1.2;
}

.hud-toggle-strip {
  display: flex;
  align-items: stretch;
  align-items: stretch;
  min-height: 2.75rem;
  overflow: hidden;
  border: 1px solid rgba(34, 211, 238, 0.28);
  border-radius: 10px 0 10px 0;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  background:
    linear-gradient(180deg, rgba(8, 18, 32, 0.9), rgba(3, 7, 18, 0.94)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.08), transparent 8rem);
}

.hud-toggle-strip__label {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  padding: 0 0.9rem;
  border-right: 1px solid rgba(34, 211, 238, 0.16);
  color: rgba(103, 232, 249, 0.82);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.hud-toggle-strip__controls {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  flex: 1 1 auto;
}

.hud-toggle-strip__button {
  min-width: 0;
  border: 0;
  border-right: 1px solid rgba(34, 211, 238, 0.16);
  background: transparent;
  padding: 0 0.95rem;
  color: rgba(228, 228, 231, 0.82);
  font-size: 0.84rem;
  font-weight: 700;
  line-height: 1;
  transition: background-color 140ms ease, color 140ms ease, box-shadow 140ms ease;
}

.hud-toggle-strip__button:last-child {
  border-right: 0;
}

.hud-toggle-strip__button:hover {
  color: #f8fafc;
  background: rgba(34, 211, 238, 0.08);
}

.hud-toggle-strip__button--active {
  color: #f8fafc;
  background:
    linear-gradient(180deg, rgba(34, 211, 238, 0.16), rgba(34, 211, 238, 0.08)),
    rgba(8, 18, 32, 0.98);
  box-shadow: inset 0 0 18px rgba(34, 211, 238, 0.14);
}

.creator-header-grid {
  display: grid;
  gap: 0.75rem;
}

@media (min-width: 1280px) {
  .creator-header-grid {
    grid-template-columns: minmax(0, 1.35fr) minmax(0, 1.2fr) 9rem minmax(0, 1.1fr);
    align-items: center;
  }

  .creator-header-grid__title {
    grid-column: 2 / 3;
  }

  .creator-header-grid__age {
    grid-column: 3 / 4;
  }

  .creator-header-grid__homeworld {
    grid-column: 4 / 5;
  }

  .creator-header-grid__species {
    grid-column: 1 / 2;
  }

  .creator-header-grid__gender {
    grid-column: 2 / 3;
  }

  .creator-header-grid__species-summary {
    grid-column: 3 / 5;
    align-items: center;
  }

  .creator-header-grid__species-summary--wide {
    grid-column: 2 / 5;
  }
}
</style>
