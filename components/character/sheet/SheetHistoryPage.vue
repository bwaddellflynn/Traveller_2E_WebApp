<script setup lang="ts">
import AppIcon from '~/components/AppIcon.vue'
import type { TravellerProfile } from '~/types/traveller'

defineProps<{
  draft: TravellerProfile
  associateActionLabels: Record<string, string>
  historyBackgroundLines: string
  addCareer: () => void
  removeCareer: (index: number) => void
  termRankLabel: (term: TravellerProfile['careers'][number]) => string
  termNotesLabel: (term: TravellerProfile['careers'][number]) => string
  addAssociate: (groupId: string) => void
  removeAssociate: (groupId: string, index: number) => void
}>()

defineEmits<{
  (event: 'update:historyBackgroundLines', value: string): void
}>()
</script>

<template>
  <!-- Desktop history page. -->
  <div class="sheet-page-grid sheet-page-grid--history">
      <div class="sheet-page-left">
        <section class="sheet-panel">
          <header class="sheet-panel-title sheet-panel-title--compact sheet-panel-title--actionable">
            <span>Careers</span>
            <button aria-label="Add career" class="sheet-panel-action" title="Add career" type="button" @click="addCareer">
              <AppIcon name="plus" />
            </button>
          </header>
          <div class="sheet-table">
            <div class="sheet-table-header sheet-table-header--careers">
              <span>Term</span>
              <span>Career</span>
              <span>Surv.</span>
              <span>Adv.</span>
              <span>Rank</span>
              <span>Notes</span>
            </div>
            <div class="sheet-table-body">
              <div v-for="(term, index) in draft.careers" :key="`${term.termNumber}-${index}`" class="sheet-table-row sheet-table-row--careers">
                <input v-model.number="term.termNumber" class="sheet-cell-input" type="number">
                <input v-model="term.summary" class="sheet-cell-input" placeholder="Career / assignment">
                <input :value="term.rolls.find((roll) => roll.label === 'Survival')?.total ?? ''" class="sheet-cell-input" readonly>
                <input :value="term.rolls.find((roll) => roll.label === 'Advancement')?.total ?? ''" class="sheet-cell-input" readonly>
                <input :value="termRankLabel(term)" class="sheet-cell-input" readonly>
                <input :value="termNotesLabel(term)" class="sheet-cell-input" placeholder="Notes" readonly>
                <button aria-label="Remove career" class="sheet-remove" title="Remove career" type="button" @click="removeCareer(index)">
                  <AppIcon name="close" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section class="sheet-panel">
          <header class="sheet-panel-title sheet-panel-title--compact">History &amp; Background</header>
          <textarea :value="historyBackgroundLines" class="sheet-textarea sheet-textarea--history" @input="$emit('update:historyBackgroundLines', ($event.target as HTMLTextAreaElement).value)" />
        </section>
      </div>

      <div class="sheet-page-right">
        <section
          v-for="group in [
            { id: 'allies', label: 'Allies' },
            { id: 'contacts', label: 'Contacts' },
            { id: 'rivals', label: 'Rivals' },
            { id: 'enemies', label: 'Enemies' },
          ]"
          :key="group.id"
          class="sheet-panel"
        >
          <header class="sheet-panel-title sheet-panel-title--compact sheet-panel-title--actionable">
            <span>{{ group.label }}</span>
            <button
              :aria-label="`Add ${associateActionLabels[group.id]}`"
              class="sheet-panel-action"
              :title="`Add ${associateActionLabels[group.id]}`"
              type="button"
              @click="addAssociate(group.id)"
            >
              <AppIcon name="plus" />
            </button>
          </header>
          <div class="sheet-table">
            <div class="sheet-table-header sheet-table-header--associates">
              <span>Name</span>
              <span>Notes</span>
            </div>
            <div class="sheet-table-body">
              <div v-for="(associate, index) in draft.associates[group.id]" :key="associate.id" class="sheet-table-row sheet-table-row--associates">
                <input v-model="associate.name" class="sheet-cell-input" placeholder="Name">
                <input v-model="associate.notes" class="sheet-cell-input" placeholder="Notes">
                <button :aria-label="`Remove ${associateActionLabels[group.id].toLowerCase()}`" class="sheet-remove" :title="`Remove ${associateActionLabels[group.id].toLowerCase()}`" type="button" @click="removeAssociate(group.id, index)">
                  <AppIcon name="close" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
  </div>
</template>
