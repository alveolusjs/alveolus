export class NestedWorkRefused extends Error {
	public constructor() {
		super('A nested unit of work refused, yet the work around it succeeded: the transaction is rolled back');
		this.name = 'NestedWorkRefused';
	}
}
