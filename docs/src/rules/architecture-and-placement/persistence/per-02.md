---
code: PER-02
title: Une colonne a le type exact de sa valeur
group: Le schéma
scope: [schema]
style: [tactical, transaction-script]
severity: major
severityNote: Bloquante pour un montant stocké en nombre à virgule flottante.
detection: []
review: approved
sources:
  - "Persisting Value Objects › Reject Undue Influence of Data Model Leakage"
---

# PER-02 · Une colonne a le type exact de sa valeur

<RuleMeta />

## Signal

- Un montant dans un `Float` : `amount Float`.
- Un instant dans un `timestamp` sans fuseau horaire.
- Une date de valeur ou une date de comptabilisation stockée comme un instant, à minuit.
- Un statut dans une `String` libre.
- Une identité dans une `String` sans `@db.Uuid`.

## Pourquoi

Un nombre à virgule flottante ne peut pas contenir `0.10` exactement : les sommes dérivent d’une fraction de centime, et un solde cesse de correspondre à ses opérations. Un instant sans fuseau se lit autrement sur un serveur d’une autre zone. Une date stockée comme un instant à minuit passe à la veille une fois convertie. Un statut en texte libre accepte n’importe quelle faute de frappe.

La colonne est la dernière garde de la valeur. Son type doit refuser ce que le value object refuse.

## Exceptions

Aucune.

## Correction

| Valeur | Type Prisma |
| --- | --- |
| Montant | `BigInt`, en unités mineures de sa devise, à côté de la devise |
| Devise | `String @db.Char(3)`, le code ISO 4217 |
| Identité | `String @db.Uuid` |
| Instant (quand c’est arrivé) | `DateTime @db.Timestamptz(3)` |
| Date métier (date de valeur, date de comptabilisation) | `DateTime @db.Date` |
| Statut, ensemble fermé | un `enum` Prisma |

## Adaptation

Le nombre d’unités mineures dépend de la devise : deux pour l’euro, aucune pour le yen, trois pour le dinar bahreïni. Le value object `Money` le sait ; la colonne ne stocke que l’entier.

**Notre choix** : les montants en `BigInt` d’unités mineures, les statuts en enums Prisma. Le domaine déclare son propre statut comme une union de littéraux, avec les mêmes valeurs (VO-08) : le type Prisma lui est assignable, le mapper n’a besoin d’aucune assertion de type, et le domaine n’importe jamais Prisma (LAY-01).

## Voir aussi

VO-01 donne à chaque concept son type dans le modèle. VO-08 modélise les ensembles fermés.
