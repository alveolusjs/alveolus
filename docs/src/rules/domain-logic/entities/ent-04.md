---
code: ENT-04
title: Une identité saisie par l’utilisateur doit être stable
group: Identité
scope: [domain]
style: [tactical]
severity: major
severityNote: Majeure si le modèle permet de changer la valeur qui sert d’identité. Question sinon.
detection: []
review: approved
sources:
  - "Unique Identity › User Provides Identity"
---

# ENT-04 · Une identité saisie par l’utilisateur doit être stable

<RuleMeta />

## Signal

- Une valeur saisie par l’utilisateur (nom, e-mail, libellé, IBAN saisi à la main) sert d’identité, alors qu’elle peut être fausse ou corrigée plus tard.
- Pire : le modèle a une méthode pour la changer.

## Pourquoi

La plupart du temps, une identité doit être immuable. Un utilisateur peut saisir une valeur unique mais fausse, comme un libellé de bénéficiaire mal orthographié. Et changer une identité coûte cher.

## Exceptions

- Une valeur stable, délivrée par une autorité, comme le numéro d’immatriculation d’une entreprise.
- Une identité lisible par un humain, exigée par le métier et protégée par un circuit de validation, au prix d’une création plus lente.

## Correction

Garder la valeur saisie comme une propriété de recherche, qui peut changer. Générer l’identité autrement.
