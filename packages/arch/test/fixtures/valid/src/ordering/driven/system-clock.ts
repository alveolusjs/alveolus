import type { Clock } from "../../shared-kernel/application/ports/clock.port.ts";

export class SystemClock implements Clock {
	public now(): Date {
		return new Date();
	}
}
