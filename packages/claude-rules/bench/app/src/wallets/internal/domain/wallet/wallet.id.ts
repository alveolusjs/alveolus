import { type IdGenerator, type InvalidIdentifier, type Result, UuidIdentifier } from '@alveolus/core';

export class WalletId extends UuidIdentifier<'WalletId'> {
	private constructor(value: string) {
		super(value);
	}

	static generate(ids: IdGenerator): WalletId {
		return new WalletId(ids.next());
	}

	static of(value: string): Result<WalletId, InvalidIdentifier> {
		return WalletId.parse(value, (valid) => new WalletId(valid));
	}
}
