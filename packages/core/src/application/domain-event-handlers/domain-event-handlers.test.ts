import { describe, expect, it } from 'vitest';

import { OrderId, OrderPlaced, OrderShipped, type OrderEvent } from '../../../test/fixtures/application.ts';
import {
	AuditOrders,
	InvoiceIssued,
	NotifyCustomer,
	SendReceipt,
	UpdateOrderSummary,
} from '../../../test/fixtures/domain-event-handlers.ts';
import { DomainEventHandlers } from './domain-event-handlers.ts';

describe('DomainEventHandlers', () => {
	const occurredAt = new Date('2026-01-01T00:00:00Z');
	const placed = new OrderPlaced({ aggregateId: new OrderId('o1'), occurredAt, payload: { total: 42 } });
	const shipped = new OrderShipped({ aggregateId: new OrderId('o1'), occurredAt, payload: { carrier: 'post' } });
	const handlers = new DomainEventHandlers<OrderEvent>([
		[OrderPlaced, UpdateOrderSummary, 'sync'],
		[OrderPlaced, AuditOrders, 'sync'],
		[OrderShipped, UpdateOrderSummary, 'sync'],
		[OrderPlaced, NotifyCustomer, 'async'],
	]);

	it('lists the synchronous event handlers of an event, in the order they are declared', () => {
		expect(handlers.synchronousHandlersOf(placed)).toEqual([UpdateOrderSummary, AuditOrders]);
		expect(handlers.synchronousHandlersOf(shipped)).toEqual([UpdateOrderSummary]);
	});

	it('defers only an event that has an asynchronous event handler', () => {
		expect(handlers.isDeferred(placed)).toBe(true);
		expect(handlers.isDeferred(shipped)).toBe(false);
	});

	it('lists each event handler once, by mode', () => {
		expect(handlers.synchronousHandlers()).toEqual([UpdateOrderSummary, AuditOrders]);
		expect(handlers.asynchronousHandlers()).toEqual([NotifyCustomer]);
	});

	it('tells which events an asynchronous event handler reads', () => {
		expect(handlers.subscribes(NotifyCustomer, 'OrderPlaced')).toBe(true);
		expect(handlers.subscribes(NotifyCustomer, 'OrderShipped')).toBe(false);
	});

	it('restores an event from its snapshot', () => {
		expect(handlers.restore('OrderPlaced', placed.toSnapshot())).toEqual(placed);
	});

	it('refuses to restore an event that has no snapshot', () => {
		expect(() => handlers.restore('OrderShipped', {})).toThrow(
			'No asynchronous event handler restores OrderShipped',
		);
	});

	it('compiles only for the events of its bounded context, each read by an event handler that expects it', () => {
		const refused = [
			// @ts-expect-error
			new DomainEventHandlers<OrderEvent>([[InvoiceIssued, AuditOrders, 'sync']]),
			// @ts-expect-error
			new DomainEventHandlers<OrderEvent>([[OrderPlaced, SendReceipt, 'sync']]),
			// @ts-expect-error
			new DomainEventHandlers<OrderEvent>([[OrderShipped, NotifyCustomer, 'async']]),
			// @ts-expect-error
			new DomainEventHandlers<OrderEvent>([[OrderPlaced, UpdateOrderSummary, 'async']]),
		];

		expect(refused).toHaveLength(4);
	});
});
