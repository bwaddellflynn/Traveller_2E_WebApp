# Scout Suite Phase 4: High Guard Extraction

Phase 4 focus: build the Shipyard spacecraft builder using `MgT 2E Core/High Guard.pdf` as the primary source.

Phase 4 is explicitly for spacecraft of 100 tons or more. Small craft are deferred to Phase 5.

Raw local source extraction:

- PDF: `MgT 2E Core/High Guard.pdf`
- Extracted text: `/tmp/traveller-high-guard.txt`
- Extraction command: `pdftotext -layout "MgT 2E Core/High Guard.pdf" /tmp/traveller-high-guard.txt`
- Metadata observed with `pdfinfo`: 289 pages, 94,032,997 bytes, PDF 1.6, not encrypted, no forms, created with Adobe InDesign 17.3.
- Extracted text size: 16,904 lines, 1,160,000 bytes.

The raw extracted handbook text is intentionally not committed to the repository.

## High Guard Structure

The book has these app-relevant chapters:

| Chapter | PDF page | Shipyard relevance |
| --- | ---: | --- |
| Introduction | 3 | Ship definitions and naval categories. |
| Ship's Design | 8 | Core custom ship builder workflow. |
| Weapons and Screens | 27 | Hardpoints, firmpoints, turrets, barbettes, bays, spinal mounts, missiles, torpedoes, point defence, and screens. |
| Spacecraft Options | 43 | Optional systems, structure options, power options, drives, fuel, accommodations, cargo, hangars, launch/recovery systems, medical, training, workshops, and mission systems. |
| Space Stations | 64 | Variant construction path for stations. |
| Customising Ships | 70 | Tech level alteration, advantages/disadvantages, and refit rules. |
| The Ship's Computer | 73 | Advanced software, bandwidth planning, virtual crew/gunner, battle network, and combat support software. |
| Sensors | 76 | Detection model and sensor-state modifiers. |
| Exotic Technology | 79 | Optional higher-tech drives, weapons, screens, and psionic systems. |
| Crew Roles | 85 | Operational explanation for crew roles beyond count formulas. |
| Creating Deck Plans | 100 | Layout/deck plan guidance. |
| Fighters | 102 | Fighter squadron modeling and carrier operations. |
| Fleet Battles | 105 | Fleet-level abstractions. |
| Boarding Actions | 125 | Boarding flow and ship interior combat context. |
| Spaceships of the Third Imperium | 135 | Stock ship catalogue and standard design records. |

## Ship Design Sequence

High Guard presents a 13-step design sequence:

1. Create a hull: choose tonnage, hull configuration, armour, and hull options.
2. Install drives: manoeuvre or reaction drive, plus jump drive when needed.
3. Install fuel tanks: manoeuvre/reaction, jump, and power plant fuel.
4. Install power plant: size power production against basic systems, drives, weapons, sensors, and optional systems.
5. Install bridge: bridge, smaller bridge, command bridge, or cockpit.
6. Install computer: computer or computer core, plus options such as `/bis` and `/fib`.
7. Install sensors: basic through advanced arrays.
8. Install weapons: hardpoint/firmpoint accounting and weapon systems.
9. Install optional systems: spacecraft options chapter.
10. Determine crew: commercial or military requirements, with large-ship reductions.
11. Install staterooms: staterooms, double occupancy, low berths, emergency low berths, and common areas.
12. Allocate cargo space: remaining tonnage becomes cargo.
13. Finalise design: validate tonnage/cost, calculate maintenance, life support, airlocks, cargo hatches, and final record.

This maps well to the existing Garage builder pattern: a guided step list with persistent tonnage, cost, power, crew, and validation summaries.

## Core Builder Data To Extract

### Hulls

Required rule data:

- Base hull cost: Cr50,000 per ton.
- Hull points: normally 1 per 2.5 tons, with massive-ship exceptions at 25,000+ tons and 100,000+ tons.
- Minimum hull size: 5 tons.
- Jump-capable minimum hull size: 100 tons.
- Hull configurations: Standard, Streamlined, Sphere, Close Structure, Dispersed Structure, Planetoid, Buffered Planetoid.
- Configuration fields: atmospheric capability, armour volume modifier, Hull point modifier, and hull cost modifier.
- Specialised hull types: Reinforced, Light, Military, Non-Gravity.
- Additional hull types: Double Hull, Hamster Cage, Breakaway Hull.
- Armour types: Titanium Steel, Crystaliron, Bonded Superdense, Molecular Bonded.
- Armour sizing: armour tonnage percentage by armour type, modified by small-hull armour multipliers and configuration modifiers.
- Hull options: Heat Shielding, Radiation Shielding, Reflec, Solar Coating, Stealth.

