# Bench · baseline

Model: opus. Judge: the same model, with `rubric.md`.

| Ticket | Check | fidelity | questions | rules | reuse | coherence | proportion | readability | Mean | Verdict | Cost ($) | Minutes | Subagents |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| epic-monthly-statements | no design | 0.85 | 0.80 | 0.85 | 0.90 | 0.75 | 1.00 | 0.85 | 0.86 | approve | 3.75 | 2.3 | 0 |
| epic-savings-goals | no design | 0.80 | 0.80 | 0.75 | 0.80 | 0.75 | 0.95 | 0.85 | 0.81 | approve | 2.21 | 2.1 | 0 |
| story-deposit | passed | 0.85 | 0.90 | 0.80 | 0.95 | 0.75 | 0.80 | 0.80 | 0.84 | approve | 7.38 | 15.2 | 0 |
| story-large-withdrawal-alert | passed | 0.90 | 0.90 | 0.85 | 0.95 | 0.80 | 0.75 | 0.80 | 0.85 | approve | 6.93 | 12.8 | 0 |
| task-close-reason | passed | 0.80 | 0.80 | 0.80 | 0.90 | 0.80 | 0.55 | 0.75 | 0.77 | approve | 5.75 | 13.4 | 0 |
| task-wallet-customer-index | passed | 0.85 | 0.80 | 0.80 | 0.90 | 0.75 | 0.60 | 0.85 | 0.79 | approve | 2.68 | 6.3 | 0 |
| **All** | 4/6 passed | 0.84 | 0.83 | 0.81 | 0.90 | 0.77 | 0.77 | 0.82 | 0.82 | 6 approved | 28.70 | 52.2 |  |

## epic-monthly-statements

- Proposed split: the PDF renderer that both S3 and S4 need belongs to no story, yet S3 and S4 are called independent, so whichever ships first silently takes on the renderer and its PDF library choice (only S3 is said to be blocked by it).

- Open questions: S2 does not ask when the last statement of a closed wallet is issued (at closing or on the first of the next month), although the ticket leaves this open.

- Order: the rule that 'T1 must be in production a full month before the first statement' is stricter than needed, because every wallet balance is zero until deposits (S0) exist, so T1 shipped before or with S0 already gives a complete history.

- Open questions: the deposits, authentication and PDF-library questions have no working assumption, so S0, S4 and S3 are blocked with no default to plan against.

- Proposed split: S3 spans wallets (published event, PDF through the facade) and notifications (consumer, a new notification kind, a schema change for the non-null `amount` and `balance`), so it would be better split upstream first, and nothing says what happens when building or sending a statement fails.

## epic-savings-goals

- "Ce qui guide ce découpage": the default flow (debit the source, credit the target by a domain event, refund the source if the target refuses) is a multi-step compensating process, yet it plans no process identity, tracking or failure path (PRC-05). The refund is also a second handler in a chain (EVT-09), and nothing makes the credit idempotent (MSG-05).

- S3/S4 order: S3 announces that refused money returns to the source wallet, but the Wallet credit operation only arrives in S4, so the order does not support S3's failure path as written.

- Missing question: no wallet can receive money today (no deposit), so S3 cannot be used by a real customer; the answer spots the missing credit but never asks whether a deposit is a prerequisite or out of scope.

- "Mettre de côté n'est pas un retrait": it settles without a question that the set-aside money leaves the wallet balance (rather than staying in the wallet as a reservation) and that the customer gets no receipt for it.

- Q-7 and the ownership check: an ownership check on identifiers taken from the request does not meet SEC-02 or UC-06, both blocking rules, yet the assumption that authentication stays outside the epic is not proposed as a waiver.

## story-deposit

- §14 Incréments: I2 merges UC:DepositMoney and its replay logic with no test ('Fini quand' is only lint and typing), while I4 claims the lower layers are already tested; build driven before application, or fold I2 into I4 so the command arrives with T-14 and T-16.

- D-2 promises that a resend 'reçoit la même réponse que l'envoi perdu', but D-6 and QRY:GetWalletBalance return the balance read after the command, so a resend after any other operation shows a different balance; either say so or keep the post-deposit balance (already in EVT:MoneyDeposited) in TBL:wallets.deposit and return it.

