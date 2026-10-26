---
"@alveolus/core": minor
---

Breaking: the outbox is append-only, as MSG-02 and MSG-03 say. `Outbox.markPublished` is gone: `pending(after, limit)` reads the stored events after a sequence number, in order, and `OutboxRelay` records the last published sequence of its channel with `recordPublished(channel, sequence)`, read back with `lastPublished(channel)`. `OutboxRelay` takes its channel before its batch size.
