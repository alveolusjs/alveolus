/**
 * Stateless domain operation that does not belong to a single entity or value object, such as a
 * calculation or a rule that involves several aggregates.
 *
 * Extend it to mark the class as a domain service. Name it after an activity of the domain, take
 * the aggregates and values it works on as parameters and return values or a {@link Result}. It
 * may receive other domain services or values at construction, but keeps no state, reads no clock
 * and performs no I/O: loading and saving belong to the application layer.
 *
 * @example
 * ```ts
 * class ShippingCostCalculator extends DomainService {
 *   costOf(order: Order, destination: Address): Result<Money, UnsupportedDestination> {
 *     if (destination.country !== "FR") return err(new UnsupportedDestination({ country: destination.country }));
 *     return ok(order.weight > 2 ? Money.euros(9) : Money.euros(5));
 *   }
 * }
 *
 * const cost = new ShippingCostCalculator().costOf(order, address);
 * ```
 *
 * @see {@link https://alveolusjs.github.io/alveolus/core/domain/domain-services | Domain Services}
 */
export abstract class DomainService {}
