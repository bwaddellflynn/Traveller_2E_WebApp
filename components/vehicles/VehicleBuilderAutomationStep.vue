<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CustomVehicleDesign } from '~/types/vehicle'

type AutomationRule = {
  id: string
  familyId: string
  name: string
  techLevel: number
  spaces: number
  bandwidth?: number
  computerBandwidth?: number
  mass?: string
  cost: string
  capability: string
  requirement?: string
  restriction?: string
  modeled: 'Modeled' | 'Partial' | 'Reference'
}

type AutomationFamily = {
  id: string
  category: string
  name: string
  description: string
  rulesNote?: string
  rules: AutomationRule[]
}

const props = defineProps<{
  vehicle: CustomVehicleDesign
}>()

const emit = defineEmits<{
  (event: 'sync-derivations'): void
}>()

const automationFamilies: AutomationFamily[] = [
  {
    id: 'computers',
    category: 'Computers & Software',
    name: 'Vehicle Computers',
    description: 'General-purpose integrated vehicle computers. Computer/0 with Interface software is standard at TL8+ for powered vehicles.',
    rulesNote: 'Computer rating is treated as available Bandwidth for this builder pass. Higher computers become free at later TLs per the handbook table.',
    rules: [
      { id: 'computer-0', familyId: 'computers', name: 'Computer/0', techLevel: 7, spaces: 0, computerBandwidth: 0, cost: 'Cr1000; free at TL8', capability: 'Standard interface computer.', modeled: 'Modeled' },
      { id: 'computer-1', familyId: 'computers', name: 'Computer/1', techLevel: 8, spaces: 0, computerBandwidth: 1, cost: 'Cr500; free at TL11', capability: 'Bandwidth 1 vehicle computer.', modeled: 'Modeled' },
      { id: 'computer-2', familyId: 'computers', name: 'Computer/2', techLevel: 10, spaces: 0, computerBandwidth: 2, cost: 'Cr1000; free at TL13', capability: 'Bandwidth 2 vehicle computer.', modeled: 'Modeled' },
      { id: 'computer-3', familyId: 'computers', name: 'Computer/3', techLevel: 12, spaces: 0, computerBandwidth: 3, cost: 'Cr2000; free at TL16', capability: 'Bandwidth 3 vehicle computer.', modeled: 'Modeled' },
      { id: 'computer-4', familyId: 'computers', name: 'Computer/4', techLevel: 13, spaces: 0, computerBandwidth: 4, cost: 'Cr3000; free at TL18', capability: 'Bandwidth 4 vehicle computer.', modeled: 'Modeled' },
      { id: 'computer-5', familyId: 'computers', name: 'Computer/5', techLevel: 14, spaces: 0, computerBandwidth: 5, cost: 'Cr10000; free at TL19', capability: 'Bandwidth 5 vehicle computer.', modeled: 'Modeled' },
      { id: 'computer-6', familyId: 'computers', name: 'Computer/6', techLevel: 15, spaces: 0, computerBandwidth: 6, cost: 'Cr15000; free at TL20', capability: 'Bandwidth 6 vehicle computer.', modeled: 'Modeled' },
      { id: 'computer-7', familyId: 'computers', name: 'Computer/7', techLevel: 16, spaces: 0, computerBandwidth: 7, cost: 'Cr20000; free at TL21', capability: 'Bandwidth 7 vehicle computer.', modeled: 'Modeled' },
    ],
  },
  {
    id: 'ship-computers',
    category: 'Computers & Software',
    name: 'Ship Computers',
    description: 'Larger spacecraft-grade computers installed when high-Bandwidth vehicle software requires more capacity.',
    rulesNote: 'Ship computers consume one Space for every 10 Bandwidth, rounding up, and do not decrease in cost or Spaces with TL.',
    rules: [
      { id: 'ship-computer-10', familyId: 'ship-computers', name: 'Ship Computer /10', techLevel: 8, spaces: 1, computerBandwidth: 10, cost: 'Referee priced', capability: 'Bandwidth 10; consumes 1 Space.', modeled: 'Reference' },
      { id: 'ship-computer-20', familyId: 'ship-computers', name: 'Ship Computer /20', techLevel: 8, spaces: 2, computerBandwidth: 20, cost: 'Referee priced', capability: 'Bandwidth 20; consumes 2 Spaces.', modeled: 'Reference' },
      { id: 'ship-computer-40', familyId: 'ship-computers', name: 'Ship Computer /40', techLevel: 8, spaces: 4, computerBandwidth: 40, cost: 'Referee priced', capability: 'Bandwidth 40; consumes 4 Spaces.', modeled: 'Reference' },
      { id: 'computer-fibre-optic', familyId: 'ship-computers', name: 'Fibre Optic Hardening', techLevel: 7, spaces: 0, cost: '+50% computer cost, or Cr100 if computer was free', capability: 'Protects any computer against EMP, radiation, and ion weapons; adds /fib suffix.', requirement: 'Installed computer.', modeled: 'Reference' },
    ],
  },
  {
    id: 'tactical-software',
    category: 'Computers & Software',
    name: 'Tactical Software',
    description: 'Combat, sensor, fire-control, and tactical command software that consumes computer Bandwidth.',
    rules: [
      { id: 'battle-network-0', familyId: 'tactical-software', name: 'Battle Network/0', techLevel: 12, spaces: 0, bandwidth: 3, cost: 'MCr1', capability: 'Target data handoff limited to 1,000km.', modeled: 'Partial' },
      { id: 'battle-network-1', familyId: 'tactical-software', name: 'Battle Network/1', techLevel: 12, spaces: 0, bandwidth: 5, cost: 'MCr5', capability: 'Target data handoff limited to 10,000km.', modeled: 'Partial' },
      { id: 'battle-network-2', familyId: 'tactical-software', name: 'Battle Network/2', techLevel: 14, spaces: 0, bandwidth: 10, cost: 'MCr10', capability: 'Target data handoff limited to 25,000km.', modeled: 'Partial' },
      { id: 'weaponry-0', familyId: 'tactical-software', name: 'Weaponry/0', techLevel: 8, spaces: 0, bandwidth: 1, cost: 'Cr100000', capability: 'Controls one remotely operable weapon mount at skill 0.', requirement: 'Remote weapon mount with fire control.', modeled: 'Partial' },
      { id: 'weaponry-1', familyId: 'tactical-software', name: 'Weaponry/1', techLevel: 9, spaces: 0, bandwidth: 1, cost: 'Cr500000', capability: 'Controls weapons using rating as skill or multiple skill-0 mounts.', requirement: 'Remote weapon mount with fire control.', modeled: 'Partial' },
      { id: 'weaponry-2', familyId: 'tactical-software', name: 'Weaponry/2', techLevel: 10, spaces: 0, bandwidth: 2, cost: 'MCr1', capability: 'Controls weapons using rating as skill or multiple skill-0 mounts.', requirement: 'Remote weapon mount with fire control.', modeled: 'Partial' },
      { id: 'weaponry-3', familyId: 'tactical-software', name: 'Weaponry/3', techLevel: 11, spaces: 0, bandwidth: 3, cost: 'MCr2', capability: 'Controls one mount at skill 3, four mounts at skill 0, or split rating.', requirement: 'Remote weapon mount with fire control.', modeled: 'Partial' },
      { id: 'weaponry-4', familyId: 'tactical-software', name: 'Weaponry/4', techLevel: 13, spaces: 0, bandwidth: 4, cost: 'MCr4', capability: 'Controls weapons using rating as skill or multiple skill-0 mounts.', requirement: 'Remote weapon mount with fire control.', modeled: 'Partial' },
      { id: 'weaponry-5', familyId: 'tactical-software', name: 'Weaponry/5', techLevel: 15, spaces: 0, bandwidth: 5, cost: 'MCr8', capability: 'Controls weapons using rating as skill or multiple skill-0 mounts.', requirement: 'Remote weapon mount with fire control.', modeled: 'Partial' },
      { id: 'point-defence-1', familyId: 'tactical-software', name: 'Point Defence/1', techLevel: 9, spaces: 0, bandwidth: 2, cost: 'Cr500000', capability: 'DM+1 to 50m defence radius.', requirement: 'Anti-missile system.', modeled: 'Reference' },
      { id: 'point-defence-2', familyId: 'tactical-software', name: 'Point Defence/2', techLevel: 12, spaces: 0, bandwidth: 3, cost: 'Cr800000', capability: 'DM+2 to 100m defence radius.', requirement: 'Anti-missile system.', modeled: 'Reference' },
      { id: 'point-defence-3', familyId: 'tactical-software', name: 'Point Defence/3', techLevel: 14, spaces: 0, bandwidth: 5, cost: 'MCr1', capability: 'DM+3 to 100m defence radius.', requirement: 'Anti-missile system.', modeled: 'Reference' },
      { id: 'salvo-solution-1', familyId: 'tactical-software', name: 'Salvo Solution/1', techLevel: 8, spaces: 0, bandwidth: 2, cost: 'Cr500000', capability: 'DM+1 for smart missile/artillery salvoes from this vehicle.', modeled: 'Reference' },
      { id: 'salvo-solution-2', familyId: 'tactical-software', name: 'Salvo Solution/2', techLevel: 10, spaces: 0, bandwidth: 4, cost: 'Cr600000', capability: 'DM+2 for this vehicle plus 2 nearby vehicles.', modeled: 'Reference' },
      { id: 'salvo-solution-3', familyId: 'tactical-software', name: 'Salvo Solution/3', techLevel: 12, spaces: 0, bandwidth: 6, cost: 'Cr800000', capability: 'DM+3 for this vehicle plus 4 nearby vehicles.', modeled: 'Reference' },
      { id: 'salvo-solution-4', familyId: 'tactical-software', name: 'Salvo Solution/4', techLevel: 14, spaces: 0, bandwidth: 8, cost: 'MCr1', capability: 'DM+4 for this vehicle plus 8 nearby vehicles.', modeled: 'Reference' },
      { id: 'sensop-0', familyId: 'tactical-software', name: 'Sensop/0', techLevel: 8, spaces: 0, bandwidth: 1, cost: 'Cr100000', capability: 'Performs one Electronics (sensors) task at skill 0.', modeled: 'Partial' },
      { id: 'sensop-1', familyId: 'tactical-software', name: 'Sensop/1', techLevel: 9, spaces: 0, bandwidth: 1, cost: 'Cr500000', capability: 'Automates sensor tasks using rating per the Sensop rules.', modeled: 'Partial' },
      { id: 'sensop-2', familyId: 'tactical-software', name: 'Sensop/2', techLevel: 10, spaces: 0, bandwidth: 2, cost: 'MCr1', capability: 'Automates sensor tasks using rating per the Sensop rules.', modeled: 'Partial' },
      { id: 'sensop-3', familyId: 'tactical-software', name: 'Sensop/3', techLevel: 11, spaces: 0, bandwidth: 3, cost: 'MCr2', capability: 'Automates sensor tasks using rating per the Sensop rules.', modeled: 'Partial' },
      { id: 'sensop-4', familyId: 'tactical-software', name: 'Sensop/4', techLevel: 13, spaces: 0, bandwidth: 4, cost: 'MCr4', capability: 'Automates sensor tasks using rating per the Sensop rules.', modeled: 'Partial' },
      { id: 'sensop-5', familyId: 'tactical-software', name: 'Sensop/5', techLevel: 15, spaces: 0, bandwidth: 5, cost: 'MCr8', capability: 'High-end sensor operation automation.', modeled: 'Partial' },
      { id: 'tactical-battle-1', familyId: 'tactical-software', name: 'Tactical Battle System/1', techLevel: 9, spaces: 0, bandwidth: 2, cost: 'MCr4', capability: 'DM+1 to Tactics (military).', modeled: 'Reference' },
      { id: 'tactical-battle-2', familyId: 'tactical-software', name: 'Tactical Battle System/2', techLevel: 12, spaces: 0, bandwidth: 3, cost: 'MCr6', capability: 'DM+2 to Tactics (military).', modeled: 'Reference' },
      { id: 'tactical-battle-3', familyId: 'tactical-software', name: 'Tactical Battle System/3', techLevel: 15, spaces: 0, bandwidth: 5, cost: 'MCr9', capability: 'DM+3 to Tactics (military).', modeled: 'Reference' },
    ],
  },
  {
    id: 'support-software',
    category: 'Computers & Software',
    name: 'Support Software',
    description: 'Drone, swarm, and hull-display software that consumes computer Bandwidth.',
    rules: [
      { id: 'drone-control-software-1', familyId: 'support-software', name: 'Drone Control/1', techLevel: 11, spaces: 0, bandwidth: 1, cost: 'Cr2000', capability: 'Drone Control DM +0.', requirement: 'Drone interface, actuators, and transceiver link.', modeled: 'Partial' },
      { id: 'drone-control-software-2', familyId: 'support-software', name: 'Drone Control/2', techLevel: 12, spaces: 0, bandwidth: 2, cost: 'Cr5000', capability: 'Drone Control DM +1.', requirement: 'Drone interface, actuators, and transceiver link.', modeled: 'Partial' },
      { id: 'swarm-control-software-1', familyId: 'support-software', name: 'Swarm Control/1', techLevel: 11, spaces: 0, bandwidth: 1, cost: 'Cr15000', capability: '1 max task, 0 max skill.', requirement: 'Swarm controller or compatible links.', modeled: 'Reference' },
      { id: 'swarm-control-software-2', familyId: 'support-software', name: 'Swarm Control/2', techLevel: 12, spaces: 0, bandwidth: 2, cost: 'Cr30000', capability: '2 max tasks, 1 max skill.', requirement: 'Swarm controller or compatible links.', modeled: 'Reference' },
      { id: 'swarm-control-software-3', familyId: 'support-software', name: 'Swarm Control/3', techLevel: 13, spaces: 0, bandwidth: 3, cost: 'Cr60000', capability: '3 max tasks, 2 max skill.', requirement: 'Swarm controller or compatible links.', modeled: 'Reference' },
      { id: 'swarm-control-software-4', familyId: 'support-software', name: 'Swarm Control/4', techLevel: 14, spaces: 0, bandwidth: 4, cost: 'Cr120000', capability: '4 max tasks, 3 max skill.', requirement: 'Swarm controller or compatible links.', modeled: 'Reference' },
      { id: 'hpi-holographic', familyId: 'support-software', name: 'HPI Holographic Display', techLevel: 10, spaces: 0, bandwidth: 3, cost: 'Cr5000', capability: 'Custom holographic hull display patterns.', requirement: 'Holographic hull or projector.', modeled: 'Reference' },
      { id: 'hpi-multichromatic', familyId: 'support-software', name: 'HPI Multi-Chromatic Display', techLevel: 12, spaces: 0, bandwidth: 2, cost: 'Cr2000', capability: 'Custom multi-chromatic hull display patterns.', requirement: 'Multi-chromatic camouflage or display hull.', modeled: 'Reference' },
    ],
  },
  {
    id: 'drone-conversion',
    category: 'Drone Control',
    name: 'Drone Conversion',
    description: 'Required installed systems for making a vehicle remotely operated as a drone.',
    rulesNote: 'A drone needs a transceiver, drone interface, actuators, and an operator using console, helmet, or Drone Control software.',
    rules: [
      { id: 'drone-interface', familyId: 'drone-conversion', name: 'Drone Interface', techLevel: 6, spaces: 0, cost: 'Cr100', capability: 'Allows remote control of a drone vehicle.', requirement: 'Transceiver system with enough range.', modeled: 'Modeled' },
      { id: 'drone-actuators', familyId: 'drone-conversion', name: 'Drone Actuators', techLevel: 6, spaces: 0, cost: 'Cr50 per vehicle Space', capability: 'Allows drone interface to control all aspects of the vehicle.', requirement: 'Drone interface.', modeled: 'Reference' },
      { id: 'drone-console-primitive', familyId: 'drone-conversion', name: 'Primitive Drone Control Console', techLevel: 5, spaces: 0, mass: '10kg', cost: 'Cr1000', capability: 'Control DM -4.', modeled: 'Reference' },
      { id: 'drone-console-basic', familyId: 'drone-conversion', name: 'Basic Drone Control Console', techLevel: 7, spaces: 0, mass: '2kg', cost: 'Cr2500', capability: 'Control DM -2.', modeled: 'Reference' },
      { id: 'drone-console-improved', familyId: 'drone-conversion', name: 'Improved Drone Control Console', techLevel: 8, spaces: 0, mass: '2kg', cost: 'Cr1000', capability: 'Control DM +0.', modeled: 'Reference' },
      { id: 'drone-console-enhanced', familyId: 'drone-conversion', name: 'Enhanced Drone Control Console', techLevel: 10, spaces: 0, mass: '0.5kg', cost: 'Cr1000', capability: 'Control DM +0.', modeled: 'Reference' },
      { id: 'drone-console-advanced', familyId: 'drone-conversion', name: 'Advanced Drone Control Console', techLevel: 11, spaces: 0, mass: '0.5kg', cost: 'Cr5000', capability: 'Control DM +1.', modeled: 'Reference' },
      { id: 'drone-control-helmet', familyId: 'drone-conversion', name: 'Drone Control Helmet', techLevel: 11, spaces: 0, mass: '3kg', cost: 'Cr50000', capability: 'Control DM +1; thought-control VR interface with 50km transceiver.', modeled: 'Reference' },
    ],
  },
  {
    id: 'swarm-control',
    category: 'Drone Control',
    name: 'Swarm Controllers',
    description: 'Integrated consoles for controlling groups of drones or vehicle swarms.',
    rules: [
      { id: 'swarm-console-basic', familyId: 'swarm-control', name: 'Basic Swarm Controller Console', techLevel: 8, spaces: 0, mass: '10kg', cost: 'Cr20000', capability: '1 task, skill level 0 or 1 drone.', modeled: 'Reference' },
      { id: 'swarm-console-improved', familyId: 'swarm-control', name: 'Improved Swarm Controller Console', techLevel: 12, spaces: 0, mass: '6kg', cost: 'Cr50000', capability: '2 tasks, skill level 1 or 2 drones.', modeled: 'Reference' },
      { id: 'swarm-console-enhanced', familyId: 'swarm-control', name: 'Enhanced Swarm Controller Console', techLevel: 13, spaces: 0, mass: '4kg', cost: 'Cr100000', capability: '3 tasks, skill level 2 or 4 drones.', modeled: 'Reference' },
      { id: 'swarm-console-advanced', familyId: 'swarm-control', name: 'Advanced Swarm Controller Console', techLevel: 14, spaces: 0, mass: '2kg', cost: 'Cr200000', capability: '4 tasks, skill level 3 or 8 drones.', modeled: 'Reference' },
    ],
  },
  {
    id: 'vehicle-brains',
    category: 'Robot / Vehicle Brains',
    name: 'Vehicle Brains',
    description: 'Robot-brain packages that autonomously operate a vehicle, turning it into a robot-like system.',
    rulesNote: 'A vehicle brain interface costs Cr1000 per vehicle Space and is required for a robot brain to fully control the vehicle.',
    rules: [
      { id: 'vehicle-brain-interface', familyId: 'vehicle-brains', name: 'Vehicle Brain Interface', techLevel: 10, spaces: 0, cost: 'Cr1000 per vehicle Space', capability: 'Provides full haptics and direct vehicle-system control to a robot brain.', modeled: 'Reference' },
      { id: 'chauffeur-basic', familyId: 'vehicle-brains', name: 'Chauffeur, Basic', techLevel: 8, spaces: 0, cost: 'Cr12000', capability: 'Vehicle (specific) 1; autonomous careful driving, remote control via drone interface.', requirement: 'Vehicle brain interface for full vehicle embodiment.', modeled: 'Reference' },
      { id: 'chauffeur-improved', familyId: 'vehicle-brains', name: 'Chauffeur, Improved', techLevel: 10, spaces: 0, cost: 'Cr6000', capability: 'Vehicle (specific) 2; better obstacle handling and normal off-road travel.', requirement: 'Vehicle brain interface for full vehicle embodiment.', modeled: 'Reference' },
      { id: 'chauffeur-advanced', familyId: 'vehicle-brains', name: 'Chauffeur, Advanced', techLevel: 12, spaces: 0, cost: 'Cr9000', capability: 'Vehicle (specific) 3; handles unusual conditions better.', requirement: 'Vehicle brain interface for full vehicle embodiment.', modeled: 'Reference' },
      { id: 'combat-brain-basic', familyId: 'vehicle-brains', name: 'Combat Vehicle Brain, Basic', techLevel: 8, spaces: 0, cost: 'Cr75000', capability: 'Navigation 1, Recon 0, Tactics (military) 2, Vehicle 1, Weapon 2.', requirement: 'Vehicle brain interface for full vehicle embodiment.', modeled: 'Reference' },
      { id: 'combat-brain-improved', familyId: 'vehicle-brains', name: 'Combat Vehicle Brain, Improved', techLevel: 10, spaces: 0, cost: 'Cr87000', capability: 'Navigation 2, Recon 0, Tactics (military) 2, Vehicle 2, Weapon 3.', requirement: 'Vehicle brain interface for full vehicle embodiment.', modeled: 'Reference' },
      { id: 'combat-brain-advanced', familyId: 'vehicle-brains', name: 'Combat Vehicle Brain, Advanced', techLevel: 12, spaces: 0, cost: 'Cr150000', capability: 'Navigation 3, Tactics (military) 2, Vehicle 3, Weapon 4.', requirement: 'Vehicle brain interface for full vehicle embodiment.', modeled: 'Reference' },
      { id: 'tour-guide', familyId: 'vehicle-brains', name: 'Tour Guide', techLevel: 12, spaces: 0, cost: 'Cr50000', capability: 'Carouse 1, Navigation 2, Profession (tour guide) 2, Steward 1, Vehicle 2; adds 2 CP.', requirement: 'Vehicle brain interface for full vehicle embodiment.', modeled: 'Reference' },
    ],
  },
]

