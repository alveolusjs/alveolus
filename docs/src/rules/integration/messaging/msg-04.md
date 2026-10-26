---
code: MSG-04
title: Le consumer ignore les doublons et suit ses messages dans la même transaction
group: Consommation
scope: [driving]
style: [tactical, transaction-script]
severity: major
detection: []
review: approved
sources:
  - "Implementation › Event De-duplication"
  - "Modeling Events (commit idempotent)"
  - "Modeling Events › Identity"
---

# MSG-04 · Le consumer ignore les doublons et suit ses messages dans la même transaction

<RuleMeta />

## Signal

- Un consumer d’events sans protection contre les doublons.
- Un suivi des messages traités qui ne garde que le dernier identifiant, alors que les messages peuvent arriver dans le désordre.
- Un suivi écrit dans une autre transaction que les changements du modèle.

## Pourquoi

Un message peut arriver plusieurs fois. Par exemple, le subscriber tombe avant d’en accuser réception, ou le forwarder tombe avant d’enregistrer le dernier event publié.

Il y a deux solutions :

- une opération du domaine idempotente par nature : rétablir un payer déjà actif n’a aucun effet (ACL-04). C’est souvent difficile à obtenir ;
- sinon, un consumer idempotent. Il garde l’identifiant de chaque message traité, et ignore ceux qu’il a déjà vus.

Garder seulement le dernier identifiant ne suffit que si les messages arrivent strictement dans l’ordre. Dans tous les cas, le suivi s’écrit dans la même transaction que les changements du modèle : un message traité est un message dont les effets sont enregistrés.

## Exceptions

Une opération du domaine vraiment idempotente.

## Correction

Une table des messages traités (consumer, identifiant du message), écrite dans la transaction du traitement, et purgée périodiquement. C’est un mécanisme technique, pas une partie du modèle.

## Adaptation

**Notre choix** : `IntegrationConsumer` enregistre chaque consumer sous un nom stable, comme `notifications.notify-withdrawal`. Il ouvre la transaction, ignore un `eventId` déjà traité par ce consumer, appelle le traitement, puis marque le message comme traité, dans la même transaction.

## Voir aussi

AGG-08 pour la discipline des handlers. MSG-05 pour les doublons qu’un identifiant de message ne voit pas.