- D-4 and Annex B justify TBL:wallets.deposit with 'L'historique des dépôts compte pour le métier' and ENT-17, but the ticket never says this, and ENT-17 stays a question until the business names the history it wants; the real reason is crediting a deposit only once, and the design should say so or ask.

- §15 T-14 to T-16: the file `__test__/rules/deposit-credited-once.e2e-spec.ts` does not follow TST-06's `<rule code>-<rule name>` naming for rule tests, and INV-5 has no rule code to give it.

- §1 'Ce qui existe déjà' and the Résumé, written for the business, rely on repository, version check, outbox, query, view port and migration jargon a business reader cannot check.

## story-large-withdrawal-alert

- Section 14, I2: the two new use cases merge with only 'type check and lint green', and their tests wait until I7, so this increment ships untested code; put it after I3/I4 with an integration test, or merge it into I7.

- Section 13 and Q-3: the operations alert for an alert still pending after 60 s, and the sending interval of 30 s or less, are promised 'from I6 on', but no increment, file (notifications.config.ts, monitoring) or test delivers them.

- Section 5, 'On the rules' (Q-14, Q-15): publishing LargeWithdrawalMade v1 without a documented schema (PUB-01) and without a context-map update (MAP-01) deviates from two major rules, and the design records this as non-blocking questions instead of waivers.

- Summary table: the 'Blocking questions' line leaves out Q-4 (blocks I5) and Q-3 (blocks section 13), which contradicts the Blocks column of section 5.

- Part 2, D-6 and D-7: these are storage and messaging choices (envelope date, nullable balance, per-kind checks) placed in the part the business validates, in wording a business reader cannot judge; move them to part 3 or reword them as their business effect.

## task-close-reason

- Proportion, D-5, D-10, I6: a ticket typed as a technical task becomes a 6-increment story with a reason that is optional and then mandatory, two weeks of production log monitoring and 16 tests, when the answer to Q-5 could make the reason mandatory from I4.

- Q-8 and API:CloseWallet: I4 changes the closure route but leaves it without authorization, against the blocking rule UC-06, so any caller can record « par la banque »; this should be a waiver with its reason, not an open question next to « Waivers : aucun ».

- I5 and Q-6: the support's read of the wallet, the point of the ticket, waits on an authentication story that exists nowhere and has no owner, and the design names neither who delivers it nor a temporary fallback.

- Partie 2: D-2, D-6, D-7 and D-9 are given to the business to validate, but they are written in technical terms (value object, view, driving, integration event) that a business reader cannot judge.

- Summary table and section 15: « Métier : Q-1 à Q-4, à confirmer avant I1 » contradicts Q-3 (blocks I4) and Q-4 (blocks I3, I5), and T-4, a domain unit test, cannot prove AC-6, where the support reads an open wallet with 12,50 €.

## task-wallet-customer-index

- I1 bundles an app-wide prerequisite into a one-index task: the 0_init baseline over wallets, notifications and outbox, the Testcontainers/Vitest infrastructure and ADR-1 on how every context deploys; it should be its own prerequisite task, since it changes the deploy of all contexts and depends entirely on Q-4.

- The summary table, the front matter `contexts` and I1's Context column name only `wallets`, yet 0_init baselines the notifications (transaction-script) and outbox schemas and I1 adds `src/shared/__test__/`, and the notifications rules are never consulted.

- Q-5 says it blocks I1 (CI Docker, the production PostgreSQL version for the container), but the summary lists only Q-3 and Q-4 as blocking.

- Appendix B stretches CTX-09 (an index name is not model vocabulary) and REP-16 (T-3's read by customer is a raw query in the test, not a repository finder), and T-1's `migrations.integration-spec.ts` does not follow TST-06's <tested file> naming, unlike the case raised in Q-6.

- T-2 asserts the plan scans `wallet_customer_id_idx`, without saying that an Index Scan and a Bitmap Index Scan both count, which leaves the TST-07 determinism of the plan check fragile.