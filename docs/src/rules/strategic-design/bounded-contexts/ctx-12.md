---
code: CTX-12
title: Une équipe par bounded context
group: Taille et organisation
scope: [structure]
style: [tactical, transaction-script]
severity: major
severityNote: Majeure pour CODEOWNERS. Question pour une merge request.
review: approved
sources:
  - "Aligning with Technical Components, sidebar 'A Single Team for a Single Bounded Context'"
---

# CTX-12 · Une équipe par bounded context

<RuleMeta />

## Signal

- Le fichier de propriété du code (CODEOWNERS ou équivalent) attribue le dossier d’un bounded context à plusieurs équipes.
- Une merge request d’une autre équipe qui modifie le modèle d’un bounded context.

## Pourquoi

Deux équipes sur un même bounded context tirent chacune le langage de leur côté. Il diverge et devient flou.

## Exceptions

Un shared kernel, que deux équipes conçoivent ensemble et ne modifient qu’après s’être concertées. C’est rare, et mieux vaut l’éviter.

Prêter un développeur à une autre équipe reste possible : la règle vise l’équipe responsable du langage.

## Correction

Une seule équipe propriétaire par bounded context. Les autres équipes lui demandent le changement, ou passent par l’intégration.
