---
code: ENT-14
title: Une entity naît complète
group: Construction et validation
scope: [domain]
style: [tactical]
severity: major
review: approved
sources:
  - "Construction"
---

# ENT-14 · Une entity naît complète

<RuleMeta />

## Signal

- Une entity que l’on peut construire dans un état invalide : constructeur vide suivi de setters, paramètres obligatoires rendus optionnels, méthode `init()` à appeler ensuite.
- Un appelant qui crée directement une entity dont la création devrait être contrôlée par un autre objet.

## Pourquoi

Le constructeur reçoit assez d’état pour identifier l’entity et la retrouver. Avec une génération précoce, il reçoit au moins l’identité. Si un invariant dépend d’un état non nul ou calculé, cet état passe par le constructeur.

Chaque affectation passe par des setters privés qui vérifient leurs préconditions. Une création complexe ou contrôlée passe par une factory. Par exemple, seul `wallet.debit()` peut créer une `LedgerEntry` qui débite le wallet : l’écriture part toujours du bon wallet, et un wallet fermé ou bloqué au débit la refuse.

## Exceptions

La reconstitution depuis la persistance, qui peut prendre un chemin dédié et caché.

## Correction

Un constructeur avec les paramètres obligatoires et leurs préconditions, réservé au module, et une factory nommée dans le langage pour les créations contrôlées (FAC-01, FAC-03).
