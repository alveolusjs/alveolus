---
menu: Vue d’ensemble
---

# Domain events

Un domain event enregistre un fait qui compte pour le métier. Ces règles disent comment le modéliser : né dans le modèle, nommé dans le langage, immuable, et porteur de ce dont ses subscribers ont besoin.

La façon dont un event est conservé, transmis et consommé relève de [messaging](../../integration/messaging/), et son contrat publié de [contracts](../../integration/contracts/).

## En pratique {#in-practice}

Ce qui est arrivé à un wallet, nommé au passé :

```ts
export interface WalletOpened extends DomainEvent {
	readonly type: 'wallets.wallet.WalletOpened';
	readonly walletId: WalletId;
	readonly holderId: HolderId;
	readonly currency: Currency;
}

export interface MoneyDeposited extends DomainEvent {
	readonly type: 'wallets.wallet.MoneyDeposited';
	readonly walletId: WalletId;
	readonly amount: Money;
}

export interface MoneyWithdrawn extends DomainEvent {
	readonly type: 'wallets.wallet.MoneyWithdrawn';
	readonly walletId: WalletId;
	readonly holderId: HolderId;
	readonly amount: Money;
	readonly balance: Money;
}
```

- Des faits qui comptent pour le métier, nommés au passé (EVT-01, EVT-04).
- Nés dans le modèle : le wallet enregistre `WalletOpened`, et l’écriture que créent `wallet.credit()` et `wallet.debit()` enregistre `MoneyDeposited` et `MoneyWithdrawn`. Rien d’autre ne les enregistre (EVT-03).
- `MoneyWithdrawn` porte le titulaire et le solde après le retrait, pour qu’un subscriber agisse sans relire le wallet (EVT-05). Le wallet calcule ce solde au moment du débit : le solde qu’il vient de vérifier, moins le montant. Un débit concurrent échoue sur la version, donc ce solde est juste (AGG-15).
- Toutes les propriétés sont en lecture seule (EVT-06).

## Règles {#rules}

<RuleTable />
