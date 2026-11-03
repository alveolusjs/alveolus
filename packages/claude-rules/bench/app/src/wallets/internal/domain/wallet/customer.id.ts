import { type InvalidIdentifier, type Result, UuidIdentifier } from '@alveolus/core';

export class CustomerId extends UuidIdentifier<'CustomerId'> {
	private constructor(value: string) {
		super(value);
	}

	static of(value: string): Result<CustomerId, InvalidIdentifier> {
		return CustomerId.parse(value, (valid) => new CustomerId(valid));
	}
}
