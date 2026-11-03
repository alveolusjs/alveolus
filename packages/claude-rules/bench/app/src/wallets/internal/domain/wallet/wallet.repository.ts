import { CommandRepository } from '@alveolus/core';

import type { Wallet } from './wallet.aggregate';
import type { WalletId } from './wallet.id';

export abstract class WalletRepository extends CommandRepository<Wallet> {
	abstract nextIdentity(): Promise<WalletId>;
}
