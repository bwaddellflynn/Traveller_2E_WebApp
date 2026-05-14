# Scout Suite Phase 3: Vehicle Builder Analysis

Phase 3 focus: make the Garage Vehicle Builder a guided, on-rails vehicle creation workflow that captures as many Vehicle Handbook mechanics as is feasible while keeping unsupported edge cases explicit.

Raw local source extraction:

- PDF: `MgT 2E Core/The Vehicle Handbook.pdf`
- Extracted text: `/tmp/traveller-vehicle-handbook.txt`
- Metadata observed during extraction: 194 pages, text extracted with `pdftotext -layout`

The raw extracted handbook text is intentionally not committed to the repository.

## Handbook Flow

The handbook presents vehicle design as a 13-step process:

1. Define purpose.
2. Determine Tech Level.
3. Pick vehicle type.
4. Pick size in Spaces.
5. Choose features.
6. Choose customisations.
7. Armour and structural reinforcement.
8. Choose options.
9. Choose automation.
10. Choose weapons.
11. Allocate occupant Spaces.
12. Allocate cargo Space.
13. Finalize and record the vehicle.

The current builder compresses this into seven tabs in [pages/vehicles/index.vue](/mnt/c/Users/bwadd/Projects/Traveller_2E_WebApp/pages/vehicles/index.vue:90):

- Chassis
- Features
- Customisation
- Protection
- Options
- Weapons
- Review

That compression is the main UX problem. It makes the workflow look simpler than it is, but it also hides when decisions are provisional, when the user is making a trade-off, and which downstream values are being changed by a choice.

## Current State

What is already working or partially working:

- Type, TL, Spaces, size band, hit DM, baseline speed/range, baseline skill, shipping, hull/structure, and cost are derived in [utils/traveller/vehicles.ts](/mnt/c/Users/bwadd/Projects/Traveller_2E_WebApp/utils/traveller/vehicles.ts:1685).
- The builder has structured family/type rules, primary power rules, auxiliary drive rules, armour rules, feature rule text, and stock vehicle weapon loading.
- Features are grouped and show explanatory/mechanical effects in [VehicleBuilderFeaturesStep.vue](/mnt/c/Users/bwadd/Projects/Traveller_2E_WebApp/components/vehicles/VehicleBuilderFeaturesStep.vue:1).
- Protection has a useful dedicated armour allocation UI in [VehicleBuilderProtectionStep.vue](/mnt/c/Users/bwadd/Projects/Traveller_2E_WebApp/components/vehicles/VehicleBuilderProtectionStep.vue:1).
- Saved custom vehicles are persisted through the Garage store.

Where the builder has drifted:

- Purpose and budget are missing as first-class inputs, so the user has no design brief to compare trade-offs against.
- Tech Level, vehicle type, and Spaces are bundled into Chassis, but these are distinct handbook decisions with different downstream consequences.
- Options, automation, occupant allocation, and cargo are merged into one tab in [VehicleBuilderPayloadStep.vue](/mnt/c/Users/bwadd/Projects/Traveller_2E_WebApp/components/vehicles/VehicleBuilderPayloadStep.vue:20).
- Core options are currently quick-add names with zero Spaces by default in [VehicleBuilderCoreOptionsPanel.vue](/mnt/c/Users/bwadd/Projects/Traveller_2E_WebApp/components/vehicles/VehicleBuilderCoreOptionsPanel.vue:31).
- Occupants and cargo are text fields, not allocated Space records, so the builder cannot validate cramped crew/passenger trade-offs or cargo consumption.
- `featureAllocatedSpaces` is hard-coded to zero in [utils/traveller/vehicles.ts](/mnt/c/Users/bwadd/Projects/Traveller_2E_WebApp/utils/traveller/vehicles.ts:1622), so feature/system space accounting is incomplete.
- Review validation has to compensate for missing structure instead of guiding the user earlier in the flow.

## Priority Fixes

### 1. Reframe The Builder Around The Handbook Sequence

- Split Chassis into guided substeps or a left-hand checklist: Purpose, Tech Level, Type, Spaces.
- Keep the UI concise, but make the current handbook step visible at all times.
- Add a persistent build brief panel: role, operating environment, target budget, required crew/passengers, expected cargo, threat level, and notes.
- Make derived consequences visible immediately after each choice: available Spaces, speed/range, Hull/Structure, cost delta, and blocked/required future choices.

