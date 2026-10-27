import type { Result } from '../../utilities/result/index.ts';
import { err, ok } from '../../utilities/result/index.ts';
import { InvalidIdentifier } from '../domain-errors/index.ts';
import { Identifier } from './identifier.ts';

export abstract class UuidIdentifier<Tag extends string = string> extends Identifier<string, Tag> {
	static readonly #format = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

	protected static parse<I extends UuidIdentifier>(
		value: string,
		create: (valid: string) => I,
	): Result<I, InvalidIdentifier> {
		const normalized = value.toLowerCase();

		if (!UuidIdentifier.#format.test(normalized)) {
			return err(new InvalidIdentifier({ identifier: this.name, value }));
		}

		return ok(create(normalized));
	}
}
