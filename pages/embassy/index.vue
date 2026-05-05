<script setup lang="ts">
import speciesData from '~/data/traveller2e/core/species.json'

type SpeciesCategory =
  | 'all'
  | 'major-race'
  | 'human-culture'
  | 'human-minor-race'
  | 'minor-race'
  | 'uplifted'

type CharacteristicCode = 'STR' | 'DEX' | 'END' | 'INT' | 'EDU' | 'SOC' | 'PSI' | 'BOL' | 'TER' | 'RES'

type CharacteristicAdjustment = {
  characteristic: CharacteristicCode
  amount: number
  note?: string
}

type CharacterCreationMechanics = {
  traits?: string[]
  specialCharacteristics?: string[]
  startingAge?: string[]
  aging?: string[]
  backgroundSkills?: string[]
  education?: string[]
  careerAccess?: string[]
  skillRestrictions?: string[]
  benefits?: string[]
  psionics?: string[]
  socialStructure?: string[]
  equipment?: string[]
  other?: string[]
}

type RaceTableEntry = {
  roll: string
  result: string
}

type RaceTable = {
  id: string
  name: string
  dice?: string
  entries: RaceTableEntry[]
}

type RaceBranch = {
  id?: string
  name: string
  kind?: string
  description?: string
  selectableAsRace?: boolean
  statModifiers?: string
  statAdjustments?: CharacteristicAdjustment[]
  mechanics?: string[]
  characterCreation?: CharacterCreationMechanics
}

type SpeciesRecord = {
  id: string
  name: string
  category?: Exclude<SpeciesCategory, 'all'>
  embassyVisible?: boolean
  branchType?: 'species' | 'regional-variant' | 'culture-overlay'
  parentSpeciesId?: string
  selectableAsSpecies?: boolean
  sexModel?: 'binary' | 'single' | 'trisexual' | 'other'
  summary?: string
  appearance?: string
  physiology?: string
  culture?: string
  behaviour?: string
  sourceBook?: string
  travellerPage?: number
  statModifiers?: string
  statAdjustments?: CharacteristicAdjustment[]
  mechanics?: string[]
  characterCreation?: CharacterCreationMechanics
  characterCreationHooks?: string[]
  branches?: RaceBranch[]
  tables?: RaceTable[]
  variants?: Array<{
    name: string
    type?: string
    description?: string
    statModifiers?: string
    statAdjustments?: CharacteristicAdjustment[]
    mechanics?: string[]
    characterCreation?: CharacterCreationMechanics
  }>
}

type ReferenceSpeciesRecord = SpeciesRecord & {
  displayCategory: string
  parentName?: string
}

type SpeciesSortKey = 'name' | 'category' | 'sourceBook' | 'modifiers' | 'mechanics'
type SortIcon = 'sort-asc' | 'sort-desc'

const formatCategory = (value?: string) => {
  if (!value) return 'Species'

  return value
    .split(/[-/]/g)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' / ')
}

const buildVariantDisplayName = (parent: SpeciesRecord, variantName: string) => {
  const lowerName = variantName.toLowerCase()
  const lowerParent = parent.name.toLowerCase()
  if (lowerName.includes(lowerParent)) return variantName
  return `${parent.name} / ${variantName}`
}

