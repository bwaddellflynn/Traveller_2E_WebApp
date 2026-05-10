<script setup lang="ts">
type PurchaseKind = 'equipment' | 'weapon' | 'armour'

type PurchaseCatalogItem = {
  id: string
  kind: PurchaseKind
  name: string
  categoryLabel: string
  techLevel: string
  massLabel: string
  costCredits: number | null
  summary: string
  traits: string[]
  sourceLabel: string
}

const props = defineProps<{
  open: boolean
  title: string
  credits: number
  items: PurchaseCatalogItem[]
}>()

const emit = defineEmits<{
  close: []
  purchase: [item: PurchaseCatalogItem]
}>()

const searchQuery = ref('')
const selectedItemId = ref<string | null>(null)

const formatCredits = (value: number | null | undefined) => Number(value || 0).toLocaleString()

const filteredItems = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const items = props.items
  if (!query) return items
  return items.filter((item) => {
    return [
      item.name,
      item.categoryLabel,
      item.summary,
      item.sourceLabel,
      item.techLevel,
      ...item.traits,
    ].some((field) => field.toLowerCase().includes(query))
  })
})

const selectedItem = computed(() => {
  const selectedId = selectedItemId.value
  const items = filteredItems.value
  if (!items.length) return null
  return items.find((item) => item.id === selectedId) ?? items[0]
})

watch(
  () => props.open,
  (open) => {
    if (!open) {
      searchQuery.value = ''
      selectedItemId.value = null
      return
    }
    selectedItemId.value = props.items[0]?.id ?? null
  },
)

watch(filteredItems, (items) => {
  if (!items.length) {
    selectedItemId.value = null
    return
  }
  if (!items.some((item) => item.id === selectedItemId.value)) {
    selectedItemId.value = items[0].id
  }
})

const canAffordSelected = computed(() => {
  const item = selectedItem.value
  return Boolean(item && item.costCredits !== null && props.credits >= item.costCredits)
})

const selectedCostLabel = computed(() => {
  if (!selectedItem.value || selectedItem.value.costCredits === null) return 'Unavailable'
  return `${formatCredits(selectedItem.value.costCredits)}`
})
</script>

<template>
  <div v-if="open" class="sheet-purchase-overlay" @click.self="emit('close')">
    <div class="sheet-purchase-modal" role="dialog" aria-modal="true">
      <div class="sheet-purchase-modal__header">
        <div>
          <div class="sheet-purchase-modal__title">{{ title }}</div>
          <div class="sheet-purchase-modal__subtitle">Available credits: {{ formatCredits(credits) }}</div>
        </div>
        <button aria-label="Close purchase dialog" class="sheet-purchase-modal__close" type="button" @click="emit('close')">
          <AppIcon name="close" />
        </button>
      </div>

      <div class="sheet-purchase-modal__search">
        <input
          v-model="searchQuery"
          class="sheet-purchase-search"
          placeholder="Search catalogue"
          type="text"
        >
      </div>

      <div class="sheet-purchase-modal__body">
        <div class="sheet-purchase-list hud-scrollbar">
          <button
            v-for="item in filteredItems"
            :key="item.id"
            class="sheet-purchase-list__item"
            :class="{ 'sheet-purchase-list__item--selected': selectedItem?.id === item.id }"
            type="button"
            @click="selectedItemId = item.id"
          >
            <div class="sheet-purchase-list__row">
              <span class="sheet-purchase-list__name">{{ item.name }}</span>
              <span class="sheet-purchase-list__cost">{{ item.costCredits === null ? 'N/A' : formatCredits(item.costCredits) }}</span>
            </div>
            <div class="sheet-purchase-list__meta">
              <span>{{ item.techLevel }}</span>
              <span>{{ item.categoryLabel }}</span>
            </div>
          </button>

          <div v-if="!filteredItems.length" class="sheet-purchase-list__empty">
            No catalogue matches the current search.
          </div>
        </div>

        <div class="sheet-purchase-detail" v-if="selectedItem">
          <div class="sheet-purchase-detail__headline">
            <div class="sheet-purchase-detail__name">{{ selectedItem.name }}</div>
            <div class="sheet-purchase-detail__cost">{{ selectedCostLabel }}</div>
          </div>

          <div class="sheet-purchase-detail__stats">
            <div class="sheet-purchase-detail__stat">
              <span>Category</span>
              <strong>{{ selectedItem.categoryLabel }}</strong>
            </div>
            <div class="sheet-purchase-detail__stat">
              <span>Tech</span>
              <strong>{{ selectedItem.techLevel }}</strong>
            </div>
            <div class="sheet-purchase-detail__stat">
              <span>Mass</span>
              <strong>{{ selectedItem.massLabel }}</strong>
            </div>
          </div>

          <p class="sheet-purchase-detail__summary">{{ selectedItem.summary || 'No additional summary.' }}</p>

          <div v-if="selectedItem.traits.length" class="sheet-purchase-detail__traits">
            <span
              v-for="trait in selectedItem.traits"
              :key="trait"
              class="sheet-purchase-detail__trait"
            >
              {{ trait }}
            </span>
          </div>

          <div class="sheet-purchase-detail__source">{{ selectedItem.sourceLabel }}</div>

          <div class="sheet-purchase-detail__actions">
            <button class="sheet-purchase-action sheet-purchase-action--close" type="button" @click="emit('close')">
              Cancel
            </button>
            <button
              class="sheet-purchase-action"
              :disabled="!canAffordSelected"
              type="button"
              @click="selectedItem && emit('purchase', selectedItem)"
            >
              {{ canAffordSelected ? 'Purchase' : 'Insufficient credits' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sheet-purchase-overlay {
  position: fixed;
  inset: 0;
  z-index: 72;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background: rgba(2, 6, 23, 0.6);
  backdrop-filter: blur(16px);
}

.sheet-purchase-modal {
  width: min(100%, 68rem);
  max-height: min(88vh, 52rem);
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 1rem;
  padding: 1.15rem;
  border: 1px solid rgba(34, 211, 238, 0.38);
  border-radius: 16px 0 16px 0;
  clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px));
  background:
    linear-gradient(180deg, rgba(8, 18, 32, 0.98), rgba(3, 7, 18, 0.98)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.15), transparent 18rem);
  box-shadow:
    0 0 28px rgba(34, 211, 238, 0.18),
    inset 0 0 22px rgba(34, 211, 238, 0.05);
}

