---
menu: Vue d’ensemble
---

# Messagerie

Les events sortent d’un bounded context par des messages. Ces règles enregistrent les events avec l’état qui les a produits (outbox), les transmettent dans l’ordre, les consomment une seule fois malgré les doublons et le désordre, et survivent à une panne du broker quand il y en a un.

Dans un monolithe, elles valent aussi entre bounded contexts qui échangent des messages dans le même processus.

## En pratique {#in-practice}

Quand de l’argent sort d’un wallet, le titulaire reçoit une notification. Le bounded context `wallets` enregistre l’event dans l’outbox, dans la transaction qui comptabilise l’écriture :

```ts
const booked = await this.#journal.book(entry.value);

if (!booked.ok) {
	return booked;
}

await this.#outbox.add(this.#translator.translateAll(entry.value.pullDomainEvents()));
```

Un forwarder publie ensuite l’outbox dans l’ordre (MSG-03). Dans le bounded context `notifications`, un consumer lit le contrat publié et met la notification en file une seule fois, même quand le message arrive deux fois :

```ts
export const IncomingMoneyWithdrawn = z.object({
	eventId: z.uuid(),
	type: z.literal(MONEY_WITHDRAWN),
	version: z.literal(1),
	payload: z.object({
		holderId: z.uuid(),
		amount: z.object({ minor: z.string(), currency: z.string() }),
	}),
});

export class MoneyWithdrawnConsumer {
	readonly #consumer: IntegrationConsumer;
	readonly #notifications: NotificationService;

	constructor(consumer: IntegrationConsumer, notifications: NotificationService) {
		this.#consumer = consumer;
		this.#notifications = notifications;
	}

	subscribe(): void {
		this.#consumer.on(
			MONEY_WITHDRAWN,
			'notifications.notify-withdrawal',
			(raw) => IncomingMoneyWithdrawn.parse(raw),
			(withdrawn) => this.#notifications.notifyWithdrawal(withdrawn.payload),
		);
	}
}
```

- L’écriture et ses events s’enregistrent ensemble : pas d’event sans son état, pas d’état sans son event (MSG-01).
- `IntegrationConsumer` reçoit le type du message, le nom du consumer, la lecture et le traitement. Il marque le message comme traité dans la transaction du traitement, et ignore un `eventId` déjà traité par ce consumer (MSG-04).
- `notifications` est un bounded context en transaction scripts : le consumer appelle une méthode de son service (TXS-01).
- Le consumer ne dépend que du contrat publié, et ne lit que les champs dont il a besoin (PUB-01, PUB-05).

## Règles {#rules}

<RuleTable />
