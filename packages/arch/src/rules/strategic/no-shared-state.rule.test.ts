import { describe, expect, it } from "vitest";

import { TestCodebase } from "../../../test/support/test-codebase.ts";
import { NoSharedStateRule } from "./no-shared-state.rule.ts";

describe("NoSharedStateRule", () => {
	it("accepts constants and instance state in the shared kernel", () => {
		const codebase = new TestCodebase()
			.file(
				"src/shared-kernel/domain/value-objects/money.value-object.ts",
				`import { ValueObject } from "@alveolus/core";
				export class Money extends ValueObject<{ amount: number }> {
					public static readonly ZERO = new Money({ amount: 0 });
					public static readonly CURRENCIES: readonly string[] = ["EUR"];
					public static readonly PRECISION = 2;
					public static of(amount: number): Money { return new Money({ amount }); }
				}`,
			)
			.file("src/shared-kernel/driven/memory/adapters/memory-cache.adapter.ts", `export class MemoryCache { private readonly entries = new Map<string, string>(); }`);

		expect(codebase.check(new NoSharedStateRule())).toEqual([]);
	});

	it("rejects a static field that holds state in the shared kernel", () => {
		const codebase = new TestCodebase().file(
			"src/shared-kernel/driven/memory/registry/service-registry.ts",
			`export class ServiceRegistry {
				private static readonly services = new Map<string, unknown>();
				private static readonly names: string[] = [];
				private static readonly byId: Record<string, unknown> = {};
				private static readonly options = { strict: true };
				private static count = 0;
				public static register(name: string, service: unknown): void { ServiceRegistry.services.set(name, service); }
			}`,
		);

		expect(codebase.messages(new NoSharedStateRule())).toEqual([
			"ServiceRegistry.services holds a collection in a static field: every context reaches the same one, a channel the context map does not show. The shared kernel shares a model, not state: integrate through an open host service.",
			"ServiceRegistry.names holds a collection in a static field: every context reaches the same one, a channel the context map does not show. The shared kernel shares a model, not state: integrate through an open host service.",
			"ServiceRegistry.byId holds a collection in a static field: every context reaches the same one, a channel the context map does not show. The shared kernel shares a model, not state: integrate through an open host service.",
			"ServiceRegistry.options holds a collection in a static field: every context reaches the same one, a channel the context map does not show. The shared kernel shares a model, not state: integrate through an open host service.",
			"ServiceRegistry.count is a static field without readonly: every context reaches the same one, a channel the context map does not show. The shared kernel shares a model, not state: integrate through an open host service.",
		]);
	});

	it("leaves the bounded contexts alone: no other context reaches them", () => {
		const codebase = new TestCodebase().file(
			"src/ordering/driven/memory/adapters/memory-orders.adapter.ts",
			`export class MemoryOrders { private static readonly rows = new Map<string, unknown>(); }`,
		);

		expect(codebase.check(new NoSharedStateRule())).toEqual([]);
	});
});
