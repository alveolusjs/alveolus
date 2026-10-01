import { AggregateRoot } from "@alveolus/core";

import { FixtureId } from "../value-objects/ids.identifier.ts";

export class Basket extends AggregateRoot<FixtureId, { id: string }> {
	public constructor(id: FixtureId) {
		super(id);
	}

	public static fromSnapshot(snapshot: { id: string }): Basket {
		return new Basket(new FixtureId(snapshot.id));
	}

	public toSnapshot(): { id: string } {
		return { id: this.id.value };
	}
}
