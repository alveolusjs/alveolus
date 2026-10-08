import type { CoreKind, CoreMarker } from "./core-api.ts";
import type { Layer } from "./layers.ts";

export interface PlaceSpec {
	readonly layer: Layer;
	readonly folder?: string;
	readonly suffix?: string;
}

export interface BuildingBlockPlace extends PlaceSpec {
	readonly kind: CoreKind;
	readonly concreteOnly?: boolean;
}

export interface MarkerPlace extends PlaceSpec {
	readonly marker: CoreMarker;
}

export const buildingBlockPlaces: readonly BuildingBlockPlace[] = [
	{ folder: "aggregates", kind: "AggregateRoot", layer: "domain", suffix: ".aggregate.ts" },
	{ folder: "entities", kind: "Entity", layer: "domain", suffix: ".entity.ts" },
	{ folder: "value-objects", kind: "Identifier", layer: "domain", suffix: ".identifier.ts" },
	{ folder: "value-objects", kind: "ValueObject", layer: "domain", suffix: ".value-object.ts" },
	{ folder: "events", kind: "DomainEvent", layer: "domain", suffix: ".event.ts" },
	{ folder: "errors", kind: "DomainError", layer: "domain", suffix: ".error.ts" },
	{ folder: "services", kind: "DomainService", layer: "domain", suffix: ".service.ts" },
	{ folder: "commands", kind: "CommandHandler", layer: "application", suffix: ".command.ts" },
	{ folder: "queries", kind: "QueryHandler", layer: "application", suffix: ".query.ts" },
	{ folder: "translators", kind: "EventTranslator", layer: "application", suffix: ".translator.ts" },
	{ concreteOnly: true, folder: "adapters", kind: "Port", layer: "driven", suffix: ".adapter.ts" },
	{ folder: "repositories", kind: "CommandRepository", layer: "domain", suffix: ".repository.ts" },
	{ folder: "repositories", kind: "QueryRepository", layer: "domain", suffix: ".repository.ts" },
	{ folder: "ports", kind: "Port", layer: "domain", suffix: ".port.ts" },
];

export const markerPlaces: readonly MarkerPlace[] = [
	{ folder: "adapters", layer: "driven", marker: "AntiCorruptionLayer", suffix: ".adapter.ts" },
	{ layer: "driving", marker: "OpenHostService" },
];

export const extraDomainFolders: readonly string[] = ["views"];
