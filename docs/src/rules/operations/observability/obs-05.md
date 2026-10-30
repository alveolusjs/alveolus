---
code: OBS-05
title: L’outbox et les dead letters se mesurent, et alertent
group: Santé
scope: [application, driven]
style: [tactical, transaction-script]
severity: major
detection: []
review: approved
sources: []
---

# OBS-05 · L’outbox et les dead letters se mesurent, et alertent

<RuleMeta />

## Signal

- Un forwarder arrêté depuis une heure, que personne ne remarque.
- Des dead letters qui s’accumulent, sans alerte.
- Des métriques sur le processeur et la mémoire, aucune sur ce que fait l’application.

## Pourquoi

L’outbox et les retries rendent les pannes silencieuses : aucune requête n’échoue, mais les messages n’arrivent plus. Sans mesure, un message bloqué est un message perdu pour ceux qui l’attendent.

## Exceptions

Aucune.

## Correction

- L’âge du plus vieux message de l’outbox non publié, avec une alerte au-delà d’un seuil.
- Le nombre de dead letters, avec une alerte dès la première.
- Les refus métier par type, et les pannes par use case.

## Voir aussi

MSG-03 publie l’outbox dans l’ordre. OBS-02 logue la panne que la métrique compte.
