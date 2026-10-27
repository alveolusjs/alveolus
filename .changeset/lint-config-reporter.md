---
"@alveolus/lint-config": minor
---

Add a dependency-cruiser reporter that prints each violation as oxlint does: the rule, the import framed in its file, and the url of the rule (`--output-type plugin:@alveolus/lint-config/dependency-cruiser-reporter`). An ESLint formatter prints its messages the same way (`--format ./node_modules/@alveolus/lint-config/eslint-formatter.mjs`). The titles of the rules in every message are in English.
