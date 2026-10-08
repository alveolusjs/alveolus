import { describe, expect, it } from "vitest";

import { Baseline } from "./baseline.ts";
import type { Violation } from "./violation.ts";

const throwOnLine3: Violation = { file: "src/order.aggregate.ts", fingerprint: "aaaa1111", line: 3, message: "", rule: "tactical/no-thrown-failure", severity: "error", symbol: "throw" };
const throwOnLine7: Violation = { ...throwOnLine3, line: 7 };
const otherThrow: Violation = { ...throwOnLine3, fingerprint: "bbbb2222", line: 12 };

describe("Baseline", () => {
	it("recognises a known violation even when its line moved", () => {
		expect(Baseline.of([throwOnLine3]).newViolations([throwOnLine7])).toEqual([]);
	});

	it("counts identical violations", () => {
		expect(Baseline.of([throwOnLine3]).newViolations([throwOnLine3, throwOnLine7])).toEqual([throwOnLine7]);
	});

	it("catches a new violation that takes the place of a fixed one with the same symbol", () => {
		expect(Baseline.of([throwOnLine3]).newViolations([otherThrow])).toEqual([otherThrow]);
	});

	it("counts the entries that match no violation any more", () => {
		const baseline = Baseline.of([throwOnLine3, otherThrow]);

		expect(baseline.staleEntries([throwOnLine7])).toBe(1);
		expect(baseline.staleEntries([])).toBe(2);
	});
});
