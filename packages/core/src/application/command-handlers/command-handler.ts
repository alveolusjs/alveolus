import type { AnyDomainError } from "../../domain/domain-errors/index.ts";
import type { Result } from "../../utilities/result/index.ts";

export abstract class CommandHandler<Input, Output = void, Error extends AnyDomainError = never> {
	public abstract handle(command: Input): Promise<Result<Output, Error>>;
}
