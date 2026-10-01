import type { Codebase, CodeFile, Import } from "../codebase/index.ts";
import { Rule } from "./rule.ts";
import type { Violation } from "./violation.ts";

export abstract class ImportRule extends Rule {
	public check(codebase: Codebase): Violation[] {
		const violations: Violation[] = [];
		for (const file of codebase.files) {
			if (!this.appliesTo(file)) {
				continue;
			}
			for (const imported of file.imports) {
				const message = this.problemWith(imported, file, codebase);
				if (message !== undefined) {
					violations.push(this.violation(codebase, file, { line: imported.line, message, symbol: imported.label }));
				}
			}
		}
		return violations;
	}

	protected describeTarget(imported: Import, codebase: Codebase): string {
		if (imported.target.kind === "package") {
			return imported.target.name;
		}
		return `${codebase.relativePath(imported.target.path)} (${imported.target.location.describe()})`;
	}

	protected abstract appliesTo(file: CodeFile): boolean;

	protected abstract problemWith(imported: Import, file: CodeFile, codebase: Codebase): string | undefined;
}
