---
code: PLC-04
title: Le domaine et l’application se découpent par concept, pas par type de fichier
group: Modules
scope: [structure, domain, application]
style: [tactical, transaction-script]
severity: minor
review: approved
sources:
  - "Designing with Modules (Table 9.1, the kitchen drawers analogy)"
---

# PLC-04 · Le domaine et l’application se découpent par concept, pas par type de fichier

<RuleMeta />

## Signal

- Dans le domaine, des dossiers par type de fichier : `entities/`, `value-objects/`, `services/`, `repositories/`, `events/`, `errors/`, `ports/`.
- Dans l’application, de même : `commands/`, `queries/`, `views/`, `ports/`.
- Le port du repository de `Wallet` loin de `Wallet`, ou ses erreurs dans un `errors.ts` global.
- Un use case du wallet dans un dossier au nom d’un autre concept.
- Un module fourre-tout, avec des dizaines de classes de concepts différents.

## Pourquoi

Un module DDD regroupe des classes étroitement liées. Le plus souvent, il y en a un par aggregate, ou par petit groupe d’aggregates qui se référencent. Un concept se comprend depuis son dossier : son modèle, ce qui peut mal tourner, ce dont il a besoin à l’extérieur.

Découpé par type de fichier, un même concept s’éparpille dans cinq dossiers, et chaque changement les touche tous. La modélisation en souffre aussi : on pense en types de classes plutôt qu’en domaine.

L’application et le domaine changent ensemble : une nouvelle règle de retrait touche le wallet, sa command et sa view. Découpé par concept dans les deux couches, le changement reste dans deux dossiers de même nom.

Dans l’autre sens, un module d’une soixantaine de classes est encombré. On le découpe en sous-modules.

## Exceptions

- Séparer par couche (`domain`, `application`, `driving`, `driven`, `public`) n’est pas découper par type de fichier.
- Un value object utilisé par plusieurs concepts a son propre module : `domain/money/`.
- Une query qui combine plusieurs concepts, comme un relevé construit à partir d’un wallet et des taux de change de sa devise, a un dossier au nom de ce qu’elle montre : `application/statement/`.
- Les types de base partagés (`AggregateRoot`, `DomainEvent`, `Identifier`) viennent de `@alveolus/core`, pas d’un module du modèle.

## Correction

Un dossier par concept dans `domain`, avec son modèle, ses erreurs et ses ports. Les mêmes noms de dossiers dans `application`. Une command va sous le concept de l’aggregate qu’elle modifie : une transaction n’en modifie qu’un (AGG-06).

```txt
domain/wallet/
├── wallet.aggregate.ts
├── wallet.id.ts
├── wallet.events.ts
├── wallet.errors.ts
├── wallet.repository.ts            port
├── recent-withdrawals.port.ts      port
├── withdrawal-limit.service.ts     domain service
└── __test__/wallet.aggregate.spec.ts
```

```txt
application/wallet/
├── debit-wallet.command.ts         la command et son handler
├── credit-wallet.command.ts
├── get-wallet.query.ts             la query et son handler
├── wallet.view.ts                  ce que voient les lecteurs
└── wallet-views.port.ts            view port, implémenté dans driven
```

## Adaptation

**Notre choix** : le dossier nomme le concept, le suffixe du fichier nomme le rôle (NAM-01). L’outillage lit les suffixes, pas les dossiers. `driving` et `driven` se découpent par technologie (PLC-07).

Un bounded context en transaction scripts n’a pas de `domain` : son `application` contient un service par concept (TXS-01, TXS-05).

## Exemple

À éviter : des dossiers par type de fichier.

```txt
domain/
├── entities/
│   └── wallet.ts
├── value-objects/
│   └── money.ts
├── errors/
│   └── wallet.errors.ts
└── repositories/
    └── wallet.repository.ts
```

Préféré : un dossier par concept.

```txt
domain/
├── wallet/
│   ├── wallet.aggregate.ts
│   ├── wallet.id.ts
│   ├── wallet.events.ts
│   ├── wallet.errors.ts
│   └── wallet.repository.ts
└── money/
    └── money.value-object.ts
```

## Voir aussi

PLC-05 nomme les modules dans le langage. LAY-02 interdit les cycles entre eux. UC-08 sépare commands et queries.
