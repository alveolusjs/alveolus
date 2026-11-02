---
code: EVT-09
title: Un event handler ne déclenche pas de chaîne d’event handlers
group: Les event handlers du bounded context
scope: [driving, application, structure]
style: [tactical]
kind: structure
severity: major
detection: []
review: approved
sources: []
---

# EVT-09 · Un event handler ne déclenche pas de chaîne d’event handlers

<RuleMeta />

## Signal

- Un event handler qui appelle un use case dont l’aggregate enregistre un event, lui-même écouté par un event handler qui enregistre un autre event.
- Un processus métier qu’on ne peut suivre qu’en remontant le registre des event handlers, event après event.

## Pourquoi

Chaque event handler est simple. La chaîne, elle, n’est écrite nulle part. Personne ne voit le processus complet, ni par où il passe quand une étape échoue. Le debug consiste à reconstituer un enchaînement implicite à partir des logs.

## Exceptions

Le translator ne compte pas dans la profondeur. Il ne déclenche aucun event handler : il écrit un integration event dans l’outbox, et le domain event s’arrête là.

## Correction

Profondeur maximale : un. Un domain event déclenche des event handlers, et ces event handlers ne déclenchent pas d’autres event handlers du bounded context.

Quand un enchaînement est nécessaire, c’est un processus métier. Il devient explicite : un use case qui l’orchestre, ou un processus avec une identité, un statut et un chemin d’échec (PRC-05).

## Voir aussi

EVT-07 et EVT-08 pour les event handlers. PRC-04 et PRC-05 pour les processus explicites.
