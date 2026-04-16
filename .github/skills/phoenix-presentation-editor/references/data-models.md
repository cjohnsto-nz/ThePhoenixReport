# Data Models and File Relationships

## Core Relationship
`src/data/timeline.yaml` does not contain full item content. It contains ordered references:

```yaml
- type: character
  id: bill-palmer
```

The app resolves each reveal by calling `lookupItem(type, id)` in `src/data.ts`.

## Owning Files
- `src/data/timeline.yaml`
  - Defines `presentation.totalDuration`
  - Defines ordered `segments`
  - Defines reveal order inside each segment
  - Optionally stores presenter-only scripts with `modalStep` and `globalStep`
- `src/data/concepts.yaml`
  - Owns `fourTypesOfWork.items[]`
  - Owns `threeWays.items[]`
  - Owns nested `threeWays.items[].principles[]`
- `src/data/characters.yaml`
  - Owns `characters[]`
  - `reportsTo` drives org chart hierarchy
- `src/data/challenges.yaml`
  - Owns `challenges[]`
  - `impact` is a frequent fallback source for presenter scripts
- `src/data/epics.yaml`
  - Owns `epics[]`

## Important Schemas
### Timeline segment
```yaml
- id: segment-1
  title: "Chaos and Invisible Work"
  subtitle: "..."
  start: "05:00"
  end: "15:00"
  phase: early
  narrativeArc: "..."
  takeaway: "..."
  summary: "..."
  reveals:
    - type: challenge
      id: firefighting
```

### Reveal with scripts
```yaml
- type: character
  id: bill-palmer
  modalStep:
    name: "Meet Bill Palmer"
    script: "Bill Palmer is our point-of-view character..."
  globalStep:
    name: "Bill inherits the crisis"
    script: "Back on the global view..."
```

### Character
```yaml
- id: bill-palmer
  name: "Bill Palmer"
  role: "VP of IT Operations"
  segment: segment-1
  reportsTo: steve-masters
  description: "..."
  arc: "..."
  quote: "..."
  avatar: "👨‍💼"
  color: "#3668fc"
```

### Challenge
```yaml
- id: firefighting
  title: "Constant Firefighting"
  subtitle: "Incidents dominate the day"
  segment: segment-1
  description: "..."
  impact: "..."
  icon: flame
  severity: critical
  color: "#ef4444"
```

### Epic
```yaml
- id: phoenix-project
  title: "The Phoenix Project"
  subtitle: "The critical business initiative"
  description: "..."
  status: "Behind schedule, at risk"
  icon: "🔥"
  color: "#f97316"
```

### Concepts
Top-level Four Types items live in `fourTypesOfWork.items[]`.

Top-level Three Ways items live in `threeWays.items[]`.

Principles live under a way:

```yaml
threeWays:
  items:
    - id: first-way
      title: "The First Way"
      principles:
        - id: first-way-manage-system
          title: "Manage the System"
```

## Relationship Rules
- Every reveal `id` must exist in the owning YAML file for that `type`
- `segment` fields in `characters.yaml` and `challenges.yaml` should point to a real segment id
- `reportsTo` should be another character id or `null`
- Renaming an `id` requires updating all timeline references
- Removing a character may require repairing other characters' `reportsTo`

## Principle Nuance
`lookupItem()` can resolve principle ids inside `threeWays.items[].principles[]`, but the current content flow generally reveals the parent way item, not each principle as a standalone reveal. Prefer editing principles inside the way unless the UX explicitly calls for a principle-level reveal.
