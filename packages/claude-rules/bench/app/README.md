# bank

A small banking backend in NestJS, Prisma and `@alveolus/core`, written with the Alveolus rules.

- `wallets` (tactical, core subdomain): a customer opens a wallet, withdraws money from it, and closes it once its
  balance is zero. Each withdrawal publishes `wallets.wallet.MoneyWithdrawn` through the outbox.
- `notifications` (transaction scripts, supporting subdomain): records a receipt for each withdrawal, and emails it to
  the customer at the address they chose.

`architecture.json` declares the style of each bounded context; `prisma/` holds one schema file per bounded context.
