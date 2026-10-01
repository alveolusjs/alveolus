import { DomainService, err, ok } from "@alveolus/core";
import type { Result } from "@alveolus/core";

import type { Customer } from "../aggregates/customer.aggregate.ts";
import type { Order } from "../aggregates/order.aggregate.ts";
import { OrderAlreadyPlaced } from "../errors/order.error.ts";

export class OrderEligibility extends DomainService {
	private readonly maximumTotal: number;

	public constructor(maximumTotal: number) {
		super();
		this.maximumTotal = maximumTotal;
	}

	public check(order: Order, customer: Customer, total: number, now: Date): Result<Date, OrderAlreadyPlaced> {
		if (order.isPlaced || total > this.maximumTotal || !order.customerId.equals(customer.id)) {
			return err(new OrderAlreadyPlaced());
		}
		return ok(now);
	}
}
