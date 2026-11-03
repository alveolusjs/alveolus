import { AsyncLocalStorage } from 'node:async_hooks';

import { type TransactionScope, UnitOfWork } from '@alveolus/core';
import type { Prisma, PrismaClient } from '@prisma/client';

type OpenTransaction = { readonly client: Prisma.TransactionClient; readonly scope: TransactionScope };

export class PrismaUnitOfWork extends UnitOfWork {
	readonly #prisma: PrismaClient;
	readonly #open = new AsyncLocalStorage<OpenTransaction>();

	constructor(prisma: PrismaClient) {
		super();
		this.#prisma = prisma;
	}

	client(): Prisma.TransactionClient {
		return this.#open.getStore()?.client ?? this.#prisma;
	}

	protected current(): TransactionScope | undefined {
		return this.#open.getStore()?.scope;
	}

	protected transaction<R>(scope: TransactionScope, work: () => Promise<R>): Promise<R> {
		return this.#prisma.$transaction((client) => this.#open.run({ client, scope }, work));
	}
}
