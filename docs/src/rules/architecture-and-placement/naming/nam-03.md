---
code: NAM-03
title: Le rôle correspond au contenu
group: Noms de fichiers
scope: [structure]
style: [tactical, transaction-script]
severity: major
review: approved
sources: []
---

# NAM-03 · Le rôle correspond au contenu

<RuleMeta />

## Signal

- Un `wallet.aggregate.ts` qui contient un objet simple avec des getters et des setters, ou une fonction.
- Un `debit-wallet.command.ts` qui charge une view et la renvoie : une query sous le nom d’une command.
- Un `prisma-wallet.repository.ts` qui contient aussi le client HTTP d’un fournisseur de taux de change.

## Pourquoi

Un nom qui ment est pire que pas de nom. Le relecteur se fie au suffixe pour savoir quelles règles s’appliquent : celles des aggregates à un `.aggregate.ts`, celles des commands à un `.command.ts`. Quand le contenu ne correspond pas, on applique les mauvaises règles, et on rate les bonnes.

## Exceptions

Un fichier contient son export principal et ce que lui seul utilise : une command et son handler, un aggregate et ses types privés.

## Correction

Renommer le fichier d’après ce qu’il contient, ou déplacer ce qui ne correspond pas dans un fichier de son propre rôle.

## Voir aussi

UC-08 sépare les commands des queries. NAM-04 donne à l’export principal le nom du fichier.
