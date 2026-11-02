import { beforeEach, describe, expect, it } from 'vitest';

import { OrderId, OrderPlaced, type OrderEvent, SequentialIdGenerator } from '../../../test/fixtures/application.ts';
import {
	HandlingLog,
	Instances,
	NotifyCustomer,
	RecordCorrelation,
	RefuseOrder,
	RejectingHandler,
} from '../../../test/fixtures/domain-event-handlers.ts';
import { InMemoryOutbox, RecordingUnitOfWork, ScopedCorrelationContext } from '../../../test/fixtures/utilities.ts';
import { DomainEventHandlers } from '../domain-event-handlers/index.ts';
import { DomainEventForwarder } from './domain-event-forwarder.ts';
import type { DomainEventRecord } from './domain-event-record.ts';

describe('DomainEventForwarder', () => {
	const placed = new OrderPlaced({
		aggregateId: new OrderId('o1'),
		occurredAt: new Date('2026-01-01T00:00:00Z'),
		payload: { total: 42 },
	});
	const record: DomainEventRecord = {
		causationId: 'cmd_1',
		correlationId: 'c1',
		snapshot: placed.toSnapshot(),
		source: 'ordering',
		type: 'OrderPlaced',
	};
	let log: HandlingLog;
	let outbox: InMemoryOutbox;
	let unitOfWork: RecordingUnitOfWork;
	let correlation: ScopedCorrelationContext;

	beforeEach(() => {
		log = new HandlingLog();
		outbox = new InMemoryOutbox();
		unitOfWork = new RecordingUnitOfWork();
		correlation = new ScopedCorrelationContext(new SequentialIdGenerator());
	});

	it('delivers each domain entry, restored, under the correlation it was recorded with', async () => {
		const handlers = new DomainEventHandlers<OrderEvent>([[OrderPlaced, RecordCorrelation, 'async']]);
		const resolve = new Instances([new RecordCorrelation(log, correlation)]).resolve;
		const forwarder = new DomainEventForwarder('ordering', handlers, resolve, outbox, unitOfWork, correlation);
		await outbox.addDomainEvents([record]);

		expect(await forwarder.forward()).toBe(1);
		expect(log.entries).toEqual(['42:c1:cmd_1']);
	});

	it('delivers each domain entry in its own transaction, which also moves the position of the event handler', async () => {
		const handlers = new DomainEventHandlers<OrderEvent>([[OrderPlaced, NotifyCustomer, 'async']]);
		const resolve = new Instances([new NotifyCustomer(log)]).resolve;
		const forwarder = new DomainEventForwarder('ordering', handlers, resolve, outbox, unitOfWork, correlation);
		await outbox.addDomainEvents([record, record]);

		expect(await forwarder.forward()).toBe(2);
		expect(unitOfWork.log).toEqual(['tx1:begin', 'tx1:commit', 'tx2:begin', 'tx2:commit']);
		expect(await outbox.lastPublished('ordering.notify-customer')).toBe(2);
		expect(await forwarder.forward()).toBe(0);
	});

	it('replays only the event handler that failed', async () => {
		const handlers = new DomainEventHandlers<OrderEvent>([
			[OrderPlaced, NotifyCustomer, 'async'],
			[OrderPlaced, RejectingHandler, 'async'],
		]);
		const resolve = new Instances([new NotifyCustomer(log), new RejectingHandler()]).resolve;
		const forwarder = new DomainEventForwarder('ordering', handlers, resolve, outbox, unitOfWork, correlation);
		await outbox.addDomainEvents([record]);

		await forwarder.forward();
		await forwarder.forward();

		expect(log.entries).toEqual(['notify:OrderPlaced']);
		expect(await outbox.lastPublished('ordering.notify-customer')).toBe(1);
		expect(await outbox.lastPublished('ordering.rejecting')).toBe(0);
	});

	it('moves a domain entry to the dead letters once its event handler has failed too many times', async () => {
		const handlers = new DomainEventHandlers<OrderEvent>([[OrderPlaced, RejectingHandler, 'async']]);
		const resolve = new Instances([new RejectingHandler()]).resolve;
		const options = { maxAttempts: 2 };
		const forwarder = new DomainEventForwarder(
			'ordering',
			handlers,
			resolve,
			outbox,
			unitOfWork,
			correlation,
			options,
		);
		await outbox.addDomainEvents([record]);

		await forwarder.forward();
		expect(outbox.deadLetters).toEqual([]);
		await forwarder.forward();

		expect(outbox.deadLetters).toEqual(['ordering.rejecting#1']);
		expect(await outbox.lastPublished('ordering.rejecting')).toBe(1);
	});

	it('moves on when the use case behind the event handler refuses', async () => {
		const handlers = new DomainEventHandlers<OrderEvent>([[OrderPlaced, RefuseOrder, 'async']]);
		const resolve = new Instances([new RefuseOrder(unitOfWork)]).resolve;
		const forwarder = new DomainEventForwarder('ordering', handlers, resolve, outbox, unitOfWork, correlation);
		await outbox.addDomainEvents([record]);

		await forwarder.forward();

		expect(unitOfWork.log).toEqual(['tx1:begin', 'tx1:rollback']);
		expect(await outbox.lastPublished('ordering.refuse-order')).toBe(1);
		expect(outbox.deadLetters).toEqual([]);
	});

	it('reads only the domain entries of its bounded context, and moves past those its event handler ignores', async () => {
		const handlers = new DomainEventHandlers<OrderEvent>([[OrderPlaced, NotifyCustomer, 'async']]);
		const resolve = new Instances([new NotifyCustomer(log)]).resolve;
		const forwarder = new DomainEventForwarder('ordering', handlers, resolve, outbox, unitOfWork, correlation);
		await outbox.addDomainEvents([
			{ ...record, source: 'billing' },
			{ ...record, type: 'OrderShipped' },
		]);

		expect(await forwarder.forward()).toBe(0);
		expect(log.entries).toEqual([]);
		expect(await outbox.lastPublished('ordering.notify-customer')).toBe(2);
	});

	it('refuses to start when an asynchronous event handler is not provided', () => {
		const handlers = new DomainEventHandlers<OrderEvent>([[OrderPlaced, NotifyCustomer, 'async']]);
		const resolve = new Instances([]).resolve;

		expect(() => new DomainEventForwarder('ordering', handlers, resolve, outbox, unitOfWork, correlation)).toThrow(
			'NotifyCustomer is not provided',
		);
	});
});