const expandReferenceSpecies = (species: SpeciesRecord[]): ReferenceSpeciesRecord[] =>
  species.flatMap((entry) => {
    if (!entry.embassyVisible) return []

    const baseRecord: ReferenceSpeciesRecord = {
      ...entry,
      displayCategory: formatCategory(entry.category),
    }

    const branchRecords: ReferenceSpeciesRecord[] = (entry.branches ?? [])
      .filter((branch) => branch.selectableAsRace !== false && branch.kind === 'regional-variant')
      .map((branch, index) => ({
      ...entry,
      id: branch.id ?? `${entry.id}::branch::${index}`,
      name: buildVariantDisplayName(entry, branch.name),
      branchType: 'regional-variant',
      parentSpeciesId: entry.id,
      parentName: entry.name,
      selectableAsSpecies: entry.selectableAsSpecies !== false,
      summary: branch.description ?? entry.summary,
      statModifiers: branch.statModifiers,
      statAdjustments: branch.statAdjustments,
      mechanics: branch.mechanics?.length ? branch.mechanics : entry.mechanics,
      characterCreation: branch.characterCreation ?? entry.characterCreation,
      branches: undefined,
      variants: undefined,
      displayCategory: `${formatCategory(entry.category)} / ${formatCategory(branch.kind ?? 'branch')}`,
    }))

    const variantRecords: ReferenceSpeciesRecord[] = (entry.variants ?? []).map((variant, index) => ({
      ...entry,
      id: `${entry.id}::variant::${index}`,
      name: buildVariantDisplayName(entry, variant.name),
      branchType: 'regional-variant',
      parentSpeciesId: entry.id,
      parentName: entry.name,
      selectableAsSpecies: entry.selectableAsSpecies !== false,
      summary: variant.description ?? entry.summary,
      statModifiers: variant.statModifiers,
      statAdjustments: variant.statAdjustments,
      mechanics: variant.mechanics?.length ? variant.mechanics : entry.mechanics,
      characterCreation: variant.characterCreation ?? entry.characterCreation,
      branches: undefined,
      variants: undefined,
      displayCategory: `${formatCategory(entry.category)} / ${formatCategory(variant.type ?? 'variant')}`,
    }))

    return [baseRecord, ...branchRecords, ...variantRecords]
  })

const referenceSpecies = computed(() => expandReferenceSpecies((speciesData.raceProfiles as SpeciesRecord[]).slice()))

const search = ref('')
const selectedCategory = ref<SpeciesCategory>('all')
const speciesSortKey = ref<SpeciesSortKey>('name')
const speciesSortDirection = ref<'asc' | 'desc'>('asc')
const selectedSpeciesId = ref('')
const expandedSpeciesId = ref('')
const categoryMenuOpen = ref(false)

const categories: { id: SpeciesCategory, label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'major-race', label: 'Major Races' },
  { id: 'human-culture', label: 'Human Cultures' },
  { id: 'human-minor-race', label: 'Human Minor Races' },
  { id: 'minor-race', label: 'Minor Races' },
  { id: 'uplifted', label: 'Uplifted' },
]

const sortableSpeciesColumns: { key: SpeciesSortKey, label: string }[] = [
  { key: 'name', label: 'Species' },
  { key: 'category', label: 'Category' },
  { key: 'modifiers', label: 'Modifiers' },
  { key: 'mechanics', label: 'Mechanics' },
  { key: 'sourceBook', label: 'Source' },
]

const formatAdjustmentAmount = (amount: number) => `${amount > 0 ? '+' : ''}${amount}`

const adjustmentSummary = (adjustments?: CharacteristicAdjustment[]) =>
  (adjustments ?? [])
    .map((adjustment) => `${adjustment.characteristic}${formatAdjustmentAmount(adjustment.amount)}`)
    .join(', ')

const speciesModifierText = (species: SpeciesRecord) =>
  species.statModifiers
  ?? adjustmentSummary(species.statAdjustments)
  ?? (species.variants?.length ? 'See Variants' : 'None')

const mechanicCategoryOrder: Array<keyof CharacterCreationMechanics> = [
  'traits',
  'specialCharacteristics',
  'startingAge',
  'aging',
  'backgroundSkills',
  'education',
  'careerAccess',
  'skillRestrictions',
  'benefits',
  'psionics',
  'socialStructure',
  'equipment',
  'other',
]

const mechanicCategoryLabels: Record<keyof CharacterCreationMechanics, string> = {
  traits: 'Traits',
  specialCharacteristics: 'Special Characteristics',
  startingAge: 'Starting Age',
  aging: 'Aging',
  backgroundSkills: 'Background Skills',
  education: 'Education',
  careerAccess: 'Career Access',
  skillRestrictions: 'Skill Restrictions',
  benefits: 'Benefits',
  psionics: 'Psionics',
  socialStructure: 'Social Structure',
  equipment: 'Equipment',
  other: 'Other',
}

