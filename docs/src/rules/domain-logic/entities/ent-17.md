---
code: ENT-17
title: L’historique qui compte pour le métier passe par des domain events
group: Historique
scope: [domain]
style: [tactical]
kind: safeguard
checkedBy: decision
severity: blocking
severityNote: Question tant que le métier n’a pas dit quel historique compte.
detection: []
review: approved
sources:
  - "Change Tracking"
  - "Chapter 4, 'Event Sourcing'"
---

# ENT-17 · L’historique qui compte pour le métier passe par des domain events

<RuleMeta />

## Signal

Le métier veut savoir ce qui a changé et quand, mais le code se contente de colonnes génériques (`updatedAt`, `updatedBy`) ou d’une table d’audit technique, alimentée par l’ORM.

## Pourquoi

Pour un suivi exact et utile, le plus pratique est un type d’event par opération importante. Un event handler synchrone l’écrit dans un journal d’historique, dans la transaction du use case : pas de changement sans sa trace. Comme l’outbox, ce journal ne change jamais (MSG-02). Le nom et les propriétés de l’event rendent chaque changement explicite.

## Exceptions

Un besoin limité à la date et à l’auteur de la création et de la dernière modification. Beaucoup d’entreprises s’en contentent.

## Correction

Demander aux experts métier quels changements ils veulent retrouver, et nommer un event pour chacun. Un event handler synchrone l’écrit dans le journal d’historique (EVT-07).

## Voir aussi

EVT-02 interdit qu’une notification technique tienne lieu de domain event.
