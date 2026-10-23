---
code: ACL-03
title: Copier des données étrangères, c’est prendre en charge toute leur synchronisation
group: Données copiées
scope: [domain, driving]
style: [tactical, transaction-script]
severity: major
detection: hybrid
detectionNote: Des attributs d’un autre bounded context dans un aggregate, des handlers de création sans handlers de modification.
review: approved
sources:
  - "Can You Handle the Responsibility?"
  - "Implementing the REST Client Using an Anticorruption Layer (value objects not synchronized)"
---

# ACL-03 · Copier des données étrangères, c’est prendre en charge toute leur synchronisation

<RuleMeta />

## Signal

- Un aggregate local qui garde des attributs d’un objet d’un autre bounded context (le nom du client, son statut), et ne les met à jour qu’à l’event de création (`CustomerOnboarded`).
- Une copie locale sans handler pour les events qui changent ces attributs, suspendent l’objet ou le ferment : un client suspendu, une relation close.
- Une copie pour laquelle personne n’a décidé si elle doit rester à jour.

## Pourquoi

Il y a deux options :

- garder des value objects immuables, jamais synchronisés, et accepter qu’ils vieillissent, parce que ces données changent rarement ;
- garder des aggregates à jour, et en payer le prix. Il faut écouter chaque event de l’upstream qui touche ces quelques attributs, et il y en a plus qu’on ne croit. Il faut aussi supporter les events en double ou dans le désordre.

Il vaut donc mieux copier le moins de données possible entre bounded contexts, idéalement aucune. Un event peut servir à calculer un état local sans en garder les données, et sans la charge de les synchroniser.

## Exceptions

- Les identités. Les copier est nécessaire et sûr, puisqu’elles ne changent jamais. Un objet référencé ailleurs se désactive plutôt que de se supprimer, pour qu’une identité partagée ne pointe jamais vers rien.
- Une copie qu’impose un SLA, quand interroger l’upstream à chaque fois n’est pas tenable. La copie reste alors minimale et synchronisée.

## Correction

Pour chaque champ copié, choisir :

- une copie figée exprès ;
- ou une copie synchronisée, avec la liste des events qui la changent.

Sinon, ne garder que l’identité.

## Voir aussi

VO-07 pour une copie figée en value object. ACL-02 pour ne traduire que le nécessaire. MAP-02 pour ne pas répliquer. REP-06 pour ne pas supprimer physiquement. ACL-04 pour les events qui arrivent dans le désordre.
