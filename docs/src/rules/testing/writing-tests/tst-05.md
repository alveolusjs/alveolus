---
code: TST-05
title: Un test vit à côté de ce qu’il prouve
group: Forme, place et nom
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

Ce dont tous les bounded contexts ont besoin, comme la base ou le serveur de stubs, vit dans `shared/__test__/`.

## Correction

```txt
src/shared/__test__/
├── database.global-setup.ts                                              la base jetable, une fois par run (INF-01)
├── database.setup.ts                                                     la base du worker, vidée avant chaque test (INF-02)
└── http.setup.ts                                                         les stubs des systèmes tiers, remis à zéro après chaque test (INF-04)

src/wallets/
├── domain/wallet/__test__/wallet.aggregate.spec.ts                       test unitaire
├── driven/prisma/__test__/prisma-wallet.repository.integration-spec.ts   test d’intégration
├── driven/http/rates-provider/
│   ├── rates-provider.openapi.json                                       le contrat du provider, figé et commité (INF-03)
│   └── __test__/
│       ├── recordings/                                                   les réponses enregistrées de la sandbox, sans exemple dans le contrat (INF-03)
│       ├── rates-provider.stubs.ts                                       stubs générés, parcours écrits à la main (INF-03, INF-04)
│       ├── http-exchange-rates.integration-spec.ts                       l’adapter face aux stubs
│       └── http-exchange-rates.contract-spec.ts                          test de contrat, contre la sandbox (INF-05)
└── __test__/                                                             tests end-to-end du bounded context
    ├── rules/        les règles que le domaine ne tient pas seul : unicité, concurrence, idempotence (COV-02)
    ├── scenarios/    un fichier par use case : son cas nominal, ses enchaînements
    ├── contract/     facade, erreurs HTTP, OpenAPI
    ├── failures/     tests de panne, un seul port remplacé (TST-01)
    └── support/      test drivers, sans assertion
```

## Voir aussi

TST-01 fait tourner les tests sur une vraie infrastructure, TST-03 démarre les tests depuis les vrais modules.
