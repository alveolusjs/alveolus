import { DomainError } from '@alveolus/core';

import type { WalletId } from './wallet.id';

export class WalletNotFound extends DomainError<WalletId> {}

export class WalletIsClosed extends DomainError<WalletId> {}

export class AmountNotPositive extends DomainError<WalletId> {}

export class InsufficientFunds extends DomainError<WalletId> {}

export class BalanceNotZero extends DomainError<WalletId> {}
