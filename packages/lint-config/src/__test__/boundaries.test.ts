import { describe, expect, it } from 'vitest';

import { lay01, lay04, pub01 } from '../rules.ts';
import { TestApp } from './support/test-app.ts';

const app = TestApp.reference();
const notify = 'src/notifications/application/notification/notify.ts';

describe('LAY-04 with ESLint', () => {
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

		expect(project.eslint(lay04)).toEqual([
			`src/notifications/application/notification/alias.ts:1 ${lay04.describe()}`,
			`src/notifications/application/notification/notify.ts:1 ${lay04.describe()}`,
			`src/notifications/application/notification/type-only.ts:1 ${lay04.describe()}`,
			`src/notifications/driven/prisma/wallet.ts:1 ${lay04.describe()}`,
			`src/notifications/driving/http/loader.ts:1 ${lay04.describe()}`,
		]);
	});

	it('names the file the import reaches', () => {
		const project = app.with(
			notify,
			`import { Wallet } from '../../../wallets/domain/wallet/wallet.aggregate.js';`,
		);

		expect(project.eslintMessages().filter((message) => message.includes('LAY-04'))).toEqual([
			`${notify}:1 reaches src/wallets/domain/wallet/wallet.aggregate.ts. ${lay04.describe()}`,
		]);
	});

	it('reports a module of a bounded context importing the module of another', () => {
		const project = app.with(
			'src/notifications/notifications.module.ts',
			`import { WalletsModule } from '../wallets/wallets.module.ts';\n\nexport const modules = [WalletsModule];`,
		);

		expect(project.eslint(lay04)).toEqual([`src/notifications/notifications.module.ts:1 ${lay04.describe()}`]);
	});

	it('leaves public, shared, packages, tests and the files of src that sit in no bounded context', () => {
		const project = app
			.with(notify, `import type { WalletDto } from '../../../wallets/public/wallet.dto.ts';`)
			.with(
				'src/shared/driven/prisma/wallet.seed.ts',
				`import { Wallet } from '../../../wallets/domain/wallet/wallet.aggregate.ts';`,
			)
			.with(
				'src/notifications/application/notification/__test__/notify.spec.ts',
				`import { Wallet } from '../../../../wallets/domain/wallet/wallet.aggregate.ts';`,
			)
			.with('src/notifications/application/notification/clock.ts', `import { Clock } from '@alveolus/core';`);

		expect(project.eslint(lay04)).toEqual([]);
	});
});

describe('LAY-01 with ESLint', () => {
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

		expect(project.eslint(lay01)).toEqual([
			`src/wallets/application/wallet/withdraw.command.ts:1 ${lay01.describe()}`,
			`src/wallets/domain/wallet/wallet.events.ts:1 ${lay01.describe()}`,
		]);
	});
});

describe('PUB-01 with ESLint', () => {
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

		expect(project.eslint(pub01)).toEqual([
			`src/wallets/public/deposit.contract.ts:1 ${pub01.describe()}`,
			`src/wallets/public/wallet.dto.ts:1 ${pub01.describe()}`,
		]);
	});
});
