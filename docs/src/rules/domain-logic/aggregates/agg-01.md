---
code: AGG-01
title: Les invariants vivent dans l’aggregate
group: Encapsulation
scope: [domain, application]
style: [tactical]
severity: major
review: approved
sources:
  - "Using Law of Demeter and Tell, Don't Ask"
---

# AGG-01 · Les invariants vivent dans l’aggregate

<RuleMeta />

## Signal

Un appelant (use case, controller, handler, autre aggregate) :

1. lit l’état de l’aggregate ;
2. prend une décision métier à partir de cet état ;
3. le modifie par un setter, une propriété publique ou une méthode qui ne vérifie rien.

Une propriété d’état publique et modifiable sur l’aggregate root rend cela possible.

## Pourquoi

Le modèle ne garantit plus la règle métier. Le prochain appelant l’oubliera.

## Exceptions

La validation des entrées (format, présence, type) reste dans la couche application. Lire l’état pour l’afficher, ou pour un choix purement applicatif qui ne décide rien du métier, est permis.

## Correction

Une méthode métier, nommée dans l’ubiquitous language. Elle vérifie l’invariant et refuse s’il n’est pas respecté. L’état reste privé.

## Adaptation

**Notre choix** : le refus est une valeur, pas une exception. La méthode renvoie `Result<void, E>`, où `E` est une erreur métier nommée dans l’ubiquitous language (`TransferAlreadyExecuted`).

## Exemple

```ts
// Avoid: the rule lives in the use case
if (transfer.status === TransferStatus.Executed) {
  throw new TransferAlreadyExecutedError(id);
}

transfer.status = TransferStatus.Cancelled;
```

```ts
// Preferred: tell the aggregate what to do, it refuses with a result
const cancelled = transfer.cancel(); // Result<void, TransferAlreadyExecuted>

if (!cancelled.ok) {
  return cancelled;
}
```
