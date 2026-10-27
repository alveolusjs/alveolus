---
code: MSG-05
title: Une opération déclenchée par un message est idempotente, par clé métier ou par état
group: Consommation
scope: [application, driving]
style: [tactical, transaction-script]
severity: blocking
severityNote: Bloquante si l’opération déplace de l’argent ou engage un tiers. Majeure sinon.
detection: []
review: approved
sources:
  - "Long-Running Processes, and Avoiding Responsibility (initiateDiscussion())"
  - "Process State Machines and Time-out Trackers (sidebar 'Did You Detect a Possible Problem Here?', idempotent ForumService operation)"
---

# MSG-05 · Une opération déclenchée par un message est idempotente, par clé métier ou par état

<RuleMeta />

## Signal

- Le handler d’une command reçue par message qui crée un aggregate sans vérifier d’abord s’il en existe déjà un pour la même demande.
- Une contrainte d’unicité comme seule déduplication, dont les violations remplissent les logs d’erreurs.
- La dernière étape d’un processus qui échoue, ou rejoue un effet, quand elle est reçue deux fois.
- Des retries d’un processus plus rapprochés que le temps normal de traitement, sans idempotence côté cible.

## Pourquoi

Avec une livraison at least once, la même command peut arriver plusieurs fois, même envoyée une seule fois. Les retries d’un processus ajoutent d’autres copies. Côté cible, une contrainte d’unicité empêche les doublons, mais chaque tentative de trop ressemble à un bug dans les logs.

L’opération se rend donc idempotente. Avant de créer l’aggregate, elle le cherche par sa clé métier : pour un wallet, son titulaire et sa devise. Côté initiateur, l’état suffit : un processus qui a déjà reçu la confirmation de l’ouverture ignore la suivante.

## Exceptions

Aucune.

## Correction

- Chercher par clé métier avant de créer, et renvoyer l’aggregate existant.
- Faire ignorer aux transitions d’état une command déjà appliquée.
- Garder la contrainte d’unicité en filet de sécurité, pour deux livraisons simultanées.

## Adaptation

Dédupliquer par identifiant de message (MSG-04) ne suffit pas ici. Un retry du processus envoie un nouveau message, avec un nouvel identifiant, pour la même intention. Seule une clé métier, ou l’état de l’aggregate, le repère.

## Voir aussi

MSG-04 pour les doublons d’un même message. AGG-08 pour la discipline des handlers. REP-04 pour l’unicité garantie par la base.

## Exemple

Le bounded context `onboarding` demande par message l’ouverture d’un wallet, une fois le titulaire accepté. La demande peut arriver plusieurs fois :

```ts
async handle(command: OpenWalletCommand): Promise<Result<WalletId, OpenWalletError>> {
	// ...

	return this.#unitOfWork.run(async () => {
		const existing = await this.#wallets.ofHolder(holderId.value, currency.value);

		if (existing) {
			return ok(existing.id);
		}

		const holder = await this.#holders.get(holderId.value);

		if (!holder) {
			return err(new HolderNotFound(holderId.value));
		}

		const wallet = holder.openWallet(await this.#wallets.nextIdentity(), currency.value, this.#clock.now());

		if (!wallet.ok) {
			return wallet;
		}

		const saved = await this.#wallets.save(wallet.value);

		if (!saved.ok) {
			return saved;
		}

		await this.#outbox.add(this.#translator.translateAll(wallet.value.pullDomainEvents()));

		return ok(wallet.value.id);
	});
}
```

Une seconde livraison trouve le wallet par son titulaire et sa devise, et renvoie le même `WalletId`, sans erreur. Deux livraisons simultanées passent toutes les deux la lecture : la contrainte d’unicité de la base (PER-03) refuse la seconde, que `save` renvoie en `WalletAlreadyOpen`.
