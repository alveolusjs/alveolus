import { AggregateRoot, ok } from "@alveolus/core";
import type { Result } from "@alveolus/core";

import { FixtureId } from "../value-objects/ids.identifier.ts";

export class Ticket extends AggregateRoot<FixtureId, { id: string }> {
	private closed = false;

	public static open(id: FixtureId): Ticket {
		return new Ticket(id);
	}

	public close(): void {
		this.closed = true;
	}

	public reopen(): Result<void, never> {
		this.closed = false;
		return ok();
	}

	public count(): number {
		return this.closed ? 0 : 1;
	}

	private touch(): void {
		this.closed = !this.closed;
	}

	public get isClosed(): boolean {
		this.touch();
		return this.closed;
	}

	public static fromSnapshot(snapshot: { id: string }): Ticket {
		return new Ticket(new FixtureId(snapshot.id));
	}

	public toSnapshot(): { id: string } {
		return { id: this.id.value };
	}
}
