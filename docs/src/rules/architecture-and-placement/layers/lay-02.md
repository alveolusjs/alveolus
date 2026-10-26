---
code: LAY-02
title: Aucun cycle entre modules de même niveau
group: Sens des dépendances
scope: [structure]
style: [tactical, transaction-script]
severity: major
detection: [dependency-cruiser]
review: approved
sources:
  - "Designing with Modules (Table 9.1)"
  - "Modules of the Agile Project Management Context"
---

# LAY-02 · Aucun cycle entre modules de même niveau

<RuleMeta />

## Signal

- Une dépendance circulaire entre deux modules frères d’une même couche : `domain/wallet` importe `domain/holder`, et `domain/holder` importe `domain/wallet`.
- Un cycle plus long : A importe B, B importe C, et C importe A.
- Le même cycle entre deux modules de l’`application`, ou entre deux technologies de `driving` ou de `driven`.

Un module et ses propres sous-modules ne sont pas de même niveau.

## Pourquoi

Des modules totalement indépendants sont rarement possibles : un modèle implique du couplage. Mais une dépendance à sens unique entre deux modules de même niveau réduit beaucoup ce couplage.

Par exemple, un module `money` (`Money`, `Currency`) ne dépend d’aucun autre module. Tous les autres dépendent de lui, sans cycle.

## Exceptions

Aucune. Deux aggregates qui se référencent l’un l’autre, comme un titulaire qui ouvre des wallets qui pointent vers lui, vont dans le même module (PLC-04). Un cycle qui subsiste fait l’objet d’un waiver.

## Correction

- Inverser l’une des deux dépendances.
- Extraire le concept partagé dans un module dont les deux dépendent.
- Revoir le découpage.
