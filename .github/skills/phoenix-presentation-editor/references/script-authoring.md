# Script Authoring Rules

## Where Scripts Live
### Segment-level narration
Use these fields in `src/data/timeline.yaml` when the narration is about the segment as a whole:
- `narrativeArc`
- `takeaway`
- `summary`
- `subtitle`

These feed intro/summary style steps and fallback narration.

### Reveal-level presenter beats
Use these fields in a reveal when the presenter script should track the step-by-step board state:
- `modalStep.name`
- `modalStep.script`
- `globalStep.name`
- `globalStep.script`

This is the primary place for teleprompter-friendly script writing.

## Fallback Behavior
If explicit scripts are missing, `PresentationContext.tsx` derives them from the item data:
- Reveal title fallback: `title`, then `name`, then `id`
- Primary script fallback: `description`, then `impact`, then `arc`, then `subtitle`
- Secondary script fallback: `impact`, then `arc`, then `subtitle`, then `description`

## Writing Guidelines
- Write for spoken delivery, not card copy
- Keep one clear idea per step
- Use `modalStep` for what to say while the focused item is center-stage
- Use `globalStep` for how that item changes the audience's understanding once it returns to the board
- Avoid repeating the card subtitle verbatim unless repetition is intentional

## Recommended Workflow
1. Decide whether the script is segment-wide or reveal-specific.
2. Edit `timeline.yaml` first for presenter beats.
3. Keep canonical descriptive content in the owning YAML item.
4. Read the previous and next reveals before rewriting a script so the spoken flow stays coherent.

## Example
```yaml
- type: challenge
  id: firefighting
  modalStep:
    name: "Firefighting takes over"
    script: "Firefighting is the default operating mode..."
  globalStep:
    name: "Unplanned work dominates the board"
    script: "Once firefighting is placed back into the global view..."
```
