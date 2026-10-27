---
"@alveolus/core": minor
---

Breaking: a `DomainEvent` has no id, and its `type` is the name of its class. The `EventTranslator` takes an `IdGenerator` and gives each integration event its id; `translateAll` translates the events of a call under one correlation.
