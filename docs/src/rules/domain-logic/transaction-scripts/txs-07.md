---
code: TXS-07
title: Pas de pseudo-entities, et les types Prisma restent dans le bounded context
group: Organisation et accès aux données
scope: [application, public]
style: [transaction-script]
severity: major
severityNote: Majeure si un type Prisma sort du bounded context. Mineure pour une pseudo-entity interne.
detection: []
review: approved
sources: []
---

# TXS-07 · Pas de pseudo-entities, et les types Prisma restent dans le bounded context

<RuleMeta />

## Signal

- Une classe `Fee`, wrapper d’une ligne Prisma, avec des getters et des setters, et rien d’autre.
- Un contrat publié ou une représentation HTTP qui expose un type de modèle Prisma.
- Un script qui renvoie la ligne Prisma comme réponse.

## Pourquoi

Une classe à getters et setters autour d’une ligne ressemble à un modèle, sans en être un : les règles restent dans les scripts, et la classe n’ajoute qu’un mapping à garder synchronisé. C’est l’anemic model que ce style a été choisi pour éviter (ENT-10).

Les types Prisma suivent la base de données. Exposés aux appelants, ils font de chaque changement de colonne un breaking change du contrat.

## Exceptions

Un value object du bounded context, comme `Money` ou `Iban`, est bienvenu dans un script : il porte ses propres vérifications, pas une ligne. Il vit dans `application`, à côté de l’application service de son concept (`money.value-object.ts`).

## Correction

- Utiliser les types Prisma dans les scripts, tels quels.
- Répondre avec un type du script, ou du contrat publié, construit à partir de la ligne.

## Voir aussi

PUB-01 garde le contrat publié autonome dans les deux styles.
