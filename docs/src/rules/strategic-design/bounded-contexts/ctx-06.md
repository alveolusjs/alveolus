---
code: CTX-06
title: Un système externe est un autre bounded context
group: Langage et frontière
scope: [domain]
style: [tactical]
severity: major
review: approved
sources:
  - "Real-World Domains and Subdomains (the mapping service consumed by inventory)"
---

# CTX-06 · Un système externe est un autre bounded context

<RuleMeta />

## Signal

Des types d’un SDK ou d’une API tiers (la réponse d’un service tiers, un client HTTP généré) apparaissent dans le domaine, comme propriété, paramètre ou type de retour.

## Pourquoi

Même derrière une API simple, un service externe appartient à un autre bounded context, avec son propre langage. Ses données demandent au moins une traduction minimale.

Ce service est peut-être le subdomain core de son fournisseur. Pour nous, c’est un subdomain generic, que l’on veut pouvoir remplacer.

## Exceptions

Aucune.

## Correction

Exprimer le besoin dans le domaine avec des concepts locaux, et traduire dans un adapter `driven`.

## Adaptation

En architecture hexagonale, cela donne un port dans `domain` et un adapter `driven` qui traduit. ACL-01 couvre les patterns de protection, comme l’anticorruption layer.
