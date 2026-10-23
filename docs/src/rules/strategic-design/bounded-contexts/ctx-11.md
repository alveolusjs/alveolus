---
code: CTX-11
title: La taille d’un bounded context suit le langage
group: Taille et organisation
scope: [structure]
style: [tactical, transaction-script]
severity: question
detection: LLM
review: approved
sources:
  - "Size of Bounded Contexts"
  - "Aligning with Technical Components"
  - "Sample Contexts › Collaboration Context (ten tools, one model)"
  - "Subdomains and Bounded Contexts at Work (un sous-domaine simple en module)"
---

# CTX-11 · La taille d’un bounded context suit le langage

<RuleMeta />

## Signal

- Un nouveau service, un nouveau dépôt ou un nouveau module présenté comme un bounded context, alors qu’il parle le même langage qu’un bounded context existant. Il est né d’un découpage technique (deployment unit, habitude d’un framework), ou pour répartir le travail entre développeurs.
- Un subdomain simple (quelques algorithmes) isolé dans un composant lourd, avec sa propre intégration.

## Pourquoi

Un bounded context est aussi grand que son langage l’exige, ni plus, ni moins. Un faux bounded context découpe le langage et le rend moins expressif.

Un seul modèle peut servir une dizaine d’outils indépendants, livrés comme des deployment units séparées. Un composant technique ne définit pas le bounded context.

## Exceptions

Des langages vraiment différents, confirmés par les experts métier. Dans l’autre sens, ne pas sortir du core des concepts qui lui appartiennent.

## Correction

Utiliser des modules au sein du même bounded context. Ils permettent aussi de répartir le travail. Au besoin, livrer un même modèle en plusieurs deployment units.

Se demander : que dit le langage des experts métier de cette frontière ?