const allRules = computed(() => automationFamilies.flatMap((family) => family.rules.map((rule) => ({ family, rule }))))
const categoryOptions = computed(() => [...new Set(automationFamilies.map((family) => family.category))])
const selectedCategory = ref(categoryOptions.value[0] ?? '')
const familiesForCategory = computed(() => automationFamilies.filter((family) => family.category === selectedCategory.value))
const selectedFamilyId = ref(familiesForCategory.value[0]?.id ?? '')
const selectedFamily = computed(() => automationFamilies.find((family) => family.id === selectedFamilyId.value) ?? familiesForCategory.value[0] ?? automationFamilies[0])
const selectedRuleId = ref(selectedFamily.value.rules[0]?.id ?? '')
const availableRules = computed(() => selectedFamily.value.rules)
const selectedRule = computed(() => availableRules.value.find((rule) => rule.id === selectedRuleId.value) ?? availableRules.value[0])

const installedAutomation = computed(() => props.vehicle.equipmentEntries.filter((entry) => entry.category === 'Automation'))
const installedRuleMatches = computed(() => installedAutomation.value.map((entry) => {
  const match = allRules.value.find(({ rule }) => rule.id === entry.catalogueId)
  return { entry, family: match?.family, rule: match?.rule }
}))
const installedComputerBandwidth = computed(() => Math.max(0, ...installedRuleMatches.value.map(({ rule }) => rule?.computerBandwidth ?? 0)))
const usedBandwidth = computed(() => installedRuleMatches.value.reduce((total, { rule }) => total + (rule?.bandwidth ?? 0), 0))
const remainingBandwidth = computed(() => installedComputerBandwidth.value - usedBandwidth.value)
const selectedRuleIsAvailable = computed(() => selectedRule.value ? props.vehicle.techLevel >= selectedRule.value.techLevel : false)
const parseCreditAmount = (value: string) => {
  const match = value.match(/(-?)\s*(MCr|Cr)\s*([0-9]+(?:\.[0-9]+)?)/i)
  if (!match) return 0
  return (match[1] === '-' ? -1 : 1) * Number(match[3]) * (match[2].toLowerCase() === 'mcr' ? 1000000 : 1)
}
const selectedRuleCostCredits = computed(() => {
  if (!selectedRule.value) return 0
  const label = selectedRule.value.cost
  if (/free at TL\s*(\d+)/i.test(label)) {
    const freeTl = Number(label.match(/free at TL\s*(\d+)/i)?.[1] ?? 0)
    if (freeTl && props.vehicle.techLevel >= freeTl) return 0
  }
  const amount = parseCreditAmount(label)
  if (/per\s+vehicle\s+space/i.test(label)) return Math.round(amount * props.vehicle.spaces)
  if (/per\s+space/i.test(label)) return Math.round(amount * Math.max(0, selectedRule.value.spaces))
  return Math.round(amount)
})
const selectedRuleHasBandwidth = computed(() => {
  if (!selectedRule.value?.bandwidth) return true
  return selectedRule.value.bandwidth <= Math.max(0, remainingBandwidth.value)
})
const selectedRuleCanAdd = computed(() => Boolean(selectedRule.value && selectedRuleIsAvailable.value && selectedRuleHasBandwidth.value))
const selectedRuleBandwidthWarning = computed(() => {
  if (!selectedRule.value?.bandwidth) return ''
  return selectedRule.value.bandwidth > Math.max(0, remainingBandwidth.value)
    ? `Needs ${selectedRule.value.bandwidth} Bandwidth; ${Math.max(0, remainingBandwidth.value)} currently free.`
    : ''
})

