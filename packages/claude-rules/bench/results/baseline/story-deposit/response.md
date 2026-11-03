I wrote the design at `docs/designs/deposit-money.md`, in French like the story. `alveolus-claude design check` passes. Its status stays `draft` until you approve it, and I haven't committed it.

## Summary

A customer deposits money on one of their open wallets, and the mobile app shows the new balance right away. Everything happens in `wallets`: the wallet itself refuses a zero amount, a closed wallet or another currency, then raises its balance. The app gives each deposit an identifier and reuses it on every resend. The server records credited deposits, so a resend gets the balance back without being credited twice. A refusal changes nothing, and a failure rolls everything back.

## Decisions to validate (section 4)

- **D-1 / D-2:** the app generates a `depositId` (a UUID) and sends `POST /wallets/{walletId}/deposits` with it in the body. The route answers 200 with the balance, both the first time and on a resend. I rejected `PUT /…/deposits/{depositId}` because HTTP requires 201 on creation and 200 on a replay, so the command would have to report whether it credited.
- **D-3:** `Wallet.deposit` credits the wallet and records `MoneyDeposited`. The wallet is the only aggregate written, and there is no second way to change the balance.
- **D-4 / D-5:** a synchronous event handler writes each credited deposit to a new `wallets.deposit` table, whose primary key is the deposit id. Before crediting, the command looks the id up through a domain port `CreditedDeposits`:
  - same wallet and same amount: it is a resend, so the command succeeds without crediting;
  - anything else: it is refused with `DepositIdAlreadyUsed` (409).

  The primary key is a safety net behind that lookup.
- **D-6:** the balance in the response comes from a new query, `GetWalletBalance`, run after the command, because a command returns nothing but its refusal.
- **D-7:** two simultaneous sends are separated by the wallet's existing version check. The losing request fails, and the app resends it.
- **D-8:** the deposit doesn't check who the caller is, the same as every other wallet route today (W-1).
- **D-9:** no integration event is published for a deposit.
- **D-10:** this departs from the skill's default slicing. All criteria are built layer by layer and the route opens last (I1 domain → I2 application → I3 driven and migration → I4 route and wiring). One increment per criterion after the route would leave a reachable route that credits closed wallets or credits twice.

## Open questions

**For the business**
- **Q-1 (blocking):** where does the money come from, and who confirms it arrived? As the story stands, a deposit creates money. This blocks putting I4 in production.
- **Q-2:** is there a ceiling per deposit or per period? I assumed none.
- **Q-3:** should the customer get a deposit receipt by email? I assumed no.

**For the tech team**
- **Q-4:** should a resend with the same id but a different amount or wallet be refused? I assumed yes, with 409.
- **Q-5 (blocking):** the app has no authentication anywhere. The wallet-opening route even takes `customerId` from the request body.
- **Q-6 (blocking I3):** there are no committed migrations in `prisma/`, so a baseline migration is needed first.
- **Q-7 (blocking I3 and I4):** there is no test infrastructure on a real database: no Testcontainers, no `src/shared/__test__/`, no Vitest projects.
- **Q-8:** a version conflict returns 500 today. I assumed the app resends on any 5xx or timeout.

**On the rules**
- **Q-9:** MSG-05 only covers operations triggered by messages. I assumed it also covers an HTTP resend, with the lookup through a domain port, as in PLC-04's example port `recent-withdrawals.port.ts`.
- **Q-10:** it's unclear whether EVT-07's history writer may also hold the uniqueness PER-03 requires. If so, a key violation stays an exception rather than a refusal.

## Waiver

- **W-1** waives UC-06 and SEC-02, two blocking rules, until a separate authentication task covers every wallet route. What limits the risk: the route only credits, and it doesn't go to production before Q-1 and Q-5 are answered.

Please review the design, and especially Q-1, D-10 and W-1. Once you approve it, I'll set `status: approved` and re-run the check. I'll commit it only if you ask; it should be merged before `/alveolus-implement` starts.
