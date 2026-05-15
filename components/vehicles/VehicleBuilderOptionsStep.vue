<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CustomVehicleDesign } from '~/types/vehicle'

type OptionStage = {
  id: string
  label: string
  tl: string
  cost: string
  note: string
}

type VehicleOptionRule = {
  id: string
  familyId: string
  name: string
  description?: string
  techLevel: number
  spaces: number
  spacePercent?: number
  minimumSpaces?: number
  spacesLabel: string
  cost: string
  effect: string
  requirement?: string
  restriction?: string
  powered?: boolean
  modeled: 'Modeled' | 'Partial' | 'Reference'
}

type VehicleOptionFamily = {
  id: string
  category: string
  name: string
  description: string
  rulesNote?: string
  usesDevelopmentStages?: boolean
  rules: VehicleOptionRule[]
}

const props = defineProps<{
  vehicle: CustomVehicleDesign
}>()

const emit = defineEmits<{
  (event: 'sync-derivations'): void
}>()

const optionStages: OptionStage[] = [
  { id: 'early-prototype', label: 'Early Prototype', tl: '-2', cost: '+1000%', note: 'Twice Basic Spaces; if normally 0 Spaces, consumes 2 Spaces.' },
  { id: 'prototype', label: 'Prototype', tl: '-1', cost: '+500%', note: 'If normally 0 Spaces, consumes 1 Space.' },
  { id: 'basic', label: 'Basic', tl: '+0', cost: 'Standard', note: 'Baseline version of the option.' },
  { id: 'improved', label: 'Improved', tl: '+1 interval', cost: '-50%', note: 'Staged development only where the handbook allows it.' },
  { id: 'enhanced', label: 'Enhanced', tl: '+2 intervals', cost: '-75%', note: 'Staged development only where the handbook allows it.' },
  { id: 'advanced', label: 'Advanced', tl: '+3 intervals', cost: '-90%', note: 'Staged development only where the handbook allows it.' },
  { id: 'superior', label: 'Superior', tl: '+4 intervals', cost: '-95%', note: 'Staged development only where the handbook allows it.' },
]

