<script setup lang="ts">
import AppIcon from '~/components/AppIcon.vue'
import SheetTrainingPanel from '~/components/character/sheet/SheetTrainingPanel.vue'
import type { TravellerCharacteristicId, TravellerProfile, TravellerSkillTrainingActive, TravellerSkillTrainingHistory } from '~/types/traveller'

defineProps<{
  draft: TravellerProfile
  characteristicIds: TravellerCharacteristicId[]
  isPortraitDragActive: boolean
  portraitClearConfirmOpen: boolean
  showOnlyTrainedSkills: boolean
  skillColumnCount: number
  skillGroupColumns: any[]
  speciesOptions: string[]
  activeTraining: TravellerSkillTrainingActive | null
  trainingHistory: TravellerSkillTrainingHistory[]
  trainingSkillOptions: Array<{ id: string, name: string, specialities?: string[], specialityMode?: 'shared-zero' | 'independent' }>
  selectedTrainingSkillId: string
  selectedTrainingSpeciality: string
  customTrainingSpeciality: string
  selectedTrainingTargetLevel: number
  selectedTrainingCharacteristic: 'edu' | 'str' | 'dex' | 'end'
  selectedTrainingCurrentLevel: number | null
  selectedTrainingTargetOptions: number[]
  selectedTrainingRequiredStudyPeriods: number
  selectedTrainingValidation: string
  trainingCanStart: boolean
  trainingCanRoll: boolean
  activeTrainingProgressLabel: string
  trainingRollSummary: string
  weaponSkillOptions: readonly { value: string, label: string }[]
  ownedWeaponOptions: { value: string, label: string }[]
  activeSkillPickerId: string | null
  customSpecialityDrafts: Record<string, string>
  customSpecialitySkillIds: Set<string>
  setPortraitDragActive: (value: boolean) => void
  openPortraitPicker: () => void
  handlePortraitDrop: (event: DragEvent) => void
  requestClearPortrait: () => void
  cancelClearPortrait: () => void
  confirmClearPortrait: () => void
  handleCharacteristicInput: (id: TravellerCharacteristicId, event: Event) => void
  adjustCharacteristicValue: (id: TravellerCharacteristicId, delta: number) => void
  openCharacteristicRoll: (id: TravellerCharacteristicId) => void
  formatDm: (value: number) => string
  addAttack: () => void
  removeAttack: (index: number) => void
  setAttackWeapon: (attack: TravellerProfile['attacks'][number], weaponId: string) => void
  attackWeaponTraits: (attack: TravellerProfile['attacks'][number]) => string
  sanitizeWeaponDamageInput: (value: string) => string
  setAttackSkillRoot: (attack: TravellerProfile['attacks'][number], skill: string) => void
  attackSpecialityOptions: (skillId?: string) => string[]
  openAttackSkillRoll: (attack: TravellerProfile['attacks'][number]) => void
  openAttackDamageRoll: (attack: TravellerProfile['attacks'][number]) => void
  addWound: () => void
  removeWound: (index: number) => void
  sheetSkillMode: (definition: any) => string
  baseSkillChecked: (definition: any) => boolean
  toggleBaseSkill: (definition: any) => void
  openSheetSkillDefinitionRoll: (definition: any, specialityName?: string, level?: number | null) => void
  baseSkillDisplayLevel: (definition: any) => number | string | null
  travellerSkillHasSpecialities: (definition: any) => boolean
  toggleSkillPicker: (definition: any) => void
  availableSheetSpecialities: (definition: any) => string[]
  addSheetSpeciality: (definition: any, speciality: string) => void
  addCustomSpecialitySkill: (definition: any) => void
  specialityDisplayName: (definition: any, speciality: string) => string
  selectedSheetSpecialities: (definition: any) => Array<{ specialityId: string, specialityName: string }>
  specialitySkillChecked: (definition: any, specialityId: string) => boolean
  toggleSpecialitySkill: (definition: any, specialityName: string) => void
  specialitySkillDisplayLevel: (definition: any, specialityId: string) => number | string | null
  changeSpecialitySkillLevel: (definition: any, specialityName: string, delta: number) => void
  changeBaseSkillLevel: (definition: any, delta: number) => void
}>()

