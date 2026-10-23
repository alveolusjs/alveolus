---
code: REP-02
title: Le repository charge, écrit et supprime des aggregates entiers
group: Contrat
scope: [driven]
style: [tactical]
severity: major
detection: hybrid
detectionNote: Les méthodes update* ou set* d’un repository, et un DELETE sur la table de l’aggregate root sans les tables enfants.
review: approved
sources:
  - "Chapter introduction"
  - "Hibernate Implementation (deleting a User and its Person)"
  - "Repository versus Data Access Object"
---

# REP-02 · Le repository charge, écrit et supprime des aggregates entiers

<RuleMeta />

## Signal

- Une méthode qui change une colonne ou une partie par identité, en contournant l’aggregate (`updateStatus(id, status)`, `UPDATE transfers SET status = ...`).
- Un finder qui renvoie un aggregate sans ses parties, que l’appelant complète ensuite.
- Un `remove` qui supprime la ligne de l’aggregate root et laisse les lignes des parties dans leurs tables.

## Pourquoi

Ce qui entre dans un repository doit en ressortir entier, et dans le même état. Les opérations au détail sur les parties contournent l’aggregate root et ses invariants.

Supprimer un aggregate, c’est supprimer d’abord ses parties, puis l’aggregate root. Sinon, les lignes des parties restent orphelines.

## Exceptions

Les finders sur les parties justifiés par la performance (REP-10). Les lectures renvoyées comme des valeurs (REP-11).

## Correction

Charger l’aggregate, appeler sa méthode métier, enregistrer le tout. Pour une suppression, le repository supprime explicitement les parties, puis l’aggregate root.

## Adaptation

**Notre choix** : aucune suppression en cascade dans la base. Le repository supprime les lignes des parties (`deleteMany`), puis celle de l’aggregate root (`delete`), dans la même transaction. La suppression reste visible dans le code, et une clé étrangère sans cascade refuse la suppression si une partie a été oubliée, au lieu de l’emporter en silence.

## Voir aussi

AGG-02 ne laisse changer les parties qu’à travers l’aggregate root. Une écriture partielle contourne aussi la vérification de version d’AGG-15. VO-11 traite des orphelins laissés par un remplacement. REP-07 refuse aussi les hooks d’ORM qui suppriment en cascade.

## Exemple

```ts
// Avoid: the repository changes a column without asking the aggregate
await this.transfers.updateStatus(transferId, 'CANCELLED');
```

```ts
// Preferred: the aggregate decides, the repository saves the whole
const transfer = await this.transfers.get(transferId);

if (!transfer) {
  return err(new TransferNotFound(transferId));
}

const cancelled = transfer.cancel(reason); // err(TransferAlreadyExecuted) if already executed

if (!cancelled.ok) {
  return cancelled;
}

return this.transfers.save(transfer);
```
