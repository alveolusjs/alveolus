import { describe, expect, it } from 'vitest';

import { ORDER_PLACED, RecordingEventPublisher } from '../../../test/fixtures/application.ts';
import { Port } from '../../domain/ports/index.ts';
import { EventPublisher } from './event-publisher.ts';

describe('EventPublisher', () => {
	it('is extended by the adapter that publishes integration events', async () => {
		const publisher = new RecordingEventPublisher();

		await publisher.publish([
			{
				correlationId: 'c1',
				id: 'evt_1',
				occurredAt: '2026-01-01T00:00:00.000Z',
				payload: { orderId: 'o1', total: 42 },
				source: 'ordering',
				type: ORDER_PLACED,
				version: 1,
			},
		]);

		expect(publisher.published).toHaveLength(1);
		expect(publisher).toBeInstanceOf(EventPublisher);
		expect(publisher).toBeInstanceOf(Port);
	});
});
