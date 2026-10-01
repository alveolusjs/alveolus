import type { AnyDomainEvent } from "../../domain/domain-events/index.ts";
import type { Notification } from "./notification.ts";

/**
 * Port that sends {@link Notification}s to other bounded contexts.
 *
 * Implement it in a driven adapter (message broker, notification log, outbox table). The
 * application calls it once the aggregate is saved. A failure to publish is technical: the
 * adapter throws. Use an {@link EventPublisher} for domain events handled inside the bounded
 * context.
 *
 * @typeParam Metadata - The metadata of the notifications it publishes. Defaults to any object.
 *
 * @example
 * ```ts
 * await orders.save(order);
 * await notificationPublisher.publish(
 *   order.pullDomainEvents().map((event) => new Notification({ id: randomUUID(), event, metadata: {} })),
 * );
 * ```
 *
 * @see {@link https://alveolusjs.github.io/alveolus/core/application/notifications | Notifications}
 */
export interface NotificationPublisher<Metadata extends object = object> {
	publish(notifications: readonly Notification<AnyDomainEvent, Metadata>[]): Promise<void>;
}
