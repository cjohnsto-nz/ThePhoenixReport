# AI Offsite Presentation - Agent Instructions

This repo is a static React, TypeScript, Vite presentation app for the AI Community of Practice offsite.

## Source of Truth

- `src/data/deck.yaml` owns all visible slide content, discussion prompts, segment timing, and speaker notes.
- `src/types.ts` defines the deck schema.
- `src/PresentationContext.tsx` owns slide navigation, timer state, keyboard handling, and session persistence.
- `src/components/ContentArea.tsx` renders the TV-facing slide canvas.
- `src/components/PresentationControls.tsx` opens and renders the popout remote presenter.

## Editing Guidance

- For content changes, edit `src/data/deck.yaml`.
- Keep slide text short, facilitation-oriented, and readable from a distance.
- Put room questions in `discussionPrompt`.
- Put presenter-only detail in `speakerNotes`.
- Do not reintroduce dashboard boards, org charts, reveal cards, or report-board structures.
- Keep the TV-facing surface minimal: near-black background, off-white text, cyan accent, thin rules, disciplined typography, and no visible controls.
- Keep the Vite production base path as `/ThePhoenixReport/` unless deployment changes.

## Validation

Run:

```bash
npm run validate:deck
npm run build
```

For rendered UI changes, run the dev server and verify app load, 16:9 TV slide readability, keyboard slide navigation, and the popout presenter view.
