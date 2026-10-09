import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import type { Scaffold } from "./scaffold.ts";
import { scaffolds } from "./scaffold.ts";

export type Outcome = "created" | "appended" | "kept";

export interface Written {
	readonly path: string;
	readonly outcome: Outcome;
}

export class Init {
	public constructor(private readonly projectDir: string) {}

	public run(): Written[] {
		const written: Written[] = [];
		for (const scaffold of scaffolds) {
			written.push({ outcome: this.write(scaffold), path: scaffold.path });
		}
		return written;
	}

	public get hint(): string | undefined {
		const claude = join(this.projectDir, "CLAUDE.md");
		if (!existsSync(claude)) {
			return undefined;
		}
		return "CLAUDE.md exists: Claude Code reads it instead of AGENTS.md, so add a line with @AGENTS.md to it.";
	}

	private write(scaffold: Scaffold): Outcome {
		const path = join(this.projectDir, scaffold.path);
		if (!existsSync(path)) {
			mkdirSync(dirname(path), { recursive: true });
			writeFileSync(path, scaffold.content);
			return "created";
		}
		if (scaffold.marker === undefined) {
			return "kept";
		}
		const existing = readFileSync(path, "utf8");
		if (existing.includes(scaffold.marker)) {
			return "kept";
		}
		writeFileSync(path, `${existing.trimEnd()}\n\n${scaffold.content}`);
		return "appended";
	}
}
