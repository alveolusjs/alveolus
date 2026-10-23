---
code: AGG-10
title: "Transaction ou eventual consistency : à qui revient le travail ?"
group: Transactions et cohérence
scope: [structure, application]
style: [tactical]
severity: question
detection: LLM
review: approved
sources:
  - "Ask Whose Job It Is"
  - "Is It the Team Member's Job?"
---

# AGG-10 · Transaction ou eventual consistency : à qui revient le travail ?

<RuleMeta />

## Signal

Le diff choisit entre cohérence transactionnelle et eventual consistency entre deux aggregates sans raison métier, ou pour une raison purement technique. Par exemple : un nouveau handler synchrone, une transaction élargie, des aggregates fusionnés ou découpés.

## Pourquoi

Une préférence technique (DDD classique ou CQRS) n’en décide pas. Le test :

- si rendre les données cohérentes est le travail de l’utilisateur qui lance le use case, viser la cohérence transactionnelle, dans le respect des autres règles ;
- si c’est le travail d’un autre acteur ou du système, accepter l’eventual consistency.

La question révèle souvent un vrai invariant ou une règle métier oubliée.

## Exceptions

Une décision déjà consignée (ADR, ticket, waiver commenté).

## Correction

Poser la question aux experts métier. Consigner la réponse et le délai de cohérence acceptable.
