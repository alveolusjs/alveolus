---
code: TST-08
title: Aucun test désactivé ni relancé
group: Fiabilité
scope: [tests]
style: [tactical, transaction-script]
severity: major
detection: []
review: approved
sources: []
---

# TST-08 · Aucun test désactivé ni relancé

<RuleMeta />

## Signal

- `it.skip`, `it.todo` ou `it.only` dans le code commité.
- `retry` dans la configuration de Vitest ou dans un test.
- Un test commenté.

## Pourquoi

Un test désactivé ne prouve plus rien, et la CI reste verte. Un `.only` coupe tous les autres tests du fichier. Relancer un test instable cache sa cause, parfois un vrai défaut du code.

## Exceptions

Aucune.

## Correction

- Un test instable se corrige, ou se supprime (TST-07).
- Un comportement pas encore écrit arrive avec son test, pas avant.

## Adaptation

Vitest refuse déjà `.only` en CI (`allowOnly`). La configuration ne fixe ni `retry`, ni `allowOnly`.

## Voir aussi

TST-07 retire les causes d’un test instable.
