---
code: TST-03
title: Les tests démarrent l’application depuis ses vrais modules
group: Ce qu’un test prouve
scope: [tests]
style: [tactical, transaction-script]
severity: minor
detection: hybrid
detectionNote: "Un contrôle peut signaler `overrideProvider` et un module de test qui déclare des `providers` ; la revue juge le reste."
review: approved
sources: []
---

# TST-03 · Les tests démarrent l’application depuis ses vrais modules

<RuleMeta />

## Signal

- Un test boîte noire qui construit son handler avec `new`, avec les adapters de son choix.
- `Test.createTestingModule({ providers: [DebitWalletHandler, …] })` : un graphe reconstruit pour le test.
- `overrideProvider(WalletRepository)`.
- Un test unitaire du domaine qui démarre un module NestJS.

## Pourquoi

Un test qui a son propre wiring prouve un graphe qui ne tourne pas en production. Un port laissé sans lien, un mauvais injection token ou un export manquant passent le test, et échouent au premier démarrage.

À l’inverse, un test du domaine n’a pas besoin de container : l’aggregate est un objet ordinaire, et démarrer un module ne fait que ralentir le test.

## Exceptions

Un test d’intégration (`*.integration-spec.ts`) construit l’adapter testé avec `new`, sur la vraie base : l’adapter est son sujet (REP-16).

## Correction

Les tests boîte noire compilent `AppModule`, et ne changent que la configuration : l’adresse de la base jetable. Les tests du domaine construisent leurs objets avec `new` ou par une factory.

```ts
const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
const app = moduleRef.createNestApplication();

await app.init();
```

## Adaptation

**Notre choix** : pas de test double in-memory (TST-01). Les tests tournent sur le wiring de production et sur un PostgreSQL jetable : aucun port n’est jamais remplacé.

## Voir aussi

TST-05 place les tests boîte noire dans le bounded context. TST-01 et REP-16 testent sur une vraie infrastructure.
