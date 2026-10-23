---
code: PUB-07
title: Un open host service répond aux use cases de ses intégrateurs
group: Open host service
scope: [driving, public]
style: [tactical, transaction-script]
severity: major
review: approved
sources:
  - "Integration Using RESTful Resources"
  - "Implementing the RESTful Resource"
---

# PUB-07 · Un open host service répond aux use cases de ses intégrateurs

<RuleMeta />

## Signal

- Une API destinée aux autres bounded contexts qui expose le modèle en ressources navigables (les titulaires, puis leurs wallets, leurs écritures, leurs blocages), et laisse chaque consumer en déduire la réponse.
- Un consumer qui reconstruit une règle du producer en combinant plusieurs ressources.

## Pourquoi

Exposer son modèle en ressources liées semble l’option la plus souple. Ce n’est pas un open host service. Selon la part du modèle exposée, c’est un shared kernel ou une relation conformist. Les deux lient fortement les consumers au modèle.

Il vaut mieux partir des use cases des intégrateurs. Ils veulent souvent une réponse précise : « ce titulaire est-il suspendu ? », « ce wallet accepte-t-il les débits ? ». Le protocole fournit ce dont ils ont besoin aujourd’hui, et s’étend quand un nouveau besoin apparaît.

Les intégrateurs n’ont plus à comprendre le modèle. Ils avancent plus vite, et leurs bounded contexts restent simples à maintenir.

## Exceptions

Un shared kernel ou une relation conformist, choisi exprès et déclaré sur la context map.

## Correction

Une ressource ou une opération par question d’intégration, avec sa représentation dans le published language. Le use case répond, le domaine décide.

## Voir aussi

API-01 : pas de modèle exposé tel quel en REST. PUB-06 : le protocole reste commun. PUB-01 pour le published language.

## Exemple

Avant d’accepter un virement, le bounded context `payments` doit savoir si le wallet à débiter accepte les débits.

À éviter : la facade expose le modèle, et `payments` reconstruit la règle du wallet.

```ts
// Avoid:
export abstract class WalletsFacade {
	abstract getWallet(walletId: string): Promise<WalletDto | undefined>;
	abstract getHolder(holderId: string): Promise<HolderDto | undefined>;
	abstract listBlocks(walletId: string): Promise<readonly WalletBlockDto[]>;
}

const wallet = await this.#wallets.getWallet(walletId);
const holder = wallet && (await this.#wallets.getHolder(wallet.holderId));
const blocks = await this.#wallets.listBlocks(walletId);
const acceptsDebits =
	wallet?.status === 'open' &&
	holder?.status === 'active' &&
	!blocks.some((block) => block.directions.includes('debit'));
```

Préféré : la facade répond à la question que pose `payments`.

```ts
// Preferred:
export abstract class WalletsFacade {
	abstract debitAvailability(walletId: string): Promise<DebitAvailability>;
}

export type DebitAvailability =
	| { readonly acceptsDebits: true }
	| {
			readonly acceptsDebits: false;
			readonly reason: 'WalletNotFound' | 'WalletIsClosed' | 'DebitsBlocked' | 'HolderIsSuspended';
	  };

const availability = await this.#wallets.debitAvailability(walletId);
```

La règle reste dans le bounded context `wallets`, qui peut la changer seul : si un nouveau cas bloque les débits, `payments` n’a rien à recalculer.
