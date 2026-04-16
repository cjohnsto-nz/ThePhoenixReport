# The Phoenix Report - Agent Skill

## Project Overview
This is an interactive book report website for "The Phoenix Project" by Gene Kim. It's built as a beautiful, animated, data-driven presentation tool with center-stage reveals and persistent section containers.

## Tech Stack
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **js-yaml** for runtime YAML parsing
- **@modyfi/vite-plugin-yaml** for build-time YAML imports

## Architecture

### Data-Driven Design
All content is stored in YAML files under `src/data/`:
- `timeline.yaml` — Presentation segments, timing, and reveal order
- `concepts.yaml` — The Four Types of Work and The Three Ways
- `characters.yaml` — Character profiles with org chart hierarchy (reportsTo)
- `challenges.yaml` — Challenges by segment
- `epics.yaml` — Major projects/storylines (Phoenix Project, SOX Audit, etc.)

**To change content, edit the YAML files only.** The UI renders everything from data.

### Two Modes
1. **Presentation Mode** — Manual reveals via "Reveal Next" button. Timer acts as a speedrun split (pacing guide, not the driver). New items appear center-stage then settle into persistent section containers.
2. **Explore Mode** — All content visible, free navigation with org chart

### Component Structure
- `PresentationContext.tsx` — State management (useReducer + context) for mode, timer, manual reveals, SplitInfo
- `components/GlassCard.tsx` — Reusable animated glass-morphism card
- `components/Modal.tsx` — Reusable modal dialog with accent color and animations
- `components/CenterStage.tsx` — Full-screen center-stage overlay for newly revealed items
- `components/ChallengeCard.tsx` — Challenge display with severity badges
- `components/CharacterCard.tsx` — Character display with avatars and quotes
- `components/ConceptCard.tsx` — Concept/principle display (handles both simple items and Ways with nested principles)
- `components/EpicCard.tsx` — Epic/project display with status badges
- `components/SectionContainer.tsx` — Section wrapper with title, accent bar, and count
- `components/SegmentHeader.tsx` — Current segment title/subtitle with phase indicator
- `components/TakeawayBanner.tsx` — Key takeaway banner shown near segment end
- `components/PresentationControls.tsx` — Bottom toolbar with Reveal Next button, split timer, segment nav
- `components/ParticleBackground.tsx` — Ambient animated background
- `components/ContentArea.tsx` — Main content renderer with persistent sections, org chart, and center-stage

### Design System
- **Theme**: Dark navy background with phoenix amber/orange accents
- **Colors**: `phoenix-*` (amber/orange), `navy-*` (deep blue), `ember-*` (orange)
- **Cards**: Glass-morphism with backdrop blur, subtle borders, glow shadows
- **Animations**: Framer Motion for all reveals, hovers, transitions
- **Typography**: Inter font family

## Key Commands
```bash
npm install --legacy-peer-deps  # Install dependencies
npm run dev                     # Start dev server
npm run build                   # Production build
```

## Modification Guidelines
1. **Content changes** → Edit YAML files in `src/data/`
2. **Timing/order changes** → Edit `timeline.yaml` reveals and delaySeconds (ordering only; reveals are manual)
3. **New card type** → Create component following ChallengeCard pattern, add to ContentArea
4. **Styling changes** → Modify `tailwind.config.js` or component classes
5. **New section** → Add data to YAML, add type to `types.ts`, render in ContentArea
6. **Animation tuning** → Modify Framer Motion props on components

## Data Schema Quick Reference
- Timeline reveals: `{ type: challenge|concept|character|epic, id: string, delaySeconds: number }`
- Challenges: `{ id, title, subtitle, segment, description, impact, icon, severity, color }`
- Characters: `{ id, name, role, segment, reportsTo, description, arc, quote, avatar, color }`
- Concepts: `{ id, title, subtitle, description, icon, color }` (+ examples or principles for Ways)
- Epics: `{ id, title, subtitle, description, status, icon, color }`
