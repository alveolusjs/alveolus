import type { AnyDomainEvent } from "../../domain/domain-events/index.ts";

/**
 * Port that publishes domain events once the aggregate that recorded them is saved.
 *
 * Implement it in a driven adapter (message broker, outbox table, in-process subscribers).
 * Command handlers call it with `aggregate.pullDomainEvents()` after `save`. A failure to publish
 * is technical: the adapter throws.
 *
 * @example
 * ```ts
 * await orders.save(order);
 * await publisher.publish(order.pullDomainEvents());
 * ```
 *
 * @see {@link https://alveolusjs.github.io/alveolus/core/application/event-publishers | Event publishers}
 */
export interface EventPublisher {
	publish(events: readonly AnyDomainEvent[]): Promise<void>;
}
