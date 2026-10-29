---
menu: Vue d’ensemble
---

# Couverture et preuves

Ces règles disent ce que les tests doivent prouver. Le domaine est couvert en entier par ses tests unitaires. Chaque règle métier se prouve là où elle vit, par ce qu’elle accepte et ce à quoi elle résiste : le plus souvent dans un test unitaire. Une commande prouve aussi les events qu’elle publie.

## En pratique {#in-practice}

Le blocage d’un wallet, prouvé par l’état et par l’event :

```ts
// openWallet(currency) and aClosedWallet(currency) build a wallet whose own events are already pulled

describe('Wallet', () => {
	it('records the block of its debits', () => {
		// Arrange
		const wallet = openWallet('EUR');
		const reference = aBlockReference();

		// Act
		const blocked = wallet.block(reference, debitsOnly, at);

		// Assert
		const events = wallet.pullDomainEvents().map((event) => [event.type, event.payload]);
		expect(blocked.ok).toBe(true);
		expect(events).toEqual([['WalletBlocked', { reference, directions: debitsOnly }]]);
	});

	it('refuses to block a closed wallet, and records nothing', () => {
		// Arrange
		const wallet = aClosedWallet('EUR');

		// Act
		const blocked = wallet.block(aBlockReference(), debitsOnly, at);

		// Assert
		expect(blocked.ok ? undefined : blocked.error.type).toBe('WalletIsClosed');
		expect(wallet.pullDomainEvents()).toEqual([]);
	});
});
```

- Le succès et le refus ont chacun leur test unitaire : ces branches de `block` sont couvertes sans démarrer l’application (COV-01).
- Le test vérifie l’event enregistré, son type et son contenu, et qu’un refus n’en enregistre aucun (COV-03).
- Le wallet tient seul la règle « un wallet fermé ne change plus » : son test unitaire suffit, sans test end-to-end (COV-02).

## Règles {#rules}

<RuleTable />
