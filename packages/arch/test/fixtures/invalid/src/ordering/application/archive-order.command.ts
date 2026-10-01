import { ok } from "@alveolus/core";
import type { CommandHandler, Result } from "@alveolus/core";

export class ArchiveOrderHandler implements CommandHandler<{ orderId: string }> {
	public async handle(): Promise<Result<void, never>> {
		return ok();
	}
}
