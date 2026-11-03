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

import type { WalletEvent } from '../../domain/wallet/wallet.aggregate';
import { type BalanceNotZero, type WalletIsClosed, WalletNotFound } from '../../domain/wallet/wallet.errors';
import { WalletId } from '../../domain/wallet/wallet.id';
import type { WalletRepository } from '../../domain/wallet/wallet.repository';

export interface CloseWalletCommand {
	readonly walletId: string;
}

export type CloseWalletError = InvalidIdentifier | WalletNotFound | WalletIsClosed | BalanceNotZero;

export class CloseWalletHandler extends CommandHandler<CloseWalletCommand, void, CloseWalletError> {
	readonly #unitOfWork: UnitOfWork;
	readonly #wallets: WalletRepository;
	readonly #events: DomainEventDispatcher<WalletEvent>;
	readonly #clock: Clock;

	// constructor(unitOfWork, wallets, events, clock), as in OpenWalletHandler

	async handle(command: CloseWalletCommand): Promise<Result<void, CloseWalletError>> {
		const walletId = WalletId.of(command.walletId);

		if (!walletId.ok) {
			return walletId;
		}

		return this.#unitOfWork.run(async () => {
			const wallet = await this.#wallets.findById(walletId.value);

			if (!wallet) {
				return err(new WalletNotFound(walletId.value));
			}

			const closed = wallet.close(this.#clock.now());

			if (!closed.ok) {
				return closed;
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
