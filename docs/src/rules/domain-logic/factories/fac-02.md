---
code: FAC-02
title: Une factory method est nommée dans le langage du métier
group: Règles
scope: [domain]
style: [tactical]
severity: minor
review: approved
sources:
  - "Factories in the Domain Model"
  - "Creating CalendarEntry Instances"
  - "Creating Discussion Instances"
---

# FAC-02 · Une factory method est nommée dans le langage du métier

<RuleMeta />

## Signal

Une création écrite `new X(...)`, `XFactory.create(...)` ou `X.create(...)`, alors que le langage dit qui crée quoi.

## Pourquoi

Une factory method porte un nom tiré du langage. Un constructeur ne le peut pas. Nommer les méthodes d’après ce que disent les experts métier :

- « Un titulaire ouvre un wallet » donne `holder.openWallet()`.
- « Un ordre de virement permanent émet un virement à chaque échéance » donne `standingOrder.issueTransfer()`.

Avec un simple constructeur public, cette part du langage disparaît du modèle.

## Exceptions

Une création que le langage ne nomme pas.

## Correction

Le verbe du métier, sur l’aggregate qui crée.

## Voir aussi

ENT-11 nomme les méthodes dans le langage du métier. ENT-12 donne une méthode à chaque intention.
