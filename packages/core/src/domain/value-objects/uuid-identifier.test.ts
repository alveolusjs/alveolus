import { describe, expect, it } from 'vitest';

import { CategoryId, FixedUuidGenerator, ProductId } from '../../../test/fixtures/identifier.ts';
import { InvalidIdentifier } from '../domain-errors/index.ts';
import { Identifier } from './identifier.ts';

const v4 = '3f2b8c1e-9d4a-4b6f-a2c7-5e8d1f0a9b3c';
const v7 = '019a2b3c-4d5e-7f00-8a00-0123456789ab';

describe('UuidIdentifier', () => {
	it('reads a UUID of any version', () => {
		expect(ProductId.of(v4)).toMatchObject({ ok: true, value: { value: v4 } });
		expect(ProductId.of(v7)).toMatchObject({ ok: true, value: { value: v7 } });
	});

	it('normalizes the value to lowercase', () => {
		expect(ProductId.of(v7.toUpperCase())).toMatchObject({ ok: true, value: { value: v7 } });
	});

	it.each([
		['the nil UUID', '00000000-0000-0000-0000-000000000000'],
		['the max UUID', 'ffffffff-ffff-ffff-ffff-ffffffffffff'],
		['a version outside the RFC', '019a2b3c-4d5e-9f00-8a00-0123456789ab'],
		['a variant outside the RFC', '019a2b3c-4d5e-7f00-ca00-0123456789ab'],
		['a value without dashes', '019a2b3c4d5e7f008a000123456789ab'],
		['a value with a trailing newline', `${v7}\n`],
		['a prefixed value', `product_${v7}`],
		['an empty value', ''],
	])('refuses %s', (_, value) => {
		const read = ProductId.of(value);

		expect(read.ok).toBe(false);
		expect(read.ok ? undefined : read.error).toBeInstanceOf(InvalidIdentifier);
	});

	it('names the identifier and the value it refuses', () => {
		const read = CategoryId.of('not-a-uuid');

		expect(read.ok ? undefined : read.error.payload).toEqual({ identifier: 'CategoryId', value: 'not-a-uuid' });
	});

	it('builds a generated value without reading it again', () => {
		const id = ProductId.generate(new FixedUuidGenerator());

		expect(id.value).toBe(v7);
		expect(id).toBeInstanceOf(Identifier);
	});

	it('is nominal at compile time', () => {
		const load = (id: ProductId): ProductId => id;
		const category = CategoryId.of(v7);

		if (category.ok) {
			// @ts-expect-error
			load(category.value);
		}
	});
});
