import { CommandHandler, ok } from "@alveolus/core";
import type { Result } from "@alveolus/core";

import type { Orders } from "../../domain/repositories/orders.repository.ts";
import { OrderId } from "../../domain/value-objects/order-id.identifier.ts";

export interface PlaceOrder {
	readonly orderId: string;
}

export class PlaceOrderHandler extends CommandHandler<PlaceOrder> {
	public constructor(private readonly orders: Orders) {
		super();
	}

	public async handle({ orderId }: PlaceOrder): Promise<Result<void, never>> {
		const order = await this.orders.findById(new OrderId(orderId));
		order?.place();
		return ok();
	}
}
