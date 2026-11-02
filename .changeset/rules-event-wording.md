---
"@alveolus/claude-rules": patch
---

The examples call `dispatch` once, after `save`, instead of adding translated events to the outbox, and the command handlers of the wiring rules take the dispatcher of their bounded context. Where a rule meant one kind of event, it now says domain event or integration event, and an event handler or a consumer instead of a handler or a subscriber.
