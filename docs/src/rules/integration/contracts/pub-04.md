---
code: PUB-04
title: Un contrat d’event publié évolue par versions
group: Published language
scope: [public]
style: [tactical, transaction-script]
severity: major
detection: hybrid
detectionNote: Le diff d’un contrat d’event publié hors du bounded context.
review: approved
sources:
  - "Autonomous Services and Systems"
---

# PUB-04 · Un contrat d’event publié évolue par versions

<RuleMeta />

## Signal

- Un event publié hors du bounded context dont un champ est renommé, retiré, ou change de sens, sans nouvelle version.
- Un subscriber qui rappelle le bounded context source pour compléter un event auquel il manque une information.

## Pourquoi

Un event publié est un contrat, parfois à l’échelle de toute l’entreprise. S’il manque une information à un subscriber, c’est le contrat qui change : le subscriber ne va pas la chercher ailleurs. Un changement qui casse un consumer passe par une nouvelle version explicite de l’event, ou par un autre event.

Un champ ajouté ne casse personne, puisque les consumers ignorent ce qu’ils ne lisent pas (PUB-05). Il ne demande pas de nouvelle version.

## Exceptions

Un event qui ne sort pas du bounded context.

## Correction

Une nouvelle version de l’event, ou un nouvel event. Il est publié à côté de l’ancien, jusqu’à ce que plus aucun consumer ne lise l’ancien.

## Adaptation

**Notre choix** : le message porte sa version dans un champ `version`, et chaque version a son fichier dans `public`. Le type ne change pas (PUB-03). Pendant la migration, le translator de `driven` publie les deux versions de chaque domain event, et chaque consumer lit celle qu’il connaît. Quand le dernier consumer est passé à la nouvelle version, l’ancienne n’est plus publiée, et son fichier disparaît.

## Voir aussi

PUB-01 pour le published language. PUB-05 pour le côté consumer. PER-11 et REP-09 pour faire évoluer des données stockées.

## Exemple

`balance` devient `balanceAfter`, pour dire de quel solde il s’agit. Le renommage casse les consumers qui lisent `balance` : c’est une version 2, à côté de la version 1.

```txt
public/
├── money-withdrawn.v1.ts
└── money-withdrawn.v2.ts
```

```ts
export interface MoneyWithdrawnMessageV2 {
	readonly eventId: string;
	readonly type: typeof MONEY_WITHDRAWN;
	readonly version: 2;
	readonly occurredOn: string;
	readonly payload: MoneyWithdrawnPayloadV2;
}

export interface MoneyWithdrawnPayloadV2 {
	readonly walletId: string;
	readonly holderId: string;
	readonly amount: PublishedMoney;
	readonly balanceAfter: PublishedMoney;
}
```
