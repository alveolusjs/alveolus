import { describe, expect, it } from "vitest";

import type { Booking } from "../../../test/fixtures/policy.ts";
import { BooleanPolicy, OverbookingPolicy, UnlimitedPolicy, VoyageOverbooked } from "../../../test/fixtures/policy.ts";
import { err, ok } from "../../utilities/result/index.ts";
import { Policy } from "./policy.ts";

describe("Policy", () => {
	it("returns ok when the rule holds", () => {
		expect(new OverbookingPolicy(100).check({ booked: 100, size: 10 })).toEqual(ok());
	});

	it("returns the domain error when the rule does not hold", () => {
		expect(new OverbookingPolicy(100).check({ booked: 100, size: 11 })).toEqual(
			err(new VoyageOverbooked({ capacity: 100 })),
		);
	});

	it("can be replaced by another policy of the same type", () => {
		const unlimited: Policy<Booking, VoyageOverbooked> = new UnlimitedPolicy();

		expect(unlimited.check({ booked: 1000, size: 1 }).ok).toBe(true);
	});

	it("must return a Result with a domain error", () => {
		const notADomainError: Policy<Booking, VoyageOverbooked> | undefined = undefined;
		// @ts-expect-error
		const withError: Policy<Booking, Error> | undefined = notADomainError;

		expect(new BooleanPolicy()).toBeInstanceOf(Policy);
		expect(withError).toBeUndefined();
	});
});
