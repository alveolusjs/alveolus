---
code: AGG-12
title: Aucune collection non bornée dans un aggregate
group: Frontière et taille
scope: [domain]
style: [tactical]
severity: major
severityNote: Majeure si la croissance n’est pas bornée. Question sinon.
detection: []
review: approved
sources:
  - "Rule: Design Small Aggregates"
  - "Estimating Aggregate Cost"
  - "Common Usage Scenarios"
  - "Memory Consumption"
---

# AGG-12 · Aucune collection non bornée dans un aggregate

<RuleMeta />

## Signal

- Une collection qui grandit avec le temps ou l’usage, sans limite métier (historique, mouvements, journal, commentaires).
- Une command qui charge toute la collection pour y ajouter un élément.
- Un gros attribut rarement lu, chargé à chaque command.

## Pourquoi

Une cardinalité « 0..\* » n’est presque jamais nulle, et elle ne fait que croître. On finit par charger des milliers d’objets pour une opération triviale, et chaque ajout entre en conflit avec les autres.

## Exceptions

Une collection plafonnée par une règle métier, ou dont la taille réaliste estimée reste petite. Un aggregate de quelques dizaines d’objets chargés reste acceptable.

## Correction

Pour chaque nouvelle collection, demander une estimation rapide :

- la taille maximale réaliste ;
- le nombre d’objets chargés par command ;
- si deux utilisateurs travaillent en même temps sur la même instance.

Si la croissance n’est pas bornée, sortir l’élément dans son propre aggregate, référencé par son identité. Pour un gros attribut rarement lu, un aggregate séparé : le repository charge des aggregates entiers (REP-02), sans lazy loading.
