---
code: MSG-03
title: Le forwarder publie dans l’ordre et suit ce qu’il a envoyé
group: Publication
scope: [application, driven]
style: [tactical, transaction-script]
kind: safeguard
requires: [messaging.outbox-forwarder]
severity: blocking
severityNote: Majeure pour un forwarder placé dans le domaine.
detection: []
review: approved
sources:
  - "Publishing Notifications through Messaging Middleware"
  - "Implementation (NotificationService, PublishedMessageTracker)"
---

# MSG-03 · Le forwarder publie dans l’ordre et suit ce qu’il a envoyé

<RuleMeta />

## Signal

- Un forwarder qui ne lit pas les events non publiés dans l’ordre de leur séquence.
- Un forwarder qui ne suit pas le dernier event publié sur chaque canal.
- Un forwarder qui marque un event comme publié avant que le broker n’ait confirmé l’envoi.
- Un forwarder placé dans le domaine.
- Un forwarder qui lit après le dernier event publié sans attendre les transactions encore ouvertes.

## Pourquoi

Le forwarder lit tous les events non publiés d’un canal, triés par numéro de séquence croissant. Il les envoie un par un. Il n’enregistre le dernier publié qu’après la confirmation du broker. Pour un integration event, il n’attend pas la confirmation des consumers : garantir la livraison est le travail du broker.

Une séquence est donnée à l’écriture, pas au commit. La transaction qui a reçu le numéro 10 peut commiter après celle qui a reçu le 11. Si le forwarder publie le 11 et l’enregistre, il ne relira jamais le 10 : l’event est perdu.

Livrer les events est une affaire d’application, pas de domaine, même si les domain events naissent dans le modèle. Le forwarder est un use case, et le suivi des publications appartient à la couche application.

## Exceptions

Aucune.

## Correction

Un forwarder dans `application`, déclenché périodiquement, qui garde l’identifiant du dernier event publié sur chaque canal. Il ne lit jamais au-delà d’un event dont la transaction est encore ouverte. Après une panne, il peut republier : les consumers filtrent ces doublons (MSG-04).

## Adaptation

**Notre choix** : le forwarder est un use case, déclenché périodiquement par un scheduler (PLC-10). Il publie par un port d’`application`, implémenté dans `driven`. Par défaut, cette implémentation livre aux consumers du même déploiement. Un broker la remplace quand une intégration en a besoin.

Une entrée `domain` ne passe par aucun broker. Le forwarder la livre lui-même à chaque event handler asynchrone de son bounded context, qui a son propre canal. Il ouvre une transaction par entrée, y appelle l’event handler et y enregistre sa position : un event handler qui échoue est rejoué seul, sans doublon.

Avec PostgreSQL, chaque ligne de l’outbox garde la transaction qui l’a écrite (`pg_current_xact_id()`). Le forwarder ne lit que les lignes écrites avant la plus ancienne transaction encore ouverte (`pg_snapshot_xmin(pg_current_snapshot())`).

## Voir aussi

MSG-01 pour l’outbox. MSG-07 pour un forwarder arrêté.
