---
menu: Vue d’ensemble
---

# Transaction scripts

Un transaction script est un use case écrit comme une seule procédure : il lit ce dont il a besoin, vérifie les conditions métier, écrit, et répond. C’est le style des bounded contexts supporting et generic, où la logique est mince et où un modèle tactique coûterait plus qu’il ne rapporte (CTX-14, CTX-13).

Ces règles gardent les scripts simples, sans les laisser se dégrader :

- une méthode par use case, dans un application service par concept ;
- une transaction par méthode ;
- les règles dans le script, et nulle part ailleurs ;
- un bounded context à plat ;
- Prisma à travers le Unit of Work ;
- un signal clair quand le bounded context a dépassé ce style.

## En pratique {#in-practice}

Un titulaire choisit l’adresse e-mail qui reçoit ses notifications. Une seule règle : l’adresse doit avoir l’air valide. Une méthode de l’application service des notifications suffit :

```ts
export class NotificationService {
	readonly #unitOfWork: PrismaUnitOfWork<Prisma.TransactionClient>;

	constructor(unitOfWork: PrismaUnitOfWork<Prisma.TransactionClient>) {
		this.#unitOfWork = unitOfWork;
	}

	async setEmail(holderId: string, email: string): Promise<Result<void, InvalidEmail>> {
		const address = email.trim().toLowerCase();

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
			return err(new InvalidEmail(email));
		}

		return this.#unitOfWork.run(async () => {
			await this.#unitOfWork.client().notificationChannel.upsert({
				where: { holderId },
				create: { holderId, email: address },
				update: { email: address },
			});

			return ok();
		});
	}
}
```

- Une méthode par use case, dans un application service par concept, dans une transaction (TXS-01, TXS-02).
- Elle vérifie avant d’écrire, et refuse avec un `Result` (TXS-04).
- Le bounded context est à plat : pas de dossier `domain` (TXS-05).
- Elle accède à la base à travers la transaction du Unit of Work (TXS-06).

## Règles {#rules}

<RuleTable />
