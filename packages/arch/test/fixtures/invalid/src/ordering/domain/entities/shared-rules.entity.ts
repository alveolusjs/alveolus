import { Entity } from "@alveolus/core";

import { FixtureId } from "../value-objects/ids.identifier.ts";

export class Seat extends Entity<FixtureId, { id: string }> {
	public label = "A1";
	private bookedAt = 0;

	public constructor(id: FixtureId) {
		super(id);
	}

	public book(): void {
		this.bookedAt = Date.now();
	}

	public async release(): Promise<void> {
		this.bookedAt = await Promise.resolve(0);
	}

	public get bookedSince(): number {
		return this.bookedAt;
	}

	public static fromSnapshot(snapshot: { id: string }): Seat {
		return new Seat(new FixtureId(snapshot.id));
	}

	public toSnapshot(): { id: string } {
		return { id: this.id.value };
	}
}
