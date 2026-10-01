import { Scope } from "ts-morph";
import type { ClassDeclaration } from "ts-morph";

import type { Violation } from "../../building-blocks/index.ts";
import {
	extendsCoreClass,
	isCoreClass,
	isResultType,
	referencedClasses,
	violation,
} from "../../building-blocks/index.ts";
import {
	mutableFields,
	noHiddenClock,
	noIo,
	nonPublicConstructor,
	stateMutations,
	typedMembers,
} from "../shared/index.ts";

function immutable(valueObject: ClassDeclaration): Violation[] {
	const name = valueObject.getName();
	const rule = "value-object/immutable";
	return [
		...mutableFields(valueObject).map((member) =>
			violation(member, rule, `${name}.${member.getName()} is mutable; make it readonly.`),
		),
		...valueObject
			.getSetAccessors()
			.map((setter) =>
				violation(setter, rule, `${name}.${setter.getName()} is a setter; value objects are immutable.`),
			),
		...stateMutations(valueObject).map((node) =>
			violation(node, rule, `${name} changes its own state; return a new instance instead.`),
		),
	];
}

function holdsIdentity(declaration: ClassDeclaration): boolean {
	return ["Identifier", "Entity"].some((name) => isCoreClass(declaration, name) || extendsCoreClass(declaration, name));
}

function noIdentity(valueObject: ClassDeclaration): Violation[] {
	const typeArguments = valueObject.getExtends()?.getTypeArguments() ?? [];
	const members = [...typedMembers(valueObject), ...typeArguments.map((node) => ({ node, type: node.getType() }))];
	return members.flatMap(({ node, type }) =>
		[...new Set(referencedClasses(type, holdsIdentity))].map((identity) =>
			violation(
				node,
				"value-object/no-identity",
				`${valueObject.getName()} references ${identity.getName()}, which has an identity; value objects hold values only.`,
			),
		),
	);
}

function factoriesReturnResult(valueObject: ClassDeclaration): Violation[] {
	return valueObject
		.getMethods()
		.filter(
			(method) => method.isStatic() && method.getScope() === Scope.Public && !isResultType(method.getReturnType()),
		)
		.map((method) =>
			violation(
				method,
				"value-object/factories-return-result",
				`${valueObject.getName()}.${method.getName()} must return a Result; validate the input and return ok() or err().`,
			),
		);
}

export function checkValueObjects(valueObjects: readonly ClassDeclaration[]): Violation[] {
	return valueObjects.flatMap((valueObject) => [
		...immutable(valueObject),
		...noIdentity(valueObject),
		...factoriesReturnResult(valueObject),
		...noHiddenClock(valueObject, "value-object"),
		...noIo(valueObject, "value-object"),
		...nonPublicConstructor(valueObject, "value-object"),
	]);
}
