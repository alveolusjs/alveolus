import { describe, expect, it } from "vitest";

import { InvalidWeight, ShippingCost } from "../../../test/fixtures/domain-service.ts";
import { err, ok } from "../../utilities/result/index.ts";
import { DomainService } from "./domain-service.ts";

describe("DomainService", () => {
	it("marks a class as a domain service", () => {
		const shipping = new ShippingCost(5);

		expect(shipping).toBeInstanceOf(DomainService);
		expect(shipping.costOf(3)).toEqual(ok(10));
		expect(shipping.costOf(0)).toEqual(err(new InvalidWeight({ weight: 0 })));
	});

	it("cannot be instantiated on its own", () => {
		// @ts-expect-error
		expect(new DomainService()).toBeInstanceOf(DomainService);
	});
});
