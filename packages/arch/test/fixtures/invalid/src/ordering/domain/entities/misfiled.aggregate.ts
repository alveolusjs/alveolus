import { AggregateRoot } from "@alveolus/core";

import { FixtureId } from "../value-objects/ids.identifier.ts";

export class Warehouse extends AggregateRoot<FixtureId, { id: string }> {
	public static fromSnapshot(snapshot: { id: string }): Warehouse {
		return new Warehouse(new FixtureId(snapshot.id));
	}

	public toSnapshot(): { id: string } {
		return { id: this.id.value };
	}
}
