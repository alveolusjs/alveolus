---
"@alveolus/core": minor
---

Add the domain event dispatcher. A bounded context declares its event handlers in a `DomainEventHandlers` registry, typed by the union of its domain events: each entry is `[event class, event handler class, 'sync' | 'async']`, an event handler registered on an event it does not read does not compile, and an event registered `'async'` must have `toSnapshot()` and a static `fromSnapshot()`. The use case calls `DomainEventDispatcher.dispatch(events)` once, after `save`: the synchronous event handlers run in its transaction, and each event that has an asynchronous one is written to the outbox. `DomainEventForwarder` then delivers it to each asynchronous event handler, in a transaction that also moves that handler's position, retries a failure up to a limit, and moves the entry to the dead letters beyond it. `CorrelationContext` carries the correlation of the operation, so the use case never sees it.
