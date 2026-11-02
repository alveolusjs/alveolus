import type { AnyDomainEvent, DomainEventSnapshot } from '../../domain/domain-events/index.ts';
import type {
	AnyAsyncDomainEventHandlerClass,
	AnyDomainEventHandlerClass,
	DomainEventMode,
	DomainEventSubscription,
} from './domain-event-subscription.ts';

type SubscribedEventClass = (abstract new (...args: never[]) => AnyDomainEvent) & {
	readonly fromSnapshot?: (snapshot: DomainEventSnapshot) => AnyDomainEvent;
};

type Subscription = readonly [SubscribedEventClass, AnyDomainEventHandlerClass, DomainEventMode];

export class DomainEventHandlers<Event extends AnyDomainEvent> {
	readonly #subscriptions: readonly Subscription[];

	public constructor(subscriptions: readonly DomainEventSubscription<Event>[]) {
		this.#subscriptions = subscriptions as readonly Subscription[];
	}

	public synchronousHandlers(): readonly AnyDomainEventHandlerClass[] {
		return this.#handlersIn('sync');
	}

	public asynchronousHandlers(): readonly AnyAsyncDomainEventHandlerClass[] {
		return this.#handlersIn('async') as readonly AnyAsyncDomainEventHandlerClass[];
	}

	public synchronousHandlersOf(event: AnyDomainEvent): readonly AnyDomainEventHandlerClass[] {
		return this.#subscriptions
			.filter(([subscribed, , mode]) => mode === 'sync' && subscribed === event.constructor)
			.map(([, handler]) => handler);
	}

	public isDeferred(event: AnyDomainEvent): boolean {
		return this.#subscriptions.some(([subscribed, , mode]) => mode === 'async' && subscribed === event.constructor);
	}

	public subscribes(handler: AnyAsyncDomainEventHandlerClass, type: string): boolean {
		return this.#subscriptions.some(
			([subscribed, subscriber, mode]) => mode === 'async' && subscriber === handler && subscribed.name === type,
		);
	}

	public restore(type: string, snapshot: DomainEventSnapshot): AnyDomainEvent {
		const restorable = this.#subscriptions.find(([subscribed]) => subscribed.name === type)?.[0];

		if (restorable?.fromSnapshot === undefined) {
			throw new Error(`No asynchronous event handler restores ${type}`);
		}

		return restorable.fromSnapshot(snapshot);
	}

	#handlersIn(mode: DomainEventMode): readonly AnyDomainEventHandlerClass[] {
		const handlers = this.#subscriptions
			.filter(([, , subscribed]) => subscribed === mode)
			.map(([, handler]) => handler);

		return [...new Set(handlers)];
	}
}
