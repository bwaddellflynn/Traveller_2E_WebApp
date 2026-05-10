<script setup lang="ts">
defineProps<{
  open: boolean
  travellerName: string
  itemName: string
  itemTypeLabel: string
  currentCredits: number
  itemCost: number
  remainingCredits: number
  matchingVouchers: Array<{ id: string; name: string; notes?: string }>
  selectedVoucherId: string
}>()

const emit = defineEmits<{
  close: []
  confirm: []
  selectVoucher: [voucherId: string]
}>()

const formatCredits = (value: number) => value.toLocaleString()
</script>

<template>
  <div v-if="open" class="armory-purchase-overlay" @click.self="emit('close')">
    <div class="armory-purchase-modal" role="dialog" aria-modal="true">
      <div class="armory-purchase-modal__header">
        <div>
          <div class="armory-purchase-modal__title">Confirm Purchase</div>
          <div class="armory-purchase-modal__subtitle">{{ travellerName }}</div>
        </div>
        <button aria-label="Close purchase confirmation" class="armory-purchase-modal__close" type="button" @click="emit('close')">
          <AppIcon name="close" />
        </button>
      </div>

      <div class="armory-purchase-modal__panel">
        <div class="armory-purchase-modal__item">{{ itemName }}</div>
        <div class="armory-purchase-modal__type">{{ itemTypeLabel }}</div>
      </div>

      <div class="armory-purchase-modal__ledger">
        <div class="armory-purchase-modal__row">
          <span>Current Credits</span>
          <strong>{{ formatCredits(currentCredits) }}</strong>
        </div>
        <div v-if="selectedVoucherId" class="armory-purchase-modal__row">
          <span>Using Voucher</span>
          <strong>{{ matchingVouchers.find((voucher) => voucher.id === selectedVoucherId)?.name ?? 'Voucher' }}</strong>
        </div>
        <div class="armory-purchase-modal__row">
          <span>{{ selectedVoucherId ? 'Voucher Applied' : 'Item Price' }}</span>
          <strong>{{ selectedVoucherId ? 'Voucher' : formatCredits(itemCost) }}</strong>
        </div>
        <div class="armory-purchase-modal__row armory-purchase-modal__row--remaining">
          <span>Credits After Purchase</span>
          <strong>{{ formatCredits(remainingCredits) }}</strong>
        </div>
      </div>

      <div v-if="matchingVouchers.length" class="armory-purchase-modal__voucher-panel">
        <div class="armory-purchase-modal__voucher-title">Available Vouchers For This Purchase</div>
        <div class="armory-purchase-modal__voucher-list">
          <button
            class="armory-purchase-modal__voucher"
            :class="{ 'armory-purchase-modal__voucher--selected': !selectedVoucherId }"
            type="button"
            @click="emit('selectVoucher', '')"
          >
            <span class="armory-purchase-modal__voucher-name">Use Credits</span>
          </button>
          <button
            v-for="voucher in matchingVouchers"
            :key="voucher.id"
            class="armory-purchase-modal__voucher"
            :class="{ 'armory-purchase-modal__voucher--selected': selectedVoucherId === voucher.id }"
            type="button"
            @click="emit('selectVoucher', voucher.id)"
          >
            <span class="armory-purchase-modal__voucher-name">{{ voucher.name }}</span>
            <span v-if="voucher.notes" class="armory-purchase-modal__voucher-notes">{{ voucher.notes }}</span>
          </button>
        </div>
      </div>

      <div class="armory-purchase-modal__actions">
        <button class="armory-purchase-modal__button armory-purchase-modal__button--cancel" type="button" @click="emit('close')">
          Cancel
        </button>
        <button class="armory-purchase-modal__button" type="button" @click="emit('confirm')">
          Confirm Purchase
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.armory-purchase-overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background: rgba(2, 6, 23, 0.62);
  backdrop-filter: blur(16px);
}

.armory-purchase-modal {
  width: min(100%, 28rem);
  display: grid;
  gap: 1rem;
  padding: 1.15rem;
  border: 1px solid rgba(250, 204, 21, 0.38);
  border-radius: 16px 0 16px 0;
  clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px));
  background:
    linear-gradient(180deg, rgba(58, 24, 7, 0.96), rgba(28, 12, 5, 0.96)),
    radial-gradient(circle at 0 0, rgba(250, 204, 21, 0.14), transparent 14rem);
  box-shadow:
    0 0 28px rgba(250, 204, 21, 0.14),
    inset 0 0 22px rgba(250, 204, 21, 0.05);
}

.armory-purchase-modal__header,
.armory-purchase-modal__row,
.armory-purchase-modal__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.9rem;
}

.armory-purchase-modal__title {
  color: #fff7ed;
  font-size: 1.08rem;
  font-weight: 700;
  text-transform: uppercase;
}

.armory-purchase-modal__subtitle,
.armory-purchase-modal__type {
  color: #fed7aa;
  font-size: 0.8rem;
  text-transform: uppercase;
}

.armory-purchase-modal__close,
.armory-purchase-modal__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.2rem;
  padding: 0 0.95rem;
  border: 1px solid rgba(34, 211, 238, 0.3);
  border-radius: 10px 0 10px 0;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  background: rgba(8, 18, 32, 0.86);
  color: #67e8f9;
  font-weight: 700;
}

.armory-purchase-modal__close {
  width: 2rem;
  height: 2rem;
  min-height: 2rem;
  padding: 0;
}

.armory-purchase-modal__button--cancel {
  color: #cbd5e1;
}

.armory-purchase-modal__panel,
.armory-purchase-modal__ledger,
.armory-purchase-modal__voucher-panel {
  border: 1px solid rgba(250, 204, 21, 0.22);
  border-radius: 14px 0 14px 0;
  clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px));
  background: rgba(70, 29, 9, 0.48);
}

.armory-purchase-modal__panel {
  padding: 0.95rem 1rem;
}

.armory-purchase-modal__item {
  color: #fff7ed;
  font-size: 1rem;
  font-weight: 700;
}

.armory-purchase-modal__ledger {
  display: grid;
}

.armory-purchase-modal__row {
  padding: 0.78rem 1rem;
  color: #fdba74;
}

.armory-purchase-modal__row + .armory-purchase-modal__row {
  border-top: 1px solid rgba(250, 204, 21, 0.16);
}

.armory-purchase-modal__row strong {
  color: #fff7ed;
}

.armory-purchase-modal__row--remaining strong {
  color: #fde68a;
}

.armory-purchase-modal__voucher-panel {
  display: grid;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
}

.armory-purchase-modal__voucher-title {
  color: #fde68a;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
}

.armory-purchase-modal__voucher-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.armory-purchase-modal__voucher {
  display: grid;
  gap: 0.18rem;
  justify-items: start;
  min-height: 2.2rem;
  padding: 0.55rem 0.7rem;
  border: 1px solid rgba(250, 204, 21, 0.24);
  border-radius: 10px 0 10px 0;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  background: rgba(92, 33, 8, 0.4);
  color: #fdba74;
  text-align: left;
}

.armory-purchase-modal__voucher--selected {
  border-color: rgba(34, 211, 238, 0.34);
  box-shadow: 0 0 18px rgba(34, 211, 238, 0.1);
  color: #e0f2fe;
}

.armory-purchase-modal__voucher-name {
  font-weight: 700;
}

.armory-purchase-modal__voucher-notes {
  font-size: 0.72rem;
  color: #fed7aa;
}
</style>
