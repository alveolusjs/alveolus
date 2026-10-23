---
code: EVT-02
title: Un domain event n’est pas une notification technique
group: Modéliser l’event
scope: [domain, driving]
style: [tactical, transaction-script]
severity: major
detection: hybrid
detectionNote: Les subscribers de hooks d’ORM ou de CDC qui appellent du code métier.
review: approved
sources:
  - "Event-Driven Architecture"
  - "Pipes and Filters"
  - "Data Fabric and Grid-Based Distributed Computing › Event-Driven Fabrics and Domain Events"
---

# EVT-02 · Un domain event n’est pas une notification technique

<RuleMeta />

## Signal

- Une réaction métier déclenchée par un event technique : hook d’ORM, trigger de base de données, change data capture sur une ligne, event d’entrée de cache.
- Des events aux noms techniques (`EntityUpdated`, `RowInserted`) et au contenu générique.

## Pourquoi

Un système reçoit toutes sortes d’events : monitoring, logs, provisioning. Seuls les domain events portent ce qui compte pour le modèle. Chacun modélise explicitement une activité du processus métier. Il a un nom qui a un sens pour le métier, une identité, et des propriétés qui portent l’information.

Les events techniques d’un cache ne sont pas des domain events.

## Exceptions

Les events techniques restent légitimes pour le monitoring ou l’infrastructure, tant qu’aucune règle métier n’en dépend.

## Correction

Faire enregistrer l’event par la méthode métier qui produit le fait, avec un nom tiré du langage.

## Voir aussi

EVT-03 exige que les domain events naissent dans le modèle.
