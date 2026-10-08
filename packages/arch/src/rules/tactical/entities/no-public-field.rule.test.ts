import { describe, expect, it } from "vitest";

import { TestCodebase } from "../../../../test/support/test-codebase.ts";
import { NoPublicFieldRule } from "./no-public-field.rule.ts";

describe("NoPublicFieldRule", () => {
	it("accepts private fields, getters and static constants", () => {
		const codebase = new TestCodebase().file(
			"src/ledger/domain/aggregates/account.aggregate.ts",
			`import { AggregateRoot, Identifier } from "@alveolus/core";
			class AccountId extends Identifier<string, "AccountId"> {}
			export class Account extends AggregateRoot<AccountId> {
				public static readonly limit = 100;
				private balance = 0;
				protected readonly opened: string = "";
				public constructor(id: AccountId, private readonly currency: string) { super(id); }
				public get balanceValue(): number { return this.balance; }
				public toSnapshot() { return { id: this.id.value }; }
			}`,
		);

		expect(codebase.check(new NoPublicFieldRule())).toEqual([]);
	});

	it("rejects a public field, readonly or not, declared or as a constructor parameter", () => {
		const codebase = new TestCodebase().file(
			"src/ledger/domain/aggregates/account.aggregate.ts",
			`import { AggregateRoot, Identifier, ValueObject } from "@alveolus/core";
			class AccountId extends Identifier<string, "AccountId"> {}
			export class Account extends AggregateRoot<AccountId> {
				public balance = 0;
				public readonly currency = "EUR";
				public constructor(id: AccountId, public readonly owner: string) { super(id); }
				public toSnapshot() { return { id: this.id.value }; }
			}
			export class Money extends ValueObject<{ amount: number }> { public amount = 0; }`,
		);

		expect(codebase.check(new NoPublicFieldRule())).toEqual([
			"src/ledger/domain/aggregates/account.aggregate.ts:4 Account.balance",
			"src/ledger/domain/aggregates/account.aggregate.ts:5 Account.currency",
			"src/ledger/domain/aggregates/account.aggregate.ts:6 Account.owner",
			"src/ledger/domain/aggregates/account.aggregate.ts:9 Money.amount",
		]);
	});
});
