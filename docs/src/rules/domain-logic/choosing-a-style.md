# Choisir un style

Chaque bounded context choisit un style d’implémentation pour sa logique métier, et le déclare (CTX-14). Le style décide quelles règles s’appliquent, quels dossiers existent et qui peut importer quoi.

## La décision {#the-decision}

Partir du type du subdomain dans la context map :

| Subdomain | Style | Pourquoi |
| --- | --- | --- |
| **Core** : ce qui distingue l’entreprise | Modèle tactique | Des règles riches qui changent souvent : les aggregates gardent les invariants en un seul endroit |
| **Supporting** : nécessaire et propre à l’entreprise, sans la distinguer | Transaction scripts | Une logique mince : une procédure par use case coûte moins cher, et reste assez claire |
| **Generic** : résolu de la même façon partout | Transaction scripts, ou un produit | Peu de logique propre : souvent, mieux vaut l’acheter ou l’encapsuler |

Une ADR peut déroger à ce choix par défaut : un bounded context supporting aux règles riches peut prendre le style tactique, et un nouveau bounded context core peut démarrer en scripts le temps de l’explorer.

## Ce qui change avec le style {#what-changes-with-the-style}

| | Transaction scripts | Modèle tactique |
| --- | --- | --- |
| Dossiers | `application`, `driving`, `driven`, `public` | `domain`, `application`, `driving`, `driven`, `public` |
| Règles métier | Dans le script de chaque use case | Dans les aggregates, les entities et les value objects |
| Base de données | Prisma dans le script, à travers le Unit of Work | Des repositories derrière des ports, Prisma dans `driven/prisma` |
| Transaction | Ouverte par le script | Ouverte par le use case |
| Refus | Des valeurs `Result` | Des valeurs `Result` |
| Règles qui s’appliquent | Badge *Transaction script* ou *Les deux styles* | Badge *Tactique* ou *Les deux styles* |

Tout le reste est commun : la conception stratégique, le contrat publié, l’intégration entre bounded contexts, HTTP, le nommage et les tests.

## Le déclarer {#declaring-it}

Chaque application liste ses bounded contexts et leur style dans `architecture.json`, à sa racine :

```json
{
  "contexts": {
    "payments": "tactical",
    "notifications": "transaction-script",
    "legacy": "big-ball-of-mud"
  }
}
```

Une big ball of mud se déclare aussi, avec la valeur `big-ball-of-mud`. Ce n’est pas un troisième style : elle n’a pas de couches, et on la contient au lieu de la modéliser (MAP-04).

`@alveolus/claude-rules` le lit pour donner à Claude Code les règles du style de chaque bounded context, et pour contenir chaque big ball of mud.

## Changer de style {#changing-style}

Un bounded context dépasse ses scripts quand les mêmes règles commencent à se répéter de l’un à l’autre (TXS-08). Il passe alors au style tactique en entier, avec une ADR, et sa déclaration change en dernier. Un bounded context ne mélange jamais les deux styles.
