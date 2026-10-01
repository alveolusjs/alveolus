import { describe, expect, it } from "vitest";

import { reported } from "../fixtures.ts";

describe("entity rules", () => {
	it("reports references to aggregates", () => {
		const message = "Line references aggregate Customer; reference it by its identifier instead.";
		expect(reported("domain/entities/reference-by-identity.entity.ts")).toEqual(
			[7, 9].map((line) => ({ line, message, rule: "entity/reference-by-identity" })),
		);
	});

	it("reports domain events created by an entity", () => {
		expect(reported("domain/entities/no-domain-events.entity.ts")).toEqual([
			{
				line: 11,
				message: "ShippingLine creates domain event LineShipped; only aggregate roots record domain events.",
				rule: "entity/no-domain-events",
			},
		]);
	});

	it("applies the rules shared with aggregates", () => {
		expect(reported("domain/entities/shared-rules.entity.ts")).toEqual([
			{
				line: 6,
				message: "Seat.label is public and mutable; make it readonly or private.",
				rule: "entity/no-public-mutable-state",
			},
			{
				line: 9,
				message: "Seat has a public constructor; make it protected or private and expose static factories.",
				rule: "entity/non-public-constructor",
			},
			{
				line: 13,
				message: "Seat.book must return a Result; return ok() or err() from @alveolus/core.",
				rule: "entity/public-methods-return-result",
			},
			{
				line: 14,
				message: "Seat reads the clock with Date.now(); receive the date as a parameter instead.",
				rule: "entity/no-hidden-clock",
			},
			{ line: 17, message: "Seat.release returns a Promise; entities must not perform I/O.", rule: "entity/no-io" },
		]);
	});

	it("reports entities without a public static fromSnapshot", () => {
		expect(reported("domain/entities/without-from-snapshot.entity.ts")).toEqual([
			{
				line: 5,
				message: "Shelf has no public static fromSnapshot; add one to rebuild it from its snapshot.",
				rule: "entity/from-snapshot",
			},
		]);
	});
});
