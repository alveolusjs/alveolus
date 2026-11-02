---
"@alveolus/lint-config": minor
"@alveolus/claude-rules": minor
---

A bounded context holds three folders: `composition/` (its module, its config, and the `*.composition.ts` pieces of a module that grows), `internal/` (its layers: `domain`, `application`, `driving`, `driven`) and `public/`. `shared` keeps its layers and moves its module and config into `composition/`. The ESLint and dependency-cruiser configs and the path scopes of the installed rules only match this layout: move each layer folder under `internal/` and the module and config under `composition/` when upgrading. The pieces of a module are named `*.composition.ts`, no longer `*.wiring.ts`.
