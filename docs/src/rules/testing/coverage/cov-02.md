---
code: COV-02
title: Une règle métier se prouve là où elle vit
group: Preuves
scope: [tests]
style: [tactical, transaction-script]
severity: minor
detection: []
review: approved
sources: []
---

# COV-02 · Une règle métier se prouve là où elle vit

<RuleMeta />

## Signal

- Une règle métier documentée dont aucun test ne porte le nom.
- Une règle testée seulement quand elle accepte, ou seulement quand elle refuse.
- Un test end-to-end qui rejoue un refus que l’aggregate tient seul.

## Pourquoi

Prouver une règle, c’est montrer ce qu’elle accepte et chaque façon de la casser. La plupart des règles vivent dans l’aggregate : son test unitaire les prouve vite. Les rejouer de bout en bout ralentit la suite sans rien prouver de plus. Seules les règles que le domaine ne tient pas seul ont besoin de l’application entière.

## Exceptions

Aucune.

## Correction

- Un `describe` au nom de la règle, avec un bloc `holds` (ce qu’elle accepte) et un bloc `resists` (un test par façon de la casser).
- Dans le test unitaire de l’objet qui tient la règle, ou dans le test d’intégration d’un transaction script.
- En end-to-end, dans `__test__/rules/` (TST-05), seulement quand la base, la concurrence, l’idempotence ou plusieurs aggregates tiennent la règle.

## Voir aussi

COV-01 couvre le domaine. TST-06 nomme les fichiers de test.

## Exemple

```ts
describe('WAL-03 · a balance never goes negative', () => {
	describe('holds', () => {
		it('accepts a debit that empties the wallet', () => {
			// Arrange
			const wallet = aWalletWith(euros(1_000n));

			// Act
			const debit = wallet.debit(aReference(), euros(1_000n), cashOut, at);

			// Assert
			expect(debit.ok).toBe(true);
		});
	});

	describe('resists', () => {
		it('a debit one cent above the balance', () => {
			// Arrange
			const wallet = aWalletWith(euros(1_000n));

			// Act
			const debit = wallet.debit(aReference(), euros(1_001n), cashOut, at);

			// Assert
			expect(debit.ok ? undefined : debit.error.type).toBe('InsufficientFunds');
		});
	});
});
```

Le wallet tient seul cette règle : son test unitaire suffit. Deux débits concurrents, eux, demandent un test end-to-end (AGG-15).
