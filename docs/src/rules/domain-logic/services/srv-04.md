---
code: SRV-04
title: Un domain service est sans état et nommé dans le langage du métier
group: Forme du service
scope: [domain]
style: [tactical]
severity: major
severityNote: Majeure pour un état gardé entre deux appels. Mineure pour le nommage.
detection: []
review: approved
sources:
  - "What a Domain Service Is (but First, What It Is Not) (Evans quote)"
  - "Make Sure You Need a Service"
---

# SRV-04 · Un domain service est sans état et nommé dans le langage du métier

<RuleMeta />

## Signal

- Un domain service qui garde un état entre deux appels (un champ rempli avec les données d’une requête, un cache d’entities).
- Un nom ou une opération qui ne vient pas du langage (`WithdrawalManager`, `process`, `handle`), ou un `wallet.isAllowed()` là où l’équipe dit « le plafond autorise ce retrait ».

## Pourquoi

Un domain service est sans état. Ses méthodes publiques parlent le langage du modèle : chaque nom d’opération fait partie du langage.

Demander au plafond de retrait s’il autorise ce retrait (`withdrawalLimit.allows(...)`), plutôt que demander au wallet s’il « est autorisé ». C’est ainsi que l’équipe parle.

## Exceptions

Aucune.

## Correction

Injecter les dépendances par le constructeur. Ne ranger aucune donnée de requête dans des champs. Prendre les noms dans le glossaire.

## Adaptation

En NestJS, un provider est un singleton par défaut. Un champ rempli pendant une requête devient un état partagé par les requêtes concurrentes.

## Voir aussi

ENT-11 traite du nommage.
