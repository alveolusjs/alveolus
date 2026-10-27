import { describe, expect, it } from 'vitest';

import { Catalog, Order, OrderId, OrderPlaced } from '../../../test/fixtures/aggregate-root.ts';
import type { AggregateRoot } from './aggregate-root.ts';

const now = new Date('2026-01-01T00:00:00Z');

describe('AggregateRoot', () => {
	it('starts without events', () => {
		expect(new Order(new OrderId('o1')).domainEvents).toEqual([]);
	});

	it('exposes recorded events without clearing them', () => {
		const order = new Order(new OrderId('o1'));
		order.place(now);

		expect(order.domainEvents).toHaveLength(1);
		expect(order.domainEvents).toHaveLength(1);
	});

	it('does not let callers mutate its events through domainEvents', () => {
		const order = new Order(new OrderId('o1'));
		order.place(now);

		(order.domainEvents as OrderPlaced[]).length = 0;

		expect(order.domainEvents).toHaveLength(1);
	});

	it('returns recorded events in order and clears them when pulled', () => {
		const order = new Order(new OrderId('o1'));
		order.place(now);
		order.place(now);

		const events = order.pullDomainEvents();

		expect(events).toHaveLength(2);
		expect(events[0]).toBeInstanceOf(OrderPlaced);
		expect(order.pullDomainEvents()).toEqual([]);
	});

	it('turns into a snapshot of plain data, without its pending events', () => {
		const order = new Order(new OrderId('o1'));
		order.place(now);

		expect(order.toSnapshot()).toEqual({ id: 'o1', lines: [{ quantity: 2, sku: 'p1' }], placedAt: now });
	});

	it('declares its identity, its events and its snapshot', () => {
		// @ts-expect-error
		const withoutEvents = (aggregate: AggregateRoot<OrderId>): unknown => aggregate;
		// @ts-expect-error
		const withIdentifierInSnapshot = (aggregate: AggregateRoot<OrderId, OrderPlaced, { id: OrderId }>): unknown =>
			aggregate;

		expect([typeof withoutEvents, typeof withIdentifierInSnapshot]).toEqual(['function', 'function']);
	});

	it('records no event when it declares none', () => {
		expect(new Catalog(new OrderId('c1')).pullDomainEvents()).toEqual([]);
	});
});
