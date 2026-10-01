import { DomainService } from "@alveolus/core";

import type { Customer } from "../aggregates/customer.aggregate.ts";

export class LoyaltyService extends DomainService {
	private points = 0;
	private readonly lastCustomer: Customer | undefined;

	public constructor(
		public bonus: number,
		lastCustomer?: Customer,
	) {
		super();
		this.lastCustomer = lastCustomer;
	}

	public set rate(value: number) {
		this.bonus = value;
	}

	public award(): number {
		this.points++;
		return this.points + (this.lastCustomer === undefined ? 0 : this.bonus);
	}
}
