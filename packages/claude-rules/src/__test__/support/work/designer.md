Working notes for the agents after me.

<!-- slot: summary -->

A customer deposits money into one of their wallets, and the balance grows by the amount. The deposit lives in the wallets bounded context, on the existing wallet. The wallet records each deposit under the identifier the customer sends, so a deposit sent twice is credited once. A closed wallet or an amount that is not positive is refused, and the balance does not change.

<!-- slot: facts -->

| | |
| --- | --- |
| Contexts touched | wallets (a deposit operation on the wallet) |
| Decisions to validate | 2, in part 2 |
| Blocking questions | None |
| Delivery | 4 increments, the HTTP route comes last |

<!-- slot: 14 -->

| # | Context | Increment | Covers | Done when | Safe because | State |
| --- | --- | --- | --- | --- | --- | --- |
| I1 | wallets | Deposit on the wallet | INV-1, INV-2 | T-1 and T-2 pass | Not reachable yet | done |
| I2 | wallets | The deposit command | AC-1, AC-2, AC-3 | T-3 passes | Not reachable yet | todo |
| I3 | wallets | Save deposits | AC-4 | T-4 passes | The migration only adds a table | todo |
| I4 | wallets | The deposit route | AC-1 to AC-4 | T-5 passes | Last increment: the story becomes reachable | todo |

<!-- slot: A -->

### Project artifacts

| Inc. | File | New or changed |
| --- | --- | --- |
| I3 | `prisma/wallets.prisma` | Changed |

### Code

| Inc. | File | New or changed |
| --- | --- | --- |
| I1 | `src/wallets/internal/domain/wallet.aggregate.ts` | Changed |
| I2 | `src/wallets/internal/application/deposit-money.command.ts` | New |
| I3 | `src/wallets/internal/driven/prisma/prisma-wallet.repository.ts` | Changed |
| I4 | `src/wallets/internal/driving/http/wallet.controller.ts` | Changed |
