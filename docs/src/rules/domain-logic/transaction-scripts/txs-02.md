---
code: TXS-02
title: Un script s’exécute dans une seule transaction
group: Forme d’un script
scope: [application]
style: [transaction-script]
kind: safeguard
requires: [persistence.unit-of-work, errors.result]
severity: blocking
detection: []
review: approved
sources: []
---

# TXS-02 · Un script s’exécute dans une seule transaction

<RuleMeta />

## Signal

- Un script qui écrit en dehors de `unitOfWork.run(...)`.
- Un script qui ouvre deux transactions l’une après l’autre.

## Pourquoi

La transaction est ce qui rend un script sûr : soit toutes ses écritures ont lieu, soit aucune. Deux transactions dans un même use case laissent un travail à moitié fait quand la seconde échoue.

## Exceptions

Un long-running process qui doit valider ses écritures par étapes n’est pas un script : chaque étape est son propre script, enchaîné par des events ou par un scheduler (PRC-05).

## Correction

Envelopper tout le script dans un seul `run` du Unit of Work.

## Adaptation

**Notre choix** : la transaction est celle du Unit of Work, portée par AsyncLocalStorage. Un refus métier renvoyé sous forme de `Result` l’annule.

**Avec des exceptions** : un refus levé annule la transaction du script. Le signal devient un refus attrapé dans le `run`, qui laisse la transaction valider.

**Avec une transaction explicite** : le signal devient une écriture hors du callback de l’unique `prisma.$transaction` du script, ou deux transactions dans un même use case.

## Voir aussi

TXS-09 interdit à un script d’en appeler un autre. TXS-06 fait passer chaque écriture par le client de la transaction.

## Exemple

```ts
// Avoid: two transactions in one use case
async waive(feeId: string, actor: string): Promise<Result<void, FeeNotWaivable>> {
  const fee = await this.findPending(feeId);              // a public method, with its own transaction

  if (!fee) {
    return err(new FeeNotWaivable(feeId));
  }

  await this.#unitOfWork.run(async () => {
    await this.#unitOfWork.client().fee.update({ where: { id: feeId }, data: { status: 'waived' } });
  });

  return ok();
}
```

```ts
// Preferred: one transaction, from the first read to the last write
async waive(feeId: string, actor: string): Promise<Result<void, FeeNotWaivable>> {
  return this.#unitOfWork.run(async () => {
    const fee = await this.#unitOfWork.client().fee.findFirst({ where: { id: feeId, status: 'pending' } });

    if (!fee) {
      return err(new FeeNotWaivable(feeId));
    }

    await this.#unitOfWork.client().fee.update({
      where: { id: fee.id },
      data: { status: 'waived', waivedBy: actor, waivedAt: this.#clock.now() },
    });

    return ok();
  });
}
```

Tout se passe dans une seule transaction : si une écriture échoue, rien n’est enregistré.
