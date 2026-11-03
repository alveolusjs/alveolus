---
"@alveolus/claude-rules": minor
---

`/alveolus-design` now runs `alveolus-designer`, which leads the design agents one part after the other, assembles their notes, checks the design and has it reviewed with a fresh eye. It designs a story, a task or an epic: an epic gets a design of its own (`epic-template.md`: its stories, their order, what they share), and each story is then designed with `/alveolus-design <epic design> S-1`. Run on a design with the answers to its questions, it revises only what they touch and adds 1 to `version`. `design check` accepts epic designs, and `/alveolus-implement` refuses them.
