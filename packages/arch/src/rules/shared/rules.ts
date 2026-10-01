import { Node, Scope, SyntaxKind } from "ts-morph";
import type { ClassDeclaration, Expression, ParameterDeclaration, PropertyDeclaration, Type } from "ts-morph";

import type { BuildingBlockKind, Violation } from "../../building-blocks/index.ts";
import {
	coreAbstractMethodNames,
	isResultType,
	kindOf,
	namedTypes,
	referencedClasses,
	returnsPromise,
	violation,
} from "../../building-blocks/index.ts";

const plural: Record<BuildingBlockKind, string> = {
	aggregate: "aggregates",
	"domain-error": "domain errors",
	"domain-event": "domain events",
	"domain-service": "domain services",
	entity: "entities",
	identifier: "identifiers",
	policy: "policies",
	"value-object": "value objects",
};

export interface TypedMember {
	readonly node: Node;
	readonly type: Type;
}

export function typedMembers(declaration: ClassDeclaration): TypedMember[] {
	const parameters = [
		...declaration.getConstructors(),
		...declaration.getMethods(),
		...declaration.getSetAccessors(),
	].flatMap((member) => member.getParameters());
	return [
		...declaration.getProperties().map((node) => ({ node, type: node.getType() })),
		...parameters.map((node) => ({ node, type: node.getType() })),
		...[...declaration.getMethods(), ...declaration.getGetAccessors()].map((node) => ({
			node,
			type: node.getReturnType(),
		})),
	];
}

const assignmentOperators = new Set([
	SyntaxKind.EqualsToken,
	SyntaxKind.PlusEqualsToken,
	SyntaxKind.MinusEqualsToken,
	SyntaxKind.AsteriskEqualsToken,
	SyntaxKind.SlashEqualsToken,
	SyntaxKind.PercentEqualsToken,
	SyntaxKind.AsteriskAsteriskEqualsToken,
	SyntaxKind.AmpersandEqualsToken,
	SyntaxKind.BarEqualsToken,
	SyntaxKind.CaretEqualsToken,
	SyntaxKind.LessThanLessThanEqualsToken,
	SyntaxKind.GreaterThanGreaterThanEqualsToken,
	SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken,
	SyntaxKind.AmpersandAmpersandEqualsToken,
	SyntaxKind.BarBarEqualsToken,
	SyntaxKind.QuestionQuestionEqualsToken,
]);

function targetsThis(expression: Expression): boolean {
	let current: Node = expression;
	while (Node.isPropertyAccessExpression(current) || Node.isElementAccessExpression(current)) {
		current = current.getExpression();
	}
	return current.isKind(SyntaxKind.ThisKeyword) && current !== expression;
}

export function stateMutations(declaration: ClassDeclaration): Node[] {
	const assignments = declaration
		.getDescendantsOfKind(SyntaxKind.BinaryExpression)
		.filter(
			(expression) =>
				assignmentOperators.has(expression.getOperatorToken().getKind()) && targetsThis(expression.getLeft()),
		);
	const increments = [
		...declaration.getDescendantsOfKind(SyntaxKind.PrefixUnaryExpression),
		...declaration.getDescendantsOfKind(SyntaxKind.PostfixUnaryExpression),
	].filter(
		(expression) =>
			(expression.getOperatorToken() === SyntaxKind.PlusPlusToken ||
				expression.getOperatorToken() === SyntaxKind.MinusMinusToken) &&
			targetsThis(expression.getOperand()),
	);
	return [...assignments, ...increments].filter(
		(node) => node.getFirstAncestorByKind(SyntaxKind.Constructor) === undefined,
	);
}

export function mutableFields(declaration: ClassDeclaration): (PropertyDeclaration | ParameterDeclaration)[] {
	const properties = declaration.getProperties().filter((property) => !property.isReadonly());
	const parameters = declaration
		.getConstructors()
		.flatMap((constructorDeclaration) => constructorDeclaration.getParameters())
		.filter((parameter) => parameter.isParameterProperty() && !parameter.isReadonly());
	return [...properties, ...parameters];
}

export function heldMembers(declaration: ClassDeclaration): TypedMember[] {
	return typedMembers(declaration).filter(({ node }) => !Node.isMethodDeclaration(node));
}

export function noPublicMutableState(declaration: ClassDeclaration, kind: BuildingBlockKind): Violation[] {
	const name = declaration.getName();
	const rule = `${kind}/no-public-mutable-state`;
	const properties = declaration
		.getProperties()
		.filter(
			(property) =>
				!Node.isPrivateIdentifier(property.getNameNode()) &&
				property.getScope() === Scope.Public &&
				!property.isReadonly(),
		);
	const parameters = declaration
		.getConstructors()
		.flatMap((constructorDeclaration) => constructorDeclaration.getParameters())
		.filter(
			(parameter) =>
				parameter.isParameterProperty() &&
				(parameter.getScope() ?? Scope.Public) === Scope.Public &&
				!parameter.isReadonly(),
		);
	const setters = declaration.getSetAccessors().filter((setter) => setter.getScope() === Scope.Public);
	return [
		...[...properties, ...parameters].map((member) =>
			violation(member, rule, `${name}.${member.getName()} is public and mutable; make it readonly or private.`),
		),
		...setters.map((setter) =>
			violation(
				setter,
				rule,
				`${name}.${setter.getName()} has a public setter; change state through business methods.`,
			),
		),
	];
}

