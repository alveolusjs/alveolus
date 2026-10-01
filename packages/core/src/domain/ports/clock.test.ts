import { describe, expect, it } from "vitest";

import { FixedClock } from "../../../test/fixtures/application.ts";
import type { Clock } from "./clock.ts";
import { Port } from "./port.ts";

describe("Clock", () => {
	it("is a port that gives the current date", () => {
		const date = new Date("2026-01-01T00:00:00Z");
		const clock: Clock = new FixedClock(date);

		expect(clock.now()).toBe(date);
		expect(clock).toBeInstanceOf(Port);
	});
});
