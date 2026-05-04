# Scout Suite Phase 2 TODOs

This document is the working checklist for Phase 2 planning. The view names below reflect the target naming for the suite; the actual TODOs are intentionally left as discussion placeholders until we decide scope.

## Naming Decisions

- Character Creation remains `Character Creation`.
- Character Sheet remains `Character Sheet`.
- Weapons becomes `Armory`.
- Vehicles becomes `Garage`.
- Robots remains `Robots`.
- Hangar becomes `Shuttle Bay`.
- Shipyard remains `Shipyard`.

## Character Creation

### Priority 1: Progression Blockers

- [ ] Audit career event and mishap mechanics that can leave the creator unable to advance to the next term.
- [ ] Identify event/mishap effect types that still fall through to manual resolution and decide which need first-class UI handling.
- [ ] Fix Prisoner parole/release flow after verifying the Core rule sequence for parole threshold, advancement/parole rolls, release, and forced continuation.
- [ ] Verify whether continuing in the same career after a successfully completed term should skip qualification, then update career qualification flow if needed.
- [ ] Review forced-out, cannot-continue, natural-12 continuation, draft-next-term, and automatic-entry constraints for correct next-term behaviour.

### Priority 2: Training And Skills Rules

- [ ] Re-check Core rules for career basic training when entering a new career.
- [ ] Decide whether first career basic training grants the full service/assignment package and later new careers grant one basic training skill at level 0.
- [ ] Update basic training UI/state if the current once-per-career package handling is too broad or too restrictive.
- [ ] Re-evaluate specialized skill handling, including base skills such as Melee and Gun Combat versus specialties such as Melee (Blade) and Gun Combat (Slug).
- [ ] Ensure skill table results, event checks, existing-skill increases, and PDF/profile export all treat specialties consistently.

### Priority 3: Mustering Out And Benefits

- [ ] Add rank/advancement-based extra benefit rolls after verifying the Core rank bonus rules.
- [ ] Explore Gambler skill effects on mustering-out cash rolls and implement the correct DM/application rules.
- [ ] Review Prisoner benefits and confirm whether any special benefit behaviour is missing.
- [ ] Review Psion benefits and confirm whether any special benefit behaviour is missing.
- [ ] Convert mustering-out benefits such as Ship Share, Scout Ship, Free Trader, Yacht, TAS Membership, Weapon, Armour, Blade, Gun, and Cybernetic Implant into structured outcomes instead of plain personal benefit text where practical.
- [ ] Add choice handling for mustering-out benefits written as alternatives, such as `SOC +1 or Cybernetic Implant`.

### Priority 4: Character Completion Flow

- [ ] Add Connections step and enforce Core limits for free connection skills.
- [ ] Add final skills package step.
- [ ] Add final equipment purchase step and apply the starting purchase limit.
- [ ] Add pension calculation and final finance updates.

### Rule References To Verify

- [ ] Same-career continuation and qualification requirements.
- [ ] Basic training package versus single-skill handling when entering later careers.
- [ ] Prisoner parole threshold, release, and career continuation.
- [ ] Gambler skill interaction with mustering-out cash rolls.
- [ ] Specialized skill acquisition and defaulting rules.

## Character Sheet

- [ ] Define TODOs.

## Armory

- [ ] Rename the current Weapons view and routes/labels to Armory.
- [ ] Decide whether the route should remain `/weapons` for now or move to `/armory` with a redirect.
- [x] Add shared equipment data types for armour, support items, general equipment, and item source metadata.
- [x] Add Armory store/composables that load weapons, armour, support items, and general equipment from source JSON.
- [ ] Populate Core Rulebook armour and equipment tables. First seed added; continue auditing for missing rows.
- [ ] Populate Central Supply Catalogue armour, weapons, support items, vehicles-adjacent gear, survival gear, electronics, tools, medical items, and trade goods where useful. First medical and armour seeds added.
- [ ] Populate Field Catalogue weapon records and weapon construction data beyond the currently seeded weapon/design subset. First armour/support seed added.
- [x] Canonicalize duplicate armour families at load time so supplement books override overlapping Core Rulebook rows.
- [x] Canonicalize duplicate weapon families at load time so supplement books override overlapping Core Rulebook rows.
- [ ] Add a duplicate/conflict audit view or report if we want to inspect hidden lower-priority weapon rows later.
- [ ] Use `docs/armory-weapon-source-audit.md` as the working duplicate weapon source checklist.
- [x] Show weapon source page numbers where seeded.
- [x] Replace the Armor tab placeholder with searchable/filterable reference armour cards/table.
- [x] Replace the Equipment tab placeholder with searchable/filterable equipment records.
- [ ] Continue populating Equipment as the catch-all for everything that is not weapons or armour, including missing Core categories and the broader Central Supply Catalogue.
- [ ] Use `docs/armory-equipment-gap-audit.md` as the working missing-equipment checklist.
- [ ] Add item-to-character-sheet actions for weapons, armour, and general equipment.
- [ ] Add character armour equipment mechanics, including protection, rad protection, required skill penalties, STR/DEX modifiers, slots, powered armour, battle dress, and PSI-based protection.
- [ ] Decide whether custom item creation should be generic equipment-first or separate custom builders per item type.

## Garage

- [ ] Rename Vehicles to Garage.
- [ ] Define TODOs.

## Robots

- [ ] Define TODOs.

## Shuttle Bay

- [ ] Rename Hangar/Small Craft language to Shuttle Bay.
- [ ] Define TODOs.

## Shipyard

- [ ] Define TODOs.

## Hub And Navigation

- [x] Update homepage/tool card naming once view naming is approved.
- [ ] Define any cross-view navigation TODOs.

## Open Questions

- [ ] Decide whether route paths should change with labels, for example `/weapons` to `/armory`.
- [ ] Decide whether old routes should redirect to renamed routes.
- [ ] Decide which Phase 2 items must be completed before enabling currently disabled views.
