---
"@alveolus/claude-rules": patch
---

Drop the detection mode from the rules: each rule now carries an empty `detection` list, filled when a check automates it, one rule at a time.
