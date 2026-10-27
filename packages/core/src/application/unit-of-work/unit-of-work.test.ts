import { describe, expect, it } from 'vitest';

import { InvalidTotal } from '../../../test/fixtures/application.ts';
import { RecordingUnitOfWork } from '../../../test/fixtures/utilities.ts';
import { Port } from '../../domain/ports/index.ts';
import { err, ok } from '../../utilities/result/index.ts';
import { NestedWorkRefused } from './nested-work-refused.ts';
import { UnitOfWork } from './unit-of-work.ts';

describe('UnitOfWork', () => {
	it('commits when the work succeeds and returns its result', async () => {
		const unitOfWork = new RecordingUnitOfWork();

		expect(await unitOfWork.run(() => Promise.resolve(ok(42)))).toEqual(ok(42));
		expect(unitOfWork.log).toEqual(['tx1:begin', 'tx1:commit']);
		expect(unitOfWork).toBeInstanceOf(UnitOfWork);
		expect(unitOfWork).toBeInstanceOf(Port);
	});

	it('rolls back when the work returns an error', async () => {
		const unitOfWork = new RecordingUnitOfWork();
		const failure = err(new InvalidTotal({ total: 0 }));

		expect(await unitOfWork.run(() => Promise.resolve(failure))).toBe(failure);
		expect(unitOfWork.log).toEqual(['tx1:begin', 'tx1:rollback']);
	});

	it('rolls back and rethrows when the work throws', async () => {
		const unitOfWork = new RecordingUnitOfWork();

		await expect(unitOfWork.run(() => Promise.reject(new Error('bug')))).rejects.toThrow('bug');
		expect(unitOfWork.log).toEqual(['tx1:begin', 'tx1:rollback']);
	});

	it('joins the open transaction from a nested run, and commits once', async () => {
		const unitOfWork = new RecordingUnitOfWork();

		const result = await unitOfWork.run(async () => {
			const nested = await unitOfWork.run(() => Promise.resolve(ok(1)));

			return nested.ok ? ok(nested.value + 1) : nested;
		});

		expect(result).toEqual(ok(2));
		expect(unitOfWork.log).toEqual(['tx1:begin', 'tx1:commit']);
	});

	it('rolls back when the work returns the refusal of a nested run', async () => {
		const unitOfWork = new RecordingUnitOfWork();
		const failure = err(new InvalidTotal({ total: 0 }));

		const result = await unitOfWork.run(async () => {
			const nested = await unitOfWork.run(() => Promise.resolve(failure));

			return nested.ok ? ok() : nested;
		});

		expect(result).toBe(failure);
		expect(unitOfWork.log).toEqual(['tx1:begin', 'tx1:rollback']);
	});

	it('rolls back and throws when the work succeeds after a nested run refused', async () => {
		const unitOfWork = new RecordingUnitOfWork();

		const run = unitOfWork.run(async () => {
			await unitOfWork.run(() => Promise.resolve(err(new InvalidTotal({ total: 0 }))));

			return ok();
		});

		await expect(run).rejects.toBeInstanceOf(NestedWorkRefused);
		expect(unitOfWork.log).toEqual(['tx1:begin', 'tx1:rollback']);
	});

	it('rolls back when a nested run throws', async () => {
		const unitOfWork = new RecordingUnitOfWork();

		const run = unitOfWork.run(() => unitOfWork.run(() => Promise.reject(new Error('bug'))));

		await expect(run).rejects.toThrow('bug');
		expect(unitOfWork.log).toEqual(['tx1:begin', 'tx1:rollback']);
	});

	it('opens one transaction per run', async () => {
		const unitOfWork = new RecordingUnitOfWork();

		await Promise.all([unitOfWork.run(() => Promise.resolve(ok())), unitOfWork.run(() => Promise.resolve(ok()))]);

		expect(unitOfWork.log.toSorted()).toEqual(['tx1:begin', 'tx1:commit', 'tx2:begin', 'tx2:commit']);
	});
});
