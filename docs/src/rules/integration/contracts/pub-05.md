---
code: PUB-05
title: Le consumer ne lit que les champs dont il a besoin
group: Côté consumer
scope: [driving]
style: [tactical, transaction-script]
severity: minor
severityNote: Majeure si un champ ajouté par le producer peut bloquer la consommation.
review: approved
sources:
  - "Exchanging Information across System Boundaries (lecture d'une notification comme version 1)"
---

# PUB-05 · Le consumer ne lit que les champs dont il a besoin

<RuleMeta />

## Signal

- Un consumer qui valide un message entrant contre tout le schéma du producer, et le rejette quand un champ apparaît (`z.strictObject`, `.strict()`).
- Un mapping qui exige chaque champ, y compris ceux que le consumer n’utilise pas.
- Un consumer qui lit un champ ajouté récemment sans prévoir son absence : les messages publiés avant l’ajout ne l’ont pas.

## Pourquoi

Un consumer qui ne lit que ce dont il a besoin survit aux évolutions du producer. Le producer ajoute un champ : le consumer ne change pas. Seul un changement qui touche un champ qu’il lit l’oblige à changer, et ce changement arrive dans une nouvelle version (PUB-04).

## Exceptions

Un breaking change prévu, publié en nouvelle version (PUB-04).

## Correction

Valider seulement les champs que le consumer utilise, et ignorer le reste.

## Adaptation

Avec Zod, `z.object` ignore les champs inconnus : c’est le comportement voulu. Le schéma vit dans le `driving` du consumer, et ne déclare que ce qu’il lit.

## Voir aussi

PUB-04 pour le côté producer. PUB-01 pour le published language.

## Exemple

Le consumer des notifications prévient le titulaire d’un retrait. Il lit le titulaire et le montant, et ignore `walletId`, `balance` et tout champ ajouté plus tard.

```ts
export const IncomingMoneyWithdrawn = z.object({
	eventId: z.uuid(),
	type: z.literal(MONEY_WITHDRAWN),
	version: z.literal(1),
	payload: z.object({
		holderId: z.uuid(),
		amount: z.object({ minor: z.string(), currency: z.string() }),
	}),
});
```
