# The Phoenix Report

The Phoenix Report is an interactive presentation site for The Phoenix Project by Gene Kim, Kevin Behr, and George Spafford. It turns the book into a paced, presenter-friendly walkthrough of the story, the major characters, the core DevOps ideas, and the operational lessons that emerge over the course of the narrative.

<img width="1635" height="956" alt="image" src="https://github.com/user-attachments/assets/e95a824c-966f-423e-8476-81b80891b11f" />

The app is built as a static React + TypeScript + Vite site with a YAML-driven content model. The presentation itself is not hard-coded into components. Instead, the UI resolves timeline steps, cards, quotes, and lesson summaries from data files under `src/data/`.

## What It Covers

- The business and operational storyline of The Phoenix Project
- The main characters and reporting structure
- Major challenges and incidents
- The Four Types of Work
- The Three Ways
- Major epics such as Phoenix and Unicorn
- Segment-level lesson summaries and presenter scripts

## Core Ideas

- Presentation mode is step-based and speaker-driven. New content appears center-stage, then settles back into the persistent dashboard.
- Explore mode shows the full board at once for free navigation.
- The timer is a pacing aid, not an automatic driver of reveals.
- All primary content comes from YAML, so story edits usually happen in data files rather than JSX.

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- js-yaml
- `@modyfi/vite-plugin-yaml`

## Getting Started

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

The production Vite config uses a `/ThePhoenixReport/` base path, which fits GitHub Pages-style hosting for this repository.

## How The App Is Structured

At the top level, the app is simple:

- `src/App.tsx` wires together the presentation state, controls state, animated background, main content area, and control surface.
- `src/PresentationContext.tsx` owns navigation, reveal state, timing, and the current presenter step.
- `src/ControlsContext.tsx` owns UI-only state such as whether the controls are popped out and whether card legibility mode is enabled.
- `src/components/ContentArea.tsx` renders the board, section intro pages, section summary pages, staged reveal modal, and placement animation.
- `src/components/PresentationControls.tsx` renders both the in-page footer controls and the popout remote presenter view.

## Data Model

The app is intentionally data-driven. `src/types.ts` is the canonical schema, and `src/data.ts` loads raw YAML files, parses them, and resolves reveal references through `lookupItem(type, id)`.

### Source Files

- `src/data/timeline.yaml`
  - Defines presentation duration, segment order, pacing windows, reveal order, and presenter scripts.
- `src/data/characters.yaml`
  - Defines characters, org-chart relationships, quotes, and profile content.
- `src/data/challenges.yaml`
  - Defines challenge cards, severity, and business impact.
- `src/data/concepts.yaml`
  - Defines the Four Types of Work and the Three Ways.
- `src/data/epics.yaml`
  - Defines major projects and storyline epics.
- `src/data/lessons.yaml`
  - Defines segment-level lesson summaries used in summary views.

### Timeline Model

`timeline.yaml` is the backbone of the presentation. Each segment has metadata and an ordered list of reveals.

```yaml
- id: segment-1
  title: "The Week Everything Breaks"
  subtitle: "Bill inherits a failing system, and three crises land at once"
  start: "05:00"
  end: "15:00"
  phase: early
  narrativeArc: "..."
  takeaway: "..."
  summary: "..."
  reveals:
    - type: character
      id: bill-palmer
```

Each reveal references an item that lives in one of the other YAML files.

```yaml
- type: challenge
  id: payroll-outage
```

Reveals can also define presenter-specific scripts.

```yaml
- type: character
  id: bill-palmer
  modalStep:
    name: "Meet Bill Palmer"
    script: "Bill is the point-of-view character..."
  globalStep:
    name: "Bill in context"
    script: "Back on the full board, Bill's role becomes clearer..."
```

### Key Types

- `TimelineSegment`
  - Segment metadata, pacing window, narration, and reveal list.
- `TimelineReveal`
  - A typed pointer to a content item, with optional `modalStep` and `globalStep` scripts.
- `Character`
  - Character profile plus `reportsTo`, which drives the org chart.
- `Challenge`
  - Operational/business problem with severity and impact.
- `Epic`
  - Major project or storyline thread.
- `ConceptItem` and `WayItem`
  - DevOps concepts and ways, including nested principles under each way.
- `Lesson`
  - Summary insight displayed on section summary pages.

### Data Relationship Rules

- Every reveal id in `timeline.yaml` must exist in the owning YAML file for that reveal type.
- `reportsTo` should be another character id or `null`.
- If you rename an id, you need to update all timeline references to it.
- `timeline.yaml` controls presenter flow. The other YAML files control the canonical card and modal content.

## Presentation Flow

The presentation is organized into segments. For normal content segments, the flow is:

