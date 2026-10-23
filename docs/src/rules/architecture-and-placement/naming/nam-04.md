---
code: NAM-04
title: Un fichier exporte ce que son nom annonce
group: Noms de fichiers
scope: [structure]
style: [tactical, transaction-script]
severity: minor
review: approved
sources: []
---

# NAM-04 · Un fichier exporte ce que son nom annonce

<RuleMeta />

## Signal

- `wallet.aggregate.ts` exporte `Account`.
- `debit-wallet.command.ts` exporte `ProcessDebit` et `WalletService`.
- `prisma-wallet.repository.ts` exporte `WalletStore`.

## Pourquoi

Le nom du fichier est ce qui permet au lecteur de trouver un type. Si `Wallet` vit dans `account.aggregate.ts`, personne ne le trouve sans une recherche, et un renommage du concept laisse derrière lui l’un des deux noms (PLC-06).

## Exceptions

- Un fichier au rôle pluriel exporte plusieurs types du même concept : `wallet.events.ts` exporte `MoneyDeposited` et `MoneyWithdrawn`, `wallet.errors.ts` exporte `InsufficientFunds` et `DebitsBlocked`.
- Une command ou une query exporte son message et son handler : `DebitWalletCommand` et `DebitWalletHandler`.

## Correction

L’export principal est le concept du fichier, en PascalCase : `wallet.aggregate.ts` → `Wallet`, `wallet.id.ts` → `WalletId`, `get-wallet.query.ts` → `GetWalletQuery` et `GetWalletHandler`, `prisma-wallet.repository.ts` → `PrismaWalletRepository`. Renommer le fichier ou le type pour qu’ils correspondent, dans le même changement.

## Voir aussi

NAM-05 dit quel suffixe le nom du type garde ou abandonne.
