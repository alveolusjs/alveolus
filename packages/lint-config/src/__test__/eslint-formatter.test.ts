import { describe, expect, it } from 'vitest';

import { wir05 } from '../rules.ts';
import { TestApp } from './support/test-app.ts';

const app = TestApp.reference();

describe('the ESLint formatter', () => {
	it('frames what breaks a rule of Alveolus, with the title and the url of the rule', () => {
		const { output, status } = app
			.with(
				'src/wallets/application/wallet/withdraw.command.ts',
				[
					`import type { Clock } from '@alveolus/core';`,
					`import { Injectable } from '@nestjs/common';`,
					'',
				].join('\n'),
			)
			.eslintReport();

		expect(output).toBe(
			[
				`  × WIR-05: ${wir05.title}`,
				'   ╭─[src/wallets/application/wallet/withdraw.command.ts:2:10]',
				` 1 │ import type { Clock } from '@alveolus/core';`,
				` 2 │ import { Injectable } from '@nestjs/common';`,
				'   ·          ─────┬────',
				`   ·               ╰── 'Injectable' import from '@nestjs/common' is restricted`,
				' 3 │',
				'   ╰────',
				`  help: ${wir05.url}`,
				'',
				'Found 0 warnings and 1 error.',
				'',
			].join('\n'),
		);
		expect(status).toBe(1);
	});

	it('frames any other message with the id of its rule', () => {
		const { output } = app.with('src/wallets/application/wallet/broken.ts', 'const = ;\n').eslintReport();

		expect(output).toContain('  × eslint: Parsing error');
		expect(output).toContain('src/wallets/application/wallet/broken.ts:1:6');
	});

	it('says nothing is wrong, and exits with 0, when no rule is broken', () => {
		expect(app.eslintReport()).toEqual({ output: 'Found 0 warnings and 0 errors.\n', status: 0 });
	});
});
