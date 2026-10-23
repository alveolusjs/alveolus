---
code: PLC-09
title: Un mapping vit avec son adapter
group: Adapters
scope: [driving, driven]
style: [tactical, transaction-script]
severity: minor
review: approved
sources: []
---

# PLC-09 · Un mapping vit avec son adapter

<RuleMeta />

## Signal

- `toRow()` ou `toJson()` sur un aggregate.
- Un modèle Prisma ou un schéma HTTP importé dans `domain` ou `application`.
- Un mapper partagé par le repository et le controller.

## Pourquoi

Chaque côté de l’hexagone a sa propre forme : la table d’un côté, la ressource HTTP de l’autre. Le mapping entre le modèle et cette forme appartient à l’adapter qui en a besoin. Dans le modèle, il lie le modèle à la table ou à l’API. Partagé, il lie la table à l’API.

## Exceptions

Un value object peut se sérialiser en une valeur simple (`toJSON`) quand cette valeur fait partie du langage, comme une identité.

## Correction

- Stockage : un mapper à côté du repository, `driven/prisma/wallet.mapper.ts`.
- HTTP : les schémas de la requête et de la représentation à côté du controller, `driving/http/debit-wallet.request.ts`, `driving/http/wallet.representation.ts`.

## Voir aussi

REP-08 reconstruit l’aggregate sans setters. API-01 tient le modèle hors de l’API.
