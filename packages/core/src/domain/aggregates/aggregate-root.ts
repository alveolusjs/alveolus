import type { AnyDomainEvent } from "../domain-events/index.ts";
import type { AnySnapshot } from "../entities/index.ts";
import { Entity } from "../entities/index.ts";
import type { AnyIdentifier } from "../value-objects/index.ts";

export abstract class AggregateRoot<Id extends AnyIdentifier, Event extends AnyDomainEvent = AnyDomainEvent, Snapshot extends AnySnapshot = AnySnapshot> extends Entity<Id, Snapshot> {
	private pendingDomainEvents: Event[] = [];

	public get domainEvents(): readonly Event[] {
		return [...this.pendingDomainEvents];
	}

	public pullDomainEvents(): Event[] {
		const events = this.pendingDomainEvents;
		this.pendingDomainEvents = [];
		return events;
	}

	protected record(event: Event): void {
		this.pendingDomainEvents.push(event);
	}
}

export type AnyAggregateRoot = AggregateRoot<AnyIdentifier>;
