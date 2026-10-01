import type { JsonValue } from "../entities/index.ts";

/**
 * Port that reads one view: a business read model shaped for the callers of query handlers.
 *
 * A view is a plain JSON type declared in the domain (`domain/views/`); it is not an aggregate and
 * is never changed through it. Declare one interface per view in `domain/repositories/`, extending
 * this one with the reads your queries need, and implement it in a driven adapter with the query
 * that suits your storage. The interface has no member of its own: it marks the port so that the
 * architecture rules can find it and its view.
 *
 * @typeParam View - The JSON type the repository returns.
 *
 * @example
 * ```ts
 * export type OrderSummary = { id: string; total: number };
 *
 * export interface OrderSummaryRepository extends ViewRepository<OrderSummary> {
 *   findById(orderId: string): Promise<OrderSummary | undefined>;
 * }
 * ```
 *
 * @see {@link https://alveolusjs.github.io/alveolus/core/domain/views | Views}
 */
export interface ViewRepository<View extends JsonValue> {}
