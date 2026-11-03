---
"@alveolus/claude-rules": minor
---

`alveolus-claude install` also writes the rules by part, in `.claude/alveolus/design/<style>/<part>.md`: strategic design, domain logic, architecture and placement, integration, testing, operations. Each design agent reads the part it decides on. Claude Code never loads these files on its own.
