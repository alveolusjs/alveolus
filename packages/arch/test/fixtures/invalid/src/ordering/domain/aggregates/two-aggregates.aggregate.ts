import { AggregateRoot } from "@alveolus/core";

import { FixtureId } from "../value-objects/ids.identifier.ts";

export class Parcel extends AggregateRoot<FixtureId, { id: string }> {
	public static fromSnapshot(snapshot: { id: string }): Parcel {
		return new Parcel(new FixtureId(snapshot.id));
	}

	public toSnapshot(): { id: string } {
		return { id: this.id.value };
	}
}

export class Pallet extends AggregateRoot<FixtureId, { id: string }> {
	public static fromSnapshot(snapshot: { id: string }): Pallet {
		return new Pallet(new FixtureId(snapshot.id));
	}

	public toSnapshot(): { id: string } {
		return { id: this.id.value };
	}
}
