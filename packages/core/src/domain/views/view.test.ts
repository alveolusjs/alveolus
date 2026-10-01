import { describe, expect, it } from "vitest";

import type { View } from "./view.ts";

type ProductDetails = View<{ id: string; name: string }>;

describe("View", () => {
	it("is the shape it wraps", () => {
		const details: ProductDetails = { id: "p1", name: "Honey" };

		expect(details.name).toBe("Honey");
	});

	it("is readonly", () => {
		const details: ProductDetails = { id: "p1", name: "Honey" };
		// @ts-expect-error
		details.name = "Wax";

		expect(details.id).toBe("p1");
	});

	it("wraps an object", () => {
		// @ts-expect-error
		const scalar: View<string> | undefined = undefined;

		expect(scalar).toBeUndefined();
	});
});
