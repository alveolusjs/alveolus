---
code: EVT-04
title: Un event est nommé au passé, dans le langage du métier
group: Modéliser l’event
scope: [domain]
style: [tactical]
severity: minor
review: approved
sources:
  - "Modeling Events"
---

# EVT-04 · Un event est nommé au passé, dans le langage du métier

<RuleMeta />

## Signal

Un event nommé à l’impératif ou au présent (`BlockWallet`), avec un terme technique (`WalletUpdated`), ou hors du langage du bounded context.

## Pourquoi

Nommer l’event et ses propriétés dans le langage du bounded context qui l’enregistre. Quand l’event naît d’une méthode métier d’un aggregate, son nom vient de cette méthode, au passé. La méthode est la cause ; l’event dit qu’elle a eu lieu. `wallet.block()` produit `WalletBlocked`.

Préférer le nom court quand le langage ne laisse aucune ambiguïté. L’équipe peut tout de même en choisir un plus long.

## Exceptions

Aucune.

## Correction

Le nom du concept, suivi du participe passé du verbe de la méthode : `WalletBlocked`, `HolderSuspended`.

## Voir aussi

EVT-02 refuse les notifications techniques. ENT-11 nomme les méthodes dans le langage du métier.
