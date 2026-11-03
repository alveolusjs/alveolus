I wrote the design to `docs/designs/large-withdrawal-alert.md`, and `alveolus-claude design check` passes. It stays a `draft` until you approve it. Nothing is committed.

## Summary

A customer can set an alert threshold on each of their wallets, change it and remove it. The threshold is stored on the wallet, in the wallet's currency. When a withdrawal is strictly above it, the wallet records a "large withdrawal" in the same transaction as the withdrawal. Notifications receives that fact as a new message and emails the alert, with the wallet, the amount and the date, alongside the receipt the customer already gets. If the email server or the app is down, the alert waits and is sent on the next run.

- **Contexts:** wallets (core, tactical) and notifications (supporting, transaction scripts). They connect through a new published message, `wallets.wallet.LargeWithdrawalMade` v1. `MoneyWithdrawn` v1 is unchanged, so the receipt is unaffected.
- **Delivery:** 7 pull requests. The routes that let a customer set a threshold come last, so no threshold can exist before every piece that turns it into an email is already in production.

## Decisions to validate (section 4)

| | Decision |
|---|---|
| D-1 | The threshold belongs to the wallet, not to notifications. Only the wallet knows its currency and owner, and it compares in the same transaction as the withdrawal. |
| D-2 | A separate published fact, `LargeWithdrawalMade`, rather than a flag added to `MoneyWithdrawn`. |
| D-3 | The alert is a new kind of pending notification, sent by the existing scheduler, not emailed straight from the consumer. |
| D-4 | A threshold in another currency than the wallet's is refused. |
| D-5 | Removing a threshold that isn't set succeeds and records nothing. |
| D-6 | The message carries only the wallet, the customer and the amount. The date comes from the message envelope. |
| D-7 | Alerts reuse the `notification` table. It gets two new optional columns, and `balance` becomes optional, with a check per kind so each row stays complete. |
| D-8 | `PUT` and `DELETE /wallets/{id}/alert-threshold`. |

## Open questions (section 5)

**For the business**
- **Q-1 (blocks the email template):** wallets have no name, so how should the email name the wallet? I assumed its currency plus its id.
- **Q-2 (blocks the email template):** which time zone and format for the date? I assumed UTC, to the minute.
- **Q-3:** is "within a minute" a commitment we monitor? I assumed yes: the sending interval is 30 seconds or less, and an alert still pending after 60 seconds triggers an operations alert.
- **Q-4:** if the customer has no email address, should an alert still go out days later, once they add one? I assumed yes, as the receipt does today.
- **Q-5 (blocks the domain):** is a zero threshold allowed, to get an alert on every withdrawal? I assumed yes.
- **Q-6 (blocks the domain):** can a closed wallet's threshold be set or removed? I assumed no.
- **Q-7:** should the customer be told when a threshold is removed? Someone else could remove it to hide a withdrawal. I assumed not in this story.

**For the tech team**
- **Q-8 (blocks the routes):** no route in the app checks who is calling, so nothing checks that the wallet belongs to the caller. See W-1 below.
- **Q-9 (blocks I3–I5):** the repo has no `prisma/migrations` folder. I assumed a baseline migration, marked as already applied in production.
- **Q-10 (blocks I3):** the app has no integration or end-to-end test setup. I assumed the CI can run Docker, so the tests can start PostgreSQL and Mailpit with Testcontainers. I3 adds this setup.
- **Q-11:** an existing problem that threatens the one-minute target. Notifications without an email address stay pending forever, and each run only reads the 100 oldest pending ones. Once 100 of them pile up, nothing newer is sent, alerts included. I left it to a separate task.
- **Q-12:** the outbox forwarder's polling interval isn't in the repo. I assumed a few seconds.

**On the rules:** Q-13 to Q-15 don't block anything. They cover:
- `send` now picks the email by notification kind (TXS-08).
- There is no context map or glossary file (MAP-01, CTX-03).
- The published contracts are TypeScript types only (PUB-01).

## Waiver

**W-1 on UC-06 and SEC-02 (both blocking rules):** the threshold routes can't check that the caller owns the wallet, because the app has no authentication at all. Today, even withdrawals are unauthenticated. What limits the risk:
- These routes change an alert setting, never money.
- The alert goes only to the address the wallet's owner set.

ADR-1 records this until an authentication story lands. It's your call whether to accept the waiver or to require authentication first.

Please review the decisions, answer the blocking questions and accept or reject W-1. I'll then revise the design (version 2) and set it to `approved` once the check passes.
