import { describe, expect, it } from 'vitest';

import { TestApp } from './support/test-app.ts';

const app = TestApp.reference();

describe('LAY-02 with dependency-cruiser', () => {
	it('reports a cycle between two modules of a layer, though no file imports itself back', () => {
		const project = app.with(
			'src/wallets/internal/domain/holder/holder.entity.ts',
			`import type { Wallet } from '../wallet/wallet.aggregate.ts';`,
		);

		expect(project.dependencyCruiser()).toEqual([
			'LAY-02 src/wallets/internal/domain/holder → src/wallets/internal/domain/wallet',
			'LAY-02 src/wallets/internal/domain/wallet → src/wallets/internal/domain/holder',
		]);
	});

	it('reports a cycle of three modules', () => {
		const project = app
			.with(
				'src/wallets/internal/domain/holder/holder.entity.ts',
				`import type { Limit } from '../limit/limit.value-object.ts';`,
			)
			.with(
				'src/wallets/internal/domain/limit/limit.value-object.ts',
				`import type { Wallet } from '../wallet/wallet.aggregate.ts';`,
			);

		expect(project.dependencyCruiser()).toEqual([
			'LAY-02 src/wallets/internal/domain/holder → src/wallets/internal/domain/limit',
			'LAY-02 src/wallets/internal/domain/limit → src/wallets/internal/domain/wallet',
			'LAY-02 src/wallets/internal/domain/wallet → src/wallets/internal/domain/holder',
		]);
	});

	it('reports a cycle between two technologies of driving', () => {
		const project = app
			.with(
				'src/wallets/internal/driving/http/wallet.filter.ts',
				`import type { Relay } from '../outbox/wallet.relay.ts';`,
			)
			.with(
				'src/wallets/internal/driving/outbox/wallet.relay.ts',
				`import type { Filter } from '../http/wallet.filter.ts';`,
			);

		expect(project.dependencyCruiser()).toEqual([
			'LAY-02 src/wallets/internal/driving/http → src/wallets/internal/driving/outbox',
			'LAY-02 src/wallets/internal/driving/outbox → src/wallets/internal/driving/http',
		]);
	});

	it('reports a cycle between two technologies of shared, which has no internal folder', () => {
		const project = app
			.with(
				'src/shared/driven/prisma/prisma.unit-of-work.ts',
				`import type { Relay } from '../outbox/outbox.relay.ts';`,
			)
			.with(
				'src/shared/driven/outbox/outbox.relay.ts',
				`import type { PrismaUnitOfWork } from '../prisma/prisma.unit-of-work.ts';`,
			);

		expect(project.dependencyCruiser()).toEqual([
			'LAY-02 src/shared/driven/outbox → src/shared/driven/prisma',
			'LAY-02 src/shared/driven/prisma → src/shared/driven/outbox',
		]);
	});

	it('leaves a module and its own sub-module', () => {
		const project = app
			.with(
				'src/wallets/internal/domain/wallet/wallet.events.ts',
				`import type { Limit } from './limit/limit.value-object.ts';`,
			)
			.with(
				'src/wallets/internal/domain/wallet/limit/limit.value-object.ts',
				`import type { Wallet } from '../wallet.aggregate.ts';`,
			);

		expect(project.dependencyCruiser()).toEqual([]);
	});
});
