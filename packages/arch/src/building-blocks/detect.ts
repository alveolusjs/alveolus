import { Node, SyntaxKind } from "ts-morph";
import type {
	ClassDeclaration,
	ExpressionWithTypeArguments,
	InterfaceDeclaration,
	Symbol as MorphSymbol,
	Type,
	TypeAliasDeclaration,
	TypeNode,
} from "ts-morph";

import type { CheckContext } from "./context.ts";
import { packageNameOf } from "./context.ts";

export type BuildingBlockKind =
	| "aggregate"
	| "entity"
	| "value-object"
	| "identifier"
	| "domain-event"
	| "domain-error"
	| "domain-service"
	| "policy";

export interface BuildingBlocks {
	readonly all: readonly ClassDeclaration[];
	readonly aggregates: readonly ClassDeclaration[];
	readonly entities: readonly ClassDeclaration[];
	readonly valueObjects: readonly ClassDeclaration[];
	readonly domainEvents: readonly ClassDeclaration[];
	readonly domainServices: readonly ClassDeclaration[];
	readonly policies: readonly ClassDeclaration[];
}

function isFromCore(node: Node): boolean {
	return packageNameOf(node.getSourceFile().getFilePath()) === "@alveolus/core";
}

export function isCoreClass(declaration: ClassDeclaration, name: string): boolean {
	return declaration.getName() === name && isFromCore(declaration);
}

export function coreAbstractMethodNames(declaration: ClassDeclaration): string[] {
	const names: string[] = [];
	for (let base = declaration.getBaseClass(); base !== undefined; base = base.getBaseClass()) {
		if (isFromCore(base)) {
			names.push(
				...base
					.getMethods()
					.filter((method) => method.isAbstract())
					.map((method) => method.getName()),
			);
		}
	}
	return names;
}

export function extendsCoreClass(declaration: ClassDeclaration, name: string): boolean {
	for (let base = declaration.getBaseClass(); base !== undefined; base = base.getBaseClass()) {
		if (isCoreClass(base, name)) {
			return true;
		}
	}
	return false;
}

const kindsByBaseClass: readonly (readonly [string, BuildingBlockKind])[] = [
	["AggregateRoot", "aggregate"],
	["Entity", "entity"],
	["ValueObject", "value-object"],
	["Identifier", "identifier"],
	["DomainEvent", "domain-event"],
	["DomainError", "domain-error"],
	["DomainService", "domain-service"],
	["Policy", "policy"],
];

export function kindOf(declaration: ClassDeclaration): BuildingBlockKind | undefined {
	return kindsByBaseClass.find(([baseClass]) => extendsCoreClass(declaration, baseClass))?.[1];
}

export function findBuildingBlocks(context: CheckContext): BuildingBlocks {
	const classes = context.sourceFiles.flatMap((file) => file.getClasses());
	return {
		aggregates: classes.filter((declaration) => kindOf(declaration) === "aggregate"),
		all: classes.filter((declaration) => kindOf(declaration) !== undefined),
		domainEvents: classes.filter((declaration) => kindOf(declaration) === "domain-event"),
		domainServices: classes.filter((declaration) => kindOf(declaration) === "domain-service"),
		entities: classes.filter((declaration) => kindOf(declaration) === "entity"),
		policies: classes.filter((declaration) => kindOf(declaration) === "policy"),
		valueObjects: classes.filter((declaration) => kindOf(declaration) === "value-object"),
	};
}

export interface Repositories {
	readonly ports: readonly InterfaceDeclaration[];
	readonly adapters: readonly ClassDeclaration[];
}

export type NamedType = InterfaceDeclaration | TypeAliasDeclaration;

function coreInterfaceOf(declaration: InterfaceDeclaration, name: string): InterfaceDeclaration | undefined {
	if (declaration.getName() === name && isFromCore(declaration)) {
		return declaration;
	}
	for (const base of declaration.getBaseDeclarations()) {
		const found = Node.isInterfaceDeclaration(base) ? coreInterfaceOf(base, name) : undefined;
		if (found !== undefined) {
			return found;
		}
	}
	return undefined;
}

function implementedCoreInterface(declaration: ClassDeclaration, name: string): InterfaceDeclaration | undefined {
	for (
		let current: ClassDeclaration | undefined = declaration;
		current !== undefined;
		current = current.getBaseClass()
	) {
		for (const implemented of current
			.getImplements()
			.flatMap((clause) => clause.getType().getSymbol()?.getDeclarations() ?? [])) {
			const found = Node.isInterfaceDeclaration(implemented) ? coreInterfaceOf(implemented, name) : undefined;
			if (found !== undefined) {
				return found;
			}
		}
	}
	return undefined;
}

export interface Handlers {
	readonly commands: readonly ClassDeclaration[];
	readonly queries: readonly ClassDeclaration[];
}

export function findHandlers(context: CheckContext): Handlers {
	const classes = context.sourceFiles.flatMap((file) => file.getClasses());
	return {
		commands: classes.filter((declaration) => implementedCoreInterface(declaration, "CommandHandler") !== undefined),
		queries: classes.filter((declaration) => implementedCoreInterface(declaration, "QueryHandler") !== undefined),
	};
}

