import type { AnyDomainEvent } from '../domain-events/index.ts';
import { Entity } from '../entities/index.ts';
import type { AnyIdentifier } from '../value-objects/index.ts';
import type { AnySnapshot } from './snapshot.ts';

export abstract class AggregateRoot<
	Id extends AnyIdentifier,
	Event extends AnyDomainEvent,
	Snapshot extends AnySnapshot,
> extends Entity<Id> {
	#pendingDomainEvents: Event[] = [];

	public get domainEvents(): readonly Event[] {
		return [...this.#pendingDomainEvents];
	}

	public pullDomainEvents(): Event[] {
		const events = this.#pendingDomainEvents;
		this.#pendingDomainEvents = [];
		return events;
	}

	public abstract toSnapshot(): Snapshot;

	protected record(event: Event): void {
		this.#pendingDomainEvents.push(event);
	}
}

export type AnyAggregateRoot = AggregateRoot<AnyIdentifier, AnyDomainEvent, AnySnapshot>;
