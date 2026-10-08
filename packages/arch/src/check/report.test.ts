import { describe, expect, it } from "vitest";

import { Report } from "./report.ts";
import type { Violation } from "./violation.ts";

const violation: Violation = { file: "src/a.ts", fingerprint: "0a1b2c3d", line: 4, message: "Explained.", rule: "tactical/no-misplaced-class", symbol: "A" };

describe("Report", () => {
	it("groups the violations by file and sums them up", () => {
		const other = { ...violation, file: "src/b.ts", line: 12 };
		const report = new Report({ baselined: 0, stale: 0, suppressed: [], violations: [violation, { ...violation, line: 9 }, other] });

		expect(report.text()).toBe(
			"src/a.ts\n  4  tactical/no-misplaced-class: Explained.\n  9  tactical/no-misplaced-class: Explained.\n\nsrc/b.ts\n  12  tactical/no-misplaced-class: Explained.\n\n3 violations\n",
		);
	});

	it("mentions the baseline, what it covers no more, and the disabled violations", () => {
		const report = new Report({ baselined: 12, stale: 4, suppressed: [{ reason: "legacy", violation }], violations: [] });

		expect(report.text()).toBe("No violation (12 in the baseline, 4 fixed, 1 disabled)\n");
		expect(JSON.parse(report.json())).toEqual({ baselined: 12, stale: 4, suppressed: [{ ...violation, reason: "legacy" }], violations: [] });
	});

	it("writes SARIF with the rules and a fingerprint per result", () => {
		const report = new Report({ baselined: 0, stale: 0, suppressed: [], violations: [violation] });
		const rules = [{ description: "A class in the wrong place.", id: "tactical/no-misplaced-class", messages: {} }];

		expect(JSON.parse(report.sarif(rules))).toEqual({
			$schema: "https://json.schemastore.org/sarif-2.1.0.json",
			runs: [
				{
					results: [
						{
							level: "error",
							locations: [{ physicalLocation: { artifactLocation: { uri: "src/a.ts", uriBaseId: "%SRCROOT%" }, region: { startLine: 4 } } }],
							message: { text: "Explained." },
							partialFingerprints: { "alveolus/v1": "0a1b2c3d" },
							ruleId: "tactical/no-misplaced-class",
						},
					],
					tool: {
						driver: {
							informationUri: "https://alveolus.dev/",
							name: "alveolus",
							rules: [{ helpUri: "https://alveolus.dev/rules/tactical/no-misplaced-class", id: "tactical/no-misplaced-class", shortDescription: { text: "A class in the wrong place." } }],
						},
					},
				},
			],
			version: "2.1.0",
		});
	});
});
