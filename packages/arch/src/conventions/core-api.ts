export const corePackageName = "@alveolus/core";

/** The building blocks a class may extend, as `@alveolus/core` names them. */
export const coreKinds = [
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
] as const;

export type CoreKind = (typeof coreKinds)[number];

/** The marker interfaces a class may implement. */
export const coreMarkers = ["OpenHostService", "AntiCorruptionLayer"] as const;

export type CoreMarker = (typeof coreMarkers)[number];

/** What the domain may import from core: its building blocks, and `Result`. */
export const coreDomainSymbols: readonly string[] = [
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
];

/** What the published language may import from core. */
export const corePublishedLanguageSymbols: readonly string[] = ["AnyIntegrationEvent", "IntegrationEvent", "JsonValue", "PublishedLanguage"];
