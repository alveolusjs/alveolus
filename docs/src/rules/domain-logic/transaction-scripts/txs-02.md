---
code: TXS-02
title: Un script s’exécute dans une transaction et n’appelle aucun autre script
group: Forme d’un script
scope: [application]
style: [transaction-script]
severity: major
detection: []
review: approved
sources: []
---

# TXS-02 · Un script s’exécute dans une transaction et n’appelle aucun autre script

<RuleMeta />

## Signal

- Un script qui écrit en dehors de `unitOfWork.run(...)`, ou qui ouvre deux transactions l’une après l’autre.
- Une méthode qui appelle une autre méthode publique de son application service, ou d’un autre application service, pour exécuter un second use case.
- Une méthode helper partagée, que plusieurs use cases enchaînent pour construire leur histoire, avec ses propres vérifications et ses propres erreurs.

## Pourquoi

La transaction est ce qui rend un script sûr : soit toutes ses écritures ont lieu, soit aucune. Deux transactions dans un même use case laissent un travail à moitié fait quand la seconde échoue.

Un script qui en appelle un autre cache un second use case dans le premier, avec ses propres vérifications et ses propres erreurs. Le lecteur doit ouvrir les deux pour savoir ce qui se passe, et les deux finissent par diverger.

## Exceptions

Un long-running process qui doit valider ses écritures par étapes n’est pas un script : chaque étape est son propre script, enchaîné par des events ou par un scheduler (PRC-05).

## Correction

- Envelopper tout le script dans un seul `run` du Unit of Work.
- Une étape partagée par plusieurs scripts du même application service est une méthode privée `#` qui lit ou écrit une seule chose, sans vérification propre. Une règle répétée d’un application service à l’autre signale que le bounded context dépasse son style (TXS-08).

## Adaptation

**Notre choix** : la transaction est celle du Unit of Work, portée par AsyncLocalStorage. Un refus métier renvoyé sous forme de `Result` l’annule.

## Exemple

```ts
// Avoid: two transactions, and a second use case hidden in the first
async waive(feeId: string, actor: string): Promise<Result<void, FeeNotWaivable>> {
  const fee = await this.findPending(feeId);              // a public method, with its own transaction

  if (!fee) {
    return err(new FeeNotWaivable(feeId));
  }

  await this.#unitOfWork.run(async () => {
    await this.#unitOfWork.client().fee.update({ where: { id: feeId }, data: { status: 'waived' } });
  });

  return this.notifyCustomer(fee.customerId);             // another use case, with its own checks
}
```

```ts
// Preferred: one transaction, one story from top to bottom
async waive(feeId: string, actor: string): Promise<Result<void, FeeNotWaivable>> {
  return this.#unitOfWork.run(async () => {
    const fee = await this.#pendingFee(feeId);

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

// A shared step: reads one thing, checks nothing
#pendingFee(feeId: string): Promise<Fee | null> {
  return this.#unitOfWork.client().fee.findFirst({ where: { id: feeId, status: 'pending' } });
}
```

Tout se passe dans une seule transaction : si une écriture échoue, rien n’est enregistré. Prévenir le client est une autre histoire, qui part par un event, pas par l’appel d’un autre script.
