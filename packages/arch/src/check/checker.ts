import type { Settings } from "../architecture/index.ts";
import { Architecture } from "../architecture/index.ts";
import { corePackageName } from "../conventions/index.ts";
import type { Importer, ImportScope } from "../importer/index.ts";
import type { Finding, Rule, RuleId } from "../rules/index.ts";
import { DisableDirective, NoLooseDisableRule } from "../rules/index.ts";
import { Fingerprint } from "./fingerprint.ts";
import type { Violation } from "./violation.ts";

/** Everything a check needs to know about the project: what to read, its architecture, and the rules it turns off. */
export interface CheckSettings extends ImportScope, Settings {
	isEnabled(rule: RuleId): boolean;
}

/** A violation a disable comment turns off, and the reason the comment gives. */
export interface Suppressed {
	readonly violation: Violation;
	readonly reason: string;
}

export interface CheckOutcome {
	/** Sorted by file and line. */
	readonly violations: Violation[];
	readonly suppressed: Suppressed[];
}

/** Reads the project, runs the enabled rules, applies the disable comments, and turns what the rules find into violations. */
export class Checker {
	private readonly fingerprint = new Fingerprint();

	public constructor(
		private readonly importer: Importer,
		private readonly rules: readonly Rule<RuleId>[],
	) {}

	public check(settings: CheckSettings): CheckOutcome {
		if (!this.importer.resolves(corePackageName, settings)) {
			throw new Error(`${corePackageName} cannot be imported from ${settings.rootDir}: install it, or map it in the paths of your tsconfig. Without it, no building block can be recognised.`);
		}
		const architecture = new Architecture(this.importer.read(settings), settings);
		const outcome: CheckOutcome = { suppressed: [], violations: [] };
		const used = new Set<string>();
		for (const rule of this.rules) {
			if (settings.isEnabled(rule.meta.id)) {
				this.collect(rule, architecture, outcome, used);
			}
		}
		this.collectUnusedDisables(architecture, settings, outcome, used);
		outcome.violations.sort((left, right) => this.compare(left, right));
		return outcome;
	}

	/** The violations of one rule, in the order the rule found them, disable comments aside. */
	public run(rule: Rule<RuleId>, architecture: Architecture): Violation[] {
		return rule.check(architecture).map((finding) => this.violationOf(rule, finding, architecture));
	}

	/** Each finding becomes a violation, unless the line above it carries a complete disable comment naming the rule. */
	private collect(rule: Rule<RuleId>, architecture: Architecture, outcome: CheckOutcome, used: Set<string>): void {
		for (const finding of rule.check(architecture)) {
			const violation = this.violationOf(rule, finding, architecture);
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

	/** A complete disable comment that turned nothing off is reported, so that none outlives its violation. */
	private collectUnusedDisables(architecture: Architecture, settings: CheckSettings, outcome: CheckOutcome, used: Set<string>): void {
		const rule = this.rules.find((candidate) => candidate instanceof NoLooseDisableRule);
		if (!(rule instanceof NoLooseDisableRule) || !settings.isEnabled(rule.meta.id)) {
			return;
		}
		for (const file of architecture.files) {
			for (const comment of file.disables) {
				if (new DisableDirective(comment.text).isComplete && !used.has(`${file.path}:${comment.line}`)) {
					outcome.violations.push(this.violationOf(rule, rule.unused(file, comment), architecture));
				}
			}
		}
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
