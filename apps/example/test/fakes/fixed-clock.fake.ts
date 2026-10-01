import type { Clock } from "../../src/shared-kernel/application/ports/clock.port.ts";

export class FixedClock implements Clock {
	public constructor(private readonly date: Date = new Date("2026-01-01T10:00:00Z")) {}

	public now(): Date {
		return new Date(this.date);
	}
}
