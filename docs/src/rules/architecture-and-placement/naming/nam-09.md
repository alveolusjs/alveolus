---
code: NAM-09
title: "Un champ privé s’écrit `#`, déclaré dans le corps de la classe"
group: Membres de classe
scope: [domain, application, driving, driven]
style: [tactical, transaction-script]
severity: minor
detection: []
review: to-review
sources: []
---

# NAM-09 · Un champ privé s’écrit `#`, déclaré dans le corps de la classe

<RuleMeta />

## Signal

- Un champ ou une méthode marqués `private` (`private readonly wallets: WalletRepository`).
- Une parameter property : `constructor(private readonly wallets: WalletRepository)`, ou un paramètre marqué `readonly`, `public` ou `protected`.

## Pourquoi

`private` n’existe qu’à la compilation. Une fois le code compilé, le champ est public : `wallet['balance']`, un spread ou un `JSON.stringify` le lisent, et un test peut le modifier. Un champ `#` est privé pour JavaScript lui-même : personne hors de la classe ne le lit ni ne l’écrit, même par erreur.

Une parameter property cache un champ dans la liste des paramètres. Le lecteur ne voit pas l’état de la classe en tête de son corps. Elle n’est pas non plus de la syntaxe effaçable : Node qui retire les types, ou TypeScript avec `erasableSyntaxOnly`, la refusent.

Un seul style rend la règle vérifiable : tout champ privé est `#`, et il est `readonly` dès qu’il ne change plus après la construction.

## Exceptions

- Un champ que le framework lit par son nom, comme une propriété décorée (`@Inject()` sur une propriété) : les decorators de NestJS ne voient pas les champs `#`. Préférer l’injection par le constructeur (WIR-06).
- Un membre `protected`, que les sous-classes lisent : `#` ne le permet pas.

## Correction

Déclarer chaque champ privé `readonly #name` en tête du corps de la classe, et l’affecter dans le constructeur. Une méthode privée s’écrit `#name()`.

## Adaptation

**Notre choix** : tout membre privé est `#`, et aucune parameter property. La règle `typescript/parameter-properties` d’oxlint trouve les parameter properties. Aucune règle d’oxlint ne refuse un membre `private` : ce signal reste à la review.

## Voir aussi

WIR-06 injecte par le constructeur, avec `@Inject` sur chaque paramètre. SRV-01 range les helpers en méthodes privées `#` de la classe qui s’en sert.

## Exemple

```ts
// Avoid: the fields hide in the parameters, and stay readable once compiled
export class DebitWalletHandler extends CommandHandler<DebitWalletCommand, void, DebitWalletError> {
	constructor(
		private readonly unitOfWork: UnitOfWork,
		private readonly wallets: WalletRepository,
	) {
		super();
	}
}
```

```ts
// Preferred: the state is declared first, and private for JavaScript itself
export class DebitWalletHandler extends CommandHandler<DebitWalletCommand, void, DebitWalletError> {
	readonly #unitOfWork: UnitOfWork;
	readonly #wallets: WalletRepository;

	constructor(unitOfWork: UnitOfWork, wallets: WalletRepository) {
		super();
		this.#unitOfWork = unitOfWork;
		this.#wallets = wallets;
	}
}
```
