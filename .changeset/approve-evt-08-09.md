---
"@alveolus/claude-rules": minor
---

Two rules are approved and ship. EVT-08: a domain event is read only in its bounded context, through a registry typed by its domain events and a dispatcher that is never exported, with no global event bus; another bounded context reacts to the integration event. EVT-09: an event handler does not trigger a chain of event handlers; a sequence the business needs becomes an explicit process.
