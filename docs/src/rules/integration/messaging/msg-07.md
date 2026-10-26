---
code: MSG-07
title: La publication et la consommation survivent à une panne du broker
group: Pannes
scope: [driving, driven]
style: [tactical, transaction-script]
severity: major
detection: []
review: approved
sources:
  - "When Messaging or Your System Is Unavailable"
---

# MSG-07 · La publication et la consommation survivent à une panne du broker

<RuleMeta />

## Signal

- Un publisher qui réessaie en boucle serrée quand le broker est indisponible.
- Des consumers abonnés une seule fois au démarrage, sans reconnexion ni réabonnement après une panne.
- Aucune alerte quand un consumer ne reçoit plus rien, ou que sa file grossit.

## Pourquoi

Quand le broker est en panne, le publisher espace ses tentatives, jusqu’à une trentaine de secondes ou une minute. Il revient au rythme normal au premier envoi réussi. Avec l’outbox, les events attendent en base, et partent au retour du broker.

Côté consumer, si la librairie ne se réabonne pas seule, c’est à nous de le faire. Sinon, on apprend trop tard que le bounded context ne reçoit plus rien. Ses données dérivent, et personne ne le remarque.

Si le bounded context lui-même reste longtemps en panne, ses files se remplissent. Le rattrapage peut prendre du temps.

## Exceptions

Aucune.

## Correction

- Publisher : un back-off plafonné.
- Consumer : reconnexion et réabonnement automatiques.
- Une alerte sur le retard des consumers.

## Adaptation

Vérifier comment la librairie gère la reconnexion, sans supposer qu’elle le fait. Surveiller le retard des consumers (la taille de la file, l’âge du plus vieux message) rend la panne visible.

**Notre choix** : il n’y a pas de broker par défaut, donc la règle vise le forwarder interne. Un forwarder arrêté doit se voir : une alerte sur l’âge du plus vieil event non livré de l’outbox. La règle s’applique en entier dès qu’un broker arrive.

## Voir aussi

MSG-01 et MSG-03 pour l’outbox et le forwarder. AGG-08 pour les effets d’un event hors de l’aggregate.
