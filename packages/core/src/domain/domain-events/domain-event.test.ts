import { describe, expect, it } from 'vitest';

import { OrderId, OrderPlaced, OrderShipped } from '../../../test/fixtures/domain-event.ts';

const occurredAt = new Date('2026-01-01T00:00:00Z');

describe('DomainEvent', () => {
	it('exposes its aggregate id, date and payload', () => {
		const event = new OrderPlaced({ aggregateId: new OrderId('o1'), occurredAt, payload: { total: 42 } });

		expect(event.aggregateId.value).toBe('o1');
		expect(event.occurredAt).toEqual(occurredAt);
		expect(event.payload).toEqual({ total: 42 });
	});

	it('has no id of its own: the integration event gets one when it is translated', () => {
		const event = new OrderPlaced({ aggregateId: new OrderId('o1'), occurredAt, payload: { total: 42 } });

		expect('id' in event).toBe(false);
	});

	it('keeps its own copy of the date', () => {
		const date = new Date(occurredAt);
		const event = new OrderPlaced({ aggregateId: new OrderId('o1'), occurredAt: date, payload: { total: 42 } });

		date.setFullYear(2000);

		expect(event.occurredAt).toEqual(occurredAt);
	});

	it('is told apart by its class, and its type is the name of its class', () => {
		const shipped = new OrderShipped({ aggregateId: new OrderId('o1'), occurredAt, payload: null });

		expect(shipped).toBeInstanceOf(OrderShipped);
		expect(shipped).not.toBeInstanceOf(OrderPlaced);
		expect(shipped.type).toBe('OrderShipped');
	});
});