### Drives, Power, And Fuel

Required rule data:

- Manoeuvre drive ratings 0-11, with hull percentage and minimum TL.
- Reaction drive ratings 0-16, with hull percentage and minimum TL.
- Jump drive ratings 1-9, with hull percentage plus 5 tons, minimum 10 tons, minimum TL, and MCr1.5 per ton.
- Manoeuvre drive cost: MCr2 per ton.
- Reaction drive cost: MCr0.2 per ton.
- Power plants: Fission TL6, Chemical TL7, Fusion TL8, Fusion TL12, Fusion TL15, Antimatter TL20.
- Power requirements: basic ship systems, manoeuvre drive, jump drive, weapons, sensors, screens, and optional systems.
- Fuel requirements: reaction drive fuel by Thrust/hour, jump fuel by hull tonnage and jump rating, chemical plant fuel, and other plant fuel.

### Bridge, Computer, Sensors

Required rule data:

- Bridge sizes by ship tonnage, bridge cost by hull size, smaller-bridge penalty, command bridge requirements/benefits.
- Cockpit and dual cockpit for ships of 50 tons or less.
- Ship computers `Computer/5` through `Computer/35`.
- Computer cores `Core/40` through `Core/100`.
- Computer options: Jump Control Specialisation `/bis`, Hardened Systems `/fib`.
- Sensors: Basic, Civilian Grade, Military Grade, Improved, Advanced with TL, suite, DM, Power, tons, and cost.

### Weapons And Screens

Required rule data:

- Hardpoint count: one per 100 tons.
- Firmpoints for ships below 100 tons: one below 35 tons, two at 35-69 tons, three at 70-99 tons.
- Firmpoint restrictions: fixed mount behavior, range limits, power reduction, barbette consumption, one possible single-turret upgrade.
- Weapon mount classes: fixed mounts, single/double/triple turrets, pop-up mounts, barbettes, small/medium/large bays, spinal mounts.
- Weapon catalogues: turret weapons, barbette weapons, bay weapons, spinal weapons, missiles, torpedoes, point-defence batteries, and smaller weapons.
- Screens: meson screen, nuclear damper, black globe generator, plus higher-tech screens from Exotic Technology if supported.
- Large-ship critical-hit exceptions should be recorded but can be later-phase combat support rather than initial builder scope.

### Options, Crew, Accommodations, Cargo

Required rule data:

- Spacecraft options need category data for structure, power, drives, fuel, bridge/accommodations/cargo, internal systems, external systems, carried craft, medical, training, utility, and security.
- Crew formulas need separate commercial and military modes.
- Large-ship crew reduction applies above 5,000 tons to engineer, maintenance, gunner, administrator, and sensor operator roles.
- Staterooms consume 4 tons and cost MCr0.5.
- Low berths consume 0.5 tons and cost Cr50,000.
- Emergency low berths consume 1 ton, cost MCr1, and require Power.
- Common areas are suggested at around 25% of stateroom tonnage and cost MCr0.1 per ton.
- Remaining unallocated tonnage becomes cargo.
- Maintenance cost is total purchase cost divided by 12,000 per month.

### Customisation And Refit Rules

Required rule data:

- Component TL alterations: Early Prototype, Prototype, Budget, Advanced, Very Advanced, High Technology.
- Advantage/disadvantage categories for jump drives, manoeuvre drives, reaction drives, power plants, weapons, and screens.
- Refit classes: major refit and minor refit, with starport class requirements, cost multipliers, and time multipliers.

## Stock Ship Catalogue

High Guard includes a large stock ship chapter beginning on page 135. The current app has only one High Guard seed (`Fleet Courier`), so Phase 4 needs a broader ship data model before populating all rows.

The stock catalogue should include at least:

