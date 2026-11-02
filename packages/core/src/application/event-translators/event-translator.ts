import type { AnyDomainEvent } from '../../domain/domain-events/index.ts';
import type { IdGenerator } from '../../domain/ports/index.ts';
import type { JsonValue } from '../../strategic/published-language/index.ts';
import type { CorrelationContext } from '../correlation-contexts/index.ts';
import { DomainEventHandler } from '../domain-event-handlers/index.ts';
import type { AnyIntegrationEvent, IntegrationEvent } from '../integration-events/index.ts';
import type { Outbox } from '../outbox/index.ts';

export abstract class EventTranslator<Event extends AnyDomainEvent> extends DomainEventHandler<Event> {
	protected abstract readonly source: string;

	readonly #ids: IdGenerator;
	readonly #outbox: Outbox;
	readonly #correlation: CorrelationContext;

	public constructor(ids: IdGenerator, outbox: Outbox, correlation: CorrelationContext) {
		super();
		this.#ids = ids;
		this.#outbox = outbox;
		this.#correlation = correlation;
	}

	public async handle(event: Event): Promise<void> {
		const integrationEvents = this.translate(event);

		if (integrationEvents.length > 0) {
			await this.#outbox.add(integrationEvents);
		}
	}

	protected abstract translate(event: Event): AnyIntegrationEvent[];

	protected wrap<Type extends string, Payload extends JsonValue>(
		event: Event,
		contract: { readonly type: Type; readonly version: number; readonly payload: Payload },
	): IntegrationEvent<Type, Payload> {
		const { causationId, correlationId } = this.#correlation.current();

		return {
			...(causationId === undefined ? {} : { causationId }),
			correlationId,
			id: this.#ids.next(),
			occurredAt: event.occurredAt.toISOString(),
			payload: contract.payload,
			source: this.source,
			type: contract.type,
			version: contract.version,
		};
	}
}
