---
code: CTX-02
title: Un terme a un seul sens dans le bounded context
group: Langage et frontière
scope: [domain]
style: [tactical]
severity: question
detection: LLM
review: approved
sources:
  - "Subdomains and Bounded Contexts at Work (Figure 2.1: Customer in the e-commerce system, Item in inventory)"
---

# CTX-02 · Un terme a un seul sens dans le bounded context

<RuleMeta />

## Signal

Une même classe a des sens différents selon le use case :

- souvent, une entity aux nombreux champs optionnels, chaque groupe ne servant qu’un seul flux (entrée en relation, conformité, facturation) ;
- ou un `status` qui range sous un seul nom des concepts que le métier distingue. Par exemple, un client `prospect`, `active`, `frozen`, `closed` ou `in-recovery` : la relation commerciale, une décision de conformité et le recouvrement dans un même champ.

## Pourquoi

Dans un bounded context sain, chaque terme a un sens précis. Plusieurs sens sous un même nom révèlent plusieurs modèles cachés, fusionnés en un seul. Chacun freine l’évolution des autres, et tout finit par dépendre de tout.

## Exceptions

Des états que le métier voit comme les étapes de la vie d’un seul concept.

## Correction

Demander à l’expert métier si ces usages forment un seul concept. Sinon, donner à chaque concept son propre nom, et envisager des bounded contexts séparés si les langages divergent.
