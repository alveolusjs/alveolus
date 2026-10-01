import { AggregateRoot } from "@alveolus/core";

import { FixtureId } from "../value-objects/ids.identifier.ts";
import { Customer } from "./customer.aggregate.ts";

export class Shipment extends AggregateRoot<FixtureId, { id: string }> {
	public readonly customer: Customer;
	private readonly previousCustomers: readonly Customer[] = [];

	protected constructor(id: FixtureId, customer: Customer) {
		super(id);
		this.customer = customer;
	}

	public static create(id: FixtureId, customer: Customer): Shipment {
		return new Shipment(id, customer);
	}

	public get lastCustomer(): Customer | undefined {
		return this.previousCustomers.at(-1);
	}

	public get customerId(): FixtureId {
		return this.customer.id;
	}

	public static fromSnapshot(snapshot: { id: string }): Shipment {
		return new Shipment(new FixtureId(snapshot.id), Customer.fromSnapshot(snapshot));
	}

	public toSnapshot(): { id: string } {
		return { id: this.id.value };
	}
}