const optionFamilies: VehicleOptionFamily[] = [
  {
    id: 'control-system',
    category: 'Core Options',
    name: 'Control Systems',
    description: 'Control interfaces improve or reduce effective Agility. Basic controls are assumed unless another control option is installed.',
    rulesNote: 'Positive Agility control systems require a powered vehicle.',
    rules: [
      { id: 'control-primitive', familyId: 'control-system', name: 'Primitive Control System', techLevel: 1, spaces: 0, spacesLabel: '0', cost: '-Cr25', effect: 'Agility -1.', modeled: 'Modeled' },
      { id: 'control-basic', familyId: 'control-system', name: 'Basic Control System', techLevel: 0, spaces: 0, spacesLabel: '0', cost: 'Cr0', effect: 'Agility +0; assumed baseline.', modeled: 'Modeled' },
      { id: 'control-improved', familyId: 'control-system', name: 'Improved Control System', techLevel: 7, spaces: 0, spacesLabel: '0', cost: 'Cr5000', effect: 'Agility +1.', powered: true, modeled: 'Modeled' },
      { id: 'control-enhanced', familyId: 'control-system', name: 'Enhanced Control System', techLevel: 10, spaces: 0, spacesLabel: '0', cost: 'Cr15000', effect: 'Agility +2.', powered: true, modeled: 'Modeled' },
      { id: 'control-advanced', familyId: 'control-system', name: 'Advanced Control System', techLevel: 12, spaces: 0, spacesLabel: '0', cost: 'Cr25000', effect: 'Agility +3.', powered: true, modeled: 'Modeled' },
      { id: 'control-superior', familyId: 'control-system', name: 'Superior Control System', techLevel: 15, spaces: 0, spacesLabel: '0', cost: 'Cr100000', effect: 'Agility +4.', powered: true, modeled: 'Modeled' },
    ],
  },
  {
    id: 'transceiver',
    category: 'Core Options',
    name: 'Transceivers',
    description: 'Radio communications systems. Transceivers are one of the few option families that can use the handbook Tech Level Stage progression.',
    usesDevelopmentStages: true,
    rulesNote: 'All communication systems require a powered vehicle and normally consume no Spaces.',
    rules: [
      { id: 'transceiver-5km', familyId: 'transceiver', name: '5km Transceiver', techLevel: 5, spaces: 0, spacesLabel: '0', cost: 'Cr200', effect: 'Local vehicle communications.', powered: true, modeled: 'Partial' },
      { id: 'transceiver-50km', familyId: 'transceiver', name: '50km Transceiver', techLevel: 5, spaces: 0, spacesLabel: '0', cost: 'Cr600', effect: 'Short regional communications.', powered: true, modeled: 'Partial' },
      { id: 'transceiver-500km', familyId: 'transceiver', name: '500km Transceiver', techLevel: 6, spaces: 0, spacesLabel: '0', cost: 'Cr600', effect: 'Regional communications; enables satellite uplink.', powered: true, modeled: 'Partial' },
      { id: 'transceiver-5000km', familyId: 'transceiver', name: '5,000km Transceiver', techLevel: 6, spaces: 0, spacesLabel: '0', cost: 'Cr3000', effect: 'Planetary-scale communications.', powered: true, modeled: 'Partial' },
      { id: 'transceiver-50000km', familyId: 'transceiver', name: '50,000km Transceiver', techLevel: 7, spaces: 0, spacesLabel: '0', cost: 'Cr50000', effect: 'Orbital and high-range communications.', powered: true, modeled: 'Partial' },
      { id: 'transceiver-500000km', familyId: 'transceiver', name: '500,000km Transceiver', techLevel: 9, spaces: 0, spacesLabel: '0', cost: 'Cr50000', effect: 'Deep orbital communications.', powered: true, modeled: 'Partial' },
    ],
  },
  {
    id: 'autopilot',
    category: 'Core Options',
    name: 'Autopilot',
    description: 'Automated piloting that can hold course and speed, then at higher TL perform full piloting tasks at the listed skill.',
    rulesNote: 'Autopilots require a powered vehicle. Before TL9, they suffer DM-4 on unexpected Average or harder tasks.',
    rules: [
      { id: 'autopilot-basic', familyId: 'autopilot', name: 'Basic Autopilot', techLevel: 5, spaces: 0, spacesLabel: '0', cost: 'Cr2000', effect: 'Pilot skill level 0.', powered: true, modeled: 'Reference' },
      { id: 'autopilot-improved', familyId: 'autopilot', name: 'Improved Autopilot', techLevel: 7, spaces: 0, spacesLabel: '0', cost: 'Cr7500', effect: 'Pilot skill level 1.', powered: true, modeled: 'Reference' },
      { id: 'autopilot-enhanced', familyId: 'autopilot', name: 'Enhanced Autopilot', techLevel: 9, spaces: 0, spacesLabel: '0', cost: 'Cr10000', effect: 'Pilot skill level 2; can handle combat actions when instructed.', powered: true, modeled: 'Reference' },
      { id: 'autopilot-advanced', familyId: 'autopilot', name: 'Advanced Autopilot', techLevel: 11, spaces: 0, spacesLabel: '0', cost: 'Cr15000', effect: 'Pilot skill level 3.', powered: true, modeled: 'Reference' },
      { id: 'autopilot-superior', familyId: 'autopilot', name: 'Superior Autopilot', techLevel: 14, spaces: 0, spacesLabel: '0', cost: 'Cr60000', effect: 'Pilot skill level 4.', powered: true, modeled: 'Reference' },
    ],
  },
  {
    id: 'meson-communicator',
    category: 'Core Options',
    name: 'Meson Communicators',
    description: 'Exotic communications able to transmit through solid matter unless blocked by a meson screen.',
    usesDevelopmentStages: true,
    rulesNote: 'Requires power and consumes 2 Spaces; Prototype and Early Prototype versions consume 10 and 20 Spaces.',
    rules: [
      { id: 'meson-comm-5000', familyId: 'meson-communicator', name: '5,000km Meson Communicator', techLevel: 12, spaces: 2, spacesLabel: '2', cost: 'Cr50000', effect: 'Encrypted tightbeam meson transmission to a known receiver location.', powered: true, modeled: 'Partial' },
      { id: 'meson-comm-50000', familyId: 'meson-communicator', name: '50,000km Meson Communicator', techLevel: 12, spaces: 2, spacesLabel: '2', cost: 'Cr100000', effect: 'Medium-range meson communications.', powered: true, modeled: 'Partial' },
      { id: 'meson-comm-500000', familyId: 'meson-communicator', name: '500,000km Meson Communicator', techLevel: 12, spaces: 2, spacesLabel: '2', cost: 'Cr200000', effect: 'Long-range meson communications.', powered: true, modeled: 'Partial' },
      { id: 'meson-comm-5000000', familyId: 'meson-communicator', name: '5,000,000km Meson Communicator', techLevel: 15, spaces: 2, spacesLabel: '2', cost: 'Cr500000', effect: 'Very long-range meson communications.', powered: true, modeled: 'Partial' },
    ],
  },
  {
    id: 'transceiver-options',
    category: 'Core Options',
    name: 'Transceiver Options',
    description: 'Add-on communication modes for suitable transceivers.',
    rules: [
      { id: 'comm-encryption', familyId: 'transceiver-options', name: 'Encryption Module', techLevel: 6, spaces: 0, spacesLabel: '0', cost: 'Cr4000', effect: 'Government-grade secure communications at the installed TL.', powered: true, modeled: 'Reference' },
      { id: 'comm-satellite-uplink', familyId: 'transceiver-options', name: 'Satellite Uplink', techLevel: 6, spaces: 1, spacesLabel: '1 at introduction; 0 at TL8+', cost: 'Cr1000', effect: 'Maintains moving line-of-sight link to satellites or spacecraft.', requirement: 'Requires at least a 500km transceiver.', powered: true, modeled: 'Partial' },
      { id: 'comm-tightbeam', familyId: 'transceiver-options', name: 'Tightbeam', techLevel: 8, spaces: 0, spacesLabel: '0', cost: 'Cr2000', effect: 'Laser/maser point-to-point mode; difficult to intercept.', powered: true, modeled: 'Reference' },
    ],
  },
  {
    id: 'navigation',
    category: 'Core Options',
    name: 'Navigation Systems',
    description: 'Navigation systems provide location, mapping, and route assistance.',
    rulesNote: 'All navigation systems beyond Basic require a powered vehicle.',
    rules: [
      { id: 'navigation-basic', familyId: 'navigation', name: 'Basic Navigation System', techLevel: 5, spaces: 0, spacesLabel: '0', cost: 'Cr2000', effect: 'Navigation DM +1.', modeled: 'Reference' },
      { id: 'navigation-improved', familyId: 'navigation', name: 'Improved Navigation System', techLevel: 9, spaces: 0, spacesLabel: '0', cost: 'Cr10000', effect: 'Navigation DM +2.', powered: true, modeled: 'Reference' },
      { id: 'navigation-enhanced', familyId: 'navigation', name: 'Enhanced Navigation System', techLevel: 11, spaces: 0, spacesLabel: '0', cost: 'Cr25000', effect: 'Navigation DM +3.', powered: true, modeled: 'Reference' },
      { id: 'navigation-advanced', familyId: 'navigation', name: 'Advanced Navigation System', techLevel: 13, spaces: 0, spacesLabel: '0', cost: 'Cr50000', effect: 'Navigation DM +4.', powered: true, modeled: 'Reference' },
    ],
  },
  {
    id: 'sensors',
    category: 'Core Options',
    name: 'Sensor Systems',
    description: 'Dedicated active and passive sensor packages for detecting vehicles, objects, and conditions.',
    rulesNote: 'All sensor systems and sensor customisations require a powered vehicle.',
    rules: [
      { id: 'sensor-basic', familyId: 'sensors', name: 'Basic Sensor System', techLevel: 5, spaces: 0, spacesLabel: '0', cost: 'Cr2000', effect: 'Range 1km; Electronics (sensors) DM +0.', powered: true, modeled: 'Reference' },
      { id: 'sensor-improved', familyId: 'sensors', name: 'Improved Sensor System', techLevel: 7, spaces: 0, spacesLabel: '0', cost: 'Cr15000', effect: 'Range 5km; Electronics (sensors) DM +1.', powered: true, modeled: 'Reference' },
      { id: 'sensor-enhanced', familyId: 'sensors', name: 'Enhanced Sensor System', techLevel: 11, spaces: 0, spacesLabel: '0', cost: 'Cr25000', effect: 'Range 15km; Electronics (sensors) DM +2.', powered: true, modeled: 'Reference' },
      { id: 'sensor-advanced', familyId: 'sensors', name: 'Advanced Sensor System', techLevel: 13, spaces: 0, spacesLabel: '0', cost: 'Cr50000', effect: 'Range 25km; Electronics (sensors) DM +3.', powered: true, modeled: 'Reference' },
      { id: 'sensor-superior', familyId: 'sensors', name: 'Superior Sensor System', techLevel: 16, spaces: 0, spacesLabel: '0', cost: 'Cr100000', effect: 'Range 50km; Electronics (sensors) DM +4.', powered: true, modeled: 'Reference' },
    ],
  },
  {
    id: 'camouflage',
    category: 'Core Options',
    name: 'Camouflage',
    description: 'Visual-spectrum and advanced camouflage coatings. Cost is per vehicle Space.',
    rulesNote: 'Advanced, Superior, and Active camouflage require a powered vehicle.',
    rules: [
      { id: 'camouflage-primitive', familyId: 'camouflage', name: 'Primitive Camouflage', techLevel: 1, spaces: 0, spacesLabel: '0', cost: 'Cr25 per Space', effect: 'Recon DM -1; 1km minimum range; visual.', modeled: 'Partial' },
      { id: 'camouflage-basic', familyId: 'camouflage', name: 'Basic Camouflage', techLevel: 4, spaces: 0, spacesLabel: '0', cost: 'Cr100 per Space', effect: 'Recon DM -2; 500m minimum range; visual.', modeled: 'Partial' },
      { id: 'camouflage-improved', familyId: 'camouflage', name: 'Improved Camouflage', techLevel: 7, spaces: 0, spacesLabel: '0', cost: 'Cr500 per Space', effect: 'Recon DM -2; 200m minimum range; visual and IR.', modeled: 'Partial' },
      { id: 'camouflage-enhanced', familyId: 'camouflage', name: 'Enhanced Camouflage', techLevel: 11, spaces: 0, spacesLabel: '0', cost: 'Cr2500 per Space', effect: 'Recon DM -3; 100m minimum range; full spectrum.', modeled: 'Partial' },
      { id: 'camouflage-advanced', familyId: 'camouflage', name: 'Advanced Camouflage', techLevel: 12, spaces: 0, spacesLabel: '0', cost: 'Cr10000 per Space', effect: 'Recon DM -4; 50m minimum range; multi-chromatic.', powered: true, modeled: 'Partial' },
      { id: 'camouflage-superior', familyId: 'camouflage', name: 'Superior Camouflage', techLevel: 13, spaces: 0, spacesLabel: '0', cost: 'Cr50000 per Space', effect: 'Recon DM -4; 20m minimum range; vislight.', powered: true, modeled: 'Partial' },
      { id: 'camouflage-active', familyId: 'camouflage', name: 'Active Camouflage', techLevel: 15, spaces: 0, spacesLabel: '5% of Spaces, round up', cost: 'Cr200000 per Space', effect: 'Recon and Electronics (sensors) DM -6; 0m minimum range; invisible.', powered: true, modeled: 'Partial' },
    ],
  },
  {
    id: 'sensor-customisations',
    category: 'Core Options',
    name: 'Sensor Customisations',
    description: 'Add-ons for installed sensor systems, changing range, resistance to jamming, fidelity, or deployment profile.',
    rulesNote: 'Sensor customisations require a powered vehicle and an installed sensor system.',
    rules: [
      { id: 'sensor-hardened', familyId: 'sensor-customisations', name: 'Hardened Sensors', techLevel: 7, spaces: 0, spacesLabel: '0', cost: 'Doubles sensor cost', effect: 'Ignores DM-1 of jamming or disruption penalties.', requirement: 'Installed sensor system.', powered: true, modeled: 'Reference' },
      { id: 'sensor-high-fidelity', familyId: 'sensor-customisations', name: 'High-Fidelity Sensors', techLevel: 6, spaces: 1, spacesLabel: '1', cost: 'Doubles sensor cost', effect: 'DM+1 to Electronics (sensors) checks.', requirement: 'Installed sensor system.', powered: true, modeled: 'Partial' },
      { id: 'sensor-increased-range-x10', familyId: 'sensor-customisations', name: 'Increased Sensor Range x10', techLevel: 5, spaces: 0, spacesLabel: '0', cost: 'Doubles sensor cost', effect: 'Multiplies sensor range by 10; may be applied up to three times.', requirement: 'Installed sensor system.', powered: true, modeled: 'Reference' },
      { id: 'sensor-mast', familyId: 'sensor-customisations', name: 'Sensor Mast', techLevel: 5, spaces: 1, spacesLabel: '1', cost: 'Doubles sensor cost', effect: 'Allows sensors to operate from behind cover with only the mast exposed.', requirement: 'Installed sensor system.', powered: true, modeled: 'Partial' },
      { id: 'sensor-underwater', familyId: 'sensor-customisations', name: 'Underwater Sensors', techLevel: 5, spaces: 0, spacesLabel: '0', cost: 'Doubles sensor cost', effect: 'Configures a sensor suite for underwater use; range is halved.', restriction: 'A sensor system cannot cover both underwater and above-water use.', powered: true, modeled: 'Reference' },
    ],
  },
  {
    id: 'stealth-coatings',
    category: 'Core Options',
    name: 'Stealth & Surface Coatings',
    description: 'Core signature-management coatings and holographic hull systems.',
    rulesNote: 'Stealth cannot be combined with electronic countermeasures. Holographic hull cannot be combined with camouflage or Reflec armour.',
    rules: [
      { id: 'stealth-basic', familyId: 'stealth-coatings', name: 'Basic Stealth', techLevel: 7, spaces: 0, spacesLabel: '0', cost: 'Cr5000 per Space', effect: 'Electronics (sensors) DM -1.', restriction: 'Not compatible with ECM.', modeled: 'Partial' },
      { id: 'stealth-improved', familyId: 'stealth-coatings', name: 'Improved Stealth', techLevel: 9, spaces: 0, spacesLabel: '0', cost: 'Cr10000 per Space', effect: 'Electronics (sensors) DM -2.', restriction: 'Not compatible with ECM.', modeled: 'Partial' },
      { id: 'stealth-enhanced', familyId: 'stealth-coatings', name: 'Enhanced Stealth', techLevel: 11, spaces: 0, spacesLabel: '0', cost: 'Cr15000 per Space', effect: 'Electronics (sensors) DM -3.', restriction: 'Not compatible with ECM.', modeled: 'Partial' },
      { id: 'stealth-advanced', familyId: 'stealth-coatings', name: 'Advanced Stealth', techLevel: 13, spaces: 0, spacesLabel: '0', cost: 'Cr20000 per Space', effect: 'Electronics (sensors) DM -4.', restriction: 'Not compatible with ECM.', modeled: 'Partial' },
      { id: 'holographic-hull', familyId: 'stealth-coatings', name: 'Holographic Hull', techLevel: 10, spaces: 0, spacesLabel: '0', cost: 'Cr50000 per Space', effect: 'Recon DM -5 at 1m minimum range; full-spectrum holographic masking.', requirement: 'Requires 1 Power per 4 vehicle Spaces from a nuclear power plant.', restriction: 'No other camouflage or Reflec armour.', powered: true, modeled: 'Reference' },
      { id: 'reflec', familyId: 'stealth-coatings', name: 'Reflec', techLevel: 10, spaces: 0, spacesLabel: '0', cost: 'Cr25000 per Space', effect: 'Protection +20 vs lasers; doubles detection range and Detection DM +1.', restriction: 'No camouflage or holographic hull.', modeled: 'Reference' },
    ],
  },
  {
    id: 'environmental-hull',
    category: 'External Options',
    name: 'Environmental Hull Protection',
    description: 'External hull protection for hostile, vacuum, pressure, radiation, and other dangerous environments.',
    rulesNote: 'Open-Topped vehicles cannot install hull protection. Several entries require life support for crew survival.',
    rules: [
      { id: 'env-aquatic-internal', familyId: 'environmental-hull', name: 'Aquatic Internal Environment', techLevel: 6, spaces: 0, spacesLabel: '0', cost: 'Cr1000 per Space', effect: 'Water-filled interior for aquatic occupants.', restriction: 'Does not provide hostile environment protection or life support.', modeled: 'Reference' },
      { id: 'env-hostile', familyId: 'environmental-hull', name: 'Hostile Environment Protection', techLevel: 6, spaces: 0, spacesLabel: '0', cost: 'Cr1000 per Space', effect: 'Atmospheres 2-A, 500 rads, water to 100m.', modeled: 'Reference' },
      { id: 'env-vacuum', familyId: 'environmental-hull', name: 'Vacuum Environment Protection', techLevel: 6, spaces: 0, spacesLabel: '0', cost: 'Cr2000 per Space', effect: 'Atmospheres 0-1; includes hostile environment protection.', requirement: 'Requires power and life support to accommodate crew.', powered: true, modeled: 'Reference' },
      { id: 'env-pressurised', familyId: 'environmental-hull', name: 'Pressurised Hull', techLevel: 5, spaces: 0, spacesLabel: '0', cost: 'Cr200 per Space', effect: 'Very Thin and Tainted atmospheres; supports limited altitude operation.', modeled: 'Reference' },
      { id: 'env-radiation', familyId: 'environmental-hull', name: 'Radiation Protection', techLevel: 7, spaces: 0, spacesLabel: '5% of Spaces, minimum 1', cost: 'Cr5000 per Space', effect: '+50 rads per TL and hardened electronics.', requirement: 'Requires hostile environment protection.', modeled: 'Partial' },
      { id: 'env-high-pressure', familyId: 'environmental-hull', name: 'High Pressure Protection', techLevel: 7, spaces: 0, spacesLabel: '0.5% per application, minimum 1', cost: 'Cr1500 per Space', effect: '+10 atmospheres pressure protection per application.', requirement: 'Includes hostile environment protection; requires life support for crew.', modeled: 'Partial' },
      { id: 'env-corrosive', familyId: 'environmental-hull', name: 'Corrosive Environment Protection', techLevel: 9, spaces: 0, spacesLabel: '0', cost: 'Cr5000 per Space', effect: 'Atmosphere B; includes hostile environment protection.', requirement: 'Requires life support for crew.', modeled: 'Reference' },
      { id: 'env-insidious', familyId: 'environmental-hull', name: 'Insidious Environment Protection', techLevel: 11, spaces: 0, spacesLabel: '0', cost: 'Cr25000 per Space', effect: 'Atmosphere C+ for TL days; includes hostile environment protection.', requirement: 'Requires life support for crew.', modeled: 'Reference' },
      { id: 'env-self-sealing', familyId: 'environmental-hull', name: 'Self-Sealing Hull', techLevel: 11, spaces: 0, spacesLabel: '0', cost: 'Cr5000 per Space', effect: 'Seals Severity 1 Hull breaches; includes self-cleaning hull.', modeled: 'Reference' },
      { id: 'env-self-repairing', familyId: 'environmental-hull', name: 'Self-Repairing Hull', techLevel: 12, spaces: 0, spacesLabel: '5% of Spaces, minimum 1', cost: 'Cr50000 per Space', effect: 'Repairs one Hull Critical Hit Severity per day.', powered: true, modeled: 'Partial' },
    ],
  },
  {
    id: 'connectors',
    category: 'External Options',
    name: 'Connectors',
    description: 'Couplers, docking hatches, clamps, and tow fittings for linking vehicles.',
    rules: [
      { id: 'connector-simple-coupler', familyId: 'connectors', name: 'Simple Coupler', techLevel: 2, spaces: 0, spacesLabel: '0', cost: 'Cr100', effect: 'Links to a coupler-equipped vehicle.', modeled: 'Modeled' },
      { id: 'connector-vestibule-coupler', familyId: 'connectors', name: 'Vestibule Coupler', techLevel: 3, spaces: 1, spacesLabel: '1', cost: 'Cr500', effect: 'Link that maintains environmental connection.', modeled: 'Modeled' },
      { id: 'connector-docking-hatch', familyId: 'connectors', name: 'Docking Hatch', techLevel: 5, spaces: 0, spacesLabel: '0', cost: 'Cr500', effect: 'Airtight link between vehicles.', modeled: 'Modeled' },
      { id: 'connector-tow-hitch', familyId: 'connectors', name: 'Tow Hitch', techLevel: 1, spaces: 0, spacesLabel: '0', cost: 'Cr20 per towed Space', effect: 'External tow connector.', modeled: 'Reference' },
      { id: 'connector-winch', familyId: 'connectors', name: 'Winch', techLevel: 3, spaces: 0, spacesLabel: '0', cost: 'Cr50 per vehicle Space', effect: '25m cable for towing or pulling.', modeled: 'Reference' },
    ],
  },
  {
    id: 'manipulators',
    category: 'External Options',
    name: 'Manipulator Arms',
    description: 'Remote appendages controlled by crew, automation, or a robot brain. All manipulator arms require a powered vehicle.',
    rules: [
      { id: 'manipulator-primitive', familyId: 'manipulators', name: 'Primitive Manipulator Arm', techLevel: 5, spaces: 1, spacesLabel: '1', cost: 'Cr1000', effect: 'STR 7; DEX TL-3.', powered: true, modeled: 'Partial' },
      { id: 'manipulator-basic', familyId: 'manipulators', name: 'Basic Manipulator Arm', techLevel: 7, spaces: 1, spacesLabel: '1', cost: 'Cr2000', effect: 'STR 12; DEX TL-3.', powered: true, modeled: 'Partial' },
      { id: 'manipulator-improved', familyId: 'manipulators', name: 'Improved Manipulator Arm', techLevel: 8, spaces: 1, spacesLabel: '1', cost: 'Cr5000', effect: 'STR 12; DEX TL-2.', powered: true, modeled: 'Partial' },
      { id: 'manipulator-enhanced', familyId: 'manipulators', name: 'Enhanced Manipulator Arm', techLevel: 9, spaces: 1, spacesLabel: '1', cost: 'Cr10000', effect: 'STR 15; DEX TL-1.', powered: true, modeled: 'Partial' },
      { id: 'manipulator-advanced', familyId: 'manipulators', name: 'Advanced Manipulator Arm', techLevel: 10, spaces: 1, spacesLabel: '1', cost: 'Cr15000', effect: 'STR 18; DEX TL.', powered: true, modeled: 'Partial' },
    ],
  },
  {
    id: 'external-utility',
    category: 'External Utility',
    name: 'External Utility',
    description: 'Surface-mounted utility systems for cargo, recovery, engineering, launch, landing, towing, and field support.',
    rules: [
      { id: 'cargo-mount', familyId: 'external-utility', name: 'Cargo Mount', techLevel: 1, spaces: 0, spacesLabel: '0 installed; carries up to 50% Spaces externally', cost: 'Cr250 per carried Space', effect: 'External cargo rack; non-streamlined cargo negates Streamlined and can reduce speed or handling.', modeled: 'Reference' },
      { id: 'crane-light', familyId: 'external-utility', name: 'Light Crane', techLevel: 1, spaces: 1, spacesLabel: '1', cost: 'Cr1000', effect: 'Maximum load 500kg.', modeled: 'Modeled' },
      { id: 'crane-medium', familyId: 'external-utility', name: 'Medium Crane', techLevel: 4, spaces: 5, spacesLabel: '5', cost: 'Cr10000', effect: 'Maximum load 5 tons.', modeled: 'Modeled' },
      { id: 'crane-heavy', familyId: 'external-utility', name: 'Heavy Crane', techLevel: 5, spaces: 40, spacesLabel: '40', cost: 'Cr100000', effect: 'Maximum load 100 tons.', powered: true, modeled: 'Modeled' },
      { id: 'crane-super-heavy', familyId: 'external-utility', name: 'Super Heavy Crane', techLevel: 7, spaces: 100, spacesLabel: '100', cost: 'MCr1', effect: 'Maximum load 500 tons.', powered: true, modeled: 'Modeled' },
      { id: 'cutting-tool-basic', familyId: 'external-utility', name: 'Basic Cutting Tool', techLevel: 5, spaces: 5, spacesLabel: '5', cost: 'Cr10000', effect: 'AP 5 cutting blade; cut rate 10.', powered: true, modeled: 'Modeled' },
      { id: 'cutting-tool-improved', familyId: 'external-utility', name: 'Improved Cutting Tool', techLevel: 10, spaces: 5, spacesLabel: '5', cost: 'Cr25000', effect: 'AP 10 cutting blade; cut rate 25.', powered: true, modeled: 'Modeled' },
      { id: 'cutting-tool-enhanced', familyId: 'external-utility', name: 'Enhanced Cutting Tool', techLevel: 12, spaces: 5, spacesLabel: '5', cost: 'Cr50000', effect: 'AP 20 cutting blade; cut rate 50.', powered: true, modeled: 'Modeled' },
      { id: 'cutting-tool-advanced', familyId: 'external-utility', name: 'Advanced Cutting Tool', techLevel: 14, spaces: 5, spacesLabel: '5', cost: 'Cr200000', effect: 'AP 40 cutting blade; cut rate 100.', powered: true, modeled: 'Modeled' },
      { id: 'digger-blade', familyId: 'external-utility', name: 'Digger Blade', techLevel: 5, spaces: 0, spacesLabel: 'Up to 25% of Spaces', cost: 'Cr2500 per Space', effect: 'Excavates and clears material; each Space performs labour of four sophonts and scoops 500kg.', powered: true, modeled: 'Reference' },
      { id: 'drill-rig', familyId: 'external-utility', name: 'Drill Rig', techLevel: 5, spaces: 15, spacesLabel: '15', cost: 'Cr100000', effect: 'Cuts horizontal holes or deep shafts into rock at 1-3m per hour.', powered: true, modeled: 'Modeled' },
      { id: 'external-sampler-basic', familyId: 'external-utility', name: 'Basic External Sampler', techLevel: 8, spaces: 3, spacesLabel: '3', cost: 'Cr10000', effect: 'Collects external gas, liquid, or solid samples.', powered: true, modeled: 'Modeled' },
      { id: 'external-sampler-improved', familyId: 'external-utility', name: 'Improved External Sampler', techLevel: 10, spaces: 1, spacesLabel: '1', cost: 'Cr15000', effect: 'Compact external sampling system.', powered: true, modeled: 'Modeled' },
      { id: 'external-sampler-advanced', familyId: 'external-utility', name: 'Advanced External Sampler', techLevel: 12, spaces: 0, spacesLabel: '0', cost: 'Cr25000', effect: 'Panel-scale external sampling system.', powered: true, modeled: 'Modeled' },
      { id: 'ground-penetrating-radar-basic', familyId: 'external-utility', name: 'Basic Ground Penetrating Radar', techLevel: 7, spaces: 2, spacesLabel: '2', cost: 'Cr20000', effect: 'Detects anomalies to 100m depth.', powered: true, modeled: 'Modeled' },
      { id: 'ground-penetrating-radar-improved', familyId: 'external-utility', name: 'Improved Ground Penetrating Radar', techLevel: 9, spaces: 1, spacesLabel: '1', cost: 'Cr50000', effect: 'Detects anomalies to 200m depth.', powered: true, modeled: 'Modeled' },
      { id: 'ground-penetrating-radar-advanced', familyId: 'external-utility', name: 'Advanced Ground Penetrating Radar', techLevel: 11, spaces: 1, spacesLabel: '1', cost: 'Cr100000', effect: 'Detects anomalies to 500m depth; DM+2.', powered: true, modeled: 'Modeled' },
    ],
  },
  {
    id: 'external-vehicle-handling',
    category: 'External Utility',
    name: 'Vehicle Handling Systems',
    description: 'Launch, landing, parachute, wheel, and movement-support options.',
    rules: [
      { id: 'landing-deck-basic', familyId: 'external-vehicle-handling', name: 'Basic Landing Deck', techLevel: 6, spaces: 10, spacesLabel: '10 per landed vehicle Space', cost: 'Cr20000 per Space', effect: 'Allows aeroplane landing every 6+1D rounds.', powered: true, modeled: 'Reference' },
      { id: 'landing-deck-improved', familyId: 'external-vehicle-handling', name: 'Improved Landing Deck', techLevel: 8, spaces: 10, spacesLabel: '10 per landed vehicle Space', cost: 'Cr30000 per Space', effect: 'Improved landing deck infrastructure.', powered: true, modeled: 'Reference' },
      { id: 'landing-deck-advanced', familyId: 'external-vehicle-handling', name: 'Advanced Landing Deck', techLevel: 12, spaces: 10, spacesLabel: '10 per landed vehicle Space', cost: 'Cr50000 per Space', effect: 'Land an aeroplane every 3+D3 rounds; automated.', powered: true, modeled: 'Reference' },
      { id: 'launch-deck-basic', familyId: 'external-vehicle-handling', name: 'Basic Launch Deck', techLevel: 6, spaces: 10, spacesLabel: '10 per launched vehicle Space', cost: 'Cr20000 per Space', effect: 'Launch an aeroplane every 24+2D6 rounds.', powered: true, modeled: 'Reference' },
      { id: 'launch-deck-improved', familyId: 'external-vehicle-handling', name: 'Improved Launch Deck', techLevel: 8, spaces: 10, spacesLabel: '10 per launched vehicle Space', cost: 'Cr30000 per Space', effect: 'Improved launch deck.', powered: true, modeled: 'Reference' },
      { id: 'launch-deck-advanced', familyId: 'external-vehicle-handling', name: 'Advanced Launch Deck', techLevel: 10, spaces: 10, spacesLabel: '10 per launched vehicle Space', cost: 'Cr50000 per Space', effect: 'Launch an aeroplane every 12+1D rounds.', powered: true, modeled: 'Reference' },
      { id: 'tailhook-basic', familyId: 'external-vehicle-handling', name: 'Basic Tailhook', techLevel: 6, spaces: 1, spacesLabel: '1 per 10 vehicle Spaces, minimum 1', cost: 'Cr25000 per Space', effect: 'Required aeroplane option for landing deck arrest.', modeled: 'Partial' },
      { id: 'tailhook-advanced', familyId: 'external-vehicle-handling', name: 'Advanced Tailhook', techLevel: 10, spaces: 0, spacesLabel: '0', cost: 'Cr5000 per vehicle Space', effect: 'Additional DM+2 to landing.', modeled: 'Reference' },
      { id: 'vehicle-parachute-basic', familyId: 'external-vehicle-handling', name: 'Basic Vehicle Parachute', techLevel: 5, spaces: 0, spacePercent: 0.05, minimumSpaces: 1, spacesLabel: '5% of Spaces, minimum 1', cost: 'Cr500 per Space', effect: 'Fully deploys from 500m.', modeled: 'Partial' },
      { id: 'vehicle-parachute-improved', familyId: 'external-vehicle-handling', name: 'Improved Vehicle Parachute', techLevel: 7, spaces: 0, spacePercent: 0.05, minimumSpaces: 1, spacesLabel: '5% of Spaces, minimum 1', cost: 'Cr500 per Space', effect: 'Fully deploys from 200m.', modeled: 'Partial' },
      { id: 'vehicle-parachute-enhanced', familyId: 'external-vehicle-handling', name: 'Enhanced Vehicle Parachute', techLevel: 9, spaces: 0, spacePercent: 0.05, minimumSpaces: 1, spacesLabel: '5% of Spaces, minimum 1', cost: 'Cr1000 per Space', effect: 'Fully deploys from 100m.', modeled: 'Partial' },
      { id: 'vehicle-parachute-advanced', familyId: 'external-vehicle-handling', name: 'Advanced Vehicle Parachute', techLevel: 10, spaces: 0, spacePercent: 0.05, minimumSpaces: 1, spacesLabel: '5% of Spaces, minimum 1', cost: 'Cr2000 per Space', effect: 'Grav chute; deploys from ground level.', modeled: 'Partial' },
      { id: 'tyre-chains', familyId: 'external-vehicle-handling', name: 'Tyre Chains', techLevel: 3, spaces: 0, spacesLabel: '0 installed; storage can consume cargo Space', cost: 'Cr20 per vehicle Space', effect: 'Off-Roader, Speed Band -2, negates Smart Wheels.', modeled: 'Reference' },
      { id: 'wheel-tracks', familyId: 'external-vehicle-handling', name: 'Wheel Tracks', techLevel: 5, spaces: 0, spacesLabel: '0 installed; storage uses 1 per 5 Spaces', cost: 'Cr200 per vehicle Space', effect: 'ATV, Speed Band -2, negates Smart Wheels.', modeled: 'Reference' },
    ],
  },
  {
    id: 'external-prestige-propulsion',
    category: 'External Utility',
    name: 'Prestige, Propulsion & Refuelling',
    description: 'Exterior styling, auxiliary watercraft propulsion, rams, and refuelling systems.',
    rules: [
      { id: 'luxury-exterior-soc-8', familyId: 'external-prestige-propulsion', name: 'Luxury Exterior SOC 8', techLevel: 0, spaces: 0, spacesLabel: '0', cost: '+20% per Space', effect: 'Prestige exterior styling.', modeled: 'Reference' },
      { id: 'luxury-exterior-soc-10', familyId: 'external-prestige-propulsion', name: 'Luxury Exterior SOC 10', techLevel: 0, spaces: 0, spacesLabel: '0', cost: '+50% per Space', effect: 'High-status exterior styling.', modeled: 'Reference' },
      { id: 'luxury-exterior-soc-12', familyId: 'external-prestige-propulsion', name: 'Luxury Exterior SOC 12', techLevel: 0, spaces: 0, spacesLabel: '0', cost: '+200% per Space', effect: 'Elite exterior styling.', modeled: 'Reference' },
      { id: 'outboard-idle', familyId: 'external-prestige-propulsion', name: 'Outboard Motor (Idle)', techLevel: 3, spaces: 0, spacesLabel: '0', cost: 'Cr100 per Space', effect: 'Propels a watercraft at Idle for TL x 20km.', restriction: 'Watercraft.', modeled: 'Reference' },
      { id: 'outboard-very-slow', familyId: 'external-prestige-propulsion', name: 'Outboard Motor (Very Slow)', techLevel: 4, spaces: 0, spacesLabel: '0', cost: 'Cr250 per Space', effect: 'Propels a watercraft at Very Slow for TL x 20km.', restriction: 'Watercraft.', modeled: 'Reference' },
      { id: 'ram', familyId: 'external-prestige-propulsion', name: 'Ram', techLevel: 1, spaces: 0, spacePercent: 0.05, minimumSpaces: 1, spacesLabel: '5% of Spaces, minimum 1', cost: 'Cr100 per Space', effect: '4D plus 1D per 50 Spaces ramming damage.', modeled: 'Partial' },
      { id: 'ram-metal-tipped', familyId: 'external-prestige-propulsion', name: 'Metal-Tipped Ram', techLevel: 1, spaces: 0, spacePercent: 0.05, minimumSpaces: 1, spacesLabel: '5% of Spaces, minimum 1', cost: 'Cr200 per Space', effect: '4D, AP4 plus 1D and AP1 per 50 Spaces.', modeled: 'Partial' },
      { id: 'refuelling-plant-basic', familyId: 'external-prestige-propulsion', name: 'Basic Refuelling Plant', techLevel: 9, spaces: 0, spacePercent: 0.05, minimumSpaces: 5, spacesLabel: '5% of Spaces, minimum 5', cost: 'Cr15000 per Space consumed', effect: 'Refuels a vehicle in 24 hours.', powered: true, modeled: 'Partial' },
      { id: 'refuelling-plant-advanced', familyId: 'external-prestige-propulsion', name: 'Advanced Refuelling Plant', techLevel: 12, spaces: 0, spacePercent: 0.04, minimumSpaces: 5, spacesLabel: '4% of Spaces, minimum 5', cost: 'Cr20000 per Space consumed', effect: 'Refuels a vehicle in 12 hours.', powered: true, modeled: 'Partial' },
    ],
  },
  {
    id: 'active-defence-sensors',
    category: 'Active Defence',
    name: 'Defence Sensors & Counter-Signatures',
    description: 'Specialized camouflage and detection systems from the Active Defence section.',
    rules: [
      { id: 'acoustic-camouflage-basic', familyId: 'active-defence-sensors', name: 'Basic Acoustic Camouflage', techLevel: 5, spaces: 0, spacesLabel: '0', cost: 'Cr250 per Space', effect: 'Detection DM -1; 50m minimum range; negates acoustic sensor bonuses.', modeled: 'Partial' },
      { id: 'acoustic-camouflage-improved', familyId: 'active-defence-sensors', name: 'Improved Acoustic Camouflage', techLevel: 8, spaces: 0, spacesLabel: '0', cost: 'Cr500 per Space', effect: 'Detection DM -2; 20m minimum range; active sound dampening.', powered: true, modeled: 'Partial' },
      { id: 'acoustic-camouflage-enhanced', familyId: 'active-defence-sensors', name: 'Enhanced Acoustic Camouflage', techLevel: 10, spaces: 0, spacesLabel: '0', cost: 'Cr2000 per Space', effect: 'Detection DM -3; 10m minimum range; active sound projection.', powered: true, modeled: 'Partial' },
      { id: 'acoustic-camouflage-advanced', familyId: 'active-defence-sensors', name: 'Advanced Acoustic Camouflage', techLevel: 12, spaces: 0, spacesLabel: '0', cost: 'Cr5000 per Space', effect: 'Detection DM -4; 1m minimum range.', powered: true, modeled: 'Partial' },
      { id: 'acoustic-sensor-basic', familyId: 'active-defence-sensors', name: 'Basic Acoustic Sensor', techLevel: 5, spaces: 0, spacesLabel: '0', cost: 'Cr500', effect: 'Range 5km; Detection DM +1.', powered: true, modeled: 'Reference' },
      { id: 'acoustic-sensor-improved', familyId: 'active-defence-sensors', name: 'Improved Acoustic Sensor', techLevel: 8, spaces: 0, spacesLabel: '0', cost: 'Cr10000', effect: 'Range 10km; Detection DM +2.', powered: true, modeled: 'Reference' },
      { id: 'acoustic-sensor-enhanced', familyId: 'active-defence-sensors', name: 'Enhanced Acoustic Sensor', techLevel: 10, spaces: 0, spacesLabel: '0', cost: 'Cr50000', effect: 'Range 100km; Detection DM +3.', powered: true, modeled: 'Reference' },
      { id: 'chemical-camouflage-basic', familyId: 'active-defence-sensors', name: 'Basic Chemical Camouflage', techLevel: 5, spaces: 0, spacesLabel: '0', cost: 'Cr500 per Space', effect: 'Detection DM -1; 100m minimum range.', modeled: 'Partial' },
      { id: 'chemical-camouflage-improved', familyId: 'active-defence-sensors', name: 'Improved Chemical Camouflage', techLevel: 8, spaces: 0, spacesLabel: '0', cost: 'Cr1000 per Space', effect: 'Detection DM -2; 20m minimum range.', powered: true, modeled: 'Partial' },
      { id: 'chemical-camouflage-enhanced', familyId: 'active-defence-sensors', name: 'Enhanced Chemical Camouflage', techLevel: 10, spaces: 0, spacesLabel: '0', cost: 'Cr5000 per Space', effect: 'Detection DM -3; 10m minimum range.', powered: true, modeled: 'Partial' },
      { id: 'chemical-camouflage-advanced', familyId: 'active-defence-sensors', name: 'Advanced Chemical Camouflage', techLevel: 12, spaces: 0, spacesLabel: '0', cost: 'Cr10000 per Space', effect: 'Detection DM -4; 0m minimum range.', powered: true, modeled: 'Partial' },
      { id: 'chemical-sensor-basic', familyId: 'active-defence-sensors', name: 'Basic Chemical Sensor', techLevel: 8, spaces: 0, spacesLabel: '0', cost: 'Cr50000', effect: 'Range 1km; Detection DM +1.', powered: true, modeled: 'Reference' },
      { id: 'chemical-sensor-improved', familyId: 'active-defence-sensors', name: 'Improved Chemical Sensor', techLevel: 10, spaces: 0, spacesLabel: '0', cost: 'Cr100000', effect: 'Range 5km; Detection DM +2.', powered: true, modeled: 'Reference' },
      { id: 'chemical-sensor-enhanced', familyId: 'active-defence-sensors', name: 'Enhanced Chemical Sensor', techLevel: 12, spaces: 0, spacesLabel: '0', cost: 'Cr200000', effect: 'Range 10km; Detection DM +3.', powered: true, modeled: 'Reference' },
      { id: 'chemical-sensor-advanced', familyId: 'active-defence-sensors', name: 'Advanced Chemical Sensor', techLevel: 14, spaces: 0, spacesLabel: '0', cost: 'Cr500000', effect: 'Range 20km; Detection DM +4.', powered: true, modeled: 'Reference' },
    ],
  },
  {
    id: 'active-defence-systems',
    category: 'Active Defence',
    name: 'Defence Systems',
    description: 'Automated projectile defence, decoys, ECM, screens, dampers, and defensive armour systems.',
    rulesNote: 'Several active defence systems have incompatibilities or require nuclear power; those are called out on each card.',
    rules: [
      { id: 'ams-minigun', familyId: 'active-defence-systems', name: 'Anti-Missile Minigun', techLevel: 7, spaces: 3, spacesLabel: '3', cost: 'Cr200000', effect: '0.5km, 3D, Defence Roll DM +0, Auto 6, magazine 600.', powered: true, modeled: 'Partial' },
      { id: 'ams-laser', familyId: 'active-defence-systems', name: 'Anti-Missile Laser', techLevel: 10, spaces: 4, spacesLabel: '4', cost: 'Cr250000', effect: '0.5km, 1D, Defence Roll DM +1, Auto 3.', powered: true, modeled: 'Partial' },
      { id: 'ams-gauss', familyId: 'active-defence-systems', name: 'Anti-Missile Gauss Gun', techLevel: 12, spaces: 3, spacesLabel: '3', cost: 'Cr350000', effect: '1km, 4D, Defence Roll DM +2, Auto 6, magazine 1200.', powered: true, modeled: 'Partial' },
      { id: 'ams-advanced-laser', familyId: 'active-defence-systems', name: 'Advanced Anti-Missile Laser', techLevel: 13, spaces: 2, spacesLabel: '2', cost: 'Cr500000', effect: '1km, 2D, Defence Roll DM +4, Auto 4.', powered: true, modeled: 'Partial' },
      { id: 'decoy-dispenser', familyId: 'active-defence-systems', name: 'Decoy Dispenser', techLevel: 5, spaces: 1, spacesLabel: '1', cost: 'Cr2500 per Space', effect: 'Smart weapons suffer DM-2 to attack rolls while decoys are deployed; 60 decoys.', modeled: 'Reference' },
      { id: 'ecm-basic', familyId: 'active-defence-systems', name: 'Basic ECM', techLevel: 5, spaces: 1, spacesLabel: '1', cost: 'Cr10000 per Space', effect: 'Range 1km; Electronics DM -0.', restriction: 'Not compatible with stealth.', powered: true, modeled: 'Partial' },
      { id: 'ecm-improved', familyId: 'active-defence-systems', name: 'Improved ECM', techLevel: 8, spaces: 1, spacesLabel: '1', cost: 'Cr20000 per Space', effect: 'Range 5km; Electronics DM -1.', restriction: 'Not compatible with stealth.', powered: true, modeled: 'Partial' },
      { id: 'ecm-enhanced', familyId: 'active-defence-systems', name: 'Enhanced ECM', techLevel: 11, spaces: 1, spacesLabel: '1', cost: 'Cr40000 per Space', effect: 'Range 15km; Electronics DM -2.', restriction: 'Not compatible with stealth.', powered: true, modeled: 'Partial' },
      { id: 'ecm-advanced', familyId: 'active-defence-systems', name: 'Advanced ECM', techLevel: 13, spaces: 1, spacesLabel: '1', cost: 'Cr80000 per Space', effect: 'Range 25km; Electronics DM -3.', restriction: 'Not compatible with stealth.', powered: true, modeled: 'Partial' },
      { id: 'ecm-superior', familyId: 'active-defence-systems', name: 'Superior ECM', techLevel: 16, spaces: 1, spacesLabel: '1', cost: 'Cr160000 per Space', effect: 'Range 50km; Electronics DM -4.', restriction: 'Not compatible with stealth.', powered: true, modeled: 'Partial' },
      { id: 'electrostatic-armour', familyId: 'active-defence-systems', name: 'Electrostatic Armour', techLevel: 9, spaces: 0, spacePercent: 0.1, minimumSpaces: 5, spacesLabel: '10% of Spaces, minimum 5', cost: 'Cr10000 per Space consumed', effect: 'Protection equal to 3x vehicle TL against projectiles for limited attacks per round.', restriction: 'Not compatible with reactive armour; invalidates stealth and ECM while active.', powered: true, modeled: 'Partial' },
      { id: 'meson-screen', familyId: 'active-defence-systems', name: 'Meson Screen', techLevel: 13, spaces: 12, spacesLabel: '12', cost: 'MCr1', effect: 'Gunner (screens) check reduces meson damage and removes Radiation trait.', requirement: 'Requires 9 Power from a nuclear power plant.', powered: true, modeled: 'Reference' },
      { id: 'nas', familyId: 'active-defence-systems', name: 'Neural Activity Scanner', techLevel: 15, spaces: 1, spacesLabel: '1', cost: 'Cr200000', effect: 'Detects and analyses neural activity up to 5km away.', powered: true, modeled: 'Reference' },
      { id: 'nuclear-damper', familyId: 'active-defence-systems', name: 'Nuclear Damper', techLevel: 12, spaces: 12, spacesLabel: '12', cost: 'Cr500000', effect: 'Ignores Radiation trait and can prevent nearby nuclear detonations.', requirement: 'Requires 6 Power from a nuclear power plant and a dedicated operator.', powered: true, modeled: 'Reference' },
      { id: 'prismatic-aerosol', familyId: 'active-defence-systems', name: 'Prismatic Aerosol Discharger', techLevel: 9, spaces: 1, spacesLabel: '1', cost: 'Cr4000', effect: 'Laser attacks reduce damage by 2D; 30 charges.', restriction: 'No effect while moving or in strong wind.', modeled: 'Reference' },
      { id: 'reactive-armour-basic', familyId: 'active-defence-systems', name: 'Basic Reactive Armour', techLevel: 7, spaces: 0, spacesLabel: '0', cost: 'Cr1000 per Space', effect: 'Protection +15; degrades as charges are expended.', restriction: 'Not compatible with electrostatic armour.', modeled: 'Partial' },
      { id: 'reactive-armour-improved', familyId: 'active-defence-systems', name: 'Improved Reactive Armour', techLevel: 9, spaces: 0, spacesLabel: '0', cost: 'Cr2500 per Space', effect: 'Protection +25; degrades as charges are expended.', restriction: 'Not compatible with electrostatic armour.', modeled: 'Partial' },
      { id: 'reactive-armour-advanced', familyId: 'active-defence-systems', name: 'Advanced Reactive Armour', techLevel: 11, spaces: 0, spacesLabel: '0', cost: 'Cr5000 per Space', effect: 'Protection +30; degrades as charges are expended.', restriction: 'Not compatible with electrostatic armour.', modeled: 'Partial' },
      { id: 'recon-sensor-basic', familyId: 'active-defence-systems', name: 'Basic Recon Sensor', techLevel: 8, spaces: 0, spacesLabel: '0', cost: 'Cr10000', effect: 'Recon skill 1; detects reduced signature targets.', powered: true, modeled: 'Reference' },
      { id: 'recon-sensor-improved', familyId: 'active-defence-systems', name: 'Improved Recon Sensor', techLevel: 10, spaces: 0, spacesLabel: '0', cost: 'Cr20000', effect: 'Recon skill 2.', powered: true, modeled: 'Reference' },
      { id: 'recon-sensor-enhanced', familyId: 'active-defence-systems', name: 'Enhanced Recon Sensor', techLevel: 12, spaces: 0, spacesLabel: '0', cost: 'Cr50000', effect: 'Recon skill 3.', powered: true, modeled: 'Reference' },
      { id: 'recon-sensor-advanced', familyId: 'active-defence-systems', name: 'Advanced Recon Sensor', techLevel: 14, spaces: 0, spacesLabel: '0', cost: 'Cr100000', effect: 'Recon skill 4.', powered: true, modeled: 'Reference' },
      { id: 'smoke-discharger', familyId: 'active-defence-systems', name: 'Smoke Discharger', techLevel: 3, spaces: 1, spacesLabel: '1', cost: 'Cr1000', effect: 'Attacks suffer DM-2 while smoke protects a stationary vehicle; 30 charges.', modeled: 'Reference' },
    ],
  },
  {
    id: 'internal-environment',
    category: 'Internal Options',
    name: 'Internal Protection',
    description: 'Interior fittings that protect occupants or specialized working spaces.',
    rules: [
      { id: 'internal-airlock', familyId: 'internal-environment', name: 'Airlock', techLevel: 6, spaces: 2, spacesLabel: '2', cost: 'Cr2000', effect: 'Allows entry and exit without compromising internal environment; includes docking hatch.', modeled: 'Modeled' },
      { id: 'internal-biosphere', familyId: 'internal-environment', name: 'Biosphere', techLevel: 8, spaces: 2, spacesLabel: '2 per person supported', cost: 'Cr50000 per Space', effect: 'Supplements long-term and closed-cycle life support; CP 2 per Space.', requirement: 'Requires 1 Space of closed-cycle life support for recycling.', modeled: 'Partial' },
      { id: 'internal-clean-room', familyId: 'internal-environment', name: 'Clean Room', techLevel: 5, spaces: 1, spacesLabel: 'Assigned Spaces', cost: 'Cr500 per Space', effect: 'Low particulate environment for delicate work.', modeled: 'Reference' },
      { id: 'internal-collision-basic', familyId: 'internal-environment', name: 'Basic Collision Protection', techLevel: 7, spaces: 0, spacesLabel: 'Protects occupant Spaces', cost: 'Cr500 per protected Space', effect: 'Protection +8 against collision injury.', modeled: 'Partial' },
      { id: 'internal-collision-improved', familyId: 'internal-environment', name: 'Improved Collision Protection', techLevel: 9, spaces: 0, spacesLabel: 'Protects occupant Spaces', cost: 'Cr1000 per protected Space', effect: 'Protection +12 against collision injury.', modeled: 'Partial' },
      { id: 'internal-collision-advanced', familyId: 'internal-environment', name: 'Advanced Collision Protection', techLevel: 12, spaces: 0, spacesLabel: 'Protects occupant Spaces', cost: 'Cr2000 per protected Space', effect: 'Protection +20 against collision injury.', modeled: 'Partial' },
      { id: 'internal-ejection-cocoon', familyId: 'internal-environment', name: 'Ejection Cocoon', techLevel: 0, spaces: 3, spacesLabel: '3 per crew member', cost: 'Cr10000 per Space', effect: 'Protection +10 to occupant and collision cushioning.', modeled: 'Partial' },
    ],
  },
  {
    id: 'life-support-gravity',
    category: 'Internal Options',
    name: 'Life Support & Gravity',
    description: 'Systems that maintain atmosphere, gravity, acceleration comfort, and emergency survival.',
    rules: [
      { id: 'ejection-seat', familyId: 'life-support-gravity', name: 'Ejection Seat', techLevel: 5, spaces: 0, spacesLabel: '0; maximum one per vehicle Space', cost: 'Cr5000', effect: 'Reaction-triggered escape seat; TL10+ uses grav chute.', modeled: 'Reference' },
      { id: 'fire-extinguishers', familyId: 'life-support-gravity', name: 'Fire Extinguishers', techLevel: 5, spaces: 0, spacesLabel: '0', cost: 'Cr20 per Space', effect: 'Reaction activation; fire is extinguished on 8+ for 1D rounds.', modeled: 'Reference' },
      { id: 'grav-plating', familyId: 'life-support-gravity', name: 'Grav Plating', techLevel: 10, spaces: 0, spacePercent: 0.01, minimumSpaces: 1, spacesLabel: '1% of Spaces, minimum 1', cost: 'Cr2000 per Space', effect: 'CP 1 per Space; alters interior gravity by +/-2G.', requirement: 'Requires grav drives or lifters.', powered: true, modeled: 'Partial' },
      { id: 'inertial-compensator', familyId: 'life-support-gravity', name: 'Inertial Compensator', techLevel: 10, spaces: 0, spacePercent: 0.005, minimumSpaces: 1, spacesLabel: '0.5% of Spaces, minimum 1', cost: 'Cr2000 per Space', effect: 'Compensates 1G per application and reduces collision force by 1 per damage die.', requirement: 'Requires grav drives or lifters.', powered: true, modeled: 'Partial' },
      { id: 'life-support-short', familyId: 'life-support-gravity', name: 'Short Term Life Support', techLevel: 4, spaces: 1, spacesLabel: '1 per 20 people, minimum 1', cost: 'Cr10000 per Space', effect: 'Supports occupants for 4 days.', requirement: 'Requires hostile environment protection to be effective.', powered: true, modeled: 'Partial' },
      { id: 'life-support-long', familyId: 'life-support-gravity', name: 'Long Term Life Support', techLevel: 6, spaces: 1, spacesLabel: '1 per 5 people, minimum 1', cost: 'Cr50000 per Space', effect: 'Supports occupants for 90 days.', requirement: 'Requires hostile environment protection to be effective.', powered: true, modeled: 'Partial' },
      { id: 'life-support-closed', familyId: 'life-support-gravity', name: 'Closed Cycle Life Support', techLevel: 8, spaces: 1, spacesLabel: '1 per 5 people, minimum 1', cost: 'Cr100000 per Space', effect: 'Indefinite support with routine maintenance.', requirement: 'Requires hostile environment protection to be effective.', powered: true, modeled: 'Partial' },
      { id: 'life-support-seat', familyId: 'life-support-gravity', name: 'Life Support Seat', techLevel: 6, spaces: 0, spacesLabel: '0', cost: 'Cr5000', effect: 'Short term life support for one seated person.', powered: true, modeled: 'Reference' },
    ],
  },
  {
    id: 'creature-comforts',
    category: 'Internal Options',
    name: 'Creature Comforts',
    description: 'Habitation, passenger comfort, recreation, medical stasis, and interior quality options.',
    rules: [
      { id: 'autodoc-basic', familyId: 'creature-comforts', name: 'Basic Autodoc', techLevel: 13, spaces: 2, spacesLabel: '2', cost: 'Cr100000', effect: 'Diagnosis, drug delivery, surgery; Medic 3.', powered: true, modeled: 'Modeled' },
      { id: 'autodoc-improved', familyId: 'creature-comforts', name: 'Improved Autodoc', techLevel: 14, spaces: 2, spacesLabel: '2', cost: 'MCr1', effect: 'Reanimation, low berth, bioreactor; Medic 3.', powered: true, modeled: 'Modeled' },
      { id: 'autodoc-advanced', familyId: 'creature-comforts', name: 'Advanced Autodoc', techLevel: 15, spaces: 2, spacesLabel: '2', cost: 'MCr3', effect: 'Advanced sensors, science toolkit; Medic 4.', powered: true, modeled: 'Modeled' },
      { id: 'bunk', familyId: 'creature-comforts', name: 'Bunk', techLevel: 0, spaces: 1, spacesLabel: '1 per two persons', cost: 'Cr200 per Space', effect: 'Sleeping berth for two persons and storage; CP 1.', modeled: 'Modeled' },
      { id: 'common-area', familyId: 'creature-comforts', name: 'Common Area', techLevel: 0, spaces: 1, spacesLabel: '1', cost: 'Cr100 per Space', effect: 'Open shared space; CP 1.', modeled: 'Modeled' },
      { id: 'cryoberth-basic', familyId: 'creature-comforts', name: 'Basic Cryoberth', techLevel: 10, spaces: 1, spacesLabel: '1', cost: 'Cr50000', effect: 'Freezes injured patient within seconds.', powered: true, modeled: 'Modeled' },
      { id: 'cryoberth-improved', familyId: 'creature-comforts', name: 'Improved Cryoberth', techLevel: 12, spaces: 1, spacesLabel: '1', cost: 'Cr50000', effect: 'DM+1 to survival checks.', powered: true, modeled: 'Modeled' },
      { id: 'entertainment-system', familyId: 'creature-comforts', name: 'Entertainment System', techLevel: 5, spaces: 0, spacesLabel: '0', cost: 'Cr200+', effect: 'CP 0.1 baseline; more expensive systems can add comfort.', powered: true, modeled: 'Reference' },
      { id: 'fresher-half', familyId: 'creature-comforts', name: 'Half Fresher', techLevel: 4, spaces: 1, spacesLabel: '1', cost: 'Cr500 per Space', effect: 'Toilet and sink; CP 1.', modeled: 'Modeled' },
      { id: 'fresher-standard', familyId: 'creature-comforts', name: 'Standard Fresher', techLevel: 5, spaces: 2, spacesLabel: '2', cost: 'Cr750 per Space', effect: 'Toilet, sink, and shower; CP 2.', modeled: 'Modeled' },
      { id: 'fresher-full', familyId: 'creature-comforts', name: 'Full Fresher', techLevel: 5, spaces: 4, spacesLabel: '4', cost: 'Cr1500 per Space', effect: 'Full washroom; CP 8.', modeled: 'Modeled' },
      { id: 'galley-mini', familyId: 'creature-comforts', name: 'Mini Galley', techLevel: 2, spaces: 1, spacesLabel: '1', cost: 'Cr250 per Space', effect: 'Basic fare for up to 4 at a time; CP 1.', modeled: 'Modeled' },
      { id: 'galley-full', familyId: 'creature-comforts', name: 'Full Galley', techLevel: 2, spaces: 5, spacesLabel: '5', cost: 'Cr500 per Space', effect: 'Full meals for up to 10 at a time; CP 5.', modeled: 'Modeled' },
      { id: 'galley-gourmet', familyId: 'creature-comforts', name: 'Gourmet Galley', techLevel: 3, spaces: 5, spacesLabel: '5', cost: 'Cr2000 per Space', effect: 'Gourmet meals for up to 4 at a time; CP 10.', modeled: 'Modeled' },
      { id: 'holographic-projector-basic', familyId: 'creature-comforts', name: 'Basic Holographic Projector', techLevel: 9, spaces: 1, spacesLabel: 'At least 1', cost: 'Cr100000 per Space', effect: 'Translucent moving holograph; Recon DM -1 if used externally.', powered: true, modeled: 'Reference' },
      { id: 'low-berth-basic', familyId: 'creature-comforts', name: 'Basic Low Berth', techLevel: 10, spaces: 2, spacesLabel: '2', cost: 'Cr50000', effect: 'Freezes injured patient within 1D minutes.', powered: true, modeled: 'Modeled' },
      { id: 'low-berth-improved', familyId: 'creature-comforts', name: 'Improved Low Berth', techLevel: 12, spaces: 2, spacesLabel: '2', cost: 'Cr50000', effect: 'DM+1 to survival checks.', powered: true, modeled: 'Modeled' },
      { id: 'luxury-interior-basic', familyId: 'creature-comforts', name: 'Basic Luxury Interior', techLevel: 2, spaces: 0, spacesLabel: 'Uses assigned interior Spaces', cost: 'Cr1000 per Space', effect: 'Expensive furnishings; CP 2.', modeled: 'Reference' },
      { id: 'luxury-interior-improved', familyId: 'creature-comforts', name: 'Improved Luxury Interior', techLevel: 6, spaces: 0, spacesLabel: 'Uses assigned interior Spaces', cost: 'Cr3000 per Space', effect: 'Entertainment systems and plumbing; CP 3.', powered: true, modeled: 'Reference' },
      { id: 'sleeping-berth', familyId: 'creature-comforts', name: 'Sleeping Berth', techLevel: 1, spaces: 1, spacesLabel: '1 per person', cost: 'Cr500 per Space', effect: 'Sleeping berth and storage for one person; CP 1.', modeled: 'Modeled' },
      { id: 'stateroom-basic', familyId: 'creature-comforts', name: 'Basic Stateroom', techLevel: 1, spaces: 4, spacesLabel: '4', cost: 'Cr2000 per Space', effect: 'Minimal private accommodations for one person; CP 1 per Space.', modeled: 'Modeled' },
      { id: 'stateroom-enhanced', familyId: 'creature-comforts', name: 'Enhanced Stateroom', techLevel: 2, spaces: 12, spacesLabel: '12', cost: 'Cr5000 per Space', effect: 'Standard accommodation with standard fresher; CP 1 per Space.', modeled: 'Modeled' },
      { id: 'stateroom-superior', familyId: 'creature-comforts', name: 'Superior Stateroom', techLevel: 11, spaces: 20, spacesLabel: '20', cost: 'Cr20000 per Space', effect: 'Luxury accommodation with full fresher and mini galley; CP 2 per Space.', powered: true, modeled: 'Modeled' },
    ],
  },
  {
    id: 'internal-utility',
    category: 'Internal Utility',
    name: 'Internal Utility',
    description: 'Mission spaces for security, command, vehicles, science, medicine, workshops, and special compartments.',
    rules: [
      { id: 'armoury', familyId: 'internal-utility', name: 'Armoury', techLevel: 1, spaces: 1, spacesLabel: 'Allocated Spaces', cost: 'Cr10000 per Space', effect: 'Secure weapon and ammunition storage; Protection based on TL armour.', modeled: 'Reference' },
      { id: 'brig-small', familyId: 'internal-utility', name: 'Small Brig', techLevel: 1, spaces: 6, spacesLabel: '6', cost: 'Cr50000', effect: 'Holds up to 4 prisoners.', modeled: 'Modeled' },
      { id: 'brig-standard', familyId: 'internal-utility', name: 'Standard Brig', techLevel: 1, spaces: 16, spacesLabel: '16', cost: 'Cr100000', effect: 'Holds up to 12 prisoners.', modeled: 'Modeled' },
      { id: 'command-centre', familyId: 'internal-utility', name: 'Command Centre', techLevel: 7, spaces: 4, spacesLabel: '4', cost: 'Cr75000', effect: 'Allows command staff to remotely apply Leadership and Tactics.', requirement: 'Requires TL7 comms, sensors, and power.', powered: true, modeled: 'Modeled' },
      { id: 'command-centre-extra-seat', familyId: 'internal-utility', name: 'Command Centre Extra Seat', techLevel: 7, spaces: 1, spacesLabel: '1', cost: '+Cr5000', effect: 'Adds capacity for one additional command centre operator.', powered: true, modeled: 'Modeled' },
      { id: 'docking-bay', familyId: 'internal-utility', name: 'Docking Bay', techLevel: 3, spaces: 0, spacesLabel: '4.4 x carried vehicle shipping tons', cost: 'Cr12500 per Space', effect: 'Sealed compartment enclosing a vehicle dock.', modeled: 'Reference' },
      { id: 'hangar-bay', familyId: 'internal-utility', name: 'Hangar Bay', techLevel: 1, spaces: 0, spacesLabel: '8 x carried vehicle shipping tons', cost: 'Cr10000 per Space', effect: 'Internal vehicle bay with basic maintenance and deployment facilities.', modeled: 'Reference' },
      { id: 'laboratory-primitive', familyId: 'internal-utility', name: 'Primitive Laboratory', techLevel: 3, spaces: 3, spacesLabel: '3', cost: 'Cr3000', effect: 'No penalty for science tasks.', modeled: 'Modeled' },
      { id: 'laboratory-general', familyId: 'internal-utility', name: 'General Laboratory', techLevel: 7, spaces: 2, spacesLabel: '2', cost: 'Cr10000', effect: 'No penalty; access to vehicle equipment.', powered: true, modeled: 'Modeled' },
      { id: 'laboratory-specialised', familyId: 'internal-utility', name: 'Specialised Laboratory', techLevel: 7, spaces: 3, spacesLabel: '3', cost: 'Cr30000', effect: 'Up to DM+3 for the chosen science speciality.', powered: true, modeled: 'Modeled' },
      { id: 'library-primitive', familyId: 'internal-utility', name: 'Primitive Library', techLevel: 1, spaces: 200, spacesLabel: '200', cost: 'Cr500000', effect: 'Research and training support.', modeled: 'Modeled' },
      { id: 'library-advanced', familyId: 'internal-utility', name: 'Advanced Library', techLevel: 8, spaces: 16, spacesLabel: '16', cost: 'MCr4', effect: 'DM+1 on EDU checks for extended training or research.', powered: true, modeled: 'Modeled' },
      { id: 'medical-bed', familyId: 'internal-utility', name: 'Medical Bay Bed', techLevel: 5, spaces: 2, spacesLabel: '2', cost: 'Cr2000', effect: 'Allows recovery and medicine administration; CP 1.', modeled: 'Modeled' },
      { id: 'medical-cabinet', familyId: 'internal-utility', name: 'Medical Bay Cabinet', techLevel: 5, spaces: 2, spacesLabel: '2', cost: 'Cr5000', effect: 'Storage for medikit and medical supplies.', modeled: 'Modeled' },
      { id: 'medical-operating-table', familyId: 'internal-utility', name: 'Medical Bay Operating Table', techLevel: 5, spaces: 8, spacesLabel: '8', cost: 'Cr20000', effect: 'Allows surgery on patients.', modeled: 'Modeled' },
      { id: 'multi-env-enclosure-basic', familyId: 'internal-utility', name: 'Basic Multi-Environment Enclosure', techLevel: 5, spaces: 0, spacesLabel: 'Assigned enclosure Spaces plus equipment', cost: 'Cr100 per enclosure Space; Cr1000 per equipment Space', effect: 'Temperature, humidity, and water environment.', powered: true, modeled: 'Reference' },
      { id: 'self-sealing-fuel-tank', familyId: 'internal-utility', name: 'Self-Sealing Fuel Tank', techLevel: 5, spaces: 0, spacePercent: 0.05, minimumSpaces: 1, spacesLabel: '5% of Spaces, minimum 1', cost: 'Cr500 per Space', effect: 'Reduces Fuel Critical Hit Severity by one.', modeled: 'Partial' },
      { id: 'training-facility', familyId: 'internal-utility', name: 'Training Facility', techLevel: 1, spaces: 8, spacesLabel: '8 per user', cost: 'Cr400000', effect: 'Reduces training time by 10% or grants DM+1 on EDU rolls for learning.', modeled: 'Modeled' },
      { id: 'unrep-system', familyId: 'internal-utility', name: 'UNREP System', techLevel: 5, spaces: 1, spacesLabel: 'Allocated Spaces', cost: 'Cr125000 per Space', effect: 'Each Space transfers 20 Spaces of fuel, cargo, or ordnance per hour.', powered: true, modeled: 'Reference' },
      { id: 'vault', familyId: 'internal-utility', name: 'Vault', techLevel: 3, spaces: 1, spacesLabel: 'Allocated Spaces', cost: 'Cr50000 per Space', effect: 'Collision protection, Formidable lock, and armour.', modeled: 'Reference' },
      { id: 'vault-life-support', familyId: 'internal-utility', name: 'Vault Life Support', techLevel: 7, spaces: 0, spacesLabel: '0 additional', cost: '+Cr20000 per vault Space', effect: 'Short term life support plus vacuum, hostile, and radiation protection.', modeled: 'Reference' },
      { id: 'vault-reinforced', familyId: 'internal-utility', name: 'Reinforced Vault', techLevel: 5, spaces: 0, spacesLabel: '0 additional', cost: '+Cr50000 per vault Space', effect: 'Triple armour protection.', modeled: 'Reference' },
      { id: 'workshop', familyId: 'internal-utility', name: 'Workshop', techLevel: 1, spaces: 12, spacesLabel: '12', cost: 'Cr90000', effect: 'Mechanic tasks in or around the workshop gain DM+2.', modeled: 'Modeled' },
      { id: 'workshop-space', familyId: 'internal-utility', name: 'Workshop Space', techLevel: 1, spaces: 1, spacesLabel: '1', cost: 'Cr1000', effect: 'Additional workshop area for larger fabricators or work zones.', modeled: 'Modeled' },
    ],
  },
  {
    id: 'other-options',
    category: 'Other Options',
    name: 'Other Sources',
    description: 'Guidance for options sourced from other Traveller books or custom campaign material.',
    rules: [
      { id: 'spacecraft-option-conversion', familyId: 'other-options', name: 'Spacecraft Option Conversion', techLevel: 0, spaces: 4, spacesLabel: '1 spacecraft ton = 4 vehicle Spaces', cost: 'Referee adjusted', effect: 'Allows approved spacecraft options to be installed in vehicles using vehicle-scale assumptions.', requirement: 'Power-using spacecraft options require a nuclear power plant.', modeled: 'Reference' },
      { id: 'central-supply-item', familyId: 'other-options', name: 'Central Supply Catalogue Item', techLevel: 0, spaces: 1, spacesLabel: 'Usually 1 Space per 250kg', cost: 'Item cost', effect: 'Install approved non-conflicting equipment from Central Supply Catalogue.', modeled: 'Reference' },
      { id: 'custom-option', familyId: 'other-options', name: 'Custom / Referee Option', techLevel: 0, spaces: 0, spacesLabel: 'Manual', cost: 'Manual', effect: 'Placeholder for campaign-created vehicle options not yet modelled.', modeled: 'Reference' },
    ],
  },
]

