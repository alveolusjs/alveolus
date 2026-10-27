import type { AnyAggregateRoot } from '../aggregates/index.ts';

export interface FoundAggregates<Aggregate extends AnyAggregateRoot> {
	readonly found: readonly Aggregate[];
	readonly missing: readonly Aggregate['id'][];
}
