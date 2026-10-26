---
code: MAP-02
title: Pas de base de données partagée entre bounded contexts
group: La context map et le code
scope: [driven, schema]
style: [tactical, transaction-script]
severity: major
detection: []
review: approved
sources:
  - "Mapping the Three Contexts (passage on autonomy and replication)"
---

# MAP-02 · Pas de base de données partagée entre bounded contexts

<RuleMeta />

## Signal

- Un bounded context réplique les tables d’un autre bounded context pour être autonome.
- Dans un monolithe, un repository ou une requête qui lit directement les tables d’un autre bounded context, ou les joint aux siennes.

## Pourquoi

Être autonome ne veut pas dire copier la base du bounded context upstream. Une copie fait porter au bounded context local des responsabilités qui ne sont pas les siennes. Elle revient à un shared kernel, qui n’apporte aucune autonomie.

À la place, garder des objets locaux traduits, avec un état minimal (ACL-02), synchronisés par des notifications.

## Exceptions

Un shared kernel déclaré dans la context map.

## Correction

Passer par l’open host service ou les events du bounded context upstream, et stocker localement le minimum traduit.

## Adaptation

Dans un monolithe, lire directement les tables d’un autre bounded context est un raccourci facile. Il crée le même partage que la réplication, en plus serré. La règle s’y applique donc aussi.
