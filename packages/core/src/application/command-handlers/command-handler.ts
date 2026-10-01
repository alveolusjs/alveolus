import type { AnyDomainError } from "../../domain/domain-errors/index.ts";
import type { Result } from "../../utilities/result/index.ts";

/**
 * Application service that handles one command: a request to change the system, named in the
 * imperative (`PlaceOrder`).
 *
 * The handler loads the aggregates, calls them, saves them and publishes their domain events.
 * Expected business failures are returned as a {@link DomainError} in the `Result`; technical
 * failures, such as a {@link ConcurrencyError}, are thrown. Whether a command returns data, such
 * as the identifier of what it created, is up to the team.
 *
 * @typeParam Input - The command: the data the handler needs.
 * @typeParam Output - What a success returns. Defaults to `void`.
 * @typeParam Error - Union of the {@link DomainError}s the handler can return. Defaults to `never`.
 *
 * @example
 * ```ts
 * class PlaceOrderHandler implements CommandHandler<PlaceOrder, void, OrderNotFound | InvalidTotal> {
 *   async handle({ orderId, total }: PlaceOrder): Promise<Result<void, OrderNotFound | InvalidTotal>> {
 *     const order = await this.orders.findById(new OrderId(orderId));
 *     if (order === undefined) return err(new OrderNotFound({ id: orderId }));
 *     const placed = order.place(total, new Date());
 *     if (!placed.ok) return placed;
 *     await this.orders.save(order);
 *     await this.publisher.publish(order.pullDomainEvents());
 *     return ok();
 *   }
 * }
 * ```
 *
 * @see {@link https://alveolusjs.github.io/alveolus/core/application/command-handlers | Command handlers}
 */
export interface CommandHandler<Input, Output = void, Error extends AnyDomainError = never> {
	handle(command: Input): Promise<Result<Output, Error>>;
}
