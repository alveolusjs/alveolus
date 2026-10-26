---
code: NAM-05
title: Un type du domaine garde son nom métier, le rôle va dans le nom du fichier
group: Noms de types
scope: [domain]
style: [tactical]
severity: minor
detection: []
review: approved
sources:
  - "How to Do DDD › Ubiquitous Language (Table 1.4)"
---

# NAM-05 · Un type du domaine garde son nom métier, le rôle va dans le nom du fichier

<RuleMeta />

## Signal

- `WalletAggregate`, `WalletEntity`, `MoneyValueObject`, `MoneyVO`.
- `MoneyWithdrawnEvent`, `InsufficientFundsError`, `WalletModel`.

## Pourquoi

Les types du domaine sont le langage du métier écrit en code (CTX-03). Personne, dans le métier, ne dit « un wallet aggregate » ou « une insufficient funds error » : on dit un wallet, des fonds insuffisants. Un suffixe technique dans le nom du type pousse le vocabulaire du pattern dans chaque ligne qui l’utilise.

Le rôle reste écrit, une fois, là où il sert : dans le nom du fichier (NAM-01). `wallet.aggregate.ts` dit au lecteur quelles règles s’appliquent ; `Wallet` se lit comme le métier.

## Exceptions

Les types que le métier nomme avec leur rôle le gardent : une identité (`WalletId`, NAM-08), le port d’un repository (`WalletRepository`), une factory ou une policy dont le nom fait partie du langage (`WithdrawalPolicy`).

Les types de base partagés du modèle, `DomainEvent` et `DomainError`, nomment le rôle lui-même.

## Correction

Retirer le suffixe du type, et le garder dans le fichier : `MoneyValueObject` dans `money.vo.ts` devient `Money` dans `money.value-object.ts`.

## Adaptation

**Notre choix** : le suffixe du rôle s’écrit dans le nom de fichier de toutes les couches. Dans le domaine, il reste hors du nom du type ; hors du domaine, un type d’adapter porte son rôle (NAM-06).

## Voir aussi

EVT-04 nomme un event au passé, ENT-11 nomme les méthodes dans le langage.
