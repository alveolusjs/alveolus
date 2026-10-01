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
		return leftKeys.length === rightKeys.length && leftKeys.every((key) => Object.hasOwn(right, key) && valuesEqual((left as Record<string, unknown>)[key], (right as Record<string, unknown>)[key]));
	}
	return false;
}

export type AnyValueObject = ValueObject<object>;
