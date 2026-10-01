import { AggregateRoot } from "@alveolus/core";

import { FixtureId } from "../domain/value-objects/ids.identifier.ts";

export class Wallet extends AggregateRoot<FixtureId, { id: string }> {
	public static fromSnapshot(snapshot: { id: string }): Wallet {
		return new Wallet(new FixtureId(snapshot.id));
	}

	public toSnapshot(): { id: string } {
		return { id: this.id.value };
	}
}
