---
code: CTX-14
title: Chaque bounded context déclare son style d’implémentation
group: Style d’implémentation
scope: [structure]
style: [tactical, transaction-script]
severity: major
review: approved
sources: []
---

# CTX-14 · Chaque bounded context déclare son style d’implémentation

<RuleMeta />

## Signal

- Un dossier de bounded context dont le style d’implémentation n’est écrit nulle part : le lecteur le devine d’après les dossiers.
- Un bounded context core construit en transaction scripts, ou un bounded context generic construit avec des aggregates, sans raison consignée.
- Un bounded context qui mélange les deux styles : certains use cases sur des aggregates, d’autres en scripts sur les mêmes tables.

## Pourquoi

Les deux styles répondent à des besoins différents. Le modèle tactique est rentable là où les règles métier sont riches et changent souvent : le core. Les transaction scripts coûtent moins cher là où la logique est mince : les subdomains supporting et generic.

Le style décide quelles règles s’appliquent, quels dossiers existent et qui peut importer quoi. S’il n’est pas déclaré, un relecteur ne peut pas distinguer un aggregate manquant d’un script voulu, et l’outillage ne peut pas vérifier la bonne organisation.

Mélanger les deux styles dans un bounded context donne deux sources de vérité pour les mêmes règles, et aucune n’est complète.

## Exceptions

Un bounded context supporting aux règles riches peut prendre le style tactique, et un bounded context core peut démarrer en scripts le temps de l’explorer. Les deux sont acceptables quand une ADR consigne la raison.

## Correction

Classer le subdomain dans la context map, puis déclarer le style de son bounded context :

| Subdomain | Style par défaut |
| --- | --- |
| Core | `tactical` |
| Supporting | `transaction-script` |
| Generic | `transaction-script` |

Une big ball of mud se déclare aussi, avec la valeur `big-ball-of-mud`. Ce n’est pas un style : elle n’a pas de couches, et on la contient au lieu de la modéliser (MAP-04).

Un bounded context qui dépasse ses scripts passe au style tactique en entier (TXS-08).

## Adaptation

**Notre choix** : chaque application déclare le style de ses bounded contexts dans un fichier `architecture.json` à sa racine :

```json
{
  "contexts": {
    "payments": "tactical",
    "notifications": "transaction-script",
    "legacy": "big-ball-of-mud"
  }
}
```

Un bounded context vit dans `src/<nom>/`. S’il vit ailleurs, la forme longue donne son dossier : `"legacy": { "style": "big-ball-of-mud", "path": "apps/back-office/src" }`.

`@alveolus/claude-rules` le lit pour donner à Claude Code les règles du style de chaque bounded context, et pour contenir chaque big ball of mud.

## Voir aussi

CTX-13 pose le principe : l’investissement tactique suit la complexité du domaine. Cette règle rend le choix visible et vérifiable.
