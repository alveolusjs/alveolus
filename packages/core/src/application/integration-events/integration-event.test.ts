import { describe, expect, it } from "vitest";

import type { IntegrationEvent } from "./integration-event.ts";

describe("IntegrationEvent", () => {
	it("is plain JSON with a literal type and a JSON payload", () => {
		const event: IntegrationEvent<"OrderPlaced", { total: number }> = {
			correlationId: "c1",
			id: "evt_1",
			occurredAt: "2026-01-01T00:00:00.000Z",
			payload: { total: 42 },
			source: "ordering",
			type: "OrderPlaced",
			version: 1,
		};
		// @ts-expect-error
		const withDate: IntegrationEvent<"OrderPlaced", { at: Date }> | undefined = undefined;
		// @ts-expect-error
		const otherType: IntegrationEvent<"OrderPlaced", { total: number }> = { ...event, type: "OrderCancelled" };

		expect(JSON.parse(JSON.stringify(event))).toEqual(event);
		expect([withDate, otherType.type]).toEqual([undefined, "OrderCancelled"]);
	});
});
