---
menu: Vue d’ensemble
---

# Nommage et rôles de fichiers

Un fichier dit son rôle dans son nom, un dossier son concept. Un lecteur qui voit `debit-wallet.command.ts` dans `application/wallet/` sait ce qu’il contient avant de l’ouvrir, et l’outillage peut vérifier qu’un rôle est dans la bonne couche. Les types gardent les noms du métier : le rôle appartient au fichier, pas à la classe.

La place de chaque dossier, et les rôles que chaque couche accepte, relèvent de [Ce qui va où](../placement/) (PLC, PLC-03). Les membres privés d’une classe s’écrivent `#` (NAM-09). Le nom des méthodes, des events et des modules relève de leurs propres thèmes (ENT-11, EVT-04, PLC-05), et le nom des fichiers de test d’[Écrire un test](../../testing/writing-tests/) (TST-06).

## En pratique {#in-practice}

Le concept `wallet` d’une application de wallet, dans un bounded context tactique.

À éviter :

```txt
domain/wallet/
├── wallet.ts
├── WalletId.ts
├── money.vo.ts
├── wallet-events.ts
├── insufficient-funds.error.ts
├── IWalletRepository.ts
└── wallet.helper.ts
application/wallet/
├── debit.ts
└── wallet.mapper.ts
driven/prisma/
├── wallet.repository.impl.ts
└── walletMapper.ts
```

Préféré, avec les types que chaque fichier exporte :

```txt
domain/wallet/
├── wallet.aggregate.ts                Wallet
├── wallet.id.ts                       WalletId
├── money.value-object.ts              Money
├── wallet.events.ts                   MoneyDeposited, MoneyWithdrawn
├── wallet.errors.ts                   InsufficientFunds, DebitsBlocked
└── wallet.repository.ts               WalletRepository
application/wallet/
├── debit-wallet.command.ts            DebitWalletCommand, DebitWalletHandler
├── get-wallet.query.ts                GetWalletQuery, GetWalletHandler
├── wallet.view.ts                     WalletView
└── wallet-views.port.ts               WalletViews
driven/prisma/
├── prisma-wallet.repository.ts        PrismaWalletRepository
├── wallet.mapper.ts                   WalletMapper
└── __test__/
    └── prisma-wallet.repository.integration-spec.ts
```

- Chaque fichier finit par un rôle, pris parmi ceux de sa couche (NAM-01, PLC-03).
- `<concept>.<role>.ts`, en kebab-case (NAM-02).
- Le fichier contient ce que son rôle annonce, et ce qu’il exporte porte son nom (NAM-03, NAM-04).
- `Wallet`, `Money`, `InsufficientFunds` : ni `Aggregate`, ni `ValueObject`, ni `Error` dans le nom d’un type du domaine (NAM-05).
- L’adapter nomme sa technologie, le port ce qu’il offre, sans `I` (NAM-06, NAM-07).
- `WalletId`, et des erreurs nommées d’après les refus du wallet (NAM-08).

## Règles {#rules}

<RuleTable />
