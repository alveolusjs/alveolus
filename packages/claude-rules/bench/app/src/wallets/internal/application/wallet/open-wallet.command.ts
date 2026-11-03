import {
	type Clock,
	CommandHandler,
	type DomainEventDispatcher,
	type InvalidIdentifier,
	ok,
	type Result,
	type UnitOfWork,
} from '@alveolus/core';

import { Currency } from '../../domain/money/currency.value-object';
import type { UnsupportedCurrency } from '../../domain/money/money.errors';
import { CustomerId } from '../../domain/wallet/customer.id';
import { Wallet, type WalletEvent } from '../../domain/wallet/wallet.aggregate';
import type { WalletId } from '../../domain/wallet/wallet.id';
import type { WalletRepository } from '../../domain/wallet/wallet.repository';

export interface OpenWalletCommand {
	readonly customerId: string;
	readonly currency: string;
}

export type OpenWalletError = InvalidIdentifier | UnsupportedCurrency;

export class OpenWalletHandler extends CommandHandler<OpenWalletCommand, WalletId, OpenWalletError> {
	readonly #unitOfWork: UnitOfWork;
	readonly #wallets: WalletRepository;
	readonly #events: DomainEventDispatcher<WalletEvent>;
	readonly #clock: Clock;

	constructor(
		unitOfWork: UnitOfWork,
		wallets: WalletRepository,
		events: DomainEventDispatcher<WalletEvent>,
		clock: Clock,
	) {
		super();
		this.#unitOfWork = unitOfWork;
		this.#wallets = wallets;
		this.#events = events;
		this.#clock = clock;
	}

	async handle(command: OpenWalletCommand): Promise<Result<WalletId, OpenWalletError>> {
		const customerId = CustomerId.of(command.customerId);

		if (!customerId.ok) {
			return customerId;
		}

		const currency = Currency.of(command.currency);

		if (!currency.ok) {
			return currency;
		}

		return this.#unitOfWork.run(async () => {
			const id = await this.#wallets.nextIdentity();
			const wallet = Wallet.open(id, customerId.value, currency.value, this.#clock.now());
			const saved = await this.#wallets.save(wallet);

			if (!saved.ok) {
				return saved;
			}

			await this.#events.dispatch(wallet.pullDomainEvents());

			return ok(wallet.id);
		});
	}
}
