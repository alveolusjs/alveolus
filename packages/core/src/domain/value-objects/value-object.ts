/**
 * Immutable domain object defined only by its attributes, such as an amount, an email address or
 * a date range.
 *
 * Subclasses pass their attributes to `super` as `props`, which are copied and frozen. Two value
 * objects are equal when they are instances of the same concrete class and their props are deeply
 * equal; nested value objects are compared with their own `equals`. Keep the constructor private
 * and create instances through static factories that validate input and return a {@link Result}.
 *
 * @typeParam Props - Attributes of the value object.
 *
 * @example
 * ```ts
 * class InvalidEmail extends DomainError<{ raw: string }> {}
 *
 * class Email extends ValueObject<{ value: string }> {
 *   private constructor(props: { value: string }) {
 *     super(props);
 *   }
 *
 *   static create(raw: string): Result<Email, InvalidEmail> {
 *     if (!raw.includes("@")) return err(new InvalidEmail({ raw }));
 *     return ok(new Email({ value: raw.trim().toLowerCase() }));
 *   }
 *
 *   get value(): string {
 *     return this.props.value;
 *   }
 * }
 * ```
 *
 * @see {@link https://alveolusjs.github.io/alveolus/core/domain/value-objects | Value Objects}
 */
export abstract class ValueObject<Props extends object> {
	protected readonly props: Readonly<Props>;

	protected constructor(props: Props) {
		this.props = Object.freeze({ ...props });
	}

	public equals(other: ValueObject<object>): boolean {
		return other === this || (other.constructor === this.constructor && valuesEqual(this.props, other.props));
	}
}

function isPlainObject(value: object): boolean {
	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}

function valuesEqual(left: unknown, right: unknown): boolean {
	if (Object.is(left, right)) {
		return true;
	}
	if (typeof left !== "object" || typeof right !== "object" || left === null || right === null) {
		return false;
	}
	if (left instanceof ValueObject && right instanceof ValueObject) {
		return left.equals(right);
	}
	if (left instanceof Date && right instanceof Date) {
		return left.getTime() === right.getTime();
	}
	if (Array.isArray(left) && Array.isArray(right)) {
		return left.length === right.length && left.every((item, index) => valuesEqual(item, right[index]));
	}
	if (isPlainObject(left) && isPlainObject(right)) {
		const leftKeys = Object.keys(left);
		const rightKeys = Object.keys(right);
		return (
			leftKeys.length === rightKeys.length &&
			leftKeys.every(
				(key) =>
					Object.hasOwn(right, key) &&
					valuesEqual((left as Record<string, unknown>)[key], (right as Record<string, unknown>)[key]),
			)
		);
	}
	return false;
}

export type AnyValueObject = ValueObject<object>;