| Ship | Page |
| --- | ---: |
| Ultralight Fighter | 136 |
| Light Fighter | 137 |
| Military Gig | 138 |
| Ship's Boat | 140 |
| Slow Boat | 141 |
| Pinnace | 142 |
| Slow Pinnace | 143 |
| Modular Cutter | 144 |
| Cutter Modules | 145 |
| Troop Transport | 150 |
| Torpedo Boat | 152 |
| Shuttle | 154 |
| Passenger Shuttle | 156 |
| Express Boat | 158 |
| Scout/Courier | 160 |
| Seeker Mining Ship | 162 |
| Prospecting Buggy | 164 |
| Scout, Serpent class | 165 |
| Far Trader, Empress Marava class | 167 |
| Far Trader, Hero class | 169 |
| Free Trader | 171 |
| Safari Ship | 173 |
| System Defence Boat | 175 |
| Yacht | 179 |
| Jump Shuttle | 177 |
| Close Escort, Gazelle class | 181 |
| Fleet Courier | 183 |
| Laboratory Ship | 185 |
| Patrol Corvette | 187 |
| Subsidised Merchant | 189 |
| Survey Scout, Donosev class | 191 |
| System Defence Boat, Dragon class | 193 |
| Corsair | 195 |
| Subsidised Liner | 199 |
| Mercenary Cruiser | 201 |
| X-Boat Tender | 204 |
| Destroyer Escort, Chrysanthemum class | 206 |
| Destroyer Escort, Fer-de-Lance class | 211 |
| Colonial Cruiser, Kinunir class | 215 |
| Merchant Cruiser, Leviathan class | 217 |
| Cargo Carrier, Mk Mora class | 222 |
| Destroyer, Midu Agashaam class | 227 |
| Fleet Escort, P. F. Sloan class | 231 |
| Light Carrier, Skimkish class | 235 |
| Light Cruiser, Valiant class | 238 |
| Armoured Cruiser, Ghalalk class | 242 |
| Planetoid Monitor | 247 |
| Strike Cruiser, Arakoine class | 251 |
| Battle Rider, Hadrian class | 254 |
| Frontier Cruiser, Azhanti High-Lightning class | 259 |
| Heavy Cruiser, Atlantic class | 265 |
| Strike Carrier, Wind class | 269 |
| Fleet Carrier, Antiama class | 273 |
| Freighter, Galika Megula class | 277 |
| Dreadnought, Kokirrak class | 280 |
| Dreadnought, Plankwell class | 284 |
| Dreadnought, Tigress class | 288 |

Each stock ship entry in the PDF usually includes:

- TL.
- Component table with tons and cost.
- Crew list.
- Hull points.
- Running costs.
- Purchase cost.
- Power requirements.
- Software.
- Weapons, carried craft, cargo, and notes.
- Deck plan legend and numbered rooms where included.

The current [types/ship.ts](/mnt/c/Users/bwadd/Projects/Traveller_2E_WebApp/types/ship.ts:1) model is too small for this source. It can display a summary card, but it cannot preserve the component table, power accounting, crew roles, running costs, carried craft, deck plan metadata, or weapon/system breakdowns needed for a serious stock ship reference or builder regression dataset.

## Phase 4 Scope

Phase 4 should deliver a rules-first Shipyard builder for High Guard spacecraft:

- Stock spacecraft display.
- User-created spacecraft designs.
- High Guard 13-step ship design flow.
- Component ledger with tons, cost, Power, fuel, crew, software bandwidth, hardpoints, and cargo.
- Save/load custom spacecraft.
- Review datasheet.
- Data model foundation for a later visual grid/deck layout editor.

Phase 4 should not include:

- Small craft below 100 tons.
- Small craft firmpoints.
- Cockpits as the primary control model.
- Cutter modules.
- Fighters, ship's boats, pinnaces, shuttles, gigs, torpedo boats, or small craft catalogue records.
- Carrier support for carried small craft beyond placeholder/reference fields.

## Phase 5 Deferral

Phase 5 should handle the small craft layer:

- Small craft under 100 tons.
- Cockpits and dual cockpits as primary control spaces.
- Firmpoints and small-craft weapon restrictions.
- Fighters and fighter squadron support.
- Cutter modules.
- Ship's boat, pinnace, shuttle, military gig, torpedo boat, and related stock craft.
- Deeper carried-craft and carrier workflows.
- Expansion of the visual grid/deck editor if we decide to pair it with small craft.

## Suggested Phase 4 Direction

