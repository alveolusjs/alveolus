import type { Result } from '@alveolus/core';

import { Currency } from '../../money/currency.value-object';
import { Money } from '../../money/money.value-object';
import { CustomerId } from '../customer.id';
import { Wallet, type WalletStatus } from '../wallet.aggregate';
import { WalletId } from '../wallet.id';

export class WalletFixtures {
	static readonly at = new Date('2026-03-02T09:30:00.000Z');

	static euros(minor: bigint): Money {
		return WalletFixtures.#value(Money.of(minor, WalletFixtures.#value(Currency.of('EUR'))));
	}

	static dollars(minor: bigint): Money {
		return WalletFixtures.#value(Money.of(minor, WalletFixtures.#value(Currency.of('USD'))));
	}

	static walletWith(balance: Money, status: WalletStatus = 'open'): Wallet {
		const id = WalletFixtures.#value(WalletId.of('0190f5a2-7c1e-7b3a-9d4e-2f6a8b1c3d5e'));
		const customerId = WalletFixtures.#value(CustomerId.of('0190f5a2-8a4b-7c2d-8e1f-3a5b7c9d1e2f'));

		return Wallet.restore(id, customerId, balance, status);
	}

	static #value<T>(result: Result<T, unknown>): T {
		if (!result.ok) {
			throw new Error('A fixture holds an invalid value');
		}

		return result.value;
	}
}
