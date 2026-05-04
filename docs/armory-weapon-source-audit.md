# Armory Weapon Source Audit

This is the working note for duplicate weapon handling in the Armory reference data.

## Canonical Source Rule

- Field Catalogue wins over Central Supply Catalogue.
- Central Supply Catalogue wins over Core Rulebook.
- Core Rulebook remains the fallback when no supplement row exists.
- Raw JSON rows stay intact; the canonical list is built in `utils/traveller/weapons.ts`.

This means supplement books are treated as updates to the Core Rulebook when the same weapon family appears in more than one source.

## Current Pass

- Raw seeded weapon rows: 191.
- Canonical displayed weapon rows: 163.
- Lower-priority rows hidden by canonicalization: 28.
- Hidden rows in this pass are all Core Rulebook rows superseded by Central Supply Catalogue rows.

## Cross-Source Families Found

- Accelerator Rifle
- Advanced Combat Rifle
- Aerosol Grenade
- Antique Pistol
- Assault Rifle
- Autopistol
- Autorifle
- Body Pistol
- Frag Grenade
- Gauss Pistol
- Gauss Rifle
- Laser Carbine
- Laser Pistol
- Laser Rifle
- Laser Sniper Rifle
- Plasma Rifle
- Plastic Explosive
- Pocket Nuke
- Revolver
- Rifle
- Shotgun
- Smoke Grenade
- Snub Pistol
- Stun Grenade
- Stunner
- Submachine Gun
- TDX

## Follow-Up

- Add an in-app duplicate/conflict inspector if we want to show hidden source rows for audit.
- Revisit the family-normalization rules if a future supplement intentionally reuses a base name for a mechanically separate weapon.
