export const corePackageName = "@alveolus/core";

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

export const coreMarkers = ["OpenHostService", "AntiCorruptionLayer"] as const;

export type CoreMarker = (typeof coreMarkers)[number];

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

export const corePublishedLanguageSymbols: readonly string[] = ["AnyIntegrationEvent", "IntegrationEvent", "JsonValue", "PublishedLanguage"];
