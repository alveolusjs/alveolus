---
code: SRV-06
title: Une interface séparée seulement quand elle sert à quelque chose
group: Forme du service
scope: [domain, driven]
style: [tactical]
severity: minor
detection: hybrid
detectionNote: Déterministe pour le suffixe Impl ; le reste se juge en revue.
review: approved
sources:
  - "Modeling a Service in the Domain"
  - "Is Separated Interface a Necessity? (sidebar 'Naming Your Implementation Class')"
---

# SRV-06 · Une interface séparée seulement quand elle sert à quelque chose

<RuleMeta />

## Signal

- L’interface d’un domain service purement métier, avec une seule implémentation nommée `XServiceImpl`.
- L’inverse : un domain service technique (chiffrement, appel externe) implémenté directement dans le domaine. Ce devrait être une interface dans `domain`, avec une implémentation dans `driven`.

## Pourquoi

Une interface séparée aide quand on a besoin de découplage : plusieurs implémentations, ou une implémentation technique. Pour un service purement métier, avec une seule implémentation, une simple classe suffit. L’injection de dépendances découple déjà l’appelant de l’implémentation.

Le suffixe `Impl` signale souvent que l’interface est inutile, ou que personne n’a su nommer ce qui rend l’implémentation particulière. Nommer une implémentation spécialisée d’après sa spécialité.

## Exceptions

Le sujet fait débat, et l’équipe tranche. Une convention explicite de l’équipe l’emporte.

## Correction

- Pour un service métier à une seule implémentation : une simple classe.
- Pour un service technique : une interface dans `domain`, et des implémentations nommées d’après leur spécialité dans `driven`.

## Adaptation

En NestJS, une classe abstraite sert souvent d’injection token. Elle reste une interface séparée.

## Voir aussi

LAY-01 traite des services techniques. Dans la vue d’ensemble, `WithdrawalLimit` est une simple classe, et `RecentWithdrawals`, qui lit la base, est une interface implémentée dans `driven`.
