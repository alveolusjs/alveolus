---
code: TXS-05
title: Un bounded context en transaction scripts reste à plat
group: Organisation et accès aux données
scope: [structure]
style: [transaction-script]
severity: major
review: approved
sources: []
---

# TXS-05 · Un bounded context en transaction scripts reste à plat

<RuleMeta />

## Signal

- Un dossier `domain` dans un bounded context déclaré en transaction scripts, qui contient des entities avec getters et setters.
- Un script qui importe un adapter driven, comme un client e-mail, au lieu d’un port.
- Un adapter driving qui écrit lui-même dans la base de données.

## Pourquoi

Les couches tactiques existent pour protéger un modèle. Sans modèle, un dossier `domain` n’ajoute qu’une cachette pour un anemic model (ENT-10), et des mappers qui ne traduisent rien.

Le reste de l’architecture hexagonale reste rentable : le script se teste seul, les transports restent remplaçables, et les autres bounded contexts ne voient toujours que le contrat publié.

## Exceptions

Aucune. Un bounded context qui a besoin d’un modèle passe au style tactique (TXS-08).

## Correction

Quatre dossiers, côte à côte :

| Dossier | Contient |
| --- | --- |
| `application` | Un application service par concept, une méthode par use case, leurs erreurs, leurs value objects et les ports dont ils ont besoin (TXS-01) |
| `driving` | Les controllers, les consumers et les schedulers, par technologie |
| `driven` | Les adapters des ports : e-mail, fichiers, autres bounded contexts, par technologie |
| `public` | Le contrat publié |

## Adaptation

**Notre choix** : contrairement au style tactique, Prisma n’est pas un adapter ici. Les scripts l’utilisent directement (TXS-06) : `driven/prisma` n’a donc pas lieu d’être.

## Voir aussi

L’architecture de référence décrit les deux organisations.
