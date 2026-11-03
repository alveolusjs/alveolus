import {
	type Clock,
	CommandHandler,
	type DomainEventDispatcher,
	err,
	type InvalidIdentifier,
	ok,
	type Result,
	type UnitOfWork,
} from '@alveolus/core';

import { Currency } from '../../domain/money/currency.value-object';
import type { CurrencyMismatch, InvalidMoney, UnsupportedCurrency } from '../../domain/money/money.errors';
import { Money } from '../../domain/money/money.value-object';
import type { WalletEvent } from '../../domain/wallet/wallet.aggregate';
import {
	type AmountNotPositive,
	type InsufficientFunds,
	type WalletIsClosed,
	WalletNotFound,
} from '../../domain/wallet/wallet.errors';
import { WalletId } from '../../domain/wallet/wallet.id';
import type { WalletRepository } from '../../domain/wallet/wallet.repository';

export interface WithdrawMoneyCommand {
	readonly walletId: string;
	readonly amount: { readonly minor: bigint; readonly currency: string };
}

export type WithdrawMoneyError =
	| InvalidIdentifier
	| UnsupportedCurrency
	| InvalidMoney
	| WalletNotFound
	| WalletIsClosed
	| AmountNotPositive
	| CurrencyMismatch
	| InsufficientFunds;

export class WithdrawMoneyHandler extends CommandHandler<WithdrawMoneyCommand, void, WithdrawMoneyError> {
	readonly #unitOfWork: UnitOfWork;
	readonly #wallets: WalletRepository;
	readonly #events: DomainEventDispatcher<WalletEvent>;
	readonly #clock: Clock;

	// constructor(unitOfWork, wallets, events, clock), as in OpenWalletHandler

	async handle(command: WithdrawMoneyCommand): Promise<Result<void, WithdrawMoneyError>> {
		const walletId = WalletId.of(command.walletId);

		if (!walletId.ok) {
			return walletId;
		}

		const currency = Currency.of(command.amount.currency);

		if (!currency.ok) {
			return currency;
		}

		const amount = Money.of(command.amount.minor, currency.value);

		if (!amount.ok) {
			return amount;
		}

		return this.#unitOfWork.run(async () => {
			const wallet = await this.#wallets.findById(walletId.value);

			if (!wallet) {
				return err(new WalletNotFound(walletId.value));
			}

			const withdrawn = wallet.withdraw(amount.value, this.#clock.now());

			if (!withdrawn.ok) {
				return withdrawn;
			}

			const saved = await this.#wallets.save(wallet);

			if (!saved.ok) {
				return saved;
			}

			await this.#events.dispatch(wallet.pullDomainEvents());

			return ok();
		});
	}
}
