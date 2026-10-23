---
code: EVT-07
title: Un subscriber synchrone ne modifie pas un autre aggregate
group: Les subscribers du bounded context
scope: [driving]
style: [tactical]
severity: major
detection: hybrid
detectionNote: Les listeners in-process qui appellent un repository pour écrire.
review: approved
sources:
  - "Publishing Events from the Domain Model"
  - "Publishing Events from the Domain Model › Subscribers (sidebar 'Be Careful about What the Event Handler Does')"
---

# EVT-07 · Un subscriber synchrone ne modifie pas un autre aggregate

<RuleMeta />

## Signal

Un subscriber in-process qui charge et modifie un autre aggregate, alors qu’il est appelé de façon synchrone pendant la command. Par exemple, un `@OnEvent` branché sur l’event emitter local, ou un subscriber du publisher du domaine.

## Pourquoi

Un subscriber synchrone s’exécute dans la même call stack que l’aggregate qui publie. Il tourne donc dans la même transaction que le use case qui a appelé le modèle. Modifier un second aggregate depuis là enfreint la règle d’une seule instance par transaction.

Mettre à jour les autres aggregates de façon asynchrone. Le messaging livre l’event, et chaque subscriber asynchrone modifie son aggregate dans sa propre transaction.

## Exceptions

Un subscriber synchrone peut enregistrer l’event dans l’outbox. Ce qui sort du processus, comme un e-mail, part de l’outbox, après le commit (PER-08).

## Correction

Le subscriber synchrone ne fait qu’enregistrer l’event (MSG-01). Un consumer asynchrone modifie l’autre aggregate.

## Adaptation

Avec `@nestjs/event-emitter`, `emit` appelle les listeners de façon synchrone par défaut, dans la call stack de l’appelant. Vérifier dans quelle transaction ils écrivent.

## Voir aussi

AGG-06 et AGG-08. AGG-08 désigne les handlers ; cette règle est celle qui les vérifie.
