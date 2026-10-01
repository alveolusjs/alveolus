import { Entity, ok } from "@alveolus/core";
import type { Result } from "@alveolus/core";

import { LineShipped } from "../events/line-shipped.event.ts";
import { FixtureId } from "../value-objects/ids.identifier.ts";

export class ShippingLine extends Entity<FixtureId, { id: string }> {
	private readonly shipped: LineShipped[] = [];

	public ship(now: Date): Result<void, never> {
		this.shipped.push(new LineShipped({ aggregateId: this.id, occurredAt: now, payload: null }));
		return ok();
	}

	public static fromSnapshot(snapshot: { id: string }): ShippingLine {
		return new ShippingLine(new FixtureId(snapshot.id));
	}

	public toSnapshot(): { id: string } {
		return { id: this.id.value };
	}
}
