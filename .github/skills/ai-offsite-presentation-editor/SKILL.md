---
name: ai-offsite-presentation-editor
description: "Edit the AI Community of Practice offsite deck, slide flow, discussion prompts, speaker notes, segment timing, and presenter controls."
argument-hint: "Describe the slide, content, or speaker-note change"
---

# AI Offsite Presentation Editor

Use this skill when editing the offsite presentation content or slide flow.

## Source of Truth

- `src/data/deck.yaml`: segment order, slide order, visible slide text, room prompts, and speaker notes.
- `src/types.ts`: deck schema.
- `src/PresentationContext.tsx`: slide navigation and timer behavior.
- `src/components/ContentArea.tsx`: TV-facing slide canvas.
- `src/components/PresentationControls.tsx`: hidden launcher and popout presenter controls.

## Editing Rules

1. Make content edits in `src/data/deck.yaml` first.
2. Keep one clear assertion or question per slide.
3. Use `discussionPrompt` for questions meant to be read to the room.
4. Use `speakerNotes` for presenter-only talk track.
5. For AI 101, prefer short room-question slides before the clarification or explanation slide.
6. Keep visible slide copy short enough for a projected room display.
7. Do not add dashboard boards, org charts, dense card grids, unrelated visual assets, or visible TV controls.
8. Run `npm run validate:deck` after changing slide data.
9. Run `npm run build` after schema or component changes.

## Completion Checks

- Slide ids are unique.
- Segment ids are unique.
- Every slide has a non-empty title.
- The deck still contains 32-64 slides.
- Keyboard next and previous navigation still works on the main presentation.
- Presenter notes and controls are available in the popout remote.
