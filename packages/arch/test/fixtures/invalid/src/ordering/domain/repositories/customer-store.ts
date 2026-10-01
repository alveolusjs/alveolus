import type { Repository } from "@alveolus/core";

import type { Customer } from "../aggregates/customer.aggregate.ts";
import type { FixtureId } from "../value-objects/ids.identifier.ts";

export class CustomerStore implements Repository<Customer> {
	public async findById(_id: FixtureId): Promise<Customer | undefined> {
		return undefined;
	}

	public async save(_customer: Customer): Promise<void> {}
}
