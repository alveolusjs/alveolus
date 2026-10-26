---
code: PUB-06
title: Un open host service sert tous ses consumers
group: Open host service
scope: [public]
style: [tactical, transaction-script]
severity: question
detection: []
review: approved
sources:
  - "Open Host Service (definition)"
---

# PUB-06 · Un open host service sert tous ses consumers

<RuleMeta />

## Signal

Un endpoint, un champ ou une variante d’event ajouté au protocole public pour les besoins d’un seul consumer.

## Pourquoi

Le protocole grandit avec les besoins d’intégration que partagent ses consumers. Un besoin propre à une seule équipe passe par un translator dédié. Le protocole commun reste simple et cohérent.

## Exceptions

Un besoin qui sert plusieurs consumers.

## Correction

Un translator dédié à ce consumer, hors du protocole commun.

## Voir aussi

PUB-07 pour partir des use cases des intégrateurs.
