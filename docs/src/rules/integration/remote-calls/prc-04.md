---
code: PRC-04
title: Un bounded context ne transforme pas un event étranger en command implicite
group: Processus entre bounded contexts
scope: [driving, structure]
style: [tactical, transaction-script]
severity: question
detection: LLM
review: approved
sources:
  - "Long-Running Processes, and Avoiding Responsibility"
  - "Process State Machines and Time-out Trackers"
---

# PRC-04 · Un bounded context ne transforme pas un event étranger en command implicite

<RuleMeta />

## Signal

- Un bounded context qui écoute l’event d’un autre (`WalletOpened`, `CustomerOnboarded`), et crée ses propres objets comme s’il avait reçu une demande.
- Un bounded context qui accumule des handlers d’events étrangers de types différents, qui veulent tous dire « crée-moi un X ».

## Pourquoi

Émettre une carte quand un wallet s’ouvre, par exemple, pose trois questions :

- l’event a-t-il un sens pour le bounded context qui le reçoit ?
- combien d’autres bounded contexts voudront la même chose, avec leurs propres events ?
- doit-il porter tous ces events étrangers comme autant de commands ?

Il vaut mieux faire l’inverse. Le bounded context qui a besoin du service écoute son propre event : `wallets` reçoit `WalletOpened`, envoie une command explicite (`IssueCard`) au bounded context `cards`, et suit lui-même le processus. Il gère ainsi le suivi, les retries et le timeout.

L’autre bounded context répond par ses propres events, comme `CardIssued`, sans message de réponse dédié.

## Exceptions

C’est un compromis, pas une règle absolue. Un abonnement direct reste acceptable quand l’event a un vrai sens pour le bounded context qui le reçoit.

## Correction

L’initiateur traduit son event en une command explicite, dans le langage du bounded context cible, et attend l’event de ce bounded context pour avancer.

## Voir aussi

PRC-05 : le processus est suivi. MAP-01 : la relation figure sur la context map. MSG-05 : la command reçue par message est idempotente.
