---
code: PER-09
title: Un nombre calculé à partir d’autres lignes se prend sous verrou
group: Transactions
scope: [driven, application]
style: [tactical, transaction-script]
severity: blocking
detection: []
review: approved
sources: []
---

# PER-09 · Un nombre calculé à partir d’autres lignes se prend sous verrou

<RuleMeta />

## Signal

- Le prochain numéro d’un relevé pris comme `max(number) + 1`.
- Un plafond journalier vérifié en additionnant les retraits du jour, puis un retrait inséré, sans rien qui arrête un retrait concurrent.

## Pourquoi

PostgreSQL exécute les transactions en `READ COMMITTED` par défaut : chacune lit ce qui était validé au début de sa requête. Deux retraits lisent le même total du jour, passent tous deux le plafond, écrivent tous deux. Deux relevés lisent le même maximum, et prennent le même numéro. La version d’un aggregate n’aide que si chaque écriture qui change le total fait aussi avancer la version de cet aggregate : quand les lignes lues ne sont pas les lignes écrites, elle ne protège rien.

## Exceptions

Un numéro qui doit seulement être unique, pas consécutif : un UUIDv7 ou une séquence de la base suffit.

## Correction

- Un verrou sur une ligne qui existe déjà, comme celle du wallet, posé par `SELECT … FOR UPDATE` avant la lecture : la seconde transaction attend la première. Verrouiller les lignes lues ne suffit pas, car une transaction concurrente peut toujours en insérer une nouvelle.
- Ou une ligne compteur, incrémentée dans la même transaction, quand le verrou du wallet gênerait ses autres écritures : la mise à jour verrouille seulement le compteur.
- Ou chaque écriture qui change le total fait avancer la version d’un aggregate (AGG-15) : chaque retrait passe par `journal.book()`, qui fait avancer la version de son wallet, si bien que deux retraits simultanés entrent en conflit, et que le second échoue.
- Ou une ligne qui porte le total, versionnée comme un aggregate (AGG-15) : les retraits du jour d’un wallet.

## Voir aussi

PER-03 laisse la base refuser un doublon. AGG-11 trace l’aggregate autour de l’invariant, ce qui supprime souvent le besoin du verrou.

## Exemple

Numéroter les relevés d’un wallet, sans trou ni doublon.

```ts
// Avoid: two transactions read the same maximum and take the same number
const last = await db.statement.aggregate({ where: { walletId }, _max: { number: true } });
const number = (last._max.number ?? 0) + 1;

await db.statement.create({ data: { walletId, number, closedOn } });
```

| | Transaction A | Transaction B |
| --- | --- | --- |
| 1 | lit le maximum : 41 | |
| 2 | | lit le maximum : 41 |
| 3 | crée le relevé 42 | |
| 4 | | crée le relevé 42 : **un doublon** |

```ts
// Preferred: the wallet row stays locked until the transaction ends
await db.$queryRaw`SELECT id FROM wallets.wallet WHERE id = ${walletId}::uuid FOR UPDATE`;

const last = await db.statement.aggregate({ where: { walletId }, _max: { number: true } });
const number = (last._max.number ?? 0) + 1;

await db.statement.create({ data: { walletId, number, closedOn } });
```

| | Transaction A | Transaction B |
| --- | --- | --- |
| 1 | verrouille le wallet | |
| 2 | | veut verrouiller le wallet : attend |
| 3 | lit le maximum : 41, crée le relevé 42, puis le commit libère le verrou | |
| 4 | | verrouille le wallet, lit le maximum : 42, crée le relevé 43 |

Tant que A tient le verrou, les autres écritures sur ce wallet attendent aussi, débits compris : la transaction doit rester courte (PER-08). Si cette attente gêne, une ligne compteur, `UPDATE … SET last = last + 1 … RETURNING last`, ne verrouille que la numérotation.
