---
code: PUB-01
title: Un published language documenté, distinct du modèle interne
group: Published language
scope: [public]
style: [tactical, transaction-script]
severity: major
detection: [eslint]
review: approved
sources:
  - "Open Host Service and Published Language (definitions)"
  - "Mapping the Three Contexts (technical characteristics, media type application/vnd.saasovation.idovation+json)"
---

# PUB-01 · Un published language documenté, distinct du modèle interne

<RuleMeta />

## Signal

- Un bounded context upstream expose ses objets internes tels quels : une entity du domaine ou un modèle Prisma sérialisé en réponse d’API, ou un event obtenu en sérialisant un aggregate.
- Un contrat d’API ou d’event sans schéma documenté ni version.

## Pourquoi

Deux bounded contexts se comprennent par un langage commun et documenté. Chaque côté traduit vers ce langage, et depuis ce langage. Le modèle interne peut alors changer sans casser l’autre côté.

Ce langage prend la forme d’un media type et de ses représentations : JSON, Protocol Buffers… Il vaut aussi pour les domain events publiés en messages.

## Exceptions

Aucune.

## Correction

Un schéma publié et versionné dans `public`, construit par traduction depuis le modèle interne : dans `driven` pour les events sortants, dans `driving` pour les réponses d’API. Le schéma dit le format de chaque champ : un identifiant, une date, un montant.

## Adaptation

Le schéma s’écrit en OpenAPI, JSON Schema, AsyncAPI ou protobuf. Les types TypeScript de `public` en suivent la forme.

Le published language vit dans `public` (voir l’[architecture de référence](../../../start/reference-architecture)).

## Voir aussi

AGG-09 pour le contenu des events. CTX-01 pour l’import de classes d’un bounded context à l’autre.