const handbookOptionFamilies = computed(() => optionFamilies.filter((family) => family.id !== 'other-options'))
const categoryOptions = computed(() => [...new Set(handbookOptionFamilies.value.map((family) => family.category))])
const selectedCategory = ref(categoryOptions.value[0] ?? '')
const familiesForCategory = computed(() => handbookOptionFamilies.value.filter((family) => family.category === selectedCategory.value))
const selectedFamilyId = ref(familiesForCategory.value[0]?.id ?? '')
const selectedStageId = ref('basic')
const selectedFamily = computed(() => handbookOptionFamilies.value.find((family) => family.id === selectedFamilyId.value) ?? familiesForCategory.value[0] ?? handbookOptionFamilies.value[0] ?? optionFamilies[0])
const availableRules = computed(() => selectedFamily.value.rules)
const selectedRuleId = ref(availableRules.value[0]?.id ?? '')
const selectedRule = computed(() => availableRules.value.find((rule) => rule.id === selectedRuleId.value) ?? availableRules.value[0])
const selectedStage = computed(() => optionStages.find((stage) => stage.id === selectedStageId.value) ?? optionStages[2])
const selectedRuleIsAvailable = computed(() => selectedRule.value ? props.vehicle.techLevel >= selectedRule.value.techLevel : false)

