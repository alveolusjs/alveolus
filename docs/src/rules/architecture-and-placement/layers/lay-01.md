---
code: LAY-01
title: "Le domaine déclare ses interfaces, `driven` les implémente"
group: Sens des dépendances
scope: [domain, application, driven]
style: [tactical, transaction-script]
severity: major
detection: fitness
detectionNote: "dependency-cruiser sur `domain/` et `application/`."
review: approved
sources:
  - "Layers"
  - "Dependency Inversion Principle"
  - "Hexagonal or Ports and Adapters"
---

# LAY-01 · Le domaine déclare ses interfaces, `driven` les implémente

<RuleMeta />

## Signal

- Un fichier du domaine importe une bibliothèque technique (ORM, client HTTP, driver de base de données, broker, framework).
- Une interface de repository typée avec des types de l’ORM.
- Une implémentation de repository placée dans `domain` ou `application` au lieu de `driven`.
- Un use case ou un domain service qui importe ou construit un adapter : `new PrismaWalletRepository(…)`, un client HTTP, un client mail.

## Pourquoi

Avec l’inversion des dépendances (DIP), le domaine et l’infrastructure dépendent tous deux d’abstractions que le domaine définit. L’infrastructure implémente les interfaces que le domaine déclare : repositories, domain services techniques.

Le domaine et l’application s’écrivent et se lisent alors sans leur infrastructure, et l’infrastructure peut changer derrière eux.

Le code qui publie les domain events reste petit lui aussi, sans dépendance au messaging. C’est l’application qui enregistre les subscribers qui stockent ou transmettent les events.

## Exceptions

Certains outils d’infrastructure exigent que les domain events étendent un type du framework. C’est un compromis rare, fait en connaissance de cause.

## Correction

L’interface dans `domain`, l’implémentation dans `driven`, et le lien entre les deux dans le module NestJS du bounded context (WIR-01). Le use case reçoit le port, jamais l’adapter.

## Adaptation

Les ports purement techniques (Unit of Work, outbox, horloge) ne sont pas des concepts métier. Ils sont déclarés dans `application`, et `driven` les implémente aussi. Voir l’[architecture de référence](../../../start/reference-architecture).

En NestJS, le port s’écrit comme une `abstract class`, qui sert aussi d’injection token.

**Notre choix** : dans un bounded context tactique, `@prisma/client` n’est importé que dans `driven`. Un bounded context en transaction scripts n’a pas de `domain` : ses ports vivent dans `application`, et ses scripts y utilisent Prisma (TXS-05, TXS-06). dependency-cruiser vérifie les deux styles, avec les autres règles de dépendances.

## Voir aussi

AGG-04 interdit l’injection dans l’aggregate. CTX-06 vise les SDK tiers. LAY-01 généralise à toute dépendance technique. TST-01 teste l’application sur ses vrais adapters, derrière les mêmes ports.
