---
code: PRC-03
title: Une ressource distante pas encore disponible est un état du modèle
group: Appels distants
scope: [domain]
style: [tactical]
severity: major
detection: LLM
review: approved
sources:
  - "Mapping the Three Contexts › Integration with the Collaboration Context (DiscussionAvailability)"
---

# PRC-03 · Une ressource distante pas encore disponible est un état du modèle

<RuleMeta />

## Signal

- La référence à une ressource d’un autre bounded context modélisée par un champ optionnel, comme `cardId?: CardId` sur un wallet. Son absence peut vouloir dire plusieurs choses : l’option carte n’est pas souscrite, la carte n’est pas demandée, ou elle est demandée mais pas encore prête.
- Du code qui devine l’état à partir de cette absence.

## Pourquoi

L’eventual consistency n’est pas un bricolage : c’est un état valide de plus, à modéliser. Certaines indisponibilités ont même une raison métier, comme une option carte pas encore souscrite.

Un état explicite protège l’usage de la ressource, et permet un message précis pour chaque cas.

## Exceptions

Aucune.

## Correction

Un value object qui porte un état explicite, et la référence distante quand elle existe. L’aggregate expose une command pour la rattacher : `attachCard`.

## Voir aussi

PRC-02 pour créer la ressource distante par un handler. VO-01 pour les value objects.

## Exemple

```ts
// Avoid:
export class Wallet {
	#cardId?: CardId;
}
```

L’absence de `cardId` veut dire trois choses différentes.

```ts
// Preferred:
export type LinkedCard =
	| { readonly availability: 'notSubscribed' | 'notRequested' | 'requested' }
	| { readonly availability: 'ready'; readonly cardId: CardId };

export class Wallet {
	#card: LinkedCard;
}
```

Chaque état a un nom, et `cardId` n’existe que quand la carte est prête.
