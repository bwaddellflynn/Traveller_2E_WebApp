<script setup lang="ts">
defineEmits<{
  (event: 'click'): void
}>()
</script>

<template>
  <button
    class="creator-details-button"
    type="button"
    @click="$emit('click')"
  >
    View Details
  </button>
</template>

<style scoped>
.creator-details-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.2rem 0.4rem;
  border: 0;
  background: transparent;
  color: rgb(251 191 36 / 0.92);
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
  clip-path: none;
}

.creator-details-button:hover {
  color: rgb(253 224 71);
}
</style>
