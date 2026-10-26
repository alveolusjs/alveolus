---
code: TXS-01
title: Une méthode par use case, dans un application service par concept
group: Forme d’un script
scope: [application]
style: [transaction-script]
severity: major
detection: []
review: approved
sources: []
---

# TXS-01 · Une méthode par use case, dans un application service par concept

<RuleMeta />

## Signal

- Une méthode qui prend un paramètre `mode` ou `action`, et bifurque dessus pour exécuter deux use cases différents.
- Un use case partagé entre un controller et un application service, chacun faisant la moitié du travail.
- Un application service qui mélange deux concepts : un `FeeService` qui envoie aussi les relevés.
- Un use case réparti sur plusieurs méthodes publiques, que l’appelant doit enchaîner dans le bon ordre.

## Pourquoi

Dans ce style, un use case est une opération que l’application offre : renoncer à des frais, lister les frais en attente. L’application service est la classe qui regroupe les use cases d’un même concept, ici les frais : chaque use case est l’une de ses méthodes publiques. Ce n’est pas un domain service : les règles métier vivent dans chacune de ses méthodes (TXS-03), la classe ne fait que les regrouper.

Un script se lit facilement parce qu’il raconte une seule histoire, de haut en bas. Une méthode par use case garde cette histoire en un seul endroit, nommée dans le langage du métier : `waive`, `listPending`.

Regrouper les méthodes d’un concept dans un seul application service garde petit un bounded context petit : les use cases des frais sont côte à côte, avec leurs erreurs, et rien d’autre ne s’y glisse.

## Exceptions

Une méthode de lecture peut servir plusieurs lectures proches des mêmes données, comme une liste et son décompte.

## Correction

Un application service par concept dans `application`, `fee.service.ts`, avec une méthode publique par use case. Chaque méthode renvoie un `Result` pour les refus métier, et s’exécute dans une transaction (TXS-02). Les helpers sont des méthodes privées `#`.

## Adaptation

**Notre choix** : dans un bounded context en transaction scripts, l’application service est la couche des use cases. Les adapters driving appellent directement ses méthodes : il n’y a ni objet command, ni objet query.

## Voir aussi

UC-08 sépare ce qui modifie l’état de ce qui le lit : une méthode fait l’un ou l’autre. TXS-05 garde le bounded context à plat, et [Ce qui va où](../../architecture-and-placement/placement/) donne son arborescence.

## Exemple

```ts
export class FeeService {
  readonly #unitOfWork: PrismaUnitOfWork<Prisma.TransactionClient>;

  constructor(unitOfWork: PrismaUnitOfWork<Prisma.TransactionClient>) {
    this.#unitOfWork = unitOfWork;
  }

  async waive(feeId: string, actor: string): Promise<Result<void, FeeNotWaivable>> {
    // the whole use case, and nothing else
  }

  async listPending(customerId: string): Promise<PendingFee[]> {
    // one read
  }
}
```
