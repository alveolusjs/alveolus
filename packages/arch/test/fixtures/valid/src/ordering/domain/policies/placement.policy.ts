import { err, ok, Policy } from "@alveolus/core";
import type { Result } from "@alveolus/core";

import type { Order } from "../aggregates/order.aggregate.ts";
import { OrderAlreadyPlaced } from "../errors/order.error.ts";

export class PlacementPolicy extends Policy<Order, OrderAlreadyPlaced> {
	public check(order: Order): Result<void, OrderAlreadyPlaced> {
		return order.isPlaced ? err(new OrderAlreadyPlaced()) : ok();
	}
}
