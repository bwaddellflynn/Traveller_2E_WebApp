<script setup lang="ts">
import AppIcon from '~/components/AppIcon.vue'

type SheetPage = {
  id: string
  label: string
}

const props = defineProps<{
  pages: readonly SheetPage[]
  activePage: string
  deleteConfirmOpen: boolean
}>()

const emit = defineEmits<{
  (event: 'select-page', pageId: string): void
  (event: 'import-json'): void
  (event: 'export-json'): void
  (event: 'export-pdf'): void
  (event: 'duplicate'): void
  (event: 'request-delete'): void
  (event: 'cancel-delete'): void
  (event: 'confirm-delete'): void
  (event: 'save'): void
}>()
</script>

<template>
  <!--
    Shared desktop sheet header.
    This consolidates navigation and persistent sheet actions so each page
    does not repeat the same toolbar markup.
  -->
  <div class="sheet-chrome sheet-chrome--with-actions">
    <div class="sheet-chrome__main">
      <div class="sheet-page-tabs sheet-page-tabs--chrome">
        <button
          v-for="page in props.pages"
          :key="page.id"
          class="sheet-page-tab"
          :class="{ 'is-active': props.activePage === page.id }"
          type="button"
          @click="emit('select-page', page.id)"
        >
          {{ page.label }}
        </button>
      </div>
    </div>
    <div class="sheet-toolbar">
      <button aria-label="Import JSON" class="sheet-toolbar-button" title="Import JSON" type="button" @click="emit('import-json')">
        <AppIcon name="import" />
      </button>
      <button aria-label="Export JSON" class="sheet-toolbar-button" title="Export JSON" type="button" @click="emit('export-json')">
        <AppIcon name="export" />
      </button>
      <button aria-label="Export PDF Fields" class="sheet-toolbar-button" title="Export PDF Fields" type="button" @click="emit('export-pdf')">
        <AppIcon name="briefcase" />
      </button>
      <button aria-label="Duplicate Sheet" class="sheet-toolbar-button" title="Duplicate Sheet" type="button" @click="emit('duplicate')">
        <AppIcon name="copy" />
      </button>
      <button aria-label="Delete Sheet" class="sheet-toolbar-button sheet-toolbar-button--danger" title="Delete Sheet" type="button" @click="emit('request-delete')">
        <AppIcon name="trash" />
      </button>
      <button aria-label="Save Sheet" class="sheet-toolbar-button sheet-toolbar-button--primary" title="Save Sheet" type="button" @click="emit('save')">
        <AppIcon name="save" />
      </button>
    </div>
    <div v-if="props.deleteConfirmOpen" class="sheet-toolbar-confirm" @click.stop>
      <p class="sheet-toolbar-confirm__text">Delete traveller?</p>
      <div class="sheet-toolbar-confirm__actions">
        <button class="sheet-toolbar-confirm__button" type="button" @click="emit('cancel-delete')">
          Cancel
        </button>
        <button class="sheet-toolbar-confirm__button sheet-toolbar-confirm__button--danger" type="button" @click="emit('confirm-delete')">
          Delete
        </button>
      </div>
    </div>
  </div>
</template>
