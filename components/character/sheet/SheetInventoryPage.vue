<script setup lang="ts">
import AppIcon from '~/components/AppIcon.vue'
import GalacticCreditsIcon from '~/components/GalacticCreditsIcon.vue'
import type { TravellerProfile } from '~/types/traveller'

defineProps<{
  draft: TravellerProfile
  nonVoucherEquipmentEntries: Array<{ item: TravellerProfile['equipment'][number], index: number }>
  voucherEquipmentEntries: Array<{ item: TravellerProfile['equipment'][number], index: number }>
  voucherTypeOptions: readonly { value: string, label: string }[]
  formatCreditDisplay: (value: number) => string
  handleCreditInput: (event: Event) => void
  addAugment: () => void
  removeAugment: (index: number) => void
  addEquipment: () => void
  removeEquipment: (index: number) => void
  addVoucher: () => void
  voucherThemeClass: (item: TravellerProfile['equipment'][number]) => string
  voucherDisplayHeading: (item: TravellerProfile['equipment'][number]) => string
  voucherSelectedType: (item: TravellerProfile['equipment'][number]) => string
  setVoucherType: (item: TravellerProfile['equipment'][number], type: string) => void
  addArmour: () => void
  removeArmour: (index: number) => void
  addWeapon: () => void
  removeWeapon: (index: number) => void
  handleWeaponDamageInput: (weapon: TravellerProfile['weapons'][number], event: Event) => void
}>()
</script>

