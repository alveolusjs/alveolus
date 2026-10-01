import { AggregateRoot } from "@alveolus/core";

import type { FixtureId } from "../value-objects/ids.identifier.ts";

export class Locker extends AggregateRoot<FixtureId, { id: string }> {
	private static fromRow(id: FixtureId): Locker {
		return new Locker(id);
	}

	public toSnapshot(): { id: string } {
		return { id: Locker.fromRow(this.id).id.value };
	}
}
