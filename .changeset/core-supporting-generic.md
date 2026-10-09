---
"@alveolus/arch": minor
---

Classify bounded contexts as core, supporting or generic. `subdomains` in `alveolus.config.ts` lists every context under one of the three; a context left out fails the configuration. A core context and the shared kernel are checked by every rule. A supporting or generic context is checked at its boundary only: the `strategic/` and `tooling/` rules apply, the `layers/` and `tactical/` ones do not. `strategic/no-cross-context-import` asks for an anti-corruption layer in a core context only; a supporting or generic context imports the open host service of another context from anywhere.
