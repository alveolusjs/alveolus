---
menu: Vue d’ensemble
---

# Tests

Les tests prouvent ce que le code promet, dans le langage du métier, sur une vraie infrastructure et depuis les vrais modules de l’application. Ils vivent à côté de ce qu’ils prouvent, et le nom de leur fichier dit s’ils sont unitaires, d’intégration ou end-to-end. Les tests propres aux value objects, aux domain services ou aux repositories restent dans leurs thèmes.

## En pratique {#in-practice}

Les refus du wallet, testés en mots simples :

```ts
// openWallet(currency) opens a wallet for an active holder, with a zero balance
// euros() and dollars() build an Amount, aReference() an OperationReference, cashOut is an AccountCode

describe('Wallet', () => {
	it('refuses a debit larger than the balance', () => {
		// Arrange
		const wallet = openWallet('EUR');

		// Act
		const debit = wallet.debit(aReference(), euros(2_500n), cashOut, at);

		// Assert
		expect(debit.ok ? undefined : debit.error.type).toBe('InsufficientFunds');
	});

	it('refuses a debit in another currency', () => {
		// Arrange
		const wallet = openWallet('EUR');

		// Act
		const debit = wallet.debit(aReference(), dollars(500n), cashOut, at);

		// Assert
		expect(debit.ok ? undefined : debit.error.type).toBe('CurrencyMismatch');
	});

	it('refuses a debit once its debits are blocked', () => {
		// Arrange
		const wallet = openWallet('EUR');
		wallet.block(aBlockReference(), debitsOnly, at);

		// Act
		const debit = wallet.debit(aReference(), euros(100n), cashOut, at);

		// Assert
		expect(debit.ok ? undefined : debit.error.type).toBe('DebitsBlocked');
	});
});
```

- Le domaine n’a besoin d’aucune infrastructure : le test construit des valeurs et appelle le modèle, sans mock ni module (TST-01, TST-03).
- Chaque test se lit comme une phrase du métier (TST-02), et suit Arrange, Act, Assert : une seule action, dont Assert lit le résultat (TST-04).
- Le solde ne bouge que par le journal, en base : un débit accepté se teste au niveau de l’application, sur la vraie base (TST-01).
- Le fichier est `domain/wallet/__test__/wallet.aggregate.spec.ts` : à côté du wallet, nommé d’après ce qu’il teste, et `.spec.ts` pour un test unitaire (TST-05, TST-06).

## Règles {#rules}

<RuleTable />
