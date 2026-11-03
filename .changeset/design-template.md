---
"@alveolus/claude-rules": minor
---

`/alveolus-design` writes a design from a fixed template, for a user story or a task: the need, what to validate (decisions, open questions by audience), the design and the increments, each element defined once and cited by its identifier. `alveolus-claude design check <design>` checks it without AI: sections present, identifiers defined, every acceptance criterion and invariant proven by a test, every decision with a reason, every increment safe to merge, the rules cited approved, and the Mermaid diagrams when `mermaid` and `happy-dom` are installed. `/alveolus-implement` and `/alveolus-review` read the new format: an increment is a row of section 14 whose state goes from `todo` to `done`, and its files are in appendix A. Designs written with an earlier version keep their old format: write them again with `/alveolus-design` before implementing their next increment.