watch(selectedCategory, () => {
  selectedFamilyId.value = familiesForCategory.value[0]?.id ?? ''
})

watch(selectedFamilyId, () => {
  selectedRuleId.value = availableRules.value[0]?.id ?? ''
  selectedStageId.value = 'basic'
})

const optionDisplayName = computed(() => {
  if (!selectedRule.value) return ''
  return selectedFamily.value.usesDevelopmentStages && selectedStage.value.id !== 'basic'
    ? `${selectedStage.value.label} ${selectedRule.value.name}`
    : selectedRule.value.name
})

const optionDescriptionForRule = (rule: VehicleOptionRule, family: VehicleOptionFamily) => {
  if (rule.description) return rule.description

  const name = rule.name.toLowerCase()
  if (family.id === 'control-system') return 'A control interface package that changes how precisely the crew can operate the vehicle, from crude manual controls to advanced assisted control systems.'
  if (family.id === 'transceiver') return 'A powered communications set used to send and receive radio traffic at the listed range, linking the vehicle to crews, bases, and other vehicles.'
  if (family.id === 'autopilot') return 'An automated driving or piloting unit that can hold course and speed, with higher-TL versions capable of handling more complex operation when directed.'
  if (family.id === 'meson-communicator') return 'A specialised communicator that sends tightly directed meson transmissions through intervening matter to a known receiver location.'
  if (family.id === 'transceiver-options') {
    if (name.includes('encryption')) return 'A secure communications module that hardens vehicle messages against interception or decryption by lower-technology systems.'
    if (name.includes('satellite')) return 'A tracking antenna and control package that keeps a moving link to satellites or spacecraft when line of sight is available.'
    if (name.includes('tightbeam')) return 'A narrow laser or maser communication mode for point-to-point messages that are difficult for outsiders to intercept.'
  }
  if (family.id === 'navigation') return 'A navigation suite that helps the crew determine position, heading, route, and nearby surroundings using maps, references, signals, and onboard systems.'
  if (family.id === 'sensors') return 'A vehicle sensor package for detecting objects, terrain, contacts, and conditions beyond what the crew can perceive unaided.'
  if (family.id === 'sensor-customisations') {
    if (name.includes('hardened')) return 'A sensor protection upgrade that helps the installed sensor suite keep functioning through jamming and disruption.'
    if (name.includes('high-fidelity')) return 'A precision sensor upgrade that improves detail and interpretation when making sensor checks.'
    if (name.includes('range')) return 'A range-extension upgrade for an installed sensor suite, increasing how far the sensors can reach.'
    if (name.includes('mast')) return 'A deployable or raised sensor mount that lets the vehicle observe while keeping most of the hull behind cover.'
    if (name.includes('underwater')) return 'A sensor configuration for submerged operation, trading normal above-water assumptions for underwater detection.'
  }
  if (family.id === 'camouflage') return 'A surface treatment or masking system that makes the vehicle harder to spot visually or with higher-tech detection methods.'
  if (family.id === 'stealth-coatings') {
    if (name.includes('holographic')) return 'A full-spectrum hull projection system that disguises or masks the vehicle with active holographic imagery.'
    if (name.includes('reflec')) return 'A reflective anti-laser surface treatment that protects against laser fire but makes the vehicle easier to detect.'
    return 'A signature-reduction coating that makes the vehicle harder to detect with electronic sensors, but cannot be combined with ECM.'
  }
  if (family.id === 'environmental-hull') return 'External hull protection that prepares the vehicle for dangerous atmospheres, pressure, radiation, vacuum, corrosive conditions, or self-sealing damage control.'
  if (family.id === 'connectors') return 'A physical connection system for docking, towing, linking, or transferring between vehicles without treating the vehicles as a single hull.'
  if (family.id === 'manipulators') return 'A powered external arm or appendage that lets the vehicle lift, handle, or manipulate objects without exposing the crew.'
  if (family.id === 'external-utility') return 'An externally mounted work system for cargo handling, cutting, drilling, sampling, excavation, recovery, or field engineering tasks.'
  if (family.id === 'external-vehicle-handling') return 'A vehicle handling system for launch, landing, recovery, parachute descent, or temporary movement support.'
  if (family.id === 'external-prestige-propulsion') return 'An exterior option for appearance, watercraft propulsion, ramming, or refuelling support.'
  if (family.id === 'active-defence-sensors') return 'A defensive sensor or counter-signature system that changes how easily the vehicle can detect threats or be detected by specialised sensors.'
  if (family.id === 'active-defence-systems') {
    if (name.includes('ecm')) return 'An electronic countermeasures suite that disrupts enemy electronics, sensors, and targeting within its operating range.'
    if (name.includes('anti-missile')) return 'An automated defensive weapon intended to intercept incoming missiles or projectiles before they strike the vehicle.'
    if (name.includes('decoy')) return 'A dispenser for false targets that draw smart weapons or guided attacks away from the real vehicle.'
    if (name.includes('screen') || name.includes('damper')) return 'A high-technology defensive field system that reduces or negates specialised forms of damage.'
    if (name.includes('reactive') || name.includes('electrostatic')) return 'A defensive armour system that adds temporary or specialised protection against incoming attacks.'
    if (name.includes('smoke') || name.includes('aerosol')) return 'A disposable defensive cloud system that interferes with attacks or specific weapon types for a short period.'
    return 'An active defensive system that protects the vehicle by intercepting attacks, confusing targeting, or reducing specialised damage.'
  }
  if (family.id === 'internal-environment') return 'An internal protection fitting that preserves safe working conditions, protects occupants, or allows controlled entry and exit.'
  if (family.id === 'life-support-gravity') return 'A survivability or comfort system that manages breathable atmosphere, emergency escape, artificial gravity, acceleration, fire, or long-duration habitation.'
  if (family.id === 'creature-comforts') return 'An interior comfort, habitation, medical, recreation, or passenger-support installation that improves how occupants live or recover inside the vehicle.'
  if (family.id === 'internal-utility') return 'A dedicated mission compartment or utility installation for command, security, science, medicine, storage, maintenance, transport, or cargo transfer.'

  return family.description
}

