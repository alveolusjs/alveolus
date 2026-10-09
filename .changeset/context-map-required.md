---
"@alveolus/arch": minor
---

The context map is required, and reads as sentences. `contextMap` in `alveolus.config.ts` lists every bounded context with the contexts it consumes: `{ ledger: { consumes: [] }, payments: { consumes: ["ledger"] } }`. A context left out, a context that consumes itself or a cycle fails the configuration. `strategic/no-unmapped-context` no longer has a mode without a map, and tells to reverse a dependency before adding it to the map. To migrate, turn `{ payments: ["ledger"] }` into `{ ledger: { consumes: [] }, payments: { consumes: ["ledger"] } }`, and add `consumes: []` for each context the old map left out.
