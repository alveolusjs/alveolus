---
"@alveolus/claude-rules": minor
---

The rules tell a domain event from an integration event. A domain event stays in its bounded context; the use case calls `dispatch` once, after `save`, and each event handler declares whether it runs in the transaction of the use case or after the commit. EVT-07 now says what a synchronous event handler may do: translate into an integration event, update a read projection, or write an audit trail. AGG-08, EVT-03, MSG-01, MSG-03, MSG-04, PLC-08, UC-04 and PUB-04 follow this model; PLC-03 adds the `.event-handler` role and drops `.listener`; AGG-09 and EVT-05 let other bounded contexts read the integration event only; ENT-17 keeps the history through a synchronous audit event handler. Two new rules, EVT-08 (a domain event is read only in its bounded context) and EVT-09 (no chain of event handlers), ship once they are approved.