const selectedRuleDescription = computed(() => selectedRule.value ? optionDescriptionForRule(selectedRule.value, selectedFamily.value) : '')
const parseCreditAmount = (value: string) => {
  const match = value.match(/(-?)\s*(MCr|Cr)\s*([0-9]+(?:\.[0-9]+)?)/i)
  if (!match) return 0
  return (match[1] === '-' ? -1 : 1) * Number(match[3]) * (match[2].toLowerCase() === 'mcr' ? 1000000 : 1)
}

const optionSpaces = computed(() => {
  if (!selectedRule.value) return 0
  if (selectedFamily.value.usesDevelopmentStages && selectedStage.value.id === 'early-prototype') {
    return selectedRule.value.spaces > 0 ? selectedRule.value.spaces * 2 : 2
  }
  if (selectedFamily.value.usesDevelopmentStages && selectedStage.value.id === 'prototype') {
    return selectedRule.value.spaces > 0 ? selectedRule.value.spaces : 1
  }
  if (selectedRule.value.spacePercent) {
    return Math.max(selectedRule.value.minimumSpaces ?? 0, Math.ceil(props.vehicle.spaces * selectedRule.value.spacePercent))
  }
  return selectedRule.value.spaces
})

const selectedOptionCostCredits = computed(() => {
  if (!selectedRule.value) return 0
  const label = selectedRule.value.cost
  const amount = parseCreditAmount(label)
  const spaces = optionSpaces.value
  const stage = selectedFamily.value.usesDevelopmentStages ? selectedStage.value.id : 'basic'
  let baseCost = 0

  if (/%\s*(?:of\s*)?base\s*cost/i.test(label)) {
    const match = label.match(/([+-]?\d+(?:\.\d+)?)\s*%\s*(?:of\s*)?base\s*cost/i)
    baseCost = match ? Math.round((props.vehicle.baseCostCredits ?? props.vehicle.costCredits ?? 0) * (Number(match[1]) / 100)) : 0
  }
  else if (/per\s+(?:vehicle\s+)?space/i.test(label)) {
    baseCost = Math.round(amount * props.vehicle.spaces)
  }
  else if (/per\s+space\s+consumed/i.test(label) || /per\s+consumed\s+space/i.test(label) || /per\s+allocated\s+space/i.test(label)) {
    baseCost = Math.round(amount * spaces)
  }
  else if (/per\s+space/i.test(label)) {
    baseCost = Math.round(amount * (spaces > 0 ? spaces : props.vehicle.spaces))
  }
  else {
    baseCost = Math.round(amount)
  }

  if (stage === 'early-prototype') return Math.round(baseCost * 11)
  if (stage === 'prototype') return Math.round(baseCost * 6)
  if (stage === 'improved') return Math.round(baseCost * 0.5)
  if (stage === 'enhanced') return Math.round(baseCost * 0.25)
  if (stage === 'advanced') return Math.round(baseCost * 0.1)
  if (stage === 'superior') return Math.round(baseCost * 0.05)
  return baseCost
})

