---
code: ENT-02
title: Une entity ne porte que ce que ses use cases écrivent ou lisent
group: Nature d’une entity
scope: [domain]
style: [tactical]
severity: question
detection: LLM
review: approved
sources:
  - "Unique Identity (Evans quote)"
  - "Discovering Entities and Their Intrinsic Characteristics › Uncovering Entities and Properties"
---

# ENT-02 · Une entity ne porte que ce que ses use cases écrivent ou lisent

<RuleMeta />

## Signal

- Une entity avec des attributs qu’aucun use case de son bounded context n’écrit ni ne lit.
- Des attributs qui appartiennent à un autre bounded context. Par exemple, un historique de facturation, un score de risque ou des préférences marketing ajoutés au `Customer` du bounded context `customers`.

## Pourquoi

Réduire d’abord l’entity à ses caractéristiques intrinsèques : ce qui l’identifie ou aide à la retrouver. Puis n’ajouter que les méthodes métier essentielles au concept, et les attributs que ses use cases écrivent ou lisent.

Dans cet exemple, le nom du client reste, parce que le support client s’en sert pour le retrouver. L’historique de facturation part dans `billing`, et le score de risque dans `compliance`. Si `customers` portait tout, il finirait par échouer.

## Exceptions

Un attribut sans logique, comme un nom, a sa place dès qu’un use case l’écrit ou qu’une query le lit, pour l’afficher ou retrouver l’entity. Il n’a besoin ni d’une méthode métier qui l’utilise, ni d’un getter : la query lit une view (UC-08).

## Correction

Pour chaque attribut, demander quel use case de ce bounded context l’écrit ou le lit. Si aucun, le retirer, ou le déplacer dans le bounded context qui en parle.

## Voir aussi

CTX-04 refuse dans le modèle tout concept d’un autre subdomain.