defineEmits<{
  (event: 'update:showOnlyTrainedSkills', value: boolean): void
  (event: 'update:selectedTrainingSkillId', value: string): void
  (event: 'update:selectedTrainingSpeciality', value: string): void
  (event: 'update:customTrainingSpeciality', value: string): void
  (event: 'update:selectedTrainingTargetLevel', value: number): void
  (event: 'update:selectedTrainingCharacteristic', value: 'edu' | 'str' | 'dex' | 'end'): void
  (event: 'startSkillTraining'): void
  (event: 'cancelSkillTraining'): void
  (event: 'addTrainingWeeks', amount: number): void
  (event: 'rollSkillTrainingStudyPeriod'): void
}>()
</script>

<template>
  <!--
    Desktop traveller page.
    This keeps the high-churn profile, stats, attacks, wounds, and skills
    layout isolated from the orchestration logic in the parent sheet page.
  -->
  <div class="sheet-page-grid sheet-page-grid--front">
      <div class="sheet-page-left">
        <div class="sheet-identity-grid">
          <section class="sheet-panel sheet-panel--personal">
            <header class="sheet-panel-title sheet-panel-title--compact">Personal Data File</header>
            <div class="sheet-personal-grid">
              <label class="sheet-line-field sheet-line-field--personal sheet-line-field--emphasis">
                <span>Name:</span>
                <input v-model="draft.identity.name" class="sheet-line-input">
              </label>
              <label class="sheet-line-field sheet-line-field--personal">
                <span>Title:</span>
                <input v-model="draft.identity.title" class="sheet-line-input">
              </label>
              <div class="sheet-personal-split">
                <label class="sheet-line-field sheet-line-field--personal">
                  <span>Age:</span>
                  <input v-model.number="draft.identity.age" class="sheet-line-input" min="0" type="number">
                </label>
                <label class="sheet-line-field sheet-line-field--personal">
                  <span class="sheet-personal-split__spacer" aria-hidden="true"></span>
                  <select v-model="draft.identity.species" class="sheet-line-input">
                    <option disabled value="">Species</option>
                    <option v-for="species in speciesOptions" :key="species" :value="species">
                      {{ species }}
                    </option>
                  </select>
                </label>
              </div>
              <label class="sheet-line-field sheet-line-field--personal">
                <span>World:</span>
                <input v-model="draft.identity.homeworld" class="sheet-line-input">
              </label>
              <label class="sheet-line-field sheet-line-field--personal">
                <span>Traits:</span>
                <input v-model="draft.identity.traits" class="sheet-line-input">
              </label>
            </div>
          </section>

          <section class="sheet-panel">
            <div class="sheet-distinguishing-label">Distinguishing Features:</div>
            <div class="sheet-portrait-block">
              <div
                class="sheet-portrait-frame"
                :class="{ 'sheet-portrait-frame--dragging': isPortraitDragActive }"
                tabindex="0"
                role="button"
                aria-label="Upload portrait"
                @click="openPortraitPicker"
                @keydown.enter.prevent="openPortraitPicker"
                @keydown.space.prevent="openPortraitPicker"
                @dragenter.prevent="setPortraitDragActive(true)"
                @dragover.prevent="setPortraitDragActive(true)"
                @dragleave.prevent="setPortraitDragActive(false)"
                @drop="handlePortraitDrop"
              >
                <button
                  v-if="draft.identity.portraitDataUrl"
                  class="sheet-portrait-clear"
                  type="button"
                  aria-label="Remove portrait"
                  @click.stop="requestClearPortrait"
                >
                  <AppIcon name="close" />
                </button>
                <div v-if="portraitClearConfirmOpen" class="sheet-portrait-confirm" @click.stop>
                  <p class="sheet-portrait-confirm-text">Remove portrait?</p>
                  <div class="sheet-portrait-confirm-actions">
                    <button class="sheet-portrait-confirm-button" type="button" @click="cancelClearPortrait">
                      Cancel
                    </button>
                    <button class="sheet-portrait-confirm-button sheet-portrait-confirm-button--danger" type="button" @click="confirmClearPortrait">
                      Remove
                    </button>
                  </div>
                </div>
                <img
                  v-if="draft.identity.portraitDataUrl"
                  :src="draft.identity.portraitDataUrl"
                  alt="Traveller portrait"
                  class="sheet-portrait-image"
                >
                <div v-else class="sheet-portrait-placeholder">
                  <span class="sheet-portrait-placeholder-icons">
                    <AppIcon class="sheet-portrait-icon sheet-portrait-icon--primary sheet-portrait-icon--large" name="portrait" />
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section class="sheet-characteristics-panel">
          <div
            v-for="id in characteristicIds"
            :key="id"
            class="sheet-characteristic"
            :class="{ 'sheet-characteristic--psi': id === 'psi' }"
          >
            <span class="sheet-characteristic-label">{{ draft.characteristics[id].abbreviation }}</span>
            <div class="sheet-stat-entry">
              <input
                :value="draft.characteristics[id].value"
                class="sheet-hex-input"
                inputmode="numeric"
                pattern="[0-9]*"
                type="text"
                @input="handleCharacteristicInput(id, $event)"
              >
              <div class="sheet-stepper">
                <button class="sheet-stepper-button" type="button" @click="adjustCharacteristicValue(id, 1)">
                  <AppIcon class="sheet-stepper-icon sheet-stepper-icon--up" name="arrow" />
                </button>
                <button class="sheet-stepper-button" type="button" @click="adjustCharacteristicValue(id, -1)">
                  <AppIcon class="sheet-stepper-icon sheet-stepper-icon--down" name="arrow" />
                </button>
              </div>
            </div>
            <div
              class="sheet-dm-block sheet-dm-block--interactive"
              role="button"
              tabindex="0"
              :title="`Roll ${draft.characteristics[id].name || draft.characteristics[id].abbreviation}`"
              @click="openCharacteristicRoll(id)"
              @keydown.enter.prevent="openCharacteristicRoll(id)"
              @keydown.space.prevent="openCharacteristicRoll(id)"
            >
              <input :value="formatDm(draft.characteristics[id].dm)" class="sheet-dm-input" readonly tabindex="-1">
              <span>DM</span>
            </div>
          </div>
        </section>

        <section class="sheet-panel">
          <header class="sheet-panel-title sheet-panel-title--compact sheet-panel-title--actionable">
            <span>Attacks</span>
            <button aria-label="Add attack" class="sheet-panel-action" title="Add attack" type="button" @click="addAttack">
              <AppIcon name="plus" />
            </button>
          </header>
          <div class="sheet-table">
            <div class="sheet-table-body">
              <div v-for="(attack, index) in draft.attacks" :key="attack.id" class="sheet-table-row sheet-table-row--attacks">
                <div class="sheet-attack-grid">
                  <div class="sheet-entry-actions sheet-entry-actions--single">
                    <button aria-label="Remove attack" class="sheet-entry-action sheet-entry-action--danger" title="Remove attack" type="button" @click="removeAttack(index)">
                      <AppIcon name="close" />
                    </button>
                  </div>
                  <div class="sheet-attack-row sheet-attack-row--top">
                    <label class="sheet-field-with-label">
                      <span>Weapon</span>
                      <select :value="attack.weaponId" class="sheet-cell-input" @change="setAttackWeapon(attack, ($event.target as HTMLSelectElement).value)">
                        <option value="">Select weapon</option>
                        <option v-for="option in ownedWeaponOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                      </select>
                    </label>
                    <label class="sheet-field-with-label"><span>Traits</span><input :value="attackWeaponTraits(attack)" class="sheet-cell-input" placeholder="Traits" readonly></label>
                  </div>
                  <div class="sheet-attack-row sheet-attack-row--bottom">
                    <label class="sheet-field-with-label"><span>Damage</span><input :value="attack.damage" class="sheet-cell-input" placeholder="Damage" @input="attack.damage = sanitizeWeaponDamageInput(($event.target as HTMLInputElement).value)"></label>
                    <label class="sheet-field-with-label">
                      <span>Attack</span>
                      <select :value="attack.skill || 'gun-combat'" class="sheet-cell-input" @change="setAttackSkillRoot(attack, ($event.target as HTMLSelectElement).value)">
                        <option v-for="option in weaponSkillOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                      </select>
                    </label>
                    <label class="sheet-field-with-label">
                      <span>Specialty</span>
                      <select :value="attack.speciality || ''" class="sheet-cell-input" @change="attack.speciality = ($event.target as HTMLSelectElement).value">
                        <option value="">&#8212;</option>
                        <option v-for="speciality in attackSpecialityOptions(attack.skill)" :key="`${attack.id}-${speciality}`" :value="speciality">{{ speciality }}</option>
                      </select>
                    </label>
                    <button class="sheet-attack-roll" type="button" @click="openAttackSkillRoll(attack)">Attack</button>
                    <button class="sheet-attack-roll sheet-attack-roll--damage" type="button" @click="openAttackDamageRoll(attack)">Damage</button>
                  </div>
                </div>
              </div>
              <p v-if="!draft.attacks.length" class="sheet-panel-empty">Add attacks from owned weapons here.</p>
            </div>
          </div>
        </section>

        <section class="sheet-panel">
          <header class="sheet-panel-title sheet-panel-title--compact sheet-panel-title--actionable">
            <span>Wounds</span>
            <button aria-label="Add wound" class="sheet-panel-action" title="Add wound" type="button" @click="addWound">
              <AppIcon name="plus" />
            </button>
          </header>
          <div class="sheet-table">
            <div class="sheet-table-header sheet-table-header--wounds">
              <span>Type</span>
              <span>Location</span>
              <span>Recovery Period</span>
              <span>Notes</span>
            </div>
            <div class="sheet-table-body">
              <div v-for="(wound, index) in draft.wounds" :key="`wound-${wound.id}`" class="sheet-table-row sheet-table-row--wounds">
                <input v-model="wound.type" class="sheet-cell-input" placeholder="Type">
                <input v-model="wound.location" class="sheet-cell-input" placeholder="Location">
                <input v-model="wound.recoveryPeriod" class="sheet-cell-input" placeholder="Recovery">
                <input v-model="wound.notes" class="sheet-cell-input" placeholder="Notes">
                <button aria-label="Remove wound" class="sheet-remove" title="Remove wound" type="button" @click="removeWound(index)">
                  <AppIcon name="close" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div class="sheet-page-right">
        <section class="sheet-panel sheet-panel--skills">
          <header class="sheet-panel-title sheet-panel-title--side sheet-panel-title--actionable">
            <span>Skills</span>
            <button
              class="sheet-skill-visibility-toggle"
              :aria-label="showOnlyTrainedSkills ? 'Show all skills' : 'Show trained skills only'"
              :title="showOnlyTrainedSkills ? 'Show all skills' : 'Show trained skills only'"
              type="button"
              @click="$emit('update:showOnlyTrainedSkills', !showOnlyTrainedSkills)"
            >
              <svg v-if="!showOnlyTrainedSkills" viewBox="0 0 24 24" class="sheet-skill-visibility-icon" aria-hidden="true">
                <path fill="currentColor" d="M12 5c5.6 0 9.57 4.13 10.82 6.13a1.5 1.5 0 0 1 0 1.74C21.57 14.87 17.6 19 12 19S2.43 14.87 1.18 12.87a1.5 1.5 0 0 1 0-1.74C2.43 9.13 6.4 5 12 5Zm0 2c-4.62 0-8.02 3.28-9.2 5 1.18 1.72 4.58 5 9.2 5s8.02-3.28 9.2-5C20.02 10.28 16.62 7 12 7Zm0 2.25A2.75 2.75 0 1 1 9.25 12 2.75 2.75 0 0 1 12 9.25Zm0 2A.75.75 0 1 0 12.75 12 .75.75 0 0 0 12 11.25Z" />
              </svg>
              <svg v-else viewBox="0 0 24 24" class="sheet-skill-visibility-icon" aria-hidden="true">
                <path fill="currentColor" d="M3.28 2.22 21.78 20.72l-1.06 1.06-3.07-3.06A12.3 12.3 0 0 1 12 20C6.4 20 2.43 15.87 1.18 13.87a1.5 1.5 0 0 1 0-1.74 18.2 18.2 0 0 1 5.07-5.19L2.22 3.28Zm8.01 8.01 2.48 2.48a1.75 1.75 0 0 0-2.48-2.48Zm5.09 5.09-1.45-1.45A4.75 4.75 0 0 1 8.13 9.07L7.09 8.03C5.19 9.17 3.7 10.81 2.8 12c1.18 1.72 4.58 6 9.2 6a10.2 10.2 0 0 0 4.38-1.68Zm1.65-1.18-1.45-1.45A9.45 9.45 0 0 0 21.2 12c-.69-1-2.25-2.82-4.62-4.07l-1.07-1.06c3.32 1.25 5.8 3.85 7.31 6.26a1.5 1.5 0 0 1 0 1.74 18.34 18.34 0 0 1-4.79 4.89Z" />
              </svg>
            </button>
          </header>
          <div class="sheet-skills-grid" :class="{ 'sheet-skills-grid--two-column': skillColumnCount === 2 }">
            <div v-for="(column, columnIndex) in skillGroupColumns" :key="`skills-${columnIndex}`" class="sheet-skill-column">
              <section
                v-for="group in column"
                :key="group.definition.id"
                v-show="group.matchesFilter"
                class="sheet-skill-group"
              >
                <div class="sheet-skill-entry sheet-skill-entry--base">
                  <span v-if="sheetSkillMode(group.definition) === 'independent'" class="sheet-skill-toggle sheet-skill-toggle--empty" aria-hidden="true"></span>
                  <label v-else class="sheet-skill-toggle">
                    <input
                      :checked="group.view.baseChecked"
                      type="checkbox"
                      @change="toggleBaseSkill(group.definition)"
                    >
                    <span class="sheet-skill-toggle__frame" aria-hidden="true"></span>
                  </label>
                  <button class="sheet-skill-roll-button" type="button" @click="openSheetSkillDefinitionRoll(group.definition, undefined, group.view.baseLevel)">
                    {{ group.definition.name }}
                  </button>
                  <div class="sheet-skill-rank" :class="{ 'sheet-skill-rank--disabled': travellerSkillHasSpecialities(group.definition) || sheetSkillMode(group.definition) === 'independent' }">
                    <template v-if="travellerSkillHasSpecialities(group.definition)">
                      <span class="sheet-skill-rank__value">{{ sheetSkillMode(group.definition) === 'independent' ? '--' : (group.view.baseLevel ?? '0') }}</span>
                      <button
                        :aria-label="`Add ${group.definition.name} specialty`"
                        class="sheet-skill-group__add sheet-skill-rank__addon"
                        :title="`Add ${group.definition.name} specialty`"
                        type="button"
                        @click.stop.prevent="toggleSkillPicker(group.definition)"
                      >
                        <AppIcon name="plus" />
                      </button>
                    </template>
                    <template v-else>
                      <button class="sheet-skill-rank__button" type="button" @click.stop.prevent="changeBaseSkillLevel(group.definition, -1)">
                        <AppIcon class="sheet-skill-rank__icon sheet-skill-rank__icon--down" name="arrow" />
                      </button>
                      <span class="sheet-skill-rank__value">{{ group.view.baseLevel ?? '0' }}</span>
                      <button class="sheet-skill-rank__button" type="button" @click.stop.prevent="changeBaseSkillLevel(group.definition, 1)">
                        <AppIcon class="sheet-skill-rank__icon sheet-skill-rank__icon--up" name="arrow" />
                      </button>
                    </template>
                  </div>
                </div>

                <div v-if="activeSkillPickerId === group.definition.id" class="sheet-skill-picker">
                  <button
                    v-for="speciality in group.view.availableSpecialities"
                    :key="`${group.definition.id}:picker:${speciality}`"
                    class="sheet-skill-picker__option"
                    type="button"
                    @click="addSheetSpeciality(group.definition, speciality)"
                  >
                    {{ specialityDisplayName(group.definition, speciality) }}
                  </button>
                  <div v-if="customSpecialitySkillIds.has(group.definition.id)" class="sheet-skill-picker__custom">
                    <input
                      v-model="customSpecialityDrafts[group.definition.id]"
                      class="sheet-line-input"
                      placeholder="Custom specialty"
                      @keydown.enter.prevent="addCustomSpecialitySkill(group.definition)"
                    >
                    <button class="sheet-skill-picker__add-custom" type="button" @click="addCustomSpecialitySkill(group.definition)">Add</button>
                  </div>
                </div>

                <div v-if="group.view.selectedSpecialities.length" class="sheet-skill-specialities">
                  <div
                    v-for="speciality in group.view.selectedSpecialities"
                    :key="`${group.definition.id}:${speciality.specialityId}`"
                    class="sheet-skill-entry sheet-skill-entry--speciality"
                  >
                    <label class="sheet-skill-toggle">
                      <input
                        :checked="specialitySkillChecked(group.definition, speciality.specialityId)"
                        type="checkbox"
                        @change="toggleSpecialitySkill(group.definition, speciality.specialityName)"
                      >
                      <span class="sheet-skill-toggle__frame" aria-hidden="true"></span>
                    </label>
                    <button
                      class="sheet-skill-roll-button sheet-skill-roll-button--speciality"
                      type="button"
                      @click="openSheetSkillDefinitionRoll(group.definition, speciality.specialityName, specialitySkillDisplayLevel(group.definition, speciality.specialityId))"
                    >
                      <span class="sheet-skill-speciality-label">{{ speciality.specialityName }}</span>
                    </button>
                    <div class="sheet-skill-rank">
                      <button class="sheet-skill-rank__button" type="button" @click.stop.prevent="changeSpecialitySkillLevel(group.definition, speciality.specialityName, -1)">
                        <AppIcon class="sheet-skill-rank__icon sheet-skill-rank__icon--down" name="arrow" />
                      </button>
                      <span class="sheet-skill-rank__value">{{ specialitySkillDisplayLevel(group.definition, speciality.specialityId) ?? '0' }}</span>
                      <button class="sheet-skill-rank__button" type="button" @click.stop.prevent="changeSpecialitySkillLevel(group.definition, speciality.specialityName, 1)">
                        <AppIcon class="sheet-skill-rank__icon sheet-skill-rank__icon--up" name="arrow" />
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
            <SheetTrainingPanel
              :selected-skill-id="selectedTrainingSkillId"
              :selected-speciality="selectedTrainingSpeciality"
              :custom-speciality="customTrainingSpeciality"
              :target-level="selectedTrainingTargetLevel"
              :characteristic="selectedTrainingCharacteristic"
              :active-training="activeTraining"
              :history="trainingHistory"
              :skill-options="trainingSkillOptions"
              :current-level="selectedTrainingCurrentLevel"
              :target-level-options="selectedTrainingTargetOptions"
              :required-study-periods="selectedTrainingRequiredStudyPeriods"
              :validation="selectedTrainingValidation"
              :can-start="trainingCanStart"
              :can-roll="trainingCanRoll"
              :progress-label="activeTrainingProgressLabel"
              :roll-summary="trainingRollSummary"
              @update:selected-skill-id="$emit('update:selectedTrainingSkillId', $event)"
              @update:selected-speciality="$emit('update:selectedTrainingSpeciality', $event)"
              @update:custom-speciality="$emit('update:customTrainingSpeciality', $event)"
              @update:target-level="$emit('update:selectedTrainingTargetLevel', $event)"
              @update:characteristic="$emit('update:selectedTrainingCharacteristic', $event)"
              @start="$emit('startSkillTraining')"
              @cancel="$emit('cancelSkillTraining')"
              @add-week="$emit('addTrainingWeeks', $event)"
              @roll="$emit('rollSkillTrainingStudyPeriod')"
            />
          </div>
        </section>
      </div>
  </div>
</template>
