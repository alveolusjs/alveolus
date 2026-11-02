import type { AnyDomainEvent } from '../../domain/domain-events/index.ts';

export abstract class DomainEventHandler<Event extends AnyDomainEvent> {
	public abstract handle(event: Event): Promise<void>;
}
