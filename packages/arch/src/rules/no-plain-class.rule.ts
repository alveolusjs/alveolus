import type { Codebase, CodeFile, Layer } from "../codebase/index.ts";
import type { RuleId } from "../config/index.ts";
import type { Problem } from "./problem.ts";
import { Rule } from "./rule.ts";
import type { Violation } from "./violation.ts";

const guarded: ReadonlySet<Layer | undefined> = new Set<Layer>(["domain", "application"]);

const blocksOf: Readonly<Record<string, string>> = {
	application: "CommandHandler, QueryHandler or EventTranslator",
	domain: "AggregateRoot, Entity, ValueObject, Identifier, DomainEvent, DomainError, DomainService or a Port",
};

export class NoPlainClassRule extends Rule {
	public readonly id: RuleId = "tactical/no-plain-class";

	public check(codebase: Codebase): Violation[] {
		const violations: Violation[] = [];
		for (const file of codebase.files) {
			if (!guarded.has(file.location.layer)) {
				continue;
			}
			for (const problem of [...this.plainClasses(file), ...this.freeDeclarations(file)]) {
				violations.push(this.violation(codebase, file, problem));
			}
		}
		return violations;
	}

	private plainClasses(file: CodeFile): Problem[] {
		const blocks = blocksOf[file.location.layer ?? ""];
		return file.classes
			.filter((codeClass) => !codeClass.extendsBuildingBlock)
			.map((codeClass) => ({ line: codeClass.line, message: `${codeClass.name} extends no building block: extend ${blocks}.`, symbol: codeClass.name }));
	}

	private freeDeclarations(file: CodeFile): Problem[] {
		return file.declarations.map((declaration) => {
			if (declaration.kind === "enum") {
				return { line: declaration.line, message: `The enum ${declaration.name} has no place here: use a union of literal types, or a ValueObject when it has behaviour.`, symbol: declaration.name };
			}
			return { line: declaration.line, message: `The function ${declaration.name} floats outside any class: make it a method of a value object or of a DomainService.`, symbol: declaration.name };
		});
	}
}