1. Intro page
2. Content steps
3. Summary page
4. Next segment

For the special `intro` and `outro` phases, the segment behaves like a standalone page with no reveal sequence.

Within a normal content segment, each reveal usually becomes two presenter steps:

1. Modal step
2. Global step

That means one reveal can produce two distinct beats in the teleprompter and navigation model:

- `modal`
  - The item is center-stage in a full-screen detail view.
- `global`
  - The item has been placed into the dashboard and is discussed in context.

This behavior is derived in `PresentationContext.tsx`, not manually duplicated in the YAML.

## Presentation Controls

The app includes two control surfaces: an in-page footer and a popout remote presenter window.

### Footer Controls

The footer provides:

- Present / Explore toggle
- Previous / next segment
- Previous / next step
- Play / pause pacing timer
- Reset
- Current step, next step, pace delta, runtime, and segment pips
- A button to pop the controls into a separate window

### Popout Remote Presenter View

The remote view is intended for an operator or presenter and includes:

- A large teleprompter view of the current step
- Separate modal and global script panes when the active step belongs to a reveal pair
- Present / Explore mode toggle
- Card View toggle for standard vs legible board cards
- Pace, runtime, section window, and step counters
- Segment transport and step transport controls
- A preview of the next step
- A button to dock the controls back into the main window

### Keyboard Behavior

In presentation mode:

- Right arrow advances
- Left arrow goes back
- Escape places a staged modal item when applicable

The remote presenter window also listens for these keys so a popped-out control surface can drive the main presentation cleanly.

## Legible Card View

The popout controls include a Card View toggle with `Standard` and `Legible` modes.

Legible mode is designed for distance viewing and presenter use. Depending on card type, it increases title size, reduces secondary text, and slightly adjusts spacing so the dashboard remains readable from farther away.

This state is stored in session storage, so it persists during the current browser session.

## Teleprompter Editing In Dev

When running the app in development mode, the remote presenter view can edit teleprompter text directly.

- The UI exposes editable text areas for page, summary, modal, and global scripts.
- Saving sends a request to a local Vite dev-server endpoint.
- That endpoint updates `src/data/timeline.yaml` in place.

This is a local authoring convenience, not a production feature.

## Rendering Model

The main dashboard is stable by design. New items do not simply appear inline. In presentation mode, a reveal is first staged in a full-screen detail view and then animated back into its target section on the board.

The board itself is organized around persistent sections:

- Epics
- Four Types of Work
- The Three Ways
- Characters
- Challenges
- Segment lesson summaries on summary screens

This gives the presentation a cumulative feel: the audience sees the system build up over time instead of replacing one slide with another.

## Project Structure

```text
src/
  App.tsx
  PresentationContext.tsx
  ControlsContext.tsx
  data.ts
  types.ts
  components/
  data/
```

Useful component-level responsibilities:

- `components/ContentArea.tsx`
  - Main board layout, intro/summary pages, staged reveal modal, placement animation
- `components/PresentationControls.tsx`
  - Footer controls, remote presenter window, teleprompter, dev editing
- `components/DetailModalContent.tsx`
  - Detail rendering for challenges, characters, concepts, epics, and quotes
- `components/SegmentHeader.tsx`
  - Compact segment chrome during content steps and hero treatment for intro/outro
- `components/ParticleBackground.tsx`
  - Ambient background motion

## Authoring Guidelines

If you are changing the story or presentation content:

- Edit `timeline.yaml` for reveal order, pacing, and presenter script changes.
- Edit the owning YAML file for the underlying content of a card or modal.
- Keep ids stable and unique.
- Treat `src/types.ts` as the schema source of truth.

In practice, most content work falls into one of these buckets:

- Story flow or speaker narration: `src/data/timeline.yaml`
- Character content and org structure: `src/data/characters.yaml`
- Concepts and principles: `src/data/concepts.yaml`
- Challenges: `src/data/challenges.yaml`
- Epics: `src/data/epics.yaml`
- Summary lessons: `src/data/lessons.yaml`

## Design Direction

The visual system uses a dark navy background with phoenix amber, ember orange, and blue accents. Tailwind theme extensions define the custom `phoenix`, `navy`, and `ember` palettes used across the app.

The overall UI goal is not a slide deck. It is a persistent, animated, board-style presentation that helps the audience understand how the book's people, constraints, incidents, and ideas connect.

## Worth Knowing

- Presentation state is persisted in session storage so a refresh does not immediately wipe progress.
- Explore mode reveals all content at once, but switching back to presentation restores the saved stepwise state.
- The timer supports pacing and split-style guidance, but reveals remain manual.
- The app is static at runtime. Outside the dev-only teleprompter save endpoint, there is no backend.
