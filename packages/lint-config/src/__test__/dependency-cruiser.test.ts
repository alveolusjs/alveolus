import { describe, expect, it } from 'vitest';

import { TestApp } from './support/test-app.ts';

const app = TestApp.reference();

describe('LAY-02 with dependency-cruiser', () => {
	it('reports a cycle between two modules of a layer, though no file imports itself back', () => {
		const project = app.with(
			'src/wallets/domain/holder/holder.entity.ts',
			`import type { Wallet } from '../wallet/wallet.aggregate.ts';`,
		);

		expect(project.dependencyCruiser()).toEqual([
			'LAY-02 src/wallets/domain/holder → src/wallets/domain/wallet',
			'LAY-02 src/wallets/domain/wallet → src/wallets/domain/holder',
		]);
	});

	it('reports a cycle of three modules', () => {
		const project = app
			.with(
				'src/wallets/domain/holder/holder.entity.ts',
				`import type { Limit } from '../limit/limit.value-object.ts';`,
			)
			.with(
				'src/wallets/domain/limit/limit.value-object.ts',
				`import type { Wallet } from '../wallet/wallet.aggregate.ts';`,
			);

		expect(project.dependencyCruiser()).toEqual([
			'LAY-02 src/wallets/domain/holder → src/wallets/domain/limit',
			'LAY-02 src/wallets/domain/limit → src/wallets/domain/wallet',
			'LAY-02 src/wallets/domain/wallet → src/wallets/domain/holder',
		]);
	});

	it('reports a cycle between two technologies of driving', () => {
		const project = app
			.with(
				'src/wallets/driving/http/wallet.filter.ts',
				`import type { Relay } from '../outbox/wallet.relay.ts';`,
			)
			.with(
				'src/wallets/driving/outbox/wallet.relay.ts',
				`import type { Filter } from '../http/wallet.filter.ts';`,
			);

		expect(project.dependencyCruiser()).toEqual([
			'LAY-02 src/wallets/driving/http → src/wallets/driving/outbox',
			'LAY-02 src/wallets/driving/outbox → src/wallets/driving/http',
		]);
	});

	it('leaves a module and its own sub-module', () => {
		const project = app
			.with(
				'src/wallets/domain/wallet/wallet.events.ts',
				`import type { Limit } from './limit/limit.value-object.ts';`,
			)
			.with(
				'src/wallets/domain/wallet/limit/limit.value-object.ts',
				`import type { Wallet } from '../wallet.aggregate.ts';`,
			);

		expect(project.dependencyCruiser()).toEqual([]);
	});
});
