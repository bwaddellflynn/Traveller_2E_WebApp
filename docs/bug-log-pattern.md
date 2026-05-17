# Bug Log Pattern

Use feature-specific bug logs for recurring diagnosis work. Examples:

- `character-creator-logged-bugs.md`
- `vehicle-builder-logged-bugs.md`
- `equipment-logged-bugs.md`
- `ships-logged-bugs.md`

## Rules

- Keep one log per feature area.
- Add a new entry whenever a bug is reported or confirmed during diagnosis.
- Do not delete fixed bugs. Move them to `Resolved` or update their status to `Resolved`.
- Keep entries short enough to scan, but include the observed example that made the issue concrete.
- If a rulebook or source-data check is needed before coding, add a `Rules reference` line.
- If the issue is suspected but not confirmed, mark it `Needs Diagnosis`.

## Status Values

- `Open`: confirmed or strongly suspected and not fixed.
- `Needs Diagnosis`: reported, but cause is not yet understood.
- `In Progress`: currently being fixed.
- `Resolved`: fixed and verified enough for the current pass.
- `Deferred`: intentionally postponed.

## Entry Template

```md
### PREFIX-000: Short bug title

- Status: Open
- Reported: What the user noticed.
- Observed example: Concrete case, screenshot context, or reproduction path.
- Rules reference: Book/source pages or rule area to review before changing behaviour.
- Current diagnosis: What we think is wrong right now.
- Likely area: Files/modules/components likely involved.
- Resolution notes: Fill in when fixed; include verification notes.
```
