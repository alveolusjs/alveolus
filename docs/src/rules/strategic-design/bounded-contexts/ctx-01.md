---
code: CTX-01
title: Un langage par bounded context, pas de modèle universel
group: Langage et frontière
scope: [structure, domain]
style: [tactical, transaction-script]
severity: major
severityNote: Majeure si la context map existe et ne déclare pas ce partage. Question sinon.
review: approved
sources:
  - "How to Do DDD › Ubiquitous, but Not Universal"
---

# CTX-01 · Un langage par bounded context, pas de modèle universel

<RuleMeta />

## Signal

- Le code d’un bounded context importe une classe du domaine d’un autre bounded context (entity, aggregate, domain event), et la context map ne déclare pas ce partage.
- Un module `common` ou `shared` qui rassemble des entities métier utilisées par plusieurs bounded contexts.
- Un refactoring qui fusionne deux concepts de même nom venus de bounded contexts différents, au nom de DRY.

## Pourquoi

Chaque bounded context a son propre ubiquitous language, et un même terme peut y avoir un sens différent. Viser un langage unique pour toute l’entreprise échoue.

## Exceptions

Un partage déclaré dans la context map (shared kernel, MAP-03).

## Correction

Chaque bounded context garde son propre modèle du concept. Les bounded contexts s’intègrent par des identités et par le `public` de l’autre, avec une traduction à la frontière.

## Adaptation

Les building blocks de `@alveolus/core` (`AggregateRoot`, `DomainEvent`) ne sont pas un modèle métier. La règle ne les vise pas.
