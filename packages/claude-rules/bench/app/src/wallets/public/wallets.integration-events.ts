export const MONEY_WITHDRAWN = 'wallets.wallet.MoneyWithdrawn';

export type PublishedMoney = {
	readonly minor: string;
	readonly currency: string;
};

export type MoneyWithdrawnPayload = {
	readonly walletId: string;
	readonly customerId: string;
	readonly amount: PublishedMoney;
	readonly balance: PublishedMoney;
};

export type MoneyWithdrawnMessage = {
	readonly id: string;
	readonly type: typeof MONEY_WITHDRAWN;
	readonly version: 1;
	readonly source: string;
	readonly occurredAt: string;
	readonly correlationId: string;
	readonly causationId?: string;
	readonly payload: MoneyWithdrawnPayload;
};
