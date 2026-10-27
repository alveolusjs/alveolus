import type { Result } from '../../utilities/result/index.ts';
import type { AnyAggregateRoot } from '../aggregates/index.ts';
import type { AnyDomainError } from '../domain-errors/index.ts';
import { Port } from '../ports/index.ts';
import type { FoundAggregates } from './found-aggregates.ts';

export abstract class CommandRepository<
	Aggregate extends AnyAggregateRoot,
	Refusal extends AnyDomainError = never,
> extends Port {
	public abstract findById(id: Aggregate['id']): Promise<Aggregate | undefined>;
	public abstract save(aggregate: Aggregate): Promise<Result<void, Refusal>>;

	public async findByIds(ids: readonly Aggregate['id'][]): Promise<FoundAggregates<Aggregate>> {
		const found: Aggregate[] = [];
		const missing: Aggregate['id'][] = [];

		for (const id of this.distinct(ids)) {
			const aggregate = await this.findById(id);

			if (aggregate === undefined) {
				missing.push(id);
			} else {
				found.push(aggregate);
			}
		}

		return { found, missing };
	}

	protected distinct(ids: readonly Aggregate['id'][]): Aggregate['id'][] {
		return ids.filter((id, index) => ids.findIndex((other) => other.equals(id)) === index);
	}
}
