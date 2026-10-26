import { describe, expect, it } from 'vitest';

import { TestProject } from './support/test-project.ts';

const fitness = TestProject.app()
	.with('src/notifications/domain/holder.ts', `import { Wallet } from '../../wallets/domain/wallet.aggregate.ts';`)
	.fitness();

describe('FitnessFunctions', () => {
	it('describes an automated rule: its page, its styles and what it covers', () => {
		expect(fitness.rule('LAY-04')).toEqual({
			code: 'LAY-04',
			title: 'Un autre bounded context n’entre que par `public`, qui ne contient que le contrat',
			url: 'https://alveolus.dev/rules/architecture-and-placement/layers/lay-04',
			styles: ['tactical', 'transaction-script'],
			coverage: 'partial',
			checks: 'Imports of another bounded context outside its public folder: static, type-only, re-exported or dynamic with a literal path.',
		});
	});

	it('links each violation to the page of its rule', () => {
		const [violation] = fitness.check('LAY-04');
		const { code, title, url } = fitness.rule('LAY-04');

		expect(violation).toMatchObject({ code, title, url });
	});

	it('refuses a rule that has no fitness function yet', () => {
		expect(() => fitness.check('AGG-06')).toThrow('AGG-06 has no fitness function yet');
	});
});
