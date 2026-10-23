---
code: ENT-01
title: Une entity seulement quand l’identité et le changement comptent
group: Nature d’une entity
scope: [domain]
style: [tactical]
severity: minor
review: approved
sources:
  - "Chapter introduction"
  - "Why We Use Entities"
---

# ENT-01 · Une entity seulement quand l’identité et le changement comptent

<RuleMeta />

## Signal

- Un concept modélisé comme une entity, avec une identité, alors que personne ne distingue ses instances et qu’on le remplace en entier quand il change.
- Un modèle où presque chaque table devient une entity avec des getters et des setters, souvent générée à partir du schéma.

## Pourquoi

Modéliser une entity quand tout cela est vrai :

- chaque instance compte pour elle-même ;
- il faut la distinguer de toutes les autres ;
- elle change au fil du temps, mais reste la même.

On abuse des entities bien plus qu’on ne le croit. Un concept devrait souvent être un value object. Partir des colonnes et des clés étrangères donne une copie du modèle de données, pas un modèle du domaine.

## Exceptions

Un bounded context où le DDD ne vaut pas l’effort, déclaré `transaction-script` (CTX-13, CTX-14).

## Correction

Se demander si le concept doit être suivi individuellement dans le temps. Sinon, en faire un value object (VO-01).

## Voir aussi

AGG-14 préfère des value objects comme parties d’un aggregate. ENT-10 traite de l’anemic model, qui suit souvent.
