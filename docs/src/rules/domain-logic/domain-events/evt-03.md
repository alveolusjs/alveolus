---
code: EVT-03
title: Les domain events naissent dans le modèle
group: Modéliser l’event
scope: [domain, application]
style: [tactical]
severity: major
detection: hybrid
detectionNote: L’instanciation d’une classe d’event hors de domain/ ; le reste se juge en revue.
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

La méthode du modèle enregistre l’event (`this.record(...)`). L’outbox, un adapter `driven`, le fait partir après le commit.

## Adaptation

Même choix qu’AGG-08 : l’aggregate enregistre l’event, puis l’event part par l’outbox (MSG-01). Traduire les domain events en integration events pour d’autres bounded contexts est un autre sujet (PUB-02, PUB-03).
