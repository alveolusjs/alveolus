import { describe, expect, it } from "vitest";

import { InvalidTotal, OrderAlreadyPlaced } from "../../../test/fixtures/domain-error.ts";

describe("DomainError", () => {
	it("uses the class name as its type", () => {
		expect(new InvalidTotal({ total: 0 }).type).toBe("InvalidTotal");
	});

	it("carries its payload", () => {
		expect(new InvalidTotal({ total: 0 }).payload).toEqual({ total: 0 });
	});

	it("has no payload when declared without one", () => {
		expect(new OrderAlreadyPlaced().payload).toBeUndefined();
	});

	it("is a value, not a thrown Error", () => {
		expect(new OrderAlreadyPlaced()).not.toBeInstanceOf(Error);
	});

	it("requires a payload only when one is declared", () => {
		// @ts-expect-error
		new InvalidTotal();
		// @ts-expect-error
		new OrderAlreadyPlaced({ total: 0 });
	});
});
