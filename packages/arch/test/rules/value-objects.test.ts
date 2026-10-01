import { describe, expect, it } from "vitest";

import { reported } from "../fixtures.ts";

describe("value object rules", () => {
	it("reports mutable properties, setters and changes to its own state outside the constructor", () => {
		const changes = "Price changes its own state; return a new instance instead.";
		expect(reported("domain/value-objects/immutable.value-object.ts")).toEqual([
			{ line: 5, message: "Price.label is mutable; make it readonly.", rule: "value-object/immutable" },
			{ line: 6, message: "Price.cache is mutable; make it readonly.", rule: "value-object/immutable" },
			{ line: 18, message: "Price.note is a setter; value objects are immutable.", rule: "value-object/immutable" },
			{ line: 19, message: changes, rule: "value-object/immutable" },
			{ line: 23, message: changes, rule: "value-object/immutable" },
			{ line: 28, message: changes, rule: "value-object/immutable" },
		]);
	});

	it("reports identifiers, entities and aggregates in props, parameters and return types", () => {
		const message = (name: string): string =>
			`Snapshot references ${name}, which has an identity; value objects hold values only.`;
		expect(reported("domain/value-objects/no-identity.value-object.ts")).toEqual([
			{ line: 7, message: message("FixtureId"), rule: "value-object/no-identity" },
			{ line: 7, message: message("Customer"), rule: "value-object/no-identity" },
			{ line: 8, message: message("FixtureId"), rule: "value-object/no-identity" },
			{ line: 8, message: message("Customer"), rule: "value-object/no-identity" },
			{ line: 12, message: message("FixtureId"), rule: "value-object/no-identity" },
		]);
	});

	it("reports public static factories that do not return a Result", () => {
		expect(reported("domain/value-objects/factories.value-object.ts")).toEqual([
			{
				line: 13,
				message: "Rate.of must return a Result; validate the input and return ok() or err().",
				rule: "value-object/factories-return-result",
			},
		]);
	});

	it("applies the rules shared with aggregates", () => {
		expect(reported("domain/value-objects/shared-rules.value-object.ts")).toEqual([
			{
				line: 4,
				message: "Stamp has a public constructor; make it protected or private and expose static factories.",
				rule: "value-object/non-public-constructor",
			},
			{
				line: 5,
				message: "Stamp reads the clock with Date.now(); receive the date as a parameter instead.",
				rule: "value-object/no-hidden-clock",
			},
			{
				line: 8,
				message: "Stamp.fetch returns a Promise; value objects must not perform I/O.",
				rule: "value-object/no-io",
			},
		]);
	});
});
