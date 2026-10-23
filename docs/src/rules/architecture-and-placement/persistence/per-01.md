---
code: PER-01
title: Chaque bounded context possède un schéma de base et son fichier de schéma
group: Le schéma
scope: [schema]
style: [tactical, transaction-script]
severity: major
detection: hybrid
detectionNote: "Un script de projet peut vérifier que chaque modèle de `<context>.prisma` déclare `@@schema(\"<context>\")` ; la revue vérifie les rôles de la base."
review: approved
sources: []
---

# PER-01 · Chaque bounded context possède un schéma de base et son fichier de schéma

<RuleMeta />

## Signal

- Les tables de tous les bounded contexts côte à côte dans `public`.
- Un préfixe dans chaque nom de table pour distinguer les bounded contexts : `wallets_wallet`, `notifications_notice`.
- Un seul rôle de base qui peut lire et écrire toutes les tables.
- Un seul `schema.prisma` qui contient les modèles de tous les bounded contexts, ou les modèles de deux bounded contexts dans le même fichier.
- Les tables de l’outbox recopiées dans le fichier d’un bounded context.

## Pourquoi

Plusieurs bounded contexts partagent une même base PostgreSQL tant qu’ils vivent dans une même application. Sans frontière dans la base, rien ne montre quel bounded context possède une table, et une requête peut joindre en une ligne les tables d’un autre bounded context (MAP-02).

Un schéma par bounded context trace cette frontière là où vivent les données. Les noms à l’intérieur restent ceux du langage (CTX-09), sans préfixe, et le bounded context pourra plus tard partir dans sa propre base avec son schéma tel quel.

Le fichier de schéma fait partie du bounded context, comme son code. Un fichier par bounded context montre quelles tables il possède, et un changement du bounded context ne touche que son fichier.

## Exceptions

Les tables techniques partagées par tous les bounded contexts (outbox, suivi des publications, messages traités) vivent dans leur propre schéma, `outbox`, et leur propre fichier.

Une application qui n’a qu’un bounded context garde un seul fichier pour ses modèles, à côté du fichier de l’outbox.

## Correction

```txt
prisma/
├── schema.prisma          datasource et generator
├── outbox.prisma          outbox, suivi des publications, messages traités
├── wallets.prisma         les modèles de wallets, chacun dans le schéma wallets
└── notifications.prisma
```

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  schemas  = ["outbox", "wallets", "notifications"]
}
```

```prisma
// prisma/wallets.prisma
model Wallet {
  // the columns of the wallet

  @@map("wallet")
  @@schema("wallets")
}
```

Le nom du fichier et `@@schema` disent tous deux à quel bounded context appartient le modèle. Dans la base, les noms sont en `snake_case` : `@map("holder_id")`, `@@map("wallet")`.

## Adaptation

Prisma génère un seul client pour toute l’application : deux modèles ne peuvent pas porter le même nom. Quand deux bounded contexts emploient le même terme (CTX-08), le modèle Prisma prend le nom du bounded context, `TreasuryTransfer`, et la table garde le sien, `treasury.transfer`. Le modèle Prisma est une entity de persistance : son nom n’atteint jamais le domaine (REP-08).

**Notre choix** : un schéma PostgreSQL par bounded context. Un rôle de base par bounded context, limité à son schéma, est l’étape suivante quand un bounded context doit être isolé davantage.

## Voir aussi

MAP-02 interdit de lire les tables d’un autre bounded context.
