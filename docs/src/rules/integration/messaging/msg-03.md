---
code: MSG-03
title: Le forwarder publie dans l’ordre et suit ce qu’il a envoyé
group: Publication
scope: [application, driven]
style: [tactical, transaction-script]
severity: major
detection: LLM
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

## Pourquoi

Le forwarder lit tous les events non publiés d’un canal, triés par numéro de séquence croissant. Il les envoie un par un. Il n’enregistre le dernier publié qu’après la confirmation du broker. Il n’attend pas la confirmation des subscribers : garantir la livraison est le travail du broker.

Livrer les events est une affaire d’application, pas de domaine, même si les events naissent dans le modèle. Le forwarder est un use case, et le suivi des publications appartient à la couche application.

## Exceptions

Aucune.

## Correction

Un forwarder dans `application`, déclenché périodiquement, qui garde l’identifiant du dernier event publié sur chaque canal. Après une panne, il peut republier : les consumers filtrent ces doublons (MSG-04).

## Adaptation

**Notre choix** : le forwarder est un use case, déclenché périodiquement par un scheduler (PLC-10). Il publie par un port d’`application`, implémenté dans `driven`. Par défaut, cette implémentation livre aux handlers du même déploiement. Un broker la remplace quand une intégration en a besoin.

## Voir aussi

MSG-01 pour l’outbox. MSG-07 pour un forwarder arrêté.
