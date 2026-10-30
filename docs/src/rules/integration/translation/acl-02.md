---
code: ACL-02
title: Ne traduire que le nécessaire
group: Anticorruption layer
scope: [driven]
style: [tactical, transaction-script]
severity: minor
detection: []
review: approved
sources:
  - "Mapping the Three Contexts › Collaboration Context (sidebar after the Translation Map)"
  - "Mapping the Three Contexts › Agile Project Management Context (sidebar 'Think Minimalistic')"
---

# ACL-02 · Ne traduire que le nécessaire

<RuleMeta />

## Signal

- Le concept local construit depuis l’autre bounded context recopie la plupart de ses attributs.
- Un translator qui reprend une grosse représentation champ par champ.
- Une classe locale qui ressemble à celle de l’upstream, comme un `AccountHolder` qui n’est qu’un `Customer` renommé, avec son adresse, sa date de naissance et son statut de vérification.

## Pourquoi

Le modèle local ne garde que l’état dont il se sert. Ce n’est pas seulement moins de synchronisation : c’est une bonne modélisation.

Une traduction lourde, qui recopie beaucoup et aboutit à un objet proche de l’original, montre qu’on emprunte trop au modèle étranger. Les deux modèles se mélangent sans que personne ne s’en aperçoive.

## Exceptions

Aucune.

## Correction

Partir de ce que le modèle local utilise, et retirer le reste.

## Voir aussi

ACL-03 pour les copies à synchroniser. VO-07 pour une copie figée en value object.
