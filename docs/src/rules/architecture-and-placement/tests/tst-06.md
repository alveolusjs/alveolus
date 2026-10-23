---
code: TST-06
title: Le nom d’un fichier de test dit ce qu’il teste, et à quel niveau
group: Place et nom
scope: [tests]
style: [tactical, transaction-script]
severity: minor
detection: LLM
detectionNote: "La revue lit le nom des fichiers sous `__test__`."
review: approved
sources: []
---

# TST-06 · Le nom d’un fichier de test dit ce qu’il teste, et à quel niveau

<RuleMeta />

## Signal

- `wallet.test.ts` à côté de `wallet.spec.ts` : deux conventions dans une même application.
- Un test de repository sur PostgreSQL nommé `.spec.ts`, et lancé avec les tests unitaires.
- Un test d’adapter nommé `.e2e-spec.ts`, alors qu’il n’exerce qu’un adapter.
- `helpers.ts` ou `utils.ts` dans un dossier `__test__`.
- Un `debit.e2e-spec.ts` parmi les tests end-to-end, sans un mot de la règle qu’il prouve.

## Pourquoi

Les tests se lancent par sorte : les tests unitaires à chaque changement, les tests d’intégration et end-to-end avec une base. Le suffixe dit au runner laquelle est laquelle, et au lecteur ce dont le test a besoin. Un test d’intégration exerce un seul adapter, branché sur sa vraie infrastructure ; un test end-to-end traverse toute l’application, de son entrée à la base. Le nom d’un test end-to-end dit quelle règle il prouve : un test qui échoue désigne la garantie qui a cassé.

## Exceptions

Aucune.

## Correction

| Fichier | Nom |
| --- | --- |
| Test unitaire, sans infrastructure | `<fichier testé>.spec.ts` : `wallet.aggregate.spec.ts` |
| Test d’intégration : un adapter, sur sa vraie infrastructure | `<fichier testé>.integration-spec.ts` : `prisma-wallet.repository.integration-spec.ts` |
| Helper de test | `<concept>.fixtures.ts` : `wallet.fixtures.ts` |
| Test end-to-end d’une règle métier : l’application démarrée depuis `AppModule` | `<code de la règle>-<nom de la règle>.e2e-spec.ts` : `wal-03-no-negative-balance.e2e-spec.ts` |

## Voir aussi

TST-05 place chaque test à côté de ce qu’il prouve. TST-01 fait tourner les tests sur une vraie infrastructure.
