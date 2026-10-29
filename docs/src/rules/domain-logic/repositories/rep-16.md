---
code: REP-16
title: Le repository est testé contre le vrai stockage
group: Tests
scope: [tests]
style: [tactical]
severity: minor
detection: []
review: approved
sources:
  - "Testing Repositories"
---

# REP-16 · Le repository est testé contre le vrai stockage

<RuleMeta />

## Signal

- Une implémentation de repository sans test, ou testée seulement avec des mocks de l’ORM ou du driver.
- Un repository in-memory (`InMemoryWalletRepository`) qui remplace l’implémentation réelle dans les tests : il ne prouve rien sur les requêtes, le schéma ni les contraintes de la base.
- Un test qui vérifie seulement que `save` ne lance pas d’erreur.
- Des tests qui ne nettoient pas le stockage entre deux passages, et dépendent de leur ordre.

## Pourquoi

Pour savoir si le code de production fonctionne, tester l’implémentation de production. Un enregistrement sans erreur ne prouve rien. Relire l’instance par son identité, et comparer ses attributs à ceux de l’originale.

Vider aussi le stockage après chaque test. Sinon, les instances qui restent faussent les assertions suivantes, comme un comptage.

## Exceptions

Aucune.

## Correction

Enregistrer, relire par identité, comparer. Couvrir chaque finder, le filtre sur le tenant et les cas vides. Un finder de collection renvoie un tableau vide, jamais `null`.

## Adaptation

En Node, une vraie base PostgreSQL dans un conteneur joue ce rôle.

**Notre choix** : Testcontainers, qui démarre un PostgreSQL jetable depuis le code du test, le même en local et en CI, construit par les migrations (INF-01). Chaque worker a sa base, vidée par un `TRUNCATE` avant chaque test (INF-02). Docker est nécessaire.

## Voir aussi

LAY-01 fait dépendre l’application de ports, et TST-01 la teste sur les vrais adapters. TST-03 fait démarrer les tests depuis les vrais modules de l’application. INF-02 dit pourquoi on ne nettoie pas par une transaction annulée.
