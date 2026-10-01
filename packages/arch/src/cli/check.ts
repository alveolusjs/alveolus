import { existsSync } from "node:fs";
import { resolve } from "node:path";

import type { Violation } from "../building-blocks/index.ts";
import {
	createContext,
	findApplicationTypes,
	findBuildingBlocks,
	findHandlers,
	findPortsOf,
	findRepositories,
} from "../building-blocks/index.ts";
import {
	checkAdapters,
	checkApplicationTypes,
	checkFileSuffixes,
	checkHandlers,
	checkLocations,
	checkPorts,
	checkRepositoryPortLocations,
	checkRepositoryPortSuffixes,
	checkViewRepositories,
} from "../project-layout/index.ts";
import { checkAggregates } from "../rules/aggregates/index.ts";
import { checkDomainEvents } from "../rules/domain-events/index.ts";
import { checkDomainServices } from "../rules/domain-services/index.ts";
import { checkEntities } from "../rules/entities/index.ts";
import { checkPolicies } from "../rules/policies/index.ts";
import { checkRepositoryAdapters } from "../rules/repositories/index.ts";
import { checkValueObjects } from "../rules/value-objects/index.ts";

export interface CheckOptions {
	readonly project?: string;
}

export function check(options: CheckOptions = {}): Violation[] {
	const tsconfig = resolve(options.project ?? "tsconfig.json");
	if (!existsSync(tsconfig)) {
		throw new Error(`Cannot find ${tsconfig}`);
	}
	const context = createContext(tsconfig);
	const repositories = findRepositories(context);
	const viewRepositories = findPortsOf(context, "ViewRepository");
	const ports = findPortsOf(context, "Port");
	const { all, aggregates, entities, valueObjects, domainEvents, domainServices, policies } =
		findBuildingBlocks(context);
	const violations = [
		...checkAggregates(aggregates),
		...checkEntities(entities),
		...checkValueObjects(valueObjects),
		...checkDomainEvents(domainEvents),
		...checkDomainServices(domainServices),
		...checkPolicies(policies),
		...checkLocations(all, context),
		...checkFileSuffixes(all),
		...checkRepositoryPortLocations(repositories, context),
		...checkRepositoryPortSuffixes(repositories),
		...checkHandlers(findHandlers(context), context),
		...checkApplicationTypes(findApplicationTypes(context), context),
		...checkViewRepositories(viewRepositories, context),
		...checkAdapters(viewRepositories, "view-repository", "a view repository", context),
		...checkPorts(ports, context),
		...checkAdapters(ports, "port", "a port", context),
		...checkRepositoryAdapters(repositories, context),
	];
	return violations.toSorted((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column);
}
