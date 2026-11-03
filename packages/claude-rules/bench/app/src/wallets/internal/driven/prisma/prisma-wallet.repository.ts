import { type IdGenerator, ok, type Result } from '@alveolus/core';

import type { PrismaUnitOfWork } from '../../../../shared/driven/prisma/prisma-unit-of-work.adapter';
import type { Wallet } from '../../domain/wallet/wallet.aggregate';
import { WalletId } from '../../domain/wallet/wallet.id';
import { WalletRepository } from '../../domain/wallet/wallet.repository';
import { WalletMapper } from './wallet.mapper';

class WalletChangedConcurrently extends Error {
	constructor(id: string) {
		super(`Wallet ${id} changed since it was read`);
		this.name = 'WalletChangedConcurrently';
	}
}

export class PrismaWalletRepository extends WalletRepository {
	readonly #unitOfWork: PrismaUnitOfWork;
	readonly #ids: IdGenerator;
	readonly #mapper = new WalletMapper();
	readonly #versions = new WeakMap<Wallet, number>();

	constructor(unitOfWork: PrismaUnitOfWork, ids: IdGenerator) {
		super();
		this.#unitOfWork = unitOfWork;
		this.#ids = ids;
	}

	nextIdentity(): Promise<WalletId> {
		return Promise.resolve(WalletId.generate(this.#ids));
	}

	async findById(id: WalletId): Promise<Wallet | undefined> {
		const row = await this.#unitOfWork.client().wallet.findUnique({ where: { id: id.value } });

		if (!row) {
			return undefined;
		}

		const wallet = this.#mapper.toDomain(row);
		this.#versions.set(wallet, row.version);

		return wallet;
	}

	async save(wallet: Wallet): Promise<Result<void, never>> {
		const db = this.#unitOfWork.client();
		const { id, ...data } = this.#mapper.toRow(wallet);
		const expected = this.#versions.get(wallet);

		if (expected === undefined) {
			await db.wallet.create({ data: { id, ...data, version: 1 } });
			this.#versions.set(wallet, 1);

			return ok();
		}

		const updated = await db.wallet.updateMany({
			where: { id, version: expected },
			data: { ...data, version: expected + 1 },
		});

		if (updated.count === 0) {
			throw new WalletChangedConcurrently(id);
		}

		this.#versions.set(wallet, expected + 1);

		return ok();
	}
}
