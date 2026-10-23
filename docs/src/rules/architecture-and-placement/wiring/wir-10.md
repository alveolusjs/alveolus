---
code: WIR-10
title: Ce que le wiring ouvre, il le ferme
group: Durée de vie
scope: [structure, driving, driven]
style: [tactical, transaction-script]
severity: minor
review: approved
sources: []
---

# WIR-10 · Ce que le wiring ouvre, il le ferme

<RuleMeta />

## Signal

- Un bootstrap sans `app.enableShutdownHooks()` : NestJS n’appelle alors aucun shutdown hook, et rien ne se ferme à l’arrêt.
- Un client de base de données, un timer ou un consumer démarré par un module, et jamais arrêté.
- Un timer arrêté à l’extinction pendant que sa dernière exécution écrit encore, et le client de la base fermé sous elle.

## Pourquoi

Chaque déploiement arrête les instances en cours. Un processus qui s’arrête sans rien fermer laisse ses connexions ouvertes jusqu’à ce que la base les coupe, et interrompt le travail en cours : un lot du relay à moitié envoyé, un message pris et jamais acquitté. La livraison reste sûre, puisque les consumers ignorent les doublons (MSG-04), mais c’est le démarrage suivant qui paie.

## Exceptions

Aucune.

## Correction

Le bootstrap active les shutdown hooks (WIR-02). Chaque classe qui démarre un travail l’arrête, et attend l’exécution en cours, dans `beforeApplicationShutdown`. Le module qui a ouvert un client le ferme dans `onApplicationShutdown`, que NestJS appelle ensuite.

```ts
// driving/in-process/expired-holds.scheduler.ts
export class ExpiredHoldsScheduler implements OnApplicationBootstrap, BeforeApplicationShutdown {
	readonly #releaseExpiredHolds: ReleaseExpiredHoldsHandler;
	readonly #intervalMs: number;
	#timer: NodeJS.Timeout | undefined;
	#run: Promise<unknown> = Promise.resolve();

	constructor(releaseExpiredHolds: ReleaseExpiredHoldsHandler, intervalMs: number) {
		this.#releaseExpiredHolds = releaseExpiredHolds;
		this.#intervalMs = intervalMs;
	}

	onApplicationBootstrap(): void {
		this.#timer = setInterval(() => {
			this.#run = this.#releaseExpiredHolds.handle({});
		}, this.#intervalMs);
	}

	async beforeApplicationShutdown(): Promise<void> {
		clearInterval(this.#timer);
		await this.#run;
	}
}
```

```ts
// shared.module.ts
export class SharedModule implements OnApplicationShutdown {
	readonly #prisma: PrismaClient;

	constructor(@Inject(PrismaClient) prisma: PrismaClient) {
		this.#prisma = prisma;
	}

	async onApplicationShutdown(): Promise<void> {
		await this.#prisma.$disconnect();
	}
}
```

## Voir aussi

MSG-03 garde la trace de ce que le relay a déjà envoyé. WIR-02 garde les shutdown hooks dans le bootstrap.
