---
"@alveolus/core": minor
---

Breaking: `AggregateRoot` takes its events and its snapshot as required type parameters (`never` when it records none), and declares `toSnapshot()`. `Entity` loses its snapshot: an inner entity is written through the snapshot of its aggregate. `AnySnapshot` and `SnapshotValue` are still exported.
