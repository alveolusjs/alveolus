import type { ClassDeclaration } from "ts-morph";

import type {
	ApplicationTypes,
	BuildingBlockKind,
	CheckContext,
	Handlers,
	NamedType,
	Repositories,
	Violation,
} from "../building-blocks/index.ts";
import { kindOf, pathSegments, violation } from "../building-blocks/index.ts";

const folders: Record<BuildingBlockKind, string> = {
	aggregate: "aggregates",
	"domain-error": "errors",
	"domain-event": "events",
	"domain-service": "services",
	entity: "entities",
	identifier: "value-objects",
	policy: "policies",
	"value-object": "value-objects",
};

const suffixes: Record<BuildingBlockKind, string> = {
	aggregate: "aggregate",
	"domain-error": "error",
	"domain-event": "event",
	"domain-service": "service",
	entity: "entity",
	identifier: "identifier",
	policy: "policy",
	"value-object": "value-object",
};

const descriptions: Record<BuildingBlockKind, string> = {
	aggregate: "an aggregate",
	"domain-error": "a domain error",
	"domain-event": "a domain event",
	"domain-service": "a domain service",
	entity: "an entity",
	identifier: "an identifier",
	policy: "a policy",
	"value-object": "a value object",
};

const segmentsFromLayerToFile = 3;

function isInFolder(segments: readonly string[], folder: string): boolean {
	const domain = segments.lastIndexOf("domain");
	return domain >= 1 && segments.length >= domain + segmentsFromLayerToFile && segments[domain + 1] === folder;
}

export function checkLocations(declarations: readonly ClassDeclaration[], context: CheckContext): Violation[] {
	return declarations.flatMap((declaration) => {
		const kind = kindOf(declaration);
		if (kind === undefined) {
			return [];
		}
		const folder = folders[kind];
		if (isInFolder(pathSegments(context.srcDir, declaration.getSourceFile().getFilePath()), folder)) {
			return [];
		}
		return [
			violation(
				declaration,
				`${kind}/location`,
				`${declaration.getName()} is ${descriptions[kind]}; declare it in a domain/${folder}/ folder.`,
			),
		];
	});
}

export function checkRepositoryPortLocations({ ports }: Repositories, context: CheckContext): Violation[] {
	return ports
		.filter((port) => !isInFolder(pathSegments(context.srcDir, port.getSourceFile().getFilePath()), "repositories"))
		.map((port) =>
			violation(
				port,
				"repository/location",
				`${port.getName()} is a repository port; declare it in a domain/repositories/ folder.`,
			),
		);
}

function hasSuffix(declaration: ClassDeclaration | NamedType, suffix: string): boolean {
	return declaration.getSourceFile().getBaseName().endsWith(`.${suffix}.ts`);
}

export function checkFileSuffixes(declarations: readonly ClassDeclaration[]): Violation[] {
	return declarations.flatMap((declaration) => {
		const kind = kindOf(declaration);
		if (kind === undefined || hasSuffix(declaration, suffixes[kind])) {
			return [];
		}
		return [
			violation(
				declaration,
				`${kind}/file-suffix`,
				`${declaration.getName()} is ${descriptions[kind]}; name its file <name>.${suffixes[kind]}.ts.`,
			),
		];
	});
}

export function checkRepositoryPortSuffixes({ ports }: Repositories): Violation[] {
	return ports
		.filter((port) => !hasSuffix(port, "repository"))
		.map((port) =>
			violation(
				port,
				"repository/file-suffix",
				`${port.getName()} is a repository port; name its file <name>.repository.ts.`,
			),
		);
}

type Layer = "domain" | "application";

interface Placement {
	readonly rule: string;
	readonly description: string;
	readonly layer: Layer;
	readonly folder: string;
	readonly suffix: string;
}

const articles: Record<Layer, string> = { application: "an", domain: "a" };

function isInLayerFolder(segments: readonly string[], layer: Layer, folder: string): boolean {
	const index = segments.lastIndexOf(layer);
	return index >= 1 && segments.length >= index + segmentsFromLayerToFile && segments[index + 1] === folder;
}

function checkPlacement(
	declarations: readonly (ClassDeclaration | NamedType)[],
	{ rule, description, layer, folder, suffix }: Placement,
	context: CheckContext,
): Violation[] {
	return declarations.flatMap((declaration) => [
		...(isInLayerFolder(pathSegments(context.srcDir, declaration.getSourceFile().getFilePath()), layer, folder)
			? []
			: [
					violation(
						declaration,
						`${rule}/location`,
						`${declaration.getName()} is ${description}; declare it in ${articles[layer]} ${layer}/${folder}/ folder.`,
					),
				]),
		...(hasSuffix(declaration, suffix)
			? []
			: [
					violation(
						declaration,
						`${rule}/file-suffix`,
						`${declaration.getName()} is ${description}; name its file <name>.${suffix}.ts.`,
					),
				]),
	]);
}

export function checkHandlers(handlers: Handlers, context: CheckContext): Violation[] {
	return [
		...checkPlacement(
			handlers.commands,
			{
				description: "a command handler",
				folder: "commands",
				layer: "application",
				rule: "command-handler",
				suffix: "command",
			},
			context,
		),
		...checkPlacement(
			handlers.queries,
			{
				description: "a query handler",
				folder: "queries",
				layer: "application",
				rule: "query-handler",
				suffix: "query",
			},
			context,
		),
	];
}

export function checkApplicationTypes(types: ApplicationTypes, context: CheckContext): Violation[] {
	return [
		...checkPlacement(
			types.commands,
			{ description: "a command", folder: "commands", layer: "application", rule: "command", suffix: "command" },
			context,
		),
		...checkPlacement(
			types.queries,
			{ description: "a query", folder: "queries", layer: "application", rule: "query", suffix: "query" },
			context,
		),
		...checkPlacement(
			types.metadata,
			{
				description: "notification metadata",
				folder: "metadata",
				layer: "application",
				rule: "metadata",
				suffix: "metadata",
			},
			context,
		),
		...checkPlacement(
			types.views,
			{ description: "a view", folder: "views", layer: "domain", rule: "view", suffix: "view" },
			context,
		),
	];
}

export function checkViewRepositories({ ports }: Repositories, context: CheckContext): Violation[] {
	return checkPlacement(
		ports,
		{
			description: "a view repository",
			folder: "repositories",
			layer: "domain",
			rule: "view-repository",
			suffix: "repository",
		},
		context,
	);
}

export function checkPorts({ ports }: Repositories, context: CheckContext): Violation[] {
	return checkPlacement(
		ports,
		{ description: "a port", folder: "ports", layer: "application", rule: "port", suffix: "port" },
		context,
	);
}

function isInDriven(segments: readonly string[]): boolean {
	const driven = segments.lastIndexOf("driven");
	return driven >= 1 && segments.length >= driven + 2;
}

export function checkAdapters(
	{ adapters }: Repositories,
	rule: string,
	description: string,
	context: CheckContext,
): Violation[] {
	return adapters
		.filter((adapter) => !isInDriven(pathSegments(context.srcDir, adapter.getSourceFile().getFilePath())))
		.map((adapter) =>
			violation(
				adapter,
				`${rule}/adapter-location`,
				`${adapter.getName()} implements ${description}; declare it in a driven/ folder.`,
			),
		);
}
