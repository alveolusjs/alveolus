---
menu: Vue d’ensemble
---

# Couches et dépendances

Quel que soit le style d’un bounded context, son domaine reste isolé : il déclare ses interfaces, et les couches extérieures les implémentent. Les dépendances pointent vers l’intérieur, ne forment aucun cycle, et un autre bounded context n’entre que par `public`. ESLint vérifie la plupart de ces règles dans l’éditeur, et dependency-cruiser les cycles.

L’organisation attendue est décrite dans l’[architecture de référence](../../../start/reference-architecture). La place de chaque fichier relève de [Ce qui va où](../placement/) (PLC). Le choix d’un pattern d’architecture, CQRS ou broker, relève de CTX-16.

## En pratique {#in-practice}

Un bounded context wallets, couche par couche :

```txt
src/wallets/
├── domain/                 par concept : wallet/, money/, exchange-rate/
├── application/            par concept : wallet/
├── driving/http/           le controller et le schéma de sa requête
├── driven/prisma/          le repository et son mapper
├── driven/http/            l’adapter du fournisseur de taux de change
└── public/                 le contrat publié : des types uniquement
```

- Le domaine déclare ses ports (`WalletRepository`, `ExchangeRates`), et `driven` les implémente. Le domaine n’importe ni NestJS, ni Prisma (LAY-01).
- `wallet` dépend de `money`, et `money` ne dépend de rien : aucun cycle entre les modules du domaine (LAY-02). Un wallet garde son `HolderId` typé, jamais un simple `string` pour s’épargner un import (LAY-03).
- Le bounded context notifications n’importe que `wallets/public`, jamais son domaine ni son application (LAY-04).

## Règles {#rules}

<RuleTable />
