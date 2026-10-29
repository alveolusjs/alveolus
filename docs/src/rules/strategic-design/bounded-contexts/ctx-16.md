---
code: CTX-16
title: Chaque choix d’architecture répond à un risque réel
group: Style d’implémentation
scope: [structure]
style: [tactical, transaction-script]
severity: major
detection: []
review: approved
sources:
  - "Chapter introduction"
  - "Sidebar 'Architecture Isn't a Coolness Factor'"
  - "Sidebar 'Isn't This Accidental Complexity?'"
  - "Examining Areas of CQRS › Command Processors"
  - "Event Sourcing"
  - "End of 'Dealing with an Eventually Consistent Query Model'"
---

# CTX-16 · Chaque choix d’architecture répond à un risque réel

<RuleMeta />

## Signal

- Une MR ajoute un style ou un pattern d’architecture (CQRS, event sourcing, command bus asynchrone, saga, broker, read model séparé) sans nommer l’exigence de qualité ou le risque auquel il répond.
- La seule justification est la mode, ou un « ça tient la charge » sans chiffres.

## Pourquoi

Ce sont les vraies exigences de qualité qui guident l’architecture, et on ne les connaît qu’à partir des besoins fonctionnels. Chaque style en place doit avoir sa justification. S’il n’en a pas, on le retire.

Chaque pattern a la sienne :

- CQRS résout un problème précis : des views complexes. Partout ailleurs, c’est de la complexité accidentelle.
- Des command handlers asynchrones ne sont pas le choix par défaut. On commence en synchrone.
- L’event sourcing doit apporter quelque chose au métier.

## Exceptions

Un choix déjà consigné dans une ADR, et fondé sur une exigence.

## Correction

Demander quel risque le pattern réduit, et quelle exigence le motive. Sans réponse, choisir plus simple.

## Adaptation

**Notre choix** : un projet démarre sans CQRS ni event sourcing. Les introduire demande une ADR qui nomme le risque réduit.

## Voir aussi

CTX-13 pose la même question pour l’investissement en DDD tactique. CTX-14 fait déclarer à chaque bounded context son style d’implémentation.
