---
code: REP-11
title: Une lecture sur plusieurs aggregates est une query sur une view
group: Requêtes
scope: [application, driven]
style: [tactical]
severity: minor
severityNote: Mineure pour une view assemblée à la main. Question quand ces finders se multiplient.
review: approved
sources:
  - "Additional Behavior (use case optimal query, and the 'Repository masks Aggregate mis-design' smell)"
---

# REP-11 · Une lecture sur plusieurs aggregates est une query sur une view

<RuleMeta />

## Signal

- Un use case qui charge des aggregates entiers de plusieurs types pour en tirer quelques champs et composer une réponse.
- Un finder ajouté à un repository seulement pour alimenter un écran.

## Pourquoi

Certaines views n’épousent la forme d’aucun aggregate. Ne pas charger plusieurs aggregates pour les assembler à la main. Préférer une query construite pour la view, qui lit les tables dont elle a besoin et renvoie une valeur pensée pour elle.

Le repository reste l’outil des commands. Il peut renvoyer une valeur dont une command a besoin pour décider, comme `hasPosted()`, mais pas une view. Si les commands ont besoin de plus en plus de ces lectures transverses, les frontières sont peut-être mal placées (AGG-11). Si l’analyse montre qu’elles sont justes et que les views sont complexes, envisager CQRS.

## Exceptions

Aucune.

## Correction

Une query, et son view port (`*-views.port.ts`) implémenté dans `driven` sur les mêmes tables (UC-08). Au-delà de simples jointures, un read model à part demande une décision consignée (CTX-16).

## Voir aussi

UC-08 fait lire des views aux queries, et modifier des aggregates aux commands. AGG-11 fait suivre à la frontière un vrai invariant. REP-10 traite le même besoin quand il porte sur les parties d’un seul aggregate.
