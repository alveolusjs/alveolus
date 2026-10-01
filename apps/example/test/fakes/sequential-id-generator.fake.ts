import type { IdGenerator } from "../../src/shared-kernel/application/ports/id-generator.port.ts";

export class SequentialIdGenerator implements IdGenerator {
	private count = 0;

	public next(): string {
		this.count += 1;
		return `id_${this.count}`;
	}
}
