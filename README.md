# AI Community of Practice Offsite

This repo contains a static, data-driven React presentation app for Chris's AI Community of Practice offsite.

The app is intentionally minimal: dark mode, large typography, clean 16:9 slide output, keyboard navigation, and a popout remote presenter view. Speaker notes and transport controls live in the popout window, not on the TV-facing presentation surface.

## Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- js-yaml

## Commands

```bash
npm install
npm run dev
npm run validate:deck
npm run build
npm run preview
```

The production Vite base path remains `/ThePhoenixReport/` so the existing GitHub Pages deployment path keeps working.

## Content Model

All presentation content lives in `src/data/deck.yaml`.

The schema is:

```yaml
presentation:
  title: "AI Community of Practice Offsite"
  subtitle: "Getting on the same page before we build"
  totalDuration: 120
  segments:
    - id: ai-101
      title: "AI 101"
      shortTitle: "AI 101"
      start: "05:00"
      end: "60:00"
      accent: "#22d3ee"
      slides:
        - id: model-is-frozen
          variant: statement
          title: "A model is frozen between training runs"
          subtitle: "Your conversation does not rewrite the base model."
          body: "Systems can add memory or logs, but that is not the same thing as the model learning from you in real time."
          discussionPrompt: "Where have you heard the opposite?"
          speakerNotes: "Use this to clear a common misconception early."
```

One slide equals one presenter step. Speaker notes appear in the right rail and in the popout presenter view.

## Authoring Rules

- Keep each slide to one clear assertion or question.
- Put room facilitation prompts in `discussionPrompt`.
- Put presenter-only wording in `speakerNotes`.
- Keep visible slide text short enough to read from a distance.
- Use stable, unique `id` values for segments and slides.
- Run `npm run validate:deck` after editing `deck.yaml`.

## Main Files

- `src/data/deck.yaml`: deck content and speaker notes.
- `src/types.ts`: deck schema types.
- `src/PresentationContext.tsx`: slide navigation, timer, keyboard handling, and persistence.
- `src/components/ContentArea.tsx`: TV-facing slide canvas.
- `src/components/PresentationControls.tsx`: hidden presenter launcher and popout remote presenter.
- `scripts/validate-deck.cjs`: YAML sanity checks.

## Presentation Controls

- Right arrow or Page Down: next slide.
- Left arrow or Page Up: previous slide.
- P: open the popout presenter window.
- Popout remote: large speaker notes, previous/next, timer, current step, and next beat.
