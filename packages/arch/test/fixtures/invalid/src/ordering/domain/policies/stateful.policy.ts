import { err, ok, Policy } from "@alveolus/core";
import type { Result } from "@alveolus/core";

import type { Customer } from "../aggregates/customer.aggregate.ts";
import { TooManyParcels } from "../errors/parcel.error.ts";

export class ParcelQuotaPolicy extends Policy<number, TooManyParcels> {
	private checked = 0;
	private readonly customer: Customer;

	public constructor(customer: Customer) {
		super();
		this.customer = customer;
	}

	public check(parcels: number): Result<void, TooManyParcels> {
		this.checked += 1;
		return parcels > 10 && this.customer.version > 0 ? err(new TooManyParcels()) : ok();
	}
}
