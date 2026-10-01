import type { AnyAggregateRoot } from "@alveolus/core";

import { Scenario } from "./scenario.ts";

export class Given<Aggregate extends AnyAggregateRoot> {
	private readonly aggregate: Aggregate;

	public constructor(aggregate: Aggregate) {
		this.aggregate = aggregate;
	}

	public when<Returned>(action: (aggregate: Aggregate) => Returned): Scenario<Aggregate, Returned> {
		return new Scenario(this.aggregate, action(this.aggregate));
	}
}

export function given<Aggregate extends AnyAggregateRoot>(aggregate: Aggregate): Given<Aggregate> {
	aggregate.pullDomainEvents();
	return new Given(aggregate);
}
