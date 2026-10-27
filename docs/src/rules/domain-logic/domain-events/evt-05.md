---
code: EVT-05
title: Un event porte de quoi agir sans relire sa source
group: Modéliser l’event
scope: [domain, public]
style: [tactical]
severity: major
severityNote: Majeure quand un subscriber ne peut pas agir sans relire la source. Mineure sinon.
detection: []
review: approved
sources:
  - "Modeling Events"
  - "Modeling Events › Identity"
  - "Autonomous Services and Systems"
---

# EVT-05 · Un event porte de quoi agir sans relire sa source

<RuleMeta />

## Signal

- Un event sans date d’occurrence.
- Un event sans l’identité de son aggregate ou des autres aggregates concernés.
- Un subscriber qui doit relire l’aggregate source, parce que l’event ne contient pas ce dont il a besoin.
- En multi-tenant, un event sans l’identité du tenant.
- Un event publié hors du bounded context sans identité unique, ni dans l’event ni dans l’enveloppe du message.

## Pourquoi

Chaque event porte au moins le moment où il s’est produit. Il porte aussi les données qui permettraient de rejouer la méthode qui l’a produit : en général, l’identité de l’aggregate et celles des autres aggregates concernés.

Par exemple, `MoneyWithdrawn` porte le titulaire, parce que le subscriber des notifications doit savoir qui prévenir. On peut ajouter l’état de l’aggregate après la méthode, ici le solde après le retrait, pour épargner aux subscribers une relecture coûteuse.

Un event publié hors du bounded context a besoin d’une identité unique, pour que les subscribers écartent les doublons.

## Exceptions

Aucune.

## Correction

La date de l’event, l’identité de l’aggregate, et dans le `payload` des identités typées et les paramètres utiles de la méthode. L’identifiant unique du message est donné à l’integration event, quand il est traduit (MSG-04).

## Voir aussi

AGG-09 met des identités dans les events, pas des objets. ENT-09 traite du tenant.

## Exemple

```ts
export class MoneyWithdrawn extends DomainEvent<
	WalletId,
	{ readonly holderId: HolderId; readonly amount: Money; readonly balance: Money }
> {}
```

`aggregateId` et `occurredAt` viennent de `DomainEvent`. `holderId` dit au subscriber des notifications qui prévenir, et `balance` lui évite de relire le wallet.
