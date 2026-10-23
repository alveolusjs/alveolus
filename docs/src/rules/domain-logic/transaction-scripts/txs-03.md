---
code: TXS-03
title: Les règles métier vivent dans le script, pas dans les adapters
group: Forme d’un script
scope: [application, driving, driven]
style: [transaction-script]
severity: major
review: approved
sources: []
---

# TXS-03 · Les règles métier vivent dans le script, pas dans les adapters

<RuleMeta />

## Signal

- Un controller qui vérifie une condition métier avant d’appeler le script : « on ne renonce qu’à des frais en attente ».
- Un middleware ou une extension Prisma, ou un trigger de base de données, qui change un statut ou calcule un montant.
- Un consumer de messages qui décide quoi faire d’après le contenu du message, puis appelle un script pour la partie facile.

## Pourquoi

Le script est le seul endroit où un lecteur cherche les règles d’un use case. Une règle cachée dans un adapter est sautée par les autres points d’entrée : le même use case, appelé depuis un message, une CLI ou un test, ne la vérifie plus.

Les triggers de base de données et les extensions de l’ORM sont pires : ils s’exécutent à chaque écriture, invisibles depuis le code qui les provoque.

## Exceptions

La validation des DTO à la frontière reste dans les adapters : un schéma de requête qui refuse un champ manquant ou un montant négatif.

## Correction

Déplacer la règle dans le script. L’adapter traduit l’entrée, appelle le script et traduit la réponse, rien de plus.

## Voir aussi

UC-04 garde le use case mince en style tactique. Ici, le script est le lieu des règles : ce sont donc les adapters qui restent minces.
