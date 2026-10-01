import { describe, expect, it } from "vitest";

import { FixedClock } from "../../../test/fixtures/application.ts";
import { Clock } from "./clock.ts";
import { Port } from "./port.ts";

describe("Port", () => {
	it("is extended by a port and by the adapter that implements it", () => {
		const date = new Date("2026-01-01T00:00:00Z");
		const clock = new FixedClock(date);

		expect(clock.now()).toBe(date);
		expect(clock).toBeInstanceOf(Clock);
		expect(clock).toBeInstanceOf(Port);
	});

	it("cannot be instantiated on its own", () => {
		// @ts-expect-error
		expect(new Port()).toBeInstanceOf(Port);
	});
});
