import { Entity } from "@alveolus/core";

import { Customer } from "../aggregates/customer.aggregate.ts";
import { FixtureId } from "../value-objects/ids.identifier.ts";

export class Line extends Entity<FixtureId, { id: string }> {
	public readonly customer: Customer;

	protected constructor(id: FixtureId, customer: Customer) {
		super(id);
		this.customer = customer;
	}

	public static fromSnapshot(snapshot: { id: string }): Line {
		return new Line(new FixtureId(snapshot.id), Customer.fromSnapshot(snapshot));
	}

	public toSnapshot(): { id: string } {
		return { id: this.id.value };
	}
}
