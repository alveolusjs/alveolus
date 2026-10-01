import { describe, expect, it } from "vitest";

import { CustomerId, OrderId } from "../../../test/fixtures/identifier.ts";

describe("Identifier", () => {
	it("is equal to an identifier of the same class and value", () => {
		expect(new OrderId("o1").equals(new OrderId("o1"))).toBe(true);
	});

	it("is not equal to an identifier with another value", () => {
		expect(new OrderId("o1").equals(new OrderId("o2"))).toBe(false);
	});

	it("is not equal to an identifier of another class with the same value", () => {
		expect(new OrderId("o1").equals(new CustomerId("o1"))).toBe(false);
	});

	it("serializes to its raw value", () => {
		expect(String(new OrderId("o1"))).toBe("o1");
		expect(JSON.stringify({ id: new OrderId("o1") })).toBe('{"id":"o1"}');
	});

	it("is nominal at compile time", () => {
		const load = (id: OrderId): OrderId => id;
		// @ts-expect-error
		load(new CustomerId("c1"));
	});
});