const mechanicSections = (species: SpeciesRecord) => mechanicCategoryOrder
  .map((key) => ({
    key,
    label: mechanicCategoryLabels[key],
    values: species.characterCreation?.[key] ?? [],
  }))
  .filter((section) => section.values.length)

const speciesMechanicsText = (species: SpeciesRecord) =>
  mechanicSections(species)[0]?.values[0]
  ?? species.mechanics?.[0]
  ?? species.characterCreationHooks?.[0]
  ?? (species.variants?.length ? 'See branch mechanics' : '-')

const categoryLabel = (category?: string) => {
  return formatCategory(category)
}

const compareValues = (firstValue: unknown, secondValue: unknown, direction: number) => {
  if (firstValue === null || firstValue === undefined) return 1
  if (secondValue === null || secondValue === undefined) return -1

  return String(firstValue ?? '').localeCompare(String(secondValue ?? ''), undefined, {
    numeric: true,
    sensitivity: 'base',
  }) * direction
}

const sortReferenceSpecies = (species: SpeciesRecord[]) => {
  const direction = speciesSortDirection.value === 'asc' ? 1 : -1
  const key = speciesSortKey.value

  return [...species].sort((first, second) => {
    const firstValue = key === 'mechanics'
      ? speciesMechanicsText(first)
      : key === 'modifiers'
        ? speciesModifierText(first)
        : first[key]
    const secondValue = key === 'mechanics'
      ? speciesMechanicsText(second)
      : key === 'modifiers'
        ? speciesModifierText(second)
        : second[key]

    return compareValues(firstValue, secondValue, direction)
  })
}

const filteredReferenceSpecies = computed(() => sortReferenceSpecies(referenceSpecies.value.filter((species) => {
  const matchesCategory = selectedCategory.value === 'all' || species.category === selectedCategory.value
  const query = search.value.trim().toLowerCase()
  const matchesSearch = !query || [
    species.name,
    species.category,
    species.displayCategory,
    species.sourceBook,
    species.summary,
    species.appearance,
    species.physiology,
    species.culture,
    species.behaviour,
    species.branchType,
    species.parentSpeciesId,
    species.sexModel,
    species.statModifiers,
    adjustmentSummary(species.statAdjustments),
    (species.mechanics ?? []).join(' '),
    mechanicSections(species).flatMap((section) => section.values).join(' '),
    (species.characterCreationHooks ?? []).join(' '),
    (species.branches ?? []).map((branch) => [
      branch.name,
      branch.kind,
      branch.description,
      branch.statModifiers,
      adjustmentSummary(branch.statAdjustments),
      (branch.mechanics ?? []).join(' '),
    ].filter(Boolean).join(' ')).join(' '),
    (species.variants ?? []).map((variant) => [
      variant.name,
      variant.type,
      variant.description,
      (variant.mechanics ?? []).join(' '),
    ].filter(Boolean).join(' ')).join(' '),
  ].filter(Boolean).join(' ').toLowerCase().includes(query)

  return matchesCategory && matchesSearch
})))

const selectedSpecies = computed(() => {
  if (selectedSpeciesId.value) {
    return referenceSpecies.value.find((species) => species.id === selectedSpeciesId.value) ?? filteredReferenceSpecies.value[0] ?? null
  }
  return filteredReferenceSpecies.value[0] ?? null
})

watch(filteredReferenceSpecies, (species) => {
  if (!species.length) {
    selectedSpeciesId.value = ''
    return
  }

  if (!species.some((entry) => entry.id === selectedSpeciesId.value)) {
    selectedSpeciesId.value = species[0]?.id ?? ''
  }
}, { immediate: true })

const setSpeciesSort = (key: SpeciesSortKey) => {
  if (speciesSortKey.value === key) {
    speciesSortDirection.value = speciesSortDirection.value === 'asc' ? 'desc' : 'asc'
    return
  }

  speciesSortKey.value = key
  speciesSortDirection.value = 'asc'
}

