import { describe, expect, it } from "vitest";

import { Report } from "./report.ts";

const violation = { file: "src/a.ts", fingerprint: "0a1b2c3d", line: 4, message: "Explained.", rule: "tactical/no-misplaced-class", symbol: "A" } as const;

describe("Report", () => {
	it("lists the violations and sums them up", () => {
		expect(new Report([violation, violation], 0).text()).toBe("src/a.ts:4\n  tactical/no-misplaced-class: Explained.\n\nsrc/a.ts:4\n  tactical/no-misplaced-class: Explained.\n\n2 violations\n");
	});

	it("mentions the baseline", () => {
		expect(new Report([], 3).text()).toBe("No violation (3 in the baseline)\n");
	});
});
