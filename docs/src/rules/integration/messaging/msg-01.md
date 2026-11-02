---
code: MSG-01
title: L’état du modèle et ses events s’enregistrent ensemble
group: Publication
scope: [application, driven]
style: [tactical, transaction-script]
kind: safeguard
requires: [messaging.outbox-forwarder, persistence.unit-of-work]
severity: blocking
detection: []
review: approved
sources:
  - "Spreading the News to Remote Bounded Contexts › Messaging Infrastructure Consistency"
  - "Modeling Events › With Aggregate Characteristics"
---

# MSG-01 · L’état du modèle et ses events s’enregistrent ensemble

<RuleMeta />

## Signal

- Un use case ou un handler qui enregistre le modèle, puis publie l’event au broker, en deux opérations séparées, sans stockage partagé ni transaction globale.
- Un use case qui publie avant le commit, et peut annoncer un état annulé ensuite.

## Pourquoi

Même en eventual consistency, deux stockages doivent toujours s’accorder : celui du modèle, et celui de la messagerie qui livre ses events. Sinon, un changement enregistré peut ne jamais être annoncé, ou un event peut annoncer un état qui n’existe pas. Les modèles qui en dépendent deviennent faux.

Il y a trois options :

1. le modèle et la messagerie partagent le même stockage ;
2. une transaction distribuée (XA) ;
3. une table d’events dans la base du modèle, écrite dans la même transaction locale, et livrée plus tard par un composant à part.

Nous prenons la troisième.

## Exceptions

Un broker qui partage le stockage du modèle, ou une transaction distribuée choisie exprès.

## Correction

Écrire l’event dans une table de la base du modèle, dans la même transaction que le modèle. Le livrer plus tard (MSG-03).

## Adaptation

Cette table d’events sert de file d’attente : c’est l’outbox transactionnelle.

**Notre choix** : l’outbox est une table de la base du modèle. Elle reçoit deux sortes d’entrées, toujours dans la transaction du use case :

- un **integration event**, écrit par le translator, event handler synchrone du bounded context. C’est un message du published language, avec son identifiant. Le forwarder le livre aux consumers des autres bounded contexts.
- un **domain event**, écrit par le dispatcher quand l’event a au moins un event handler asynchrone. Il ne quitte jamais le bounded context : le forwarder le livre aux seuls event handlers asynchrones de son bounded context.

Une colonne `kind` (`domain` ou `integration`) les distingue. Les repositories ne font que persister l’état. Pas de broker par défaut : le forwarder livre dans le même déploiement (MSG-03).

Un domain event enregistré dans l’outbox a un schéma persisté. Pendant un déploiement, la nouvelle version lit des entrées écrites par l’ancienne. Renommer un champ demande de lire les deux formats le temps du déploiement, ou d’attendre que l’outbox soit vide.

Un bounded context en transaction scripts n’a ni aggregate ni domain events : le script construit le message de son contrat publié (`public`), et l’ajoute à l’outbox, dans la transaction du Unit of Work (TXS-02).

**Avec une transaction explicite** : la ligne d’outbox s’écrit avec le client de la transaction qui enregistre le modèle.

## Voir aussi

MSG-03 pour la livraison. AGG-08 pour les effets d’un event hors de l’aggregate.

## Exemple

Un wallet bloque ses débits, et l’annonce par `WalletBlocked`.

```ts
// Avoid:
const blocked = wallet.block(reference, ['debits'], at);

if (!blocked.ok) {
	return blocked;
}

await this.#wallets.save(wallet);
await this.#broker.publish(WALLET_BLOCKED, message);
```

À éviter : deux écritures, sans garantie entre elles. Si la publication échoue, le wallet est bloqué en base et personne ne l’apprend.

```ts
// Preferred:
return this.#unitOfWork.run(async () => {
	const blocked = wallet.block(reference, ['debits'], at);

	if (!blocked.ok) {
		return blocked;
	}

	const saved = await this.#wallets.save(wallet);

	if (!saved.ok) {
		return saved;
	}

	await this.#events.dispatch(wallet.pullDomainEvents());

	return ok();
});
```

Préféré : le wallet et son event s’enregistrent dans la même transaction. Le translator, event handler synchrone, écrit l’integration event dans l’outbox, et le forwarder le publie après le commit.
