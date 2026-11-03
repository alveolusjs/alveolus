import { DomainEvent } from '@alveolus/core';

import type { Currency } from '../money/currency.value-object';
import type { Money } from '../money/money.value-object';
import type { CustomerId } from './customer.id';
import type { WalletId } from './wallet.id';

export class WalletOpened extends DomainEvent<
	WalletId,
	{ readonly customerId: CustomerId; readonly currency: Currency }
> {}

export class MoneyWithdrawn extends DomainEvent<
	WalletId,
	{ readonly customerId: CustomerId; readonly amount: Money; readonly balance: Money }
> {}

export class WalletClosed extends DomainEvent<WalletId, { readonly customerId: CustomerId }> {}
