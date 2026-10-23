---
code: PRC-06
title: Une couche de composition ne devient pas un modèle caché
group: Composer plusieurs bounded contexts
scope: [application, structure]
style: [tactical, transaction-script]
severity: question
severityNote: Majeure si la composition porte des règles du core domain.
review: approved
sources:
  - "Composing Multiple Bounded Contexts"
---

# PRC-06 · Une couche de composition ne devient pas un modèle caché

<RuleMeta />

## Signal

- Une couche application ou un BFF qui assemble les données de plusieurs bounded contexts, et commence à prendre des décisions métier : des règles de fusion, des concepts qui n’existent dans aucun bounded context, des calculs sur les DTO des autres.
- Ou un front end qui appelle les API de plusieurs bounded contexts et réconcilie lui-même leurs modèles.

## Pourquoi

Quand une interface doit composer plusieurs modèles, une seule couche application sert de point de composition. Elle assemble ce dont l’interface a besoin, sans logique métier. L’interface ne sait pas qu’elle compose plusieurs modèles.

Une telle couche devient vite un nouveau bounded context, de second ordre : sa propre anticorruption layer, un modèle anémique de DTO fusionnés, et des transaction scripts.

Il faut alors décider : rester une composition, ou créer un vrai bounded context, avec un modèle unifié. La décision suit les critères des bounded contexts et l’intérêt du métier, jamais l’envie du moment.

## Exceptions

La variante portail : une couche application et des composants d’interface par modèle. Elle reste possible, mais s’accorde moins bien avec les parcours des use cases.

## Correction

Des modules de composition nommés d’après leur but. Si des règles apparaissent, poser la question d’un nouveau bounded context plutôt que de les laisser grandir dans la composition.

## Voir aussi

CTX-11 : la taille d’un bounded context suit le langage. CTX-15 : un module avant un bounded context. ENT-10 pour le modèle anémique. ACL-01 pour l’anticorruption layer.
