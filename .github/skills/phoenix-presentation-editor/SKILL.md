---
name: phoenix-presentation-editor
description: 'Edit The Phoenix Report presentation YAML, teleprompter scripts, and reveal flow. Use for script writing, presentation editing, timeline.yaml modalStep/globalStep authoring, adding/removing/changing characters, challenges, epics, concepts, segment timing, and understanding how presentation/explore navigation works.'
argument-hint: 'Describe the presentation or script change you want to make'
---

# Phoenix Presentation Editor

Use this skill when working on the Phoenix Report's content model and presenter scripts.

## When to Use
- Add, remove, or revise presentation content in `src/data/*.yaml`
- Write or rewrite presenter scripts for modal and global beats
- Change reveal order, segment timing, or which items appear in a segment
- Understand how `timeline.yaml` links to concepts, characters, challenges, and epics
- Explain or edit how presentation navigation moves through intro, content, and summary states

## Source of Truth
- `src/data/timeline.yaml`: segment order, pacing windows, reveal order, `modalStep`, `globalStep`
- `src/data/concepts.yaml`: Four Types of Work, Three Ways, and principle lists
- `src/data/characters.yaml`: org chart participants and `reportsTo` relationships
- `src/data/challenges.yaml`: challenge cards and their business impact
- `src/data/epics.yaml`: major project/storyline cards
- `src/types.ts`: canonical TypeScript schema for all YAML shapes
- `src/data.ts`: raw YAML loading and `lookupItem(type, id)` cross-file resolution
- `src/PresentationContext.tsx`: derived step logic and navigation behavior

Load these references when you need deeper detail:
- [Data models and file relationships](./references/data-models.md)
- [Script authoring rules](./references/script-authoring.md)
- [Navigation and reveal flow](./references/navigation.md)

## Editing Procedure
1. Classify the request.
   - Script-only change: usually `timeline.yaml`
   - Displayed item content change: owning YAML file (`concepts`, `characters`, `challenges`, `epics`)
   - Reveal order or segment pacing: `timeline.yaml`
   - Navigation logic change: `PresentationContext.tsx`, sometimes `ContentArea.tsx` or controls
2. Read the owning file and the related timeline segment before editing.
3. Make the smallest data change that satisfies the request.
4. Preserve relationships.
   - Every `timeline.yaml` reveal must resolve through `lookupItem(type, id)`
   - `segment` fields in content YAML should still match real timeline segment ids where used
   - `reportsTo` must still describe a valid org chart parent or `null`
5. Keep scripts in the right place.
   - Presenter-specific wording belongs in `modalStep` and `globalStep`
   - Canonical card/modal content belongs in the owning YAML item
   - Segment-level narration belongs in `narrativeArc`, `takeaway`, and `summary`
6. Re-check navigation impact.
   - Content segments progress `intro -> content steps -> summary`
   - Each reveal normally produces two presenter beats: `modal`, then `global`
   - If explicit scripts are missing, the app falls back to the item's description-like fields
7. Validate.
   - No duplicate ids
   - No orphaned timeline references
   - Reveal order still matches the story
   - Run `npm run build` after structural or schema-sensitive edits

## Common Tasks
### Add a new item
1. Add the item to its owning YAML file with a unique `id`.
2. If it should appear in the presentation, add a matching reveal to a segment in `timeline.yaml`.
3. Add `modalStep` and `globalStep` only if you want presenter-specific scripts.
4. If adding a character, set `reportsTo` correctly.

### Remove an item
1. Remove the item's reveal references from `timeline.yaml`.
2. Remove the item from its owning YAML file.
3. If removing a character, repair any children that point to it via `reportsTo`.

### Change an existing item
1. Edit the owning YAML entry for canonical content.
2. Edit `timeline.yaml` scripts separately if the spoken script should change too.
3. If changing an `id`, update every reveal that points to it.

### Add or edit scripts
1. Go to the reveal entry inside `timeline.yaml`.
2. Add or update:
   - `modalStep.name`
   - `modalStep.script`
   - `globalStep.name`
   - `globalStep.script`
3. Keep scripts short, spoken, and contextual to the current board state.

## Decision Rules
- Use `timeline.yaml` when the change is about story flow, pacing, reveal order, or presenter script.
- Use the owning YAML file when the change is about what the card or modal fundamentally says.
- Prefer revealing top-level concepts and ways rather than individual principles unless you intentionally want a standalone principle reveal and have confirmed the UI should present it that way.
- Do not add new schema fields unless the UI and `types.ts` are updated to understand them.

## Completion Checks
- The requested story or data change is reflected in the right file(s)
- `timeline.yaml` ids still match the owning YAML records
- Scripts read naturally as presenter narration
- Segment flow still makes narrative sense
- Build passes when code or schema relationships were touched
