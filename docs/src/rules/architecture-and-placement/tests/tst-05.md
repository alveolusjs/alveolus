---
code: TST-05
title: Un test vit à côté de ce qu’il prouve
group: Place et nom
scope: [tests]
style: [tactical, transaction-script]
severity: minor
detection: []
review: approved
sources: []
---

# TST-05 · Un test vit à côté de ce qu’il prouve

<RuleMeta />

## Signal

- Un dossier `test/` global, avec les tests de tous les bounded contexts.
- Un test unitaire de `Wallet` loin de `Wallet`, ou un test de repository loin du repository.
- Un helper de test d’un bounded context rangé dans `shared`.

## Pourquoi

Un test se lit avec le code qu’il prouve. À côté de lui, il bouge avec lui, et un bounded context se lit, se change ou s’extrait avec ses tests. Les dossiers `__test__` sont exclus du build et des fitness functions.

## Exceptions

Ce dont tous les bounded contexts ont besoin, comme la mise en place de la base, vit dans `shared/__test__/`.

## Correction

```txt
src/wallets/
├── domain/wallet/__test__/wallet.aggregate.spec.ts                       test unitaire
├── driven/prisma/__test__/prisma-wallet.repository.integration-spec.ts   test d’intégration
└── __test__/                                                             tests end-to-end du bounded context
    ├── rules/        un fichier par règle métier : ce qu’elle accepte, ce qu’elle refuse
    ├── scenarios/
    ├── contract/     facade, erreurs HTTP, OpenAPI
    └── support/      test drivers, sans assertion
```

## Voir aussi

TST-01 fait tourner les tests sur une vraie infrastructure, TST-03 démarre les tests depuis les vrais modules.
