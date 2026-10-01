import type { AnyDomainError } from "../../domain/domain-errors/index.ts";
import type { Result } from "../../utilities/result/index.ts";

/**
 * Application service that handles one query: a request to read data, without side effects.
 *
 * The handler returns what the caller needs to read, usually a plain object shaped for it rather
 * than an aggregate. Expected failures are returned as a {@link DomainError} in the `Result`.
 *
 * @typeParam Input - The query: the data the handler needs.
 * @typeParam Output - What a success returns.
 * @typeParam Error - Union of the {@link DomainError}s the handler can return. Defaults to `never`.
 *
 * @example
 * ```ts
 * class GetOrderHandler implements QueryHandler<GetOrder, OrderView, OrderNotFound> {
 *   async handle({ orderId }: GetOrder): Promise<Result<OrderView, OrderNotFound>> {
 *     const view = await this.views.findById(orderId);
 *     if (view === undefined) return err(new OrderNotFound({ id: orderId }));
 *     return ok(view);
 *   }
 * }
 * ```
 *
 * @see {@link https://alveolusjs.github.io/alveolus/core/application/query-handlers | Query handlers}
 */
export interface QueryHandler<Input, Output, Error extends AnyDomainError = never> {
	handle(query: Input): Promise<Result<Output, Error>>;
}
