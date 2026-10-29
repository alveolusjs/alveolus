---
menu: Vue d’ensemble
---

# Écrire un test

Un test prouve ce que le code promet, dans le langage du métier, sur une vraie infrastructure et depuis les vrais modules de l’application. Il vit à côté de ce qu’il prouve, et le nom de son fichier dit s’il est unitaire, d’intégration ou end-to-end. Il donne le même résultat à chaque run, et n’est jamais désactivé. Les tests propres aux value objects, aux domain services ou aux repositories restent dans leurs thèmes.

Ce sur quoi il tourne relève de l’[Infrastructure de test](../test-infrastructure/) (INF), et ce qu’il doit prouver de [Couverture et preuves](../coverage/) (COV).

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

- Le domaine n’a besoin d’aucune infrastructure : le test construit des valeurs et appelle le modèle, sans mock ni module (TST-01, TST-03). L’instant `at` est fourni par le test, jamais lu sur l’horloge (TST-07).
- Chaque test se lit comme une phrase du métier (TST-02), et suit Arrange, Act, Assert : une seule action, dont Assert lit le résultat (TST-04).
- Chaque refus a son test unitaire : le domaine est couvert en entier par ses `.spec.ts` (COV-01).
- Le solde ne bouge que par le journal, en base : un débit accepté se teste au niveau de l’application, sur la vraie base (TST-01, INF-01).
- Le fichier est `domain/wallet/__test__/wallet.aggregate.spec.ts` : à côté du wallet, nommé d’après ce qu’il teste, et `.spec.ts` pour un test unitaire (TST-05, TST-06).

## Règles {#rules}

<RuleTable />
