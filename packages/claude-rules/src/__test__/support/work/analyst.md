Working notes for the agents after me.

<!-- slot: 1.story -->

As a customer, I want to deposit money into my wallet, so that I can spend it later.

<!-- slot: 2 -->

Alice owns the open wallet W1, with a balance of 100.00 EUR.

| ID | Given | When | Then |
| --- | --- | --- | --- |
| AC-1 | | Alice deposits 50.00 EUR into W1 | The balance of W1 is 150.00 EUR |
| AC-2 | | Alice deposits 0.00 EUR into W1 | The deposit is refused with ERR:InvalidAmount, the balance stays 100.00 EUR |
| AC-3 | W1 is closed | Alice deposits 50.00 EUR into W1 | The deposit is refused with ERR:WalletClosed, the balance stays 100.00 EUR |
| AC-4 | Alice deposited 50.00 EUR with deposit id d-1 | Alice sends deposit d-1 again | The balance stays 150.00 EUR and the answer is the same |

<!-- slot: 3 -->

Deposits in another currency than the wallet's. Fees.

<!-- slot: questions.business -->

| Q-A1 | Is there a maximum amount for one deposit? | No maximum | AC-2 |
