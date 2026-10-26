---
code: API-02
title: Respecter la sémantique HTTP
group: REST
scope: [driving]
style: [tactical, transaction-script]
severity: major
severityNote: Major for a GET that changes state or a non-idempotent PUT/DELETE. Minor otherwise.
detection: []
review: approved
sources:
  - "Representational State Transfer › Key Aspects of a RESTful HTTP Server"
---

# API-02 · Respecter la sémantique HTTP

<RuleMeta />

## Signal

- Un `GET` qui change l’état.
- Un `PUT` ou un `DELETE` qui n’est pas idempotent.
- Un échange qui compte sur une session côté serveur pour enchaîner les requêtes.
- Une API qui calque les verbes HTTP sur le CRUD des tables.

## Pourquoi

- `GET` est réservé aux opérations sans effet, ce qui permet le cache et une bonne part de la capacité du web à monter en charge.
- `GET`, `PUT` et `DELETE` sont idempotents : on peut les rejouer en cas d’erreur ou de doute.
- Chaque requête porte tout ce qu’il faut pour la traiter.
- Les verbes ne sont pas le CRUD des tables. Une ressource représente souvent un comportement, pas une entity enregistrée.

## Exceptions

Aucune.

## Correction

Une ressource par intention métier, et le verbe qui correspond à sa sémantique.

## Voir aussi

UC-01 demande des endpoints orientés intention. Les ressources de comportement en sont la forme REST : `POST /wallets/{id}/blocks`.
