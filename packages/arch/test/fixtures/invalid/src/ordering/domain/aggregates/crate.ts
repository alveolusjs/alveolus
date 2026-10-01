import { AggregateRoot } from "@alveolus/core";

import { FixtureId } from "../value-objects/ids.identifier.ts";

export class Crate extends AggregateRoot<FixtureId, { id: string }> {
	public static fromSnapshot(snapshot: { id: string }): Crate {
		return new Crate(new FixtureId(snapshot.id));
	}

	public toSnapshot(): { id: string } {
		return { id: this.id.value };
	}
}
