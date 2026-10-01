import { describe, expect, it } from "vitest";

import { reported } from "../fixtures.ts";

describe("domain service rules", () => {
	it("reports mutable fields, setters, state changes and held aggregates", () => {
		const rule = "domain-service/stateless";
		expect(reported("domain/services/stateful.service.ts")).toEqual([
			{ line: 6, message: "LoyaltyService.points is mutable; domain services are stateless.", rule },
			{
				line: 7,
				message: "LoyaltyService.lastCustomer holds Customer; pass it as a parameter, domain services are stateless.",
				rule,
			},
			{ line: 10, message: "LoyaltyService.bonus is mutable; domain services are stateless.", rule },
			{ line: 17, message: "LoyaltyService.rate is a setter; domain services are stateless.", rule },
			{ line: 18, message: "LoyaltyService changes its own state; domain services are stateless.", rule },
			{ line: 22, message: "LoyaltyService changes its own state; domain services are stateless.", rule },
		]);
	});

	it("reports repositories, reads of the clock and methods returning a Promise", () => {
		const repository = "RoutingService depends on ParcelRepository; domain services must not use repositories.";
		expect(reported("domain/services/shared-rules.service.ts")).toEqual([
			{ line: 10, message: repository, rule: "domain-service/no-io" },
			{ line: 12, message: repository, rule: "domain-service/no-io" },
			{
				line: 18,
				message: "RoutingService reads the clock with Date.now(); receive the date as a parameter instead.",
				rule: "domain-service/no-hidden-clock",
			},
			{
				line: 21,
				message: "RoutingService.route returns a Promise; domain services must not perform I/O.",
				rule: "domain-service/no-io",
			},
		]);
	});
});
