import { Port } from '../../domain/ports/index.ts';
import type { Result } from '../../utilities/result/index.ts';
import { NestedWorkRefused } from './nested-work-refused.ts';
import { RolledBack } from './rolled-back.ts';
import { TransactionScope } from './transaction-scope.ts';

export abstract class UnitOfWork extends Port {
	public async run<T, E>(work: () => Promise<Result<T, E>>): Promise<Result<T, E>> {
		const open = this.current();

		if (open !== undefined) {
			const result = await work();

			if (!result.ok) {
				open.refuse();
			}

			return result;
		}

		const scope = new TransactionScope();

		try {
			return await this.transaction(scope, async () => {
				const result = await work();

				if (!result.ok) {
					throw new RolledBack(result);
				}

				if (scope.refused) {
					throw new NestedWorkRefused();
				}

				return result;
			});
		} catch (error) {
			if (error instanceof RolledBack) {
				return error.result as Result<T, E>;
			}

			throw error;
		}
	}

	protected abstract current(): TransactionScope | undefined;

	protected abstract transaction<R>(scope: TransactionScope, work: () => Promise<R>): Promise<R>;
}
