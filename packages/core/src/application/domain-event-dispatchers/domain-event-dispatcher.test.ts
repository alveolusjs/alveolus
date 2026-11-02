import { beforeEach, describe, expect, it } from 'vitest';

import {
	OrderId,
	OrderPlaced,
	OrderShipped,
	type OrderEvent,
	SequentialIdGenerator,
} from '../../../test/fixtures/application.ts';
import {
	AuditOrders,
	HandlingLog,
	Instances,
	NotifyCustomer,
	RejectingHandler,
	UpdateOrderSummary,
} from '../../../test/fixtures/domain-event-handlers.ts';
import { InMemoryOutbox, RecordingUnitOfWork, ScopedCorrelationContext } from '../../../test/fixtures/utilities.ts';
import { ok } from '../../utilities/result/index.ts';
import { DomainEventHandlers } from '../domain-event-handlers/index.ts';
import { DomainEventDispatcher } from './domain-event-dispatcher.ts';

describe('DomainEventDispatcher', () => {
	const occurredAt = new Date('2026-01-01T00:00:00Z');
	const placed = new OrderPlaced({ aggregateId: new OrderId('o1'), occurredAt, payload: { total: 42 } });
	const shipped = new OrderShipped({ aggregateId: new OrderId('o1'), occurredAt, payload: { carrier: 'post' } });
	const handlers = new DomainEventHandlers<OrderEvent>([
		[OrderPlaced, UpdateOrderSummary, 'sync'],
		[OrderPlaced, AuditOrders, 'sync'],
		[OrderShipped, UpdateOrderSummary, 'sync'],
		[OrderPlaced, NotifyCustomer, 'async'],
	]);

	let log: HandlingLog;
	let outbox: InMemoryOutbox;
	let correlation: ScopedCorrelationContext;
	let dispatcher: DomainEventDispatcher<OrderEvent>;

	beforeEach(() => {
		log = new HandlingLog();
		outbox = new InMemoryOutbox();
		correlation = new ScopedCorrelationContext(new SequentialIdGenerator());
		const instances = new Instances([new UpdateOrderSummary(log), new AuditOrders(log)]);
		dispatcher = new DomainEventDispatcher('ordering', handlers, instances.resolve, outbox, correlation);
	});

	it('runs the synchronous event handlers of each event, in the order they are declared', async () => {
		await dispatcher.dispatch([placed, shipped]);

		expect(log.entries).toEqual(['summary:OrderPlaced', 'audit:OrderPlaced', 'summary:OrderShipped']);
	});

	it('writes one domain entry for each event that has an asynchronous event handler, and only for those', async () => {
		await correlation.run({ causationId: 'cmd_1', correlationId: 'c1' }, () =>
			dispatcher.dispatch([placed, shipped]),
		);

		expect((await outbox.pendingDomainEvents('ordering', 0, 10)).map((entry) => entry.event)).toEqual([
			{
				causationId: 'cmd_1',
				correlationId: 'c1',
				snapshot: { occurredAt: '2026-01-01T00:00:00.000Z', orderId: 'o1', total: 42 },
				source: 'ordering',
				type: 'OrderPlaced',
			},
		]);
	});

	it('writes no domain entry for an event without an asynchronous event handler', async () => {
		await dispatcher.dispatch([shipped]);

		expect(await outbox.pendingDomainEvents('ordering', 0, 10)).toEqual([]);
	});

	it('starts one correlation for the whole dispatch when no operation is running', async () => {
		await dispatcher.dispatch([placed, placed]);

		const entries = await outbox.pendingDomainEvents('ordering', 0, 10);
		expect(entries.map((entry) => entry.event.correlationId)).toEqual(['evt_1', 'evt_1']);
	});

	it('rolls back the whole use case when a synchronous event handler fails', async () => {
		const unitOfWork = new RecordingUnitOfWork();
		const failing = new DomainEventHandlers<OrderEvent>([[OrderPlaced, RejectingHandler, 'sync']]);
		const rejecting = new DomainEventDispatcher(
			'ordering',
			failing,
			new Instances([new RejectingHandler()]).resolve,
			outbox,
			correlation,
		);

		const work = unitOfWork.run(async () => {
			await rejecting.dispatch([placed]);
			return ok();
		});

		await expect(work).rejects.toThrow('handler failed');
		expect(unitOfWork.log).toEqual(['tx1:begin', 'tx1:rollback']);
	});

	it('refuses to start when a synchronous event handler is not provided', () => {
		const resolve = new Instances([new UpdateOrderSummary(log)]).resolve;

		expect(() => new DomainEventDispatcher('ordering', handlers, resolve, outbox, correlation)).toThrow(
			'AuditOrders is not provided',
		);
	});
});
