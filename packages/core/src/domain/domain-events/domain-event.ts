import type { AnyIdentifier } from "../entities/index.ts";

export interface DomainEventProps<Id extends AnyIdentifier, Payload> {
	readonly aggregateId: Id;
	readonly occurredAt: Date;
	readonly payload: Payload;
}

/**
 * Something that happened in the domain that domain experts care about.
 *
 * Declare one subclass per event, named in the past tense, with a typed payload. The event `type`
 * is the name of its class, so keep class names when bundling or minifying (for example esbuild
 * `keepNames`). Events are usually recorded by an {@link AggregateRoot}, which sets `aggregateId`
 * to its own identifier.
 *
 * `occurredAt` is always passed explicitly: the domain never reads the clock, so get the current
 * time from a clock port in the application layer. The event keeps its own copy of the date.
 *
 * @typeParam Id - {@link Identifier} of the aggregate the event belongs to.
 * @typeParam Payload - Data carried by the event.
 *
 * @example
 * ```ts
 * class OrderPlaced extends DomainEvent<OrderId, { total: number }> {}
 *
 * const event = new OrderPlaced({
 *   aggregateId: new OrderId("ord_1"),
 *   occurredAt: now,
 *   payload: { total: 42 },
 * });
 * event.type; // "OrderPlaced"
 * ```
 *
 * @see {@link https://alveolusjs.github.io/alveolus/core/domain/domain-events | Domain Events}
 */
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
