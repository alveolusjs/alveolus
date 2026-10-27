import { describe, expect, it } from 'vitest';

import { lay02, lay04 } from '../rules.ts';
import { TestApp } from './support/test-app.ts';

const app = TestApp.reference();

describe('the dependency-cruiser reporter', () => {
	it('frames the import that breaks a rule, as oxlint does', () => {
		const { output, status } = app
			.with(
				'src/notifications/application/notification/notify.ts',
				[
					`import type { Clock } from '@alveolus/core';`,
					`\timport { Wallet } from '../../../wallets/domain/wallet/wallet.aggregate.ts';`,
					'',
				].join('\n'),
			)
			.dependencyCruiserReport();

		expect(output).toBe(
			[
				`  × LAY-04: ${lay04.title}`,
				'   ╭─[src/notifications/application/notification/notify.ts:2:25]',
				` 1 │ import type { Clock } from '@alveolus/core';`,
				` 2 │     import { Wallet } from '../../../wallets/domain/wallet/wallet.aggregate.ts';`,
				'   ·                            ──────────────────────────┬─────────────────────────',
				'   ·                                                      ╰── src/wallets/domain/wallet/wallet.aggregate.ts',
				' 3 │',
				'   ╰────',
				`  help: ${lay04.url}`,
				'',
				'Found 0 warnings and 1 error.',
				'',
			].join('\n'),
		);
		expect(status).toBe(1);
	});

	it('shows a cycle once, through each of its modules', () => {
		const { output, status } = app
			.with(
				'src/wallets/domain/holder/holder.entity.ts',
				`import type { Limit } from '../limit/limit.value-object.ts';`,
			)
			.with(
				'src/wallets/domain/limit/limit.value-object.ts',
				`import type { Wallet } from '../wallet/wallet.aggregate.ts';`,
			)
			.dependencyCruiserReport();

		expect(output.match(/LAY-02/g)).toHaveLength(1);
		expect(output).toContain(`  × LAY-02: ${lay02.title}\n  │ src/wallets/domain/`);
		expect(output).toContain('src/wallets/domain/holder');
		expect(output).toContain('src/wallets/domain/limit');
		expect(output).toContain('Found 0 warnings and 1 error.');
		expect(status).toBe(1);
	});

	it('says nothing is wrong, and exits with 0, when no rule is broken', () => {
		expect(app.dependencyCruiserReport()).toEqual({ output: 'Found 0 warnings and 0 errors.\n', status: 0 });
	});
});
