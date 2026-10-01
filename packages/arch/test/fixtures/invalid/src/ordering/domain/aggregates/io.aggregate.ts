import { AggregateRoot } from "@alveolus/core";

import { FixtureId } from "../value-objects/ids.identifier.ts";

export interface InvoiceRepository {
	exists(id: FixtureId): Promise<boolean>;
}

export class Invoice extends AggregateRoot<FixtureId, { id: string }> {
	protected constructor(
		id: FixtureId,
		private readonly invoices: InvoiceRepository,
	) {
		super(id);
	}

	public async send(): Promise<void> {
		await this.invoices.exists(this.id);
	}

	public load(): Promise<boolean> {
		return this.invoices.exists(this.id);
	}

	public static fromSnapshot(snapshot: { id: string }): Invoice {
		return new Invoice(new FixtureId(snapshot.id), { exists: async () => true });
	}

	public toSnapshot(): { id: string } {
		return { id: this.id.value };
	}
}
