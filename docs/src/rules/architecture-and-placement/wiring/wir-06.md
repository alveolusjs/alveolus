---
code: WIR-06
title: Chaque injection nomme son injection token
group: Dépendances
scope: [driving, structure]
style: [tactical, transaction-script]
severity: major
detection: []
review: approved
sources: []
---

# WIR-06 · Chaque injection nomme son injection token

<RuleMeta />

## Signal

- `constructor(private readonly debitWallet: DebitWalletHandler)` dans un controller, sans `@Inject`.
- `{ provide: WalletRepository, useClass: PrismaWalletRepository }` pour une classe dont le constructeur prend des paramètres.

## Pourquoi

Sans injection token nommé, NestJS devine la dépendance d’après les types de paramètres que le compilateur écrit dans le code. Cette information est fragile : elle disparaît avec un `import type`, avec une interface, avec un cycle entre deux fichiers, ou avec un compilateur qui ne l’émet pas. La dépendance arrive alors `undefined`, et l’erreur apparaît à la première requête, loin de sa cause.

Un injection token nommé est une valeur. Quand il manque, l’application refuse de démarrer, et nomme le token.

## Exceptions

Une classe sans paramètre de constructeur.

## Correction

Dans le module, `construct` avec la liste des injection tokens (WIR-05). Dans une classe que NestJS crée lui-même, `@Inject` sur chaque paramètre.

```ts
@Controller('wallets')
export class WalletController extends ResultController {
	readonly #debitWallet: DebitWalletHandler;
	readonly #getWallet: GetWalletHandler;

	constructor(
		@Inject(DebitWalletHandler) debitWallet: DebitWalletHandler,
		@Inject(GetWalletHandler) getWallet: GetWalletHandler,
	) {
		super();
		this.#debitWallet = debitWallet;
		this.#getWallet = getWallet;
	}
}
```

## Voir aussi

WIR-07 fait du port son propre injection token.
