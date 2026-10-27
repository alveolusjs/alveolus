---
"@alveolus/core": minor
---

Breaking: `UnitOfWork` joins the open transaction from a nested `run`, and a nested refusal makes it rollback-only: if the work around it still succeeds, `run` throws `NestedWorkRefused` and rolls back. An adapter now implements `transaction(scope, work)` and `current()` instead of `begin()`, which fits callback transactions such as Prisma's; `Transaction` is removed and `TransactionScope` added.
