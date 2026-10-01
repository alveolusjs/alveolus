import type { JsonValue, PublishedLanguage } from "../../strategic/published-language/index.ts";

export type IntegrationEvent<Type extends string = string, Payload extends JsonValue = JsonValue> = PublishedLanguage<{
	readonly id: string;
	readonly type: Type;
	readonly version: number;
	readonly source: string;
	readonly occurredAt: string;
	readonly correlationId: string;
	readonly causationId?: string;
	readonly payload: Payload;
}>;

export type AnyIntegrationEvent = IntegrationEvent;
