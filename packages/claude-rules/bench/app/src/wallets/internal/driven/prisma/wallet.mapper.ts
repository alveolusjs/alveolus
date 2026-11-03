import type { AnyDomainError, Result } from '@alveolus/core';
import type { Wallet as WalletRow } from '@prisma/client';

import { Currency } from '../../domain/money/currency.value-object';
import { Money } from '../../domain/money/money.value-object';
import { CustomerId } from '../../domain/wallet/customer.id';
import { Wallet } from '../../domain/wallet/wallet.aggregate';
import { WalletId } from '../../domain/wallet/wallet.id';

export class WalletMapper {
	toDomain(row: WalletRow): Wallet {
		const currency = this.#stored(Currency.of(row.currency));

		return Wallet.restore(
			this.#stored(WalletId.of(row.id)),
			this.#stored(CustomerId.of(row.customerId)),
			this.#stored(Money.of(row.balance, currency)),
			row.status,
		);
	}

	toRow(wallet: Wallet): Omit<WalletRow, 'version'> {
		const { id, customerId, currency, balance, status } = wallet.toSnapshot();

		return { id, customerId, currency, balance, status };
	}

	#stored<T>(result: Result<T, AnyDomainError>): T {
		if (!result.ok) {
			throw new Error(`A stored wallet is corrupt: ${result.error.type}`);
		}

		return result.value;
	}
}
