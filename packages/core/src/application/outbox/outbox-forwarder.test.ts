import { beforeEach, describe, expect, it } from 'vitest';

import { ORDER_PLACED, RecordingEventPublisher } from '../../../test/fixtures/application.ts';
import { FailingEventPublisher, InMemoryOutbox, LateCommitOutbox } from '../../../test/fixtures/utilities.ts';
import { Port } from '../../domain/ports/index.ts';
import type { AnyIntegrationEvent } from '../integration-events/index.ts';
import { OutboxForwarder } from './outbox-forwarder.ts';

describe('OutboxForwarder', () => {
	const first: AnyIntegrationEvent = {
		correlationId: 'c1',
		id: 'evt_1',
		occurredAt: '2026-01-01T00:00:00.000Z',
		payload: { orderId: 'o1', total: 42 },
		source: 'ordering',
		type: ORDER_PLACED,
		version: 1,
	};
	const second: AnyIntegrationEvent = { ...first, id: 'evt_2', payload: { orderId: 'o2', total: 43 } };
	let outbox: InMemoryOutbox;

	beforeEach(async () => {
		outbox = new InMemoryOutbox();
		await outbox.add([first, second]);
	});

	it('publishes the pending events in order and records the last one published', async () => {
		const publisher = new RecordingEventPublisher();
		const forwarder = new OutboxForwarder(outbox, publisher);

		expect(await forwarder.forward()).toBe(2);
		expect(publisher.published.map((event) => event.id)).toEqual(['evt_1', 'evt_2']);
		expect(await outbox.lastPublished('default')).toBe(2);
		expect(await forwarder.forward()).toBe(0);
		expect(publisher.published).toHaveLength(2);
		expect(outbox).toBeInstanceOf(Port);
	});

	it('never changes a stored event', async () => {
		await new OutboxForwarder(outbox, new RecordingEventPublisher()).forward();

		expect((await outbox.pending(0, 10)).map((entry) => entry.event.id)).toEqual(['evt_1', 'evt_2']);
	});

	it('publishes at most one batch per call', async () => {
		const publisher = new RecordingEventPublisher();
		const forwarder = new OutboxForwarder(outbox, publisher, 'default', 1);

		expect(await forwarder.forward()).toBe(1);
		expect(await forwarder.forward()).toBe(1);
		expect(publisher.published.map((event) => event.id)).toEqual(['evt_1', 'evt_2']);
	});

	it('tracks the last published event of each channel apart', async () => {
		const webhooks = new RecordingEventPublisher();
		await new OutboxForwarder(outbox, new RecordingEventPublisher(), 'notifications').forward();

		expect(await new OutboxForwarder(outbox, webhooks, 'webhooks').forward()).toBe(2);
		expect(webhooks.published.map((event) => event.id)).toEqual(['evt_1', 'evt_2']);
	});

	it('waits for an event whose transaction is still open, then publishes in order', async () => {
		const lateOutbox = new LateCommitOutbox();
		const publisher = new RecordingEventPublisher();
		const forwarder = new OutboxForwarder(lateOutbox, publisher);

		await lateOutbox.addUncommitted([first]);
		await lateOutbox.add([second]);

		expect(await forwarder.forward()).toBe(0);
		lateOutbox.commitPending();
		expect(await forwarder.forward()).toBe(2);
		expect(publisher.published.map((event) => event.id)).toEqual(['evt_1', 'evt_2']);
	});

	it('records nothing when publishing fails', async () => {
		await expect(new OutboxForwarder(outbox, new FailingEventPublisher()).forward()).rejects.toThrow(
			'broker unavailable',
		);

		expect(await outbox.lastPublished('default')).toBe(0);
	});
});
