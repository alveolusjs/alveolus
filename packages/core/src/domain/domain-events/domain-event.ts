import type { AnyIdentifier } from "../value-objects/index.ts";

export interface DomainEventProps<Id extends AnyIdentifier, Payload> {
	readonly id: string;
	readonly aggregateId: Id;
	readonly occurredAt: Date;
	readonly payload: Payload;
}

export abstract class DomainEvent<Id extends AnyIdentifier = AnyIdentifier, Payload = unknown> {
	public readonly id: string;
	public readonly aggregateId: Id;
	public readonly occurredAt: Date;
	public readonly payload: Payload;

	public constructor(props: DomainEventProps<Id, Payload>) {
		this.id = props.id;
		this.aggregateId = props.aggregateId;
		this.occurredAt = new Date(props.occurredAt);
		this.payload = props.payload;
	}
}

export type AnyDomainEvent = DomainEvent<AnyIdentifier, unknown>;
