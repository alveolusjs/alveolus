import type { ClassDeclaration } from "ts-morph";

import type { Violation } from "../../building-blocks/index.ts";
import { isCoreClass, kindOf, referencedClasses, violation } from "../../building-blocks/index.ts";
import {
	fromSnapshot,
	heldMembers,
	noHiddenClock,
	noIo,
	nonPublicConstructor,
	noPublicMutableState,
	publicMethodsReturnResult,
} from "../shared/index.ts";

function referenceByIdentity(aggregate: ClassDeclaration): Violation[] {
	return heldMembers(aggregate).flatMap(({ node, type }) => {
		const others = new Set(referencedClasses(type, (other) => other !== aggregate && kindOf(other) === "aggregate"));
		return [...others].map((other) =>
			violation(
				node,
				"aggregate/reference-by-identity",
				`${aggregate.getName()} references aggregate ${other.getName()}; reference it by its identifier instead.`,
			),
		);
	});
}

function noInheritance(aggregate: ClassDeclaration): Violation[] {
	const base = aggregate.getBaseClass();
	if (base === undefined || isCoreClass(base, "AggregateRoot")) {
		return [];
	}
	return [
		violation(
			aggregate,
			"aggregate/no-inheritance",
			`${aggregate.getName()} extends ${base.getName()}; aggregates must extend AggregateRoot directly.`,
		),
	];
}

function onePerFile(aggregates: readonly ClassDeclaration[]): Violation[] {
	const byFile = Map.groupBy(aggregates, (aggregate) => aggregate.getSourceFile());
	return [...byFile.values()].flatMap((inFile) =>
		inFile
			.slice(1)
			.map((aggregate) =>
				violation(
					aggregate,
					"aggregate/one-per-file",
					`${aggregate.getName()} is not the only aggregate in ${aggregate.getSourceFile().getBaseName()}; move it to its own file.`,
				),
			),
	);
}

export function checkAggregates(aggregates: readonly ClassDeclaration[]): Violation[] {
	return [
		...aggregates.flatMap((aggregate) => [
			...referenceByIdentity(aggregate),
			...noPublicMutableState(aggregate, "aggregate"),
			...noHiddenClock(aggregate, "aggregate"),
			...noIo(aggregate, "aggregate"),
			...publicMethodsReturnResult(aggregate, "aggregate"),
			...nonPublicConstructor(aggregate, "aggregate"),
			...fromSnapshot(aggregate, "aggregate"),
			...noInheritance(aggregate),
		]),
		...onePerFile(aggregates),
	];
}
