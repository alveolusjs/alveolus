import picocolors from "picocolors";

import type { RuleMeta } from "../rules/index.ts";
import type { Suppressed } from "./checker.ts";
import type { Severity, Violation } from "./violation.ts";

export interface ReportInput {
	readonly files: number;
	readonly violations: readonly Violation[];
	readonly suppressed: readonly Suppressed[];
	readonly baselined: number;
	readonly stale: number;
}

const docsUrl = "https://alveolus.dev/";

const sarifLevels: Readonly<Record<Severity, string>> = { error: "error", info: "note", warn: "warning" };

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
		const parts = [...blocks, this.summary()];
		if (blocks.length > 0) {
			parts.push(this.colors.dim("Why, and how to fix it: npx alveolus explain <rule>"));
		}
		return `${parts.join("\n\n")}\n`;
	}

	public json(): string {
		const { baselined, files, stale, suppressed, violations } = this.input;
		const disabled = suppressed.map(({ reason, violation }) => ({ ...violation, reason }));
		return `${JSON.stringify({ baselined, files, stale, suppressed: disabled, violations }, null, "\t")}\n`;
	}

	public sarif(rules: readonly RuleMeta<string, string>[]): string {
		const driver = {
			informationUri: docsUrl,
			name: "alveolus",
			rules: rules.map((rule) => ({ helpUri: `${docsUrl}rules/${rule.id}`, id: rule.id, shortDescription: { text: rule.description } })),
		};
		const results = this.input.violations.map((violation) => ({
			level: sarifLevels[violation.severity],
			locations: [{ physicalLocation: { artifactLocation: { uri: violation.file, uriBaseId: "%SRCROOT%" }, region: { startLine: violation.line } } }],
			message: { text: violation.message },
			partialFingerprints: { "alveolus/v1": violation.fingerprint },
			ruleId: violation.rule,
		}));
		const log = { $schema: "https://json.schemastore.org/sarif-2.1.0.json", runs: [{ results, tool: { driver } }], version: "2.1.0" };
		return `${JSON.stringify(log, null, "\t")}\n`;
	}

	private byFile(): Map<string, Violation[]> {
		const byFile = new Map<string, Violation[]>();
		for (const violation of this.input.violations) {
			byFile.set(violation.file, [...(byFile.get(violation.file) ?? []), violation]);
		}
		return byFile;
	}

	private block(file: string, violations: readonly Violation[]): string {
		const lines = violations.map((violation) => `  ${violation.line}  ${this.severity(violation.severity)}  ${violation.rule}: ${violation.message}`);
		return [this.colors.bold(file), ...lines].join("\n");
	}

	private severity(severity: Severity): string {
		const { dim, red, yellow } = this.colors;
		if (severity === "error") {
			return red("error");
		}
		if (severity === "warn") {
			return yellow("warn");
		}
		return dim("info");
	}

	private summary(): string {
		const { dim, green } = this.colors;
		const counted = this.counts();
		const head = counted.length === 0 ? green("No violation") : counted.join(", ");
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
		const where = ` in ${this.input.files} file${this.input.files === 1 ? "" : "s"}`;
		return parts.length === 0 ? `${head}${where}` : `${head}${where}${dim(` (${parts.join(", ")})`)}`;
	}

	private counts(): string[] {
		const { dim, red, yellow } = this.colors;
		const errors = this.input.violations.filter((violation) => violation.severity === "error").length;
		const warnings = this.input.violations.filter((violation) => violation.severity === "warn").length;
		const infos = this.input.violations.filter((violation) => violation.severity === "info").length;
		const counted: string[] = [];
		if (errors > 0) {
			counted.push(red(`${errors} error${errors === 1 ? "" : "s"}`));
		}
		if (warnings > 0) {
			counted.push(yellow(`${warnings} warning${warnings === 1 ? "" : "s"}`));
		}
		if (infos > 0) {
			counted.push(dim(`${infos} info${infos === 1 ? "" : "s"}`));
		}
		return counted;
	}
}
