import type { AnyDomainEvent } from "../../domain/domain-events/index.ts";

export interface NotificationProps<Event extends AnyDomainEvent, Metadata extends object> {
	readonly id: string;
	readonly event: Event;
	readonly version?: number;
	readonly metadata: Metadata;
}

/**
 * Envelope that carries a {@link DomainEvent} outside its bounded context.
 *
 * The application wraps each domain event it publishes to other bounded contexts, then sends the
 * notifications through a {@link NotificationPublisher}. `id` identifies the notification so that
 * consumers can ignore duplicates. `version` is the version of the event format, `1` by default:
 * increase it when the payload changes in a way consumers must know about. `type` and
 * `occurredAt` come from the event. `metadata` carries what the event does not know, such as who
 * triggered it, through which channel, or a correlation id for an audit trail. It is always
 * passed: `{}` when there is nothing to add. A notification serializes with `JSON.stringify`; consumers read that JSON
 * and do not depend on the event class.
 *
 * @typeParam Event - The domain event carried by the notification.
 * @typeParam Metadata - Data added by the application, an object. Inferred from `metadata`.
 *
 * @throws {RangeError} When `version` is not a positive integer.
 *
 * @example
 * ```ts
 * const notifications = order
 *   .pullDomainEvents()
 *   .map((event) => new Notification({ id: randomUUID(), event, metadata: { userId, channel: "api" } }));
 * await notificationPublisher.publish(notifications);
 * ```
 *
 * @see {@link https://alveolusjs.github.io/alveolus/core/application/notifications | Notifications}
 */
export class Notification<Event extends AnyDomainEvent = AnyDomainEvent, Metadata extends object = object> {
	public readonly id: string;
	public readonly type: string;
	public readonly version: number;
	public readonly occurredAt: Date;
	public readonly event: Event;
	public readonly metadata: Metadata;

	public constructor(props: NotificationProps<Event, Metadata>) {
		const version = props.version ?? 1;
		if (!Number.isSafeInteger(version) || version < 1) {
			throw new RangeError(`Notification version must be a positive integer, got ${version}`);
		}
		this.id = props.id;
		this.type = props.event.type;
		this.version = version;
		this.occurredAt = new Date(props.event.occurredAt);
		this.event = props.event;
		this.metadata = props.metadata;
	}
}

export type AnyNotification = Notification<AnyDomainEvent, object>;
