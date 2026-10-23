---
code: PUB-03
title: Le type d’un message publié nomme son bounded context
group: Published language
scope: [public]
style: [tactical, transaction-script]
severity: minor
review: approved
sources:
  - "Exchanging Information across System Boundaries (typeName)"
  - "Staying Informed about Product Owners and Team Members"
---

# PUB-03 · Le type d’un message publié nomme son bounded context

<RuleMeta />

## Signal

- Des types de messages publiés hors du bounded context sous un nom court (`CustomerOnboarded`, `PaymentFailed`), sans le bounded context ni l’aggregate.
- Un routage ou un abonnement fondé sur ce nom court.

## Pourquoi

Le type d’un message est le nom complet de l’event, aggregate compris. Les subscribers distinguent ainsi les types, sans collision avec un event du même nom publié par un autre bounded context.

## Exceptions

Aucune.

## Correction

`<bounded-context>.<aggregate>.<Event>`, figé une fois publié : `wallets.wallet.MoneyWithdrawn`. L’aggregate s’écrit en minuscules. Dans un bounded context en transaction scripts, le concept dont parle l’event tient la place de l’aggregate.

## Adaptation

TypeScript n’a pas de nom de classe qualifié par son package. Tirer le type de `constructor.name` le lie au nom de la classe, qui peut changer au premier refactoring. Le type publié s’écrit à la main, en chaîne stable, dans une constante de `public`.

## Voir aussi

PUB-01 pour le published language. PUB-04 : une nouvelle version garde le même type.
