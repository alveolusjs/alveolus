import { Entity } from "@alveolus/core";

import { FixtureId } from "../domain/value-objects/ids.identifier.ts";

export class Session extends Entity<FixtureId, { id: string }> {
	public static fromSnapshot(snapshot: { id: string }): Session {
		return new Session(new FixtureId(snapshot.id));
	}

	public toSnapshot(): { id: string } {
		return { id: this.id.value };
	}
}