const speciesSortIndicator = (key: SpeciesSortKey): SortIcon | null => {
  if (speciesSortKey.value !== key) return null
  return speciesSortDirection.value === 'asc' ? 'sort-asc' : 'sort-desc'
}

const toggleExpandedSpecies = (speciesId: string) => {
  expandedSpeciesId.value = expandedSpeciesId.value === speciesId ? '' : speciesId
  selectedSpeciesId.value = speciesId
}

const selectSpeciesCategory = (categoryId: SpeciesCategory) => {
  selectedCategory.value = categoryId
  categoryMenuOpen.value = false
}
</script>

<template>
  <main class="min-h-screen text-cyan-50">
    <section class="mx-auto grid w-full max-w-[96rem] gap-5 px-5 py-6 sm:px-8 xl:grid-cols-[minmax(0,1fr)_25rem] lg:px-10">
      <div class="grid gap-5">
        <section class="hud-panel rounded-lg border p-5 shadow-sm">
          <div class="list-reference-header flex flex-wrap items-center justify-between gap-3">
            <div class="list-reference-title">
              <h2 class="text-xl font-semibold">Reference Species</h2>
            </div>
            <div class="flex items-center gap-3">
              <div class="hud-readout">
                <span class="hud-readout__value">{{ filteredReferenceSpecies.length }} shown</span>
              </div>
            </div>
            <div class="list-search-actions">
              <input
                v-model="search"
                class="h-10 rounded-md border border-cyan-400/30 bg-slate-950/70 px-3 text-sm text-cyan-50 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-300/20"
                placeholder="Search species"
              >
              <button
                class="list-category-toggle hud-link h-10 w-11"
                :aria-expanded="categoryMenuOpen"
                aria-label="Toggle species categories"
                type="button"
                @click.stop.prevent="categoryMenuOpen = !categoryMenuOpen"
              >
                <span :class="['list-category-toggle__line', categoryMenuOpen ? 'is-open' : '']" />
                <span :class="['list-category-toggle__line', categoryMenuOpen ? 'is-open' : '']" />
                <span :class="['list-category-toggle__line', categoryMenuOpen ? 'is-open' : '']" />
              </button>
            </div>
          </div>

          <div :class="['list-category-panel mt-4', categoryMenuOpen ? 'is-open' : '']">
            <button
              v-for="category in categories"
              :key="category.id"
              class="rounded-md border px-3 py-2 text-sm font-semibold"
              :class="selectedCategory === category.id ? 'border-cyan-300/70 bg-cyan-300/15 text-cyan-50' : 'border-cyan-400/25 text-cyan-100/78 hover:border-amber-300/70 hover:text-cyan-50'"
              type="button"
              @click="selectSpeciesCategory(category.id)"
            >
              {{ category.label }}
            </button>
          </div>

          <div class="hud-table-shell hud-scrollbar mt-4 max-h-[46rem] overflow-auto rounded-md border">
            <table class="mobile-collapsible-table w-full min-w-[62rem] text-left text-sm">
              <thead class="sticky top-0 z-10 bg-slate-950/95 text-xs uppercase tracking-wide text-cyan-100/60">
                <tr>
                  <th v-for="column in sortableSpeciesColumns" :key="column.key" class="species-reference-th px-3 py-2">
                    <button class="flex items-center gap-1 font-semibold uppercase tracking-wide hover:text-cyan-50" type="button" @click="setSpeciesSort(column.key)">
                      <span>{{ column.label }}</span>
                      <span class="inline-flex h-4 w-4 items-center text-amber-300">
                        <AppIcon v-if="speciesSortIndicator(column.key)" class="h-4 w-4" :name="speciesSortIndicator(column.key) ?? 'sort-asc'" />
                      </span>
                    </button>
                  </th>
                </tr>
              </thead>

              <tbody>
                <template v-for="species in filteredReferenceSpecies" :key="species.id">
                  <tr
                    class="cursor-pointer border-t border-cyan-400/15 align-top"
                    :class="selectedSpecies?.id === species.id ? 'bg-cyan-400/8' : 'hover:bg-cyan-400/5'"
                    @click="selectedSpeciesId = species.id"
                  >
                    <td class="px-3 py-2 font-semibold text-cyan-50">
                      <button class="mobile-row-toggle block w-full text-left font-semibold" type="button" @click.stop="toggleExpandedSpecies(species.id)">
                        {{ species.name }}
                      </button>
                    </td>
                    <td class="px-3 py-2">{{ species.displayCategory }}</td>
                    <td class="px-3 py-2">{{ speciesModifierText(species) }}</td>
                    <td class="px-3 py-2">{{ speciesMechanicsText(species) }}</td>
                    <td class="px-3 py-2">
                      {{ species.sourceBook || 'Traveller Core Rulebook' }}<template v-if="species.travellerPage"> p.{{ species.travellerPage }}</template>
                    </td>
                  </tr>

                  <tr v-if="expandedSpeciesId === species.id" class="mobile-detail-row border-t border-cyan-400/20">
                    <td :colspan="sortableSpeciesColumns.length" class="px-3 py-3">
                      <div class="mobile-row-detail-grid">
                        <div><span>Category</span><strong>{{ species.displayCategory }}</strong></div>
                        <div><span>Modifiers</span><strong>{{ speciesModifierText(species) }}</strong></div>
                        <div><span>Source</span><strong>{{ species.sourceBook || 'Traveller Core Rulebook' }}{{ species.travellerPage ? ` p.${species.travellerPage}` : '' }}</strong></div>
                        <div><span>Mechanics</span><strong>{{ speciesMechanicsText(species) }}</strong></div>
                        <div class="sm:col-span-2"><span>Profile</span><strong>{{ species.summary || species.culture || 'Species profile pending.' }}</strong></div>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <aside v-if="selectedSpecies" class="hud-panel hud-scrollbar rounded-lg border p-5 shadow-sm xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-auto">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="hud-kicker text-xs font-semibold uppercase tracking-wide text-amber-300/82">
              {{ selectedSpecies.displayCategory }}
            </p>
            <h2 class="mt-2 text-2xl font-semibold">{{ selectedSpecies.name }}</h2>
            <p class="mt-1 text-sm text-cyan-100/70">
              {{ selectedSpecies.sourceBook || 'Traveller Core Rulebook' }}<template v-if="selectedSpecies.travellerPage"> p.{{ selectedSpecies.travellerPage }}</template>
            </p>
            <p v-if="selectedSpecies.parentName" class="mt-1 text-sm text-cyan-100/60">
              Parent Species: {{ selectedSpecies.parentName }}
            </p>
          </div>
          <span class="hud-glyph grid h-10 w-10 shrink-0 place-items-center rounded-md">
            <AppIcon name="scout-badge" />
          </span>
        </div>

        <div class="mt-5 grid gap-3">
          <div class="rounded-md border border-cyan-400/20 bg-white/5 px-4 py-3">
            <p class="text-sm font-semibold">Stat Modifiers</p>
            <p class="mt-2 text-sm leading-6 text-cyan-100/76">
              {{ speciesModifierText(selectedSpecies) }}
            </p>
          </div>
          <div v-if="selectedSpecies.appearance" class="rounded-md border border-cyan-400/20 bg-white/5 px-4 py-3">
            <p class="text-sm font-semibold">Appearance</p>
            <p class="mt-2 text-sm leading-6 text-cyan-100/76">
              {{ selectedSpecies.appearance }}
            </p>
          </div>
          <div v-if="selectedSpecies.physiology" class="rounded-md border border-cyan-400/20 bg-white/5 px-4 py-3">
            <p class="text-sm font-semibold">Physiology</p>
            <p class="mt-2 text-sm leading-6 text-cyan-100/76">
              {{ selectedSpecies.physiology }}
            </p>
          </div>
          <div v-if="selectedSpecies.culture" class="rounded-md border border-cyan-400/20 bg-white/5 px-4 py-3">
            <p class="text-sm font-semibold">Culture</p>
            <p class="mt-2 text-sm leading-6 text-cyan-100/76">
              {{ selectedSpecies.culture }}
            </p>
          </div>
          <div v-if="selectedSpecies.behaviour" class="rounded-md border border-cyan-400/20 bg-white/5 px-4 py-3">
            <p class="text-sm font-semibold">Behaviour</p>
            <p class="mt-2 text-sm leading-6 text-cyan-100/76">
              {{ selectedSpecies.behaviour }}
            </p>
          </div>
        </div>

        <div class="mt-5">
          <p class="text-sm font-semibold">Game Mechanics</p>
          <div class="mt-2 grid gap-2">
            <template v-if="mechanicSections(selectedSpecies).length">
              <div
                v-for="section in mechanicSections(selectedSpecies)"
                :key="section.key"
                class="rounded-md border border-cyan-400/15 bg-white/5 px-3 py-3"
              >
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300/82">
                  {{ section.label }}
                </p>
                <div class="mt-2 grid gap-2">
                  <div
                    v-for="rule in section.values"
                    :key="rule"
                    class="rounded-md border border-cyan-400/10 bg-slate-950/35 px-3 py-2 text-sm text-cyan-50/88"
                  >
                    {{ rule }}
                  </div>
                </div>
              </div>
            </template>
            <div
              v-else
              v-for="rule in selectedSpecies.mechanics ?? selectedSpecies.characterCreationHooks ?? []"
              :key="rule"
              class="rounded-md border border-cyan-400/15 bg-white/5 px-3 py-2 text-sm text-cyan-50/88"
            >
              {{ rule }}
            </div>
            <p v-if="!mechanicSections(selectedSpecies).length && !(selectedSpecies.mechanics ?? selectedSpecies.characterCreationHooks ?? []).length" class="text-sm text-cyan-100/70">
              No mechanics recorded yet.
            </p>
          </div>
        </div>

        <div v-if="selectedSpecies.tables?.length" class="mt-5">
          <p class="text-sm font-semibold">Character Creation Tables</p>
          <div class="mt-2 grid gap-3">
            <div
              v-for="table in selectedSpecies.tables"
              :key="table.id"
              class="rounded-md border border-cyan-400/15 bg-white/5 px-4 py-3"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <p class="text-sm font-semibold text-cyan-50">{{ table.name }}</p>
                <span v-if="table.dice" class="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-amber-300/82">
                  {{ table.dice }}
                </span>
              </div>
              <div class="mt-3 grid gap-2">
                <div
                  v-for="entry in table.entries"
                  :key="`${table.id}-${entry.roll}-${entry.result}`"
                  class="grid grid-cols-[3.2rem_minmax(0,1fr)] gap-3 rounded-md border border-cyan-400/10 bg-slate-950/35 px-3 py-2 text-sm text-cyan-50/88"
                >
                  <span class="font-semibold text-amber-300/88">{{ entry.roll }}</span>
                  <span>{{ entry.result }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </aside>
    </section>
  </main>
</template>

<style scoped>
.hud-readout {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  padding: 0 0.95rem;
  border: 1px solid rgba(34, 211, 238, 0.26);
  border-radius: 10px 0 10px 0;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  background:
    linear-gradient(180deg, rgba(8, 18, 32, 0.86), rgba(3, 7, 18, 0.92)),
    radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.08), transparent 7rem);
}

.hud-readout__value {
  color: #ecfeff;
  font-size: 0.94rem;
  font-weight: 600;
}

.list-search-actions {
  display: flex;
  width: min(100%, 22rem);
  gap: 0.75rem;
}

.list-search-actions input {
  flex: 1 1 auto;
  min-width: 0;
}

.species-reference-th:first-child {
  padding-left: 1.75rem !important;
}

.species-reference-th:first-child > button {
  padding-left: 0.2rem;
}
</style>
