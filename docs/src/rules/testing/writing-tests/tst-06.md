---
code: TST-06
title: Le nom d’un fichier de test dit son niveau
group: Forme, place et nom
scope: [tests]
style: [tactical, transaction-script]
severity: minor
detection: []
review: approved
sources: []
---

# TST-06 · Le nom d’un fichier de test dit son niveau

<RuleMeta />

## Signal

- `wallet.test.ts` à côté de `wallet.spec.ts` : deux conventions dans une même application.
- Un test de repository sur PostgreSQL nommé `.spec.ts`, et lancé avec les tests unitaires.
- Un test d’adapter nommé `.e2e-spec.ts`, alors qu’il n’exerce qu’un adapter.
- `helpers.ts` ou `utils.ts` dans un dossier `__test__`.
- Un `debit.e2e-spec.ts` dans `__test__/rules/`, sans un mot de la règle qu’il prouve.

## Pourquoi

Les tests se lancent par niveau : les tests unitaires à chaque changement, les autres avec une base. Le suffixe dit au runner lesquels lancer, et au lecteur ce dont le test a besoin. Le nom d’un test de règle dit la règle qu’il prouve : un échec désigne la garantie qui a cassé.

## Exceptions

Aucune.

## Correction

| Fichier | Nom |
| --- | --- |
| Test unitaire, sans infrastructure | `<fichier testé>.spec.ts` : `wallet.aggregate.spec.ts` |
| Test d’intégration : un adapter, sur sa vraie infrastructure ou face aux stubs de son provider | `<fichier testé>.integration-spec.ts` : `prisma-wallet.repository.integration-spec.ts` |
| Test de contrat : un adapter, contre la sandbox de son provider, hors de la MR | `<fichier testé>.contract-spec.ts` : `http-exchange-rates.contract-spec.ts` |
| Helper de test | `<concept>.fixtures.ts` : `wallet.fixtures.ts` |
| Stubs d’un système tiers (INF-03, INF-04) | `<upstream>.stubs.ts` : `rates-provider.stubs.ts` |
| Réponse enregistrée d’un système tiers, dans `recordings/` (INF-03) | `<méthode>-<ressource>.<statut>.json` : `get-quotes.200.json` |
| Mise en place commune, lue par la configuration de Vitest | `<ressource>.global-setup.ts`, `<ressource>.setup.ts` : `database.global-setup.ts` |
| Test end-to-end d’un use case : l’application démarrée depuis `AppModule` | `<use case>.e2e-spec.ts` : `debit-wallet.e2e-spec.ts` |
| Test end-to-end d’une règle que le domaine ne tient pas seul (COV-02) | `<code de la règle>-<nom de la règle>.e2e-spec.ts` : `wal-07-one-wallet-per-currency.e2e-spec.ts` |

## Voir aussi

TST-05 place chaque test à côté de ce qu’il prouve. TST-01 fait tourner les tests sur une vraie infrastructure.
