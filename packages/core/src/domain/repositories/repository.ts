import type { AnyAggregateRoot } from "../aggregates/index.ts";

/**
 * Port that loads and saves the aggregates of one type, as if they were in an in-memory
 * collection.
 *
 * Declare one interface per aggregate in the domain, extending this one, and implement it in a
 * driven adapter. `save` persists the aggregate and must throw a {@link ConcurrencyError} when
 * the stored version is no longer the `version` the aggregate was loaded at. It leaves the
 * pending domain events on the aggregate: publishing them is the caller's job.
 *
 * @typeParam Aggregate - {@link AggregateRoot} subclass stored by the repository.
 *
 * @example
 * ```ts
 * export interface OrderRepository extends Repository<Order> {}
 *
 * const order = await orders.findById(id);
 * if (order === undefined) return err(new OrderNotFound({ id: id.value }));
 * order.place(42, now);
 * await orders.save(order);
 * await publisher.publish(order.pullDomainEvents());
 * ```
 *
 * @see {@link https://alveolusjs.github.io/alveolus/core/domain/repositories | Repositories}
 */
export interface Repository<Aggregate extends AnyAggregateRoot> {
	findById(id: Aggregate["id"]): Promise<Aggregate | undefined>;
	save(aggregate: Aggregate): Promise<void>;
}
