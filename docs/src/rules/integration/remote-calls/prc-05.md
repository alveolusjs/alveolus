---
code: PRC-05
title: Un long-running process a une identité, un suivi et un chemin d’échec
group: Processus entre bounded contexts
scope: [application, domain]
style: [tactical, transaction-script]
severity: major
review: approved
sources:
  - "Long-Running Processes, aka Sagas"
---

# PRC-05 · Un long-running process a une identité, un suivi et un chemin d’échec

<RuleMeta />

## Signal

- Un processus réparti sur plusieurs étapes, dont les events ne portent aucune identité de processus.
- Aucun objet ne suit son avancement.
- Aucune déduplication des events de fin d’étape, aucun timeout, aucune compensation ni traitement de l’échec.
- Une transaction distribuée pour faire tenir le tout.

## Pourquoi

Sans identité de processus, le code qui pilote le processus ne sait pas quelles étapes terminées vont ensemble. Dans un domaine métier, cela peut être désastreux.

Un objet de suivi, un aggregate, se crée au démarrage du processus. Il sait si le processus est terminé, et ignore les doublons. Il gère aussi un timeout : vérifié à l’arrivée de l’event suivant (passif), ou déclenché par un scheduler (actif).

Un long-running process n’est pas une transaction distribuée. Tant qu’il n’est pas fini, les participants ne sont pas cohérents entre eux. La reprise sur erreur est essentielle, compensation comprise.

## Exceptions

- La forme la plus simple, où des aggregates partenaires suivent chacun leur part du processus. Elle convient aux processus les plus simples.
- Le métier peut aussi accepter l’échec, et proposer un traitement manuel plutôt qu’une compensation.

## Correction

Une identité de processus portée par chaque event, un objet de suivi persistant, un timeout, et un chemin d’échec explicite, avec un event d’abandon.

## Voir aussi

AGG-08 et MSG-04 pour la discipline des handlers et les doublons. PRC-04 pour l’initiateur qui suit son processus.
