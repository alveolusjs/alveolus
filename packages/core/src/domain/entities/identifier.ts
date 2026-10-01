export type IdentifierValue = string | number | bigint;

/**
 * Typed identity of an {@link Entity}, compared by value.
 *
 * Extend it once per entity type. The `Tag` type parameter brands the identifier so that
 * TypeScript treats identifiers of different entities as incompatible, even when they wrap the
 * same kind of value. The tag only exists at compile time.
 *
 * Two identifiers are equal when they are instances of the same concrete class and wrap the same
 * value. An identifier serializes to its raw value with `toString()` and `JSON.stringify`.
 *
 * @typeParam T - Raw value of the identifier: `string`, `number` or `bigint`.
 * @typeParam Tag - Unique name of the identifier type, usually the class name.
 *
 * @example
 * ```ts
 * class OrderId extends Identifier<string, "OrderId"> {}
 * class CustomerId extends Identifier<string, "CustomerId"> {}
 *
 * const id = new OrderId("ord_1");
 * id.equals(new OrderId("ord_1")); // true
 * id.equals(new CustomerId("ord_1")); // false
 *
 * function load(id: OrderId) {}
 * load(new CustomerId("c_1")); // compile error
 * ```
 *
 * @see {@link https://alveolusjs.github.io/alveolus/core/domain/entities | Entities}
 */
export abstract class Identifier<T extends IdentifierValue, Tag extends string = string> {
	declare protected readonly identifierTag: Tag;

	public readonly value: T;

	public constructor(value: T) {
		this.value = value;
	}

	public equals(other: AnyIdentifier): boolean {
		return other.constructor === this.constructor && other.value === this.value;
	}

	public toString(): string {
		return String(this.value);
	}

	public toJSON(): T {
		return this.value;
	}
}

export type AnyIdentifier = Identifier<IdentifierValue>;
