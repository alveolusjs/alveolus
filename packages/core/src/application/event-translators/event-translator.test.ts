import { beforeEach, describe, expect, it } from 'vitest';

import type { OrderPlacedRepresentation } from '../../../test/fixtures/application.ts';
import {
	MigratingOrderEventsTranslator,
	OrderEventsTranslator,
	OrderId,
	OrderPlaced,
	OrderShipped,
	SequentialIdGenerator,
} from '../../../test/fixtures/application.ts';
import { InMemoryOutbox, ScopedCorrelationContext } from '../../../test/fixtures/utilities.ts';
import { DomainEventHandler } from '../domain-event-handlers/index.ts';
import { EventTranslator } from './event-translator.ts';

describe('EventTranslator', () => {
	const occurredAt = new Date('2026-01-01T00:00:00Z');
	const placed = new OrderPlaced({ aggregateId: new OrderId('o1'), occurredAt, payload: { total: 42 } });
	const shipped = new OrderShipped({ aggregateId: new OrderId('o1'), occurredAt, payload: { carrier: 'post' } });

	let outbox: InMemoryOutbox;
	let correlation: ScopedCorrelationContext;
	let translator: OrderEventsTranslator;

	beforeEach(() => {
		outbox = new InMemoryOutbox();
		correlation = new ScopedCorrelationContext(new SequentialIdGenerator());
		translator = new OrderEventsTranslator(new SequentialIdGenerator(), outbox, correlation);
	});

	it('adds to the outbox the integration event of the published language, with an id of its own', async () => {
		await correlation.run({ correlationId: 'c1' }, () => translator.handle(placed));

		expect((await outbox.pending(0, 10)).map((entry) => entry.event)).toEqual([
			{
				correlationId: 'c1',
				id: 'evt_1',
				occurredAt: '2026-01-01T00:00:00.000Z',
				payload: { orderId: 'o1', total: 42 },
				source: 'ordering',
				type: 'ordering.order.OrderPlaced',
				version: 1,
			},
		]);
		expect(translator).toBeInstanceOf(EventTranslator);
		expect(translator).toBeInstanceOf(DomainEventHandler);
	});

	it('adds nothing for a domain event that stays inside its bounded context', async () => {
		await translator.handle(shipped);

		expect((await outbox.pending(0, 10)).map((entry) => entry.event)).toEqual([]);
	});

	it('adds both versions of a message during a migration', async () => {
		await new MigratingOrderEventsTranslator(new SequentialIdGenerator(), outbox, correlation).handle(placed);

		const versions = (await outbox.pending(0, 10)).map(({ event }) => [event.type, event.version, event.payload]);
		expect(versions).toEqual([
			['ordering.order.OrderPlaced', 1, { orderId: 'o1', total: 42 }],
			['ordering.order.OrderPlaced', 2, { amount: 42, orderId: 'o1' }],
		]);
	});

	it('keeps the causation of the running operation', async () => {
		await correlation.run({ causationId: 'cmd_1', correlationId: 'c1' }, () => translator.handle(placed));

		expect((await outbox.pending(0, 10)).map((entry) => entry.event.causationId)).toEqual(['cmd_1']);
	});

	it('survives a JSON round trip', async () => {
		await translator.handle(placed);

		const [event] = (await outbox.pending(0, 10)).map((entry) => entry.event);
		const parsed: OrderPlacedRepresentation = JSON.parse(JSON.stringify(event));
		expect(parsed).toEqual(event);
	});
});
