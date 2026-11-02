---
code: SEC-05
title: Aucune valeur n’entre dans le texte d’une requête SQL
group: Entrées
scope: [application, driven]
style: [tactical, transaction-script]
kind: safeguard
requires: [persistence.prisma]
severity: blocking
detection: []
review: to-review
sources: []
---

# SEC-05 · Aucune valeur n’entre dans le texte d’une requête SQL

<RuleMeta />

## Signal

- Du SQL brut construit par concaténation, ou par un template literal ordinaire.
- `$queryRawUnsafe` ou `$executeRawUnsafe` appelé avec une valeur venue d’une requête, d’un message ou de la base.
- Un nom de colonne ou un sens de tri pris tel quel dans la requête HTTP.

## Pourquoi

Une valeur placée dans le texte d’une requête devient du SQL. Celui qui la choisit peut lire les wallets d’un autre client, les modifier ou les supprimer. La validation à la frontière (SEC-01) ne suffit pas : une valeur relue en base, ou passée par un autre bounded context, arrive aussi dans la requête.

## Exceptions

Aucune.

## Correction

- Les requêtes de Prisma, qui envoient les valeurs en paramètres.
- Pour le SQL brut, un tagged template : `$queryRaw` et `$executeRaw` envoient chaque valeur en paramètre.
- Un nom de colonne ou un sens de tri se choisit dans une liste fermée, jamais dans l’entrée.

## Voir aussi

SEC-01 valide l’entrée à la frontière. TXS-06 fait passer le SQL d’un script par le Unit of Work.

## Exemple

```ts
// Avoid: the value becomes part of the SQL text
await db.$queryRawUnsafe(`SELECT id FROM wallets.wallet WHERE holder_id = '${holderId}'`);
```

```ts
// Preferred: the tagged template sends the value as a parameter
await db.$queryRaw`SELECT id FROM wallets.wallet WHERE holder_id = ${holderId}::uuid`;
```
