---
code: PER-05
title: Un mapper traduit, il ne décide rien
group: Mappers
scope: [driven]
style: [tactical]
severity: minor
detection: LLM
review: approved
sources: []
---

# PER-05 · Un mapper traduit, il ne décide rien

<RuleMeta />

## Signal

- Un mapper qui calcule : `debitsBlocked: row.blocks.some((block) => block.debits)`.
- Un mapper qui change un statut : `status: row.closedAt ? 'closed' : row.status`.
- Un mapper qui interroge la base, ou qui reçoit un repository.

## Pourquoi

Un calcul dans le mapper est une règle hors du modèle : les tests de l’aggregate ne la voient pas, et l’adapter suivant du même aggregate ne l’applique pas. Une requête dans le mapper cache une lecture que le repository ne montre pas.

Réduit à une traduction, champ par champ, un mapper se lit d’un coup d’œil, et n’a rien à tester au-delà de son aller-retour.

## Exceptions

Une conversion de format : un entier d’unités mineures en `Money`, une `Date` à minuit en date du calendrier.

## Correction

La règle va dans l’aggregate ou dans un value object : le wallet sait lui-même si ses débits sont bloqués. La lecture va dans le repository, qui passe toutes les lignes au mapper.

## Voir aussi

PLC-09 place le mapper à côté de son adapter. SRV-01 met le comportement sur l’objet qui le possède.
