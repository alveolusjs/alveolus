---
code: TST-04
title: Un test suit Arrange, Act, Assert
group: Forme d’un test
scope: [tests]
style: [tactical, transaction-script]
severity: minor
detection: []
review: approved
sources: []
---

# TST-04 · Un test suit Arrange, Act, Assert

<RuleMeta />

## Signal

- Un test qui enchaîne action, vérification, action, vérification : il teste deux choses, et ne dit pas laquelle a échoué.
- Un `expect` qui appelle lui-même la méthode testée : `expect(wallet.debit(…).ok).toBe(false)`.
- Un test sans séparation visible entre ce qu’il prépare, ce qu’il fait et ce qu’il vérifie.
- Une préparation de trente lignes, recopiée de test en test, qui noie le scénario.

## Pourquoi

Un test se lit en trois temps : ce qu’on prépare, le comportement qu’on exerce, ce qu’on vérifie. Quand ces temps sont séparés, le lecteur voit d’un coup d’œil le scénario, et un échec désigne une seule action.

Une seule action par test garde le test centré sur un comportement. Deux actions font deux tests, qui échouent ensemble sans dire lequel des deux comportements a cassé.

## Exceptions

Un test de scénario, qui prouve un enchaînement (bloquer un wallet, puis le débloquer) : l’enchaînement est le comportement testé. Ses actions vont toutes dans Act, et Assert vérifie l’état final.

## Correction

- Trois blocs, dans l’ordre, séparés par une ligne vide : Arrange prépare, Act exerce une seule fois le comportement, Assert vérifie.
- Act range son résultat dans une variable, qu’Assert lit : l’`expect` ne déclenche rien.
- Une préparation longue ou répétée passe dans un helper nommé dans le langage du métier, comme `openWallet('EUR')`, rangé dans le `__test__` du concept (TST-05).

```ts
it('refuses a debit larger than the balance', () => {
	// Arrange
	const wallet = openWallet('EUR');

	// Act
	const debit = wallet.debit(aReference(), euros(2_500n), cashOut, at);

	// Assert
	expect(debit.ok ? undefined : debit.error.type).toBe('InsufficientFunds');
});
```

## Adaptation

**Notre choix** : chaque bloc commence par son commentaire, `// Arrange`, `// Act` et `// Assert`. Ce sont les seuls commentaires d’un test : ils montrent sa forme, et un lint peut la vérifier.

## Voir aussi

TST-02 fait parler le test dans le langage du métier. TST-06 nomme le fichier d’après ce qu’il prouve.
