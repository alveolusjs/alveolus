import { describe, expect, it } from "vitest";

import { Report } from "./report.ts";
import type { Violation } from "./violation.ts";

const violation: Violation = { file: "src/a.ts", fingerprint: "0a1b2c3d", line: 4, message: "Explained.", rule: "tactical/no-misplaced-class", severity: "error", symbol: "A" };

describe("Report", () => {
	it("groups the violations by file, with their severity, and counts them by severity", () => {
		const other = { ...violation, file: "src/b.ts", line: 12, severity: "info" as const };
		const report = new Report({ baselined: 0, files: 20, stale: 0, suppressed: [], violations: [violation, { ...violation, line: 9, severity: "warn" }, other] });

		expect(report.text()).toBe(
			"src/a.ts\n  4  error  tactical/no-misplaced-class: Explained.\n  9  warn  tactical/no-misplaced-class: Explained.\n\nsrc/b.ts\n  12  info  tactical/no-misplaced-class: Explained.\n\n1 error, 1 warning, 1 info in 20 files\n\nWhy, and how to fix it: npx alveolus explain <rule>\n",
		);
	});

	it("mentions the files, the baseline, what it covers no more, and the disabled violations", () => {
		const report = new Report({ baselined: 12, files: 1, stale: 4, suppressed: [{ reason: "legacy", violation }], violations: [] });

		expect(report.text()).toBe("No violation in 1 file (12 in the baseline, 4 fixed, 1 disabled)\n");
		expect(JSON.parse(report.json())).toEqual({ baselined: 12, files: 1, stale: 4, suppressed: [{ ...violation, reason: "legacy" }], violations: [] });
	});

	it("writes SARIF with the rules, the level of each result and a fingerprint", () => {
		const report = new Report({ baselined: 0, files: 1, stale: 0, suppressed: [], violations: [{ ...violation, severity: "warn" }] });
		const rules = [{ contexts: "core" as const, description: "A class in the wrong place.", id: "tactical/no-misplaced-class", messages: {} }];

		expect(JSON.parse(report.sarif(rules))).toEqual({
			$schema: "https://json.schemastore.org/sarif-2.1.0.json",
			runs: [
				{
					results: [
						{
							level: "warning",
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
