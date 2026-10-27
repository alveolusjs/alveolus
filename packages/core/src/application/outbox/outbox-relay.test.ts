import { beforeEach, describe, expect, it } from 'vitest';

import {
	Order,
	OrderEventsTranslator,
	OrderId,
	RecordingEventPublisher,
	SequentialIdGenerator,
} from '../../../test/fixtures/application.ts';
import { FailingEventPublisher, InMemoryOutbox } from '../../../test/fixtures/utilities.ts';
import { Port } from '../../domain/ports/index.ts';
import { OutboxRelay } from './outbox-relay.ts';

describe('OutboxRelay', () => {
	let outbox: InMemoryOutbox;

	beforeEach(async () => {
		outbox = new InMemoryOutbox();
		const order = new Order(new OrderId('o1'));
		order.place(42, new Date('2026-01-01T00:00:00Z'));
		order.place(43, new Date('2026-01-01T00:00:00Z'));
		await outbox.add(
			new OrderEventsTranslator(new SequentialIdGenerator()).translateAll(order.pullDomainEvents(), {
				correlationId: 'c1',
			}),
		);
	});

	it('publishes the pending events in order and records the last one published', async () => {
		const publisher = new RecordingEventPublisher();
		const relay = new OutboxRelay(outbox, publisher);

		expect(await relay.relay()).toBe(2);
		expect(publisher.published.map((event) => event.id)).toEqual(['evt_1', 'evt_2']);
		expect(await outbox.lastPublished('default')).toBe(2);
		expect(await relay.relay()).toBe(0);
		expect(publisher.published).toHaveLength(2);
		expect(outbox).toBeInstanceOf(Port);
	});

	it('never changes a stored event', async () => {
		await new OutboxRelay(outbox, new RecordingEventPublisher()).relay();

		expect((await outbox.pending(0, 10)).map((entry) => entry.event.id)).toEqual(['evt_1', 'evt_2']);
	});

	it('publishes at most one batch per call', async () => {
		const publisher = new RecordingEventPublisher();
		const relay = new OutboxRelay(outbox, publisher, 'default', 1);

		expect(await relay.relay()).toBe(1);
		expect(await relay.relay()).toBe(1);
		expect(publisher.published.map((event) => event.id)).toEqual(['evt_1', 'evt_2']);
	});

	it('tracks the last published event of each channel apart', async () => {
		const webhooks = new RecordingEventPublisher();
		await new OutboxRelay(outbox, new RecordingEventPublisher(), 'notifications').relay();

		expect(await new OutboxRelay(outbox, webhooks, 'webhooks').relay()).toBe(2);
		expect(webhooks.published.map((event) => event.id)).toEqual(['evt_1', 'evt_2']);
	});

	it('records nothing when publishing fails', async () => {
		await expect(new OutboxRelay(outbox, new FailingEventPublisher()).relay()).rejects.toThrow(
			'broker unavailable',
		);

		expect(await outbox.lastPublished('default')).toBe(0);
	});
});
