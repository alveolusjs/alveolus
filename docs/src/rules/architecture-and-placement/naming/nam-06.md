---
code: NAM-06
title: Un adapter nomme sa technologie et ce qu’il adapte
group: Noms de types
scope: [driving, driven]
style: [tactical, transaction-script]
severity: minor
detection: []
review: approved
sources:
  - "Is Separated Interface a Necessity? (sidebar 'Naming Your Implementation Class')"
---

# NAM-06 · Un adapter nomme sa technologie et ce qu’il adapte

<RuleMeta />

## Signal

- `WalletRepositoryAdapter`, `DefaultWalletRepository`, `WalletRepository2` dans `driven/prisma`.
- `Controller`, `Handler`, `Mapper` : un nom de classe sans son concept.

## Pourquoi

Un port peut avoir plusieurs implémentations : une sur PostgreSQL aujourd’hui, une autre demain. Le nom de l’implémentation dit laquelle c’est. `PrismaWalletRepository` dit la technologie et le port qu’il implémente ; `WalletRepositoryAdapter` ne dit que ce que toute implémentation est déjà.

Hors du domaine, le rôle aide : `WalletController`, `WalletMapper`, `MoneyWithdrawnConsumer` sont lus par des développeurs, pas par le métier, et le rôle dit comment se servir de la classe.

## Exceptions

Un adapter, seul de sa technologie dans un dossier, peut retirer la technologie de son nom quand le dossier la porte : `driving/http/wallet.controller.ts` exporte `WalletController`.

## Correction

`<Technology><Port>` pour l’implémentation d’un port (`PrismaWalletRepository`, `HttpExchangeRates`), `<Concept><Role>` pour les autres adapters (`WalletController`, `WalletMapper`).

## Voir aussi

SRV-06 refuse le suffixe `Impl`. NAM-07 nomme le port sans préfixe.
