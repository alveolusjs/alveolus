---
code: PER-03
title: La base garantit ce qu’aucun aggregate ne voit seul
group: Le schéma
scope: [schema, driven]
style: [tactical, transaction-script]
severity: blocking
severityNote: Majeure pour une colonne toujours remplie mais déclarée optionnelle.
detection: []
review: approved
sources: []
---

# PER-03 · La base garantit ce qu’aucun aggregate ne voit seul

<RuleMeta />

## Signal

- Un use case qui vérifie « ce titulaire n’a pas encore de wallet en euros », puis en insère un, sans contrainte d’unicité derrière.
- Une référence d’opération qui ne doit pas être comptabilisée deux fois, sans index unique dessus.
- Une colonne que le modèle remplit toujours, déclarée optionnelle.
- Deux tables du même bounded context liées par une identité, sans clé étrangère.

## Pourquoi

Un aggregate protège ses propres invariants, et sa version les protège des modifications concurrentes (AGG-15). Une règle qui porte sur plusieurs instances échappe aux deux : deux requêtes vérifient chacune qu’aucun wallet n’existe, toutes deux n’en trouvent aucun, toutes deux insèrent. Seule la base voit les deux écritures ensemble.

Il en va de même pour une opération qu’un client rejoue après un timeout : la vérification dans le code passe deux fois si les deux appels s’exécutent en même temps.

## Exceptions

Une règle sur plusieurs instances que le métier accepte de réparer après coup (AGG-10), par un processus qui la détecte et la corrige.

## Correction

- Une contrainte d’unicité pour chaque unicité que le métier énonce : `@@unique([holderId, currency])`, `reference String @unique`.
- `NOT NULL` pour ce que le modèle tient toujours, des clés étrangères à l’intérieur du bounded context.
- Le repository traduit la violation en un refus renvoyé par `save` (REP-03), que le use case renvoie tel quel. Un script la traduit lui-même (TXS-04).

## Voir aussi

AGG-15 protège les invariants d’un seul aggregate. MSG-05 rend une opération idempotente par sa clé métier.
