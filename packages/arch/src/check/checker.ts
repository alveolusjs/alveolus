import type { Settings } from "../architecture/index.ts";
import { Architecture } from "../architecture/index.ts";
import { corePackageName } from "../conventions/index.ts";
import type { Importer, ImportScope } from "../importer/index.ts";
import type { Finding, Rule, RuleId } from "../rules/index.ts";
import { DisableDirective, NoLooseDisableRule } from "../rules/index.ts";
import { Fingerprint } from "./fingerprint.ts";
import type { Severity, Violation } from "./violation.ts";

export interface CheckSettings extends ImportScope, Settings {
	severityOf(rule: RuleId): Severity | "off";
}

export interface Suppressed {
	readonly violation: Violation;
	readonly reason: string;
}

export interface CheckOutcome {
	readonly files: number;
	readonly violations: Violation[];
	readonly suppressed: Suppressed[];
}

export class Checker {
	private readonly fingerprint = new Fingerprint();

	public constructor(
		private readonly importer: Importer,
		private readonly rules: readonly Rule<RuleId>[],
	) {}

	public check(settings: CheckSettings): CheckOutcome {
		const project = this.importer.read(settings);
		if (project.files.length === 0) {
			throw new Error(`No file to analyse under ${settings.rootDir}: check root and ignore in alveolus.config.ts, and include in your tsconfig.`);
		}
		if (!this.importer.resolves(corePackageName, settings)) {
			throw new Error(`${corePackageName} cannot be imported from ${settings.rootDir}: install it, or map it in the paths of your tsconfig. Without it, no building block can be recognised.`);
		}
		const architecture = new Architecture(project, settings);
		const outcome: CheckOutcome = { files: project.files.length, suppressed: [], violations: [] };
		const used = new Set<string>();
		for (const rule of this.rules) {
			const severity = settings.severityOf(rule.meta.id);
			if (severity !== "off") {
				this.collect(rule, severity, architecture, outcome, used);
			}
		}
		this.collectUnusedDisables(architecture, settings, outcome, used);
		outcome.violations.sort((left, right) => this.compare(left, right));
		return outcome;
	}

	public run(rule: Rule<RuleId>, architecture: Architecture): Violation[] {
		return rule.check(architecture).map((finding) => this.violationOf(rule, "error", finding, architecture));
	}

	private collect(rule: Rule<RuleId>, severity: Severity, architecture: Architecture, outcome: CheckOutcome, used: Set<string>): void {
		for (const finding of rule.check(architecture)) {
			const violation = this.violationOf(rule, severity, finding, architecture);
			const comment = finding.file.disableAbove(finding.line);
			const directive = comment === undefined ? undefined : new DisableDirective(comment.text);
			if (comment !== undefined && directive?.isComplete === true && directive.rule === rule.meta.id) {
				used.add(`${finding.file.path}:${comment.line}`);
				outcome.suppressed.push({ reason: directive.reason ?? "", violation });
			} else {
				outcome.violations.push(violation);
			}
		}
	}

	private collectUnusedDisables(architecture: Architecture, settings: CheckSettings, outcome: CheckOutcome, used: Set<string>): void {
		const rule = this.rules.find((candidate) => candidate instanceof NoLooseDisableRule);
		if (!(rule instanceof NoLooseDisableRule)) {
			return;
		}
		const severity = settings.severityOf(rule.meta.id);
		if (severity === "off") {
			return;
		}
		for (const file of architecture.files) {
			for (const comment of file.disables) {
				if (new DisableDirective(comment.text).isComplete && !used.has(`${file.path}:${comment.line}`)) {
					outcome.violations.push(this.violationOf(rule, severity, rule.unused(file, comment), architecture));
				}
			}
		}
	}

	private violationOf(rule: Rule<RuleId>, severity: Severity, finding: Finding, architecture: Architecture): Violation {
		return {
			file: architecture.relativePath(finding.file.path),
			fingerprint: this.fingerprint.of(finding.file.lineText(finding.line)),
			line: finding.line,
			message: this.messageOf(rule, finding),
			rule: rule.meta.id,
			severity,
			symbol: finding.symbol,
		};
	}

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
