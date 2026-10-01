import { SyntaxKind } from "ts-morph";
import type { ClassDeclaration } from "ts-morph";

import type { Violation } from "../../building-blocks/index.ts";
import { extendsCoreClass, kindOf, referencedClasses, violation } from "../../building-blocks/index.ts";
import {
	fromSnapshot,
	heldMembers,
	noHiddenClock,
	noIo,
	nonPublicConstructor,
	noPublicMutableState,
	publicMethodsReturnResult,
} from "../shared/index.ts";

function referenceByIdentity(entity: ClassDeclaration): Violation[] {
	return heldMembers(entity).flatMap(({ node, type }) => {
		const aggregates = new Set(referencedClasses(type, (other) => kindOf(other) === "aggregate"));
		return [...aggregates].map((aggregate) =>
			violation(
				node,
				"entity/reference-by-identity",
				`${entity.getName()} references aggregate ${aggregate.getName()}; reference it by its identifier instead.`,
			),
		);
	});
}

function noDomainEvents(entity: ClassDeclaration): Violation[] {
	return entity.getDescendantsOfKind(SyntaxKind.NewExpression).flatMap((expression) => {
		const event = (expression.getExpression().getType().getSymbol()?.getDeclarations() ?? []).find(
			(declaration): declaration is ClassDeclaration =>
				declaration.isKind(SyntaxKind.ClassDeclaration) && extendsCoreClass(declaration, "DomainEvent"),
		);
		if (event === undefined) {
			return [];
		}
		return [
			violation(
				expression,
				"entity/no-domain-events",
				`${entity.getName()} creates domain event ${event.getName()}; only aggregate roots record domain events.`,
			),
		];
	});
}

export function checkEntities(entities: readonly ClassDeclaration[]): Violation[] {
	return entities.flatMap((entity) => [
		...referenceByIdentity(entity),
		...noDomainEvents(entity),
		...noPublicMutableState(entity, "entity"),
		...noHiddenClock(entity, "entity"),
		...noIo(entity, "entity"),
		...publicMethodsReturnResult(entity, "entity"),
		...nonPublicConstructor(entity, "entity"),
		...fromSnapshot(entity, "entity"),
	]);
}