<template>
  <!-- Desktop inventory page. -->
  <div class="sheet-page-grid sheet-page-grid--inventory">
      <div class="sheet-page-left">
        <section class="sheet-panel">
          <header class="sheet-panel-title sheet-panel-title--compact">Finances</header>
          <div class="sheet-finance-grid">
            <label class="sheet-line-field sheet-line-field--stacked sheet-line-field--emphasis">
              <span class="sheet-line-field__credits-label">Credits: <GalacticCreditsIcon class="sheet-line-field__credits-symbol" /></span>
              <input :value="formatCreditDisplay(draft.finances.cashOnHand)" class="sheet-line-input" inputmode="numeric" type="text" @input="handleCreditInput">
            </label>
            <label class="sheet-line-field sheet-line-field--stacked sheet-line-field--emphasis">
              <span>Monthly Cash Flow:</span>
              <input v-model="draft.finances.monthlyCashFlow" class="sheet-line-input">
            </label>
            <label class="sheet-line-field sheet-line-field--stacked">
              <span>Ship Shares:</span>
              <input v-model.number="draft.finances.shipShares" class="sheet-line-input" type="number">
            </label>
            <label class="sheet-line-field sheet-line-field--stacked">
              <span>Income:</span>
              <input v-model="draft.finances.income" class="sheet-line-input">
            </label>
            <label class="sheet-line-field sheet-line-field--stacked">
              <span>Living Costs:</span>
              <input v-model="draft.finances.livingCosts" class="sheet-line-input">
            </label>
            <label class="sheet-line-field sheet-line-field--stacked">
              <span>Debt:</span>
              <input v-model.number="draft.finances.debt" class="sheet-line-input" type="number">
            </label>
            <label class="sheet-line-field sheet-line-field--stacked">
              <span>Annual Pension:</span>
              <input v-model="draft.finances.annualPension" class="sheet-line-input">
            </label>
            <label class="sheet-line-field sheet-line-field--stacked">
              <span>Ship Payments:</span>
              <input v-model="draft.finances.shipPayments" class="sheet-line-input">
            </label>
          </div>
        </section>

        <section class="sheet-panel sheet-panel--vertical">
          <header class="sheet-panel-title sheet-panel-title--side">Augments</header>
          <div class="sheet-table">
            <div class="sheet-table-body">
              <div v-for="(augment, index) in draft.augments" :key="`inventory-${augment.id}`" class="sheet-table-row sheet-table-row--augments">
                <div class="sheet-augment-grid">
                  <div class="sheet-augment-row sheet-augment-row--top">
                    <input v-model="augment.name" class="sheet-cell-input" placeholder="Name">
                    <input v-model="augment.techLevel" class="sheet-cell-input" placeholder="TL">
                  </div>
                  <div class="sheet-augment-row sheet-augment-row--bottom">
                    <input v-model="augment.type" class="sheet-cell-input" placeholder="Type">
                    <input v-model="augment.traits" class="sheet-cell-input" placeholder="Traits">
                  </div>
                </div>
                <button aria-label="Remove augment" class="sheet-remove" title="Remove augment" type="button" @click="removeAugment(index)">
                  <AppIcon name="close" />
                </button>
              </div>
              <button class="sheet-add" type="button" @click="addAugment">Add Augment</button>
            </div>
          </div>
        </section>

        <section class="sheet-panel sheet-panel--vertical">
          <header class="sheet-panel-title sheet-panel-title--side">Equipment</header>
          <div class="sheet-table">
            <div class="sheet-table-body">
              <div v-for="({ item, index }) in nonVoucherEquipmentEntries" :key="`inventory-equipment-${item.id}`" class="sheet-table-row sheet-table-row--equipment">
                <div class="sheet-equipment-grid">
                  <div class="sheet-entry-actions sheet-entry-actions--single">
                    <button aria-label="Remove equipment" class="sheet-entry-action sheet-entry-action--danger" title="Remove equipment" type="button" @click="removeEquipment(index)">
                      <AppIcon name="close" />
                    </button>
                  </div>
                  <div class="sheet-equipment-row sheet-equipment-row--top">
                    <label class="sheet-field-with-label"><span>Name</span><input v-model="item.name" class="sheet-cell-input" placeholder="Name"></label>
                    <label class="sheet-field-with-label"><span>Type / Traits</span><input v-model="item.traits" class="sheet-cell-input" placeholder="Type / traits"></label>
                    <label class="sheet-field-with-label"><span>TL</span><input v-model="item.techLevel" class="sheet-cell-input" placeholder="TL"></label>
                    <label class="sheet-field-with-label"><span>Kg</span><input v-model="item.kg" class="sheet-cell-input" placeholder="Kg"></label>
                  </div>
                  <div class="sheet-equipment-row sheet-equipment-row--bottom">
                    <label class="sheet-field-with-label"><span>Notes</span><input v-model="item.notes" class="sheet-cell-input" placeholder="Notes"></label>
                  </div>
                </div>
              </div>
              <div class="sheet-loadout-actions">
                <button class="sheet-add" type="button" @click="addEquipment">Add Equipment</button>
              </div>
            </div>
          </div>
        </section>

        <section class="sheet-panel sheet-panel--vertical">
          <header class="sheet-panel-title sheet-panel-title--side">Vouchers</header>
          <div class="sheet-voucher-section sheet-voucher-section--standalone">
            <div class="sheet-voucher-section__header">
              <button class="sheet-add" type="button" @click="addVoucher">Add Voucher</button>
            </div>
            <div v-if="voucherEquipmentEntries.length" class="sheet-voucher-grid">
              <article
                v-for="({ item, index }) in voucherEquipmentEntries"
                :key="`inventory-voucher-${item.id}`"
                class="sheet-voucher-card"
                :class="voucherThemeClass(item)"
              >
                <div class="sheet-voucher-card__top">
                  <div class="sheet-voucher-card__brand" :title="item.techLevel ? `TL ${item.techLevel}` : 'Voucher mark'">
                    <GalacticCreditsIcon class="sheet-voucher-card__brand-icon" />
                  </div>
                  <div class="sheet-voucher-card__text">
                    <div class="sheet-voucher-card__heading">{{ voucherDisplayHeading(item) }}</div>
                    <div class="sheet-voucher-card__subheading">VOUCHER</div>
                  </div>
                  <button aria-label="Remove voucher" class="sheet-voucher-card__remove" title="Remove voucher" type="button" @click="removeEquipment(index)">
                    <AppIcon name="close" />
                  </button>
                </div>
                <div class="sheet-voucher-card__meta">
                  <div class="sheet-voucher-card__field-shell sheet-voucher-card__field-shell--select">
                    <select :value="voucherSelectedType(item)" class="sheet-voucher-card__field sheet-voucher-card__field--select" @change="setVoucherType(item, ($event.target as HTMLSelectElement).value)">
                      <option value="">Select type</option>
                      <option v-for="option in voucherTypeOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                    </select>
                  </div>
                  <div class="sheet-voucher-card__field-shell">
                    <input v-model="item.techLevel" class="sheet-voucher-card__field" min="0" placeholder="TL" type="number">
                  </div>
                </div>
              </article>
            </div>
            <p v-else class="sheet-panel-empty">No voucher claims recorded.</p>
          </div>
        </section>
      </div>

      <div class="sheet-page-right">
        <section class="sheet-panel sheet-panel--vertical">
          <header class="sheet-panel-title sheet-panel-title--side">Armour</header>
          <div class="sheet-table">
            <div class="sheet-table-body">
              <div v-for="(armour, index) in draft.armour" :key="`inventory-armour-${armour.id}`" class="sheet-table-row sheet-table-row--armour">
                <div class="sheet-armour-grid">
                  <div class="sheet-entry-actions sheet-entry-actions--single">
                    <button aria-label="Remove armour" class="sheet-entry-action sheet-entry-action--danger" title="Remove armour" type="button" @click="removeArmour(index)">
                      <AppIcon name="close" />
                    </button>
                  </div>
                  <div class="sheet-armour-row sheet-armour-row--top">
                    <label class="sheet-field-with-label"><span>Name</span><input v-model="armour.name" class="sheet-cell-input" placeholder="Name"></label>
                    <label class="sheet-field-with-label"><span>Type</span><input v-model="armour.type" class="sheet-cell-input" placeholder="Type"></label>
                    <label class="sheet-field-with-label"><span>Rad</span><input v-model="armour.radiationProtection" class="sheet-cell-input" placeholder="Rad"></label>
                    <label class="sheet-field-with-label"><span>Prot</span><input v-model="armour.protection" class="sheet-cell-input" placeholder="Prot"></label>
                    <label class="sheet-field-with-label"><span>Kg</span><input v-model="armour.kg" class="sheet-cell-input" placeholder="Kg"></label>
                  </div>
                  <div class="sheet-armour-row sheet-armour-row--bottom">
                    <label class="sheet-field-with-label"><span>Options</span><input v-model="armour.options" class="sheet-cell-input" placeholder="Options"></label>
                    <label class="sheet-field-with-label"><span>Traits</span><input v-model="armour.traits" class="sheet-cell-input" placeholder="Traits"></label>
                  </div>
                </div>
              </div>
              <button class="sheet-add" type="button" @click="addArmour">Add Armour</button>
            </div>
          </div>
        </section>

        <section class="sheet-panel sheet-panel--vertical">
          <header class="sheet-panel-title sheet-panel-title--side">Weapons</header>
          <div class="sheet-table">
            <div class="sheet-table-body">
              <div v-for="(weapon, index) in draft.weapons" :key="`inventory-weapon-${weapon.id}`" class="sheet-table-row sheet-table-row--weapons">
                <div class="sheet-weapon-grid">
                  <div class="sheet-entry-actions sheet-entry-actions--single">
                    <button aria-label="Remove weapon" class="sheet-entry-action sheet-entry-action--danger" title="Remove weapon" type="button" @click="removeWeapon(index)">
                      <AppIcon name="close" />
                    </button>
                  </div>
                  <div class="sheet-weapon-row sheet-weapon-row--top">
                    <label class="sheet-field-with-label"><span>Name</span><input v-model="weapon.name" class="sheet-cell-input" placeholder="Name"></label>
                    <label class="sheet-field-with-label"><span>Traits</span><input v-model="weapon.traits" class="sheet-cell-input" placeholder="Traits"></label>
                  </div>
                  <div class="sheet-weapon-row sheet-weapon-row--bottom">
                    <label class="sheet-field-with-label"><span>TL</span><input v-model="weapon.techLevel" class="sheet-cell-input" placeholder="TL"></label>
                    <label class="sheet-field-with-label"><span>Range</span><input v-model="weapon.range" class="sheet-cell-input" placeholder="Range"></label>
                    <label class="sheet-field-with-label"><span>Damage</span><input :value="weapon.damage" class="sheet-cell-input" placeholder="Damage" @input="handleWeaponDamageInput(weapon, $event)"></label>
                    <label class="sheet-field-with-label"><span>Kg</span><input v-model="weapon.kg" class="sheet-cell-input" placeholder="Kg"></label>
                    <label class="sheet-field-with-label"><span>Mag</span><input v-model="weapon.magazine" class="sheet-cell-input" placeholder="Mag"></label>
                    <label class="sheet-field-with-label"><span>Skill</span><input :value="weapon.speciality ? `${weapon.skill || ''} (${weapon.speciality})` : (weapon.skill || '')" class="sheet-cell-input" placeholder="Combat skill" readonly></label>
                  </div>
                </div>
              </div>
              <button class="sheet-add" type="button" @click="addWeapon">Add Weapon</button>
            </div>
          </div>
        </section>
      </div>
  </div>
</template>
