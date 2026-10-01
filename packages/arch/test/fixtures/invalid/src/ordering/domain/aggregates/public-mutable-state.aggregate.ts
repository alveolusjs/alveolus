import { AggregateRoot } from "@alveolus/core";

import { FixtureId } from "../value-objects/ids.identifier.ts";

export class Cart extends AggregateRoot<FixtureId, { id: string }> {
	public status = "open";
	public readonly total: number = 0;
	protected items: string[] = [];
	private discount = 0;

	protected constructor(
		id: FixtureId,
		public note: string,
		public readonly currency: string,
	) {
		super(id);
	}

	public set label(label: string) {
		this.note = label;
	}

	public get discounted(): number {
		return this.total - this.discount;
	}

	public static fromSnapshot(snapshot: { id: string }): Cart {
		return new Cart(new FixtureId(snapshot.id), "", "EUR");
	}

	public toSnapshot(): { id: string } {
		return { id: this.id.value };
	}
}
