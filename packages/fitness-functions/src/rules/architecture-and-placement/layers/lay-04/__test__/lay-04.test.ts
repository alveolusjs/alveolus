import { describe, expect, it } from 'vitest';

import { TestProject } from '../../../../../__test__/support/test-project.ts';

const app = TestProject.app();
const outsidePublic = 'LAY-04 imports src/wallets/domain/wallet.aggregate.ts, outside src/wallets/public';
const withLegacy = app
	.with(
		'architecture.json',
		`{
	"contexts": {
		"wallets": "tactical",
		"notifications": "transaction-script",
		"legacy": { "style": "big-ball-of-mud", "path": "legacy" },
		"reports": { "style": "transaction-script", "path": "modules/reports" }
	}
}`,
	)
	.with(
		'legacy/users.ts',
		`import { Wallet } from '../src/wallets/domain/wallet.aggregate.ts';\n\nexport const users = [Wallet];`,
	)
	.with('modules/reports/application/report.service.ts', 'export class ReportService {}');

describe('LAY-04', () => {
	it('reports a relative import of another bounded context', () => {
		const project = app.with(
			'src/notifications/application/notify.ts',
			`import { Wallet } from '../../wallets/domain/wallet.aggregate.ts';`,
		);

		expect(project.check('LAY-04').map(String)).toEqual([
			`src/notifications/application/notify.ts:1 ${outsidePublic}`,
		]);
	});

	it('reports an import through a tsconfig alias', () => {
		const project = app.with(
			'src/notifications/application/notify.ts',
			`import { Deposit } from '@wallets/application/deposit.command.ts';`,
		);

		expect(project.check('LAY-04').map(String)).toEqual([
			'src/notifications/application/notify.ts:1 LAY-04 imports src/wallets/application/deposit.command.ts, outside src/wallets/public',
		]);
	});

	it('reports an import written with the .js extension of a .ts file', () => {
		const project = app.with(
			'src/notifications/application/notify.ts',
			`import { Wallet } from '../../wallets/domain/wallet.aggregate.js';`,
		);

		expect(project.check('LAY-04').map(String)).toEqual([
			`src/notifications/application/notify.ts:1 ${outsidePublic}`,
		]);
	});

	it('reports a type-only import', () => {
		const project = app.with(
			'src/notifications/domain/holder.ts',
			`import type { Wallet } from '../../wallets/domain/wallet.aggregate.ts';`,
		);

		expect(project.check('LAY-04').map(String)).toEqual([`src/notifications/domain/holder.ts:1 ${outsidePublic}`]);
	});

	it('reports a re-export', () => {
		const project = app.with(
			'src/notifications/driven/wallet.ts',
			`export { Wallet } from '../../wallets/domain/wallet.aggregate.ts';`,
		);

		expect(project.check('LAY-04').map(String)).toEqual([`src/notifications/driven/wallet.ts:1 ${outsidePublic}`]);
	});

	it('reports a dynamic import with a literal path, on its line', () => {
		const project = app.with(
			'src/notifications/driving/loader.ts',
			`export const greeting = 'déjà vu';\n\nexport const load = () => import('../../wallets/domain/wallet.aggregate.ts');`,
		);

		expect(project.check('LAY-04').map(String)).toEqual([`src/notifications/driving/loader.ts:3 ${outsidePublic}`]);
	});

	it('reports a file at the root of a bounded context', () => {
		const project = app.with(
			'src/notifications/wallet.provider.ts',
			`import { Wallet } from '../wallets/domain/wallet.aggregate.ts';`,
		);

		expect(project.check('LAY-04').map(String)).toEqual([
			`src/notifications/wallet.provider.ts:1 ${outsidePublic}`,
		]);
	});

	it('leaves out the __test__ folders', () => {
		const project = app.with(
			'src/notifications/__test__/notify-holder.spec.ts',
			`import { Wallet } from '../../wallets/domain/wallet.aggregate.ts';`,
		);

		expect(project.check('LAY-04')).toEqual([]);
	});

	it('reports an import of a bounded context declared outside src', () => {
		const project = withLegacy.with(
			'src/notifications/application/notify.ts',
			`import { ReportService } from '../../../modules/reports/application/report.service.ts';`,
		);

		expect(project.check('LAY-04').map(String)).toEqual([
			'src/notifications/application/notify.ts:1 LAY-04 imports modules/reports/application/report.service.ts, outside modules/reports/public',
		]);
	});

	it('leaves the big ball of mud to MAP-04, from the outside and from the inside', () => {
		const project = withLegacy.with(
			'src/notifications/driven/legacy-users.ts',
			`import { users } from '../../../legacy/users.ts';\n\nexport const legacyUsers = users;`,
		);

		expect(project.check('LAY-04')).toEqual([]);
	});
});
