---
code: EVT-07
title: Un event handler synchrone n’écrit que dans la transaction de son use case
group: Les event handlers du bounded context
scope: [driving, driven, structure]
style: [tactical]
kind: structure
severity: major
detection: []
review: approved
sources:
  - "Publishing Events from the Domain Model"
  - "Publishing Events from the Domain Model › Subscribers (sidebar 'Be Careful about What the Event Handler Does')"
---

# EVT-07 · Un event handler synchrone n’écrit que dans la transaction de son use case

<RuleMeta />

## Signal

- Un event handler synchrone qui charge et modifie un autre aggregate.
- Un event handler synchrone qui appelle un service distant, envoie un e-mail ou publie vers un broker.
- Un event handler synchrone qui fait autre chose que les trois actions de la Correction.

## Pourquoi

Un event handler synchrone s’exécute dans la transaction du use case. Modifier un second aggregate enfreint la règle d’une seule instance par transaction (AGG-06). Un appel distant garde la connexion et les verrous aussi longtemps que le partenaire met à répondre, et ne s’annule pas si la transaction échoue (PER-08).

## Exceptions

Aucune.

## Correction

Un event handler synchrone fait seulement l’une de ces trois choses :

- traduire le domain event en integration event et l’écrire dans l’outbox ;
- mettre à jour une projection de lecture dans la même base ;
- écrire une trace d’audit.

Tout autre event handler est déclaré asynchrone (AGG-08).

## Adaptation

**Notre choix** : le mode se déclare à l’enregistrement de l’event handler, dans le registre du bounded context (EVT-08). Le registre ne montre que `'sync'` ou `'async'` : la revue vérifie qu’un event handler `'sync'` reste dans la liste.

## Voir aussi

AGG-06, AGG-08, PER-08. La section [Domain event ou integration event](../../integration/#domain-or-integration) explique le choix du mode.
