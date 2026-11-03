import { Body, Controller, HttpCode, Inject, Param, Post } from '@nestjs/common';

import { ResultController } from '../../../../shared/driving/http/result.controller';
import { CloseWalletHandler } from '../../application/wallet/close-wallet.command';
import { OpenWalletHandler } from '../../application/wallet/open-wallet.command';
import { WithdrawMoneyHandler } from '../../application/wallet/withdraw-money.command';
import { OpenWalletRequest } from './open-wallet.request';
import { WithdrawMoneyRequest } from './withdraw-money.request';

@Controller('wallets')
export class WalletController extends ResultController {
	protected readonly statuses = {
		InvalidIdentifier: 400,
		InvalidMoney: 400,
		UnsupportedCurrency: 422,
		WalletNotFound: 404,
		WalletIsClosed: 409,
		AmountNotPositive: 422,
		CurrencyMismatch: 422,
		InsufficientFunds: 422,
		BalanceNotZero: 409,
	};

	readonly #openWallet: OpenWalletHandler;
	readonly #withdrawMoney: WithdrawMoneyHandler;
	readonly #closeWallet: CloseWalletHandler;

	constructor(
		@Inject(OpenWalletHandler) openWallet: OpenWalletHandler,
		@Inject(WithdrawMoneyHandler) withdrawMoney: WithdrawMoneyHandler,
		@Inject(CloseWalletHandler) closeWallet: CloseWalletHandler,
	) {
		super();
		this.#openWallet = openWallet;
		this.#withdrawMoney = withdrawMoney;
		this.#closeWallet = closeWallet;
	}

	@Post()
	async open(@Body({ schema: OpenWalletRequest }) body: OpenWalletRequest): Promise<{ readonly id: string }> {
		const opened = await this.#openWallet.handle({ customerId: body.customerId, currency: body.currency });

		return { id: this.orHttpError(opened).value };
	}

	@Post(':id/withdrawals')
	@HttpCode(204)
	async withdraw(
		@Param('id') id: string,
		@Body({ schema: WithdrawMoneyRequest }) body: WithdrawMoneyRequest,
	): Promise<void> {
		const withdrawn = await this.#withdrawMoney.handle({ walletId: id, amount: body.amount });

		this.orHttpError(withdrawn);
	}

	@Post(':id/closure')
	@HttpCode(204)
	async close(@Param('id') id: string): Promise<void> {
		const closed = await this.#closeWallet.handle({ walletId: id });

		this.orHttpError(closed);
	}
}
