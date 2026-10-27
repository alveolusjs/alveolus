import type { AnyIdentifier } from '../value-objects/index.ts';

export interface DomainEventProps<Id extends AnyIdentifier, Payload> {
	readonly aggregateId: Id;
	readonly occurredAt: Date;
	readonly payload: Payload;
}

export abstract class DomainEvent<Id extends AnyIdentifier = AnyIdentifier, Payload = unknown> {
	public readonly aggregateId: Id;
	public readonly occurredAt: Date;
	public readonly payload: Payload;

	public constructor(props: DomainEventProps<Id, Payload>) {
		this.aggregateId = props.aggregateId;
		this.occurredAt = new Date(props.occurredAt);
		this.payload = props.payload;
	}

	public get type(): string {
		return this.constructor.name;
	}
}

export type AnyDomainEvent = DomainEvent<AnyIdentifier, unknown>;
