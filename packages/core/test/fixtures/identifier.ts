import type { InvalidIdentifier } from '../../src/domain/domain-errors/index.ts';
import { IdGenerator } from '../../src/domain/ports/index.ts';
import { Identifier, UuidIdentifier } from '../../src/domain/value-objects/index.ts';
import type { Result } from '../../src/utilities/result/index.ts';

export class OrderId extends Identifier<string, 'OrderId'> {}

export class CustomerId extends Identifier<string, 'CustomerId'> {}

export class ProductId extends UuidIdentifier<'ProductId'> {
	private constructor(value: string) {
		super(value);
	}

	public static generate(ids: IdGenerator): ProductId {
		return new ProductId(ids.next());
	}

	public static of(value: string): Result<ProductId, InvalidIdentifier> {
		return ProductId.parse(value, (valid) => new ProductId(valid));
	}
}

export class CategoryId extends UuidIdentifier<'CategoryId'> {
	private constructor(value: string) {
		super(value);
	}

	public static of(value: string): Result<CategoryId, InvalidIdentifier> {
		return CategoryId.parse(value, (valid) => new CategoryId(valid));
	}
}

export class FixedUuidGenerator extends IdGenerator {
	public next(): string {
		return '019a2b3c-4d5e-7f00-8a00-0123456789ab';
	}
}
