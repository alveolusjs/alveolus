import { type AnyIntegrationEvent, EventTranslator } from '@alveolus/core';

import { MONEY_WITHDRAWN, type MoneyWithdrawnPayload } from '../../../public/wallets.integration-events';
import type { WalletEvent } from '../../domain/wallet/wallet.aggregate';
import { MoneyWithdrawn } from '../../domain/wallet/wallet.events';

export class WalletEventsTranslator extends EventTranslator<WalletEvent> {
	protected readonly source = 'wallets';

	protected translate(event: WalletEvent): AnyIntegrationEvent[] {
		if (event instanceof MoneyWithdrawn) {
			return [this.wrap(event, { type: MONEY_WITHDRAWN, version: 1, payload: this.#moneyWithdrawn(event) })];
		}

		return [];
	}

	#moneyWithdrawn(event: MoneyWithdrawn): MoneyWithdrawnPayload {
		const { customerId, amount, balance } = event.payload;

		return {
			walletId: event.aggregateId.value,
			customerId: customerId.value,
			amount: { minor: amount.minor.toString(), currency: amount.currency.code },
			balance: { minor: balance.minor.toString(), currency: balance.currency.code },
		};
	}
}