watch(selectedCategory, () => {
  selectedFamilyId.value = familiesForCategory.value[0]?.id ?? ''
})

watch(selectedFamilyId, () => {
  selectedRuleId.value = availableRules.value[0]?.id ?? ''
})

const addSelectedAutomation = () => {
  if (!selectedRule.value || !selectedRuleCanAdd.value) return
  props.vehicle.equipmentEntries.push({
    name: selectedRule.value.name,
    spaces: selectedRule.value.spaces,
    cost: selectedRule.value.cost,
    costCredits: selectedRuleCostCredits.value,
    techLevel: selectedRule.value.techLevel,
    familyId: selectedRule.value.familyId,
    requirement: selectedRule.value.requirement ?? '',
    restriction: selectedRule.value.restriction ?? '',
    effect: selectedRule.value.capability,
    powered: false,
    modeled: selectedRule.value.modeled,
    bandwidth: selectedRule.value.bandwidth ?? 0,
    computerBandwidth: selectedRule.value.computerBandwidth ?? 0,
    category: 'Automation',
    catalogueId: selectedRule.value.id,
  })
  emit('sync-derivations')
}
</script>

<template>
  <section class="overflow-hidden rounded-md border border-cyan-400/25 bg-slate-950 text-cyan-50">
    <div class="vehicle-builder-step-header">
      <div class="vehicle-builder-step-header__inner">
      <div class="vehicle-builder-step-header__title">
        <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200/80">Vehicle Design Step 9</p>
        <h3 class="mt-1 text-xl font-black uppercase tracking-wide text-cyan-50">Choose Automation</h3>
      </div>
      <div class="vehicle-builder-step-header__controls">
      <div class="vehicle-builder-step-header__control-row sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <label class="grid gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100">
          <span>Category</span>
          <select v-model="selectedCategory" class="h-10 w-full min-w-0 rounded-md border border-cyan-400/35 bg-slate-950/90 px-3 text-sm font-normal normal-case tracking-normal text-cyan-50 outline-none focus:border-cyan-200">
            <option v-for="category in categoryOptions" :key="category" :value="category">{{ category }}</option>
          </select>
        </label>
        <label class="grid gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100">
          <span>Family</span>
          <select v-model="selectedFamilyId" class="h-10 w-full min-w-0 rounded-md border border-cyan-400/35 bg-slate-950/90 px-3 text-sm font-normal normal-case tracking-normal text-cyan-50 outline-none focus:border-cyan-200">
            <option v-for="family in familiesForCategory" :key="family.id" :value="family.id">{{ family.name }}</option>
          </select>
        </label>
        <button
          class="h-10 rounded-md border border-cyan-300/40 bg-cyan-300/10 px-4 text-sm font-semibold text-cyan-50 transition hover:border-cyan-200 disabled:cursor-not-allowed disabled:opacity-45"
          :disabled="!selectedRuleCanAdd"
          type="button"
          @click="addSelectedAutomation"
        >
          Add Automation
        </button>
      </div>
      <p class="vehicle-builder-step-header__message" aria-hidden="true">&nbsp;</p>
      </div>
      </div>
    </div>

    <div class="vehicle-builder-two-panel p-5">
      <div class="vehicle-builder-panel-card grid border-cyan-400/30 bg-slate-950/75 bg-[linear-gradient(rgba(34,211,238,0.065)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.065)_1px,transparent_1px)] bg-[size:2rem_2rem] p-5">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">{{ selectedFamily.category }}</p>
          <h4 class="mt-4 text-3xl font-black uppercase leading-none tracking-wide text-cyan-50">{{ selectedFamily.name }}</h4>
          <p class="mt-4 text-sm leading-6 text-cyan-50/80">{{ selectedFamily.description }}</p>
          <p v-if="selectedFamily.rulesNote" class="mt-4 rounded-md border border-cyan-400/20 bg-slate-950/70 p-3 text-sm leading-5 text-cyan-100/80">
            {{ selectedFamily.rulesNote }}
          </p>
        </div>

        <div class="self-end rounded-md border border-cyan-400/20 bg-slate-950/80 p-4">
          <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200/80">Bandwidth</p>
          <div class="mt-3 grid grid-cols-3 gap-2">
            <div class="rounded-md border border-cyan-400/20 bg-slate-950/70 p-3">
              <p class="text-[10px] font-semibold uppercase tracking-wide text-cyan-200/70">Available</p>
              <p class="mt-1 text-xl font-black text-cyan-50">{{ installedComputerBandwidth }}</p>
            </div>
            <div class="rounded-md border border-cyan-400/20 bg-slate-950/70 p-3">
              <p class="text-[10px] font-semibold uppercase tracking-wide text-cyan-200/70">Used</p>
              <p class="mt-1 text-xl font-black text-cyan-50">{{ usedBandwidth }}</p>
            </div>
            <div class="rounded-md border border-cyan-400/20 bg-slate-950/70 p-3">
              <p class="text-[10px] font-semibold uppercase tracking-wide text-cyan-200/70">Free</p>
              <p class="mt-1 text-xl font-black" :class="remainingBandwidth < 0 ? 'text-amber-200' : 'text-cyan-50'">{{ remainingBandwidth }}</p>
            </div>
          </div>
          <p class="mt-3 text-xs leading-5 text-cyan-100/70">
            Install a vehicle or ship computer before adding high-Bandwidth software. Drone systems and vehicle brains may also require transceivers, actuators, or a vehicle brain interface.
          </p>
        </div>
      </div>

      <div class="vehicle-builder-panel grid content-start gap-4">
        <label class="grid gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100">
          <span>Automation</span>
          <select v-model="selectedRuleId" class="h-10 rounded-md border border-cyan-400/35 bg-slate-950/90 px-3 text-sm font-normal normal-case tracking-normal text-cyan-50 outline-none focus:border-cyan-200">
            <option v-for="rule in availableRules" :key="rule.id" :value="rule.id" :disabled="vehicle.techLevel < rule.techLevel">
              {{ rule.name }} (TL {{ rule.techLevel }})
            </option>
          </select>
        </label>

        <section v-if="selectedRule" class="rounded-md border border-cyan-400/30 bg-slate-950/70 p-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200/80">{{ selectedRule.modeled }}</p>
              <h4 class="mt-1 text-2xl font-black uppercase tracking-wide text-cyan-50">{{ selectedRule.name }}</h4>
            </div>
            <span
              class="rounded-md border px-2 py-1 text-xs font-semibold"
              :class="selectedRuleIsAvailable ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100' : 'border-amber-300/30 bg-amber-300/10 text-amber-100'"
            >
              {{ selectedRuleIsAvailable ? 'Available' : `Requires TL ${selectedRule.techLevel}` }}
            </span>
          </div>

          <div class="mt-4 grid gap-px overflow-hidden rounded-md border border-cyan-400/20 text-sm">
            <div class="grid grid-cols-[9.5rem_minmax(0,1fr)]">
              <div class="bg-cyan-400/20 px-2 py-2 font-black uppercase tracking-wide text-cyan-100">Tech Level</div>
              <div class="border-b border-cyan-400/20 px-2 py-2 text-cyan-50">{{ selectedRule.techLevel }}</div>
            </div>
            <div class="grid grid-cols-[9.5rem_minmax(0,1fr)]">
              <div class="bg-cyan-400/20 px-2 py-2 font-black uppercase tracking-wide text-cyan-100">Spaces</div>
              <div class="border-b border-cyan-400/20 px-2 py-2 text-cyan-50">{{ selectedRule.spaces }}</div>
            </div>
            <div v-if="selectedRule.mass" class="grid grid-cols-[9.5rem_minmax(0,1fr)]">
              <div class="bg-cyan-400/20 px-2 py-2 font-black uppercase tracking-wide text-cyan-100">Mass</div>
              <div class="border-b border-cyan-400/20 px-2 py-2 text-cyan-50">{{ selectedRule.mass }}</div>
            </div>
            <div v-if="selectedRule.computerBandwidth !== undefined" class="grid grid-cols-[9.5rem_minmax(0,1fr)]">
              <div class="bg-cyan-400/20 px-2 py-2 font-black uppercase tracking-wide text-cyan-100">Bandwidth</div>
              <div class="border-b border-cyan-400/20 px-2 py-2 text-cyan-50">Provides {{ selectedRule.computerBandwidth }}</div>
            </div>
            <div v-if="selectedRule.bandwidth" class="grid grid-cols-[9.5rem_minmax(0,1fr)]">
              <div class="bg-cyan-400/20 px-2 py-2 font-black uppercase tracking-wide text-cyan-100">Bandwidth</div>
              <div class="border-b border-cyan-400/20 px-2 py-2 text-cyan-50">Uses {{ selectedRule.bandwidth }}</div>
            </div>
            <div class="grid grid-cols-[9.5rem_minmax(0,1fr)]">
              <div class="bg-cyan-400/20 px-2 py-2 font-black uppercase tracking-wide text-cyan-100">Cost</div>
              <div class="border-b border-cyan-400/20 px-2 py-2 text-cyan-50">{{ selectedRule.cost }}</div>
            </div>
            <div class="grid grid-cols-[9.5rem_minmax(0,1fr)]">
              <div class="bg-cyan-400/20 px-2 py-2 font-black uppercase tracking-wide text-cyan-100">Capability</div>
              <div class="border-b border-cyan-400/20 px-2 py-2 text-cyan-50">{{ selectedRule.capability }}</div>
            </div>
            <div v-if="selectedRule.requirement" class="grid grid-cols-[9.5rem_minmax(0,1fr)]">
              <div class="bg-cyan-400/20 px-2 py-2 font-black uppercase tracking-wide text-cyan-100">Requires</div>
              <div class="border-b border-cyan-400/20 px-2 py-2 text-cyan-50">{{ selectedRule.requirement }}</div>
            </div>
            <div v-if="selectedRule.restriction" class="grid grid-cols-[9.5rem_minmax(0,1fr)]">
              <div class="bg-cyan-400/20 px-2 py-2 font-black uppercase tracking-wide text-cyan-100">Restriction</div>
              <div class="border-b border-cyan-400/20 px-2 py-2 text-cyan-50">{{ selectedRule.restriction }}</div>
            </div>
          </div>

          <p v-if="selectedRuleBandwidthWarning" class="mt-4 rounded-md border border-amber-300/25 bg-amber-300/10 p-3 text-sm leading-5 text-amber-100">
            {{ selectedRuleBandwidthWarning }}
          </p>
        </section>
      </div>
    </div>
  </section>
</template>
