<script setup lang="ts">
import AppIcon from '~/components/AppIcon.vue'
import type { TravellerJournalEntry, TravellerProfile } from '~/types/traveller'

const props = defineProps<{
  draft: TravellerProfile
}>()

const selectedDate = ref({
  year: props.draft.journal.campaignYear || 1105,
  month: props.draft.journal.currentMonth || 1,
  day: 1,
})
const selectedEntryId = ref('')
const searchQuery = ref('')
const deleteConfirmEntryId = ref('')
const trainingWeeksDraft = ref(1)
const calendarSlideDirection = ref<'left' | 'right' | ''>('')
let calendarSlideTimer: number | null = null

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const logTypeOptions = ['Personal Log', 'Ship\'s Log', 'Mission Note', 'Downtime', 'Trade', 'Contact', 'Rumour']

const makeJournalId = () => `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const clampMonth = (month: number) => Math.min(12, Math.max(1, month))
const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate()
const dayOfYear = (year: number, month: number, day: number) => {
  const start = Date.UTC(year, 0, 1)
  const current = Date.UTC(year, month - 1, day)
  return Math.floor((current - start) / 86400000) + 1
}
const formatImperialDate = (date: TravellerJournalEntry['date']) => `${String(date.imperialDay).padStart(3, '0')}-${date.year}`
const formatRegularDate = (date: TravellerJournalEntry['date']) => `${monthNames[date.month - 1]} ${date.day}, ${date.year}`

const calendarYear = computed({
  get: () => props.draft.journal.campaignYear || 1105,
  set: (value: number) => {
    const year = Number.isFinite(value) ? Math.trunc(value) : 1105
    props.draft.journal.campaignYear = year
    selectedDate.value.year = year
  },
})
const calendarMonth = computed({
  get: () => clampMonth(props.draft.journal.currentMonth || 1),
  set: (value: number) => {
    const month = clampMonth(value)
    props.draft.journal.currentMonth = month
    selectedDate.value.month = month
    selectedDate.value.day = Math.min(selectedDate.value.day, daysInMonth(selectedDate.value.year, month))
  },
})
const previousMonthLabel = computed(() => monthNames[(calendarMonth.value + 10) % 12])
const nextMonthLabel = computed(() => monthNames[calendarMonth.value % 12])
const sortedEntries = computed(() => props.draft.journal.entries
  .slice()
  .sort((left, right) => {
    const leftKey = `${left.date.year}-${String(left.date.month).padStart(2, '0')}-${String(left.date.day).padStart(2, '0')}-${left.updatedAt}`
    const rightKey = `${right.date.year}-${String(right.date.month).padStart(2, '0')}-${String(right.date.day).padStart(2, '0')}-${right.updatedAt}`
    return rightKey.localeCompare(leftKey)
  }))
const entryMatchesSelectedDate = (entry: TravellerJournalEntry) =>
  entry.date.year === selectedDate.value.year
  && entry.date.month === selectedDate.value.month
  && entry.date.day === selectedDate.value.day
const filteredEntries = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const matchingEntries = sortedEntries.value.filter((entry) => {
    if (!query) return true
    return [
      entry.title,
      entry.system,
      entry.world,
      entry.location,
      entry.ship,
      entry.summary,
      entry.notes,
      entry.tags.join(' '),
    ].some((value) => (value ?? '').toLowerCase().includes(query))
  })
  return [
    ...matchingEntries.filter(entryMatchesSelectedDate),
    ...matchingEntries.filter((entry) => !entryMatchesSelectedDate(entry)),
  ]
})
const currentMonthEntries = computed(() => props.draft.journal.entries.filter((entry) =>
  entry.date.year === calendarYear.value && entry.date.month === calendarMonth.value))
const selectedDayEntries = computed(() => props.draft.journal.entries.filter((entry) =>
  entry.date.year === selectedDate.value.year
  && entry.date.month === selectedDate.value.month
  && entry.date.day === selectedDate.value.day))
const selectedEntry = computed(() => {
  return props.draft.journal.entries.find((entry) => entry.id === selectedEntryId.value)
    ?? selectedDayEntries.value[0]
    ?? null
})
const calendarCells = computed(() => {
  const firstWeekday = new Date(calendarYear.value, calendarMonth.value - 1, 1).getDay()
  const totalDays = daysInMonth(calendarYear.value, calendarMonth.value)
  const cells: Array<{ key: string, day: number | null, entries: TravellerJournalEntry[] }> = []
  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push({ key: `blank-${index}`, day: null, entries: [] })
  }
  for (let day = 1; day <= totalDays; day += 1) {
    cells.push({
      key: `day-${day}`,
      day,
      entries: currentMonthEntries.value.filter((entry) => entry.date.day === day),
    })
  }
  return cells
})

watch(selectedEntry, (entry) => {
  if (entry) selectedEntryId.value = entry.id
})

const selectDay = (day: number | null) => {
  if (!day) return
  selectedDate.value = {
    year: calendarYear.value,
    month: calendarMonth.value,
    day,
  }
  selectedEntryId.value = selectedDayEntries.value[0]?.id ?? ''
}
const selectEntry = (entry: TravellerJournalEntry) => {
  selectedEntryId.value = entry.id
  selectedDate.value = {
    year: entry.date.year,
    month: entry.date.month,
    day: entry.date.day,
  }
  props.draft.journal.campaignYear = entry.date.year
  props.draft.journal.currentMonth = entry.date.month
}
const shiftMonth = (delta: number) => {
  calendarSlideDirection.value = delta < 0 ? 'right' : 'left'
  if (calendarSlideTimer && import.meta.client) window.clearTimeout(calendarSlideTimer)
  let nextMonth = calendarMonth.value + delta
  let nextYear = calendarYear.value
  if (nextMonth < 1) {
    nextMonth = 12
    nextYear -= 1
  } else if (nextMonth > 12) {
    nextMonth = 1
    nextYear += 1
  }
  calendarYear.value = nextYear
  calendarMonth.value = nextMonth
  if (import.meta.client) {
    calendarSlideTimer = window.setTimeout(() => {
      calendarSlideDirection.value = ''
      calendarSlideTimer = null
    }, 260)
  }
}
const addLogEntry = () => {
  const now = new Date().toISOString()
  const entry: TravellerJournalEntry = {
    id: makeJournalId(),
    title: `Ship's Log ${formatImperialDate({
      year: selectedDate.value.year,
      month: selectedDate.value.month,
      day: selectedDate.value.day,
      imperialDay: dayOfYear(selectedDate.value.year, selectedDate.value.month, selectedDate.value.day),
    })}`,
    date: {
      year: selectedDate.value.year,
      month: selectedDate.value.month,
      day: selectedDate.value.day,
      imperialDay: dayOfYear(selectedDate.value.year, selectedDate.value.month, selectedDate.value.day),
    },
    location: '',
    world: '',
    system: '',
    ship: '',
    summary: '',
    notes: '',
    tags: ['Ship\'s Log'],
    createdAt: now,
    updatedAt: now,
  }
  props.draft.journal.entries.unshift(entry)
  selectedEntryId.value = entry.id
}
const duplicateLogEntry = (entry: TravellerJournalEntry) => {
  const now = new Date().toISOString()
  const copy: TravellerJournalEntry = {
    ...JSON.parse(JSON.stringify(entry)) as TravellerJournalEntry,
    id: makeJournalId(),
    title: `${entry.title || 'Untitled Log'} Copy`,
    createdAt: now,
    updatedAt: now,
  }
  props.draft.journal.entries.unshift(copy)
  selectedEntryId.value = copy.id
}
const deleteLogEntry = (entryId: string) => {
  const index = props.draft.journal.entries.findIndex((entry) => entry.id === entryId)
  if (index < 0) return
  props.draft.journal.entries.splice(index, 1)
  deleteConfirmEntryId.value = ''
  selectedEntryId.value = selectedDayEntries.value[0]?.id ?? filteredEntries.value[0]?.id ?? sortedEntries.value[0]?.id ?? ''
}
const requestDeleteLogEntry = (entryId: string) => {
  deleteConfirmEntryId.value = entryId
}
const cancelDeleteLogEntry = () => {
  deleteConfirmEntryId.value = ''
}
const touchEntry = (entry: TravellerJournalEntry) => {
  entry.updatedAt = new Date().toISOString()
}
const updateEntryTags = (entry: TravellerJournalEntry, value: string) => {
  entry.tags = value.split(',').map((tag) => tag.trim()).filter(Boolean)
  touchEntry(entry)
}
const setEntryType = (entry: TravellerJournalEntry, value: string) => {
  const tags = entry.tags.filter((tag) => !logTypeOptions.includes(tag))
  entry.tags = [value, ...tags]
  touchEntry(entry)
}
const selectedEntryType = (entry: TravellerJournalEntry) => entry.tags.find((tag) => logTypeOptions.includes(tag)) ?? 'Ship\'s Log'
const addTrainingWeeksFromLog = (entry: TravellerJournalEntry) => {
  const weeks = Math.max(1, Math.trunc(trainingWeeksDraft.value || 1))
  if (!props.draft.training.active) return
  props.draft.training.active.completedWeeks += weeks
  if (!entry.tags.includes('Training')) entry.tags = [...entry.tags, 'Training']
  const note = `Training logged: +${weeks} week${weeks === 1 ? '' : 's'} for ${props.draft.training.active.skillName}.`
  entry.summary = entry.summary ? `${entry.summary} ${note}` : note
  touchEntry(entry)
}
</script>

<template>
  <div class="sheet-page-grid sheet-page-grid--log">
    <div class="sheet-page-left">
      <section class="sheet-panel sheet-log-calendar">
        <header class="sheet-panel-title sheet-panel-title--compact sheet-panel-title--actionable">
          <span class="sheet-log-year-display">
            <small>Imperial Year</small>
            <input v-model.number="calendarYear" class="sheet-log-year-input" type="number">
          </span>
          <button class="sheet-panel-action" title="Add log entry" type="button" @click="addLogEntry">
            <AppIcon name="plus" />
          </button>
        </header>

        <div
          class="sheet-log-calendar__controls"
          :class="{
            'is-shifting-left': calendarSlideDirection === 'left',
            'is-shifting-right': calendarSlideDirection === 'right',
          }"
        >
          <button class="sheet-log-month-adjacent sheet-log-month-adjacent--prev" type="button" @click="shiftMonth(-1)">
            {{ previousMonthLabel }}
          </button>
          <select v-model.number="calendarMonth" class="sheet-line-input">
            <option v-for="(month, index) in monthNames" :key="month" :value="index + 1">
              {{ month }}
            </option>
          </select>
          <button class="sheet-log-month-adjacent sheet-log-month-adjacent--next" type="button" @click="shiftMonth(1)">
            {{ nextMonthLabel }}
          </button>
        </div>

        <div class="sheet-log-calendar__days">
          <span v-for="label in dayLabels" :key="label">{{ label }}</span>
        </div>
        <div class="sheet-log-calendar__grid">
          <button
            v-for="cell in calendarCells"
            :key="cell.key"
            class="sheet-log-calendar__day"
            :class="{
              'is-empty': !cell.day,
              'is-selected': cell.day === selectedDate.day && calendarMonth === selectedDate.month && calendarYear === selectedDate.year,
              'has-entries': cell.entries.length,
            }"
            type="button"
            :disabled="!cell.day"
            @click="selectDay(cell.day)"
          >
            <span>{{ cell.day }}</span>
            <small v-if="cell.entries.length">{{ cell.entries.length }}</small>
          </button>
        </div>
      </section>

      <section class="sheet-panel sheet-log-index">
        <header class="sheet-panel-title sheet-panel-title--compact">Log Index</header>
        <div class="sheet-log-filters">
          <input v-model="searchQuery" class="sheet-line-input" placeholder="Search logs">
        </div>

        <div class="sheet-log-entry-list">
          <button
            v-for="entry in filteredEntries"
            :key="entry.id"
            class="sheet-log-entry-list__item"
            :class="{ 'is-selected': selectedEntry?.id === entry.id }"
            type="button"
            @click="selectEntry(entry)"
          >
            <strong>{{ entry.title || 'Untitled Log' }}</strong>
            <span>{{ formatRegularDate(entry.date) }} / {{ formatImperialDate(entry.date) }}</span>
          </button>
          <p v-if="!filteredEntries.length" class="sheet-log-empty">No matching log entries.</p>
        </div>
      </section>
    </div>

    <div class="sheet-page-right">
      <section class="sheet-panel sheet-log-editor">
        <header class="sheet-panel-title sheet-panel-title--compact sheet-panel-title--actionable">
          <span>Session Log</span>
          <span v-if="selectedEntry" class="sheet-log-editor__actions">
            <button class="sheet-panel-action" title="Duplicate log entry" type="button" @click="duplicateLogEntry(selectedEntry)">
              <AppIcon name="copy" />
            </button>
            <button class="sheet-panel-action" title="Delete log entry" type="button" @click="requestDeleteLogEntry(selectedEntry.id)">
              <AppIcon name="close" />
            </button>
          </span>
        </header>

        <template v-if="selectedEntry">
          <div v-if="deleteConfirmEntryId === selectedEntry.id" class="sheet-log-confirm">
            <span>Delete this log entry?</span>
            <button class="sheet-add sheet-add--compact" type="button" @click="deleteLogEntry(selectedEntry.id)">Delete</button>
            <button class="sheet-add sheet-add--compact" type="button" @click="cancelDeleteLogEntry">Cancel</button>
          </div>

          <div class="sheet-log-editor__date">
            <strong>{{ formatRegularDate(selectedEntry.date) }}</strong>
            <span>{{ formatImperialDate(selectedEntry.date) }}</span>
          </div>

          <div class="sheet-log-editor__grid">
            <label class="sheet-line-field sheet-line-field--stacked sheet-line-field--emphasis">
              <span>Title</span>
              <input v-model="selectedEntry.title" class="sheet-line-input" @input="touchEntry(selectedEntry)">
            </label>
            <label class="sheet-line-field sheet-line-field--stacked">
              <span>Type</span>
              <select :value="selectedEntryType(selectedEntry)" class="sheet-line-input" @change="setEntryType(selectedEntry, ($event.target as HTMLSelectElement).value)">
                <option v-for="option in logTypeOptions" :key="option" :value="option">{{ option }}</option>
              </select>
            </label>
            <label class="sheet-line-field sheet-line-field--stacked">
              <span>Star System</span>
              <input v-model="selectedEntry.system" class="sheet-line-input" @input="touchEntry(selectedEntry)">
            </label>
            <label class="sheet-line-field sheet-line-field--stacked">
              <span>World</span>
              <input v-model="selectedEntry.world" class="sheet-line-input" @input="touchEntry(selectedEntry)">
            </label>
            <label class="sheet-line-field sheet-line-field--stacked">
              <span>Location</span>
              <input v-model="selectedEntry.location" class="sheet-line-input" @input="touchEntry(selectedEntry)">
            </label>
          </div>

          <label class="sheet-line-field sheet-line-field--stacked">
            <span>Tags</span>
            <input :value="selectedEntry.tags.join(', ')" class="sheet-line-input" @input="updateEntryTags(selectedEntry, ($event.target as HTMLInputElement).value)">
          </label>
          <label class="sheet-line-field sheet-line-field--stacked">
            <span>Summary</span>
            <input v-model="selectedEntry.summary" class="sheet-line-input" @input="touchEntry(selectedEntry)">
          </label>
          <div v-if="draft.training.active" class="sheet-log-training-link">
            <span>Active Training: {{ draft.training.active.skillName }}<template v-if="draft.training.active.speciality"> ({{ draft.training.active.speciality }})</template></span>
            <input v-model.number="trainingWeeksDraft" class="sheet-line-input" min="1" type="number">
            <button class="sheet-add sheet-add--compact" type="button" @click="addTrainingWeeksFromLog(selectedEntry)">
              Add Weeks
            </button>
          </div>
          <label class="sheet-line-field sheet-line-field--stacked">
            <span>Notes</span>
            <textarea v-model="selectedEntry.notes" class="sheet-textarea sheet-textarea--log" @input="touchEntry(selectedEntry)" />
          </label>
        </template>

        <div v-else class="sheet-log-empty sheet-log-empty--editor">
          Select a calendar day and add a log entry.
        </div>
      </section>
    </div>
  </div>
</template>
