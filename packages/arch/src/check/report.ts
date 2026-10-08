import picocolors from "picocolors";

import type { Violation } from "./violation.ts";

export class Report {
	private readonly colors: ReturnType<typeof picocolors.createColors>;

	public constructor(
		private readonly violations: readonly Violation[],
		private readonly baselined: number,
		colored = false,
	) {
		this.colors = picocolors.createColors(colored);
	}

	public text(): string {
		const blocks = this.violations.map((violation) => this.block(violation));
		return `${[...blocks, this.summary()].join("\n\n")}\n`;
	}

	public json(): string {
		return `${JSON.stringify({ baselined: this.baselined, violations: this.violations }, null, "\t")}\n`;
	}

	private block(violation: Violation): string {
		const { bold, red } = this.colors;
		return `${bold(`${violation.file}:${violation.line}`)}\n  ${red(violation.rule)}: ${violation.message}`;
	}

	private summary(): string {
		const { dim, green, red } = this.colors;
		const count = this.violations.length;
		const baselined = this.baselined > 0 ? dim(` (${this.baselined} in the baseline)`) : "";
		if (count === 0) {
			return `${green("No violation")}${baselined}`;
		}
		return `${red(`${count} violation${count === 1 ? "" : "s"}`)}${baselined}`;
	}
}
