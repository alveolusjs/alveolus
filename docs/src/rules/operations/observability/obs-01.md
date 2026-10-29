---
code: OBS-01
title: Un log est structuré, et nomme ce qui s’est passé
group: Logs
scope: [application, driving, driven]
style: [tactical, transaction-script]
severity: minor
detection: []
review: approved
sources: []
---

# OBS-01 · Un log est structuré, et nomme ce qui s’est passé

<RuleMeta />

## Signal

- `console.log`, ou un message construit par interpolation : `` `Debit refused for ${walletId}` ``.
- Un log sans l’identité de ce qu’il concerne.
- Un logger injecté dans un aggregate, une entity ou un domain service.

## Pourquoi

Un log se lit d’abord par une requête : un champ se filtre, une phrase non. Le domaine ne logue pas : il renvoie un `Result` et enregistre ses events. C’est l’application, ou l’adapter, qui dit ce qui s’est passé.

## Exceptions

Aucune.

## Correction

- Un logger configuré au démarrage, qui écrit une ligne JSON par log.
- Un message fixe, qui nomme l’événement (`wallet.debit.refused`), et les valeurs dans des champs.
- Le logger vit dans `application` et dans les adapters, jamais dans `domain`.

## Adaptation

Le `Logger` de NestJS accepte un objet en message, et un logger structuré se branche par `app.useLogger(...)`.

## Voir aussi

OBS-02 dit à quel niveau loguer. SEC-03 et SEC-04 disent ce qu’un log ne porte jamais.

## Exemple

```ts
// Avoid: a sentence, values inside it
this.#logger.log(`Debit refused for wallet ${command.walletId}: ${debited.error.type}`);
```

```ts
// Preferred: a fixed message, values in fields
this.#logger.log({ event: 'wallet.debit.refused', walletId: command.walletId, reason: debited.error.type });
```
