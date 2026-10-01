export type CoreKind =
	| "AggregateRoot"
	| "Entity"
	| "ValueObject"
	| "Identifier"
	| "DomainEvent"
	| "DomainError"
	| "DomainService"
	| "Port"
	| "CommandRepository"
	| "QueryRepository"
	| "CommandHandler"
	| "QueryHandler"
	| "EventTranslator"
	| "EventPublisher"
	| "Outbox"
	| "UnitOfWork";

export type CoreMarker = "OpenHostService" | "AntiCorruptionLayer";

export class CoreApi {
	public static readonly packageName = "@alveolus/core";

	private static readonly domainSymbols: ReadonlySet<string> = new Set([
		"AggregateRoot",
		"AnyAggregateRoot",
		"AnyDomainError",
		"AnyDomainEvent",
		"AnyEntity",
		"AnyIdentifier",
		"AnySnapshot",
		"AnyValueObject",
		"Clock",
		"CommandRepository",
		"DomainError",
		"DomainEvent",
		"DomainEventProps",
		"DomainService",
		"Entity",
		"Err",
		"IdGenerator",
		"Identifier",
		"IdentifierValue",
		"Ok",
		"Port",
		"QueryRepository",
		"Result",
		"SnapshotValue",
		"ValueObject",
		"View",
		"andThen",
		"combine",
		"err",
		"map",
		"mapErr",
		"ok",
	]);

	private static readonly publishedLanguageSymbols: ReadonlySet<string> = new Set(["AnyIntegrationEvent", "IntegrationEvent", "JsonValue", "PublishedLanguage"]);

	private static readonly markers: ReadonlySet<string> = new Set<CoreMarker>(["OpenHostService", "AntiCorruptionLayer"]);

	private static readonly kinds: ReadonlySet<string> = new Set<CoreKind>([
		"AggregateRoot",
		"Entity",
		"ValueObject",
		"Identifier",
		"DomainEvent",
		"DomainError",
		"DomainService",
		"Port",
		"CommandRepository",
		"QueryRepository",
		"CommandHandler",
		"QueryHandler",
		"EventTranslator",
		"EventPublisher",
		"Outbox",
		"UnitOfWork",
	]);

	public static isDomainSymbol(name: string): boolean {
		return CoreApi.domainSymbols.has(name);
	}

	public static isPublishedLanguageSymbol(name: string): boolean {
		return CoreApi.publishedLanguageSymbols.has(name);
	}

	public static isKind(name: string): name is CoreKind {
		return CoreApi.kinds.has(name);
	}

	public static isMarker(name: string): name is CoreMarker {
		return CoreApi.markers.has(name);
	}
}
