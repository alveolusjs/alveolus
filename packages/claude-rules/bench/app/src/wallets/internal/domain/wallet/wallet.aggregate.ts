import { AggregateRoot, err, ok, type Result } from '@alveolus/core';

import type { Currency } from '../money/currency.value-object';
import { CurrencyMismatch } from '../money/money.errors';
import { Money } from '../money/money.value-object';
import type { CustomerId } from './customer.id';
import { AmountNotPositive, BalanceNotZero, InsufficientFunds, WalletIsClosed } from './wallet.errors';
import { MoneyWithdrawn, WalletClosed, WalletOpened } from './wallet.events';
import type { WalletId } from './wallet.id';

export type WalletStatus = 'open' | 'closed';

export type WalletEvent = WalletOpened | MoneyWithdrawn | WalletClosed;

export type WalletSnapshot = {
	readonly id: string;
	readonly customerId: string;
	readonly currency: string;
	readonly balance: bigint;
	readonly status: WalletStatus;
};

export class Wallet extends AggregateRoot<WalletId, WalletEvent, WalletSnapshot> {
	readonly #customerId: CustomerId;
	#balance: Money;
	#status: WalletStatus;

	private constructor(id: WalletId, customerId: CustomerId, balance: Money, status: WalletStatus) {
		super(id);
		this.#customerId = customerId;
		this.#balance = balance;
		this.#status = status;
	}

	static open(id: WalletId, customerId: CustomerId, currency: Currency, at: Date): Wallet {
		const wallet = new Wallet(id, customerId, Money.zero(currency), 'open');
		wallet.record(new WalletOpened({ aggregateId: id, occurredAt: at, payload: { customerId, currency } }));

		return wallet;
	}

	// restore(id, customerId, balance, status) and toSnapshot() for the repository

	withdraw(
		amount: Money,
		at: Date,
	): Result<void, WalletIsClosed | AmountNotPositive | CurrencyMismatch | InsufficientFunds> {
		if (this.#status === 'closed') {
			return err(new WalletIsClosed(this.id));
		}

		if (amount.isZero()) {
			return err(new AmountNotPositive(this.id));
		}

		if (!amount.isIn(this.#balance.currency)) {
			return err(new CurrencyMismatch({ expected: this.#balance.currency.code, actual: amount.currency.code }));
		}

		if (this.#balance.isLessThan(amount)) {
			return err(new InsufficientFunds(this.id));
		}

		this.#balance = this.#balance.minus(amount);
		const payload = { customerId: this.#customerId, amount, balance: this.#balance };
		this.record(new MoneyWithdrawn({ aggregateId: this.id, occurredAt: at, payload }));

		return ok();
	}

	close(at: Date): Result<void, WalletIsClosed | BalanceNotZero> {
		if (this.#status === 'closed') {
			return err(new WalletIsClosed(this.id));
		}

		if (!this.#balance.isZero()) {
			return err(new BalanceNotZero(this.id));
		}

		this.#status = 'closed';
		const payload = { customerId: this.#customerId };
		this.record(new WalletClosed({ aggregateId: this.id, occurredAt: at, payload }));

		return ok();
	}
}
