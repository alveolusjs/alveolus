import type { AnyIdentifier } from "./identifier.ts";
import type { JsonValue } from "./json-value.ts";

/**
 * Domain object defined by its identity rather than by its attributes.
 *
 * Two entities are equal when they are instances of the same concrete class and their
 * identifiers are equal, whatever their other attributes. Expose behaviour through intention-
 * revealing methods rather than setters.
 *
 * Every entity exports its state with `toSnapshot()`, as plain JSON data declared with a `type`
 * alias: identifiers become their value, value objects their primitive values, dates ISO strings,
 * nested entities their own snapshot. Rebuild it with a static `fromSnapshot(snapshot)` that checks
 * no business rule.
 *
 * @typeParam Id - {@link Identifier} subclass identifying the entity.
 * @typeParam Snapshot - JSON data describing the state of the entity.
 *
 * @example
 * ```ts
 * class OrderLineId extends Identifier<string, "OrderLineId"> {}
 * type OrderLineSnapshot = { id: string; quantity: number };
 *
 * class OrderLine extends Entity<OrderLineId, OrderLineSnapshot> {
 *   private constructor(id: OrderLineId, readonly quantity: number) {
 *     super(id);
 *   }
 *
 *   static fromSnapshot(snapshot: OrderLineSnapshot): OrderLine {
 *     return new OrderLine(new OrderLineId(snapshot.id), snapshot.quantity);
 *   }
 *
 *   toSnapshot(): OrderLineSnapshot {
 *     return { id: this.id.value, quantity: this.quantity };
 *   }
 * }
 *
 * const line = OrderLine.fromSnapshot({ id: "l_1", quantity: 2 });
 * line.equals(OrderLine.fromSnapshot({ id: "l_1", quantity: 5 })); // true
 * ```
 *
 * @see {@link https://alveolusjs.github.io/alveolus/core/domain/entities | Entities}
 */
export abstract class Entity<Id extends AnyIdentifier, Snapshot extends JsonValue> {
	public readonly id: Id;

	protected constructor(id: Id) {
		this.id = id;
	}

	public equals(other: AnyEntity): boolean {
		return other === this || (other.constructor === this.constructor && this.id.equals(other.id));
	}

	public abstract toSnapshot(): Snapshot;
}

export type AnyEntity = Entity<AnyIdentifier, JsonValue>;
