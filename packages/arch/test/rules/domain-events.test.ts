import { describe, expect, it } from "vitest";

import { isPastTense } from "../../src/rules/domain-events/rules.ts";
import { reported } from "../fixtures.ts";

describe("domain event rules", () => {
	it("reports names that are not in the past tense", () => {
		expect(reported("domain/events/past-tense.event.ts")).toEqual(
			[
				[5, "ShipParcel"],
				[7, "ParcelDeliveredEvent"],
				[9, "ParcelSpeed"],
			].map(([line, name]) => ({
				line,
				message: `${name} is not named in the past tense; name the event after what happened, such as OrderPlaced.`,
				rule: "domain-event/past-tense",
			})),
		);
	});

	it("reports static properties, methods and blocks", () => {
		expect(reported("domain/events/static-members.event.ts")).toEqual([
			{
				line: 6,
				message: "ParcelWeighed.TYPE is static; domain events have no static members.",
				rule: "domain-event/no-static-members",
			},
			{
				line: 8,
				message: "ParcelWeighed.of is static; domain events have no static members.",
				rule: "domain-event/no-static-members",
			},
			{
				line: 12,
				message: "ParcelWeighed has a static block; domain events have no static members.",
				rule: "domain-event/no-static-members",
			},
		]);
	});

	it.each([
		["OrderPlaced", true],
		["PaymentFailed", true],
		["ParcelLost", true],
		["MoneyWithdrawn", true],
		["OrderSent", true],
		["StockReset", true],
		["OrderPlacedV2", false],
		["PlaceOrder", false],
		["OrderPlacedEvent", false],
		["CustomerNeed", false],
		["Order", false],
	])("recognises %s as past tense: %s", (name, expected) => {
		expect(isPastTense(name)).toBe(expected);
	});
});
