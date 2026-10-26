import { describe, expect, it } from 'vitest';

import { InMemoryOrders, Order, OrderId, Orders } from '../../../test/fixtures/application.ts';
import { OrderAlreadyPlaced } from '../../../test/fixtures/domain-error.ts';
import { CustomerId } from '../../../test/fixtures/identifier.ts';
import { err, ok } from '../../utilities/result/index.ts';
import { Port } from '../ports/index.ts';
import { CommandRepository } from './command-repository.ts';

describe('CommandRepository', () => {
	it('is a port implemented by an adapter', async () => {
		const order = new Order(new OrderId('o1'));
		order.place(42, 'evt_1', new Date('2026-01-01T00:00:00Z'));
		const orders = new InMemoryOrders();

		expect(await orders.save(order)).toEqual(ok());

		const found = await orders.findById(new OrderId('o1'));

		expect(found?.equals(order)).toBe(true);
		expect(found?.total).toBe(42);
		expect(await orders.findById(new OrderId('o2'))).toBeUndefined();
		expect(await orders.countPlaced()).toBe(1);
		expect(orders).toBeInstanceOf(Orders);
		expect(orders).toBeInstanceOf(CommandRepository);
		expect(orders).toBeInstanceOf(Port);
	});

	it('finds by the identifier of its aggregate', () => {
		const orders = new InMemoryOrders();
		// @ts-expect-error
		const byOtherId = orders.findById(new CustomerId('c1'));

		expect(byOtherId).toBeInstanceOf(Promise);
	});

	it('returns in a Result the refusals the storage enforces, and none by default', () => {
		const refused: Awaited<ReturnType<CommandRepository<Order, OrderAlreadyPlaced>['save']>> = err(
			new OrderAlreadyPlaced(),
		);
		// @ts-expect-error
		const refusedByDefault: Awaited<ReturnType<Orders['save']>> = err(new OrderAlreadyPlaced());

		expect(refused.ok).toBe(false);
		expect(refusedByDefault.ok).toBe(false);
	});

	it('holds an aggregate', () => {
		// @ts-expect-error
		const ofString: CommandRepository<string> | undefined = undefined;

		expect(ofString).toBeUndefined();
	});
});
