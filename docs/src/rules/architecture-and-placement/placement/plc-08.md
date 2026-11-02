---
code: PLC-08
title: "Un message entre par `driving` et sort par `driven`"
group: Adapters
scope: [driving, driven]
style: [tactical, transaction-script]
kind: structure
severity: major
detection: []
review: approved
sources: []
---

# PLC-08 · Un message entre par `driving` et sort par `driven`

<RuleMeta />

## Signal

- Un consumer du message d’un autre bounded context dans `application` ou dans `driven`.
- Un event handler dans un use case, ou dans l’aggregate qui a enregistré l’event.
- Un use case qui appelle un autre use case pour réagir à ce qu’il vient de faire.
- Le code qui traduit un domain event en integration event, écrit dans l’aggregate ou dans un use case.

## Pourquoi

Un message reçu est un point d’entrée, comme une requête HTTP : il appelle un use case, c’est donc un adapter driving. Cela vaut pour le message d’un autre bounded context comme pour un domain event du bounded context lui-même : réagir à `HolderSuspended` est un nouveau use case, dans sa propre transaction (AGG-06), pas la fin du précédent. Publier va dans l’autre sens : le bounded context dit à l’extérieur ce qui s’est passé, c’est donc un adapter driven. Les confondre fait perdre le sens des dépendances.

## Exceptions

Aucune.

## Correction

- Le consumer du message d’un autre bounded context va dans `driving/in-process/` (ou `driving/<broker>/` quand un broker existe). Il lit le contrat, puis appelle un use case.
- L’event handler qui appelle un use case va au même endroit : `driving/in-process/holder-suspended.event-handler.ts` reçoit `HolderSuspended` et appelle `BlockWallet` pour chaque wallet du titulaire. Il est asynchrone (AGG-08).
- L’event handler synchrone va dans `driven/` : le translator dans `driven/outbox/`, une projection ou une trace d’audit à côté de leur stockage (EVT-07). Il n’appelle aucun use case.
- Un bounded context en transaction scripts n’a pas de domain events : ses scripts ajoutent directement les messages de leur contrat à l’outbox (MSG-01).

## Voir aussi

MSG-04 rend le consumer idempotent, MSG-05 l’opération qu’il déclenche. AGG-08 passe à l’eventual consistency hors d’un aggregate. PUB-01 sépare le contrat publié du modèle.
