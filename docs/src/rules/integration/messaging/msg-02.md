---
code: MSG-02
title: Un event enregistré ne change jamais
group: Publication
scope: [driven, schema]
style: [tactical, transaction-script]
severity: major
review: approved
sources:
  - "Event Store"
  - "Publishing Notifications as RESTful Resources (sidebar 'What's an Archived Log All About?')"
---

# MSG-02 · Un event enregistré ne change jamais

<RuleMeta />

## Signal

- Un `UPDATE` ou un `DELETE` sur la table des events enregistrés.
- Un event déjà publié corrigé sur place.

## Pourquoi

Les events enregistrés se gardent dans l’ordre où ils se sont produits. Un event enregistré ne change jamais : un consumer doit être sûr qu’un event qu’il a appliqué reste appliqué pour de bon.

## Exceptions

Aucune.

## Correction

Corriger par un nouvel event, jamais en modifiant l’ancien.
