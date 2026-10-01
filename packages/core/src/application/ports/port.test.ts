import { describe, expect, it } from "vitest";

import type { Port } from "./port.ts";

interface Clock extends Port {
	now(): Date;
}

describe("Port", () => {
	it("is extended by a technical port and implemented by an adapter", () => {
		const date = new Date("2026-01-01T00:00:00Z");
		const clock: Clock = { now: () => date };

		expect(clock.now()).toBe(date);
	});
});
