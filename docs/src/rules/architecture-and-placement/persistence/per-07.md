---
code: PER-07
title: Chaque lecture courante s’appuie sur un index, déclaré dans le schéma
group: Lectures
scope: [schema, driven, tests]
style: [tactical, transaction-script]
severity: minor
severityNote: Majeure pour une lecture derrière la requête d’un titulaire, sur une table qui grossit sans limite.
review: approved
sources: []
---

# PER-07 · Chaque lecture courante s’appuie sur un index, déclaré dans le schéma

<RuleMeta />

## Signal

- Une view qui filtre les écritures par wallet et par date, sans index sur ces colonnes.
- Un index créé à la main en production, absent du schéma.
- Un solde à une date calculé en relisant toutes les écritures depuis l’ouverture.

## Pourquoi

La même requête prend une milliseconde sur une table de test, et des secondes sur un an d’écritures. Le ralentissement vient peu à peu, puis d’un coup, quand la table ne tient plus en mémoire. Déclaré dans le schéma, l’index se relit avec la requête, se crée par la migration, et existe dans tous les environnements.

## Exceptions

Une lecture lancée une fois, par un opérateur, sur une table qui reste petite.

## Correction

- Un index dont les colonnes suivent le filtre, puis l’ordre : `@@index([walletId, bookedOn])`.
- Pour une lecture dont le coût grandit avec l’historique, un total stocké d’où la lecture part : le solde à la fin de chaque journée, puis les écritures du jour.
- Un test de performance sur un volume réaliste, pour les lectures dont le métier dépend.

## Voir aussi

PER-06 borne les listes. REP-12 tient les règles métier hors de la base, même pour gagner en vitesse, sauf si une ADR en décide autrement.
