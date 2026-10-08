import type { Settings } from "../architecture/index.ts";
import { Architecture } from "../architecture/index.ts";
import type { Importer, ImportScope } from "../importer/index.ts";
import type { Finding, Rule, RuleId } from "../rules/index.ts";
import { Fingerprint } from "./fingerprint.ts";
import type { Violation } from "./violation.ts";

/** Everything a check needs to know about the project: what to read, its architecture, and the rules it turns off. */
export interface CheckSettings extends ImportScope, Settings {
	isEnabled(rule: RuleId): boolean;
}

/** Reads the project, runs the enabled rules, and turns what they find into violations sorted by file and line. */
export class Checker {
	private readonly fingerprint = new Fingerprint();

	public constructor(
		private readonly importer: Importer,
		private readonly rules: readonly Rule<RuleId>[],
	) {}

	public check(settings: CheckSettings): Violation[] {
		const architecture = new Architecture(this.importer.read(settings), settings);
		const violations: Violation[] = [];
		for (const rule of this.rules) {
			if (settings.isEnabled(rule.meta.id)) {
				violations.push(...this.run(rule, architecture));
			}
		}
		return violations.sort((left, right) => this.compare(left, right));
	}

	/** The violations of one rule, in the order the rule found them. */
	public run(rule: Rule<RuleId>, architecture: Architecture): Violation[] {
		return rule.check(architecture).map((finding) => this.violationOf(rule, finding, architecture));
	}

	private violationOf(rule: Rule<RuleId>, finding: Finding, architecture: Architecture): Violation {
		return {
			file: architecture.relativePath(finding.file.path),
			fingerprint: this.fingerprint.of(finding.file.lineText(finding.line)),
			line: finding.line,
			message: this.messageOf(rule, finding),
			rule: rule.meta.id,
			symbol: finding.symbol,
		};
	}

	/** The rule's message for the finding, each `{placeholder}` filled from its data; a placeholder left unfilled is a bug of the rule. */
	private messageOf(rule: Rule<RuleId>, finding: Finding): string {
		const template = rule.meta.messages[finding.messageId];
		if (template === undefined) {
			throw new Error(`${rule.meta.id} has no message "${finding.messageId}".`);
		}
		return template.replace(/\{(\w+)\}/g, (placeholder, key: string) => this.fill(rule, finding, key, placeholder));
	}

	private fill(rule: Rule<RuleId>, finding: Finding, key: string, placeholder: string): string {
		const value = finding.data[key];
		if (value === undefined) {
			throw new Error(`${rule.meta.id}: the message "${finding.messageId}" needs ${placeholder}, which the finding does not give.`);
		}
		return String(value);
	}

	private compare(left: Violation, right: Violation): number {
		return left.file.localeCompare(right.file) || left.line - right.line || left.rule.localeCompare(right.rule);
	}
}
