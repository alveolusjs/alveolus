---
"@alveolus/lint-config": minor
---

Breaking: the oxlint config is replaced by an ESLint config, `@alveolus/lint-config/eslint`, which needs `eslint` and `typescript-eslint`. Replace `oxlint.config.mts` with an `eslint.config.mjs` that spreads it, and `oxlint-disable` waivers with `eslint-disable`.
