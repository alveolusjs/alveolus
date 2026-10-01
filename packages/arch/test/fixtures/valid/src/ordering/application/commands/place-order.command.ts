import { err, ok } from "@alveolus/core";
import type { CommandHandler, Result } from "@alveolus/core";

import type { Clock } from "../../../shared-kernel/application/ports/clock.port.ts";
import { Order } from "../../domain/aggregates/order.aggregate.ts";
import { OrderAlreadyPlaced } from "../../domain/errors/order.error.ts";
import type { OrderRepository } from "../../domain/repositories/order.repository.ts";
import { CustomerId, OrderId } from "../../domain/value-objects/ids.identifier.ts";
import type { Audit } from "../metadata/audit.metadata.ts";

export type PlaceOrder = { orderId: string; customerId: string; total: number; audit: Audit };

export class PlaceOrderHandler implements CommandHandler<PlaceOrder, void, OrderAlreadyPlaced> {
	public constructor(
		private readonly orders: OrderRepository,
		private readonly notifications: NotificationPublisher<Audit>,
		private readonly clock: Clock,
	) {}

	public async handle(command: PlaceOrder): Promise<Result<void, OrderAlreadyPlaced>> {
		const order =
			(await this.orders.findById(new OrderId(command.orderId))) ??
			Order.create(new OrderId(command.orderId), new CustomerId(command.customerId));
		const placed = order.place(command.total, this.clock.now());
		if (!placed.ok) {
			return err(new OrderAlreadyPlaced());
		}
		await this.orders.save(order);
		await this.notifications.publish(
			order.pullDomainEvents().map((event) => new Notification({ event, id: order.id.value, metadata: command.audit })),
		);
		return ok();
	}
}