.sheet-purchase-modal__header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 1rem;
}

.sheet-purchase-modal__title {
  color: #e0f2fe;
  font-size: 1.1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.sheet-purchase-modal__subtitle {
  margin-top: 0.2rem;
  color: #fbbf24;
  font-size: 0.84rem;
  text-transform: uppercase;
}

.sheet-purchase-modal__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid rgba(34, 211, 238, 0.32);
  border-radius: 10px 0 10px 0;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  background: rgba(8, 18, 32, 0.86);
  color: #67e8f9;
}

.sheet-purchase-search {
  box-sizing: border-box;
  width: 100%;
  min-height: 2.4rem;
  border: 1px solid rgba(34, 211, 238, 0.24);
  border-radius: 10px 0 10px 0;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  background:
    linear-gradient(180deg, rgba(10, 18, 32, 0.9), rgba(4, 10, 22, 0.9)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.08), transparent 7rem);
  padding: 0.48rem 0.7rem;
  color: #e4e4e7;
}

.sheet-purchase-modal__body {
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(18rem, 0.9fr) minmax(20rem, 1.1fr);
  gap: 1rem;
}

.sheet-purchase-list,
.sheet-purchase-detail {
  min-height: 0;
  border: 1px solid rgba(34, 211, 238, 0.2);
  border-radius: 14px 0 14px 0;
  clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px));
  background:
    linear-gradient(180deg, rgba(8, 18, 32, 0.88), rgba(4, 10, 22, 0.88)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.08), transparent 9rem);
}

.sheet-purchase-list {
  overflow-y: auto;
  padding: 0.55rem;
  display: grid;
  align-content: start;
  gap: 0.45rem;
}

.sheet-purchase-list__item {
  display: grid;
  gap: 0.22rem;
  width: 100%;
  padding: 0.72rem 0.78rem;
  text-align: left;
  border: 1px solid rgba(34, 211, 238, 0.16);
  border-radius: 10px 0 10px 0;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  background: rgba(5, 13, 25, 0.84);
  color: #cbd5e1;
}

.sheet-purchase-list__item--selected {
  border-color: rgba(34, 211, 238, 0.46);
  box-shadow: inset 0 0 0 1px rgba(34, 211, 238, 0.08), 0 0 18px rgba(34, 211, 238, 0.12);
}

.sheet-purchase-list__row,
.sheet-purchase-list__meta,
.sheet-purchase-detail__headline,
.sheet-purchase-detail__stats,
.sheet-purchase-detail__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.sheet-purchase-list__name,
.sheet-purchase-detail__name {
  color: #e2e8f0;
  font-weight: 700;
}

.sheet-purchase-list__cost,
.sheet-purchase-detail__cost {
  color: #fbbf24;
  font-weight: 700;
}

.sheet-purchase-list__meta {
  color: #94a3b8;
  font-size: 0.78rem;
  text-transform: uppercase;
}

.sheet-purchase-list__empty {
  padding: 1rem;
  color: #94a3b8;
  text-align: center;
}

.sheet-purchase-detail {
  display: grid;
  align-content: start;
  gap: 0.9rem;
  padding: 1rem;
}

.sheet-purchase-detail__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.sheet-purchase-detail__stat {
  display: grid;
  gap: 0.22rem;
  padding: 0.7rem;
  border: 1px solid rgba(34, 211, 238, 0.12);
  border-radius: 10px 0 10px 0;
  background: rgba(6, 12, 24, 0.72);
}

.sheet-purchase-detail__stat span,
.sheet-purchase-detail__source {
  color: #94a3b8;
  font-size: 0.76rem;
  text-transform: uppercase;
}

.sheet-purchase-detail__stat strong {
  color: #e2e8f0;
}

.sheet-purchase-detail__summary {
  margin: 0;
  color: #cbd5e1;
  line-height: 1.5;
}

.sheet-purchase-detail__traits {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.sheet-purchase-detail__trait {
  display: inline-flex;
  align-items: center;
  min-height: 1.7rem;
  padding: 0 0.65rem;
  border: 1px solid rgba(34, 211, 238, 0.2);
  border-radius: 8px 0 8px 0;
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
  background: rgba(6, 12, 24, 0.72);
  color: #67e8f9;
  font-size: 0.78rem;
}

.sheet-purchase-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.3rem;
  padding: 0 0.95rem;
  border: 1px solid rgba(34, 211, 238, 0.3);
  border-radius: 10px 0 10px 0;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  background: rgba(8, 18, 32, 0.86);
  color: #67e8f9;
  font-weight: 700;
}

.sheet-purchase-action--close {
  color: #cbd5e1;
}

.sheet-purchase-action:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .sheet-purchase-modal {
    width: min(100%, 34rem);
  }

  .sheet-purchase-modal__body {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
