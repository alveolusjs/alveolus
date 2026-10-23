---
menu: Vue d’ensemble
---

# Contrats et published language

Les bounded contexts échangent des données par un contrat, pas par leurs modèles. Ces règles gardent le published language documenté et distinct du modèle interne, versionné quand il évolue, lu avec tolérance par les consumers, et servi par un open host service qui répond à ses intégrateurs.

## En pratique {#in-practice}

Ce que le bounded context `wallets` publie quand de l’argent sort d’un wallet, dans `public/money-withdrawn.v1.ts` :

```ts
export const MONEY_WITHDRAWN = 'wallets.wallet.MoneyWithdrawn';

export interface MoneyWithdrawnMessage {
	readonly eventId: string;
	readonly type: typeof MONEY_WITHDRAWN;
	readonly version: 1;
	readonly occurredOn: string;
	readonly payload: MoneyWithdrawnPayload;
}

export interface MoneyWithdrawnPayload {
	readonly walletId: string;
	readonly holderId: string;
	readonly amount: PublishedMoney;
	readonly balance: PublishedMoney;
}

export interface PublishedMoney {
	readonly minor: string;
	readonly currency: string;
}
```

- Un published language documenté, distinct du domain event : l’event porte des identités typées et des `Money`, le contrat des chaînes simples dans un format annoncé. Son schéma publié dit le format de chaque champ : un UUID, une date ISO 8601, un montant en unités mineures de la devise (PUB-01).
- Des données, pas de comportement (PUB-02).
- Le type nomme son bounded context : `wallets.wallet.MoneyWithdrawn` (PUB-03).
- `eventId` est unique par message : un consumer qui le reçoit deux fois ne le traite qu’une fois (MSG-04).
- Le payload porte ce dont un consumer a besoin pour agir, sans rappeler le bounded context `wallets`. Le message porte sa version : un changement qui casse un consumer sera une version 2, publiée à côté (PUB-04).
- De nouveaux champs peuvent apparaître : un consumer lit ceux dont il a besoin et ignore les autres (PUB-05).

## Règles {#rules}

<RuleTable />
