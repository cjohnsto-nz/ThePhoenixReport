# Navigation and Reveal Flow

## Modes
### Presentation mode
- Manual navigation driven by `REVEAL_NEXT` and `REVEAL_PREV`
- Timer is a pacing guide, not the driver of reveals
- New content appears center-stage and then settles into the persistent layout

### Explore mode
- Everything is visible
- Navigation is free-form rather than stepwise

## Segment Flow
For normal content segments, the flow is:
1. `intro`
2. `content`
3. `summary`
4. next segment

For `intro` and `outro` phase segments, the segment behaves like a standalone page with no reveal list.

## Content Step Model
In content segments, each reveal usually expands into two presenter steps:
1. `modal`
2. `global`

`currentContentStepIndex` tracks the current derived step, not just the raw reveal index.

## What `REVEAL_NEXT` Does
When inside a normal content segment:
- From `intro`: enters `content`
- From `content` with no active step: goes to the first derived step
- From a `modal` step: usually advances to the paired `global` step
- From the last content step: moves to `summary`
- From `summary`: advances to the next segment

## What `REVEAL_PREV` Does
- From `summary`: returns to the last content step
- From the first content step: returns to `intro`
- From `intro`: returns to the previous segment's terminal state
- Within `content`: walks backward through derived steps

## Reveal State
`getContentStateForStep()` computes two things for a given step:
- `revealedIds`: which cards are already placed into the dashboard
- `stagedId`: which item is currently center-stage

This means:
- modal step => `stagedId` is the reveal id
- global step => reveal id is in `revealedIds`, and `stagedId` is `null`

## Practical Editing Implications
- Reordering reveals in `timeline.yaml` changes presenter flow directly
- Adding `modalStep` and `globalStep` changes what the teleprompter shows at each derived step
- Removing a reveal removes both derived beats from presentation navigation
- Segment `start` and `end` values affect pacing displays but not automatic reveal timing

## Validation Checklist
- Intro/outro segments keep `reveals: []` unless intentionally redesigned
- Reveal order matches the intended story arc
- Summary text still matches the reveals that precede it
- Scripts remain coherent when stepping forward and backward
