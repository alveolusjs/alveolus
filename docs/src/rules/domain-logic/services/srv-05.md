---
code: SRV-05
title: Ni transaction ni contrôle d’accès dans un domain service
group: Forme du service
scope: [domain]
style: [tactical]
severity: major
review: approved
sources:
  - "Using a Mini-Layer of Domain Services"
---

# SRV-05 · Ni transaction ni contrôle d’accès dans un domain service

<RuleMeta />

## Signal

Un domain service qui ouvre ou gère une transaction, ou qui vérifie les droits de l’appelant.

## Pourquoi

Les transactions et la sécurité relèvent de l’application. Elles ont leur place dans les use cases, pas dans les domain services.

## Exceptions

Dans un bounded context tactique dont le métier est la détection de la fraude, le contrôle est le domaine lui-même. Là, un `FraudScreening` qui décide de bloquer une opération est un domain service légitime. La règle vise les vérifications des droits de l’appelant, pas un métier dont la sécurité est le sujet.

De même, `WithdrawalLimit` applique une règle métier au retrait, son plafond, et non aux droits de l’appelant. C’est un domain service ordinaire.

## Correction

Déplacer la transaction et le contrôle d’accès dans le use case appelant.

## Voir aussi

CTX-04 garde hors du modèle les concepts d’un autre subdomain, comme les droits d’accès : leur vérification se fait dans le use case. UC-04 garde le use case mince.
