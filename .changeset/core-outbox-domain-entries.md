---
"@alveolus/core": minor
---

Breaking: the outbox also keeps domain events. `Outbox` gains `addDomainEvents`, `pendingDomainEvents`, `recordFailure` and `recordDeadLetter`; `StoredEvent` becomes `StoredIntegrationEvent`. `OutboxRelay` becomes `OutboxForwarder`, and its `relay()` becomes `forward()`, as the forwarder of the site's glossary.
