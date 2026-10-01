import { Entity } from "@alveolus/core";

import type { FixtureId } from "../value-objects/ids.identifier.ts";

export class Shelf extends Entity<FixtureId, { id: string }> {
	public toSnapshot(): { id: string } {
		return { id: this.id.value };
	}
}
