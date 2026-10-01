import { check } from "@alveolus/arch";
import { describe, expect, it } from "vitest";

import { fileURLToPath } from "node:url";

describe("example application", () => {
	it("respects every architecture rule", () => {
		const project = fileURLToPath(new URL("../tsconfig.json", import.meta.url));

		expect(check({ project })).toEqual([]);
	});
});
