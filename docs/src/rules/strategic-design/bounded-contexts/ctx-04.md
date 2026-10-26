---
code: CTX-04
title: Aucun concept d’un autre subdomain dans le modèle
group: Langage et frontière
scope: [domain]
style: [tactical]
severity: major
detection: []
review: approved
sources:
  - "Why Strategic Design Is So Incredibly Essential"
  - "Sample Contexts › Collaboration Context"
  - "Sample Contexts › Agile Project Management Context"
---

# CTX-04 · Aucun concept d’un autre subdomain dans le modèle

<RuleMeta />

## Signal

Le modèle du bounded context utilise des concepts d’un autre subdomain :

- Cas typique : un modèle de virement qui référence `User` et `Permission`, charge un utilisateur et vérifie ses droits au milieu d’une méthode métier.
- En NestJS : un import du module d’auth ou d’IAM dans `domain/`, un `user.hasPermission(...)`, ou un rôle technique vérifié dans un aggregate.
- Autre forme : une fonctionnalité d’un autre langage ajoutée comme extension d’un modèle existant. Par exemple, un nouveau subdomain construit comme une branche du modèle d’un autre bounded context. C’est une erreur majeure.

## Pourquoi

Chaque concept du bounded context doit appartenir à son langage. Le premier problème n’est pas le couplage : le langage est faux.

Passer des permissions aux rôles touche alors tout le modèle. Le subdomain core devient de plus en plus difficile à lire, et dérive vers un big ball of mud.

## Exceptions

Une équipe peut choisir de mêler l’identité et les droits d’accès à son core. Ce choix doit être explicite et consigné.

## Correction

Vérifier les droits d’accès dans le use case, avant d’appeler le domaine. Le domaine reçoit un concept de son propre langage (CTX-05).

Déplacer `User` dans un module séparé du même modèle ne suffit pas : un concept rangé dans un autre module ne fait toujours pas partie du langage du bounded context. Au mieux, c’est une étape (segregated core) vers un bounded context séparé.

## Voir aussi

AGG-04 couvre déjà le repository appelé depuis l’aggregate. CTX-04 vise le concept étranger lui-même.

## Exemple

La double validation d’un virement : une personne le saisit, une autre l’approuve.

```ts
// Avoid: the transfer knows users and permissions, from the identity and access subdomain
approve(user: User): Result<void, TransferAlreadyApproved> {
  if (!user.hasPermission(Permission.ApproveTransfer)) {
    throw new ForbiddenError();
  }

  this.approvedBy = { username: user.username, email: user.email };

  return ok();
}
```

```ts
// Preferred, in the use case: check the access right, then translate the caller into a local concept
async handle(command: ApproveTransfer): Promise<Result<void, ApproveTransferError>> {
  if (!command.caller.can('transfers:approve')) {
    return err(new NotAllowedToApprove());
  }

  const approver = Approver.of(command.caller.memberId);
  const transfer = await this.transfers.get(command.transferId);

  return transfer.approve(approver);
}
```

```ts
// Preferred, in the aggregate: only the language of payments, and the business rule that belongs here
approve(approver: Approver): Result<void, TransferAlreadyApproved | ApproverIsInitiator> {
  if (this.approvedBy) {
    return err(new TransferAlreadyApproved(this.id));
  }

  if (approver.equals(this.initiatedBy)) {
    return err(new ApproverIsInitiator(this.id));
  }

  this.approvedBy = approver;

  return ok();
}
```
