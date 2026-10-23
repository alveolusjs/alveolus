---
code: AGG-03
title: Référencer les autres aggregates par leur identité
group: Références et dépendances
scope: [domain]
style: [tactical]
severity: major
review: approved
sources:
  - "Rule: Reference Other Aggregates by Identity"
  - "Making Aggregates Work Together through Identity References"
  - "Favor Value Object Parts"
---

# AGG-03 · Référencer les autres aggregates par leur identité

<RuleMeta />

## Signal

- Une propriété d’aggregate typée par l’aggregate root d’un autre aggregate (`beneficiary: Beneficiary`), ou par une collection d’aggregate roots.
- Une relation d’ORM entre deux aggregate roots, quand les classes de l’ORM servent aussi de modèle du domaine.

C’est encore plus vrai pour un aggregate d’un autre bounded context.

## Pourquoi

Une référence d’objet ne fait pas entrer l’autre aggregate dans la frontière. Elle le rend seulement facile à modifier, et pousse à modifier deux instances dans la même transaction (AGG-06). Elle alourdit aussi le chargement, et empêche de stocker ou de partitionner les aggregates séparément.

## Exceptions

Une référence directe, en lazy loading, pour régler un problème de performance en lecture, après un arbitrage explicite. Rare, et documentée par un waiver.

## Correction

Garder l’identité typée (`beneficiaryId: BeneficiaryId`). Le use case charge l’autre aggregate s’il en a besoin et le lui passe en paramètre (AGG-04, AGG-07).
