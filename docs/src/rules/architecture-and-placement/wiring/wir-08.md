---
code: WIR-08
title: Les champs d’un handler ou d’un adapter ne changent plus après le constructeur
group: Durée de vie
scope: [application, driving, driven]
style: [tactical, transaction-script]
severity: major
severityNote: Bloquante quand le champ garde les données d’un titulaire ou la transaction en cours.
detection: hybrid
detectionNote: "Un contrôle peut signaler une affectation à un champ hors du constructeur, et `Scope.REQUEST` ; la revue juge les exceptions."
review: approved
sources: []
---

# WIR-08 · Les champs d’un handler ou d’un adapter ne changent plus après le constructeur

<RuleMeta />

## Signal

- Un handler ou un adapter qui affecte l’un de ses champs ailleurs que dans son constructeur, par exemple pour y garder le wallet qu’il vient de charger.
- `scope: Scope.REQUEST` sur un provider.

## Pourquoi

Un handler n’existe qu’en un seul exemplaire, partagé par toutes les requêtes. Ses champs sont donc partagés eux aussi.

```ts
// Avoid: the handler keeps the wallet of the request in a field
export class DebitWalletHandler extends CommandHandler<DebitWalletCommand, void, DebitWalletError> {
	readonly #wallets: WalletRepository;
	#currentWallet: Wallet | undefined;

	constructor(wallets: WalletRepository) {
		super();
		this.#wallets = wallets;
	}

	async handle(command: DebitWalletCommand): Promise<Result<void, DebitWalletError>> {
		this.#currentWallet = await this.#wallets.get(command.walletId);

		// debit this.#currentWallet
	}
}
```

`#wallets`, le repository, est rempli une fois par le constructeur : il sert à toutes les requêtes, sans problème. `#currentWallet`, lui, est rempli par chaque requête, dans le même objet. Pendant qu’une requête attend la base, une autre peut le remplacer :

| | Requête A, wallet d’Alice | Requête B, wallet de Bob |
| --- | --- | --- |
| 1 | `#currentWallet` = Alice, puis attend la base | |
| 2 | | `#currentWallet` = Bob, puis attend la base |
| 3 | débite `#currentWallet` : **le wallet de Bob** | |

Les tests ne le voient pas : ils envoient une requête à la fois.

## Exceptions

Ce que l’application démarre une seule fois, comme le timer d’un scheduler posé au démarrage (WIR-10).

## Correction

Garder la valeur dans une variable locale : chaque requête a la sienne.

```ts
// Preferred: the wallet of the request stays in a local variable
async handle(command: DebitWalletCommand): Promise<Result<void, DebitWalletError>> {
	const wallet = await this.#wallets.get(command.walletId);

	// debit wallet
}
```

Le handler ne garde que `#wallets`, reçu par son constructeur.

## Adaptation

**Notre choix** : pas de `Scope.REQUEST`. NestJS recréerait le handler à chaque requête, et avec lui tout ce qui en dépend, jusqu’au controller : un coût répandu dans toute l’application pour contourner un champ qui n’a pas lieu d’être.

## Voir aussi

REP-14 fait circuler la transaction sans champ. SRV-04 garde les domain services sans état.
