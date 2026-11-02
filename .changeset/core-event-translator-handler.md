---
"@alveolus/core": minor
---

Breaking: `EventTranslator` is a synchronous event handler. It takes an `IdGenerator`, the `Outbox` and a `CorrelationContext`; `translate(event)` is protected and returns a list of integration events, empty when the domain event stays inside its bounded context, two during a version migration. `translateAll` and `IntegrationEventContext` are removed: the correlation comes from `CorrelationContext`, whose `Correlation` replaces the context.
