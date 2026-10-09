---
"@alveolus/arch": minor
---

A `/// <reference path="…" />` or `/// <reference types="…" />` directive and a `declare module "…"` augmentation count as imports, for every rule that checks imports. A reference to a file of another bounded context went unnoticed, and an augmentation of another context's file was only reported in the domain, by `tactical/no-loose-code`.
