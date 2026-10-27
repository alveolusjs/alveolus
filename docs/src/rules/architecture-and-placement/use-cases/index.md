---
menu: Vue d’ensemble
---

# Use cases

Un use case est le point d’entrée de l’application pour une opération : il reçoit une command ou une query, vérifie qui peut l’exécuter, charge ce dont il a besoin, laisse le modèle décider, et enregistre. Ces règles le gardent centré sur une seule opération, mince, sécurisé, et indépendant du protocole qui l’appelle. Une command modifie des aggregates, une query lit des views, et ce qu’un écran affiche se calcule hors du domaine. Pas de CQRS : les views lisent les tables des aggregates (CTX-16).

## En pratique {#in-practice}

Débiter un wallet : charger, laisser le modèle décider, enregistrer.

```ts
// application/wallet/debit-wallet.command.ts
async handle(command: DebitWalletCommand): Promise<Result<void, DebitWalletError>> {
	// walletId, reference, amount and to: the command parsed into value objects

	return this.#unitOfWork.run(async () => {
		const wallet = await this.#wallets.get(walletId);

		if (!wallet) {
			return err(new WalletNotFound(walletId));
		}

		const now = this.#clock.now();
		const allowed = await this.#withdrawalLimit.allows(walletId, amount, now);

		if (!allowed) {
			return err(new WithdrawalLimitExceeded(walletId));
		}

		const entry = wallet.debit(reference, amount, to, now);

		if (!entry.ok) {
			return entry;
		}

		const booked = await this.#journal.book(entry.value);

		if (!booked.ok) {
			return booked;
		}

		await this.#outbox.append(entry.value.pullDomainEvents());

		return ok();
	});
}
```

- Une seule opération, reçue dans une command qui porte son nom (UC-01, UC-03). Elle crée une écriture, et ne renvoie aucune view (UC-08).
- Aucun type HTTP ni message : un controller, un job ou un consumer l’appellent de la même façon (UC-02).
- Aucune règle métier : le plafond et le wallet décident (UC-04).
- Deux débits simultanés : le second échoue sur la version du wallet, et le plafond n’est jamais dépassé deux fois (AGG-15, PER-09).
- Un wallet introuvable est un échec explicite (UC-07).
- Le use case ouvre la transaction, et l’écriture est enregistrée avec ses events (REP-13, MSG-01).

Afficher un wallet : la query lit une view, le controller en tire ce dont l’écran a besoin.

```ts
// application/wallet/wallet.view.ts
export type WalletView = View<{
	id: string;
	status: 'active' | 'closed';
	balance: { minor: string; currency: string };
	debitsBlocked: boolean;
}>;
```

```ts
// application/wallet/get-wallet.query.ts
export class GetWalletHandler extends QueryHandler<GetWalletQuery, WalletView, WalletNotFound> {
	readonly #views: WalletViews;

	constructor(views: WalletViews) {
		super();
		this.#views = views;
	}

	async handle(query: GetWalletQuery): Promise<Result<WalletView, WalletNotFound>> {
		// walletId: the query parsed into a value object

		const view = await this.#views.byId(walletId);

		return view ? ok(view) : err(new WalletNotFound(walletId));
	}
}
```

```ts
// driving/http/wallet.representation.ts
export function walletRepresentation(view: WalletView): WalletRepresentation {
	return { ...view, showTopUpBanner: view.balance.minor === '0' };
}
```

- La query lit la view à travers son port, implémenté dans `driven/prisma` sur les mêmes tables. Elle ne charge jamais le `Wallet` (UC-08, UC-09).
- `showTopUpBanner` est un flag de l’écran : le controller le tire de la view, et le domaine ne le porte pas. La règle qui décide si un débit est permis, elle, reste dans `wallet.debit()` (UC-10).
- Pas de CQRS : la view lit les tables des aggregates, à travers son view port (CTX-16).

## Règles {#rules}

<RuleTable />
