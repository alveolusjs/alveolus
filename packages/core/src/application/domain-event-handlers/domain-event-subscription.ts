import type { AnyDomainEvent, DomainEventSnapshot } from '../../domain/domain-events/index.ts';

export type DomainEventMode = 'sync' | 'async';

export type RestorableDomainEvent = AnyDomainEvent & { toSnapshot(): DomainEventSnapshot };

export type DomainEventClass<Event extends AnyDomainEvent> = abstract new (...args: never[]) => Event;

export type RestorableDomainEventClass<Event extends RestorableDomainEvent> = DomainEventClass<Event> & {
	readonly fromSnapshot: (snapshot: ReturnType<Event['toSnapshot']>) => Event;
};

export type DomainEventHandlerClass<Event extends AnyDomainEvent> = new (...args: never[]) => {
	readonly handle: (event: Event) => Promise<void>;
};

export type AsyncDomainEventHandlerClass<Event extends AnyDomainEvent> = DomainEventHandlerClass<Event> & {
	readonly channel: string;
};

export type DomainEventSubscription<Event extends AnyDomainEvent> = Event extends unknown
	?
			| readonly [DomainEventClass<Event>, DomainEventHandlerClass<Event>, 'sync']
			| (Event extends RestorableDomainEvent
					? readonly [RestorableDomainEventClass<Event>, AsyncDomainEventHandlerClass<Event>, 'async']
					: never)
	: never;

export type AnyDomainEventHandlerClass = new (...args: never[]) => { readonly handle: (event: never) => Promise<void> };

export type AnyAsyncDomainEventHandlerClass = AnyDomainEventHandlerClass & { readonly channel: string };
