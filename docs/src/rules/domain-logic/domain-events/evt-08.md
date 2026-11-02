---
code: EVT-08
title: Un domain event ne se lit que dans son bounded context
group: Les event handlers du bounded context
scope: [driving, structure]
style: [tactical]
kind: safeguard
severity: blocking
detection: []
review: to-review
sources: []
---

# EVT-08 · Un domain event ne se lit que dans son bounded context

<RuleMeta />

## Signal

- Un bounded context qui importe un domain event d’un autre bounded context pour y réagir.
- Un bus d’events global au déploiement, où tout module peut s’abonner à tout event (`EventEmitterModule.forRoot()` et `@OnEvent`).
- Un abonnement par chaîne de caractères, qu’aucune analyse d’imports ne peut suivre.
- Un event handler qui lit le published language de son propre bounded context pour réagir à ce qui vient de s’y passer.

## Pourquoi

Un domain event fait partie du modèle. Il change avec lui, sans contrat ni version.

S’il est lu dans un autre bounded context, un renommage casse ce lecteur sans que personne ne le voie. Avec un abonnement par chaîne, c’est pire : rien ne casse à la compilation, l’event handler ne reçoit simplement plus rien. Une réaction attendue disparaît en silence, et les données qui en dépendent dérivent.

À l’inverse, un event handler qui lit le contrat publié de son propre bounded context lie une réaction interne à un contrat versionné. Il ne peut plus changer sans regarder ce consumer.

## Exceptions

Aucune.

## Correction

Un domain event ne peut pas atteindre un autre bounded context, même par erreur :

- Le registre des event handlers est typé par l’union des domain events de son bounded context. Enregistrer l’event d’un autre bounded context ne compile pas.
- Le dispatcher est une instance par bounded context, créée dans son module et jamais exportée. Aucun autre module ne peut l’injecter.
- Aucun bus global : pas d’`EventEmitterModule.forRoot()`, pas d’abonnement par chaîne de caractères.

Une règle d’architecture vérifie en CI qu’aucun bounded context n’importe le `domain` d’un autre (LAY-04). C’est le filet si quelqu’un contourne le typage.

Un autre bounded context réagit uniquement à l’integration event publié dans `public`, livré par l’outbox.

## Adaptation

**Notre choix** : chaque bounded context déclare ses event handlers dans un seul fichier. La carte des réactions se lit à un seul endroit.

```ts
export type WalletEvent = WalletOpened | MoneyDeposited | MoneyWithdrawn;

export const walletsEventHandlers = new DomainEventHandlers<WalletEvent>([
	[MoneyWithdrawn, WalletEventsTranslator, 'sync'],
	[MoneyWithdrawn, WarnLowBalance, 'async'],
]);
```

## Voir aussi

LAY-04 pour l’import entre bounded contexts. PUB-01 pour le published language. PLC-08 pour l’emplacement des event handlers.