1. Expand `TravellerShipRecord` into a summary-plus-components model instead of flattening ships into `jump`, `thrust`, `crew`, and `cost` strings.
2. Populate stock ship summaries first, then add component tables for a smaller pilot set: Scout/Courier, Free Trader, Far Trader, Yacht, System Defence Boat, and Fleet Courier.
3. Rebuild Shipyard as three views: `Stock Ships`, `Custom Ships`, and an integrated visual `Ship Builder`.
4. Model the builder around the 13-step High Guard sequence, with live tonnage, cost, power, crew, hardpoint, and fuel accounting.
5. Treat capital ships as supported by the data model, but start the custom builder UX around adventure-class spacecraft of 100 tons or more.
6. Keep higher-tech/exotic systems selectable only as reference/manual entries until the core High Guard systems validate correctly.
7. Use PDF stock designs as regression scenarios once the builder can reproduce component totals.
8. Make bookkeeping authoritative and use the visual deck plan as a reconciliation layer: placeable components must match required tons, while abstract/distributed systems remain ledger-only unless explicitly represented.

## Phase 4 TODO

### 1. Define Ship Data Model

- [x] Expand `TravellerShipRecord` beyond summary fields.
- [x] Add component entries for hull, drives, fuel, power, bridge, computer, sensors, weapons, screens, options, crew, accommodations, cargo, software, carried craft placeholders, and notes.
- [x] Add cost structures for total cost, purchase cost, standard-design discount, monthly maintenance, and life support notes.
- [x] Add derived fields for Hull points, tons used, tons remaining, Power generated, Power required, hardpoints, bandwidth, crew, and cargo.

### 2. Create Custom Ship Design Type

- [x] Add a `CustomShipDesign` type for user-built spacecraft.
- [x] Include build brief fields: name, role, standard/new design, shipyard TL, commercial/military mode, target budget, intended tonnage, jump target, thrust target, crew/passenger/cargo goals, and notes.
- [x] Include builder selections for hull, drives, fuel, power plant, bridge, computer, sensors, weapons/screens, options, crew, accommodations, and cargo.
- [x] Include a layout placeholder for future visual deck/grid work.

### 3. Add High Guard Rule Tables

- [x] Add rule tables in `utils/traveller/shipBuilder.ts`, or split them from `utils/traveller/ships.ts` into a dedicated module.
- [x] Add hull configuration, hull armour, specialised hull, additional hull, and hull option rules.
- [x] Add manoeuvre drive, reaction drive, jump drive, power plant, fuel, bridge, computer/core, sensor, stateroom, low berth, crew, and hardpoint rules.
- [x] Keep small craft-only rules out of Phase 4 except where they are needed as placeholders for later compatibility.

### 4. Build Derived Accounting Engine

- [x] Calculate hull cost and Hull points.
- [x] Calculate drive tons/cost and thrust/jump outputs.
- [x] Calculate jump fuel, reaction fuel if supported, and power plant fuel endurance.
- [x] Calculate power plant output and Power requirements for basic systems, manoeuvre, jump, sensors, weapons, screens, and options.
- [x] Calculate software bandwidth used and available.
- [x] Calculate hardpoints used and available.
- [x] Calculate crew requirements by commercial/military mode, including large-ship crew reductions.
- [x] Calculate tons used, tons remaining, cargo, total cost, purchase cost, and monthly maintenance.

### 5. Expand Stock Ship Display

- [x] Replace the one-row High Guard seed with stock spacecraft summary rows from the catalogue.
- [x] Exclude small craft records from the Phase 4 stock list and move them to Phase 5.
- [x] Upgrade `/shipyard` selected-ship display to show detailed datasheets.
- [x] Add detailed component records for the pilot stock spacecraft set: Scout/Courier, Free Trader, Far Trader, Yacht, System Defence Boat, and Fleet Courier.

### 6. Create Shipyard Tabs

- [x] Add `Stock Ships`, `Custom Ships`, and `Ship Builder` views.
- [x] Keep the layout consistent with the existing Garage pattern where practical.
- [x] Add search, category filtering, sorting, and selected-ship details for stock spacecraft.

### 7. Create 13-Step Builder Shell

- [x] Setup.
- [x] Hull.
- [x] Drives.
- [x] Fuel.
- [x] Power Plant.
- [x] Bridge.
- [x] Computer.
- [x] Sensors.
- [x] Weapons.
- [x] Options.
- [x] Crew.
- [x] Accommodations & Cargo.
- [x] Review.

