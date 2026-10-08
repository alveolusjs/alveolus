import type { Architecture } from "../../../architecture/index.ts";
import type { Layer } from "../../../conventions/index.ts";
import type { ClassDeclaration, SourceFile, StatementKind, TopLevelStatement } from "../../../model/index.ts";
import type { Finding, RuleMeta } from "../../framework/index.ts";
import { Rule } from "../../framework/index.ts";

type MessageId =
	| "extendsExpression"
	| "plainClass"
	| "staticOnly"
	| "classExpression"
	| "computedConstant"
	| "enum"
	| "function"
	| "mutableVariable"
	| "namespace"
	| "statement"
	| "compositionRootDeclaration"
	| "compositionRootStatement"
	| "adapterDeclaration"
	| "adapterStatement";

const guarded: ReadonlySet<Layer | undefined> = new Set<Layer>(["domain", "application"]);

const adapters: ReadonlySet<Layer | undefined> = new Set<Layer>(["driven", "driving"]);

const expectedBlocks: Readonly<Record<string, string>> = {
	application: "CommandHandler, QueryHandler or EventTranslator",
	domain: "AggregateRoot, Entity, ValueObject, Identifier, DomainEvent, DomainError, DomainService or a Port",
};

const statementMessages: Readonly<Record<StatementKind, MessageId>> = {
	"class expression": "classExpression",
	"computed constant": "computedConstant",
	enum: "enum",
	function: "function",
	"mutable variable": "mutableVariable",
	namespace: "namespace",
	statement: "statement",
};

export class NoLooseCodeRule extends Rule<"tactical/no-loose-code", MessageId> {
	public readonly meta: RuleMeta<"tactical/no-loose-code", MessageId> = {
		description: "Code outside a building block in the domain or the application, outside a class in an adapter layer, anything but the module class in a composition root.",
		id: "tactical/no-loose-code",
		messages: {
			adapterDeclaration: "The {kind} {name} has no place in an adapter layer: adapters are classes; make it a method of the adapter, or a mapper class of its own.",
			adapterStatement: "A statement runs when the module loads: an adapter layer holds classes, which the composition root wires.",
			classExpression: "{name} is a class expression: declare it as a class that extends a building block.",
			compositionRootDeclaration: "The {kind} {name} has no place in a composition root: it holds its module class only.",
			compositionRootStatement: "A statement runs when the module loads: the composition root holds its module class only.",
			computedConstant: "The constant {name} is computed when the module loads: keep top-level constants to plain data.",
			enum: "The enum {name} has no place here: use a union of literal types, or a ValueObject when it has behaviour.",
			extendsExpression: "{name} extends an expression: extend a class by its name, so that what it is stays readable.",
			function: "The function {name} floats outside any class: make it a method of a value object or of a DomainService.",
			mutableVariable: "{name} is module state: keep state in aggregates, not in modules.",
			namespace: "The namespace {name} groups loose code: make it a method of a value object or of a DomainService.",
			plainClass: "{name} extends no building block: extend {blocks}.",
			statement: "A statement runs when the module loads: move it into a method.",
			staticOnly: "{name} only has static members: a class of functions is no building block; make them methods of the value object they work on, or of a DomainService.",
		},
	};

	public check(architecture: Architecture): Finding<MessageId>[] {
		const findings: Finding<MessageId>[] = [];
		for (const file of architecture.files) {
			const location = architecture.locationOf(file);
			if (guarded.has(location.layer)) {
				findings.push(...this.looseClasses(file, location.layer ?? "domain", architecture));
				findings.push(...this.looseStatements(file));
			} else if (location.isCompositionRoot && location.isInBoundedContext) {
				findings.push(...this.compositionRootStatements(file));
			} else if (adapters.has(location.layer)) {
				findings.push(...this.adapterStatements(file));
			}
		}
		return findings;
	}

	private looseClasses(file: SourceFile, layer: Layer, architecture: Architecture): Finding<MessageId>[] {
		const findings: Finding<MessageId>[] = [];
		for (const codeClass of file.classes) {
			const messageId = this.classMessage(codeClass, architecture);
			if (messageId !== undefined) {
				findings.push(this.finding(file, codeClass.line, codeClass.name, messageId, { blocks: expectedBlocks[layer] ?? "", name: codeClass.name }));
			}
		}
		return findings;
	}

	private classMessage(codeClass: ClassDeclaration, architecture: Architecture): MessageId | undefined {
		if (!codeClass.extendsByName) {
			return "extendsExpression";
		}
		if (!architecture.isBuildingBlock(codeClass)) {
			return "plainClass";
		}
		return codeClass.isStaticOnly ? "staticOnly" : undefined;
	}

	private looseStatements(file: SourceFile): Finding<MessageId>[] {
		return file.statements.map((statement) => this.statementFinding(file, statement, statementMessages[statement.kind]));
	}

	private compositionRootStatements(file: SourceFile): Finding<MessageId>[] {
		return file.statements.map((statement) => this.statementFinding(file, statement, statement.kind === "statement" ? "compositionRootStatement" : "compositionRootDeclaration"));
	}

	private adapterStatements(file: SourceFile): Finding<MessageId>[] {
		return file.statements.map((statement) => this.statementFinding(file, statement, statement.kind === "statement" ? "adapterStatement" : "adapterDeclaration"));
	}

	private statementFinding(file: SourceFile, statement: TopLevelStatement, messageId: MessageId): Finding<MessageId> {
		return this.finding(file, statement.line, statement.name, messageId, { kind: statement.kind, name: statement.name });
	}
}
