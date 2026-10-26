---
code: NAM-07
title: "Une interface n’a pas de préfixe `I`"
group: Noms de types
scope: [domain, application, public]
style: [tactical, transaction-script]
severity: minor
detection: []
review: approved
sources:
  - "Is Separated Interface a Necessity? (sidebar 'Naming Your Implementation Class')"
---

# NAM-07 · Une interface n’a pas de préfixe `I`

<RuleMeta />

## Signal

`IWalletRepository`, `IExchangeRates`, `IClock`.

## Pourquoi

Ceux qui appellent un port n’ont pas à savoir s’il est une interface, une abstract class ou une classe. Le préfixe `I` le leur dit quand même, et pousse l’implémentation à prendre le bon nom : `IWalletRepository` et `WalletRepository`, et le lecteur se demande lequel injecter.

Le port prend le nom de ce qu’il offre (`WalletRepository`, `ExchangeRates`, `Clock`), l’implémentation le nom de sa technologie (NAM-06).

## Exceptions

Un nom du langage qui commence par `I` : `Iban` n’est pas signalé.

## Correction

Retirer le préfixe, et nommer l’implémentation d’après sa technologie : `IExchangeRates` et `ExchangeRates` deviennent `ExchangeRates` et `HttpExchangeRates`.

## Voir aussi

SRV-06 refuse le suffixe `Impl` sur l’implémentation.
