import type { AnyDomainError } from "../../domain/domain-errors/index.ts";
import type { Result } from "../../utilities/result/index.ts";

export abstract class QueryHandler<Input, Output, Error extends AnyDomainError = never> {
	public abstract handle(query: Input): Promise<Result<Output, Error>>;
}
