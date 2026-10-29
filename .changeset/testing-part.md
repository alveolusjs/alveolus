---
"@alveolus/claude-rules": patch
---

The testing rules move to their own part, at `/rules/testing/writing-tests/`. TST-01 to TST-03 are grouped as Principes, TST-04 to TST-06 as Forme, place et nom. TST-01 now asks for the real adapter rather than the real third party: a local server that speaks the provider's protocol in the merge request suite, stubs generated from its committed OpenAPI contract with MSW, contract tests against its sandbox beside it, and one port replaced only to provoke a failure (TST-03). REP-16 points to the disposable database rules. TST-05 and TST-06 place and name the new test files and a provider's stubs and recorded responses, and keep end-to-end rule tests for the rules the domain cannot hold alone.

New rules ship with it: TST-07 and TST-08 (deterministic tests, none disabled or retried), INF-01 to INF-05 (a disposable PostgreSQL built by the migrations, a third party simulated from its pinned OpenAPI contract, contract tests on the consumed fields), and COV-01 to COV-03 (the domain covered at 100 %, a business rule proven at the lowest level that holds it, a command test that checks its events).
