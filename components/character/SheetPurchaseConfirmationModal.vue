<script setup lang="ts">
defineProps<{
  open: boolean
  itemName: string
  itemType: string
  costCredits: number
  remainingCredits: number
}>()

const emit = defineEmits<{
  close: []
}>()

const formatCredits = (value: number) => value.toLocaleString()
</script>

<template>
  <div v-if="open" class="sheet-purchase-confirm-overlay" @click.self="emit('close')">
    <div class="sheet-purchase-confirm" role="dialog" aria-modal="true">
      <div class="sheet-purchase-confirm__icon">
        <AppIcon name="check" />
      </div>
      <div class="sheet-purchase-confirm__title">Purchase Confirmed</div>
      <p class="sheet-purchase-confirm__text">
        Added {{ itemName }} to {{ itemType }} for {{ formatCredits(costCredits) }} credits.
      </p>
      <div class="sheet-purchase-confirm__remaining">
        Current total: {{ formatCredits(remainingCredits) }}
      </div>
      <button class="sheet-purchase-confirm__button" type="button" @click="emit('close')">
        Close
      </button>
    </div>
  </div>
</template>

<style scoped>
.sheet-purchase-confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 73;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background: rgba(2, 6, 23, 0.6);
  backdrop-filter: blur(16px);
}

.sheet-purchase-confirm {
  width: min(100%, 26rem);
  display: grid;
  justify-items: center;
  gap: 0.85rem;
  padding: 1.25rem;
  border: 1px solid rgba(250, 204, 21, 0.38);
  border-radius: 16px 0 16px 0;
  clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px));
  background:
    linear-gradient(180deg, rgba(60, 24, 7, 0.96), rgba(34, 12, 5, 0.96)),
    radial-gradient(circle at 0 0, rgba(250, 204, 21, 0.14), transparent 14rem);
  box-shadow:
    0 0 28px rgba(250, 204, 21, 0.16),
    inset 0 0 22px rgba(250, 204, 21, 0.05);
  text-align: center;
}

.sheet-purchase-confirm__icon {
  display: grid;
  place-items: center;
  width: 3rem;
  height: 3rem;
  border: 1px solid rgba(250, 204, 21, 0.42);
  border-radius: 12px 0 12px 0;
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
  background: rgba(120, 53, 15, 0.74);
  color: #fde68a;
}

.sheet-purchase-confirm__icon :deep(svg) {
  width: 1.4rem;
  height: 1.4rem;
}

.sheet-purchase-confirm__title {
  color: #fff7ed;
  font-size: 1.06rem;
  font-weight: 700;
  text-transform: uppercase;
}

.sheet-purchase-confirm__text {
  margin: 0;
  color: #fed7aa;
  line-height: 1.5;
}

.sheet-purchase-confirm__remaining {
  color: #fbbf24;
  font-weight: 700;
}

.sheet-purchase-confirm__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.3rem;
  padding: 0 1rem;
  border: 1px solid rgba(34, 211, 238, 0.3);
  border-radius: 10px 0 10px 0;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  background: rgba(8, 18, 32, 0.86);
  color: #67e8f9;
  font-weight: 700;
}
</style>
