---
menu: Vue d’ensemble
---

# Ce qui va où

Chaque morceau de code a une place évidente. Ces règles donnent l’arborescence d’une application : un dossier par bounded context, ses couches et ce que chacune accepte, les modules de son domaine, les adapters par technologie. Un lecteur qui connaît l’arborescence trouve un fichier sans le chercher, et un relecteur voit tout de suite un fichier mal placé.

En DDD, un module est un dossier qui regroupe des classes du modèle étroitement liées. Ce n’est pas un `@Module` NestJS, qui est une unité d’injection de dépendances (WIR).

Le nom des fichiers et leurs rôles relèvent de [Nommage et rôles de fichiers](../naming/) (NAM), le sens des dépendances de [Couches et dépendances](../layers/) (LAY), et la place des tests d’[Écrire un test](../../testing/writing-tests/) (TST-05).

## En pratique {#in-practice}

Une application de wallet avec un bounded context tactique, `wallets`, et un bounded context en transaction scripts, `notifications`.

```txt
apps/<app>/
├── architecture.json                style de chaque bounded context
├── context-map/<app>.cml            context map, et son dessin dans generated/
├── docs/adr/                        décisions
├── prisma/
│   ├── outbox.prisma                tables techniques, partagées
│   ├── wallets.prisma               un fichier par bounded context
│   └── notifications.prisma
└── src/
    ├── main.bootstrap.ts
    ├── app.module.ts
    ├── app.config.ts
    ├── shared/                      technique uniquement
    │   ├── shared.module.ts
    │   ├── shared.config.ts
    │   ├── driven/prisma/           client Prisma, Unit of Work, outbox
    │   ├── driving/http/            pipe global, référence de l’API
    │   └── __test__/                mise en place de la base, helpers transverses
    ├── wallets/                     bounded context tactique
    └── notifications/               bounded context en transaction scripts
```

Un bounded context tactique :

```txt
src/wallets/
├── wallets.module.ts                wiring : port → implémentation
├── wallets.config.ts                configuration, passée en valeurs
├── domain/                          par concept
│   ├── wallet/                      titulaire et wallet : aggregates, identités, events, erreurs, ports
│   │   └── __test__/                tests unitaires
│   └── money/
├── application/                     par concept, comme le domaine
│   └── wallet/                      commands, queries, views, view ports
├── driving/                         par technologie
│   ├── http/                        controllers, schémas des requêtes et des représentations
│   └── in-process/                  adapter de la facade, consumers des autres bounded contexts
├── driven/                          par technologie
│   ├── prisma/                      repositories, adapters des views, mappers
│   │   └── __test__/                tests d’intégration
│   ├── outbox/                      events → integration events
│   └── http/rates-provider/         anticorruption layer
├── public/                          facade, DTO, integration events
└── __test__/                        tests end-to-end : règles, scénarios, contrat, support
```

- Un dossier par bounded context, avec son module, sa configuration et ses couches. En haut de `src`, rien d’autre que `shared` (PLC-01).
- `shared` ne contient que du code technique : pas de `Money`, pas de client (PLC-02).
- Chaque fichier va dans la couche de son rôle : un aggregate dans `domain`, une command dans `application`, un controller dans `driving`, un mapper dans `driven` (PLC-03).
- `driving` et `driven` se découpent par technologie : Prisma uniquement dans `driven/prisma` (PLC-07). Un message d’un autre bounded context se consomme dans `driving/in-process`, un event du bounded context se publie depuis `driven/outbox` (PLC-08). Chaque mapping vit avec son adapter (PLC-09).

Dans le domaine, les modules suivent les concepts, et le nom des fichiers dit leur rôle :

```txt
src/wallets/domain/
├── wallet/          holder.aggregate.ts, holder.id.ts, holder.events.ts, holder.errors.ts, holder.repository.ts,
│                    wallet.aggregate.ts, wallet.id.ts, wallet.events.ts, wallet.errors.ts, wallet.repository.ts,
│                    withdrawal-limit.service.ts, recent-withdrawals.port.ts
├── money/           money.value-object.ts, money.errors.ts
└── exchange-rate/   exchange-rate.value-object.ts, exchange-rates.port.ts
```

- Un module par concept, pas par type de fichier : pas de dossier `entities/`, `errors/` ou `ports/`. Le titulaire ouvre ses wallets, et chaque wallet pointe vers son titulaire : les deux aggregates partagent le module `wallet`. `application/wallet/` en est le miroir (PLC-04).
- Les noms des modules viennent du langage : wallet, money, exchange rate (PLC-05). Ils changent quand le langage change (PLC-06).

Un bounded context en transaction scripts n’a pas de `domain` : un service par concept, une méthode par use case (TXS-01, TXS-05).

```txt
src/notifications/
├── notifications.module.ts
├── notifications.config.ts
├── application/
│   ├── notification.service.ts      une méthode par use case
│   └── notification.errors.ts
├── driving/
│   ├── http/
│   └── in-process/                  consumers des autres bounded contexts
├── driven/
│   └── smtp/
├── public/
└── __test__/
```

Dans la durée, le projet accumule d’autres choses que des requêtes :

- Un job planifié ou une correction de données passe par un adapter driving qui appelle un use case, jamais par un script qui écrit en base (PLC-10).
- Le code généré vit dans un dossier `generated/`, et ne se retouche jamais à la main (PLC-11).
- Pendant le remplacement d’un provider, l’ancien et le nouvel adapter implémentent le même port, côte à côte, et l’ancien part une fois la bascule confirmée (PLC-12).

## Règles {#rules}

<RuleTable />
