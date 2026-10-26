import { describe, expect, it } from 'vitest';

import { TestApp } from './support/test-app.ts';

const app = TestApp.reference();
const notify = 'src/notifications/application/notification/notify.ts';
const wallet = 'src/wallets/domain/wallet/wallet.aggregate.ts';

describe('LAY-04 with dependency-cruiser', () => {
	it('reports an import of another bounded context outside its public folder, however it is written', () => {
		const project = app
			.with(notify, `import { Wallet } from '../../../wallets/domain/wallet/wallet.aggregate.ts';`)
			.with(
				'src/notifications/application/notification/alias.ts',
				`import { DepositHandler } from '@wallets/application/wallet/deposit.command.ts';`,
			)
			.with(
				'src/notifications/application/notification/type-only.ts',
				`import type { WalletRepository } from '../../../wallets/domain/wallet/wallet.repository.ts';`,
			)
			.with(
				'src/notifications/driving/http/loader.ts',
				`export const load = () => import('../../../wallets/domain/holder/holder.id.ts');`,
			)
			.with(
				'src/notifications/driven/prisma/wallet.ts',
				`export { Wallet } from '../../../wallets/domain/wallet/wallet.aggregate.ts';`,
			);

		expect(project.dependencyCruiser()).toEqual([
			'LAY-04 src/notifications/application/notification/alias.ts → src/wallets/application/wallet/deposit.command.ts',
			'LAY-04 src/notifications/application/notification/notify.ts → src/wallets/domain/wallet/wallet.aggregate.ts',
			'LAY-04 src/notifications/application/notification/type-only.ts → src/wallets/domain/wallet/wallet.repository.ts',
			'LAY-04 src/notifications/driven/prisma/wallet.ts → src/wallets/domain/wallet/wallet.aggregate.ts',
			'LAY-04 src/notifications/driving/http/loader.ts → src/wallets/domain/holder/holder.id.ts',
		]);
	});

	it('reports an import written with the .js extension of a .ts file', () => {
		const project = app.with(
			notify,
			`import { Wallet } from '../../../wallets/domain/wallet/wallet.aggregate.js';`,
		);

		expect(project.dependencyCruiser()).toEqual([`LAY-04 ${notify} → ${wallet}`]);
	});

	it('reports a module of a bounded context importing the module of another', () => {
		const project = app.with(
			'src/notifications/notifications.module.ts',
			`import { WalletsModule } from '../wallets/wallets.module.ts';\n\nexport const modules = [WalletsModule];`,
		);

		expect(project.dependencyCruiser()).toEqual([
			'LAY-04 src/notifications/notifications.module.ts → src/wallets/wallets.module.ts',
		]);
	});

	it('leaves public, shared, and the files of src that sit in no bounded context', () => {
		const project = app
			.with(notify, `import type { WalletDto } from '../../../wallets/public/wallet.dto.ts';`)
			.with(
				'src/shared/driven/prisma/wallet.seed.ts',
				`import { Wallet } from '../../../wallets/domain/wallet/wallet.aggregate.ts';`,
			);

		expect(project.dependencyCruiser()).toEqual([]);
	});
});

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

describe('LAY-01 with dependency-cruiser', () => {
	it('reports the domain or the application importing an adapter', () => {
		const project = app
			.with(
				'src/wallets/application/wallet/withdraw.command.ts',
				`import { PrismaWalletRepository } from '../../driven/prisma/prisma-wallet.repository.ts';`,
			)
			.with(
				'src/wallets/domain/wallet/wallet.events.ts',
				`import type { WalletController } from '../../driving/http/wallet.controller.ts';`,
			);

		expect(project.dependencyCruiser()).toEqual([
			'LAY-01 src/wallets/application/wallet/withdraw.command.ts → src/wallets/driven/prisma/prisma-wallet.repository.ts',
			'LAY-01 src/wallets/domain/wallet/wallet.events.ts → src/wallets/driving/http/wallet.controller.ts',
		]);
	});
});

describe('PUB-01 with dependency-cruiser', () => {
	it('reports a public file importing the inside of its own bounded context', () => {
		const project = app
			.with(
				'src/wallets/public/wallet.dto.ts',
				`export type { Wallet } from '../domain/wallet/wallet.aggregate.ts';`,
			)
			.with(
				'src/wallets/public/deposit.contract.ts',
				`import type { DepositHandler } from '../application/wallet/deposit.command.ts';`,
			);

		expect(project.dependencyCruiser()).toEqual([
			'PUB-01 src/wallets/public/deposit.contract.ts → src/wallets/application/wallet/deposit.command.ts',
			'PUB-01 src/wallets/public/wallet.dto.ts → src/wallets/domain/wallet/wallet.aggregate.ts',
		]);
	});
});
