---
code: CTX-13
title: L’investissement tactique suit la complexité du domaine
group: Style d’implémentation
scope: [structure]
style: [tactical, transaction-script]
severity: question
detection: LLM
review: approved
sources:
  - "Why You Should Do DDD › Grappling with the Complexity of Your Domain (Table 1.1 and 'Use DDD to Simplify, Not to Complicate' sidebar)"
  - "Anemia and Memory Loss"
  - "Justification for Domain Modeling"
---

# CTX-13 · L’investissement tactique suit la complexité du domaine

<RuleMeta />

## Signal

- Toute la boîte à outils tactique (aggregate, port de repository, mapper, domain events) dans un bounded context où chaque opération est une création, une lecture, une mise à jour ou une suppression, sans règle.
- Un anemic model habillé en architecture hexagonale : la cérémonie du DDD sans le comportement (ENT-10).
- Des règles métier qui s’accumulent dans des transaction scripts, dans un bounded context classé core.

## Pourquoi

Réserver l’investissement aux zones complexes : le subdomain core d’abord, puis les subdomains supporting importants. Un CRUD pur n’a pas besoin du DDD.

Avec un anemic model, mieux vaut admettre que l’on fait du transaction script, et simplifier l’architecture. À l’inverse, la complexité est presque toujours sous-estimée. Un transaction script demande souvent autant de code, voire plus.

## Exceptions

Un choix déjà consigné : une ADR, ou une context map qui classe le subdomain et indique l’approche.

## Correction

Poser la question à partir du type de subdomain dans la context map :

- subdomain core : investir ;
- subdomain generic, ou supporting sans innovation : envisager plus simple.
