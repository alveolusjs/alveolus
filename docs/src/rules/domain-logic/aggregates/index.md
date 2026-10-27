---
menu: Vue d’ensemble
---

# Aggregates

Un aggregate est une frontière de cohérence transactionnelle autour de vrais invariants. Ces règles vérifient quatre choses :

- l’aggregate protège ses invariants ;
- il reste petit ;
- il référence les autres aggregates par leur identité ;
- une transaction ne modifie qu’une seule instance.

## En pratique {#in-practice}

Un wallet protège un invariant : son solde ne descend jamais sous zéro. Ce solde est la somme des écritures du journal, et le code ne le modifie jamais. Le wallet vérifie chaque mouvement, puis crée l’écriture que le journal enregistre. Il peut être bloqué au débit, au crédit, ou les deux, par plusieurs blocages à la fois.

```ts
// domain/wallet/wallet.aggregate.ts
export type WalletStatus = 'open' | 'closed';
export type Direction = 'credits' | 'debits';
export type Directions = [Direction, ...Direction[]];
export type WalletEvent = WalletOpened | WalletBlocked | WalletUnblocked | WalletClosed;
// WalletSnapshot: the plain data that toSnapshot() returns to the repository

export class Wallet extends AggregateRoot<WalletId, WalletEvent, WalletSnapshot> {
	readonly #holder: HolderId;
	readonly #account: AccountCode;
	readonly #balance: Money;
	readonly #blocks: Map<string, WalletBlock>;
	#status: WalletStatus;

	// constructor, openFor(id, holder, currency, at), restore(...) and toSnapshot() for the repository

	debit(
		reference: OperationReference,
		amount: Amount,
		to: AccountCode,
		at: Date,
	): Result<LedgerEntry, WalletIsClosed | DebitsBlocked | CurrencyMismatch | InsufficientFunds> {
		if (this.#status === 'closed') {
			return err(new WalletIsClosed(this.id));
		}

		if (this.#isBlocked('debits')) {
			return err(new DebitsBlocked(this.id));
		}

		if (!amount.isIn(this.#balance.currency)) {
			return err(new CurrencyMismatch(this.#balance.currency, amount.currency));
		}

		if (this.#balance.isLessThan(amount)) {
			return err(new InsufficientFunds(this.id));
		}

		const accounts = { debit: this.#account, credit: to };
		const balanceAfter = this.#balance.minus(amount);

		return ok(LedgerEntry.withdrawal(this.id, this.#holder, accounts, reference, amount, balanceAfter, at));
	}

	// credit(reference, amount, from, at): the same checks, on credits, without the balance

	block(reference: BlockReference, directions: Directions, at: Date): Result<void, WalletIsClosed | BlockConflict> {
		if (this.#status === 'closed') {
			return err(new WalletIsClosed(this.id));
		}

		const block = WalletBlock.of(reference, directions);
		const existing = this.#blocks.get(reference.value);

		if (existing) {
			return existing.equals(block) ? ok() : err(new BlockConflict(this.id, reference));
		}

		this.#blocks.set(reference.value, block);
		this.record(new WalletBlocked({ aggregateId: this.id, occurredAt: at, payload: { reference, directions } }));

		return ok();
	}

	// unblock(reference, at) lifts one block; close(at) needs no block left and a zero balance

	#isBlocked(direction: Direction): boolean {
		return [...this.#blocks.values()].some((block) => block.covers(direction));
	}
}
```

Le use case charge le wallet, lui fait créer l’écriture, et la confie au journal :

```ts
// application/wallet/debit-wallet.command.ts
async handle(command: DebitWalletCommand): Promise<Result<void, DebitWalletError>> {
	// walletId, reference, amount and to: the command parsed into value objects

	return this.#unitOfWork.run(async () => {
		const wallet = await this.#wallets.get(walletId);

		if (!wallet) {
			return err(new WalletNotFound(walletId));
		}

		const entry = wallet.debit(reference, amount, to, this.#clock.now());

		if (!entry.ok) {
			return entry;
		}

		const booked = await this.#journal.book(entry.value);

		if (!booked.ok) {
			return booked;
		}

		await this.#outbox.add(this.#translator.translateAll(entry.value.pullDomainEvents()));

		return ok();
	});
}
```

- L’invariant vit dans l’aggregate : un débit ne passe que si le wallet est ouvert, que ses débits ne sont pas bloqués et que son solde le couvre. Sinon, il refuse avec un `Result` (AGG-01).
- Le wallet ne porte pas ses écritures. Son solde est lu, jamais modifié dans le code : c’est le cumul des écritures, tenu à jour en base (AGG-12). Le débit en déduit seulement le solde après le retrait, que l’écriture porte dans `MoneyWithdrawn` (EVT-05).
- Le wallet crée l’écriture sans changer lui-même. Il est seulement lu, et le use case n’enregistre que l’écriture (FAC-01, AGG-06, AGG-07).
- En enregistrant l’écriture, le journal fait avancer le solde et la version du wallet : un cumul tenu à jour et un ordre entre les opérations, pas un état métier. Deux débits simultanés lisent le même solde, et le second échoue sur la version (AGG-15). Une opération rejouée est refusée par la base, qui n’accepte qu’une écriture par référence d’opération (PER-03).
- Les blocages, eux, restent peu nombreux : le wallet les garde tous et ne laisse les lever qu’un par un, par leur référence (AGG-02).
- Le titulaire est référencé par son identité, jamais chargé (AGG-03). C’est lui qui ouvre le wallet (`holder.openWallet()`, FAC-01), et `openFor` n’est appelé que depuis le module `wallet`, qui contient les deux aggregates (FAC-03, PLC-04).
- Le montant, le solde et le blocage sont des value objects, et l’aggregate root a une identité typée (AGG-14, AGG-05).
- Le blocage enregistre un event dans le wallet, l’écriture dans le journal ; le use case les écrit dans l’outbox (EVT-03, MSG-01).

## Règles {#rules}

<RuleTable />
