import { ok, ValueObject } from "@alveolus/core";
import type { Result } from "@alveolus/core";

import type { Customer } from "../aggregates/customer.aggregate.ts";
import type { FixtureId } from "./ids.identifier.ts";

export class Snapshot extends ValueObject<{ id: FixtureId; customers: readonly Customer[]; label: string }> {
	private constructor(props: { id: FixtureId; customers: readonly Customer[]; label: string }) {
		super(props);
	}

	public static create(label: string, id: FixtureId): Result<Snapshot, never> {
		return ok(new Snapshot({ customers: [], id, label }));
	}

	public get label(): string {
		return this.props.label;
	}
}
