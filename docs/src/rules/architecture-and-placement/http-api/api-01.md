---
code: API-01
title: Le modèle du domaine ne s’expose pas tel quel en REST
group: REST
scope: [driving]
style: [tactical, transaction-script]
severity: major
detection: []
review: approved
sources:
  - "Representational State Transfer › REST and DDD"
---

# API-01 · Le modèle du domaine ne s’expose pas tel quel en REST

<RuleMeta />

## Signal

- Un controller qui renvoie directement un aggregate ou une entity sérialisés, ou qui reçoit des objets du domaine dans le corps de la requête.
- Des decorators de sérialisation ou de documentation de l’API (`class-transformer`, Swagger) posés sur des classes du domaine.

## Pourquoi

Quand l’API expose le modèle du domaine, chaque changement du modèle atteint l’API, même quand l’extérieur n’en a que faire. Il peut casser les clients.

Utiliser un modèle d’API à part, conçu autour des use cases. Chaque ressource se construit à partir d’un ou de plusieurs aggregates. On décide alors, au cas par cas, si un changement du domaine se voit dans l’API.

## Exceptions

Une API construite autour d’un media type standard, où un modèle représente le format lui-même. On est alors proche d’un shared kernel ou d’un published language.

## Correction

Des représentations propres à l’API, dans `driving/http`, construites par le controller à partir de la view que renvoie une query ou du résultat d’une command : `driving` n’importe jamais `domain`. Si l’API sert d’autres bounded contexts, son contrat va dans `public` (PUB-01).

## Voir aussi

PUB-01 vise le langage publié aux autres bounded contexts. API-01 s’applique à toute API REST, y compris celle qui sert l’interface.
