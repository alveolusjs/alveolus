---
code: WIR-07
title: Un port est une abstract class, et son propre injection token
group: Dépendances
scope: [domain, application, structure]
style: [tactical, transaction-script]
severity: minor
detection: []
review: approved
sources:
  - "Dependency Inversion Principle"
---

# WIR-07 · Un port est une abstract class, et son propre injection token

<RuleMeta />

## Signal

- `provide: 'WALLET_REPOSITORY'`, `@Inject('WALLET_REPOSITORY')`.
- `export const EXCHANGE_RATES = Symbol('ExchangeRates')` à côté de `interface ExchangeRates`.

## Pourquoi

Une interface TypeScript disparaît à l’exécution : on ne peut pas l’injecter, il lui faut donc un injection token à côté. Deux noms pour un même port finissent par diverger. Une chaîne n’est liée à aucun type, peut entrer en collision avec une autre, et survit à un renommage que le compilateur ne voit pas.

Une abstract class est les deux à la fois : le contrat dont dépend l’appelant, et la valeur que le container recherche. La renommer renomme les deux, et « aller à la définition » mène au port.

## Exceptions

Les injection tokens de NestJS lui-même : `APP_PIPE`, `APP_GUARD`, `APP_FILTER`. Une valeur de la configuration n’a pas besoin d’injection token : le module la passe au constructeur (WIR-11).

## Correction

```ts
// domain/wallet/wallet.repository.ts
export abstract class WalletRepository {
	abstract get(id: WalletId): Promise<Wallet | undefined>;
	abstract save(wallet: Wallet): Promise<Result<void, WalletAlreadyOpen>>;
}

// wallets.module.ts
{ ...construct(PrismaWalletRepository, [PrismaUnitOfWork]), provide: WalletRepository },
```

## Voir aussi

LAY-01 déclare le port dans le domaine. NAM-07 le nomme sans `I`. SRV-06 : un port séparé seulement quand il sert à quelque chose.
