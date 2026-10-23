---
code: MAP-01
title: Le code met en œuvre la relation déclarée dans la context map
group: La context map et le code
scope: [structure, driven]
style: [tactical, transaction-script]
severity: major
severityNote: Majeure si le code contredit la relation déclarée. Question pour une intégration absente de la context map.
review: approved
sources:
  - "Chapter introduction"
  - "Why Context Maps Are So Essential"
  - "Drawing Context Maps"
  - "Projects and Organizational Relationships (definitions)"
---

# MAP-01 · Le code met en œuvre la relation déclarée dans la context map

<RuleMeta />

## Signal

- Le diff ajoute une dépendance vers un autre bounded context (client HTTP, consumer de messages, import) que la context map ne liste pas.
- Le code contredit la relation déclarée. Par exemple, la context map annonce une anticorruption layer, mais le code utilise telles quelles les représentations du bounded context upstream : en pratique, la relation est conformist.
- Le code s’appuie sur une évolution d’API que le bounded context upstream n’a jamais promise.

## Pourquoi

Une relation mal identifiée est un piège. On se croit dans une relation customer-supplier, avec un fournisseur qui livrera de nouvelles API. On découvre tard que l’on est conformist, et le projet dérape ou échoue. La context map existe pour forcer cette réflexion tôt.

## Exceptions

Une relation conformist choisie et déclarée.

## Correction

Mettre à jour la context map dans la même merge request, avec le pattern de chaque côté.

Si l’intégration apporte peu, se demander si les deux bounded contexts ne devraient pas suivre chacun leur chemin (separate ways). Une intégration a toujours un coût.