The step labels can be adjusted for UI clarity, but the builder should preserve the High Guard design sequence in descriptions and validation.

### 8. Add Persistent Ship Ledger Panel

- [x] Show tons used and total hull tons.
- [x] Show remaining tons.
- [x] Show MCr total and purchase cost.
- [x] Show Power generated and Power required.
- [x] Show jump fuel and fuel endurance.
- [x] Show hardpoints used.
- [x] Show software bandwidth used.
- [x] Show required crew.
- [x] Show monthly maintenance.

### 9. Add Validation

- [x] Validate spacecraft minimum 100 tons.
- [x] Validate tonnage does not exceed hull tons.
- [x] Validate TL minimums.
- [x] Validate sufficient Power or explicitly mark power trade-offs.
- [x] Validate jump fuel and power plant fuel requirements.
- [x] Validate bridge is present and correctly sized.
- [x] Validate computer bandwidth.
- [x] Validate hardpoint limits.
- [x] Validate crew/stateroom mismatch warnings.
- [x] Validate cargo cannot go negative.

### 10. Add Integrated Visual Builder Foundation

- [x] Keep the 13-step workflow, ship ledger, component tray, and deck canvas visible as one builder experience.
- [x] Add a deck grid surface inside the `Ship Builder` tab.
- [x] Add deck controls for deck name, grid dimensions, and tons per cell.
- [x] Generate an unplaced component tray from `shipConstructionSummary().components`.
- [x] Distinguish placeable components from `abstract`, `distributed`, and `exterior` ledger-only components.
- [x] Allow simple grid placement for required/derived/optional area components.
- [x] Store placements in `CustomShipLayout.placements`.
- [x] Show placed tons vs required tons for each visual component.
- [x] Highlight unplaced, under-sized, over-sized, or invalid placement states.
- [x] Keep rules accounting authoritative even when visual placement is incomplete.
- [x] Add direct manipulation for moving and resizing placed components.
- [x] Add pointer drag movement and corner-handle resizing with grid snapping.
- [x] Add overlap validation and visual conflict feedback.
- [ ] Add multi-deck creation and deck switching.

### 11. Save Custom Ships

- [ ] Persist custom spacecraft through the Shipyard store.
- [ ] Support editing, cloning, deleting, and resuming custom ship drafts.
- [ ] Normalize saved custom ships before rendering or validation.

### 12. Fill Builder Step Editors

- [ ] Flesh out Setup fields beyond the initial shell.
- [ ] Flesh out Hull controls for configuration, armour, specialised hulls, additional hulls, and hull options.
- [ ] Flesh out Drives, Fuel, Power Plant, Bridge, Computer, and Sensors with full rule-table selectors.
- [ ] Add Weapons and Screens editors with hardpoint accounting.
- [ ] Add Options editor for ship systems and High Guard options.
- [ ] Add Crew editor that can accept manual overrides while preserving generated requirements.
- [ ] Add Accommodations & Cargo editor with staterooms, berths, common areas, passengers, and cargo.
- [ ] Add Review controls for save readiness and validation issue navigation.

### 13. Prepare Visual Layout Model

- [x] Add layout data structures without building the full visual editor yet.
- [x] Model decks, grid scale, component placements, and placement policy.
- [ ] Support placement policies such as `required-area`, `derived-area`, `optional-area`, `distributed`, `exterior`, and `abstract`.
- [x] Keep rules accounting authoritative while allowing future grid cells to represent tonnage.

### 14. Regression Targets

- [ ] Use Scout/Courier as the first stock-vs-builder regression case.
- [ ] Use Free Trader as the second regression case.
- [ ] Expand to Far Trader and Yacht after the first two reproduce cleanly.

## Recommended First Implementation Slice

1. Add expanded ship and custom ship types.
2. Add High Guard hull, drive, fuel, power, bridge, computer, and sensor rules.
3. Build the accounting engine.
4. Build the builder shell through Review.
5. Add the integrated visual builder foundation: deck grid, component tray, placement records, and placement-vs-tonnage audit.
6. Implement enough UI to create, place, validate, and save a simple 100-400 ton spacecraft.

Weapons, options, detailed stock imports, and advanced visual layout tools should follow once the ledger and basic placement audit are solid.
