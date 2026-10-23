---
code: NAM-08
title: "Une identité s’appelle `<Concept>Id`, une erreur porte le nom du refus"
group: Noms de types
scope: [domain, application]
style: [tactical, transaction-script]
severity: minor
review: approved
sources: []
---

# NAM-08 · Une identité s’appelle `<Concept>Id`, une erreur porte le nom du refus

<RuleMeta />

## Signal

- `WalletIdentifier`, `WalletUuid`, `WalletKey` à côté de `HolderId`.
- `WalletError`, `InvalidOperation`, `BusinessError`, avec un champ `code` pour les distinguer.

## Pourquoi

Les identités apparaissent dans toutes les signatures. Un seul modèle pour toutes (`WalletId`, `HolderId`) se lit d’un coup d’œil, et mène tout de suite au bon type.

Une erreur est un refus du métier, et l’appelant réagit selon le refus. `InsufficientFunds` et `DebitsBlocked` le disent dans le type ; le compilateur garde alors la liste des refus complète (AGG-01). Un `WalletError` générique cache les refus derrière un code que le compilateur ne peut pas vérifier.

## Exceptions

Aucune.

## Correction

- `<Concept>Id` dans `<concept>.id.ts`.
- Un type par refus, nommé d’après ce que le métier refuse (`InsufficientFunds`, `WithdrawalLimitExceeded`, `DebitsBlocked`), dans le `.errors.ts` du concept qui refuse.

## Voir aussi

ENT-03 fait d’une identité un value object. NAM-05 tient `Error` hors du nom.
