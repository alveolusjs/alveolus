---
code: TXS-04
title: Un script vérifie avant d’écrire, et refuse avec un résultat
group: Forme d’un script
scope: [application]
style: [transaction-script]
severity: major
detection: []
review: approved
sources: []
---

# TXS-04 · Un script vérifie avant d’écrire, et refuse avec un résultat

<RuleMeta />

## Signal

- Un script qui écrit, puis vérifie une condition et lève une exception pour annuler l’écriture.
- Un refus métier levé comme une exception : `throw new BadRequestException('fee already waived')`.
- Des vérifications éparpillées entre les écritures : un refus peut alors survenir après que la moitié des données a changé.

## Pourquoi

Un script se lit le mieux en trois étapes : charger, vérifier, écrire. Quand toutes les vérifications ont lieu avant la première écriture, un refus ne laisse rien à annuler, et le lecteur voit toutes les conditions du use case au même endroit.

Un refus métier est une réponse attendue, pas une panne. Sous forme d’exception, il échappe au système de types : les appelants oublient de le traiter, et les transports en font une erreur serveur.

## Exceptions

Une condition qui dépend de l’écriture elle-même, comme une contrainte d’unicité, est vérifiée par la base de données, puis traduite en refus.

## Correction

- Charger, puis vérifier chaque condition, puis écrire.
- Renvoyer `err(new FeeNotWaivable(...))` pour un refus métier, `ok(...)` sinon. `FeeNotWaivable` est déclarée dans `fee.errors.ts`, à côté de l’application service, et étend `DomainError` de `@alveolus/core` : le type de base des refus métier, commun aux deux styles malgré son nom. Elle porte un nom stable et une nature (`invalid`, `rejected`, `not-found`, `conflict`), que les adapters driving traduisent en réponse.

## Adaptation

**Notre choix** : les erreurs métier sont des valeurs `Result`, dans les deux styles. Un `Result` en erreur annule aussi la transaction du Unit of Work.

## Exemple

```ts
return this.#unitOfWork.run(async () => {
  const fee = await this.#unitOfWork.client().fee.findUnique({ where: { id: feeId } });

  if (!fee || fee.status !== FeeStatus.PENDING) {
    return err(new FeeNotWaivable(feeId));
  }

  await this.#unitOfWork.client().fee.update({
    where: { id: fee.id },
    data: { status: FeeStatus.WAIVED, waivedBy: actor },
  });

  return ok();
});
```
