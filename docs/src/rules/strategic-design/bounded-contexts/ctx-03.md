---
code: CTX-03
title: Le code suit le glossaire du bounded context
group: Langage et frontière
scope: [domain, application, driving]
style: [tactical, transaction-script]
severity: major
severityNote: "Majeure pour un terme rejeté ou un double nom. Question pour un terme absent. Sans glossaire (voir Mettre en place un projet), la règle est inactive, et la revue le signale dans son résumé."
review: approved
sources:
  - "Why You Should Do DDD (zero translation)"
  - "How to Do DDD › Ubiquitous Language"
  - "Ubiquitous, but Not Universal"
---

# CTX-03 · Le code suit le glossaire du bounded context

<RuleMeta />

## Signal

- Un terme que le glossaire du bounded context marque comme rejeté apparaît dans le code du domaine, de l’application ou de l’API de ce bounded context.
- Un même concept porte deux noms entre le code, l’API et les tests.
- Un nouveau terme métier apparaît dans le domaine, mais pas dans le glossaire.

## Pourquoi

Le but est zéro traduction entre les experts métier, les développeurs et le code, pas seulement moins de traductions. Un concept absent du langage convenu du bounded context est rejeté.

## Exceptions

Les glossaires et les diagrammes vieillissent. Seuls le code et la façon dont l’équipe parle reflètent toujours le langage actuel. Un terme absent du glossaire n’est donc pas toujours un défaut : le glossaire peut être en retard.

Un terme rejeté dans un bounded context reste libre dans un autre (CTX-01).

## Correction

- Terme rejeté ou double nom : renommer.
- Terme absent : demander s’il faut compléter le glossaire ou renommer.
