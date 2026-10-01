import { err, Notification, ok } from "@alveolus/core";
import type { CommandHandler, EventPublisher, NotificationPublisher, Result } from "@alveolus/core";

import type { Clock } from "../../../shared-kernel/application/ports/clock.port.ts";
import type { IdGenerator } from "../../../shared-kernel/application/ports/id-generator.port.ts";
import type { EmptyOrder } from "../../domain/errors/empty-order.error.ts";
import type { OrderNotDraft } from "../../domain/errors/order-not-draft.error.ts";
import { OrderNotFound } from "../../domain/errors/order-not-found.error.ts";
import type { OrderRepository } from "../../domain/repositories/order.repository.ts";
import { OrderId } from "../../domain/value-objects/order-id.identifier.ts";
import type { Audit } from "../metadata/audit.metadata.ts";

export type PlaceOrder = {
	orderId: string;
	audit: Audit;
};

type PlaceOrderError = OrderNotFound | OrderNotDraft | EmptyOrder;

export class PlaceOrderHandler implements CommandHandler<PlaceOrder, void, PlaceOrderError> {
	public constructor(
		private readonly orders: OrderRepository,
		private readonly events: EventPublisher,
		private readonly notifications: NotificationPublisher<Audit>,
		private readonly clock: Clock,
		private readonly ids: IdGenerator,
	) {}

	public async handle({ orderId, audit }: PlaceOrder): Promise<Result<void, PlaceOrderError>> {
		const order = await this.orders.findById(new OrderId(orderId));
		if (order === undefined) {
			return err(new OrderNotFound({ orderId }));
		}
		const placed = order.place(this.clock.now());
		if (!placed.ok) {
			return placed;
		}
		await this.orders.save(order);
		const events = order.pullDomainEvents();
		await this.events.publish(events);
		await this.notifications.publish(
			events.map((event) => new Notification({ event, id: this.ids.next(), metadata: audit })),
		);
		return ok();
	}
}
