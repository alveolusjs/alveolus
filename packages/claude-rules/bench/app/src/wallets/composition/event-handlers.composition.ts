import { CorrelationContext, DomainEventDispatcher, DomainEventHandlers, IdGenerator, Outbox } from '@alveolus/core';
import type { Provider } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import { Wiring } from '../../shared/composition/shared.composition';
import type { WalletEvent } from '../internal/domain/wallet/wallet.aggregate';
import { MoneyWithdrawn } from '../internal/domain/wallet/wallet.events';
import { WalletEventsTranslator } from '../internal/driven/outbox/wallet-events.translator';

const walletsEventHandlers = new DomainEventHandlers<WalletEvent>([[MoneyWithdrawn, WalletEventsTranslator, 'sync']]);

export const eventHandlerProviders: Provider[] = [
	Wiring.construct(WalletEventsTranslator, [IdGenerator, Outbox, CorrelationContext]),
	{
		provide: DomainEventDispatcher,
		useFactory: (moduleRef: ModuleRef, outbox: Outbox, correlation: CorrelationContext) =>
			new DomainEventDispatcher(
				'wallets',
				walletsEventHandlers,
				(handler) => moduleRef.get(handler),
				outbox,
				correlation,
			),
		inject: [ModuleRef, Outbox, CorrelationContext],
	},
];
