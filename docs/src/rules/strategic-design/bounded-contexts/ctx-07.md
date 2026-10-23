---
code: CTX-07
title: Chaque bounded context a son propre modèle d’un concept partagé
group: Homonymes entre bounded contexts
scope: [domain, structure]
style: [tactical, transaction-script]
severity: major
severityNote: Majeure pour un modèle central. Question pour une copie identique, qui signale une erreur probable mais pas certaine.
detection: hybrid
detectionNote: Repérage des classes dupliquées entre bounded contexts, jugement pour le reste.
review: approved
sources:
  - "Making Sense of Bounded Contexts (Table 2.1 and Figure 2.5 on Account, the publisher's Book example, 'Whiteboard Time' sidebar on copied concepts)"
---

# CTX-07 · Chaque bounded context a son propre modèle d’un concept partagé

<RuleMeta />

## Signal

- Un modèle central censé servir tous les bounded contexts pour un même concept (un seul `Customer` pour tout le cycle de vie, de la prospection au recouvrement).
- Ou l’inverse : la même classe, avec les mêmes propriétés et les mêmes opérations, copiée dans deux bounded contexts.

## Pourquoi

Chaque bounded context a sa propre définition du concept. Dans une banque, un client en prospection, en entrée en relation, en gestion de compte, en facturation et en recouvrement n’a ni les mêmes données ni les mêmes opérations. Un modèle central mène à la confusion, aux désaccords, et à peu de logiciel livré.

À l’inverse, une copie identique dans deux bounded contexts signale très probablement une erreur de modélisation. Des concepts bien séparés ont des propriétés et des opérations différentes.

## Exceptions

Un shared kernel déclaré dans la context map. Des bounded contexts peuvent partager une identité (le même `CustomerId` partout) sans partager le modèle.

## Correction

- Pour un modèle central : le découper par bounded context.
- Pour une copie identique : demander si chaque bounded context en a vraiment besoin en entier, ou s’il s’agit d’un shared kernel à déclarer.

## Voir aussi

CTX-01 couvre l’import du modèle d’un autre bounded context. CTX-07 couvre le modèle central et la copie identique.
