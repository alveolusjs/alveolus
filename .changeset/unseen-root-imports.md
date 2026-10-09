---
"@alveolus/arch": minor
---

A file the analysis does not see (ignored, unresolved, computed at runtime, or outside the declared contexts and the shared kernel) can no longer relay another bounded context. An ignored `wiring.fixture.ts` that re-exported another context carried the import past every rule. `layers/no-outward-import` now reports such an import from a composition root or a file at the root of `src/`, and `strategic/no-cross-context-import` reports it from any file of a context, whatever its subdomain, or of the shared kernel. To fix it, move the file into a context, the shared kernel or a package, or record it in the baseline.
