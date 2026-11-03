import type { Result } from '@alveolus/core';

import type { PrismaUnitOfWork } from '../../driven/prisma/prisma-unit-of-work.adapter';

type Subscription = {
	readonly consumer: string;
	readonly read: (raw: unknown) => { readonly id: string };
	readonly handle: (message: never) => Promise<Result<unknown, unknown>>;
};

export class IntegrationConsumer {
	readonly #unitOfWork: PrismaUnitOfWork;
	readonly #subscriptions = new Map<string, readonly Subscription[]>();

	constructor(unitOfWork: PrismaUnitOfWork) {
		this.#unitOfWork = unitOfWork;
	}

	on<Message extends { readonly id: string }>(
		type: string,
		consumer: string,
		read: (raw: unknown) => Message,
		handle: (message: Message) => Promise<Result<unknown, unknown>>,
	): void {
		this.#subscriptions.set(type, [...(this.#subscriptions.get(type) ?? []), { consumer, read, handle }]);
	}

	// deliver(type, raw): per consumer, in one unit of work, skips an id already processed, handles it, marks it
}