export function findPortsOf(context: CheckContext, name: string): Repositories {
	return {
		adapters: context.sourceFiles
			.flatMap((file) => file.getClasses())
			.filter((declaration) => implementedCoreInterface(declaration, name) !== undefined),
		ports: context.sourceFiles
			.flatMap((file) => file.getInterfaces())
			.filter((declaration) => coreInterfaceOf(declaration, name) !== undefined),
	};
}

export function findRepositories(context: CheckContext): Repositories {
	return findPortsOf(context, "Repository");
}

function isCoreDeclarationNamed(type: Type, name: string): boolean {
	return (type.getSymbol()?.getDeclarations() ?? []).some(
		(declaration) =>
			(Node.isInterfaceDeclaration(declaration) || Node.isClassDeclaration(declaration)) &&
			declaration.getName() === name &&
			isFromCore(declaration),
	);
}

function namedTypesOf(typeNode: TypeNode | undefined, context: CheckContext): NamedType[] {
	if (typeNode === undefined) {
		return [];
	}
	const type = typeNode.getType();
	const symbol = type.getAliasSymbol() ?? type.getSymbol();
	return (symbol?.getDeclarations() ?? []).filter(
		(declaration): declaration is NamedType =>
			(Node.isTypeAliasDeclaration(declaration) || Node.isInterfaceDeclaration(declaration)) &&
			context.sourceFiles.includes(declaration.getSourceFile()),
	);
}

function argumentOfCore(
	clauses: readonly ExpressionWithTypeArguments[],
	name: string,
	index: number,
	context: CheckContext,
): NamedType[] {
	return clauses
		.filter((clause) => isCoreDeclarationNamed(clause.getType(), name))
		.flatMap((clause) => namedTypesOf(clause.getTypeArguments()[index], context));
}

function unique<T>(items: readonly T[]): T[] {
	return [...new Set(items)];
}

export interface ApplicationTypes {
	readonly commands: readonly NamedType[];
	readonly queries: readonly NamedType[];
	readonly metadata: readonly NamedType[];
	readonly views: readonly NamedType[];
}

export function findApplicationTypes(context: CheckContext): ApplicationTypes {
	const classes = context.sourceFiles.flatMap((file) => file.getClasses());
	const interfaces = context.sourceFiles.flatMap((file) => file.getInterfaces());
	const references = context.sourceFiles.flatMap((file) => file.getDescendantsOfKind(SyntaxKind.TypeReference));
	const metadataArgument = (name: string, index: number): NamedType[] =>
		references
			.filter((reference) => isCoreDeclarationNamed(reference.getType(), name))
			.flatMap((reference) => namedTypesOf(reference.getTypeArguments()[index], context));
	return {
		commands: unique(
			classes.flatMap((handler) => argumentOfCore(handler.getImplements(), "CommandHandler", 0, context)),
		),
		metadata: unique([...metadataArgument("NotificationPublisher", 0), ...metadataArgument("Notification", 1)]),
		queries: unique(classes.flatMap((handler) => argumentOfCore(handler.getImplements(), "QueryHandler", 0, context))),
		views: unique(interfaces.flatMap((port) => argumentOfCore(port.getExtends(), "ViewRepository", 0, context))),
	};
}

function nestedTypes(type: Type): Type[] {
	const nested = [
		...type.getUnionTypes(),
		...type.getIntersectionTypes(),
		...type.getTypeArguments(),
		...type.getAliasTypeArguments(),
	];
	const element = type.getArrayElementType();
	if (element !== undefined) {
		nested.push(element);
	}
	if (type.isAnonymous()) {
		for (const property of type.getProperties()) {
			const declaration = property.getValueDeclaration();
			if (declaration !== undefined) {
				nested.push(declaration.getType());
			}
		}
	}
	return nested;
}

export function referencedClasses(
	type: Type,
	matches: (declaration: ClassDeclaration) => boolean,
	seen: Set<Type> = new Set(),
): ClassDeclaration[] {
	if (seen.has(type)) {
		return [];
	}
	seen.add(type);
	const own = (type.getSymbol()?.getDeclarations() ?? []).filter(
		(declaration): declaration is ClassDeclaration => Node.isClassDeclaration(declaration) && matches(declaration),
	);
	return [...own, ...nestedTypes(type).flatMap((inner) => referencedClasses(inner, matches, seen))];
}

export function namedTypes(type: Type, seen: Set<Type> = new Set()): string[] {
	if (seen.has(type)) {
		return [];
	}
	seen.add(type);
	const name = type.getSymbol()?.getName();
	const nested = [...type.getUnionTypes(), ...type.getIntersectionTypes(), ...type.getTypeArguments()];
	return [...(name === undefined ? [] : [name]), ...nested.flatMap((inner) => namedTypes(inner, seen))];
}

const resultTypeNames = new Set(["Result", "Ok", "Err"]);

function isCoreResultSymbol(symbol: MorphSymbol | undefined): boolean {
	return symbol !== undefined && resultTypeNames.has(symbol.getName()) && symbol.getDeclarations().some(isFromCore);
}

export function isResultType(type: Type): boolean {
	if (isCoreResultSymbol(type.getAliasSymbol())) {
		return true;
	}
	const members = type.isUnion() ? type.getUnionTypes() : [type];
	return members.every(
		(member) => isCoreResultSymbol(member.getSymbol()) || isCoreResultSymbol(member.getAliasSymbol()),
	);
}

export function returnsPromise(type: Type): boolean {
	return namedTypes(type).includes("Promise");
}
