import { describe, expect, it } from "vitest";

import type { Violation } from "../rules/index.ts";
import { Baseline } from "./baseline.ts";

const throwOnLine3: Violation = { file: "src/order.aggregate.ts", line: 3, message: "", rule: "tactical/no-thrown-failure", symbol: "throw" };
const throwOnLine7: Violation = { ...throwOnLine3, line: 7 };

describe("Baseline", () => {
	it("recognises a known violation even when its line moved", () => {
		expect(Baseline.of([throwOnLine3]).newViolations([throwOnLine7])).toEqual([]);
	});

	it("counts identical violations", () => {
		expect(Baseline.of([throwOnLine3]).newViolations([throwOnLine3, throwOnLine7])).toEqual([throwOnLine7]);
	});
});
