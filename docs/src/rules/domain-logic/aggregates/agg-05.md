---
code: AGG-05
title: L’aggregate root a une identité globale et typée
group: Références et dépendances
scope: [domain]
style: [tactical]
severity: minor
detection: []
review: approved
sources:
  - "Create a Root Entity with Unique Identity"
---

# AGG-05 · L’aggregate root a une identité globale et typée

<RuleMeta />

## Signal

- L’identité de l’aggregate root est un `string` ou un `number` nu.
- L’id auto-incrémenté de la base sert d’identité du domaine.
- L’id technique de persistance et l’identité métier sont le même champ.

## Pourquoi

Chaque aggregate root a une identité unique globalement. Un type dédié la modélise, distinct de tout id technique. La référence par identité (AGG-03) et les events (AGG-09) reposent sur elle.

## Exceptions

Aucune.

## Correction

Un value object ou un branded type par identité d’aggregate root (`TransferId`), fixé à la construction et jamais modifié.

## Voir aussi

ENT-03 fait de chaque identité un value object, ENT-05 la génère avant la persistance, ENT-06 la rend immuable et ENT-08 cache l’id technique.

## Exemple

```ts
// Avoid: the identity is the number the database assigns on insert
export class Wallet {
	id?: number;

	// the wallet's state and behavior
}

export interface WalletRepository {
	get(id: number): Promise<Wallet | null>;
}
```

```ts
// Preferred: a typed identity, set at construction and never changed
export class Wallet extends AggregateRoot<WalletId> {
	// the wallet's state and behavior
}

export interface WalletRepository {
	get(id: WalletId): Promise<Wallet | null>;
}
```

Avec un `number`, le wallet n’a pas d’identité avant son insertion, et rien n’empêche de passer l’id d’un titulaire à `get`. `WalletId` est généré avant le premier enregistrement (ENT-05), et le compilateur refuse un `HolderId` à sa place (ENT-03).
