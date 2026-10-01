import { ok } from "@alveolus/core";
import type { QueryHandler, Result } from "@alveolus/core";

export class CountOrdersHandler implements QueryHandler<{ customerId: string }, number> {
	public async handle(): Promise<Result<number, never>> {
		return ok(0);
	}
}
