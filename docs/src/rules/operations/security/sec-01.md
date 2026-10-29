---
code: SEC-01
title: Une entrée externe se valide à la frontière
group: Entrées
scope: [driving]
style: [tactical, transaction-script]
severity: major
severityNote: Bloquante si la valeur non validée est écrite en base ou décide d’un droit.
detection: []
review: approved
sources: []
---

# SEC-01 · Une entrée externe se valide à la frontière

<RuleMeta />

## Signal

- `@Body() body: DebitWalletRequest`, typé sans schéma : TypeScript ne vérifie rien à l’exécution.
- Un message consommé lu par `JSON.parse(raw) as WalletDebited`.
- Une chaîne sans longueur maximale, un nombre sans borne, une liste sans taille maximale.
- Des champs inconnus d’une requête HTTP acceptés et passés plus loin.

## Pourquoi

Un type TypeScript disparaît à l’exécution : seul un schéma arrête ce que le client envoie. Validée à l’entrée, une valeur arrive au use case typée et bornée. Sinon, chaque couche doit se méfier, et l’une finit par oublier.

## Exceptions

Aucune.

## Correction

- Chaque entrée a son schéma : le corps, les paramètres et la query d’une requête, le message consommé.
- Le schéma borne les chaînes, les nombres et les listes.
- Une requête HTTP aux champs inconnus est refusée. Un message consommé les ignore (PUB-05).
- Une entrée invalide est refusée par l’adapter, avant tout use case.
- Le schéma vérifie la forme. Les droits et les invariants restent au use case et au modèle.

## Adaptation

Les exemples utilisent Zod, comme les requêtes de l’API HTTP. `.strict()` refuse les champs inconnus.

## Voir aussi

ACL-02 traduit la réponse d’un système tiers. API-01 sépare la requête du modèle du domaine.
