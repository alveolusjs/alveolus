export type IdentifierValue = string | number | bigint;

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
