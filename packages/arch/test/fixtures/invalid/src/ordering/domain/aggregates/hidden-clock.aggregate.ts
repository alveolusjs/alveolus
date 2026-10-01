import { AggregateRoot, ok } from "@alveolus/core";
import type { Result } from "@alveolus/core";

import { FixtureId } from "../value-objects/ids.identifier.ts";

export class Payment extends AggregateRoot<FixtureId, { id: string }> {
	private paidAt: Date | undefined;
	private attemptedAt = 0;

	public pay(): Result<void, never> {
		this.paidAt = new Date();
		this.attemptedAt = Date.now();
		return ok();
	}

	public payAt(timestamp: number): Result<void, never> {
		this.paidAt = new Date(timestamp);
		return ok();
	}

	public get paid(): boolean {
		return this.paidAt !== undefined && this.attemptedAt > 0;
	}

	public static fromSnapshot(snapshot: { id: string }): Payment {
		return new Payment(new FixtureId(snapshot.id));
	}

	public toSnapshot(): { id: string } {
		return { id: this.id.value };
	}
}
