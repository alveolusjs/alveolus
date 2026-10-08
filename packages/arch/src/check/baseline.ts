import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";

import type { Violation } from "./violation.ts";

type Entry = Pick<Violation, "rule" | "file" | "symbol"> & { readonly fingerprint?: string };

export class Baseline {
	public static readonly fileName = "alveolus.baseline.json";

	private constructor(private readonly entries: readonly Entry[]) {}

	public static of(violations: readonly Violation[]): Baseline {
		return new Baseline(violations.map(({ file, fingerprint, rule, symbol }) => ({ file, fingerprint, rule, symbol })));
	}

	public static async load(path: string): Promise<Baseline> {
		if (!existsSync(path)) {
			return new Baseline([]);
		}
		const content: { violations?: Entry[] } = JSON.parse(await readFile(path, "utf8"));
		return new Baseline(content.violations ?? []);
	}

	public get outdatedEntries(): number {
		return this.entries.filter((entry) => entry.fingerprint === undefined).length;
	}

	public newViolations(violations: readonly Violation[]): Violation[] {
		return this.match(violations).fresh;
	}

	public staleEntries(violations: readonly Violation[]): number {
		return this.match(violations).stale;
	}

	private match(violations: readonly Violation[]): { readonly fresh: Violation[]; readonly stale: number } {
		const remaining = new Map<string, number>();
		for (const entry of this.entries) {
			remaining.set(this.keyOf(entry), (remaining.get(this.keyOf(entry)) ?? 0) + 1);
		}

		const fresh: Violation[] = [];
		for (const violation of violations) {
			const key = this.keyOf(violation);
			const count = remaining.get(key) ?? 0;
			if (count > 0) {
				remaining.set(key, count - 1);
			} else {
				fresh.push(violation);
			}
		}
		let stale = 0;
		for (const count of remaining.values()) {
			stale += count;
		}
		return { fresh, stale };
	}

	public async save(path: string): Promise<void> {
		const violations = [...this.entries].sort((left, right) => this.keyOf(left).localeCompare(this.keyOf(right)));
		await writeFile(path, `${JSON.stringify({ violations }, null, "\t")}\n`);
	}

	private keyOf(entry: Entry): string {
		return [entry.rule, entry.file, entry.symbol, entry.fingerprint ?? ""].join("\n");
	}
}
