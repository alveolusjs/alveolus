import type { AnyAggregateRoot } from "../aggregates/index.ts";
import { Port } from "../ports/index.ts";

export abstract class CommandRepository<Aggregate extends AnyAggregateRoot> extends Port {
	public abstract findById(id: Aggregate["id"]): Promise<Aggregate | undefined>;
	public abstract save(aggregate: Aggregate): Promise<void>;
}
