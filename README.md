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
  subtitle: "Shared language before shared build"
  totalDuration: 120
  segments:
    - id: ai-101
      title: "AI 101"
      shortTitle: "AI 101"
      sectionLabel: "Section 01"
      start: "05:00"
      end: "60:00"
      accent: "#22d3ee"
      slides:
        - id: everyday-work-shift
          variant: statement
          title: "The everyday tools are changing"
          comparisons:
            beforeLabel: "Then"
            afterLabel: "Now"
            rows:
              - before: "Search for an answer"
                after: "Prompt for a useful starting point"
              - before: "Build slides and spreadsheets by hand"
                after: "Use agents to draft, analyze, and iterate"
          speakerNotes: "Use this as the adoption point: prompting is becoming the new Googling."

        - id: llm-history
          variant: statement
          title: "In less than a decade, the interface changed"
          timeline:
            - year: "2024"
              title: "GPT-4o"
              detail: "Text, vision, and voice moved toward real-time use."

        - id: llm-video
          variant: statement
          title: "Large language models, visually"
          video:
            provider: "youtube"
            id: "LPZh9BOjkQs"
            title: "Large Language Models explained briefly"
            caption: "3Blue1Brown"

        - id: learning-summary
          variant: statement
          title: "AI learns in different ways"
          table:
            labelColumn: "Mechanism"
            columns: ["Where it lives", "What changes", "Example"]
            rows:
              - label: "Context"
                cells: ["Inside the current prompt", "The model's current behavior", "One example teaches the format"]

        - id: products-and-models
          variant: statement
          title: "The product is not the same thing as the model"
          brandGroups:
            - title: "Products and harnesses people use"
              items:
                - name: "ChatGPT"
                  detail: "App and agent experience"
```

One slide equals one presenter step. Slides can use `body`, `bullets`, `columns`, `comparisons`, `timeline`, `video`, `diagram`, `table`, `brandGroups`, `image`, `code`, and `discussionPrompt` as needed. Speaker notes and transport controls appear in the popout presenter view only.

## Authoring Rules

- Keep each slide to one clear assertion or question.
- Put room facilitation prompts in `discussionPrompt`.
- Put presenter-only wording in `speakerNotes`.
- For AI 101, prefer short room-question slides before the clarification or explanation slide.
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
