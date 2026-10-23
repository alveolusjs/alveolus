---
code: TST-01
title: Les tests tournent sur une vraie infrastructure, jamais sur un mock de librairie
group: Ce qu’un test prouve
scope: [application, driven, tests]
style: [tactical, transaction-script]
severity: minor
review: approved
sources:
  - "Interviewing the Successful CIO"
  - "Hexagonal or Ports and Adapters"
---

# TST-01 · Les tests tournent sur une vraie infrastructure, jamais sur un mock de librairie

<RuleMeta />

## Signal

- Un test qui mocke l’intérieur de l’ORM ou d’une librairie HTTP pour isoler un use case : `jest.mock('@prisma/client')`, un `findUnique` simulé.
- Un repository in-memory, un fake tenu à jour à la main pour suivre le vrai.
- Un test du domaine qui démarre une base de données.

## Pourquoi

Un test qui mocke l’intérieur d’une librairie prouve le mock, pas le code. Il passe quand la requête est fausse, et casse quand la librairie change son fonctionnement interne.

Un repository in-memory est une implémentation de plus, à tenir en phase avec la vraie. Il ignore les transactions, les contraintes et les requêtes : précisément ce qu’un test de l’application doit prouver.

Le domaine n’a besoin d’aucune infrastructure : ses tests construisent des valeurs et appellent le modèle.

## Exceptions

Aucune. Un serveur local qui imite un provider est un fake comme un autre : il ne prouve que ce qu’on lui a appris à répondre.

## Correction

- Les tests du domaine sont de simples tests unitaires, sans infrastructure.
- Les tests de l’application et des adapters font tourner les vrais adapters sur une base jetable, jamais sur un mock de la librairie.
- Un système distant se teste contre son environnement de test, celui que le provider ouvre à ses intégrateurs : la configuration y fait pointer le vrai adapter (WIR-11).

## Adaptation

**Notre choix** : pas de test double in-memory. Les tests de l’application et des adapters tournent sur un PostgreSQL jetable, démarré par Testcontainers (REP-16). Les ports restent : ils gardent l’application indépendante de son infrastructure (LAY-01), même si les tests utilisent la vraie.

## Voir aussi

LAY-01 garde l’application sur ses ports. TST-03 démarre les tests depuis les vrais modules.