### 2. Make Spaces The Central Accounting Model

- Replace free-text crew/passenger/cargo with structured allocations.
- Track occupant entries with count, role, Spaces each, comfort impact, and whether they are crew or passengers.
- Track cargo as allocated Spaces plus display mass/tons.
- Move all installed systems into one normalized allocation model: source type, name, category, Spaces, cost, TL, and derived effects.
- Keep manual override fields, but mark them as overrides rather than first-class rules data.

### 3. Convert Options And Automation From Names To Rules

- Give core options structured rules for TL availability, Spaces, cost, and mechanical effect.
- Separate handbook Step 8 Options from Step 9 Automation in the UI, even if they share the same underlying allocation table.
- Encode automation effects for control systems, autopilot, computers, drones, robot/vehicle brains, and crew reduction where feasible.
- Keep unsupported options selectable only as manual entries with an explicit "not fully modeled" status.

### 4. Tighten Feature Mechanics

- Audit every feature against the extracted handbook text.
- For each feature, classify support as `modeled`, `partially modeled`, or `reference only`.
- Encode feature costs, prerequisites, incompatibilities, granted traits, Space effects, Hull effects, armour-limit effects, speed/agility effects, and operating skill changes.
- Show blocked features as disabled with a reason instead of allowing selection and silently filtering them out.

### 5. Make Customisation Trade-Offs Explicit

- Separate primary power, secondary power, auxiliary drives, speed tuning, range tuning, and fuel capacity into distinct cards.
- Show exact cost and Space deltas before applying a change.
- Add validation for power plant minimum Spaces, secondary power behavior, fuel capacity limits, and power plant compatibility.
- Treat "standard power" as a real baseline rule with clear available-Space assumptions.

### 6. Complete Armour And Structural Reinforcement

- Keep the current armour allocation UI, but connect it more directly to the step sequence.
- Model structural reinforcement as part of Step 7, not only as a Chassis hull class field.
- Validate manual armour redistribution pool before save.
- Include AFV and size-band armour limit effects in the purchase cap explanation.

### 7. Rebuild Weapons As Weapon Systems

- Replace plain weapon entries with weapon-system entries: mount, facing, weapon, quantity, fire control, crew, loader/autoloader, ammunition storage, mount Spaces, cost, and traits.
- Support hardpoints separately from mounted systems because they can behave differently for Spaces and stealth.
- Keep stock weapon import, but import into the weapon-system model rather than a flat weapon row.

### 8. Improve Validation And Review

- Validation should be step-local first, then summarized at Review.
- Review should read like the handbook display sheet: type, TL, skill, speed/range, hull/structure, protection by face, installed equipment, weapons, crew/passenger/cargo, cost, traits, and notes.
- Fix any stale step-label mappings in review jump links when the step list changes.

## Suggested Implementation Order

1. Create a `VehicleBuildStepId` model matching the handbook sequence and map current tabs/substeps to it.
2. Add a `buildBrief` object to `CustomVehicleDesign`.
3. Introduce a normalized `VehicleAllocationEntry` for occupants, cargo, equipment, automation, options, and weapon systems.
4. Move option and feature rule data out of ad hoc UI code into structured utility data.
5. Refactor the UI into guided handbook steps while reusing existing cards where possible.
6. Add validation per step and update Review to use the same step metadata.
7. Run sample builds from Appendix I against the app and document mismatches.

## Immediate TODOs

- [ ] Decide whether the UI should expose 13 top-level steps or keep 7 top-level tabs with 13 visible substeps.
- [ ] Add Purpose/Budget/Requirements as the first guided step.
- [ ] Replace crew/passenger/cargo text fields with structured Space allocation.
- [ ] Split Options and Automation.
- [ ] Convert core options from zero-Space quick-adds into structured rule records.
- [ ] Add feature support-status audit.
- [ ] Model weapon systems instead of flat mounted weapon rows.
- [ ] Fix review jump labels to use shared builder step metadata.
- [ ] Use the Heavy Landing Craft Appendix I example as the first regression scenario.
