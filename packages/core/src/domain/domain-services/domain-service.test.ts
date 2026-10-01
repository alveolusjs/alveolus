import { describe, expect, it } from "vitest";

import { DomainService } from "./domain-service.ts";

class ShippingCostCalculator extends DomainService {
	public costOf(weight: number): number {
		return weight > 2 ? 9 : 5;
	}
}

describe("DomainService", () => {
	it("marks a class as a domain service", () => {
		const calculator = new ShippingCostCalculator();

		expect(calculator).toBeInstanceOf(DomainService);
		expect(calculator.costOf(3)).toBe(9);
	});

	it("cannot be instantiated on its own", () => {
		// @ts-expect-error
		expect(new DomainService()).toBeInstanceOf(DomainService);
	});
});
