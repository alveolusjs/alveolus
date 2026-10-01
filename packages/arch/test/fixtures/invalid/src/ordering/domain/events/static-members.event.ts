import { DomainEvent } from "@alveolus/core";

import type { FixtureId } from "../value-objects/ids.identifier.ts";

export class ParcelWeighed extends DomainEvent<FixtureId, { grams: number }> {
	public static readonly TYPE = "parcel.weighed";

	public static of(aggregateId: FixtureId, grams: number, occurredAt: Date): ParcelWeighed {
		return new ParcelWeighed({ aggregateId, occurredAt, payload: { grams } });
	}

	static {
		ParcelWeighed.TYPE.toString();
	}
}