export function noHiddenClock(declaration: ClassDeclaration, kind: BuildingBlockKind): Violation[] {
	const rule = `${kind}/no-hidden-clock`;
	const message = (call: string): string =>
		`${declaration.getName()} reads the clock with ${call}; receive the date as a parameter instead.`;
	const constructions = declaration
		.getDescendantsOfKind(SyntaxKind.NewExpression)
		.filter((expression) => expression.getExpression().getText() === "Date" && expression.getArguments().length === 0)
		.map((expression) => violation(expression, rule, message("new Date()")));
	const calls = declaration
		.getDescendantsOfKind(SyntaxKind.CallExpression)
		.filter((expression) => expression.getExpression().getText() === "Date.now")
		.map((expression) => violation(expression, rule, message("Date.now()")));
	return [...constructions, ...calls];
}

export function noIo(declaration: ClassDeclaration, kind: BuildingBlockKind): Violation[] {
	const name = declaration.getName();
	const rule = `${kind}/no-io`;
	const asyncMethods = declaration
		.getMethods()
		.filter((method) => method.isAsync() || returnsPromise(method.getReturnType()))
		.map((method) =>
			violation(method, rule, `${name}.${method.getName()} returns a Promise; ${plural[kind]} must not perform I/O.`),
		);
	const repositories = typedMembers(declaration)
		.filter(({ node }) => !Node.isMethodDeclaration(node) && !Node.isGetAccessorDeclaration(node))
		.flatMap(({ node, type }) =>
			[...new Set(namedTypes(type).filter((typeName) => typeName.endsWith("Repository")))].map((repository) =>
				violation(node, rule, `${name} depends on ${repository}; ${plural[kind]} must not use repositories.`),
			),
		);
	return [...asyncMethods, ...repositories];
}

export function publicMethodsReturnResult(declaration: ClassDeclaration, kind: BuildingBlockKind): Violation[] {
	const coreMethods = new Set(coreAbstractMethodNames(declaration));
	return declaration
		.getMethods()
		.filter((method) => !method.isStatic() && method.getScope() === Scope.Public)
		.filter((method) => !coreMethods.has(method.getName()))
		.filter((method) => !method.isAsync() && !returnsPromise(method.getReturnType()))
		.filter((method) => !isResultType(method.getReturnType()))
		.map((method) =>
			violation(
				method,
				`${kind}/public-methods-return-result`,
				`${declaration.getName()}.${method.getName()} must return a Result; return ok() or err() from @alveolus/core.`,
			),
		);
}

export function fromSnapshot(declaration: ClassDeclaration, kind: BuildingBlockKind): Violation[] {
	for (
		let current: ClassDeclaration | undefined = declaration;
		current !== undefined;
		current = current.getBaseClass()
	) {
		const factory = current.getStaticMethod("fromSnapshot");
		if (factory !== undefined && factory.getScope() === Scope.Public) {
			return [];
		}
	}
	if (declaration.isAbstract()) {
		return [];
	}
	return [
		violation(
			declaration,
			`${kind}/from-snapshot`,
			`${declaration.getName()} has no public static fromSnapshot; add one to rebuild it from its snapshot.`,
		),
	];
}

export function nonPublicConstructor(declaration: ClassDeclaration, kind: BuildingBlockKind): Violation[] {
	const publicConstructor = declaration.getConstructors().find((candidate) => candidate.getScope() === Scope.Public);
	if (publicConstructor === undefined) {
		return [];
	}
	return [
		violation(
			publicConstructor,
			`${kind}/non-public-constructor`,
			`${declaration.getName()} has a public constructor; make it protected or private and expose static factories.`,
		),
	];
}

function heldDomainObjects(declaration: ClassDeclaration, kind: BuildingBlockKind): Violation[] {
	const fields = [
		...declaration.getProperties(),
		...declaration
			.getConstructors()
			.flatMap((constructorDeclaration) => constructorDeclaration.getParameters())
			.filter((parameter) => parameter.isParameterProperty()),
	];
	return fields.flatMap((field) =>
		[
			...new Set(
				referencedClasses(
					field.getType(),
					(candidate) => kindOf(candidate) === "aggregate" || kindOf(candidate) === "entity",
				),
			),
		].map((held) =>
			violation(
				field,
				`${kind}/stateless`,
				`${declaration.getName()}.${field.getName()} holds ${held.getName()}; pass it as a parameter, ${plural[kind]} are stateless.`,
			),
		),
	);
}

export function stateless(declaration: ClassDeclaration, kind: BuildingBlockKind): Violation[] {
	const name = declaration.getName();
	const rule = `${kind}/stateless`;
	return [
		...mutableFields(declaration).map((field) =>
			violation(field, rule, `${name}.${field.getName()} is mutable; ${plural[kind]} are stateless.`),
		),
		...declaration
			.getSetAccessors()
			.map((setter) =>
				violation(setter, rule, `${name}.${setter.getName()} is a setter; ${plural[kind]} are stateless.`),
			),
		...stateMutations(declaration).map((node) =>
			violation(node, rule, `${name} changes its own state; ${plural[kind]} are stateless.`),
		),
		...heldDomainObjects(declaration, kind),
	];
}
