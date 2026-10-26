import type { Result } from '../../utilities/result/index.ts';
import type { AnyAggregateRoot } from '../aggregates/index.ts';
import type { AnyDomainError } from '../domain-errors/index.ts';
import { Port } from '../ports/index.ts';

export abstract class CommandRepository<
	Aggregate extends AnyAggregateRoot,
	Refusal extends AnyDomainError = never,
> extends Port {
	public abstract findById(id: Aggregate['id']): Promise<Aggregate | undefined>;
	public abstract save(aggregate: Aggregate): Promise<Result<void, Refusal>>;
}
