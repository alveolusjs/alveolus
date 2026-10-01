import type { CodeAnalyzer } from "../analysis/index.ts";
import type { Config } from "../config/index.ts";
import type { Rule, Violation } from "../rules/index.ts";

export class ArchChecker {
	public constructor(
		private readonly analyzer: CodeAnalyzer,
		private readonly rules: readonly Rule[],
	) {}

	public check(config: Config): Violation[] {
		const codebase = this.analyzer.analyze(config);
		const enabled = this.rules.filter((rule) => config.isEnabled(rule.id));
		return enabled.flatMap((rule) => rule.check(codebase)).sort((left, right) => this.compare(left, right));
	}

	private compare(left: Violation, right: Violation): number {
		return left.file.localeCompare(right.file) || left.line - right.line || left.rule.localeCompare(right.rule);
	}
}
