---
code: WIR-03
title: Le module d’un bounded context n’exporte que son contrat publié
group: La composition root
scope: [structure, public]
style: [tactical, transaction-script]
severity: major
review: approved
sources:
  - "Hexagonal or Ports and Adapters"
---

# WIR-03 · Le module d’un bounded context n’exporte que son contrat publié

<RuleMeta />

## Signal

- `exports: [WalletRepository, DebitWalletHandler]` dans `wallets.module.ts`.
- Un autre bounded context qui importe `WalletsModule` pour injecter son repository ou l’un de ses handlers.

## Pourquoi

Un provider exporté peut être injecté par tout module qui importe celui-ci. Exporter un repository ou un handler ouvre l’intérieur du bounded context aux autres, en contournant son contrat : ils chargent ses aggregates, lancent ses use cases sans passer par sa facade, et le bounded context ne peut plus les changer seul.

Les règles d’import empêchent déjà un autre bounded context d’importer la classe. L’export est la même porte, vue depuis le container.

## Exceptions

`shared.module.ts` exporte les ports techniques partagés (Unit of Work, outbox, horloge) : il n’a pas de contrat à protéger (PLC-02).

## Correction

Le module exporte la facade de `public`, et rien d’autre. Son implémentation vit dans `driving/in-process` (LAY-04).

```ts
@Module({
	providers: [
		{ ...construct(WalletsFacadeAdapter, [CreditWalletHandler, GetWalletHandler]), provide: WalletsFacade },
	],
	exports: [WalletsFacade],
})
export class WalletsModule {}
```

## Voir aussi

CTX-01 et MAP-01 : un autre bounded context ne passe que par `public`. PUB-01 documente ce que la facade publie.
