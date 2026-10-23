---
code: SRV-02
title: Pas de méthode statique sur un aggregate root pour une opération qui ne lui appartient pas
group: Quand créer un domain service
scope: [domain]
style: [tactical]
severity: minor
review: approved
sources:
  - "Chapter introduction and opening case (Product.businessPriorityTotals)"
---

# SRV-02 · Pas de méthode statique sur un aggregate root pour une opération qui ne lui appartient pas

<RuleMeta />

## Signal

Une méthode statique sur la classe d’un aggregate root, qui reçoit d’autres aggregates (`Wallet.monthlyFees(transfers)`), ajoutée parce que l’opération n’avait pas de place évidente.

## Pourquoi

Ce réflexe est un code smell. Il signale souvent un domain service manquant. Si l’on hésite entre `Wallet` et `Transfer` pour porter le calcul, l’opération n’appartient à aucun des deux.

## Exceptions

Une factory method statique qui crée une instance de sa propre classe (FAC-03).

## Correction

Un domain service nommé dans le langage (`FeeCalculator`). Il va chercher ce dont il a besoin et renvoie un value object.
