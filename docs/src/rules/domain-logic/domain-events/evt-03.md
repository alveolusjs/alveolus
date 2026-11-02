---
code: EVT-03
title: Les domain events naissent dans le modèle
group: Modéliser l’event
scope: [domain, application]
style: [tactical]
kind: structure
severity: major
detection: []
review: approved
sources:
  - "The Challenges of Applying DDD (commitTo example)"
---

# EVT-03 · Les domain events naissent dans le modèle

<RuleMeta />

## Signal

Un use case, un handler ou un controller crée un domain event et le publie après avoir modifié un objet du domaine (`eventEmitter.emit(...)`, `eventBus.publish(...)`). Le fait métier n’est signalé que si l’appelant y pense.

## Pourquoi

La méthode métier enregistre elle-même l’event. Elle récupère aussi, sans effort, les events des méthodes métier qu’elle réutilise : `reportStolen` appelle `block`, parce qu’une carte déclarée volée est d’abord bloquée. Publier depuis l’appelant sort de la logique métier du modèle.

## Exceptions

Aucune.

## Correction

La méthode du modèle enregistre l’event (`this.record(...)`). Le use case le transmet au dispatcher après `save`, sans savoir qui le lit.

## Adaptation

L’aggregate enregistre, le use case appelle `dispatch` une seule fois, les event handlers du bounded context réagissent selon leur mode (EVT-07, AGG-08). Le translator est l’un d’eux : il décide si l’event devient un integration event (PUB-01).
