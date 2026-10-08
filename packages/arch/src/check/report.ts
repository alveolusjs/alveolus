import picocolors from "picocolors";

import type { RuleMeta } from "../rules/index.ts";
import type { Suppressed } from "./checker.ts";
import type { Violation } from "./violation.ts";

export interface ReportInput {
	/** The violations to report: those the baseline does not cover. */
	readonly violations: readonly Violation[];
	readonly suppressed: readonly Suppressed[];
	/** How many current violations the baseline covers. */
	readonly baselined: number;
	/** How many entries of the baseline match nothing any more. */
	readonly stale: number;
}

const docsUrl = "https://alveolus.dev/";

/** The violations as the CLI prints them: text grouped by file, JSON for tools, SARIF for code scanning. */
export class Report {
	private readonly colors: ReturnType<typeof picocolors.createColors>;

	public constructor(
		private readonly input: ReportInput,
		colored = false,
	) {
		this.colors = picocolors.createColors(colored);
	}

	public text(): string {
		const blocks: string[] = [];
		for (const [file, violations] of this.byFile()) {
			blocks.push(this.block(file, violations));
		}
		return `${[...blocks, this.summary()].join("\n\n")}\n`;
	}

	public json(): string {
		const { baselined, stale, suppressed, violations } = this.input;
		const disabled = suppressed.map(({ reason, violation }) => ({ ...violation, reason }));
		return `${JSON.stringify({ baselined, stale, suppressed: disabled, violations }, null, "\t")}\n`;
	}

	/** SARIF 2.1.0, as GitHub code scanning and the other analysers read it; the fingerprint lets them track a result across commits. */
	public sarif(rules: readonly RuleMeta<string, string>[]): string {
		const driver = {
			informationUri: docsUrl,
			name: "alveolus",
			rules: rules.map((rule) => ({ helpUri: `${docsUrl}rules/${rule.id}`, id: rule.id, shortDescription: { text: rule.description } })),
		};
		const results = this.input.violations.map((violation) => ({
			level: "error",
			locations: [{ physicalLocation: { artifactLocation: { uri: violation.file, uriBaseId: "%SRCROOT%" }, region: { startLine: violation.line } } }],
			message: { text: violation.message },
			partialFingerprints: { "alveolus/v1": violation.fingerprint },
			ruleId: violation.rule,
		}));
		const log = { $schema: "https://json.schemastore.org/sarif-2.1.0.json", runs: [{ results, tool: { driver } }], version: "2.1.0" };
		return `${JSON.stringify(log, null, "\t")}\n`;
	}

	/** The violations of each file, in the order they come: the checker sorts them by file and line already. */
	private byFile(): Map<string, Violation[]> {
		const byFile = new Map<string, Violation[]>();
		for (const violation of this.input.violations) {
			byFile.set(violation.file, [...(byFile.get(violation.file) ?? []), violation]);
		}
		return byFile;
	}

	private block(file: string, violations: readonly Violation[]): string {
		const { bold, red } = this.colors;
		const lines = violations.map((violation) => `  ${violation.line}  ${red(violation.rule)}: ${violation.message}`);
		return [bold(file), ...lines].join("\n");
	}

	/** `3 violations (12 in the baseline, 4 fixed, 2 disabled)`, each part only when it counts. */
	private summary(): string {
		const { dim, green, red } = this.colors;
		const count = this.input.violations.length;
		const head = count === 0 ? green("No violation") : red(`${count} violation${count === 1 ? "" : "s"}`);
		const parts: string[] = [];
		if (this.input.baselined > 0) {
			parts.push(`${this.input.baselined} in the baseline`);
		}
		if (this.input.stale > 0) {
			parts.push(`${this.input.stale} fixed`);
		}
		if (this.input.suppressed.length > 0) {
			parts.push(`${this.input.suppressed.length} disabled`);
		}
		return parts.length === 0 ? head : `${head}${dim(` (${parts.join(", ")})`)}`;
	}
}
