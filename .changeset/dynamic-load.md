---
"@alveolus/arch": minor
---

Code loaded at runtime counts as an import the analysis does not see, refused in every file: an import of `node:module` (`createRequire`) or `node:vm`, `module.require`, `process.getBuiltinModule`, `eval`, `Function` and `new Function`. `createRequire(import.meta.url)` in an adapter, or `new Function("s", "return import(s)")` in the domain, loaded another context with no rule noticing. `strategic/no-cross-context-import` reports it in any context, `layers/no-outward-import` from a file at the root or a composition root. To read a JSON file, import it with `with { type: "json" }`.
