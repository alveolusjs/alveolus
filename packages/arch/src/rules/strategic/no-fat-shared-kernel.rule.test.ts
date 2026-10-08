import { describe, expect, it } from "vitest";

import { TestCodebase } from "../../../test/support/test-codebase.ts";
import { NoFatSharedKernelRule } from "./no-fat-shared-kernel.rule.ts";

describe("NoFatSharedKernelRule", () => {
	it("accepts value objects, identifiers, errors, ports and their adapters in the shared kernel", () => {
		const codebase = new TestCodebase()
			.file("src/shared-kernel/domain/value-objects/money.value-object.ts", `import { ValueObject } from "@alveolus/core";\nexport class Money extends ValueObject<{ amount: number }> {}`)
			.file("src/shared-kernel/domain/value-objects/customer-id.identifier.ts", `import { Identifier } from "@alveolus/core";\nexport class CustomerId extends Identifier<string, "CustomerId"> {}`)
			.file("src/shared-kernel/domain/errors/invalid-amount.error.ts", `import { DomainError } from "@alveolus/core";\nexport class InvalidAmount extends DomainError {}`)
			.file("src/shared-kernel/domain/ports/tracer.port.ts", `import { Port } from "@alveolus/core";\nexport abstract class Tracer extends Port {}`)
			.file("src/shared-kernel/driven/otel/adapters/otel-tracer.adapter.ts", `import { Tracer } from "../../../domain/ports/tracer.port.ts";\nexport class OtelTracer extends Tracer {}`)
			.file("src/shared-kernel/driven/pg/adapters/pg-outbox.adapter.ts", `import { Outbox } from "@alveolus/core";\nexport abstract class PgOutbox extends Outbox {}`);

		expect(codebase.check(new NoFatSharedKernelRule())).toEqual([]);
	});

	it("rejects what belongs to one bounded context", () => {
		const codebase = new TestCodebase()
			.file("src/shared-kernel/domain/value-objects/customer-id.identifier.ts", `import { Identifier } from "@alveolus/core";\nexport class CustomerId extends Identifier<string, "CustomerId"> {}`)
			.file(
				"src/shared-kernel/domain/aggregates/customer.aggregate.ts",
				`import { AggregateRoot } from "@alveolus/core";\nimport type { CustomerId } from "../value-objects/customer-id.identifier.ts";\nexport class Customer extends AggregateRoot<CustomerId> { public toSnapshot() { return { id: this.id.value }; } }`,
			)
			.file(
				"src/shared-kernel/domain/repositories/customers.repository.ts",
				`import { CommandRepository } from "@alveolus/core";\nimport type { Customer } from "../aggregates/customer.aggregate.ts";\nexport abstract class Customers extends CommandRepository<Customer> {}`,
			)
			.file(
				"src/shared-kernel/application/commands/rename.command.ts",
				`import { CommandHandler, ok, type Result } from "@alveolus/core";\nexport class RenameHandler extends CommandHandler<void> { public async handle(): Promise<Result<void, never>> { return ok(undefined); } }`,
			);

		expect(codebase.messages(new NoFatSharedKernelRule())).toEqual([
			"Customer is an AggregateRoot in the shared kernel: it belongs to one bounded context; the shared kernel holds value objects, ports and their adapters.",
			"Customers is a CommandRepository in the shared kernel: it belongs to one bounded context; the shared kernel holds value objects, ports and their adapters.",
			"RenameHandler is a CommandHandler in the shared kernel: it belongs to one bounded context; the shared kernel holds value objects, ports and their adapters.",
		]);
	});
});
