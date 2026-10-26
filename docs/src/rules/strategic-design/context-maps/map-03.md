---
code: MAP-03
title: Un shared kernel reste petit et change avec les deux équipes
group: Relations particulières
scope: [structure]
style: [tactical, transaction-script]
severity: major
severityNote: Majeure pour un changement fait sans l’autre équipe. Question quand le shared kernel grossit.
detection: []
review: approved
sources:
  - "Shared Kernel (definition)"
  - "Chapter 2, sidebar 'A Single Team for a Single Bounded Context'"
---

# MAP-03 · Un shared kernel reste petit et change avec les deux équipes

<RuleMeta />

## Signal

- Le shared kernel grossit (nouvelles classes métier).
- Un changement du shared kernel sans relecture par l’autre équipe.
- Aucune intégration continue n’exécute les tests des deux côtés.

## Pourquoi

Partager une partie du modèle crée une forte dépendance entre les deux équipes. Le shared kernel doit :

- rester petit ;
- avoir une frontière explicite ;
- ne pas changer sans concertation avec l’autre équipe ;
- être protégé par une intégration continue qui garde les deux langages alignés.

Cette relation est rare, et mieux vaut l’éviter.

## Exceptions

Aucune.

## Correction

Une entrée CODEOWNERS qui exige l’approbation des deux équipes sur le dossier du shared kernel, et une CI qui teste ses deux consumers.
