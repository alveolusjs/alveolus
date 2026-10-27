import type { Result } from '../../utilities/result/index.ts';

export class RolledBack extends Error {
	public readonly result: Result<unknown, unknown>;

	public constructor(result: Result<unknown, unknown>) {
		super('The work returned a refusal: the transaction is rolled back');
		this.name = 'RolledBack';
		this.result = result;
	}
}
