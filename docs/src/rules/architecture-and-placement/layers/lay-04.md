---
code: LAY-04
title: "Un autre bounded context n’entre que par `public`, qui ne contient que le contrat"
group: Frontière du bounded context
scope: [public, driving]
style: [tactical, transaction-script]
severity: major
detection: [dependency-cruiser]
review: approved
sources: []
---

# LAY-04 · Un autre bounded context n’entre que par `public`, qui ne contient que le contrat

<RuleMeta />

## Signal

- Une classe avec du comportement dans `public`, ou un import de `domain` depuis `public`.
- Un autre bounded context qui importe autre chose que `public`.

## Pourquoi

`public` est ce que voient les autres bounded contexts. Réduit à des types, il ne change que lorsque le contrat change. L’implémentation de la facade appelle les use cases du bounded context : c’est un adapter driving, comme un controller.

## Exceptions

Aucune.

## Correction

```txt
public/
├── wallets.facade.ts               la facade : une abstract class, le contrat
├── wallet.dto.ts
└── wallets.integration-events.ts
driving/in-process/
└── wallets-facade.adapter.ts       implémente la facade, appelle les use cases
```

## Voir aussi

PUB-01 documente le published language. MAP-01 fait respecter les relations de la context map. PLC-07 place l’implémentation de la facade dans `driving/in-process`.
