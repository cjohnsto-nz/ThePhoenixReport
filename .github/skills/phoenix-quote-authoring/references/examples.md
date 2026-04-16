# Quote Examples

## Example: Bill after Steve talks him into the job

This example captures Bill's immediate reaction after Steve persuades him to take the VP of IT Operations role.

### Character entry

```yaml
  - id: bill-palmer
    quotes:
      - id: bill-talked-into-job
        text: "I can't believe it. He just talked me into taking a new job I don't want. How did that happen?"
```

### Timeline reveal

Place the quote immediately after Bill's character reveal in `segment-1`, because the quote works as Bill's reaction to the promotion and frames him as a reluctant hero before the bigger crises stack up.

```yaml
        - type: quote
          id: bill-talked-into-job
          modalStep:
            name: "Bill realizes what just happened"
            script: "Immediately after Steve talks him into the role, Bill gives us the emotional truth of the promotion: he did not chase this job, he was pulled into it by duty and pressure."
          globalStep:
            name: "Reluctance becomes responsibility"
            script: "That beat matters because it frames Bill as a reluctant hero. He accepts the job before he knows how broken the system is, which makes every later decision heavier."
```

### Why this placement works

- The audience has just met Bill.
- The quote sharpens Bill's emotional state before Phoenix, payroll, Brent, and the audit widen the scope.
- The quote adds tone without needing to persist in the org chart.

## Prompt examples

- Add a Brent quote when the team realizes everything depends on him.
- Move Bill's promotion reaction quote later if you think it lands better after payroll becomes visible.
- Draft three quote options for Patty when she starts making work visible, then insert the strongest one into the timeline.