const addSelectedOption = () => {
  if (!selectedRule.value || !selectedRuleIsAvailable.value) return
  props.vehicle.equipmentEntries.push({
    name: optionDisplayName.value,
    spaces: optionSpaces.value,
    cost: selectedRule.value.cost,
    costCredits: selectedOptionCostCredits.value,
    techLevel: selectedRule.value.techLevel,
    familyId: selectedRule.value.familyId,
    requirement: selectedRule.value.requirement ?? '',
    restriction: selectedRule.value.restriction ?? '',
    effect: selectedRule.value.effect,
    powered: Boolean(selectedRule.value.powered),
    modeled: selectedRule.value.modeled,
    category: selectedFamily.value.category,
    catalogueId: selectedRule.value.id,
  })
  emit('sync-derivations')
}
</script>

<template>
  <section class="overflow-hidden rounded-md border border-cyan-400/25 bg-slate-950 text-cyan-50">
    <div class="flex min-h-24 flex-wrap items-center justify-between gap-4 border-b border-cyan-400/25 bg-cyan-950/60 px-5 py-4">
      <div>
        <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200/80">Vehicle Design Step 7</p>
        <h3 class="mt-1 text-xl font-black uppercase tracking-wide text-cyan-50">Choose Options</h3>
      </div>
      <div class="flex flex-wrap items-end gap-3">
        <label class="grid gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100">
          <span>Category</span>
          <select v-model="selectedCategory" class="h-10 w-52 rounded-md border border-cyan-400/35 bg-slate-950/90 px-3 text-sm font-normal normal-case tracking-normal text-cyan-50 outline-none focus:border-cyan-200">
            <option v-for="category in categoryOptions" :key="category" :value="category">{{ category }}</option>
          </select>
        </label>
        <label class="grid gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100">
          <span>Option Family</span>
          <select v-model="selectedFamilyId" class="h-10 w-56 rounded-md border border-cyan-400/35 bg-slate-950/90 px-3 text-sm font-normal normal-case tracking-normal text-cyan-50 outline-none focus:border-cyan-200">
            <option v-for="family in familiesForCategory" :key="family.id" :value="family.id">{{ family.name }}</option>
          </select>
        </label>
        <button
          class="h-10 rounded-md border border-cyan-300/40 bg-cyan-300/10 px-4 text-sm font-semibold text-cyan-50 transition hover:border-cyan-200 disabled:cursor-not-allowed disabled:opacity-45"
          :disabled="!selectedRule || !selectedRuleIsAvailable"
          type="button"
          @click="addSelectedOption"
        >
          Add Option
        </button>
      </div>
    </div>

    <div class="grid gap-5 p-5 xl:grid-cols-[25rem_minmax(0,1fr)]">
      <div class="grid min-h-[32rem] overflow-hidden rounded-md border border-cyan-400/30 bg-slate-950/75 bg-[linear-gradient(rgba(34,211,238,0.065)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.065)_1px,transparent_1px)] bg-[size:2rem_2rem] p-5">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">{{ selectedFamily.category }}</p>
          <h4 class="mt-4 text-3xl font-black uppercase leading-none tracking-wide text-cyan-50">{{ selectedFamily.name }}</h4>
          <p class="mt-4 text-sm leading-6 text-cyan-50/80">{{ selectedFamily.description }}</p>
          <p v-if="selectedFamily.rulesNote" class="mt-4 rounded-md border border-cyan-400/20 bg-slate-950/70 p-3 text-sm leading-5 text-cyan-100/80">
            {{ selectedFamily.rulesNote }}
          </p>
        </div>

        <div class="self-end rounded-md border border-cyan-400/20 bg-slate-950/80 p-4">
          <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200/80">Tech Level Stages</p>
          <div class="mt-3 grid gap-px overflow-hidden rounded-md border border-cyan-400/20 text-xs">
            <div v-for="stage in optionStages" :key="stage.id" class="grid grid-cols-[7rem_5.5rem_minmax(0,1fr)]">
              <div class="bg-cyan-400/15 px-2 py-1 font-semibold text-cyan-100">{{ stage.label }}</div>
              <div class="border-l border-cyan-400/20 px-2 py-1 text-cyan-50">{{ stage.tl }}</div>
              <div class="border-l border-cyan-400/20 px-2 py-1 text-cyan-50">{{ stage.cost }}</div>
            </div>
          </div>
          <p class="mt-3 text-xs leading-5 text-cyan-100/70">
            Only computers and transceivers use the full staged progression by default. Other options use prototype stages only when the Referee allows early construction.
          </p>
        </div>
      </div>

      <div class="grid content-start gap-4">
        <div class="flex flex-wrap items-end gap-3">
          <label class="grid min-w-64 flex-1 gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100">
            <span>Option</span>
            <select v-model="selectedRuleId" class="h-10 rounded-md border border-cyan-400/35 bg-slate-950/90 px-3 text-sm font-normal normal-case tracking-normal text-cyan-50 outline-none focus:border-cyan-200">
              <option v-for="rule in availableRules" :key="rule.id" :value="rule.id" :disabled="vehicle.techLevel < rule.techLevel">
                {{ rule.name }} (TL {{ rule.techLevel }})
              </option>
            </select>
          </label>
          <label v-if="selectedFamily.usesDevelopmentStages" class="grid w-52 gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100">
            <span>Tech Stage</span>
            <select v-model="selectedStageId" class="h-10 rounded-md border border-cyan-400/35 bg-slate-950/90 px-3 text-sm font-normal normal-case tracking-normal text-cyan-50 outline-none focus:border-cyan-200">
              <option v-for="stage in optionStages" :key="stage.id" :value="stage.id">{{ stage.label }}</option>
            </select>
          </label>
        </div>

        <section v-if="selectedRule" class="rounded-md border border-cyan-400/30 bg-slate-950/70 p-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200/80">{{ selectedRule.modeled }}</p>
              <h4 class="mt-1 text-2xl font-black uppercase tracking-wide text-cyan-50">{{ optionDisplayName }}</h4>
            </div>
            <span
              class="rounded-md border px-2 py-1 text-xs font-semibold"
              :class="selectedRuleIsAvailable ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100' : 'border-amber-300/30 bg-amber-300/10 text-amber-100'"
            >
              {{ selectedRuleIsAvailable ? 'Available' : `Requires TL ${selectedRule.techLevel}` }}
            </span>
          </div>
          <p class="mt-4 rounded-md border border-cyan-400/20 bg-slate-950/60 p-3 text-sm leading-6 text-cyan-50/85">
            {{ selectedRuleDescription }}
          </p>

          <div class="mt-4 grid gap-px overflow-hidden rounded-md border border-cyan-400/20 text-sm">
            <div class="grid grid-cols-[9.5rem_minmax(0,1fr)]">
              <div class="bg-cyan-400/20 px-2 py-2 font-black uppercase tracking-wide text-cyan-100">Tech Level</div>
              <div class="border-b border-cyan-400/20 px-2 py-2 text-cyan-50">{{ selectedRule.techLevel }}</div>
            </div>
            <div class="grid grid-cols-[9.5rem_minmax(0,1fr)]">
              <div class="bg-cyan-400/20 px-2 py-2 font-black uppercase tracking-wide text-cyan-100">Spaces</div>
              <div class="border-b border-cyan-400/20 px-2 py-2 text-cyan-50">{{ selectedRule.spacesLabel }}<template v-if="optionSpaces !== selectedRule.spaces">; staged install uses {{ optionSpaces }}</template></div>
            </div>
            <div class="grid grid-cols-[9.5rem_minmax(0,1fr)]">
              <div class="bg-cyan-400/20 px-2 py-2 font-black uppercase tracking-wide text-cyan-100">Cost</div>
              <div class="border-b border-cyan-400/20 px-2 py-2 text-cyan-50">{{ selectedRule.cost }}<template v-if="selectedFamily.usesDevelopmentStages && selectedStage.id !== 'basic'">; {{ selectedStage.cost }}</template></div>
            </div>
            <div v-if="selectedRule.powered" class="grid grid-cols-[9.5rem_minmax(0,1fr)]">
              <div class="bg-cyan-400/20 px-2 py-2 font-black uppercase tracking-wide text-cyan-100">Power</div>
              <div class="border-b border-cyan-400/20 px-2 py-2 text-cyan-50">Requires a powered vehicle.</div>
            </div>
            <div class="grid grid-cols-[9.5rem_minmax(0,1fr)]">
              <div class="bg-cyan-400/20 px-2 py-2 font-black uppercase tracking-wide text-cyan-100">Effect</div>
              <div class="border-b border-cyan-400/20 px-2 py-2 text-cyan-50">{{ selectedRule.effect }}</div>
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

          <p v-if="selectedFamily.usesDevelopmentStages && selectedStage.id !== 'basic'" class="mt-4 rounded-md border border-amber-300/25 bg-amber-300/10 p-3 text-sm leading-5 text-amber-100">
            {{ selectedStage.note }}
          </p>
        </section>
      </div>
    </div>
  </section>
</template>
