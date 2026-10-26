import { describe, expect, it } from 'vitest';

import { TestProject } from '../../__test__/support/test-project.ts';

const app = TestProject.app();
const notify = 'src/notifications/application/notify.ts';
const walletImport = `import { Wallet } from '../../wallets/domain/wallet.aggregate.ts';`;
const outsidePublic = 'imports src/wallets/domain/wallet.aggregate.ts, outside src/wallets/public';

describe('waivers', () => {
	it('cover a violation on the line below, and list it with its reason', () => {
		const fitness = app
			.with(notify, `// waiver LAY-04: the report reads wallets directly, see ADR-0007\n${walletImport}`)
			.fitness();

		expect(fitness.check('LAY-04')).toEqual([]);
		expect(fitness.waivers('LAY-04')).toMatchObject([
			{
				code: 'LAY-04',
				file: notify,
				line: 2,
				message: outsidePublic,
				reason: 'the report reads wallets directly, see ADR-0007',
			},
		]);
	});

	it('cover a violation on their own line', () => {
		const fitness = app.with(notify, `${walletImport} // waiver LAY-04: migrating, see ADR-0007`).fitness();

		expect(fitness.check('LAY-04')).toEqual([]);
		expect(fitness.waivers('LAY-04')).toHaveLength(1);
	});

	it('cover nothing further down, and say they cover no violation', () => {
		const project = app.with(notify, `// waiver LAY-04: migrating\n\n${walletImport}`);

		expect(project.check('LAY-04').map(String)).toEqual([
			`${notify}:3 LAY-04 ${outsidePublic}`,
			`${notify}:1 LAY-04 waiver LAY-04 covers no violation: remove it`,
		]);
	});

	it('cover nothing without a reason, and ask for one', () => {
		const project = app.with(notify, `// waiver LAY-04\n${walletImport}`);

		expect(project.check('LAY-04').map(String)).toEqual([
			`${notify}:2 LAY-04 ${outsidePublic}`,
			`${notify}:1 LAY-04 waiver LAY-04 gives no reason: say why, and cite the ADR when it is structural`,
		]);
	});

	it('cover only the rule they cite', () => {
		const project = app.with(notify, `// waiver LAY-02: another rule\n${walletImport}`);

		expect(project.check('LAY-04').map(String)).toEqual([`${notify}:2 LAY-04 ${outsidePublic}`]);
	});

	it('of a rule without a fitness function are left to review', () => {
		const project = app.with(
			'src/wallets/domain/holder.ts',
			'// waiver AGG-03: lazy loading, see ADR-0008\nexport const holder = 1;',
		);

		expect(project.check('LAY-04')).toEqual([]);
	});
});
