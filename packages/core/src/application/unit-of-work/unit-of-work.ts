import { Port } from "../../domain/ports/index.ts";
import type { Result } from "../../utilities/result/index.ts";
import type { Transaction } from "./transaction.ts";

export abstract class UnitOfWork extends Port {
	public async run<T, E>(work: () => Promise<Result<T, E>>): Promise<Result<T, E>> {
		const transaction = await this.begin();
		let result: Result<T, E>;

		try {
			result = await work();
		} catch (error) {
			await transaction.rollback();
			throw error;
		}

		if (result.ok) {
			await transaction.commit();
		} else {
			await transaction.rollback();
		}

		return result;
	}

	protected abstract begin(): Promise<Transaction>;
}
