import { describe, expect, it } from 'vitest';

import { Architecture } from '../architecture.ts';
import { BoundedContext } from '../bounded-context.ts';

const architecture = new Architecture([
	new BoundedContext('wallets', 'tactical', 'src/wallets'),
	new BoundedContext('notifications', 'transaction-script', 'src/notifications'),
	new BoundedContext('legacy', 'big-ball-of-mud', 'legacy/app'),
	new BoundedContext('reports', 'transaction-script', 'legacy/app/reports'),
]);

describe('Architecture', () => {
	it('places a file in its bounded context and its folder', () => {
		const placement = architecture.placementOf('src/wallets/domain/wallet.aggregate.ts');

		expect(placement?.context.name).toBe('wallets');
		expect(placement?.folder).toBe('domain');
	});

	it('places a file at the root of a bounded context in no folder', () => {
		expect(architecture.placementOf('src/wallets/wallets.module.ts')?.folder).toBeUndefined();
	});

	it('places shared and root files in no bounded context', () => {
		expect(architecture.placementOf('src/shared/money.ts')).toBeUndefined();
		expect(architecture.placementOf('src/main.ts')).toBeUndefined();
	});

	it('places a file in the innermost bounded context that holds it', () => {
		expect(architecture.placementOf('legacy/app/reports/application/report.ts')?.context.name).toBe('reports');
	});

	it('reads src and every bounded context declared outside it', () => {
		expect(architecture.sourceFolders()).toEqual(['src', 'legacy/app', 'legacy/app/reports']);
	});

	it('checks a file of a bounded context only against the rules of its style', () => {
		expect(architecture.checks('src/wallets/domain/wallet.aggregate.ts', ['tactical'])).toBe(true);
		expect(architecture.checks('src/notifications/application/notify.ts', ['tactical'])).toBe(false);
	});

	it('checks shared and root files against every rule', () => {
		expect(architecture.checks('src/shared/money.ts', ['tactical'])).toBe(true);
		expect(architecture.checks('src/main.ts', ['transaction-script'])).toBe(true);
	});

	it('never checks a big ball of mud from the inside', () => {
		expect(architecture.checks('legacy/app/users.ts', ['tactical', 'transaction-script'])).toBe(false);
	});
});
