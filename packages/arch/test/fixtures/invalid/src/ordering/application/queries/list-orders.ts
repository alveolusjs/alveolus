import { ok } from "@alveolus/core";
import type { QueryHandler, Result } from "@alveolus/core";

export class ListOrdersHandler implements QueryHandler<{ customerId: string }, readonly string[]> {
	public async handle(): Promise<Result<readonly string[], never>> {
		return ok([]);
	}
}
