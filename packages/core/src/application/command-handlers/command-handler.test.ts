import { beforeEach, describe, expect, it } from 'vitest';

import type { PlaceOrder } from '../../../test/fixtures/application.ts';
import {
	CreateOrderHandler,
	FixedClock,
	InMemoryOrders,
	InvalidTotal,
	Order,
	type OrderEvent,
	OrderEventsTranslator,
	OrderId,
	OrderNotFound,
	OrderPlaced,
	PlaceOrderHandler,
	SequentialIdGenerator,
} from '../../../test/fixtures/application.ts';
import { Instances } from '../../../test/fixtures/domain-event-handlers.ts';
import { InMemoryOutbox, ScopedCorrelationContext } from '../../../test/fixtures/utilities.ts';
import { err, ok } from '../../utilities/result/index.ts';
import { DomainEventDispatcher } from '../domain-event-dispatchers/index.ts';
import { DomainEventHandlers } from '../domain-event-handlers/index.ts';
import { CommandHandler } from './command-handler.ts';

describe('CommandHandler', () => {
	let outbox: InMemoryOutbox;
	let handler: PlaceOrderHandler;

	beforeEach(async () => {
		const orders = new InMemoryOrders();
		await orders.save(new Order(new OrderId('o1')));
		outbox = new InMemoryOutbox();
		const correlation = new ScopedCorrelationContext(new SequentialIdGenerator());
		const translator = new OrderEventsTranslator(new SequentialIdGenerator(), outbox, correlation);
		const handlers = new DomainEventHandlers<OrderEvent>([[OrderPlaced, OrderEventsTranslator, 'sync']]);
		const events = new DomainEventDispatcher(
			'ordering',
			handlers,
			new Instances([translator]).resolve,
			outbox,
			correlation,
		);
		handler = new PlaceOrderHandler(orders, events, new FixedClock(new Date()));
	});

	it('returns ok and dispatches the events of the aggregate after saving', async () => {
		expect(await handler.handle({ orderId: 'o1', total: 42 })).toEqual(ok());
		expect(await outbox.pending(0, 10)).toHaveLength(1);
		expect(handler).toBeInstanceOf(CommandHandler);
	});

	it('returns the domain errors it declares', async () => {
		expect(await handler.handle({ orderId: 'o2', total: 42 })).toEqual(err(new OrderNotFound({ id: 'o2' })));
		expect(await handler.handle({ orderId: 'o1', total: 0 })).toEqual(err(new InvalidTotal({ total: 0 })));
	});

	it('may return data', async () => {
		const result = await new CreateOrderHandler().handle({ orderId: 'o1' });

		expect(result.ok && result.value.value).toBe('o1');
	});

	it('only accepts domain errors and succeeds with nothing by default', () => {
		// @ts-expect-error
		const withError: CommandHandler<PlaceOrder, void, Error> | undefined = undefined;
		const handler: CommandHandler<PlaceOrder> | undefined = undefined;

		expect(withError).toBeUndefined();
		expect(handler).toBeUndefined();
	});
});
