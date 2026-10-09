---
"@alveolus/arch": minor
---

New rule `strategic/no-shared-state`, reported as an error: a static field of the shared kernel without `readonly`, or holding a collection (a `Map`, a `Set`, a mutable array, an index signature, an object literal). A `ServiceRegistry` in the shared kernel let two contexts call each other with no import and no line in the context map. Constants such as `static readonly ZERO = new Money(…)` stay allowed.
