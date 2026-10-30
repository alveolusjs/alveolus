---
code: OBS-03
title: Une opération garde son identifiant de corrélation jusqu’au consumer
group: Corrélation
scope: [application, driving, driven]
style: [tactical, transaction-script]
severity: major
detection: []
review: approved
sources: []
---

# OBS-03 · Une opération garde son identifiant de corrélation jusqu’au consumer

<RuleMeta />

## Signal

- Une requête, et les messages qu’elle a fait publier, qu’aucun champ commun ne relie dans les logs.
- Un identifiant de corrélation reçu dans la requête, puis perdu dans l’outbox.
- Un identifiant passé de paramètre en paramètre, jusque dans les commands et le domaine.

## Pourquoi

Une opération traverse une requête, une transaction, l’outbox, puis un consumer, parfois dans un autre bounded context. Sans un identifiant commun, on ne retrouve pas ce qu’une requête a déclenché. L’ajouter plus tard change l’outbox et les métadonnées de chaque message.

## Exceptions

Aucune.

## Correction

- L’adapter driving reprend l’identifiant reçu, ou en crée un, et le porte dans le contexte de l’opération.
- Le logger l’ajoute à chaque ligne.
- L’outbox l’enregistre avec le message (MSG-01), et le forwarder le publie dans les métadonnées, jamais dans le payload.
- Le consumer le reprend avant de traiter le message.
- Ni les commands ni le domaine ne le voient.

## Adaptation

`AsyncLocalStorage` porte l’identifiant pendant l’opération, comme il porte la transaction du Unit of Work (REP-14).

## Voir aussi

MSG-03 publie les messages de l’outbox. OBS-01 structure les logs qui le portent.
