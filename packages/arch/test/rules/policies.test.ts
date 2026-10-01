import { describe, expect, it } from "vitest";

import { reported } from "../fixtures.ts";

describe("policy rules", () => {
	it("reports mutable fields, state changes and held aggregates", () => {
		const rule = "policy/stateless";
		expect(reported("domain/policies/stateful.policy.ts")).toEqual([
			{ line: 8, message: "ParcelQuotaPolicy.checked is mutable; policies are stateless.", rule },
			{
				line: 9,
				message: "ParcelQuotaPolicy.customer holds Customer; pass it as a parameter, policies are stateless.",
				rule,
			},
			{ line: 17, message: "ParcelQuotaPolicy changes its own state; policies are stateless.", rule },
		]);
	});

	it("reports reads of the clock and methods returning a Promise", () => {
		expect(reported("domain/policies/shared-rules.policy.ts")).toEqual([
			{
				line: 8,
				message: "ExpiryPolicy reads the clock with new Date(); receive the date as a parameter instead.",
				rule: "policy/no-hidden-clock",
			},
			{
				line: 11,
				message: "ExpiryPolicy.refresh returns a Promise; policies must not perform I/O.",
				rule: "policy/no-io",
			},
		]);
	});
});
