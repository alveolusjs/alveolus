---
code: AGG-11
title: La frontière suit un vrai invariant, pas la composition des objets
group: Frontière et taille
scope: [domain]
style: [tactical]
severity: major
severityNote: À poser comme une question si l’invariant peut exister hors du code.
detection: []
review: approved
sources:
  - "First Attempt: Large-Cluster Aggregate"
  - "Rule: Model True Invariants in Consistency Boundaries"
  - "Rule: Design Small Aggregates"
---

# AGG-11 · La frontière suit un vrai invariant, pas la composition des objets

<RuleMeta />

## Signal

Un aggregate regroupe des entities ou des collections qu’aucune règle métier ne lie à l’aggregate root au moment du commit. Les raisons souvent avancées, toutes de faux invariants :

- « X a des Y » ;
- un cycle de vie commun ;
- empêcher la suppression d’un élément référencé.

## Pourquoi

Un aggregate est une frontière de cohérence, pas un graphe d’objets commode à parcourir. Un faux invariant fait échouer des opérations sans rapport entre elles : deux utilisateurs qui modifient deux parties différentes se bloquent l’un l’autre. Il nuit aussi aux performances et à la montée en charge.

## Exceptions

Des attributs qui changent ensemble par nature (le nom et le prénom d’un client) forment un invariant implicite, même si le métier ne l’énonce pas.

## Correction

Demander quelle règle doit tenir au moment du commit, et quels éléments elle lie. Tout ce qui sort de cette règle quitte l’aggregate et est référencé par son identité.
