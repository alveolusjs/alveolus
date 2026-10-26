---
code: CTX-15
title: Un module avant un bounded context
group: Taille et organisation
scope: [structure]
style: [tactical, transaction-script]
severity: question
detection: []
review: approved
sources:
  - "Module before Bounded Context"
---

# CTX-15 · Un module avant un bounded context

<RuleMeta />

## Signal

Un nouveau bounded context (un nouveau service, un nouveau modèle séparé) créé pour des objets cohésifs, alors que le vocabulaire ne montre pas clairement deux langages.

## Pourquoi

Quand le vocabulaire est flou et que la frontière ne s’impose pas, garder d’abord les objets ensemble. Les séparer par un module, une frontière peu coûteuse, et non par un bounded context, une frontière bien plus chère.

Un bounded context ne remplace pas un module. Mais quand les langages divergent vraiment, un bounded context séparé est pleinement justifié.

## Exceptions

Deux langages clairement distincts, confirmés par les experts métier.

## Correction

Commencer par un module. En faire un bounded context quand les langages divergent clairement.

## Voir aussi

CTX-11 vise les bounded contexts créés pour des raisons techniques ou pour répartir le travail. CTX-15 vise le cas où le langage est simplement flou. PLC-04 découpe un bounded context en modules.
