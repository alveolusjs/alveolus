---
menu: Vue d’ensemble
---

# Factories

Une factory method sur un aggregate root crée un autre aggregate. Elle garantit le bon propriétaire, les bonnes associations et les règles de création. Une factory qui traduit des objets venus d’un autre bounded context relève d’ACL-01.

## En pratique {#in-practice}

Un titulaire ouvre un wallet, et un titulaire fermé ou suspendu ne peut pas en ouvrir. La règle appartient au titulaire : la factory method vit donc sur le titulaire. `Wallet.openFor` construit le wallet et enregistre son premier event. Il n’est appelé que depuis le module `wallet`, où vivent les deux aggregates :

```ts
// domain/wallet/holder.aggregate.ts
openWallet(currency: Currency, at: Date): Result<Wallet, HolderIsClosed | HolderIsSuspended> {
	if (this.#status === 'closed') {
		return err(new HolderIsClosed(this.id));
	}

	if (this.#status === 'suspended') {
		return err(new HolderIsSuspended(this.id));
	}

	return ok(Wallet.openFor(this.id, currency, at));
}
```

Le use case charge le titulaire, ouvre le wallet et l’enregistre en base :

```ts
async handle(command: OpenWalletCommand): Promise<Result<WalletId, OpenWalletError>> {
	const holderId = HolderId.of(command.holderId);

	if (!holderId.ok) {
		return holderId;
	}

	const currency = Currency.of(command.currency);

	if (!currency.ok) {
		return currency;
	}

	return this.#unitOfWork.run(async () => {
		const holder = await this.#holders.get(holderId.value);

		if (!holder) {
			return err(new HolderNotFound(holderId.value));
		}

		const wallet = holder.openWallet(currency.value, this.#clock.now());

		if (!wallet.ok) {
			return wallet;
		}

		const saved = await this.#wallets.save(wallet.value);

		if (!saved.ok) {
			return saved;
		}

		await this.#outbox.append(wallet.value.pullEvents());

		return ok(wallet.value.id);
	});
}
```

- Nommée dans le langage, sur l’aggregate qui contrôle la création : un titulaire ouvre un wallet (FAC-01, FAC-02).
- Le constructeur est privé, et `openFor` n’est appelé que depuis son module : il n’y a pas d’autre moyen d’obtenir un nouveau wallet (FAC-03).
- Un second wallet dans la même devise revient de `save` sous forme de refus (REP-03).
- La factory method crée le wallet et enregistre son event, le use case l’enregistre en base (FAC-04).
- Le titulaire est seulement lu, jamais modifié : la transaction ne modifie toujours qu’un seul aggregate (AGG-06, AGG-07).

## Règles {#rules}

<RuleTable />
