I wrote the design for the wallet-list task and it passes `alveolus-claude design check`. It's in `docs/designs/wallet-customer-index.md`, status `draft`. I haven't committed it.

Before the design, two things you should know: this repository has no code that lists a customer's wallets, and it has no database migrations at all. Both shape the plan.

## Summary

The list is slow because nothing indexes the customer column, so the database reads every wallet to find one customer's. The fix is one index on the customer column of the wallet table, in the `wallets` context. It doesn't change what the list returns, and it's built without blocking withdrawals. Because there is no migration history yet, a first step records the current schema, and the index then comes as a migration on top of it. If the index fails to build, the deploy stops before the new version starts and the running version keeps serving.

**Delivery:** two increments.
- **I1:** a starting migration that matches today's schema (`0_init`), plus a throwaway test database built from the migrations.
- **I2:** the index, its migration, and its tests.

## Decisions to validate

| | Decision |
| --- | --- |
| D-1 | One index on the customer column only (`@@index([customerId])`). A combined index would be guessing at a query we can't see. |
| D-2 | Build the index with `CREATE INDEX CONCURRENTLY`, alone in its migration file. A plain `CREATE INDEX` would block every withdrawal, opening and closing while it builds. |
| D-3 | No `IF NOT EXISTS`. If a build fails, the operator drops the broken index, marks the migration rolled back, and deploys again. |
| D-4 | Create the starting migration first. Without it, Prisma's first migration would try to recreate every table and fail on every existing database. This needs an ADR (ADR-1). |
| D-5 | Leave the list itself unchanged, and add no new list query to the code. |
| D-6 | Test with 100,000 other wallets and check which plan PostgreSQL actually chooses, not just that the index exists. |

## Open questions

**Blocking, for the tech team:**
- **Q-3:** Where does the list call actually run? It isn't in this repository. If it reads the wallet table from another context, that's a separate problem.
- **Q-4:** How does the schema reach production today, and does the deploy run `prisma migrate deploy`? I've assumed it was created with `prisma db push`.

**Other tech:** Q-5 asks how many wallets production holds, which PostgreSQL version it runs, and whether the CI can run Docker. The test database needs the version and Docker.

**Business:** Q-1 asks what response time counts as "fast" (it sets the alert threshold). Q-2 asks how many wallets one customer can hold (it confirms D-1).

**Rules:** Q-6 asks where the index test should live and what to name it, since no code in the repository runs the read. I've assumed `wallets-schema.integration-spec.ts`, next to the existing Prisma repository.

## Waivers

None.

One thing to watch during implementation: PostgreSQL refuses `CONCURRENTLY` inside a transaction, so the migration relies on Prisma running a one-statement file outside one. I haven't confirmed that yet, but the I2 tests build their database through `prisma migrate deploy`, so they would fail if it doesn't hold.

Please review the decisions and answer the questions. Once you approve, the design goes to `approved` and can be merged before any code.
