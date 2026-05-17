# Character Creator Logged Bugs

Use this as the running diagnosis log for Character Creator issues. Keep resolved bugs in the file and mark them `Resolved` rather than deleting them. Follow the shared bug-log pattern in [bug-log-pattern.md](bug-log-pattern.md).

## Open

### CC-005: Drafted career may incorrectly require qualification

- Status: Open
- Reported: Possible bug: Traveller submits to the Draft and is drafted into a career, such as Marines. Question is whether the Traveller must still qualify for that drafted career.
- Observed example: Draft result into Marines.
- Rules reference: Core Rulebook, Traveller creation, `Drifters and the Draft`: after failing to qualify for a new career, the Traveller may apply to the Draft and is randomly sent to a career/assignment. The Draft is an alternative to qualification, not a second qualification roll for the drafted career.
- Current diagnosis: Failed-qualification Draft fallback already auto-fills successful career qualification through `applyDraftFallback()` and `setAutomaticCareerFallbackQualification()`. The gap is event/subtable draft assignment, such as pre-career Wartime Draft. `draft_assignment` constraints lock the Traveller into the drafted career, but `automaticCareerEntryConstraint` only recognises `automatic_career_entry`, so the next term can still present a normal qualification roll for a drafted career.
- Likely area: `stores/characterCreator.ts`, `automaticCareerEntryConstraint`, `applyAutomaticCareerQualification()`, forced career constraint handling for `draft_assignment`.

## Resolved

### CC-001: Automatic commission does not apply rank 1 officer bonus

- Status: Resolved
- Reported: Automatic commission granted officer rank but did not apply the rank bonus skill.
- Observed example: Navy Ensign should grant `Melee (blade) 1`.
- Current diagnosis: Officer rank tables start at rank 1. The rank state was initialized at the first officer row, causing `applyCareerCommission()` to think rank 1 was already held and return before applying the rank bonus.
- Likely area: `stores/characterCreator.ts`, `applyCareerCommission()`, `makeDefaultCareerRankState()`, `applyCareerRankBonus()`.
- Resolution notes: `makeDefaultCareerRankState()` now treats tracks with no rank 0 row as unranked rank 0 instead of starting at the first available row. Commission therefore advances into officer rank 1 and applies the rank 1 bonus.

### CC-002: Parenthetical speciality choices are treated as one malformed speciality

- Status: Resolved
- Reported: `Pilot (small craft or spacecraft)` displayed as `Small Craft Or Spacecraft` instead of prompting for a valid speciality.
- Observed example: Character sheet showed `Pilot`, `Small Craft Or Spacecraft`, and `Spacecraft` as separate-looking rows.
- Current diagnosis: The skill parser treated the full parenthetical `small craft or spacecraft` as one speciality slug instead of splitting it into `Pilot (small craft)` or `Pilot (spacecraft)` choices.
- Likely area: `utils/traveller/skills.ts`, `stores/characterCreator.ts` skill choice expansion.
- Resolution notes: Skill option expansion now detects parenthetical `or` choices for speciality skills and expands them into individual valid speciality options before displaying or saving the choice.

### CC-003: Generic speciality skill checks do not prompt/apply known speciality DM

- Status: Resolved
- Reported: Scout event `Ambushed Ship` used `Pilot 8+` but did not apply the character's Pilot speciality DM.
- Observed example: Character had `Pilot (spacecraft) 2`, but event resolution showed `3 +0 = 3`.
- Rules reference: Re-check Core character creation skill-speciality rules as applied to career and education events before fixing. The expected behaviour should follow the book's handling of speciality skills when an event names the base skill, such as `Pilot`, versus an explicit speciality, such as `Pilot (spacecraft)`.
- Current diagnosis: Event checks using a base speciality skill such as `Pilot` stored a generic check DM and did not prompt for which known Pilot speciality applied. Malformed `Pilot (small craft or spacecraft)` records could also interfere with valid Pilot speciality lookup.
- Likely area: `stores/characterCreator.ts`, event check resolution and `skillCheckDm()`.
- Resolution notes: Base speciality skill checks now create selectable speciality check options and sort them by current DM, so a character with `Pilot (spacecraft) 2` can apply that speciality to a generic `Pilot 8+` event check.

### CC-004: Muster Out remains unavailable after a completed term

- Status: Resolved
- Reported: After resolving the career event and reaching the `Complete` step, `Muster Out` remained unavailable while `Start Term 7` was available.
- Observed example: Term 6 complete screen showed `Muster Out` visually disabled and `Start Term 7` enabled after the Traveller was ejected from the career.
- Current diagnosis: The previous visible event blocker was not the cause. The term-end muster-out gate could still be blocked by `currentAdvancementNaturalTwelve` even when the current term ended by ejection, where advancement-based continuation should not apply.
- Likely area: `stores/characterCreator.ts`, `components/character/TermActionFooter.vue`.
- Resolution notes: `currentAdvancementNaturalTwelve` now only blocks muster-out for an actual current career advancement natural 12 that can force continuation. Ejection terms without continuation no longer inherit that block.

### CC-006: Basic Training stores parenthetical choice text as a malformed speciality

- Status: Resolved
- Reported: Basic Training showed and saved entries such as `Seafarer (Personal Or Sail) 0`.
- Observed example: Drifter/Barbarian Basic Training displayed `Seafarer` with a nested `Personal Or Sail` speciality at level 0.
- Rules reference: Core Rulebook, Skills and Tasks, Specialities: a Traveller picks a speciality when they gain level 1 in a skill with two or more specialities. Basic Training grants the listed skills at level 0.
- Current diagnosis: Career skill tables correctly preserve book shorthand like `Seafarer (personal or sail)`, but Basic Training was applying the raw table string at level 0. The parser treated the parenthetical `or` text as a literal speciality.
- Likely area: `stores/characterCreator.ts`, Basic Training application and skill award resolution.
- Resolution notes: Basic Training now displays and applies the base skill for level 0 grants. Central skill award resolution also expands parenthetical `or` entries into valid speciality choices for level 1+ awards instead of allowing malformed speciality records.
