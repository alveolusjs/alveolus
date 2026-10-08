import type { Codebase, CodeClass, CodeFile, Declaration, DeclarationKind, Layer } from "../../../codebase/index.ts";
import type { RuleId } from "../../../config/index.ts";
import type { Problem } from "../../problem.ts";
import { Rule } from "../../rule.ts";
import type { Violation } from "../../violation.ts";

const guarded: ReadonlySet<Layer | undefined> = new Set<Layer>(["domain", "application"]);

const blocksOf: Readonly<Record<string, string>> = {
	application: "CommandHandler, QueryHandler or EventTranslator",
	domain: "AggregateRoot, Entity, ValueObject, Identifier, DomainEvent, DomainError, DomainService or a Port",
};

const intoMethods = "make it a method of a value object or of a DomainService";

const declarationMessages: Readonly<Record<DeclarationKind, (name: string) => string>> = {
	"class expression": (name) => `${name} is a class expression: declare it as a class that extends a building block.`,
	"computed constant": (name) => `The constant ${name} is computed when the module loads: keep top-level constants to plain data.`,
	enum: (name) => `The enum ${name} has no place here: use a union of literal types, or a ValueObject when it has behaviour.`,
	function: (name) => `The function ${name} floats outside any class: ${intoMethods}.`,
	"mutable variable": (name) => `${name} is module state: keep state in aggregates, not in modules.`,
	namespace: (name) => `The namespace ${name} groups loose code: ${intoMethods}.`,
	statement: () => "A statement runs when the module loads: move it into a method.",
};

export class NoLooseCodeRule extends Rule {
	public readonly id: RuleId = "tactical/no-loose-code";

	public check(codebase: Codebase): Violation[] {
		const violations: Violation[] = [];
		for (const file of codebase.files) {
			for (const problem of this.problemsIn(file)) {
				violations.push(this.violation(codebase, file, problem));
			}
		}
		return violations;
	}

	private problemsIn(file: CodeFile): Problem[] {
		if (guarded.has(file.location.layer)) {
			return [...this.looseClasses(file), ...file.declarations.map((declaration) => this.problemOf(declaration))];
		}
		if (file.location.isCompositionRoot && file.location.isInBoundedContext) {
			return file.declarations.map((declaration) => this.compositionRootProblem(declaration));
		}
		return [];
	}

	/** The composition root holds its module class: the declarations around it are reported, whatever they are. */
	private compositionRootProblem(declaration: Declaration): Problem {
		const message = `The ${declaration.kind} ${declaration.name} has no place in a composition root: it holds its module class only.`;
		if (declaration.kind === "statement") {
			return { line: declaration.line, message: "A statement runs when the module loads: the composition root holds its module class only.", symbol: declaration.name };
		}
		return { line: declaration.line, message, symbol: declaration.name };
	}

	private looseClasses(file: CodeFile): Problem[] {
		const problems: Problem[] = [];
		for (const codeClass of file.classes) {
			const message = this.classMessage(codeClass, file);
			if (message !== undefined) {
				problems.push({ line: codeClass.line, message, symbol: codeClass.name });
			}
		}
		return problems;
	}

	private classMessage(codeClass: CodeClass, file: CodeFile): string | undefined {
		if (!codeClass.extendsByName) {
			return `${codeClass.name} extends an expression: extend a class by its name, so that what it is stays readable.`;
		}
		if (!codeClass.extendsBuildingBlock) {
			return `${codeClass.name} extends no building block: extend ${blocksOf[file.location.layer ?? ""]}.`;
		}
		if (codeClass.isStaticOnly) {
			return `${codeClass.name} only has static members: a class of functions is no building block; make them methods of the value object they work on, or of a DomainService.`;
		}
		return undefined;
	}

	private problemOf(declaration: Declaration): Problem {
		return { line: declaration.line, message: declarationMessages[declaration.kind](declaration.name), symbol: declaration.name };
	}
}
