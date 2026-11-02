---
"@alveolus/lint-config": minor
"@alveolus/claude-rules": patch
---

ESLint checks EVT-08 with `alveolus/evt-08`: an event handler of `driving` (`*.event-handler.ts`) that imports the `public` folder of its own bounded context reacts to its own published language instead of the domain event. EVT-08 lists ESLint in its detection.
