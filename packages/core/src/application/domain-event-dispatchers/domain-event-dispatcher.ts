import type { AnyDomainEvent } from '../../domain/domain-events/index.ts';
import type { Correlation, CorrelationContext } from '../correlation-contexts/index.ts';
import type {
	AnyDomainEventHandlerClass,
	DomainEventHandlerResolver,
	DomainEventHandlers,
	RestorableDomainEvent,
} from '../domain-event-handlers/index.ts';
import type { DomainEventRecord, Outbox } from '../outbox/index.ts';

type ResolvedHandler = { readonly handle: (event: AnyDomainEvent) => Promise<void> };

export class DomainEventDispatcher<Event extends AnyDomainEvent> {
	readonly #source: string;
	readonly #handlers: DomainEventHandlers<Event>;
	readonly #instances: ReadonlyMap<AnyDomainEventHandlerClass, ResolvedHandler>;
	readonly #outbox: Outbox;
	readonly #correlation: CorrelationContext;

	public constructor(
		source: string,
		handlers: DomainEventHandlers<Event>,
		resolve: DomainEventHandlerResolver,
		outbox: Outbox,
		correlation: CorrelationContext,
	) {
		this.#source = source;
		this.#handlers = handlers;
		this.#instances = new Map(
			handlers.synchronousHandlers().map((handler) => [handler, resolve(handler) as ResolvedHandler]),
		);
		this.#outbox = outbox;
		this.#correlation = correlation;
	}

	public async dispatch(events: readonly Event[]): Promise<void> {
		const correlation = this.#correlation.current();

		await this.#correlation.run(correlation, async () => {
			for (const event of events) {
				await this.#handleNow(event);
			}

			const deferred = events.filter((event) => this.#handlers.isDeferred(event));

			if (deferred.length > 0) {
				await this.#outbox.addDomainEvents(deferred.map((event) => this.#record(event, correlation)));
			}
		});
	}

	async #handleNow(event: Event): Promise<void> {
		for (const handler of this.#handlers.synchronousHandlersOf(event)) {
			await this.#instanceOf(handler).handle(event);
		}
	}

	#instanceOf(handler: AnyDomainEventHandlerClass): ResolvedHandler {
		const instance = this.#instances.get(handler);

		if (instance === undefined) {
			throw new Error(`${handler.name} was not resolved`);
		}

		return instance;
	}

	#record(event: Event, correlation: Correlation): DomainEventRecord {
		const snapshot = (event as AnyDomainEvent as RestorableDomainEvent).toSnapshot();

		return { ...correlation, snapshot, source: this.#source, type: event.type };
	}
}
