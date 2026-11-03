Working notes.

<!-- slot: summary -->

A customer sets money aside for a goal, follows how far they are, and takes the money back when they want. The goals live in the wallets context, next to the wallet the money comes from. Money set aside leaves the balance the customer can spend, but stays in the wallet. The stories ship in order: create a goal, set money aside, take it back, close the goal.

<!-- slot: facts -->

| | |
| --- | --- |
| Contexts touched | wallets (savings goals) |
| Stories | 3, in section 2 |
| Decisions to validate | 1, in part 2 |
| Blocking questions | None |

<!-- slot: 9 -->

| Order | Story | Why now | Unlocks |
| --- | --- | --- | --- |
| 1 | S-1 | Nothing to set aside without a goal | S-2 |
| 2 | S-2 | The value of the epic | S-3 |
| 3 | S-3 | Money set aside must come back | Closing a goal later |
