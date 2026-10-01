import type { AnyDomainEvent } from "../../domain/domain-events/index.ts";
import type { JsonValue } from "../../strategic/published-language/index.ts";
import type { AnyIntegrationEvent, IntegrationEvent, IntegrationEventContext } from "../integration-events/index.ts";

export abstract class EventTranslator<Event extends AnyDomainEvent, Output extends AnyIntegrationEvent = AnyIntegrationEvent> {
	protected abstract readonly source: string;

	public abstract translate(event: Event, context: IntegrationEventContext): Output;

	protected wrap<Type extends string, Payload extends JsonValue>(
		event: Event,
		context: IntegrationEventContext,
		contract: { readonly type: Type; readonly version: number; readonly payload: Payload },
	): IntegrationEvent<Type, Payload> {
		return {
			...(context.causationId === undefined ? {} : { causationId: context.causationId }),
			correlationId: context.correlationId,
			id: event.id,
			occurredAt: event.occurredAt.toISOString(),
			payload: contract.payload,
			source: this.source,
			type: contract.type,
			version: contract.version,
		};
	}
}
