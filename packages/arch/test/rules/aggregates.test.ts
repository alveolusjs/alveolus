import { describe, expect, it } from "vitest";

import { check } from "../../src/index.ts";
import { fixture, invalidProjectViolations, reported } from "../fixtures.ts";

describe("aggregate rules", () => {
	it("accepts a well-formed project", () => {
		expect(check({ project: fixture("valid") })).toEqual([]);
	});

	it("reports references to other aggregates in properties, parameters and return types", () => {
		const message = "Shipment references aggregate Customer; reference it by its identifier instead.";
		expect(reported("domain/aggregates/reference-by-identity.aggregate.ts")).toEqual(
			[7, 8, 10, 15, 19].map((line) => ({ line, message, rule: "aggregate/reference-by-identity" })),
		);
	});

	it("reports public mutable properties, parameter properties and setters", () => {
		expect(reported("domain/aggregates/public-mutable-state.aggregate.ts")).toEqual([
			{
				line: 6,
				message: "Cart.status is public and mutable; make it readonly or private.",
				rule: "aggregate/no-public-mutable-state",
			},
			{
				line: 13,
				message: "Cart.note is public and mutable; make it readonly or private.",
				rule: "aggregate/no-public-mutable-state",
			},
			{
				line: 19,
				message: "Cart.label has a public setter; change state through business methods.",
				rule: "aggregate/no-public-mutable-state",
			},
		]);
	});

	it("reports reads of the clock but not dates built from a value", () => {
		expect(reported("domain/aggregates/hidden-clock.aggregate.ts")).toEqual([
			{
				line: 11,
				message: "Payment reads the clock with new Date(); receive the date as a parameter instead.",
				rule: "aggregate/no-hidden-clock",
			},
			{
				line: 12,
				message: "Payment reads the clock with Date.now(); receive the date as a parameter instead.",
				rule: "aggregate/no-hidden-clock",
			},
		]);
	});

	it("reports repository dependencies and methods returning a Promise", () => {
		expect(reported("domain/aggregates/io.aggregate.ts")).toEqual([
			{
				line: 12,
				message: "Invoice depends on InvoiceRepository; aggregates must not use repositories.",
				rule: "aggregate/no-io",
			},
			{
				line: 17,
				message: "Invoice.send returns a Promise; aggregates must not perform I/O.",
				rule: "aggregate/no-io",
			},
			{
				line: 21,
				message: "Invoice.load returns a Promise; aggregates must not perform I/O.",
				rule: "aggregate/no-io",
			},
		]);
	});

	it("reports public instance methods that do not return a Result, but not toSnapshot", () => {
		expect(reported("domain/aggregates/public-methods-return-result.aggregate.ts")).toEqual([
			{
				line: 13,
				message: "Ticket.close must return a Result; return ok() or err() from @alveolus/core.",
				rule: "aggregate/public-methods-return-result",
			},
			{
				line: 22,
				message: "Ticket.count must return a Result; return ok() or err() from @alveolus/core.",
				rule: "aggregate/public-methods-return-result",
			},
		]);
	});

	it("reports public constructors", () => {
		expect(reported("domain/aggregates/public-constructor.aggregate.ts")).toEqual([
			{
				line: 6,
				message: "Basket has a public constructor; make it protected or private and expose static factories.",
				rule: "aggregate/non-public-constructor",
			},
		]);
	});

	it("reports aggregates extending another aggregate", () => {
		expect(reported("domain/aggregates/inheritance.aggregate.ts")).toEqual([
			{
				line: 3,
				message: "PremiumCustomer extends Customer; aggregates must extend AggregateRoot directly.",
				rule: "aggregate/no-inheritance",
			},
		]);
	});

	it("reports every aggregate after the first one in a file", () => {
		expect(reported("domain/aggregates/two-aggregates.aggregate.ts")).toEqual([
			{
				line: 15,
				message: "Pallet is not the only aggregate in two-aggregates.aggregate.ts; move it to its own file.",
				rule: "aggregate/one-per-file",
			},
		]);
	});

	it("reports nothing on a valid aggregate of the invalid project", () => {
		expect(reported("domain/aggregates/customer.aggregate.ts")).toEqual([]);
	});

	it("sorts violations by file and position", () => {
		const keys = invalidProjectViolations().map(({ file, line, column }) => [file, line, column] as const);
		expect(keys).toEqual(keys.toSorted((a, b) => a[0].localeCompare(b[0]) || a[1] - b[1] || a[2] - b[2]));
	});

	it("fails when the tsconfig does not exist", () => {
		expect(() => check({ project: "missing/tsconfig.json" })).toThrow(/Cannot find .*missing\/tsconfig\.json/);
	});

	it("reports aggregates without a public static fromSnapshot", () => {
		expect(reported("domain/aggregates/without-from-snapshot.aggregate.ts")).toEqual([
			{
				line: 5,
				message: "Locker has no public static fromSnapshot; add one to rebuild it from its snapshot.",
				rule: "aggregate/from-snapshot",
			},
		]);
	});
});
