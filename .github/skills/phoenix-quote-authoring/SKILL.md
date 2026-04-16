---
name: phoenix-quote-authoring
description: 'Author timeline quote reveals for The Phoenix Report. Use for adding, revising, moving, or removing character-attributed quotes in characters.yaml and timeline.yaml, including modal/global scripts, beat placement, Bill quote examples, and validation of quote ids and reveal order.'
argument-hint: 'Describe the speaker, story beat, and whether you want a live edit or an example snippet'
---

# Phoenix Quote Authoring

Use this skill when a quote should appear as a standalone presentation beat instead of living as persistent text on a character card.

## When to Use
- Add a new quote for an existing character
- Insert a quote into `timeline.yaml` at a specific story beat
- Move a quote earlier or later in the presentation flow
- Write or revise `modalStep` and `globalStep` scripts around a quote reveal
- Create an example quote entry for a scene before deciding whether to keep it live
- Audit whether quote ids, speaker ownership, and reveal order are still consistent

## Source of Truth
- `src/data/characters.yaml`: quotes live under the speaker as `quotes[]`
- `src/data/timeline.yaml`: quote reveals are inserted here with `type: quote`
- `src/types.ts`: canonical schema for `CharacterQuote` and `TimelineReveal`
- `src/data.ts`: `lookupItem('quote', id)` resolves quote entries from character data
- `src/PresentationContext.tsx`: derives fallback title and scripts for quote reveals
- `src/components/ContentArea.tsx`: stages quote cards full-screen and animates them toward the speaker's character card

Reference:
- [Quote examples](./references/examples.md)

## Workflow
1. Identify the beat.
   - Pin down the exact story moment, not just the chapter.
   - Decide whose reaction or spoken line best captures the beat.
2. Choose the speaker.
   - Quotes belong to a character, so start in `src/data/characters.yaml`.
   - Reuse an existing quote only if it is the same line at the same narrative moment.
3. Add or revise the quote entry.
   - Store it under that character as `quotes[]`.
   - Use a stable, descriptive id such as `bill-talked-into-job`.
   - Keep the text canonical and author-verified.
4. Place the reveal in `src/data/timeline.yaml`.
   - Add `type: quote` with the quote id.
   - Place it immediately after the reveal that gives the quote enough context.
   - For reaction quotes, this is usually right after the character or event reveal that sets up the moment.
5. Add presenter beats.
   - `modalStep` should explain why the quote matters while the quote card is center-stage.
   - `globalStep` should connect that quote back to the board after the card closes.
   - If no custom scripts are needed, the app can fall back to the quote text, but explicit scripts are usually stronger.
6. Validate the flow.
   - Confirm the quote resolves through `lookupItem('quote', id)`.
   - Confirm the quote stages as its own beat and closes toward the speaker's character card.
   - Confirm the quote does not need to persist inside the org chart or character detail to do its job.
7. Build-check after schema-sensitive changes.
   - Run `npm run build` after changing quote structure, ids, or reveal wiring.

## Decision Rules
- Use a quote reveal when the line deserves its own narrative beat.
- Keep a quote out of the timeline when the idea is already better represented by a character reveal, epic, challenge, or concept card.
- Put the quote under the speaker, not under the segment.
- Put presenter interpretation in `modalStep` and `globalStep`, not inside the quote text itself.
- Prefer exact text when authors can verify it. If certainty is low, keep the wording conservative and flag it for review instead of inventing extra detail.
- If the user asks for "a quote after X happens," place it after the reveal that establishes `X`, not at the end of the segment by default.

## Completion Checks
- The quote lives under the correct character in `quotes[]`
- The quote id is unique and descriptive
- `timeline.yaml` references the quote with `type: quote`
- The reveal order still makes narrative sense
- Custom scripts read naturally aloud
- Build passes after structural changes

## Common Requests
### Add a new quote beat
1. Add a new quote under the speaker in `src/data/characters.yaml`.
2. Add a matching `type: quote` reveal in `src/data/timeline.yaml`.
3. Add `modalStep` and `globalStep` if you want presenter-specific narration.

### Revise a quote without moving it
1. Edit the quote text in `src/data/characters.yaml`.
2. Keep the id stable unless the old id is misleading.
3. Update scripts in `src/data/timeline.yaml` only if the interpretation should change too.

### Move a quote to a better beat
1. Leave the quote under the same character.
2. Move only the quote reveal entry in `src/data/timeline.yaml`.
3. Re-read the surrounding reveals to make sure the quote still lands with enough context.