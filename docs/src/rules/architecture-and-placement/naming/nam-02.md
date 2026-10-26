---
code: NAM-02
title: "Un fichier s’appelle `<concept>.<role>.ts`, en kebab-case"
group: Noms de fichiers
scope: [structure]
style: [tactical, transaction-script]
severity: minor
detection: []
review: approved
sources: []
---

# NAM-02 · Un fichier s’appelle `<concept>.<role>.ts`, en kebab-case

<RuleMeta />

## Signal

- `WalletId.ts`, `debitWallet.command.ts`, `get_wallet.query.ts`.
- `wallet.money.value-object.ts`, `wallet.aggregate.service.ts` : deux concepts, ou deux rôles.

## Pourquoi

Une seule convention pour tous les fichiers rend les noms prévisibles : un lecteur devine sans chercher le nom du fichier qui contient `GetWalletQuery`. Le kebab-case évite aussi les surprises entre les systèmes de fichiers qui ignorent la casse et ceux qui la respectent : `Wallet.ts` et `wallet.ts` sont un seul fichier sur une machine, et deux sur une autre.

Deux points avant le rôle disent deux choses dans un seul fichier. Soit le fichier contient deux concepts, soit il joue deux rôles.

## Exceptions

Aucune.

## Correction

- Un concept, en kebab-case, puis un rôle : `debit-wallet.command.ts`, `wallet-views.port.ts`, `prisma-wallet.repository.ts`.
- Un fichier qui contient deux concepts se coupe en deux.

## Voir aussi

NAM-04 donne à l’export principal le nom du fichier.
