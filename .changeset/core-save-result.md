---
"@alveolus/core": minor
---

Breaking: `CommandRepository.save` returns `Promise<Result<void, Refusal>>`, as REP-03 says. `CommandRepository<Aggregate, Refusal>` takes the uniqueness refusals the storage enforces, `never` by default; a repository without one returns `ok()`.
