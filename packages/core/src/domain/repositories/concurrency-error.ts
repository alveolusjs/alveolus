import type { AnyAggregateRoot } from "../aggregates/index.ts";
import type { AnyIdentifier } from "../entities/index.ts";

/**
 * Thrown by {@link Repository.save} when the aggregate was changed and saved by someone else
 * since it was loaded: its `version` no longer matches the stored one.
 *
 * It is a technical failure, not a business one: catch it in the application layer to reload the
 * aggregate and retry, or report a conflict.
 *
 * @example
 * ```ts
 * const stored = await currentVersion(order.id);
 * if (stored !== order.version) throw new ConcurrencyError(order, stored);
 * ```
 *
 * @see {@link https://alveolusjs.github.io/alveolus/core/domain/repositories | Repositories}
 */
export class ConcurrencyError extends Error {
	public override readonly name = "ConcurrencyError";
	public readonly aggregateType: string;
	public readonly aggregateId: AnyIdentifier;
	public readonly expectedVersion: number;
	public readonly actualVersion: number;

	public constructor(aggregate: AnyAggregateRoot, actualVersion: number) {
		const aggregateType = aggregate.constructor.name;
		super(
			`Cannot save ${aggregateType} ${aggregate.id.toString()}: loaded at version ${aggregate.version}, but the stored version is ${actualVersion}`,
		);
		this.aggregateType = aggregateType;
		this.aggregateId = aggregate.id;
		this.expectedVersion = aggregate.version;
		this.actualVersion = actualVersion;
	}
}
